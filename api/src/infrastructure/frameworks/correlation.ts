import { randomUUID } from "node:crypto";
import { NextFunction, Request, Response } from "express";
import { logger, StructuredLogger } from "./structuredLogger";
import { safeRequestPath } from './safeRequestPath';

export const CORRELATION_HEADER = "X-Correlation-Id";

export function correlationMiddleware(
    requestLogger: StructuredLogger = logger,
) {
    return (request: Request, response: Response, next: NextFunction): void => {
        const incoming = request.get(CORRELATION_HEADER);
        const correlationId = incoming && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(incoming)
            ? incoming : randomUUID();
        request.correlationId = correlationId;
        response.setHeader(CORRELATION_HEADER, correlationId);
        response.once('finish', () => {
            const template = typeof request.route?.path === 'string' ? request.route.path : undefined;
            requestLogger.info('http.request', {
                correlationId,
                method: request.method,
                requestedPath: safeRequestPath(request.path, template),
            });
        });
        next();
    };
}
