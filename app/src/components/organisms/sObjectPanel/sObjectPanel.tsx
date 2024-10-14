import css from './style.module.css';
import SOQLPanel from "../SOQLPanel/soqlPanel";
import TableFields, {TableFieldsExtend}  from "../tableFields/tableFields";
import TableChildRelationShips from '../tableChildRelationShips/tableChildRelationShips';
import viewState from '../../../store/viewState';




export default function SObjectPanel () {
const { currentView } = viewState();
console.log('*****SObjectPanel', currentView);    
    return (
        <>
        {currentView === 'sobject' && (
        <div>
            <SOQLPanel/>
            <div className={css.container}>
                <TableFields/>
                <TableChildRelationShips/>
            </div>
        </div>
        )}

        {currentView === 'OBJECT_EXTEND' && (
        <div>
            <div className={css.containerExtended}>
                <TableFieldsExtend/>
            </div>
        </div>
        )}
        </>
    );
}