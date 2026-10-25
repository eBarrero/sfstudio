import { Request, Response, NextFunction } from "express";
import { SignInInputPort, RequestConnectionInputPort, RequestedConnectionInputPort, SignOutInputPort } from "../../domain/ports/inbound/httpInputPorts";
import { ConnectionDriverDTO, stringToTechnology } from "../../application/dtos/connectionDriverDTO";
import { SessionError } from "../../domain/exceptions/sessionError";
import {
    OAuthStateError,
    OAuthStateStore,
} from "../../domain/entities/oauthStateStore";
import { createSessionId } from "../../domain/entities/workspaceSession";
import { errorHandler } from "../../../infrastructure/frameworks/errorHandler";
import { ENV, REDIRECT_URI, RuntimeEnvironment } from "../../../config/environment";
import { logger, StructuredLogger } from "../../../infrastructure/frameworks/structuredLogger";
import {
    clearOAuthFlowCookie,
    clearSessionCookie,
    hasSessionCookie,
    readOAuthFlowCookie,
    readSessionCookie,
    setOAuthFlowCookie,
    setSessionCookie,
} from "./sessionCookie";


export class SignInController {    
    private useCase: SignInInputPort
    constructor(
        useCase: SignInInputPort,
        private readonly environment: RuntimeEnvironment = ENV,
    ) {
        this.useCase = useCase;
    }
    async login(req: Request, res: Response) {
        try {
            const sessionId = readSessionCookie(req);

            if (!sessionId) {
                if (hasSessionCookie(req)) {
                    clearSessionCookie(res, this.environment);
                    sendUnauthorized(res, req.correlationId);
                    return;
                }

                res.status(200).json("newsession");
                return;
            }

            const sessionDTO = await this.useCase.getSessionStatus(sessionId);
            res.status(200).json(sessionDTO.serialize());
        } catch (error) {  
            if (error instanceof SessionError) {
                clearSessionCookie(res, this.environment);
                sendUnauthorized(res, req.correlationId);
            } else {
                errorHandler(error as Error, req, res);
            }
            
        }        
    }  

    public async setUser(req: Request, res: Response, next: NextFunction) {
        const sessionId = readSessionCookie(req);

        if (!sessionId) {
            clearSessionCookie(res, this.environment);
            sendUnauthorized(res, req.correlationId);
            return;
        }

        try {
            await this.useCase.getSessionStatus(sessionId);
            req.appSessionId = sessionId;
            next();
        } catch {
            clearSessionCookie(res, this.environment);
            sendUnauthorized(res, req.correlationId);
        }
    } 
    
    public async getSessionStatus(req: Request, res: Response) {
        try {
            const sessionDTO = await this.useCase.getSessionStatus(req.appSessionId!);
            const response = sessionDTO.serialize();
            res.status(200).json(response);
        } catch (error) {
            errorHandler(error as Error, req, res);
        }
    }

}

export class RequestConnectionController {     
    constructor(
        private readonly requestConnectionUseCase: RequestConnectionInputPort,
        private readonly signInUseCase: SignInInputPort,
        private readonly oauthStateStore: OAuthStateStore,
        private readonly environment: RuntimeEnvironment = ENV,
        private readonly requestLogger: StructuredLogger = logger,
    ) {}

    async getNewUrlConnection(req: Request, res: Response) {
        try {
            if (!req.params || !req.params.tech ) {
                throw new Error('Tech is required');
            }
            const tech = req.params.tech;
            const sessionId = readSessionCookie(req);

            if (sessionId) {
                await this.signInUseCase.getSessionStatus(sessionId);
            } else if (hasSessionCookie(req)) {
                sendUnauthorized(res, req.correlationId);
                return;
            }

            const workspaceBinding = sessionId ?? readOAuthFlowCookie(req) ?? createSessionId();
            if (!sessionId && !readOAuthFlowCookie(req)) {
                setOAuthFlowCookie(res, workspaceBinding, this.environment);
            }

            const state = this.oauthStateStore.issue(
                workspaceBinding,
                { type: "new", technology: tech },
                req.correlationId!,
            );
            let url: string;

            try {
                url = this.requestConnectionUseCase.toNewConnection(
                    new ConnectionDriverDTO({tech: stringToTechnology(tech)}),
                    state,
                );
            } catch (error) {
                this.oauthStateStore.discard(state);
                throw error;
            }

            this.requestLogger.info("oauth.authorization_started", {
                correlationId: req.correlationId,
                destinationType: "new",
                technology: tech,
            });
            res.redirect(url);
        } catch (error) {
            errorHandler(error as Error, req, res);
        }
    }    
    getUrlConnection(req: Request, res: Response) {
        try {
            const sessionId = req.appSessionId!;
            const connectionId = parseInt(req.params.connectionId);
            const technology = this.requestConnectionUseCase.getConfiguredTechnology(sessionId, connectionId);
            const state = this.oauthStateStore.issue(
                sessionId,
                { type: "configured", connectionId, technology },
                req.correlationId!,
            );
            let url: string;

            try {
                url = this.requestConnectionUseCase.toConfiguredConnection(sessionId, connectionId, state);
            } catch (error) {
                this.oauthStateStore.discard(state);
                throw error;
            }

            this.requestLogger.info("oauth.authorization_started", {
                correlationId: req.correlationId,
                destinationType: "configured",
                technology,
            });
            res.redirect(url);
        } catch (error) {
            errorHandler(error as Error, req, res);
        }
    }        
}

export class RequestedConnectionController {     
    constructor(
        private readonly requestedUseCase: RequestedConnectionInputPort,
        private readonly oauthStateStore: OAuthStateStore,
        private readonly environment: RuntimeEnvironment = ENV,
        private readonly requestLogger: StructuredLogger = logger,
    ) {}
    public async salesforce(req: Request, res: Response) {
        const state = readQueryParameter(req.query.state);
        const code = readQueryParameter(req.query.code);

        if (!state || !code) {
            this.requestLogger.warn("oauth.callback_rejected", {
                correlationId: req.correlationId,
                reason: "MISSING_PARAMETERS",
            });
            sendOAuthError(res, 400, "OAUTH_CALLBACK_INVALID", req.correlationId);
            return;
        }

        const workspaceSessionId = readSessionCookie(req);
        const workspaceBinding = workspaceSessionId ?? readOAuthFlowCookie(req);
        if (!workspaceBinding) {
            this.requestLogger.warn("oauth.callback_rejected", {
                correlationId: req.correlationId,
                reason: "MISSING_WORKSPACE_BINDING",
            });
            sendOAuthError(res, 401, "OAUTH_STATE_MISMATCH", req.correlationId);
            return;
        }

        try {
            const consumedState = this.oauthStateStore.consume(state, workspaceBinding);
            const technology = stringToTechnology(consumedState.destination.technology);
            this.requestLogger.info("oauth.callback_validated", {
                correlationId: consumedState.correlationId,
                callbackCorrelationId: req.correlationId,
                destinationType: consumedState.destination.type,
                technology,
            });

            const configDriverDTO = new ConnectionDriverDTO({ code, tech: technology });
            const sessionId = await this.requestedUseCase.exe(workspaceSessionId, configDriverDTO);
            setSessionCookie(res, sessionId, this.environment);
            clearOAuthFlowCookie(res, this.environment);
            res.redirect(REDIRECT_URI);
        } catch (error) {
            clearOAuthFlowCookie(res, this.environment);
            if (error instanceof OAuthStateError) {
                this.requestLogger.warn("oauth.callback_rejected", {
                    correlationId: req.correlationId,
                    reason: error.reason,
                });
                const status = error.reason === "WORKSPACE_MISMATCH" ? 401 : 400;
                const code = error.reason === "WORKSPACE_MISMATCH"
                    ? "OAUTH_STATE_MISMATCH"
                    : "OAUTH_STATE_INVALID";
                sendOAuthError(res, status, code, req.correlationId);
            } else {
                errorHandler(error as Error, req, res);
            }
        }

    }

    //TODO: implement the callback for the other technologies
}


export class SignOutController {
    constructor( private logoutUseCase: SignOutInputPort) {}
    async do(req: Request, res: Response) {
        try {
            const id = readSessionCookie(req);
            if (!id) {
                sendUnauthorized(res, req.correlationId);
                return;
            }
            await this.logoutUseCase.exe(id);
            clearSessionCookie(res, ENV);
            res.status(200).json('Session closed');
        } catch (error) {
            errorHandler(error as Error, req, res);
        }
    }
}










function sendUnauthorized(response: Response, correlationId: string | undefined): void {
    response.status(401).json({
        error: {
            code: "SESSION_INVALID",
            message: "Workspace session is invalid or expired.",
            correlationId,
        },
    });
}

function sendOAuthError(
    response: Response,
    status: 400 | 401,
    code: "OAUTH_CALLBACK_INVALID" | "OAUTH_STATE_INVALID" | "OAUTH_STATE_MISMATCH",
    correlationId: string | undefined,
): void {
    response.status(status).json({
        error: {
            code,
            message: "OAuth authorization could not be validated.",
            correlationId,
        },
    });
}

function readQueryParameter(value: unknown): string | undefined {
    return typeof value === "string" && value.length > 0 ? value : undefined;
}


