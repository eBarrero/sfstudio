import { SessionError } from '../exceptions/sessionError';
import { configuredConnections } from './configuredConnections';
import { SessionDTO, ConnectionStatus } from '../dtos/sessionDTO';
import { UserDTO } from '../../application/dtos/userDTO';
import { SessionId, WorkspaceSession } from './workspaceSession';
import { createOrgKey, OrgKey } from './orgKey';

export class UserEntity {
    private readonly workspaceSession: WorkspaceSession;
    private configuredConnections: configuredConnections[] = [];
    private connectionStatuses = new Map<OrgKey, ConnectionStatus>();
    private isPendingToUpdate = false;
    private activeOrgKey: OrgKey | null = null;

    constructor(sessionId: SessionId | null, expiresAt?: Date) {
        this.workspaceSession = new WorkspaceSession({ id: sessionId ?? undefined, expiresAt });
    }

    getSessionId(): SessionId { return this.workspaceSession.getId(); }
    getExpiresAt(): Date { return this.workspaceSession.getExpiresAt(); }
    isExpired(): boolean { return this.workspaceSession.isExpired(); }
    rotateSession() { return this.workspaceSession.rotate(); }
    setPendingToUpdate(pending: boolean): void { this.isPendingToUpdate = pending; }
    getPendingToUpdate(): boolean { return this.isPendingToUpdate; }

    setActiveOrgKey(orgKey: OrgKey): void {
        this.getConnection(orgKey);
        this.activeOrgKey = orgKey;
    }

    checkConnectionExists(orgKey: OrgKey): boolean {
        return this.configuredConnections.some(connection => connection.getOrgKey() === orgKey);
    }

    setConnectionStatus(orgKey: OrgKey, status: ConnectionStatus): void {
        this.getConnection(orgKey);
        this.connectionStatuses.set(orgKey, status);
    }

    disconnectOrg(orgKey: OrgKey): void {
        this.setConnectionStatus(orgKey, 'REAUTH_REQUIRED');
        if (this.activeOrgKey === orgKey) this.activeOrgKey = null;
    }

    reconcileActiveConnections(activeOrgKeys: ReadonlySet<OrgKey>): void {
        for (const connection of this.configuredConnections) {
            const key = connection.getOrgKey();
            if (activeOrgKeys.has(key)) this.connectionStatuses.set(key, 'CONNECTED');
            else if (this.connectionStatuses.get(key) === 'CONNECTED') {
                this.connectionStatuses.set(key, 'REAUTH_REQUIRED');
            }
        }
    }

    getConnection(orgKey: OrgKey): configuredConnections {
        const connection = this.configuredConnections.find(item => item.getOrgKey() === orgKey);
        if (!connection) throw new SessionError('Connection not found in workspace');
        return connection;
    }

    loadConnections(userDTO: UserDTO): void {
        this.configuredConnections = userDTO.getConnections().map(connection => new configuredConnections(connection));
        const available = new Set(this.configuredConnections.map(connection => connection.getOrgKey()));
        for (const key of this.connectionStatuses.keys()) {
            if (!available.has(key)) this.connectionStatuses.delete(key);
        }
        if (this.activeOrgKey && !available.has(this.activeOrgKey)) this.activeOrgKey = null;
        this.isPendingToUpdate = false;
    }

    signOut(): void {
        this.configuredConnections = [];
        this.connectionStatuses.clear();
        this.activeOrgKey = null;
    }

    getSessionStatus(): SessionDTO {
        return new SessionDTO({
            version: 1,
            activeOrgKey: this.activeOrgKey && this.connectionStatuses.get(this.activeOrgKey) === 'CONNECTED'
                ? this.activeOrgKey : null,
            connections: this.configuredConnections.map(connection => {
                const config = connection.getConnectionDriverConfig();
                const orgKey = createOrgKey(config.dbId, config.userId);
                return {
                    orgKey,
                    organizationId: config.dbId,
                    userId: config.userId,
                    userName: config.userName,
                    alias: config.alias,
                    instanceUrl: config.instanceUrl ?? '',
                    loginHost: config.loginHost,
                    environmentKind: config.isSalesforceSandbox() ? 'SANDBOX' as const : 'PRODUCTION' as const,
                    status: this.connectionStatuses.get(orgKey) ?? 'REAUTH_REQUIRED' as const,
                };
            }),
        });
    }
}
