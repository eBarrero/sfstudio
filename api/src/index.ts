import express from "express";
import { ENV, PORT } from './environment';
import cookieParser from "cookie-parser";
import { errorHandler, notFoundHandler } from './middlewares';
import loginRouter from './routes/loginRoutes';
import sfRouter from './routes/sfRoutes';
import controller from "./db/controller";


const app = express();
if ((ENV!=="DEV")) app.use(express.static('../app/dist'));
app.use(cookieParser());
app.use(loginRouter);
app.use(sfRouter);
app.use(notFoundHandler);
app.use(errorHandler);
// manage crash application
process.on('uncaughtException', (error) => {
    console.error('uncaughtException:', error);
    controller.close();
    process.exit(1);
});
app.listen(PORT, () => {
    console.log(`Server is running on Port: ${PORT}`);
});

