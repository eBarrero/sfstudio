import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import SObjectsPanel from '../src/components/organisms/schemaPanel/schemaPanel';
import { CONTEXT_LEVEL } from '../src/core/commandManager';
import applicationState from '../src/store/applicationState';
import dataState from '../src/store/dataState';
import sessionState from '../src/store/sessionState';

const orgKey = '00D000000000001:005000000000001';
afterEach(cleanup);

test('refresh button and command use the same action and org', async () => {
  const refreshMetadata = jest.fn().mockResolvedValue(undefined);
  dataState.setState({ refreshMetadata });
  sessionState.getState().setWorkspace({ version: 1, activeOrgKey: orgKey,
    connections: [{ orgKey, organizationId: '00D000000000001', userId: '005000000000001',
      userName: 'fixture', alias: 'Integration', instanceUrl: 'https://example.test',
      loginHost: 'test.salesforce.com', environmentKind: 'SANDBOX', status: 'CONNECTED' }],
  });
  applicationState.setState({ context_level: CONTEXT_LEVEL.ORG });
  const view = render(<SObjectsPanel />);
  const button = screen.getByRole('button', { name: 'Actualizar metadata' });
  expect(button).toHaveAttribute('data-action-id', 'metadata.refresh');
  fireEvent.click(button);
  act(() => { applicationState.getState().exeCommand(`metadata refresh ${orgKey}`); });
  const command = applicationState.getState().commandConfirmed!;
  expect(command.actionId).toBe('metadata.refresh');
  (command.action as () => void)();
  await waitFor(() => expect(refreshMetadata).toHaveBeenCalledTimes(2));
  expect(refreshMetadata.mock.calls).toEqual([[orgKey], [orgKey]]);
  view.unmount();
});
