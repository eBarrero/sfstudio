import css from './style.module.css';
import SOQLPanel from "../SOQLPanel/SOQLPanel";
import TableFields from "../tableFields/tableFields";
import TableChildRelationShips from '../tableChildRelationShips/tableChildRelationShips';
import useModelState from '../../../store/modelState';




export default function SObjectPanel () {
const action = useModelState().state.action;

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