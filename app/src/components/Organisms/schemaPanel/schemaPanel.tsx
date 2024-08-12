import css  from  './style.module.css';
import modelState            from '../../../store/modelState';
import viewState             from '../../../store/viewState';
import dataState             from '../../../store/dataState';
import ObjectFilter             from '../objectFilter/objectFilter';

export default function SObjectsPanel() {
    
    const {state, setSObject} = modelState();
    const {currentView, componentShowed, setCurrentView} = viewState();
    const {sobjects } = dataState();
 
    function setObject(sObjectIndex: number) {
        setCurrentView('sobject');
        setSObject(sObjectIndex);
    }


    return (
        <article className={`${(currentView!=='MAIN')?'invisible':''} ${css.PanelSObjects}`}>
            {state.orgSfName!=='' && 
                <>
                    <section>
                        {componentShowed==="OBJECT_FILTER" && (<ObjectFilter/>)}
                    </section>                
                    <section className={css.PanelSObjectsList}>
                        {sobjects.map((sobject) => (
                            <div className={css.PanelSObjectItem} key={state.orgSfName + sobject.sObjectLocalId} 
                                onClick={()=>setObject(sobject.sObjectLocalId)}>
                                {sobject.name}
                            </div>))}
                    </section>
                </>
            }
            {state.orgSfName!=='' ?? <div>There are no objects</div>} 

        </article>

    );
}