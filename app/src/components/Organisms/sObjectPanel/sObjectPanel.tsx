import css from './style.module.css';
import SOQLPanel from "../SOQLPanel/SOQLPanel";
import TableFields from "../tableFields/tableFields";
import TableChildRelationShips from '../tableChildRelationShips/tableChildRelationShips';
import modelState from '../../../store/modelState';




export default function SObjectPanel () {
const action = modelState().state.action;

    return (
        <div>
            <SOQLPanel/>
            <div className={css.container}>
                <TableFields/>
                {(action === 'sobject') &&  <TableChildRelationShips/>}
            </div>
        </div>
    );
}