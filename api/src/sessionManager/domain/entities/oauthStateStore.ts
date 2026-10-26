import { randomBytes } from "node:crypto";
import { OrgKey } from './orgKey';
import { SalesforceLoginHost, validateSalesforceLoginHost } from './salesforceLoginHost';

export const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

export type OAuthDestination =
    | { type: "new"; technology: string; loginHost: SalesforceLoginHost }
    | { type: "configured"; orgKey: OrgKey; technology: string; loginHost: SalesforceLoginHost };

export type OAuthStateErrorReason = "EXPIRED" | "INVALID" | "WORKSPACE_MISMATCH";

export class OAuthStateError extends Error {
    constructor(public readonly reason: OAuthStateErrorReason) {
        super("OAuth state is invalid or expired");
        this.name = "OAuthStateError";
    }
}

interface OAuthStateRecord {
    workspaceBinding: string;
    destination: OAuthDestination;
    correlationId: string;
    expiresAt: number;
}

interface OAuthStateStoreOptions {
    now?: () => number;
    generateNonce?: () => string;
    ttlMs?: number;
}

export interface ConsumedOAuthState {
    destination: OAuthDestination;
    correlationId: string;
}

export class OAuthStateStore {
    private readonly states = new Map<string, OAuthStateRecord>();
    private readonly now: () => number;
    private readonly generateNonce: () => string;
    private readonly ttlMs: number;

    constructor(options: OAuthStateStoreOptions = {}) {
        this.now = options.now ?? Date.now;
        this.generateNonce = options.generateNonce ?? (() => randomBytes(32).toString("base64url"));
        this.ttlMs = options.ttlMs ?? OAUTH_STATE_TTL_MS;
    }

    public issue(
        workspaceBinding: string,
        destination: OAuthDestination,
        correlationId: string,
    ): string {
        this.removeExpired();
        validateSalesforceLoginHost(destination.technology, destination.loginHost);
        let state: string;

        do {
            state = this.generateNonce();
        } while (this.states.has(state));

        this.states.set(state, {
            workspaceBinding,
            destination: Object.freeze({ ...destination }),
            correlationId,
            expiresAt: this.now() + this.ttlMs,
        });
        return state;
    }

    public consume(state: string, workspaceBinding: string): ConsumedOAuthState {
        const record = this.states.get(state);

        if (!record) {
            throw new OAuthStateError("INVALID");
        }

        if (record.expiresAt <= this.now()) {
            this.states.delete(state);
            throw new OAuthStateError("EXPIRED");
        }

        if (record.workspaceBinding !== workspaceBinding) {
            throw new OAuthStateError("WORKSPACE_MISMATCH");
        }

        this.states.delete(state);
        return {
            destination: record.destination,
            correlationId: record.correlationId,
        };
    }

    public discard(state: string): void {
        this.states.delete(state);
    }

    private removeExpired(): void {
        const now = this.now();
        for (const [state, record] of this.states) {
            if (record.expiresAt <= now) {
                this.states.delete(state);
            }
        }
    }
}
