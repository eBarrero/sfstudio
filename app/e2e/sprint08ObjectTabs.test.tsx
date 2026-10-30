import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import SObjectPanel from '../src/components/organisms/sObjectPanel/sObjectPanel';
import { CONTEXT_LEVEL, readCommand } from '../src/core/commandManager';
import objectPanelState from '../src/store/objectPanelState';
import viewState from '../src/store/viewState';

jest.mock('../src/components/organisms/tableFields/tableFields', () => ({
  __esModule: true,
  default: () => <div>Tabla de campos</div>,
  TableFieldsExtend: () => <div>Campos ampliados</div>,
}));
jest.mock('../src/components/organisms/tableChildRelationShips/tableChildRelationShips', () => ({
  __esModule: true,
  default: () => <div>Tabla de relaciones</div>,
}));

afterEach(() => {
  cleanup();
  objectPanelState.getState().resetTab();
});

it('switches one visible panel through tabs and matching OBJECT commands', () => {
  act(() => {
    viewState.getState().initializeView();
    viewState.getState().setCurrentView('sobject');
    objectPanelState.getState().resetTab();
  });
  render(<SObjectPanel />);
  const fields = screen.getByRole('tab', { name: /Campos/ });
  const relations = screen.getByRole('tab', { name: /Relaciones hijas/ });
  expect(fields).toHaveAttribute('data-action-id', 'object.show_fields');
  expect(relations).toHaveAttribute('data-action-id', 'object.show_relations');
  expect(fields).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByText('Tabla de campos')).toBeInTheDocument();
  expect(screen.queryByText('Tabla de relaciones')).not.toBeInTheDocument();
  expect(screen.queryByText('Límite de ejecución: 200 filas')).not.toBeInTheDocument();

  fireEvent.click(relations);
  expect(relations).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByText('Tabla de relaciones')).toBeInTheDocument();
  expect(screen.queryByText('Tabla de campos')).not.toBeInTheDocument();
  const fieldsCommand = readCommand('SHOW_FIELDS', CONTEXT_LEVEL.OBJECT)!;
  expect(fieldsCommand.actionId).toBe(fields.getAttribute('data-action-id'));
  act(() => fieldsCommand.action({} as AcctionParams));
  expect(fields).toHaveAttribute('aria-selected', 'true');

  const relationsCommand = readCommand('show_relations', CONTEXT_LEVEL.OBJECT)!;
  expect(relationsCommand.actionId).toBe(relations.getAttribute('data-action-id'));
  act(() => relationsCommand.action({} as AcctionParams));
  expect(relations).toHaveAttribute('aria-selected', 'true');
  fireEvent.keyDown(relations, { key: 'ArrowLeft' });
  expect(fields).toHaveFocus();
  expect(fields).toHaveAttribute('aria-selected', 'true');
});

it('keeps the extended fields view and resets to fields for a new object', () => {
  act(() => {
    viewState.getState().setCurrentView('OBJECT_EXTEND');
    objectPanelState.getState().selectTab('relations');
  });
  const rendered = render(<SObjectPanel />);
  expect(screen.getByText('Campos ampliados')).toBeInTheDocument();
  expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  act(() => objectPanelState.getState().resetTab());
  act(() => viewState.getState().setCurrentView('sobject'));
  expect(screen.getByRole('tab', { name: /Campos/ })).toHaveAttribute('aria-selected', 'true');
  rendered.unmount();
});
