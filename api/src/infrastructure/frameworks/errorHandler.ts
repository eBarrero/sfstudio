import { Request, Response } from 'express';
import { SessionError } from '../../sessionManager/domain/exceptions/sessionError';
import { OAuthContextError } from '../../sessionManager/domain/entities/salesforceLoginHost';
import { SalesforceOAuthError } from '../../sessionManager/domain/exceptions/salesforceOAuthError';
import { logger } from './structuredLogger';



export function errorHandler(error: Error, req: Request, res: Response) {
    if (error instanceof OAuthContextError) {
        res.status(400).json({ error: {
            code: 'OAUTH_CONTEXT_INVALID',
            message: 'La configuración OAuth no es válida.',
            correlationId: req.correlationId,
        } });
    } else if (error instanceof SalesforceOAuthError) {
        logger.warn('oauth.salesforce_failed', { correlationId: req.correlationId });
        res.status(502).json({ error: {
            code: 'SALESFORCE_AUTH_FAILED',
            message: 'No se pudo completar la autenticación con Salesforce.',
            correlationId: req.correlationId,
        } });
    } else if (error instanceof SessionError) {
        const sessionError = error as SessionError;
        res.status(sessionError.getErrorNumber())
           .json({
               error: {
                   code: "SESSION_INVALID",
                   message: "Workspace session is invalid or expired.",
                   correlationId: req.correlationId,
               },
           });
    } else {
        logger.error("http.unhandled_error", {
            correlationId: req.correlationId,
            errorName: error.name,
            errorMessage: error.message,
        });
        res.status(500).json({
            error: {
                code: "INTERNAL_ERROR",
                message: "An unexpected error occurred.",
                correlationId: req.correlationId,
            },
        });
    }    
}


export function notFoundHandler(req: Request, res: Response) {
    logger.warn("http.not_found", {
        correlationId: req.correlationId,
        method: req.method,
    });
    res.status(404).json({
        error: {
            code: "NOT_FOUND",
            message: "Resource not found.",
            correlationId: req.correlationId,
        },
    });
}
