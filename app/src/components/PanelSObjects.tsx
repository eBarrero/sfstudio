import { useEffect, useState } from 'react';
import { Controller} from '../DataModel/Model';
import './PanelSObjects.css'
import { useAppState } from '../store/AppState';

interface PanelSObjectsProps {
    orgSfName: string;
}







export default function PanelSObjects(props : PanelSObjectsProps) {
    const [filters, setFilters] = useState<FilterSObject>({name:'', custom:true,  queryable: true});
    const [sobjects, setSObjects] = useState<GetSObjectsIndex[]>([]);
    const {showSObject } = useAppState();
    useEffect(() => {
        Controller.getSObjectsIndex(props.orgSfName, filters).then((data) => {
            if (data!==null) setSObjects(data as GetSObjectsIndex[]);
        });
        
        }, [filters, props.orgSfName]);  

    return (
        <article className="PanelSObjects">
            <section className='PanelSObjectsFilter'>
                <span>{props.orgSfName}</span>
                <label>Filter by Name</label>
                <input type="text" value={filters.name} onChange={(e) => setFilters({ ...filters, name: e.target.value.toUpperCase() })} />
            </section>
            <section className='PanelSObjectsList'>
                {sobjects.map((sobject) => (
                    <div className="PanelSObjectItem" key={props.orgSfName + sobject.index} 
                        onClick={()=>showSObject(props.orgSfName, sobject.name, sobject.index)}>
                        {sobject.name}
                    </div>))}
            </section>
        </article>
    );
}