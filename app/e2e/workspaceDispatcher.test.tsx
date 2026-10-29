import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import DBConnectionManager from '../src/components/organisms/dbConnectionManager/dbConnectionManager';
import { CONTEXT_LEVEL, getAllCommands, getMenus } from '../src/core/commandManager';
import { createWorkspaceActionDispatcher } from '../src/core/workspaceActions';
import { parseWorkspaceCommand } from '../src/core/workspaceCommandParser';
import applicationState from '../src/store/applicationState';
import sessionState from '../src/store/sessionState';
import type { PublicWorkspaceDefinition } from '../src/services/session/types';

const orgKey = '00D000000000001:005000000000001';
const workspace: PublicWorkspaceDefinition = {
  version: 1, activeOrgKey: orgKey,
  connections: [{ orgKey, organizationId: '00D000000000001', userId: '005000000000001',
    userName: 'fixture', alias: 'Integration', instanceUrl: 'https://example.my.salesforce.com',
    loginHost: 'test.salesforce.com', environmentKind: 'SANDBOX', status: 'CONNECTED' }],
};

afterEach(cleanup);

it.each([
  ['org list', { id: 'org.list' }],
  [`org use ${orgKey}`, { id: 'org.use', orgKey }],
  [`org close ${orgKey}`, { id: 'org.close', orgKey }],
  [`org reconnect ${orgKey}`, { id: 'org.reconnect', orgKey }],
  ['org connect production', { id: 'org.connect', environment: 'PRODUCTION' }],
  ['workspace close', { id: 'workspace.close' }],
  [`metadata refresh ${orgKey}`, { id: 'metadata.refresh', orgKey }],
])('parses %s into a typed action', (input, action) => {
  expect(parseWorkspaceCommand(input)).toEqual({ kind: 'action', action });
});

it('rejects invalid syntax and context without mutating the workspace', async () => {
  const selectOrganization = jest.fn().mockResolvedValue(undefined);
  const dispatcher = createWorkspaceActionDispatcher({
    getWorkspace: () => workspace,
    selectOrganization,
    disconnectOrg: jest.fn(), reconnectOrg: jest.fn(), connectOrg: jest.fn(), closeWorkspace: jest.fn(),
    refreshMetadata: jest.fn(),
  });
  expect(parseWorkspaceCommand('org use Integration')).toMatchObject({ kind: 'error', code: 'COMMAND_INVALID' });
  expect(parseWorkspaceCommand('org remove')).toMatchObject({ kind: 'error', code: 'COMMAND_INVALID' });
  expect(await dispatcher({ id: 'org.use', orgKey }, 'invalid' as CONTEXT_LEVEL))
    .toMatchObject({ ok: false, code: 'CONTEXT_NOT_ALLOWED' });
  expect(await dispatcher({ id: 'org.use', orgKey: '00D000000000003:005000000000003' }, CONTEXT_LEVEL.ORG))
    .toMatchObject({ ok: false, code: 'ORG_NOT_FOUND' });
  expect(selectOrganization).not.toHaveBeenCalled();
});

it('routes button, menu and console through the same ActionId and OrgKey', async () => {
  const selectOrganization = jest.fn().mockResolvedValue(undefined);
  sessionState.setState({ selectOrganization });
  sessionState.getState().setWorkspace(workspace);
  applicationState.setState({ context_level: CONTEXT_LEVEL.ORG });
  const view = render(<DBConnectionManager />);

  fireEvent.click(screen.getByRole('button', { name: /Usar Integration/ }));
  const menu = getMenus(CONTEXT_LEVEL.ORG).find(item => item.label === 'Org')!;
  const commandName = menu.options.find(option => option.command.startsWith('Select_org_'))!.command;
  applicationState.getState().exeCommandFromUI(commandName);
  const menuCommand = applicationState.getState().commandConfirmed!;
  expect(menuCommand.actionId).toBe('org.use');
  (menuCommand.action as () => void)();

  applicationState.getState().exeCommand(`org use ${orgKey}`);
  const consoleCommand = applicationState.getState().commandConfirmed!;
  expect(consoleCommand.actionId).toBe('org.use');
  (consoleCommand.action as () => void)();
  await waitFor(() => expect(selectOrganization).toHaveBeenCalledTimes(3));
  expect(selectOrganization.mock.calls).toEqual([[orgKey], [orgKey], [orgKey]]);

  applicationState.getState().exeCommand('org use Integration');
  expect(applicationState.getState().commandConfirmed).toBeUndefined();
  expect(applicationState.getState().helpOnLine).toContain('org use <OrgKey>');
  expect(selectOrganization).toHaveBeenCalledTimes(3);

  act(() => {
    sessionState.getState().setWorkspace(workspace);
    sessionState.getState().setWorkspace(workspace);
  });
  expect(getAllCommands(CONTEXT_LEVEL.ORG).filter(command => command.command === commandName)).toHaveLength(1);
  view.unmount();
});

it.each([
  [`org close ${orgKey}`, 'Desconectar', 'org.close', 'disconnectOrg'],
  ['workspace close', 'Cerrar workspace', 'workspace.close', 'closeWorkspace'],
  ['org connect production', 'Conectar producción', 'org.connect', 'loginSFDC'],
])('gives %s the same action through mouse and console', async (commandText, buttonName, id, method) => {
  const operation = jest.fn().mockResolvedValue(undefined);
  sessionState.setState({ [method]: operation });
  sessionState.getState().setWorkspace(workspace);
  applicationState.setState({ context_level: CONTEXT_LEVEL.ORG });
  const view = render(<DBConnectionManager />);
  const button = screen.getByRole('button', { name: buttonName });
  expect(button).toHaveAttribute('data-action-id', id);
  fireEvent.click(button);
  applicationState.getState().exeCommand(commandText);
  const parsed = applicationState.getState().commandConfirmed!;
  expect(parsed.actionId).toBe(id);
  (parsed.action as () => void)();
  await waitFor(() => expect(operation).toHaveBeenCalledTimes(2));
  if (id === 'org.close') expect(operation.mock.calls).toEqual([[orgKey], [orgKey]]);
  view.unmount();
});

it('routes reconnect with the same OrgKey from button and console', async () => {
  const reconnect = jest.fn();
  sessionState.setState({ loginOrganization: reconnect });
  sessionState.getState().setWorkspace({
    ...workspace, activeOrgKey: null,
    connections: [{ ...workspace.connections[0], status: 'REAUTH_REQUIRED' }],
  });
  applicationState.setState({ context_level: CONTEXT_LEVEL.ORG });
  const view = render(<DBConnectionManager />);
  const button = screen.getByRole('button', { name: 'Reautenticar' });
  expect(button).toHaveAttribute('data-action-id', 'org.reconnect');
  fireEvent.click(button);
  applicationState.getState().exeCommand(`org reconnect ${orgKey}`);
  const parsed = applicationState.getState().commandConfirmed!;
  expect(parsed.actionId).toBe('org.reconnect');
  (parsed.action as () => void)();
  await waitFor(() => expect(reconnect).toHaveBeenCalledTimes(2));
  expect(reconnect.mock.calls).toEqual([[orgKey], [orgKey]]);
  view.unmount();
});
