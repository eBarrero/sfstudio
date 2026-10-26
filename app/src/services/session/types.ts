export type ConnectionStatus = 'CONNECTED' | 'REAUTH_REQUIRED' | 'CONNECTING' | 'ERROR';

export interface PublicConnectionDefinition {
  orgKey: string;
  organizationId: string;
  userId: string;
  userName: string;
  alias: string;
  instanceUrl: string;
  loginHost: string;
  environmentKind: 'PRODUCTION' | 'SANDBOX';
  status: ConnectionStatus;
}

export interface PublicWorkspaceDefinition {
  version: 1;
  connections: PublicConnectionDefinition[];
  activeOrgKey: string | null;
}
