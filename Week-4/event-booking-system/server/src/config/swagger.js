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
      description: "Event Booking System backend",
    },
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
