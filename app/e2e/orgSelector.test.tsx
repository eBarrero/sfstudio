import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import DBConnectionManager from '../src/components/organisms/dbConnectionManager/dbConnectionManager';
import ActiveOrgContext from '../src/components/organisms/dbConnectionManager/activeOrgContext';
import sessionState, { ORG_USE_ACTION_ID } from '../src/store/sessionState';
import modelState from '../src/store/modelState';
import { CONTEXT_LEVEL, readCommand } from '../src/core/commandManager';
import type { PublicConnectionDefinition, PublicWorkspaceDefinition } from '../src/services/session/types';
import { IconCharacter } from '../src/components/constants';

const firstKey = '00D000000000001:005000000000001';
const secondKey = '00D000000000002:005000000000002';
const connection = (orgKey: string, status: PublicConnectionDefinition['status']): PublicConnectionDefinition => ({
  orgKey,
  organizationId: orgKey.split(':')[0],
  userId: orgKey.split(':')[1],
  userName: `fixture-${orgKey.slice(-1)}`,
  alias: 'Shared alias',
  instanceUrl: 'https://example.my.salesforce.com',
  loginHost: 'test.salesforce.com',
  environmentKind: 'SANDBOX',
  status,
});

const workspace: PublicWorkspaceDefinition = {
  version: 1,
  activeOrgKey: firstKey,
  connections: [connection(firstKey, 'CONNECTED'), connection(secondKey, 'CONNECTED')],
};

afterEach(() => { cleanup(); jest.restoreAllMocks(); });

it('opens compact connection details by gear and restores focus when closed', () => {
  act(() => sessionState.getState().setWorkspace(workspace));
  render(<DBConnectionManager />);
  const gear = screen.getByRole('button', { name: 'Gestionar organizaciones' });
  expect(screen.getAllByLabelText('Estado: Conectada').length).toBeGreaterThan(0);
  expect(screen.getByRole('img', { name: 'Organización activa' })).toHaveTextContent(IconCharacter.CHECK);
  expect(screen.queryByRole('button', { name: 'Desconectar' })).not.toBeInTheDocument();
  gear.focus();
  fireEvent.click(gear);
  expect(screen.getByRole('dialog', { name: 'Gestionar organizaciones' })).toBeInTheDocument();
  expect(screen.getByText('Usuario: fixture-1')).toBeInTheDocument();
  expect(screen.getByText('Organization ID: 00D000000000001')).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: 'Desconectar' })).toHaveLength(2);
  expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveFocus();
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
  expect(gear).toHaveFocus();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('can open connection controls with no organizations', () => {
  act(() => sessionState.getState().setWorkspace({ version: 1, activeOrgKey: null, connections: [] }));
  render(<DBConnectionManager />);
  fireEvent.click(screen.getByRole('button', { name: 'Gestionar organizaciones' }));
  expect(screen.getByRole('button', { name: 'Conectar producción' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Conectar sandbox' })).toBeInTheDocument();
});

it('selects one of two same-alias orgs by OrgKey through button and command', async () => {
  const responses = [
    { ...workspace, activeOrgKey: secondKey },
    { ...workspace, activeOrgKey: firstKey },
  ];
  const requests: string[] = [];
  const previous = global.fetch;
  global.fetch = jest.fn(async (_url: RequestInfo | URL, options?: RequestInit) => {
    requests.push(String(options?.body));
    return { ok: true, status: 200, json: async () => responses.shift() } as Response;
  });
  try {
    act(() => sessionState.getState().setWorkspace(workspace));
    const view = render(<><DBConnectionManager /><ActiveOrgContext /></>);
    fireEvent.click(screen.getByRole('button', { name: 'Gestionar organizaciones' }));
    const buttons = screen.getAllByRole('button', { name: /Usar Shared alias/ });
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true');
    expect(buttons[1]).toHaveAttribute('aria-pressed', 'false');
    expect(buttons[1]).toHaveAttribute('data-action-id', ORG_USE_ACTION_ID);
    buttons[1].focus();
    expect(document.activeElement).toBe(buttons[1]);
    fireEvent.click(buttons[1]);
    await waitFor(() => expect(sessionState.getState().publicSession.activeOrgKey).toBe(secondKey));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(requests[0]).toContain(secondKey);

    const command = readCommand('Select_org_00D000000000001_005000000000001', CONTEXT_LEVEL.ORG)!;
    expect(command.actionId).toBe(ORG_USE_ACTION_ID);
    (command.action as () => void)();
    await waitFor(() => expect(sessionState.getState().publicSession.activeOrgKey).toBe(firstKey));
    expect(requests[1]).toContain(firstKey);
    expect(sessionState.getState().publicSession.connections.map(row => row.status))
      .toEqual(['CONNECTED', 'CONNECTED']);
    view.unmount();
  } finally {
    global.fetch = previous;
  }
});

it('shows context only when a known organization needs selection or attention', () => {
  act(() => sessionState.getState().setWorkspace(workspace));
  const view = render(<ActiveOrgContext />);
  expect(screen.queryByRole('status')).not.toBeInTheDocument();

  act(() => sessionState.getState().setWorkspace({ ...workspace, activeOrgKey: null }));
  expect(screen.getByRole('status')).toHaveTextContent('Sin organización activa para explorar o consultar.');

  act(() => sessionState.getState().setWorkspace({ ...workspace, connections: [connection(firstKey, 'REAUTH_REQUIRED')] }));
  expect(screen.getByRole('status')).toHaveTextContent('Organización no disponible para explorar o consultar: Shared alias');

  act(() => sessionState.getState().setWorkspace({ version: 1, activeOrgKey: null, connections: [] }));
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  view.unmount();
});

it('shows all connection states with text and clears the old query when changing org', () => {
  const states: PublicConnectionDefinition[] = [
    connection(firstKey, 'CONNECTED'),
    connection(secondKey, 'CONNECTING'),
    connection('00D000000000003:005000000000003', 'REAUTH_REQUIRED'),
    connection('00D000000000004:005000000000004', 'ERROR'),
  ];
  act(() => sessionState.getState().setWorkspace({ version: 1, activeOrgKey: firstKey, connections: states }));
  const view = render(<DBConnectionManager />);
  expect(screen.getByLabelText('Estado: Conectada')).toBeInTheDocument();
  expect(screen.getByLabelText('Estado: Conectando')).toBeInTheDocument();
  expect(screen.getByLabelText('Estado: Reautenticación necesaria')).toBeInTheDocument();
  expect(screen.getByLabelText('Estado: Error de conexión')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Gestionar organizaciones' }));
  expect(screen.getByRole('button', { name: 'Reautenticar' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Reintentar conexión' })).toBeInTheDocument();
  expect(screen.getByText('Espera a que termine la conexión.')).toBeInTheDocument();
  modelState.setState({ sqlState: { sql: 'SELECT Id FROM Account', isValid: true } });
  modelState.getState().setOrg(secondKey);
  expect(modelState.getState().sqlState.sql).toBe('');
  view.unmount();
});
