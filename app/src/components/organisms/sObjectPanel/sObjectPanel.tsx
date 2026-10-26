import css from './style.module.css';
import SOQLPanel from "../SOQLPanel/soqlPanel";
import TableFields, {TableFieldsExtend}  from "../tableFields/tableFields";
import TableChildRelationShips from '../tableChildRelationShips/tableChildRelationShips';
import viewState from '../../../store/viewState';
import { useSyncExternalStore } from 'react';
import sessionState from '../../../store/sessionState';
import modelState from '../../../store/modelState';
import { metadataObjectStatus, subscribeMetadata } from '../../../services/salesforceSchema/snapshotAdapter';

const statusText = { EMPTY: 'Sin datos', FRESH: 'Vigente', STALE: 'Obsoleta',
    REFRESHING: 'Actualizando', ERROR: 'Error al actualizar' } as const;




export default function SObjectPanel () {
const { currentView } = viewState();
const orgKey = sessionState(state => state.publicSession.activeOrgKey);
const objectName = modelState(state => state.state.sObjectApiName);
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
            <SOQLPanel/>
            <div className={css.container}>
                <TableFields/>
                <TableChildRelationShips/>
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
