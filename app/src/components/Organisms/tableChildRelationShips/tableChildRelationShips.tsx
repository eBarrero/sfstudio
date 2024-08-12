import css from './style.module.css';
import { GridTable,  GridTableRow } from "../../atoms/GridTable";
import  dataState  from "../../../store/dataState";
import modelState from '../../../store/modelState';


export default function TableChildRelationShips() {
    const { childRelationships, loadFields: getFields }  = dataState()
    const {showRelataionByApiName} = modelState();

    const onActionRowHandle = (rowId: string, action: string) => {
        console.log('onRowActionHandle:' + action + ' [' + rowId + ']');
        const fieldIndex = parseInt(rowId);
        showRelataionByApiName(childRelationships[fieldIndex].childSObject);
        getFields(childRelationships[fieldIndex].childSObject);


    }
    return (
        <div className={css.grid}>
            <GridTable 
            selectable={false}
            headerOff={false}
            onActionRow={onActionRowHandle}
            columns={[{label:'API Name'},{label:'Reference Name'}]} 
            data={childRelationships.map((relation, index):GridTableRow => ({
                rowId:index.toString(), 
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
    );
}



