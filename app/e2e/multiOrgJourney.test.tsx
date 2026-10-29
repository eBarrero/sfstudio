import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import DBConnectionManager from '../src/components/organisms/dbConnectionManager/dbConnectionManager';
import applicationState from '../src/store/applicationState';
import sessionState from '../src/store/sessionState';
import { CONTEXT_LEVEL } from '../src/core/commandManager';
import type { PublicConnectionDefinition, PublicWorkspaceDefinition } from '../src/services/session/types';

const integrationKey = '00D000000000001:005000000000001';
const uatKey = '00D000000000002:005000000000002';
const connection = (orgKey: string, alias: string): PublicConnectionDefinition => ({
  orgKey, organizationId: orgKey.split(':')[0], userId: orgKey.split(':')[1],
  userName: `fixture-${alias.toLowerCase()}`, alias,
  instanceUrl: 'https://example.test', loginHost: 'test.salesforce.com',
  environmentKind: 'SANDBOX', status: 'CONNECTED',
});
const integration = connection(integrationKey, 'Integration');
const uat = connection(uatKey, 'UAT');
const empty: PublicWorkspaceDefinition = { version: 1, activeOrgKey: null, connections: [] };
const both: PublicWorkspaceDefinition = {
  version: 1, activeOrgKey: uatKey, connections: [integration, uat],
};

afterEach(cleanup);

for (const input of ['mouse', 'command'] as const) {
  it(`reaches the same multi-org state through ${input} actions`, async () => {
    const previousFetch = global.fetch;
    const previousReconnect = sessionState.getState().loginOrganization;
    const requests: string[] = [];
    global.fetch = jest.fn(async (url: RequestInfo | URL, options?: RequestInit) => {
      requests.push(`${options?.method ?? 'GET'} ${url}`);
      if (options?.method === 'POST') {
        return { ok: true, status: 200, json: async () => ({ ...both, activeOrgKey: integrationKey }) } as Response;
      }
      if (options?.method === 'DELETE') {
        return { ok: true, status: 200, json: async () => ({ ...both,
          activeOrgKey: uatKey,
          connections: [{ ...integration, status: 'REAUTH_REQUIRED' }, uat],
        }) } as Response;
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    const reconnect = jest.fn((orgKey: string) => {
      expect(orgKey).toBe(integrationKey);
      sessionState.getState().setWorkspace({ ...both, activeOrgKey: integrationKey });
    });
    sessionState.setState({ loginOrganization: reconnect });
    applicationState.getState().setContextLevel(CONTEXT_LEVEL.ORG);
    const execute = (command: string) => {
      act(() => {
        applicationState.getState().exeCommand(command);
        const confirmed = applicationState.getState().commandConfirmed;
        expect(confirmed?.actionId).toBeDefined();
        (confirmed?.action as () => void)();
      });
    };
    try {
      act(() => sessionState.getState().setWorkspace(empty));
      const view = render(<DBConnectionManager />);
      expect(screen.getByRole('region', { name: 'Organizaciones' })).toBeInTheDocument();
      // OAuth callbacks are exercised against the HTTP API in sprint03Journey.test.js.
      act(() => sessionState.getState().setWorkspace({ ...both, activeOrgKey: integrationKey,
        connections: [integration] }));
      expect(screen.getByText('Integration')).toBeInTheDocument();
      act(() => sessionState.getState().setWorkspace(both));
      expect(screen.getByText('UAT')).toBeInTheDocument();

      if (input === 'mouse') fireEvent.click(screen.getByRole('button', { name: /Usar Integration/ }));
      else execute(`org use ${integrationKey}`);
      await waitFor(() => expect(sessionState.getState().publicSession.activeOrgKey).toBe(integrationKey));

      if (input === 'mouse') fireEvent.click(screen.getAllByRole('button', { name: 'Desconectar' })[0]);
      else execute(`org close ${integrationKey}`);
      await waitFor(() => expect(sessionState.getState().publicSession.connections[0].status)
        .toBe('REAUTH_REQUIRED'));
      expect(sessionState.getState().publicSession.connections[1].status).toBe('CONNECTED');

      if (input === 'mouse') fireEvent.click(screen.getByRole('button', { name: 'Reautenticar' }));
      else execute(`org reconnect ${integrationKey}`);
      await waitFor(() => expect(reconnect).toHaveBeenCalledWith(integrationKey));
      expect(sessionState.getState().publicSession).toEqual({ ...both, activeOrgKey: integrationKey });
      expect(requests).toEqual([
        'POST /api/v1/workspace/active-org',
        `DELETE /api/v1/workspace/orgs/${encodeURIComponent(integrationKey)}`,
      ]);
      view.unmount();
    } finally {
      global.fetch = previousFetch;
      sessionState.setState({ loginOrganization: previousReconnect });
    }
  });
}
