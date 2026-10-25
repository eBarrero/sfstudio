import express from "express";
import cookieParser from "cookie-parser";
import type { RuntimeEnvironment } from "./config/environment";
import { createHealthRouter, type ReadinessProbe } from "./infrastructure/frameworks/healthRouter";
import { notFoundHandler } from "./infrastructure/frameworks/errorHandler";

export interface AppOptions {
    apiRouter: express.Router;
    readinessProbe: ReadinessProbe;
    environment: RuntimeEnvironment;
}

const logger = (request: express.Request, _response: express.Response, next: express.NextFunction) => {
    console.log(`${request.method} ${request.path} ${request.ip}`);
    next();
};

export function createApp(options: AppOptions): express.Express {
    const app = express();

    if (options.environment === "PROD") {
        app.use(express.static("../app/dist"));
    } else {
        app.use(logger);
    }

    app.use(cookieParser());
    app.use(express.json());
    app.use(createHealthRouter(options.readinessProbe));
    app.use(options.apiRouter);
    app.use(notFoundHandler);

    return app;
}
