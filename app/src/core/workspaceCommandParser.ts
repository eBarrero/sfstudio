import type { WorkspaceAction } from './workspaceActions';

export const WORKSPACE_COMMAND_HELP =
  'Comandos: org list; org use <OrgKey>; org close <OrgKey>; org reconnect <OrgKey>; ' +
  'org connect <production|sandbox>; workspace close.';

export type WorkspaceCommandParse =
  | { kind: 'action'; action: WorkspaceAction }
  | { kind: 'error'; code: 'COMMAND_INVALID'; help: string };

const orgKeyPattern = /^[a-zA-Z0-9]{15}(?:[a-zA-Z0-9]{3})?:[a-zA-Z0-9]{15}(?:[a-zA-Z0-9]{3})?$/;

export function parseWorkspaceCommand(input: string): WorkspaceCommandParse | null {
  const words = input.trim().split(/\s+/);
  const family = words[0]?.toLowerCase();
  if (family !== 'org' && family !== 'workspace') return null;
  const verb = words[1]?.toLowerCase();
  if (family === 'workspace') {
    if (verb === 'close' && words.length === 2) {
      return { kind: 'action', action: { id: 'workspace.close' } };
    }
    return { kind: 'error', code: 'COMMAND_INVALID', help: WORKSPACE_COMMAND_HELP };
  }
  if (verb === 'list' && words.length === 2) {
    return { kind: 'action', action: { id: 'org.list' } };
  }
  if (verb === 'connect' && words.length === 3) {
    const environment = words[2].toLowerCase();
    if (environment === 'production' || environment === 'sandbox') {
      return { kind: 'action', action: { id: 'org.connect',
        environment: environment === 'production' ? 'PRODUCTION' : 'SANDBOX' } };
    }
  }
  if ((verb === 'use' || verb === 'close' || verb === 'reconnect') && words.length === 3 &&
      orgKeyPattern.test(words[2])) {
    const id = verb === 'use' ? 'org.use' : verb === 'close' ? 'org.close' : 'org.reconnect';
    return { kind: 'action', action: { id, orgKey: words[2] } };
  }
  return { kind: 'error', code: 'COMMAND_INVALID', help: WORKSPACE_COMMAND_HELP };
}
