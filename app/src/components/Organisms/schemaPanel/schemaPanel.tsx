import { useState } from 'react';
import css  from  './style.module.css';
import useModelState  from '../../../store/modelState';
import useViewState from '../../../store/viewState';
import useDataState from '../../../store/dataState';


export default function SObjectsPanel() {
    
    const {state, setSObject} = useModelState();
    const {currentView, setCurrentView} = useViewState();
    const {sobjects, loadFields } = useDataState();
 
    function setObject(sObjectIndex: number) {
        loadFields(state.orgSfName, sObjectIndex);
        setCurrentView('sobject');
        setSObject(sObjectIndex);
    }


    return (
        <article className={`${(currentView!=='MAIN')?'invisible':''} ${css.PanelSObjects}`}>
            {state.orgSfName!=='' && 
                <section className={css.PanelSObjectsList}>
                    {sobjects.map((sobject) => (
                        <div className={css.PanelSObjectItem} key={state.orgSfName + sobject.sObjectLocalId} 
                            onClick={()=>setObject(sobject.sObjectLocalId)}>
                            {sobject.name}
                        </div>))}
                </section>
            }
            {state.orgSfName!=='' ?? <div>There are no objects</div>} 
        </article>
    );
}