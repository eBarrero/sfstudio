import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import css from './style.module.css';
import { fieldCapabilities, fieldEditorContext, selectedFunctions } from '../../../core/soql/fieldEditor';
import { qualifiedFieldName } from '../../../core/soql/whereOwnership';
import { legacyConditionPreview } from '../../../core/soql/legacyAdapter';
import { dispatchObjectPanelAction, OBJECT_PANEL_ACTION } from '../../../core/objectPanelActions';
import modelState from '../../../store/modelState';
import sessionState from '../../../store/sessionState';
import viewState from '../../../store/viewState';
import TitleBar from '../../atoms/TitleBar/titleBar';
import Tabs from '../../atoms/Tabs/tabs';
import Select from './selectBuilder';
import WhereBuilder from './whereBuilder/whereBuilder';
import OrderByBuilder from './orderByBuilder';

/** The initial section is SELECT when no opening intent was supplied. */
export default function FieldDialog() {
  const { state, queryState, addWhere, doFieldAction } = modelState();
  const currentField = state.currentField;
  const popDialog = viewState(value => value.popDialog);
  const connections = sessionState(value => value.publicSession.connections);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [currentTab, setCurrentTab] = useState('S');
  const [feedback, setFeedback] = useState('');
  const context = currentField ? fieldEditorContext(queryState, queryState.indexCurrentElement, currentField) : undefined;
  const owner = context ? queryState.queryElemnts[context.ownerIndex] as PrimaryQuery | NestedQuery : undefined;
  const currentElement = queryState.queryElemnts[queryState.indexCurrentElement];
  const path = context?.relationshipPath.join('.') ?? '';
  const fieldPath = `${path ? `${path}.` : ''}${currentField?.fieldApiName ?? ''}`;
  const capabilities = currentField ? fieldCapabilities(currentField.type) : undefined;
  const availableTabs: [string, string][] = capabilities?.where === 'NOT_ALLOWED'
    ? [['Select', 'S'], ['Order', 'O']]
    : [['Select', 'S'], ['Where', 'W'], ['Order', 'O']];
  const activeTab = availableTabs.some(([, code]) => code === currentTab) ? currentTab : 'S';
  const org = connections.find(connection => connection.orgKey === context?.orgKey);
  const blockName = owner?.sObjectId.sObjectApiName ?? 'query';
  const selections = context ? selectedFunctions(queryState, context) : [];
  const conditions = owner?.where?.flatMap((condition, index) =>
    qualifiedFieldName(condition.field) === fieldPath ? [{ condition, index }] : []) ?? [];
  const orders = owner?.orderBy?.flatMap((order, index) =>
    qualifiedFieldName(order.field) === fieldPath ? [{ order, index }] : []) ?? [];

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.querySelector<HTMLButtonElement>('[role="tab"]')?.focus();
    return () => previousFocus?.focus();
  }, []);
  useEffect(() => setFeedback(''), [fieldPath, context?.ownerIndex]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      popDialog();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [...(dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]') ?? [])];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || !dialogRef.current?.contains(document.activeElement))) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current?.contains(document.activeElement))) {
      event.preventDefault(); first.focus();
    }
  }
  function openPanel(action: typeof OBJECT_PANEL_ACTION.SHOW_WHERE | typeof OBJECT_PANEL_ACTION.SHOW_ORDER) {
    popDialog();
    dispatchObjectPanelAction(action);
  }

  return <div className={css.container}>
    <div className={css.win} ref={dialogRef} role="dialog" aria-modal="true"
      aria-labelledby="field-dialog-heading" onKeyDown={onKeyDown} tabIndex={-1}>
      <TitleBar titleId="field-dialog-heading" title={`Edit field: ${fieldPath || 'No field selected'}`}
        onClose={popDialog} />
      {currentField && context && owner && <>
        <p className={css.context}>Organization: {org?.alias ?? context.orgKey} ({context.orgKey})<br />
          Object: {currentElement.sObjectId.sObjectApiName} · Query block: {blockName}<br />
          Field: {fieldPath}</p>
        <Tabs idPrefix="field-dialog" tabs={availableTabs} value={activeTab} onTabChange={setCurrentTab} />
        {availableTabs.map(([, code]) => <div key={code} role="tabpanel"
          id={`field-dialog-${code}-panel`} aria-labelledby={`field-dialog-${code}`}
          hidden={code !== activeTab}>
          {code === 'S' && code === activeTab && <Select key={`${context.elementIndex}:${fieldPath}`}
            typeField={currentField.type} selectedFunctions={selections}
            doFieldAction={(action, value, aggregate, groupBy) =>
              doFieldAction(currentField.fieldLocalId, action, value, aggregate, groupBy)}
            onApplied={message => setFeedback(`${message} Block: ${blockName}.`)} />}
          {code === 'W' && code === activeTab && <WhereBuilder key={`${context.elementIndex}:${fieldPath}`}
            applyNewCondition={addWhere} field={currentField} path={state.currentPath ?? ''}
            onApplied={() => setFeedback(`WHERE condition added to ${blockName}.`)} />}
          {code === 'O' && code === activeTab && <OrderByBuilder key={`${context.elementIndex}:${fieldPath}`}
            field={currentField} path={state.currentPath ?? ''}
            onApplied={() => setFeedback(`ORDER BY field added to ${blockName}.`)} />}
        </div>)}
        {feedback && <p role="status">{feedback}</p>}
        <section className={css.applied} aria-label="Applied query clauses">
          <h3>Applied to this field</h3>
          <p>SELECT: {selections.length ? selections.map(value => value.replace('%1', fieldPath)).join(', ') : 'None'}</p>
          <p>WHERE: {conditions.length ? conditions.map(({ condition, index }) =>
            `C${index + 1} ${legacyConditionPreview(condition)}`).join('; ') : 'None'}</p>
          <p>ORDER BY: {orders.length ? orders.map(({ order, index }) =>
            `${index + 1}. ${fieldPath} ${order.direction} NULLS ${order.nulls}`).join('; ') : 'None'}</p>
          <button type="button" onClick={() => openPanel(OBJECT_PANEL_ACTION.SHOW_WHERE)}>View all WHERE conditions</button>{' '}
          <button type="button" onClick={() => openPanel(OBJECT_PANEL_ACTION.SHOW_ORDER)}>View all ORDER BY fields</button>
        </section>
      </>}
    </div>
  </div>;
}
