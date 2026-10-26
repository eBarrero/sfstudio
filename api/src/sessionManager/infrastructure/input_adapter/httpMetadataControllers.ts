import { Request, Response } from "express";
import { HttpMetadataInputPort } from "./../../domain/ports/inbound/httpMetadataPorts";
import { errorHandler } from "../../../infrastructure/frameworks/errorHandler";
import { QueryRequestError } from '../../domain/entities/queryContract';


export class HttpMetadataControllers {
    private readonly requests = new Map<string, { count: number; windowStart: number }>();
    constructor(private metadataRequestUseClase: HttpMetadataInputPort,
        private readonly timeoutMs = 15_000, private readonly maxRequestsPerMinute = 60) {}

    async getDescribeGlobal(req: Request, res: Response) {
        try {
            const metadata = await this.metadataRequestUseClase.getDescribeGlobal(req.appSessionId!, req.params.orgKey);
            res.send(metadata);
        } catch (error) {
            errorHandler(error as Error, req, res);
        }
    }

    async getObjectDescription(req: Request, res: Response) {
        try {
            const metadata = await this.metadataRequestUseClase.describeSObject(req.appSessionId!, req.params.orgKey, req.params.sobject);
            res.send(metadata);
        } catch (error) {
            errorHandler(error as Error, req, res);
        }
    }

    public async postQuery(req: Request, res: Response) {
        try {
            if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))
                throw new QueryRequestError('QUERY_INVALID', 400);
            const bucketKey = req.appSessionId!;
            const now = Date.now();
            const previous = this.requests.get(bucketKey);
            const bucket = !previous || now - previous.windowStart >= 60_000
                ? { count: 0, windowStart: now } : previous;
            if (++bucket.count > this.maxRequestsPerMinute) throw new QueryRequestError('QUERY_RATE_LIMITED', 429);
            this.requests.set(bucketKey, bucket);
            const { orgKey, query, limit } = req.body as Record<string, unknown>;
            let timer: ReturnType<typeof setTimeout> | undefined;
            try {
                const rows = await Promise.race([
                    this.metadataRequestUseClase.runQuery(req.appSessionId!, orgKey, query, limit),
                    new Promise<never>((_resolve, reject) => {
                        timer = setTimeout(() => reject(new QueryRequestError('QUERY_TIMEOUT', 504)), this.timeoutMs);
                    }),
                ]);
                res.json(rows);
            } finally { if (timer) clearTimeout(timer); }
        } catch (error) {
            errorHandler(error as Error, req, res);
        }
    }
}
