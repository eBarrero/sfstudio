import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import SObjectPanel from '../src/components/organisms/sObjectPanel/sObjectPanel';
import { CONTEXT_LEVEL, getCommands, getMenus, readCommand } from '../src/core/commandManager';
import applicationState from '../src/store/applicationState';
import modelState from '../src/store/modelState';
import objectPanelState from '../src/store/objectPanelState';
import viewState from '../src/store/viewState';

globalThis.structuredClone ??= function cloneForTest<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
};

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
  fireEvent.keyDown(fields, { key: 'End' });
  expect(screen.getByRole('tab', { name: 'Where Clause' })).toHaveFocus();
  fireEvent.keyDown(screen.getByRole('tab', { name: 'Where Clause' }), { key: 'ArrowLeft' });
  expect(relations).toHaveFocus();
});

it('shows every stored WHERE condition and shares an action across tab, menu and command', () => {
  const first: SimpleCondition = { field: { fieldApiName: 'Name', fieldIndex: 0 },
    operator: 'LIKE', value: 'A%', sqlString: "Name LIKE 'A%'" };
  const second: SimpleCondition = { field: { fieldApiName: 'Status', fieldIndex: 1 },
    operator: '=', value: 'Open', sqlString: "Status = 'Open'" };
  act(() => {
    viewState.getState().initializeView();
    viewState.getState().setCurrentView('sobject');
    applicationState.getState().setContextLevel(CONTEXT_LEVEL.OBJECT);
    modelState.setState({ queryState: { indexCurrentElement: 1, queryElemnts: [
      { type: 'ROOT', parent: -1, level: 0, limit: 50,
        sObjectId: { orgSfName: 'fixture', sObjectApiName: 'Account', sObjectLocalId: 0 },
        selectClause: { fields: [] }, where: [first] },
      { type: 'SUBQUERY', parent: 0, level: 1, limit: 50, relationshipName: 'Contacts',
        sObjectId: { orgSfName: 'fixture', sObjectApiName: 'Contact', sObjectLocalId: 1 },
        selectClause: { fields: [] }, where: [second] },
    ] } });
  });
  render(<SObjectPanel />);
  const tab = screen.getByRole('tab', { name: 'Where Clause' });
  const command = readCommand('Show_Where', CONTEXT_LEVEL.OBJECT)!;
  expect(command.actionId).toBe('object.show_where');
  expect(tab).toHaveAttribute('data-action-id', command.actionId);
  expect(getCommands(CONTEXT_LEVEL.OBJECT)).not.toContain(command);
  expect(getMenus(CONTEXT_LEVEL.OBJECT).find(menu => menu.label === 'views')?.options)
    .toContainEqual({ label: 'Where Clause', command: 'Show_Where' });

  fireEvent.click(tab);
  expect(tab).toHaveAttribute('aria-selected', 'true');
  const panel = screen.getByRole('tabpanel', { name: 'Where Clause' });
  expect(within(panel).getByText("Name LIKE 'A%'")).toBeInTheDocument();
  expect(within(panel).getByText("Status = 'Open'")).toBeInTheDocument();
  expect(within(panel).getByRole('heading', { name: 'Account' })).toBeInTheDocument();
  expect(within(panel).getByText('Contact · Contacts')).toBeInTheDocument();

  act(() => objectPanelState.getState().selectTab('fields'));
  applicationState.getState().exeCommandFromUI('Show_Where');
  expect(applicationState.getState().commandConfirmed?.actionId).toBe(command.actionId);
  act(() => applicationState.getState().commandConfirmed!.action({} as AcctionParams));
  expect(tab).toHaveAttribute('aria-selected', 'true');

  act(() => objectPanelState.getState().selectTab('relations'));
  applicationState.getState().setCommand('Show_Where');
  applicationState.getState().exeCommand('Show_Where');
  expect(applicationState.getState().commandConfirmed?.actionId).toBe(command.actionId);
  act(() => applicationState.getState().commandConfirmed!.action({} as AcctionParams));
  expect(tab).toHaveAttribute('aria-selected', 'true');

  act(() => modelState.setState({ queryState: { indexCurrentElement: 0, queryElemnts: [] } }));
  const refreshedPanel = screen.getByRole('tabpanel', { name: 'Where Clause' });
  expect(within(refreshedPanel).getByText('No hay condiciones WHERE en la consulta.')).toBeInTheDocument();
  expect(within(refreshedPanel).queryByText("Name LIKE 'A%'")).not.toBeInTheDocument();
});

it('numbers conditions and applies only valid WHERE logic from the panel', () => {
  const conditions: SimpleCondition[] = [
    { field: { fieldApiName: 'Name', fieldIndex: 0 }, operator: '=',
      value: "'Alice'", sqlString: "Name = 'Alice'" },
    { field: { fieldApiName: 'Industry', fieldIndex: 1 }, operator: '=',
      value: "'Tech'", sqlString: "Industry = 'Tech'" },
  ];
  act(() => {
    viewState.getState().setCurrentView('sobject');
    objectPanelState.getState().resetTab();
    modelState.setState({ queryState: { indexCurrentElement: 0, queryElemnts: [{
      type: 'ROOT', parent: -1, level: 0, limit: 50,
      sObjectId: { orgSfName: 'fixture', sObjectApiName: 'Account', sObjectLocalId: 0 },
      selectClause: { fields: [{ fieldId: { fieldApiName: 'Name', fieldIndex: 0 },
        isAggregateFunction: false, makeGroupBy: false, soqlFunction: '%1' }] },
      where: conditions, whereLogic: 'C1 AND C2',
    }] } });
  });
  render(<SObjectPanel />);
  fireEvent.click(screen.getByRole('tab', { name: 'Where Clause' }));
  const panel = screen.getByRole('tabpanel', { name: 'Where Clause' });
  expect(within(panel).getByText('C1')).toBeInTheDocument();
  expect(within(panel).getByText('C2')).toBeInTheDocument();
  const input = within(panel).getByRole('textbox', { name: 'Lógica WHERE de Account' });
  expect(input).toHaveValue('C1 AND C2');

  fireEvent.change(input, { target: { value: '(C1 OR C0)' } });
  fireEvent.click(within(panel).getByRole('button', { name: 'Aplicar lógica' }));
  expect(within(panel).getByRole('alert')).toHaveTextContent('Usa índices entre C1 y C2.');
  expect((modelState.getState().queryState.queryElemnts[0] as PrimaryQuery).whereLogic).toBe('C1 AND C2');

  fireEvent.change(input, { target: { value: '(C1 OR C2)' } });
  fireEvent.click(within(panel).getByRole('button', { name: 'Aplicar lógica' }));
  expect(within(panel).queryByRole('alert')).not.toBeInTheDocument();
  expect((modelState.getState().queryState.queryElemnts[0] as PrimaryQuery).whereLogic).toBe('(C1 OR C2)');
  expect(modelState.getState().sqlState.sql).toContain("WHERE (Name = 'Alice' OR Industry = 'Tech')");
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
