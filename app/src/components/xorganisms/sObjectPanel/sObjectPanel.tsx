import css from './style.module.css';
import SOQLPanel from "../SOQLPanel/xsoqlPanel";
import TableFields from "../tableFields/tableFields";
import TableChildRelationShips from '../tableChildRelationShips/tableChildRelationShips';
import viewState from '../../../store/viewState';




export default function SObjectPanel () {
const {currentView} = viewState();
console.log('*****SObjectPanel', currentView);    
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