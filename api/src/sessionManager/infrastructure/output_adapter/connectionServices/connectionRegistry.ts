import { OrgKey } from '../../../domain/entities/orgKey';
import { SessionId } from '../../../domain/entities/workspaceSession';
import { ReauthRequiredError } from '../../../domain/exceptions/reauthRequiredError';
import { ActiveConnectionPort, ConnectionRegistryPort } from '../../../domain/ports/outbound/connectionRegistryPort';

interface WorkspaceConnections {
    expiresAt: number;
    connections: Map<OrgKey, ActiveConnectionPort>;
}

/** Active Salesforce drivers live only in memory and are scoped to one workspace. */
export class ConnectionRegistry implements ConnectionRegistryPort {
    private readonly workspaces = new Map<SessionId, WorkspaceConnections>();

    constructor(private readonly now: () => number = Date.now) {}

    addConnection(workspaceId: SessionId, orgKey: OrgKey, connection: ActiveConnectionPort, expiresAt: Date): void {
        this.sweepExpired();
        if (expiresAt.getTime() <= this.now()) {
            connection.dispose();
            throw new ReauthRequiredError();
        }
        let workspace = this.workspaces.get(workspaceId);
        if (!workspace) {
            workspace = { expiresAt: expiresAt.getTime(), connections: new Map() };
            this.workspaces.set(workspaceId, workspace);
        }
        workspace.expiresAt = expiresAt.getTime();
        const previous = workspace.connections.get(orgKey);
        if (previous && previous !== connection) previous.dispose();
        workspace.connections.set(orgKey, connection);
    }

    getConnection(workspaceId: SessionId, orgKey: OrgKey): ActiveConnectionPort {
        this.expireWorkspace(workspaceId);
        const connection = this.workspaces.get(workspaceId)?.connections.get(orgKey);
        if (!connection) throw new ReauthRequiredError();
        return connection;
    }

    listOrgKeys(workspaceId: SessionId): OrgKey[] {
        this.expireWorkspace(workspaceId);
        return [...(this.workspaces.get(workspaceId)?.connections.keys() ?? [])];
    }

    removeConnection(workspaceId: SessionId, orgKey: OrgKey): void {
        this.expireWorkspace(workspaceId);
        const workspace = this.workspaces.get(workspaceId);
        const connection = workspace?.connections.get(orgKey);
        if (!workspace || !connection) return;
        workspace.connections.delete(orgKey);
        connection.dispose();
        if (workspace.connections.size === 0) this.workspaces.delete(workspaceId);
    }

    rotateSession(previousId: SessionId, sessionId: SessionId, expiresAt: Date): void {
        this.expireWorkspace(previousId);
        const workspace = this.workspaces.get(previousId);
        if (!workspace) return;
        this.deleteSession(sessionId);
        this.workspaces.delete(previousId);
        if (expiresAt.getTime() <= this.now()) {
            for (const connection of workspace.connections.values()) connection.dispose();
            return;
        }
        workspace.expiresAt = expiresAt.getTime();
        this.workspaces.set(sessionId, workspace);
    }

    deleteSession(workspaceId: SessionId): void {
        const workspace = this.workspaces.get(workspaceId);
        if (!workspace) return;
        this.workspaces.delete(workspaceId);
        for (const connection of workspace.connections.values()) connection.dispose();
        workspace.connections.clear();
    }

    sweepExpired(): void {
        for (const workspaceId of this.workspaces.keys()) this.expireWorkspace(workspaceId);
    }

    private expireWorkspace(workspaceId: SessionId): void {
        const workspace = this.workspaces.get(workspaceId);
        if (workspace && workspace.expiresAt <= this.now()) this.deleteSession(workspaceId);
    }
}
