import css  from  './style.module.css';
import { useEffect, useSyncExternalStore } from 'react';

import viewState             from '../../../store/viewState';
import dataState             from '../../../store/dataState';
import applicationState      from '../../../store/applicationState';
import ObjectFilter             from '../objectFilter/objectFilter';
import sessionState, { dispatchWorkspaceAction } from '../../../store/sessionState';
import { metadataStatus, subscribeMetadata } from '../../../services/salesforceSchema/snapshotAdapter';
import { dispatchExplorerAction, OBJECT_OPEN_ACTION_ID } from '../../../core/explorerActions';

const statusText = { EMPTY: 'Sin metadata', FRESH: 'Vigente', STALE: 'Obsoleta',
    REFRESHING: 'Actualizando', ERROR: 'Error al actualizar' } as const;

export default function SObjectsPanel() {
    const {componentShowed} = viewState();
    const {sobjects } = dataState();
    const orgKey = sessionState(state => state.publicSession.activeOrgKey);
    const status = useSyncExternalStore(subscribeMetadata,
        () => metadataStatus(orgKey ?? ''), () => metadataStatus(''));
    useEffect(() => {
        if (orgKey && status.state === 'FRESH') dataState.getState().loadSchema(orgKey);
    }, [orgKey, status.fetchedAt, status.state]);
 
    function setObject(sObjectApiNameobject: SObjectApiName) {
        void dispatchExplorerAction({ id: OBJECT_OPEN_ACTION_ID, objectName: sObjectApiNameobject });
        
    }

    
    return (
        <article className={css.PanelSObjects}>
            <span>{`${sobjects.length} SObjects`}</span>
            {orgKey && <div role="status">
                Metadata {statusText[status.state]}
                {status.fetchedAt !== null && ` · ${new Date(status.fetchedAt).toLocaleString()}`}
                <button type="button" data-action-id="metadata.refresh"
                    disabled={status.state === 'REFRESHING'}
                    onClick={() => { void dispatchWorkspaceAction({ id: 'metadata.refresh', orgKey },
                        applicationState.getState().context_level); }}>
                    Actualizar metadata
                </button>
            </div>}
            <section>
                {componentShowed==="OBJECT_FILTER" && (<ObjectFilter/>)}
                
            </section>                
            <section className={css.PanelSObjectsList}>
                {sobjects.map((sobject) => (
                    <button type="button" data-action-id={OBJECT_OPEN_ACTION_ID}
                        className={css.PanelSObjectItem} key={sobject.name}
                        onClick={()=>setObject(sobject.name)}>
                        {sobject.name}
                    </button>))}
            </section>
        </article>

    );
}
