import express from "express";
import cookieParser from "cookie-parser";
import type { RuntimeEnvironment } from "./config/environment";
import { createHealthRouter, type ReadinessProbe } from "./infrastructure/frameworks/healthRouter";
import { notFoundHandler, errorHandler } from "./infrastructure/frameworks/errorHandler";
import { correlationMiddleware } from "./infrastructure/frameworks/correlation";
import { logger, StructuredLogger } from "./infrastructure/frameworks/structuredLogger";
import { QueryRequestError } from './sessionManager/domain/entities/queryContract';

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
    app.use(express.json({ limit: '32kb' }));
    app.use((error: Error & { status?: number }, req: express.Request, res: express.Response,
        next: express.NextFunction) => {
        if (error.status === 413 || error instanceof SyntaxError) {
            errorHandler(new QueryRequestError('QUERY_INVALID', error.status === 413 ? 413 : 400), req, res);
        } else next(error);
    });
    app.use(createHealthRouter(options.readinessProbe));
    app.use(options.apiRouter);
    app.use(notFoundHandler);

    return app;
}
