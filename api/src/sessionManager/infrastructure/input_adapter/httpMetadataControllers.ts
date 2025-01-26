import { Request, Response } from "express";
import { HttpMetadataInputPort } from "./../../domain/ports/inbound/httpMetadataPorts";


export class HttpMetadataControllers {
    constructor(private metadataRequestUseClase: HttpMetadataInputPort) {}

    async getDescribeGlobal(req: Request, res: Response) {
        console.log(`getDescribeGlobal ${req.appSessionId!} ${req.params.dbName}`);
        const metadata = await this.metadataRequestUseClase.getDescribeGlobal(req.appSessionId!, req.params.dbName);
        res.send(metadata);
    }

    async getObjectDescription(req: Request, res: Response) {
        console.log(`getDescription ${req.appSessionId!} ${req.params.dbName} ${req.params.sobject}`);
        const metadata = await this.metadataRequestUseClase.describeSObject(req.appSessionId!, req.params.dbName, req.params.sobject);
        res.send(metadata);
    }

    public async getSOQL(req: Request, res: Response) {
        const rows = await this.metadataRequestUseClase.doSOQL(req.appSessionId!, req.params.dbName,fromBase64UrlSafe(req.params.soql as string));
        res.send(rows);
    }
}



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