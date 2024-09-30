import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import {SessionError, Sessions, Session } from './session'


//res.json(await conexion.conn.query('SELECT Id, Name FROM Account'));



const clientId= process.env.CLIENT_ID || '';
const clientSecret= process.env.CLIENT_SECRET || '';
const ENV= process.env.ENV || 'NODEV';
const redirectUri= (ENV==="DEV")? "http://Localhost:5173": process.env.REDIRECT_URI!;
const callbackUrl= ((ENV==="DEV")? "http://Localhost:3000": redirectUri) + "/api/callback";


const sessions = new Sessions();

const app = express();
const port = process.env.PORT || 3000;
app.use(cookieParser());
if ((ENV!=="DEV")) app.use(express.static('../app/dist'));



app.get("/api/init", (req: Request, res: Response) => {
    console.log(`${req.url} ${req.ip}  ${req.headers['cf-connecting-ip']} ${req.headers['cf-ipcountry']}`);
    
    const signInToken = req.cookies.id;
    if (!signInToken) {
        res.json("newsession" ); 
        return;
    } 

    try {
        const session = sessions.getSession(signInToken);
        res.json(session.sessionStatus); 
    } catch(error) {       
        if (error instanceof SessionError) {
            res.cookie("id", sessions.signIn() , { httpOnly: true });
            res.json("reseted"); 
        } else {
            console.error('Error', (error as Error).message);
            res.json(500).json("Error");
            return;
        }
    }
});




app.get("/api/auth/:type", (req: Request, res: Response) => {
    console.log(req.url);
    const sandbox = (req.params.type==="test") ? true : false;
    let signInToken = req.cookies.id;
    if (!signInToken) {
        signInToken = sessions.signIn();
        res.cookie("id", signInToken , { httpOnly: true });
    }

    const session = sessions.getSession(signInToken);
    const url = session.requestAuthorization(sandbox, callbackUrl, clientId, clientSecret );
    res.redirect(url);
});

app.get("/api/callback", async (req: Request, res: Response) => {
    let signInToken = req.cookies.id;
    if (!signInToken) {
        res.status(500).json('Authentication failed');
        return;
    }
    const session = sessions.getSession(signInToken);

    try {
        await session.login( req.query.code as string, callbackUrl);
        console.log(session.getUserName());
        res.redirect(redirectUri);
    } catch (error) {
        console.error('Access Token Error', (error as Error).message);
        res.status(500).json('Authentication failed');
    }
});

app.get("/api/soql/:orgSfName/:soql", (req: Request, res: Response) => {
    console.log(req.url);
    let signInToken = req.cookies.id;
    if (!signInToken) {
        res.status(500).json('Authentication failed');
        return;
    }

    try {
        const session = sessions.getSession(signInToken);
        session.doSOQL(req.params.orgSfName, req.params.soql as string).then((result: any) => res.json(result)).catch((error: any) => res.status(404).json(error.message));
    } catch (error) {   
        const sessionError = error as SessionError;
        console.error('Error', sessionError.message);
        res.status(sessionError.getErrorNumber()).json(sessionError.message);
    }

});

app.get("/api/describeglobal/:orgSfName", (req: Request, res: Response) => {
    console.log(req.url +  ' = ' + req.params.orgSfName);
    let signInToken = req.cookies.id;
    if (!signInToken) {
        res.status(500).json('Authentication failed');
        return;
    }

    try {
        const session = sessions.getSession(signInToken);
        session.describeGlobal(req.params.orgSfName)
            .then((result: any) => res.json(result))
            .catch((error: any) => res.status(404).json(error.message));
    } catch (error) {   
        console.error('Error', (error as Error).message);
        res.status(500).json(Error);
    }

});

app.get("/api/describe/:orgSfName", (req: Request, res: Response) => {
    console.log(req.url);
    let signInToken = req.cookies.id;
    if (!signInToken) {
        res.status(500).json('Authentication failed');
        return;
    }

    try {
        const session = sessions.getSession(signInToken);
        session.describe(req.params.orgSfName).then((result: any) => res.json(result)).catch((error: any) => res.status(404).json(error.message));
    } catch (error) {   
        console.error('Error', (error as Error).message);
        res.status(500).json(Error);
    }

});

app.get("/api/describe/:orgSfName/:sobject", (req: Request, res: Response) => {
    console.log(req.url);
    let signInToken = req.cookies.id;
    if (!signInToken) {
        res.status(500).json('Authentication failed');
        return;
    }

    try {
        const session = sessions.getSession(signInToken);
        session.describeSObject(req.params.orgSfName,req.params.sobject).then((result: any) => res.json(result)).catch((error: any) => res.status(404).json(error.message));
    } catch (error) {   

        if (error instanceof SessionError) {
            const sessionError = error as SessionError;
            res.status(sessionError.getErrorNumber()).json(sessionError.message);
        }
        res.status(500).json(Error);
    }

});



app.get("/api/listmetadata", (req: Request, res: Response) => {
    console.log(req.url);
    let signInToken = req.cookies.id;
    if (!signInToken) {
        res.status(500).json('Authentication failed');
        return;
    }

    try {
        const session = sessions.getSession(signInToken);
        session.getListmetadata().then((result: any) => res.json(result)).catch((error: any) => res.status(404).json(error.message));
    } catch (error) {   
        console.error('Error', (error as Error).message);
        res.status(500).json(Error);
    }

});

app.get("/api/getObjectmetadata", (req: Request, res: Response) => {
    console.log(req.url);
    let signInToken = req.cookies.id;
    if (!signInToken) {
        res.status(500).json('Authentication failed');
        return;
    }

    try {
        const session = sessions.getSession(signInToken);
        session.getObjectmetadata().then((result: any) => res.json(result)).catch((error: any) => res.status(404).json(error.message));
    } catch (error) {   
        console.error('Error', (error as Error).message);
        res.status(500).json(Error);
    }

});



app.listen(port, () => {
    console.log(`Server is running on Port: ${port}`);
});

