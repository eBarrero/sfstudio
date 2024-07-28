import { useState } from 'react';
import css  from  './style.module.css';
import useModelState  from '../../../store/modelState';
import useViewState from '../../../store/viewState';



export default function SObjectsPanel() {
    const [filters, setFilters] = useState<FilterSObject>({name:'', custom:true,  queryable: true});
    const {state, sobjects, showSObject  } = useModelState();
    const {currentView} = useViewState();
 

    return (
        <article className={`${css.PanelSObjects} ${(currentView!=='SObjectsPanel')?'invisible':''}`}> 
            <section className={css.PanelSObjectsFilter}>
                <span>{state.orgSfName}</span>
                <label>Filter by Name</label>
                <input type="text" value={filters.name} onChange={(e) => setFilters({ ...filters, name: e.target.value.toUpperCase() })} />
            </section>
            {state.orgSfName!=='' && 
            <section className={css.PanelSObjectsList}>
                {sobjects.map((sobject) => (
                    <div className={css.PanelSObjectItem} key={state.orgSfName + sobject.index} 
                        onClick={()=>showSObject(state.orgSfName, sobject.name, sobject.index)}>
                        {sobject.name}
                    </div>))}
            </section>
            }
        </article>
    );
}