

import { OrgKey } from '../entities/orgKey';

export type ConnectionStatus = 'CONNECTED' | 'REAUTH_REQUIRED' | 'CONNECTING' | 'ERROR';
export type EnvironmentKind = 'PRODUCTION' | 'SANDBOX';

export interface PublicConnectionDefinition {
    orgKey: OrgKey;
    organizationId: string;
    userId: string;
    userName: string;
    alias: string;
    instanceUrl: string;
    loginHost: string;
    environmentKind: EnvironmentKind;
    status: ConnectionStatus;
}

export interface PublicWorkspaceDefinition {
    version: 1;
    connections: PublicConnectionDefinition[];
    activeOrgKey: OrgKey | null;
}

export class SessionDTO {
    constructor(private readonly workspace: PublicWorkspaceDefinition) {}

    public toJSON(): PublicWorkspaceDefinition {
        return this.workspace;
    }

    // Compatibility for the existing /api/init route until it is removed.
    public serialize(): string {
        return Buffer.from(JSON.stringify(this.workspace)).toString('base64');
    }
}
