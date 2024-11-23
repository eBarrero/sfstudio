import express, { Request, Response } from "express";
import { auth, getConn, errorHandler} from "../middlewares";

const router = express.Router();

router.get("/api/soql/:orgSfName/:soql", auth, getConn, async (req: Request, res: Response) => { 
    try {
        res.json(await req.appConnection!.doSOQL(fromBase64UrlSafe(req.params.soql as string))); 
    } catch (error) {
        errorHandler(error as Error, req, res);
    }
});

router.get("/api/describeglobal/:orgSfName", auth, getConn, async (req: Request, res: Response) => {
    try {
        res.json(await req.appConnection!.describeGlobal());
    } catch (error) {
        errorHandler(error as Error, req, res);
    }
});

router.get("/api/describe/:orgSfName", auth, getConn, async (req: Request, res: Response) => {
    try {
        res.json(await req.appConnection!.describe());
    } catch (error) {
        errorHandler(error as Error, req, res);
    }
});

router.get("/api/describe/:orgSfName/:sobject", auth, getConn, async (req: Request, res: Response) => {
    try {
        res.json(await req.appConnection!.describeSObject(req.params.sobject));
    } catch (error) {
        errorHandler(error as Error, req, res);
    }
});

router.get("/api/listmetadata/:type", auth, getConn, async (req: Request, res: Response) => {
    try {
        res.json(await req.appConnection!.getListmetadata(req.params.type));
    } catch (error) {
        errorHandler(error as Error, req, res);
    }
});

router.get("/api/getObjectmetadata/:orgSfName/:type/:sobject", auth, getConn, async (req: Request, res: Response) => {
    try {
        res.json(await req.appConnection!.getObjectmetadata(req.params.type,req.params.sobject));
    } catch (error) {
        errorHandler(error as Error, req, res);
    }
});

export default router;


/**
 * @description Convert Base64 URL Safe to standard Base64
 * @param base64UrlSafe String Base64 URL Safe
 * @returns string Base64
 */
function fromBase64UrlSafe(base64UrlSafe: string): string {
    let base64 = base64UrlSafe
        .replace(/-/g, '+') // Replace - con +
        .replace(/_/g, '/'); // Rreplace _ con /
    
    // add padding with '='
    const padding = base64.length % 4;
    if (padding > 0) {
        base64 += '='.repeat(4 - padding);
    }
    const buffer = Buffer.from(base64, 'base64');

    return  buffer.toString('ascii');
}