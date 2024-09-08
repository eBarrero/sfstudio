import css from './style.module.css';
import { GridTable,  GridTableRow } from "../../atoms/GridTable/gridTable";
import  dataState  from "../../../store/dataState";
import applicationState from '../../../store/applicationState';


export default function TableChildRelationShips() {
    const { childRelationships }  = dataState();
    const { exeCommandFromUI } = applicationState();

    const onActionRowHandle = (rowId: string, action: string) => {
        console.log('onRowActionHandle:' + action + ' [' + rowId + ']');
        const sObjectApiName: SObjectApiName = rowId.split('|')[1];
        exeCommandFromUI('.child_' + sObjectApiName);

    }
    return (
        <section>
        <h2>Child Relationships</h2>    
        <div className={css.grid}>
            <GridTable 
            selectable={false}
            headerOff={false}
            onActionRow={onActionRowHandle}
            columns={[{label:'API Name'},{label:'Reference Name'}]} 
            data={childRelationships.map((relation, index):GridTableRow => ({
                rowId:index.toString() + '|' + relation.childSObject, 
                data:[
                    {label:relation.childSObject,
                    iconType : '1toN',
                    tooltip : 'go to relationShip', 
                    action: 'GOTO_RELATION'
                    },  {label:relation.relationshipName}
                ]
            }))}
            />
        </div>
        </section>
    );
}



