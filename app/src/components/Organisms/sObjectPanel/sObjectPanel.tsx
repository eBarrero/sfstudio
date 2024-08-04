import css from './style.module.css';
import SOQLPanel from "../SOQLPanel/SOQLPanel";
import TableFields from "../tableFields/tableFields";
import TableChildRelationShips from '../tableChildRelationShips/tableChildRelationShips';





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