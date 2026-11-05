import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { router } from "./routes/index.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { requestLogMiddleware } from "./middleware/request-log.middleware.js";
import { pool } from "./config/database.js";

export function createApp() {
  const app = express();
  const corsOptions = {
    origin: (requestOrigin, callback) => {
      if (!requestOrigin || env.frontendUrls.includes(requestOrigin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
    optionsSuccessStatus: 204,
  };

  app.use(helmet());
  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));
  app.use(express.json());
  app.use(cookieParser());
  app.use(requestLogMiddleware);
  app.get("/health", (_request, response) =>
    response.json({
      success: true,
      data: { service: "phillyogo-backend", status: "ok" },
    }),
  );
  app.get("/health/live", (_request, response) =>
    response.json({
      success: true,
      data: { service: "phillyogo-backend", status: "alive" },
    }),
  );
  app.get("/health/ready", async (_request, response, next) => {
    try {
      await pool.execute("SELECT 1");
      response.json({
        success: true,
        data: { service: "phillyogo-backend", status: "ready" },
      });
    } catch (error) {
      next(error);
    }
  });
  app.use(env.apiPrefix, router);
  app.use(errorMiddleware);
  return app;
}
