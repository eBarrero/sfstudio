import { Request, Response } from 'express';
import { SessionError } from '../../sessionManager/domain/exceptions/sessionError';
import { OAuthContextError } from '../../sessionManager/domain/entities/salesforceLoginHost';
import { SalesforceOAuthError } from '../../sessionManager/domain/exceptions/salesforceOAuthError';
import { ReauthRequiredError } from '../../sessionManager/domain/exceptions/reauthRequiredError';
import { logger } from './structuredLogger';
import { QueryRequestError } from '../../sessionManager/domain/entities/queryContract';



export function errorHandler(error: Error, req: Request, res: Response) {
    if (error instanceof QueryRequestError) {
        const messages: Record<string, string> = {
            QUERY_INVALID: 'La consulta no es válida.',
            QUERY_NOT_READ_ONLY: 'Solo se permiten consultas SELECT.',
            QUERY_LIMIT_INVALID: 'El límite de consulta no es válido.',
            QUERY_RATE_LIMITED: 'Demasiadas consultas. Inténtalo más tarde.',
            QUERY_TIMEOUT: 'La consulta agotó el tiempo disponible.',
            QUERY_FAILED: 'Salesforce no pudo completar la consulta.',
            ORG_KEY_INVALID: 'La organización indicada no es válida.',
            ORG_NOT_FOUND: 'La organización no pertenece al workspace.',
        };
        res.status(error.status).json({ error: { code: error.code,
            message: messages[error.code] ?? 'La consulta no se pudo completar.', correlationId: req.correlationId } });
    } else if (error instanceof OAuthContextError) {
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
    } else if (error instanceof ReauthRequiredError) {
        res.status(401).json({ error: {
            code: 'REAUTH_REQUIRED',
            message: 'Vuelve a autenticar la organización.',
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
