import { randomUUID } from "node:crypto";
import { NextFunction, Request, Response } from "express";
import { logger, StructuredLogger } from "./structuredLogger";

export const CORRELATION_HEADER = "X-Correlation-Id";

export function correlationMiddleware(
    requestLogger: StructuredLogger = logger,
) {
    return (request: Request, response: Response, next: NextFunction): void => {
        const correlationId = randomUUID();
        request.correlationId = correlationId;
        response.setHeader(CORRELATION_HEADER, correlationId);
        requestLogger.info("http.request", {
            correlationId,
            method: request.method,
        });
        next();
    };
}
