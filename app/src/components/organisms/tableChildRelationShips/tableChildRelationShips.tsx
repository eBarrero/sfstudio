import css from './style.module.css';
import { GridTable,  GridTableRow } from "../../atoms/GridTable/gridTable";
import  dataState  from "../../../store/dataState";
import applicationState from '../../../store/applicationState';
import { filterChildRelationships } from '../../../core/filterChildRelationships';


export default function TableChildRelationShips() {
    const childRelationships = dataState(state => state.childRelationships);
    const searchText = dataState(state => state.fieldsFilter.searchText);
    const { exeCommandFromUI } = applicationState();

    const onActionRowHandle = (rowId: string) => {
        const sObjectApiName: SObjectApiName = rowId.split('|')[1];
        exeCommandFromUI('child_' + sObjectApiName);

    }
    return (
        <section className={css.section}>
        <h2>Child Relationships</h2>    
        <div className={css.grid}>
            <GridTable 
            selectable={false}
            headerOff={false}
            onActionRow={onActionRowHandle}
            columns={[{label:'API Name'},{label:'Reference Name'}]} 
            data={filterChildRelationships(childRelationships, searchText).map((relation, index):GridTableRow => ({
                rowId:index.toString() + '|' + relation.childSObject, 
                data:[
                    {label:relation.childSObject,
                    iconType : '1toN',
                    tooltip : 'Open child relationship',
                    action: 'GOTO_RELATION'
                    },  {label:relation.relationshipName}
                ]
            }))}
            />
        </div>
        </section>
    );
}



