import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { router } from "./routes/index.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { requestLogMiddleware } from "./middleware/request-log.middleware.js";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(
    cors({
      origin: (requestOrigin, callback) => {
        if (!requestOrigin || env.frontendUrls.includes(requestOrigin)) {
          callback(null, true);
          return;
        }

        callback(null, false);
      },
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(requestLogMiddleware);
  app.get("/health", (_request, response) =>
    response.json({
      success: true,
      data: { service: "phillyogo-backend", status: "ok" },
    }),
  );
  app.use(env.apiPrefix, router);
  app.use(errorMiddleware);
  return app;
}
