import express, { Request, Response } from "express";
import { sessions } from './../sessions';
import { auth, getConn, errorHandler, decode } from './../middlewares';
import { REDIRECT_URI, CALLBACK_URL } from '../environment'


const router = express.Router();


router.get("/api/init", auth, async (req: Request, res: Response) => {
    try {
        res.json(req.appSession!.getSessionStatus()); 
    } catch(error) {       
        errorHandler(error as Error, req, res);
    }
    
});


router.get("/api/auth/:orgSfName", async (req: Request, res: Response) => {
    try {
        console.log(req.url);
        let signInToken = req.cookies.id;
        if (!signInToken) {
            signInToken = sessions.signIn(null);
            res.cookie("id", signInToken , { httpOnly: true });
        }

        const session = await sessions.getSession(decode(signInToken));
        const url = session.requestAuthorization(req.params.orgSfName);
        console.log(`URL: ${url}`);
        res.redirect(url);
    } catch (error) {
        errorHandler(error as Error, req, res);
    }
});

router.get("/api/callback", auth, async (req: Request, res: Response) => {
    try {
        if (!req.appSession) {
            res.status(500).json('Authentication failed');
            return;
        }
        req.appConnection = req.appSession!.getConnection(req.query.state as string);
        await req.appConnection!.login(req.query.code as string, CALLBACK_URL );
        console.log(`req.cookies.id: ${req.cookies.id}`);
        console.log(`req.appSession!.signInToken: ${req.appSession!.signInToken}`);	
        if (req.appSession!.signInToken !== req.cookies.id) {
            res.cookie("id", req.appSession!.signInToken , { httpOnly: true });
        }
        console.log(req.appSession);
        res.redirect(REDIRECT_URI);
    } catch (error) {
        errorHandler(error as Error, req, res);
    }
});

router.get("/api/logout/:orgSfName", auth, getConn, async (req: Request, res: Response) => {
    try {
        req.appConnection!.close();
    } catch (error) {
        errorHandler(error as Error, req, res);
    }
    res.json('OK');
});

export default router;