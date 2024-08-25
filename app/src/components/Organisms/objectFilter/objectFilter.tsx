import css from './style.module.css';
import { GridTable, GridTableRow } from "../../atoms/GridTable";
import { objectFilterOptions } from "../../../constants/filters";
import applicationState from '../../../store/applicationState';
import dataState            from "../../../store/dataState";
import modelState           from '../../../store/modelState';
import { useTranslation } from 'react-i18next';







const ObjectFilter = () => {
    const { setCommand } = applicationState();
    const { sObjectsFilter } = dataState();
    const { state } = modelState();
    const { t } = useTranslation();

    function onActionRowHandle(rowId: string, action: string) {
        setCommand(`.${rowId} ${ (action==='TRUE')?'':(action==='FALSE')?'off':'rm' }`) ;
        setCommand('Enter');
        
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