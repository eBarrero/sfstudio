import { Request, Response, NextFunction } from 'express';
import { sessions } from './sessions'
import { SessionError } from './sessionError'


export async function auth(req: Request, res: Response, next:NextFunction) {
    
    console.log(`${req.url} ${req.ip}`);
    const signInToken = decode(req.cookies.id);
    if (!signInToken) {
        if (req.url === '/api/init') {
            console.log('New session');
            res.status(200).json('New session');
        } else {
            console.log('Authentication failed');
            res.status(500).json('Authentication failed');
        }
        return;
    }
    try {
        req.appSession = await sessions.getSession(signInToken);
        next();
    } catch (error) {  
        if (req.url === '/api/init' && error instanceof SessionError) {
            sessions.signIn(signInToken);
            req.appSession = await sessions.getSession(signInToken);
            next();
            return;
        } 
        next(error);
    }
}


export function getConn(req: Request, res: Response, next:NextFunction) {
    if (!req.appSession) {
        res.status(500).json('Authentication failed');
        return;
    }
    try {
        req.appConnection = req.appSession!.getConnection(req.params.orgSfName);
        next();
    } catch (error) {  
        next(error);
    }
}

export function errorHandler(error: Error, req: Request, res: Response) {
    if (error instanceof SessionError) {
        const sessionError = error as SessionError;
        console.error(`SessionError: ${sessionError.getErrorNumber()}-${sessionError.message}`);
        res.status(sessionError.getErrorNumber())
           .json(sessionError.message);
    } else {
        console.error('Error', (error as Error).message);
        res.status(500).json("Error");
    }    
}


export function notFoundHandler(req: Request, res: Response) {
    console.log('404:' + req.url);
    res.status(404).json("Not Found");
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
    return  JSON.parse(Buffer.from(token, "base64").toString("ascii")).id*1;   
}