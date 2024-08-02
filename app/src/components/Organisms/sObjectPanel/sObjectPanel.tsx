import css from './style.module.css';
import SOQLPanel from "../SOQLPanel/SOQLPanel";
import TableFields from "../tableFields/tableFields";
import TableChildRelationShips from '../tableChildRelationShips/tableChildRelationShips';


const onActionRowHandle = (rowId: string, action: string) => {
    console.log('onRowActionHandle:' + action + ' [' + rowId + ']');
}



export default function SObjectPanel () {
    return (
        <div>
            <SOQLPanel/>
            <div className={css.container}>
                <TableFields/>
                <TableChildRelationShips/>
            </div>
        </div>
    );
}