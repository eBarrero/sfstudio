import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import FieldDialog from '../src/components/organisms/fieldDialog/fieldDialog';
import { Dialog } from '../src/components/constants';
import { modelReader } from '../src/services/salesforceSchema/proxy';
import modelState from '../src/store/modelState';
import sessionState from '../src/store/sessionState';
import viewState from '../src/store/viewState';
import objectPanelState from '../src/store/objectPanelState';

globalThis.structuredClone ??= <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const orgKey = '00D000000000001:005000000000001';
const currentField = { fieldApiName: 'Name', fieldLocalId: 0, type: 'string', sortable: true,
  picklistValues: [] } as unknown as GetFieldsIndex;

function setup() {
  jest.spyOn(modelReader, 'getFieldApiName').mockReturnValue('Name');
  jest.spyOn(modelReader, 'getSObject').mockReturnValue({ fields: [{ fieldLocalId: 0, name: 'Name', type: 'string' }] } as SObject);
  modelState.setState({ state: { ...modelState.getState().state, orgSfName: orgKey,
    sObjectApiName: 'Account', sObjectLocalId: 0, currentField, currentPath: '', action: 'field' },
    queryState: { indexCurrentElement: 0, queryElemnts: [{ type: 'ROOT', parent: -1, level: 0,
      sObjectId: { orgSfName: orgKey, sObjectApiName: 'Account', sObjectLocalId: 0 },
      selectClause: { fields: [] } }] }, currentSOQLFieldSelection: new Map() });
  sessionState.setState({ publicSession: { version: 1, activeOrgKey: orgKey,
    connections: [{ orgKey, organizationId: '00D000000000001', userId: '005000000000001',
      alias: 'Integration', userName: 'fixture', instanceUrl: 'https://example.my.salesforce.com',
      loginHost: 'test.salesforce.com', environmentKind: 'SANDBOX', status: 'CONNECTED' }] } });
  viewState.setState({ dialogStack: [] });
  objectPanelState.getState().resetTab();
}

function Harness() {
  const dialogStack = viewState(state => state.dialogStack);
  return <><button onClick={() => viewState.getState().pushDialog(Dialog.WhereDialog)}>Open editor</button>
    {dialogStack.includes(Dialog.WhereDialog) && <FieldDialog />}</>;
}
afterEach(() => { cleanup(); jest.restoreAllMocks(); });

test('dialog opens on SELECT, traps focus, supports arrow keys and Escape restores the trigger', () => {
  setup();
  render(<Harness />);
  const trigger = screen.getByRole('button', { name: 'Open editor' });
  trigger.focus();
  fireEvent.click(trigger);
  const dialog = screen.getByRole('dialog', { name: 'Edit field: Name' });
  expect(dialog).toHaveAttribute('aria-modal', 'true');
  expect(screen.getByRole('tab', { name: 'Select' })).toHaveFocus();
  const close = screen.getByRole('button', { name: 'Close dialog' });
  close.focus();
  fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
  expect(screen.getByRole('button', { name: 'View all ORDER BY fields' })).toHaveFocus();
  fireEvent.keyDown(screen.getByRole('button', { name: 'View all ORDER BY fields' }), { key: 'Tab' });
  expect(close).toHaveFocus();
  screen.getByRole('tab', { name: 'Select' }).focus();
  fireEvent.keyDown(screen.getByRole('tab', { name: 'Select' }), { key: 'ArrowRight' });
  expect(screen.getByRole('tab', { name: 'Where' })).toHaveFocus();
  expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'field-dialog-W');
  fireEvent.keyDown(dialog, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});

test('SELECT, WHERE and ORDER BY show applied state and route to the global panels', () => {
  setup();
  render(<Harness />);
  fireEvent.click(screen.getByRole('button', { name: 'Open editor' }));
  const dialog = screen.getByRole('dialog');
  expect(within(dialog).getByText(/Organization: Integration/)).toHaveTextContent(orgKey);
  expect(within(dialog).getByText(/Object: Account/)).toHaveTextContent('Query block: Account');
  fireEvent.click(screen.getByRole('checkbox', { name: /Default/i }));
  expect(within(dialog).getByText('SELECT: Name')).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Block: Account');
  fireEvent.click(screen.getByRole('tab', { name: 'Where' }));
  expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  fireEvent.change(screen.getByRole('textbox', { name: 'Value' }), { target: { value: 'Ada' } });
  expect(screen.getByRole('button', { name: 'Apply' })).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  expect(within(dialog).getByText("WHERE: C1 Name = 'Ada'")).toBeInTheDocument();
  expect(screen.getByText('WHERE condition added to Account.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('tab', { name: 'Order' }));
  fireEvent.change(screen.getByRole('combobox', { name: 'Direction' }), { target: { value: 'DESC' } });
  fireEvent.change(screen.getByRole('combobox', { name: 'NULLS policy' }), { target: { value: 'FIRST' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add' }));
  expect(within(dialog).getByText('ORDER BY: 1. Name DESC NULLS FIRST')).toBeInTheDocument();
  expect(modelState.getState().sqlState.sql).toBe("SELECT Name FROM Account WHERE Name = 'Ada' ORDER BY Name DESC NULLS FIRST");
  fireEvent.click(screen.getByRole('button', { name: 'View all ORDER BY fields' }));
  expect(objectPanelState.getState().activeTab).toBe('order');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('changing the field while mounted updates the heading and clears applied feedback', () => {
  setup();
  render(<FieldDialog />);
  act(() => modelState.setState({ state: { ...modelState.getState().state,
    currentField: { ...currentField, fieldApiName: 'OtherName', fieldLocalId: 1 } } }));
  expect(screen.getByRole('dialog', { name: 'Edit field: OtherName' })).toBeInTheDocument();
  expect(screen.getByText('SELECT: None')).toBeInTheDocument();
});
