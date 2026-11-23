import '@testing-library/jest-dom';
import { act, cleanup, render, screen } from '@testing-library/react';
import HomePage from '../src/components/pages/homePage/homepage';
import sessionState from '../src/store/sessionState';
import viewState from '../src/store/viewState';
import modelState from '../src/store/modelState';

globalThis.structuredClone ??= <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

jest.mock('../src/components/organisms/dbConnectionManager/dbConnectionManager', () => ({
  __esModule: true, default: () => <div>Gestor</div>,
}));
jest.mock('../src/components/organisms/SOQLPath/soqlPath', () => ({
  __esModule: true, default: () => <div>Ruta SOQL</div>,
}));
jest.mock('../src/components/organisms/console/console', () => ({
  __esModule: true, default: () => <div>Consola</div>,
}));
jest.mock('../src/components/organisms/resultSheet/resultSheet', () => ({
  __esModule: true, default: () => <div>Resultados</div>,
}));
jest.mock('../src/components/organisms/sObjectPanel/sObjectPanel', () => ({
  __esModule: true, default: () => <div>Panel de objeto</div>,
}));

afterEach(cleanup);

it('hides active org context when no organization needs attention', () => {
  act(() => {
    sessionState.getState().setWorkspace({ version: 1, activeOrgKey: null, connections: [] });
    viewState.getState().setCurrentView('SQL_RESULT');
  });
  render(<HomePage />);
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(screen.getByText('Resultados')).toBeInTheDocument();
});

it('shows the real query destination and root limit in the object view', () => {
  const orgKey = '00D000000000001:005000000000001';
  act(() => {
    sessionState.getState().setWorkspace({ version: 1, activeOrgKey: orgKey, connections: [{
      orgKey, organizationId: '00D000000000001', userId: '005000000000001',
      userName: 'fixture', alias: 'Integration', instanceUrl: 'https://example.my.salesforce.com',
      loginHost: 'test.salesforce.com', environmentKind: 'SANDBOX', status: 'CONNECTED',
    }] });
    modelState.setState({ state: { ...modelState.getState().state, orgSfName: orgKey },
      queryState: { indexCurrentElement: 0, queryElemnts: [{ type: 'ROOT', parent: -1,
        level: 0, limit: 125, sObjectId: { orgSfName: orgKey, sObjectApiName: 'Account', sObjectLocalId: 0 },
        selectClause: { fields: [] } }] }, sqlState: { sql: 'SELECT Id FROM Account LIMIT 125', isValid: true } });
    viewState.getState().setCurrentView('sobject');
  });
  render(<HomePage />);
  expect(screen.getByText(`Destino: Integration · ${orgKey}`)).toBeInTheDocument();
  expect(screen.getByText('Límite de ejecución: 125 filas')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Ejecutar en Integration' })).toBeEnabled();
  act(() => modelState.getState().setLimit(0, undefined));
  expect(screen.getByText('Límite de ejecución: 2000 filas')).toBeInTheDocument();
});
