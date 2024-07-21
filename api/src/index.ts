import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import {SessionError, Sessions, Session } from './session'

//res.json(await conexion.conn.query('SELECT Id, Name FROM Account'));

const clientId= "";
const clientSecret= "";

const sessions = new Sessions();

const app = express();
const port = 3000;
app.use(cookieParser());


app.get("/init", (req: Request, res: Response) => {
    console.log(req.url);
    const signInToken = req.cookies.id;
    if (!signInToken) {
        res.redirect("/#newsession" ); 
        return;
    } 

    try {
        const session = sessions.getSession(signInToken);
        res.redirect("/#" + session.sessionStatus ); 
    } catch(error) {       
        if (error instanceof SessionError) {
            res.cookie("id", sessions.signIn() , { httpOnly: true });
            res.redirect("/#reseted" ); 
        } else {
            console.error('Error', (error as Error).message);
            res.status(500).json(Error);
            return
        }
    }


    res.status(200)
    
});


app.get("/init2", (req: Request, res: Response) => {
    console.log(req.url);
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
            return
        }
    }
});




app.get("/auth/:type", (req: Request, res: Response) => {
    console.log(req.url);
    const sandbox = (req.params.type==="sandbox") ? true : false;
    let signInToken = req.cookies.id;
    if (!signInToken) {
        signInToken = sessions.signIn();
        res.cookie("id", signInToken , { httpOnly: true });
    }

    const session = sessions.getSession(signInToken);
    const url = session.requestAuthorization(sandbox, "http://localhost:3000/callback", clientId, clientSecret );
    res.redirect(url);
});

app.get("/callback", async (req: Request, res: Response) => {
    let signInToken = req.cookies.id;
    if (!signInToken) {
        res.status(500).json('Authentication failed');
        return;
    }
    const session = sessions.getSession(signInToken);

    try {
        await session.login( req.query.code as string, "http://localhost:3000/callback");
        res.redirect("http://localhost:5173");
    } catch (error) {
        console.error('Access Token Error', (error as Error).message);
        res.status(500).json('Authentication failed');
    }
});

app.get("/soql/:soql", (req: Request, res: Response) => {
    console.log(req.url);
    let signInToken = req.cookies.id;
    if (!signInToken) {
        res.status(500).json('Authentication failed');
        return;
    }

    try {
        const session = sessions.getSession(signInToken);
        session.doSOQL(req.params.soql as string).then((result: any) => res.json(result)).catch((error: any) => res.status(404).json(error.message));
    } catch (error) {   
        console.error('Error', (error as Error).message);
        res.status(500).json(Error);
    }

});

app.get("/describeglobal/:orgSfName", (req: Request, res: Response) => {
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

app.get("/describe/:orgSfName", (req: Request, res: Response) => {
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

app.get("/describe/:orgSfName/:sobject", (req: Request, res: Response) => {
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



app.get("/listmetadata", (req: Request, res: Response) => {
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

app.get("/getObjectmetadata", (req: Request, res: Response) => {
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
    console.log(`Server is running on http://localhost:${port}`);
});

