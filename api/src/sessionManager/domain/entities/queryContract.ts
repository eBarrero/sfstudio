export interface QueryPage {
    done: boolean;
    totalSize: number;
    records: Record<string, unknown>[];
    nextRecordsUrl?: string;
}

export interface PublicQueryPage {
    done: boolean;
    totalSize: number;
    records: Record<string, unknown>[];
    limit: number;
}

export class QueryRequestError extends Error {
    constructor(public readonly code: string, public readonly status: number) {
        super(code);
    }
}
