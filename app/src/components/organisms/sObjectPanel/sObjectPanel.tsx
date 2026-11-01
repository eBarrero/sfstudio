import css from './style.module.css';
import TableFields, {TableFieldsExtend}  from "../tableFields/tableFields";
import TableChildRelationShips from '../tableChildRelationShips/tableChildRelationShips';
import WhereClausePanel from './whereClausePanel';
import OrderClausePanel from './orderClausePanel';
import viewState from '../../../store/viewState';
import { useSyncExternalStore } from 'react';
import sessionState from '../../../store/sessionState';
import modelState from '../../../store/modelState';
import { metadataObjectStatus, subscribeMetadata } from '../../../services/salesforceSchema/snapshotAdapter';
import objectPanelState, { type ObjectPanelTab } from '../../../store/objectPanelState';
import { VIEW_CMD } from '../../../core/commandManager';
import { IconCharacter } from '../../constants';
import { dispatchObjectPanelAction, OBJECT_PANEL_ACTION } from '../../../core/objectPanelActions';
import type { KeyboardEvent } from 'react';

const statusText = { EMPTY: 'No data', FRESH: 'Current', STALE: 'Outdated',
    REFRESHING: 'Refreshing', ERROR: 'Refresh failed' } as const;
const tabOrder: ObjectPanelTab[] = ['fields', 'relations', 'where', 'order'];
const tabActions = [OBJECT_PANEL_ACTION.SHOW_FIELDS, OBJECT_PANEL_ACTION.SHOW_RELATIONS,
    OBJECT_PANEL_ACTION.SHOW_WHERE, OBJECT_PANEL_ACTION.SHOW_ORDER] as const;
const tabIds = ['object-fields-tab', 'object-relations-tab', 'object-where-tab', 'object-order-tab'] as const;




export default function SObjectPanel () {
const { currentView } = viewState();
const orgKey = sessionState(state => state.publicSession.activeOrgKey);
const objectName = modelState(state => state.state.sObjectApiName);
const activeTab = objectPanelState(state => state.activeTab);
const onTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = tabOrder.indexOf(activeTab);
    let next: number;
    if (event.key === 'ArrowRight') next = (current + 1) % tabOrder.length;
    else if (event.key === 'ArrowLeft') next = (current + tabOrder.length - 1) % tabOrder.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabOrder.length - 1;
    else return;
    event.preventDefault();
    dispatchObjectPanelAction(tabActions[next]);
    event.currentTarget.querySelector<HTMLButtonElement>(`#${tabIds[next]}`)?.focus();
};
const status = useSyncExternalStore(subscribeMetadata,
    () => metadataObjectStatus(orgKey ?? '', objectName),
    () => metadataObjectStatus('', ''));
    return (
        <>
        {orgKey && <p role="status">Metadata: {statusText[status.state]}
            {status.fetchedAt !== null && ` · ${new Date(status.fetchedAt).toLocaleString()}`}
        </p>}
        {currentView === 'sobject' && (
        <div>
            <div role="tablist" aria-label="Object content" className={css.tabs} onKeyDown={onTabKeyDown}>
                <button type="button" role="tab" id="object-fields-tab" aria-controls="object-fields-panel"
                    aria-selected={activeTab === 'fields'} tabIndex={activeTab === 'fields' ? 0 : -1}
                    data-action-id={VIEW_CMD.SHOW_FIELDS.actionId}
                    onClick={() => dispatchObjectPanelAction(OBJECT_PANEL_ACTION.SHOW_FIELDS)}>
                    <span aria-hidden="true">{IconCharacter.FIELDS}</span> Fields
                </button>
                <button type="button" role="tab" id="object-relations-tab" aria-controls="object-relations-panel"
                    aria-selected={activeTab === 'relations'} tabIndex={activeTab === 'relations' ? 0 : -1}
                    data-action-id={VIEW_CMD.SHOW_RELATIONS.actionId}
                    onClick={() => dispatchObjectPanelAction(OBJECT_PANEL_ACTION.SHOW_RELATIONS)}>
                    <span aria-hidden="true">{IconCharacter.RELATIONS}</span> Child Relationships
                </button>
                <button type="button" role="tab" id="object-where-tab" aria-controls="object-where-panel"
                    aria-selected={activeTab === 'where'} tabIndex={activeTab === 'where' ? 0 : -1}
                    data-action-id={VIEW_CMD.SHOW_WHERE.actionId}
                    onClick={() => dispatchObjectPanelAction(OBJECT_PANEL_ACTION.SHOW_WHERE)}>
                    Where Clause
                </button>
                <button type="button" role="tab" id="object-order-tab" aria-controls="object-order-panel"
                    aria-selected={activeTab === 'order'} tabIndex={activeTab === 'order' ? 0 : -1}
                    data-action-id={OBJECT_PANEL_ACTION.SHOW_ORDER}
                    onClick={() => dispatchObjectPanelAction(OBJECT_PANEL_ACTION.SHOW_ORDER)}>
                    Order Clause
                </button>
            </div>
            <div className={css.container}>
                {activeTab === 'fields' &&
                    <div role="tabpanel" id="object-fields-panel" aria-labelledby="object-fields-tab"><TableFields/></div>}
                {activeTab === 'relations' &&
                    <div role="tabpanel" id="object-relations-panel" aria-labelledby="object-relations-tab"><TableChildRelationShips/></div>}
                {activeTab === 'where' &&
                    <div role="tabpanel" id="object-where-panel" aria-labelledby="object-where-tab"><WhereClausePanel/></div>}
                {activeTab === 'order' &&
                    <div role="tabpanel" id="object-order-panel" aria-labelledby="object-order-tab"><OrderClausePanel/></div>}
            </div>
        </div>
        )}

        {currentView === 'OBJECT_EXTEND' && (
        <div>
            <div className={css.containerExtended}>
                <TableFieldsExtend/>
            </div>
        </div>
        )}
        </>
    );
}
