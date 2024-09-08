import css from './style.module.css';
import { GridTable, GridTableRow } from "../../xatoms/GridTable/gridTable";
import { objectFilterOptions } from "../../../core/constants/filters";
import applicationState from '../../../store/applicationState';
import dataState            from "../../../store/dataState";
import { useTranslation } from 'react-i18next';







const ObjectFilter = () => {
    const { exeCommandFromUI } = applicationState();
    const { sObjectsFilter } = dataState();
    const { t } = useTranslation();

    function onActionRowHandle(rowId: string, action: string) {
        exeCommandFromUI(`.${rowId} ${ (action==='TRUE')?'':(action==='FALSE')?'off':'rm' }`) ;
        
        
    }
    


    return (
        <div className={css.PanelSObjectsFilter}>
            <GridTable
                headerOff={false}
                selectable={false}
                selectValues={[{value:"TRUE", label:'true'},{value:"FALSE", label:'false'},{value:"NULL", label:'-'}]}   
                onActionRow={onActionRowHandle}
                columns={[{label:''},{label:'Attribute'},{label:'description'}]}
                data={objectFilterOptions.map((option): GridTableRow => ({
                    rowId: option.name,
                    selectedValue:(sObjectsFilter[option.name]===null)?'NULL':(sObjectsFilter[option.name]===true)?'TRUE':'FALSE',
                    data:[
                        {label:option.description},
                        {label:t(`sObject.attribute.${option.name}`)}
                    ]
                }))}  
                />                          
        </div>        
    );
};

export default ObjectFilter;