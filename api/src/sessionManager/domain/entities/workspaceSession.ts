import { randomUUID } from "node:crypto";

export type SessionId = string;

export const WORKSPACE_SESSION_TTL_MS = 8 * 60 * 60 * 1000;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createSessionId(): SessionId {
    return randomUUID();
}

export function isSessionId(value: unknown): value is SessionId {
    return typeof value === "string" && UUID_PATTERN.test(value);
}

interface WorkspaceSessionOptions {
    id?: SessionId;
    expiresAt?: Date;
    now?: () => Date;
    generateId?: () => SessionId;
    ttlMs?: number;
}

export class WorkspaceSession {
    private id: SessionId;
    private expiresAt: Date;
    private readonly now: () => Date;
    private readonly generateId: () => SessionId;
    private readonly ttlMs: number;

    constructor(options: WorkspaceSessionOptions = {}) {
        this.now = options.now ?? (() => new Date());
        this.generateId = options.generateId ?? createSessionId;
        this.ttlMs = options.ttlMs ?? WORKSPACE_SESSION_TTL_MS;
        this.id = options.id ?? this.generateId();
        this.expiresAt = options.expiresAt ?? this.nextExpiration();

        if (!isSessionId(this.id)) {
            throw new Error("Invalid workspace session identifier");
        }
    }

    public getId(): SessionId {
        return this.id;
    }

    public getExpiresAt(): Date {
        return new Date(this.expiresAt);
    }

    public isExpired(): boolean {
        return this.expiresAt.getTime() <= this.now().getTime();
    }

    public rotate(): { previousId: SessionId; sessionId: SessionId; expiresAt: Date } {
        const previousId = this.id;
        this.id = this.generateId();
        this.expiresAt = this.nextExpiration();

        return {
            previousId,
            sessionId: this.id,
            expiresAt: this.getExpiresAt(),
        };
    }

    private nextExpiration(): Date {
        return new Date(this.now().getTime() + this.ttlMs);
    }
}
