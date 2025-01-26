import { Request, Response } from 'express';
import { SessionError } from '../../sessionManager/domain/exceptions/sessionError';



export function errorHandler(error: Error, req: Request, res: Response) {
    if (error instanceof SessionError) {
        const sessionError = error as SessionError;
        console.error(`SessionError: ${sessionError.getErrorNumber()}-${sessionError.message}`);
        res.status(sessionError.getErrorNumber())
           .json(sessionError.message);
    } else {
        const msg = (error as Error).message;
        console.error('Error', msg);
        console.error('Stack', (error as Error).stack);
        res.status(500).json(req.url + '>' +  msg);
    }    
}


export function notFoundHandler(req: Request, res: Response) {
    console.log('404:' + req.url);
    res.status(404).json("Not Found");
}