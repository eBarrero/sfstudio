import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import SObjectPanel from '../src/components/organisms/sObjectPanel/sObjectPanel';
import TableFields from '../src/components/organisms/tableFields/tableFields';
import { CONTEXT_LEVEL, readCommand } from '../src/core/commandManager';
import { modelReader } from '../src/services/salesforceSchema/proxy';
import dataState from '../src/store/dataState';
import modelState from '../src/store/modelState';
import objectPanelState from '../src/store/objectPanelState';
import viewState from '../src/store/viewState';

globalThis.structuredClone ??= <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
  objectPanelState.getState().resetTab();
});

const query = (): QueryState => ({ indexCurrentElement: 0, queryElemnts: [
  { type: 'ROOT', parent: -1, level: 0, limit: 50,
    sObjectId: { orgSfName: 'fixture', sObjectApiName: 'Account', sObjectLocalId: 0 },
    selectClause: { fields: [] } },
  { type: 'SUBQUERY', parent: 0, level: 1, limit: 1, relationshipName: 'Contacts',
    sObjectId: { orgSfName: 'fixture', sObjectApiName: 'Contact', sObjectLocalId: 1 },
    selectClause: { fields: [] } },
] });

test('separates WHERE and LIMIT in keyboard accessible tabs', () => {
  act(() => {
    modelState.setState({ queryState: query() });
    viewState.getState().setCurrentView('sobject');
  });
  render(<SObjectPanel />);
  fireEvent.click(screen.getByRole('tab', { name: 'Where Clause' }));
  const wherePanel = screen.getByRole('tabpanel', { name: 'Where Clause' });
  expect(within(wherePanel).getByText('No WHERE conditions have been added.')).toBeInTheDocument();
  expect(within(wherePanel).queryByRole('table')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('tab', { name: 'Order Clause' }));
  fireEvent.keyDown(screen.getByRole('tab', { name: 'Order Clause' }), { key: 'ArrowRight' });
  const limitTab = screen.getByRole('tab', { name: 'Limit Clause' });
  expect(limitTab).toHaveFocus();
  expect(limitTab).toHaveAttribute('data-action-id', 'object.show_limit');
  const limitPanel = screen.getByRole('tabpanel', { name: 'Limit Clause' });
  expect(within(limitPanel).getByRole('table', { name: 'LIMIT by object' })).toBeInTheDocument();
  expect(within(limitPanel).getByRole('checkbox', { name: '1 Contact 1' })).toBeChecked();
  expect(within(limitPanel).queryByText('No WHERE conditions have been added.')).not.toBeInTheDocument();
});

test('selecting an object from Child Relationships returns to Fields', () => {
  jest.spyOn(modelReader, 'getSObject').mockReturnValue({ fields: [] } as unknown as SObject);
  act(() => {
    modelState.setState({ queryState: query() });
    viewState.getState().setCurrentView('sobject');
    objectPanelState.getState().selectTab('relations');
    modelState.getState().showByqueryElemntsIndex(1);
  });
  render(<SObjectPanel />);
  expect(modelState.getState().state.sObjectApiName).toBe('Contact');
  expect(screen.getByRole('tab', { name: 'Fields' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.queryByRole('tabpanel', { name: 'Child Relationships' })).not.toBeInTheDocument();
});

test('opening a child relationship returns to Fields through the shared command action', () => {
  jest.spyOn(modelReader, 'getSObject').mockReturnValue({ fields: [] } as unknown as SObject);
  const child: GetChildRelationships = { orgSfName: 'fixture', sObjectLocalId: 1,
    childSObject: 'Contact', relationshipName: 'Contacts', fieldNameAPI: 'AccountId' };
  const root = query().queryElemnts[0];
  act(() => {
    modelState.setState({ queryState: { indexCurrentElement: 0, queryElemnts: [root] } });
    viewState.getState().setCurrentView('sobject');
    objectPanelState.getState().selectTab('relations');
    dataState.getState().createChildRelationshipsCommands([child]);
  });
  render(<SObjectPanel />);
  expect(screen.getByRole('tab', { name: 'Child Relationships' })).toHaveAttribute('aria-selected', 'true');

  const command = readCommand('child_Contact', CONTEXT_LEVEL.OBJECT);
  expect(command).toBeDefined();
  act(() => command!.action({ model: modelState.getState() } as AcctionParams));

  expect(modelState.getState().state.sObjectApiName).toBe('Contact');
  expect(screen.getByRole('tab', { name: 'Fields' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.queryByRole('tabpanel', { name: 'Child Relationships' })).not.toBeInTheDocument();
});

test.each([CONTEXT_LEVEL.OBJECT, CONTEXT_LEVEL.SQL_EXECUTION,
  CONTEXT_LEVEL.SQL_EDITION, CONTEXT_LEVEL.SQL_MANAGEMENT])('SET_QUERY works in %s', context => {
  jest.spyOn(modelReader, 'getSObject').mockReturnValue({ fields: [] } as unknown as SObject);
  modelState.setState({ queryState: query() });
  modelState.getState().initializeModel();
  const command = readCommand('sql', context);
  expect(command).toBeDefined();
  const loadFields = jest.fn();
  const setCurrentView = jest.fn();
  const setContextLevel = jest.fn();
  act(() => {
    objectPanelState.getState().selectTab('relations');
    command!.action({ data: { loadFields }, view: { setCurrentView },
      application: { currentCommand: 'sql 1', setContextLevel } } as unknown as AcctionParams);
  });
  expect(modelState.getState().queryState.indexCurrentElement).toBe(1);
  expect(objectPanelState.getState().activeTab).toBe('fields');
  expect(loadFields).toHaveBeenCalledWith('fixture', 1);
  expect(setCurrentView).toHaveBeenCalledWith('sobject');
  expect(setContextLevel).toHaveBeenCalledWith(CONTEXT_LEVEL.OBJECT);
});

test('SET_QUERY opens the root without an index and rejects invalid indices', () => {
  jest.spyOn(modelReader, 'getSObject').mockReturnValue({ fields: [] } as unknown as SObject);
  modelState.setState({ queryState: query() });
  modelState.getState().initializeModel();
  const command = readCommand('sql', CONTEXT_LEVEL.SQL_MANAGEMENT)!;
  const loadFields = jest.fn();
  const setCurrentView = jest.fn();
  const setContextLevel = jest.fn();
  const run = (currentCommand: string) => command.action({ data: { loadFields },
    view: { setCurrentView }, application: { currentCommand, setContextLevel } } as unknown as AcctionParams);
  act(() => run('sql'));
  expect(modelState.getState().queryState.indexCurrentElement).toBe(0);
  expect(loadFields).toHaveBeenCalledWith('fixture', 0);
  const before = modelState.getState().queryState;
  expect(() => run('sql 99')).toThrow('The selected SOQL object is unavailable.');
  expect(modelState.getState().queryState).toBe(before);
  expect(loadFields).toHaveBeenCalledTimes(1);
});

test('renders API name and label in separate columns with explicit widths', () => {
  dataState.setState({ sObjectFields: [{ fieldLocalId: 0, fieldApiName: 'AccountId',
    label: 'Account', type: 'string', length: 0 } as GetFieldsIndex] });
  modelState.setState({ currentSOQLFieldSelection: new Map() });
  const { container } = render(<TableFields columnWidths={['7rem', '12rem', '20rem']} />);
  const grid = container.querySelector('[class*="TableFields"]');
  expect(grid).toHaveStyle({ gridTemplateColumns: '50px 7rem 12rem 20rem' });
  expect(screen.getByText('AccountId')).toBeInTheDocument();
  expect(screen.getByText('Account')).toBeInTheDocument();
  expect(screen.queryByText('AccountId - Account')).not.toBeInTheDocument();
});
