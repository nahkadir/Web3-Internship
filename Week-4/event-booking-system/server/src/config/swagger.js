import swaggerJsdoc from "swagger-jsdoc";

// reusable error responses
const errorResponse = (description) => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ErrorResponse" },
    },
  },
});

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Event Booking API",
      version: "1.0.0",
      description: `
Event Booking System backend (Day 1: auth, events, RBAC).

**Authentication**: register or log in, then click **Authorize** and paste the token (without "Bearer").

**Roles**
- USER: view events and event details
- ADMIN: create, update and delete/cancel events

**Response format**
- Success: \`{ success: true, message, data }\`
- Error: \`{ success: false, message, errors? }\`

**Delete rule**: an event with booked seats cannot be deleted (409). Cancel it by setting its status to CANCELLED.
`,
    },
    tags: [
      { name: "Health", description: "Service status" },
      { name: "Auth", description: "Registration, login and profile" },
      {
        name: "Events",
        description: "Event management (write operations are ADMIN only)",
      },
      {
        name: "Bookings",
        description:
          "Seat reservations for events, scoped to the authenticated user",
      },
    ],
    servers: [{ url: "/api" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: {
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Success" },
            data: { type: "object", nullable: true },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Validation failed" },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string" },
                  message: { type: "string" },
                },
              },
            },
          },
        },
      },
      responses: {
        ValidationError: errorResponse("Validation failed"),
        Unauthorized: errorResponse("Missing, invalid or expired token"),
        Forbidden: errorResponse("Insufficient role"),
        NotFound: errorResponse("Resource not found"),
        Conflict: errorResponse("Conflict with current state"),
      },
    },
  },
  apis: ["./src/routes/*.js"],
});
