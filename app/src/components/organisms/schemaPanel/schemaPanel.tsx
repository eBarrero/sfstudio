import css  from  './style.module.css';

import viewState             from '../../../store/viewState';
import dataState             from '../../../store/dataState';
import applicationState      from '../../../store/applicationState';
import ObjectFilter             from '../objectFilter/objectFilter';

export default function SObjectsPanel() {
    const {setObjectName} = applicationState();

    const {componentShowed} = viewState();
    const {sobjects } = dataState();
 
    function setObject(sObjectApiNameobject: SObjectApiName) {
        setObjectName(sObjectApiNameobject)
        
    }

    
    return (
        <article className={css.PanelSObjects}>
            <span>{`${sobjects.length} SObjects`}</span>
            <section>
                {componentShowed==="OBJECT_FILTER" && (<ObjectFilter/>)}
                
            </section>                
            <section className={css.PanelSObjectsList}>
                {sobjects.map((sobject) => (
                    <div className={css.PanelSObjectItem} key={sobject.sObjectLocalId} 
                        onClick={()=>setObject(sobject.name)}>
                        {sobject.name}
                    </div>))}
            </section>
        </article>

    );
}