import '@testing-library/jest-dom';
import { act, cleanup, render, screen } from '@testing-library/react';
import HomePage from '../src/components/pages/homePage/homepage';
import sessionState from '../src/store/sessionState';
import viewState from '../src/store/viewState';

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
