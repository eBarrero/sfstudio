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
        res.redirect(url);
    } catch (error) {
        errorHandler(error as Error, req, res);
    }
});

router.get("/api/callback", auth, getConn, async (req: Request, res: Response) => {
    try {
        await req.appConnection!.login(req.query.code as string, CALLBACK_URL );
        console.log(`req.cookies.id: ${req.cookies.id}`);
        console.log(`req.appSession!.signInToken: ${req.appSession!.signInToken}`);	
        if (req.appSession!.signInToken !== req.cookies.id) {
            res.cookie("id", req.appSession!.signInToken , { httpOnly: true });
        }
        res.redirect(REDIRECT_URI);
    } catch (error) {
        errorHandler(error as Error, req, res);
    }
});

router.get("/api/logout", auth, getConn, async (req: Request, res: Response) => {
    try {
        req.appConnection!.close();
    } catch (error) {
        errorHandler(error as Error, req, res);
    }
});

export default router;