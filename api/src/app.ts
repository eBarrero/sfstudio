import express from "express";
import cookieParser from "cookie-parser";
import type { RuntimeEnvironment } from "./config/environment";
import { createHealthRouter, type ReadinessProbe } from "./infrastructure/frameworks/healthRouter";
import { notFoundHandler } from "./infrastructure/frameworks/errorHandler";
import { correlationMiddleware } from "./infrastructure/frameworks/correlation";
import { logger, StructuredLogger } from "./infrastructure/frameworks/structuredLogger";

export interface AppOptions {
    apiRouter: express.Router;
    readinessProbe: ReadinessProbe;
    environment: RuntimeEnvironment;
    requestLogger?: StructuredLogger;
}

export function createApp(options: AppOptions): express.Express {
    const app = express();
    app.use(correlationMiddleware(options.requestLogger ?? logger));

    if (options.environment === "PROD") {
        app.use(express.static("../app/dist"));
    }

    app.use(cookieParser());
    app.use(express.json());
    app.use(createHealthRouter(options.readinessProbe));
    app.use(options.apiRouter);
    app.use(notFoundHandler);

    return app;
}
