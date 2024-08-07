import css from './style.module.css';
import { GridTable, GridTableRow } from "../../atoms/GridTable";
import { objectFilterOptions } from "../../../Constants/filters";
import useDataState            from "../../../store/dataState";
import useModelState           from '../../../store/modelState';
import { useTranslation } from 'react-i18next';







const ObjectFilter = () => {
    const { sObjectsFilter, setObjectFilter } = useDataState();
    const { state } = useModelState();
    const { t } = useTranslation();

    function onActionRowHandle(rowId: string, action: string) {
        console.log('onRowActionHandle:' + action + ' [' + rowId + ']');
        setObjectFilter(state.orgSfName,  rowId, (action==='TRUE')?true:(action==='FALSE')?false:null);
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