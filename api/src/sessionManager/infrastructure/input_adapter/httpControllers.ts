import { Request, Response, NextFunction } from "express";
import { SignInInputPort, RequestConnectionInputPort, RequestedConnectionInputPort, SignOutInputPort } from "../../domain/ports/inbound/httpInputPorts";
import { ConnectionDriverDTO, Technology, stringToTechnology } from "../../application/dtos/connectionDriverDTO"; 
import { SessionError } from "../../domain/exceptions/sessionError";
import { errorHandler } from "../../../infrastructure/frameworks/errorHandler";
import { ENV, REDIRECT_URI, RuntimeEnvironment } from "../../../config/environment";
import {
    clearSessionCookie,
    hasSessionCookie,
    readSessionCookie,
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
                    sendUnauthorized(res);
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
                sendUnauthorized(res);
            } else {
                errorHandler(error as Error, req, res);
            }
            
        }        
    }  

    public async setUser(req: Request, res: Response, next: NextFunction) {
        const sessionId = readSessionCookie(req);

        if (!sessionId) {
            clearSessionCookie(res, this.environment);
            sendUnauthorized(res);
            return;
        }

        try {
            await this.useCase.getSessionStatus(sessionId);
            req.appSessionId = sessionId;
            next();
        } catch {
            clearSessionCookie(res, this.environment);
            sendUnauthorized(res);
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
    constructor( private requestConnectionUseCase: RequestConnectionInputPort) {}
    getNewUrlConnection(req: Request, res: Response) {
        try {
            if (!req.params || !req.params.tech ) {
                throw new Error('Tech is required');
            }
            const tech = req.params.tech;
            const url = this.requestConnectionUseCase.toNewConnection(new ConnectionDriverDTO({tech: stringToTechnology(tech)}));
            res.redirect(url);
        } catch (error) {
            errorHandler(error as Error, req, res);
        }
    }    
    getUrlConnection(req: Request, res: Response) {
        try {
            const sessionId = req.appSessionId!;
            const connectionId = parseInt(req.params.connectionId);
            const url = this.requestConnectionUseCase.toConfiguredConnection(sessionId, connectionId);
            res.redirect(url);
        } catch (error) {
            errorHandler(error as Error, req, res);
        }
    }        
}

export class RequestedConnectionController {     
    constructor(
        private requestedUseCase: RequestedConnectionInputPort,
        private readonly environment: RuntimeEnvironment = ENV,
    ) {}
    public async salesforce(req: Request, res: Response) {
        try {
            const configDriverDTO = new ConnectionDriverDTO({ dbName: req.params.state, callbackUrl: req.url, code: req.query.code as string, tech: Technology.SalesforceAuth0 })
            const sessionId = await this.requestedUseCase.exe(readSessionCookie(req), configDriverDTO);
            setSessionCookie(res, sessionId, this.environment);
            res.redirect(REDIRECT_URI);
        } catch (error) {
            errorHandler(error as Error, req, res);
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
                sendUnauthorized(res);
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










function sendUnauthorized(response: Response): void {
    response.status(401).json({
        error: {
            code: "SESSION_INVALID",
            message: "Workspace session is invalid or expired.",
        },
    });
}


