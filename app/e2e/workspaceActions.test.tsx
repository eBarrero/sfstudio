import { act, fireEvent, render, screen, cleanup } from '@testing-library/react';
import DBConnectionManager from '../src/components/organisms/dbConnectionManager/dbConnectionManager';
import sessionState from '../src/store/sessionState';
import { CONTEXT_LEVEL, readCommand } from '../src/core/commandManager';
import type { PublicConnectionDefinition } from '../src/services/session/types';

const orgKey = '00D000000000001:005000000000001';
const connection: PublicConnectionDefinition = {
    orgKey,
    organizationId: '00D000000000001',
    userId: '005000000000001',
    userName: 'fixture-user',
    alias: 'Integration',
    instanceUrl: 'https://example.my.salesforce.com',
    loginHost: 'test.salesforce.com',
    environmentKind: 'SANDBOX',
    status: 'CONNECTED',
};

afterEach(cleanup);

it('mouse and console actions dispatch through the same workspace operations', () => {
    const disconnectOrg = jest.fn().mockResolvedValue(undefined);
    const loginOrganization = jest.fn();
    const closeWorkspace = jest.fn().mockResolvedValue(undefined);
    sessionState.setState({ disconnectOrg, loginOrganization, closeWorkspace });
    sessionState.getState().setWorkspace({ version: 1, activeOrgKey: orgKey, connections: [connection] });
    const view = render(<DBConnectionManager />);

    fireEvent.click(screen.getByRole('button', { name: 'Desconectar' }));
    (readCommand('Disconnect_org_00D000000000001_005000000000001', CONTEXT_LEVEL.ORG)!.action as () => void)();
    expect(disconnectOrg).toHaveBeenCalledTimes(2);
    expect(disconnectOrg).toHaveBeenNthCalledWith(1, orgKey);
    expect(disconnectOrg).toHaveBeenNthCalledWith(2, orgKey);

    act(() => {
        sessionState.getState().setWorkspace({
            version: 1, activeOrgKey: null, connections: [{ ...connection, status: 'REAUTH_REQUIRED' }],
        });
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reautenticar' }));
    (readCommand('Reconnect_org_00D000000000001_005000000000001', CONTEXT_LEVEL.ORG)!.action as () => void)();
    expect(loginOrganization).toHaveBeenCalledTimes(2);
    expect(loginOrganization).toHaveBeenNthCalledWith(1, orgKey);
    expect(loginOrganization).toHaveBeenNthCalledWith(2, orgKey);

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar workspace' }));
    (readCommand('Close_workspace', CONTEXT_LEVEL.ORG)!.action as () => void)();
    expect(closeWorkspace).toHaveBeenCalledTimes(2);
    view.unmount();
});
