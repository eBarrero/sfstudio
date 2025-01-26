import { Request, Response, NextFunction } from "express";
import { SignInInputPort, RequestConnectionInputPort, RequestedConnectionInputPort, SignOutInputPort } from "../../domain/ports/inbound/httpInputPorts";
import { ConnectionDriverDTO, Technology, stringToTechnology } from "../../application/dtos/connectionDriverDTO"; 
import { SessionError, ErrorMessages } from "../../domain/exceptions/sessionError";
import { errorHandler } from "../../../infrastructure/frameworks/errorHandler";
import { REDIRECT_URI } from "../../../config/environment";


export class SignInController {    
    private useCase: SignInInputPort
    constructor( useCase: SignInInputPort) {
        this.useCase = useCase;
        console.log(this.useCase.getStatus());
    }
    getStatus() {
        console.log(this.useCase.getStatus());
    }
    async login(req: Request, res: Response) {
        try {
            let response;
            if (req.cookies.id) {
                const sessionDTO = await this.useCase.getSessionStatus(decode(req.cookies.id));
                response = sessionDTO.serialize();
            } else {
                response = 'newsession';
            }
            res.status(200).json(response);
        } catch (error) {  
            if (error instanceof SessionError && error.message === ErrorMessages.USER_NOT_FOUND) {
                res.clearCookie('id');
                res.status(401).json('newsession');
            } else {
                errorHandler(error as Error, req, res);
            }
            
        }        
    }  

    public setUser(req: Request, res: Response, next:NextFunction) {
        console.log(`${req.url} ${req.ip}`);
        const signInToken = decode(req.cookies.id);
        if (!signInToken) {
            console.log('Authentication failed');
            res.status(500).json('Authentication failed');
            return;
        }
        try {
            req.appSessionId = signInToken;
            next();
        } catch (error) {  
            next(error);
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
            const sessionId = decode(req.cookies.id);
            const connectionId = parseInt(req.params.connectionId);
            const url = this.requestConnectionUseCase.toConfiguredConnection(sessionId, connectionId);
            res.redirect(url);
        } catch (error) {
            errorHandler(error as Error, req, res);
        }
    }        
}

export class RequestedConnectionController {     
    constructor( private requestedUseCase: RequestedConnectionInputPort) {}
    public async salesforce(req: Request, res: Response) {
        try {
            const configDriverDTO = new ConnectionDriverDTO({ dbName: req.params.state, callbackUrl: req.url, code: req.query.code as string, tech: Technology.SalesforceAuth0 })
            const sessionId = await this.requestedUseCase.exe(decode(req.cookies.id), configDriverDTO);
            res.cookie("id", Buffer.from(JSON.stringify({id: sessionId.toString()})).toString('base64'), { httpOnly: true });
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
            const id = decode(req.cookies.id);
            await this.logoutUseCase.exe(id);
            res.status(200).json('Session closed');
        } catch (error) {
            errorHandler(error as Error, req, res);
        }
    }
}










/**
 * @description: decode the token to get the id
 * @param token - the token to decode
 * @returns the id of the session
 */
export function decode(token: string | null): number{
    if (!token) {
        return 0;
    }
    const s: string = Buffer.from(token, "base64").toString("ascii");
    const r: number = JSON.parse(s).id*1;
    console.log(`decode: ${token} ${s} ${r}`); 
    return r ;   
}


