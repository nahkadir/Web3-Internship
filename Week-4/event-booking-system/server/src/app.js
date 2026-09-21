import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";

const app = express();

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(helmet());
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());
if (env.nodeEnv === "development") app.use(morgan("dev"));

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
