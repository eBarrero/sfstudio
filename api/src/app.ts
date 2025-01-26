import express from "express";
import cookieParser from "cookie-parser";
import router  from "./sessionManager/infrastructure/input_adapter/router";
import { notFoundHandler } from "./infrastructure/frameworks/errorHandler";

import { ENV } from './config/environment';


const logger = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.log(`${req.method} ${req.url} ${req.ip}`);
    next();
}



export function createApp() {


    const app = express();
    if ((ENV!=="DEV")) { 
        app.use(express.static('../app/dist'));
    } else {
        app.use(logger);
    }
    app.use(cookieParser());
    app.use(express.json());

    app.use(router);
    app.use(notFoundHandler);

    
    return app;

  

}





