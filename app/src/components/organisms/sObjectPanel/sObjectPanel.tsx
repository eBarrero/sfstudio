import css from './style.module.css';
import TableFields, {TableFieldsExtend}  from "../tableFields/tableFields";
import TableChildRelationShips from '../tableChildRelationShips/tableChildRelationShips';
import viewState from '../../../store/viewState';
import { useSyncExternalStore } from 'react';
import sessionState from '../../../store/sessionState';
import modelState from '../../../store/modelState';
import { metadataObjectStatus, subscribeMetadata } from '../../../services/salesforceSchema/snapshotAdapter';
import objectPanelState from '../../../store/objectPanelState';
import { VIEW_CMD } from '../../../core/commandManager';
import { IconCharacter } from '../../constants';
import { dispatchObjectPanelAction, OBJECT_PANEL_ACTION } from '../../../core/objectPanelActions';
import type { KeyboardEvent } from 'react';

const statusText = { EMPTY: 'Sin datos', FRESH: 'Vigente', STALE: 'Obsoleta',
    REFRESHING: 'Actualizando', ERROR: 'Error al actualizar' } as const;




export default function SObjectPanel () {
const { currentView } = viewState();
const orgKey = sessionState(state => state.publicSession.activeOrgKey);
const objectName = modelState(state => state.state.sObjectApiName);
const activeTab = objectPanelState(state => state.activeTab);
const onTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const selectRelations = event.key === 'ArrowRight' || event.key === 'End';
    const selectFields = event.key === 'ArrowLeft' || event.key === 'Home';
    if (!selectFields && !selectRelations) return;
    event.preventDefault();
    dispatchObjectPanelAction(selectRelations ? OBJECT_PANEL_ACTION.SHOW_RELATIONS : OBJECT_PANEL_ACTION.SHOW_FIELDS);
    const targetId = selectRelations ? 'object-relations-tab' : 'object-fields-tab';
    event.currentTarget.querySelector<HTMLButtonElement>(`#${targetId}`)?.focus();
};
const status = useSyncExternalStore(subscribeMetadata,
    () => metadataObjectStatus(orgKey ?? '', objectName),
    () => metadataObjectStatus('', ''));
    return (
        <>
        {orgKey && <p role="status">Metadata {statusText[status.state]}
            {status.fetchedAt !== null && ` · ${new Date(status.fetchedAt).toLocaleString()}`}
        </p>}
        {currentView === 'sobject' && (
        <div>
            <div role="tablist" aria-label="Contenido del objeto" className={css.tabs} onKeyDown={onTabKeyDown}>
                <button type="button" role="tab" id="object-fields-tab" aria-controls="object-fields-panel"
                    aria-selected={activeTab === 'fields'} tabIndex={activeTab === 'fields' ? 0 : -1}
                    data-action-id={VIEW_CMD.SHOW_FIELDS.actionId}
                    onClick={() => dispatchObjectPanelAction(OBJECT_PANEL_ACTION.SHOW_FIELDS)}>
                    <span aria-hidden="true">{IconCharacter.FIELDS}</span> Campos
                </button>
                <button type="button" role="tab" id="object-relations-tab" aria-controls="object-relations-panel"
                    aria-selected={activeTab === 'relations'} tabIndex={activeTab === 'relations' ? 0 : -1}
                    data-action-id={VIEW_CMD.SHOW_RELATIONS.actionId}
                    onClick={() => dispatchObjectPanelAction(OBJECT_PANEL_ACTION.SHOW_RELATIONS)}>
                    <span aria-hidden="true">{IconCharacter.RELATIONS}</span> Relaciones hijas
                </button>
            </div>
            <div className={css.container}>
                {activeTab === 'fields' ?
                    <div role="tabpanel" id="object-fields-panel" aria-labelledby="object-fields-tab"><TableFields/></div> :
                    <div role="tabpanel" id="object-relations-panel" aria-labelledby="object-relations-tab"><TableChildRelationShips/></div>}
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
