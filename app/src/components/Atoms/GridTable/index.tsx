
import css  from './this.module.css'
import SVGIcon from '../Icons';
import constants from '../../constants';

export interface GridTableCell {
    label: string
    subLabel?: string
    iconType?: string 
    tooltip?: string
    action?: string    
} 

export interface GridTableRow {
    rowId: string
    isSelected?: boolean
    selectedValue?: string | number
    data: GridTableCell[];
}





interface GridTableColumnsProps {
    label: string;
    type?: string;
    visible?: boolean;
}

export const GridTableHeader: React.FC<GridTableColumnsProps> = (props) => {
    const {label, type} = props;
    return (   
        <div className={css.gridTableHeader}> 
            {label} {type}
        </div>
    )
}


interface GridTableCheckboxProps {
    checked: boolean;
    onSelect: (checked:boolean) => void;
}

export const GridTableCheckbox: React.FC<GridTableCheckboxProps> = (props) => {
    const {checked, onSelect} = props;

    const chengeHandler = (e: { target: { checked: boolean; }; }):void => {
        onSelect(e.target.checked);
    }

    return (   
        <div className={css.gridTableCheckbox}> 
            <input type="checkbox"  checked={checked} onChange={chengeHandler} />
        </div>
    )
}



interface GridTableCellProps {
    label: string
    column: GridTableColumnsProps
    optionalTags: {
        subLabel?: string
        iconType?: string 
        tooltip?: string
        action?: string
    }
    onAcionHandler: (action: string) => void
}

const Cell: React.FC<GridTableCellProps> = ({label, optionalTags,  onAcionHandler}) => {
    const {subLabel, iconType, tooltip, action} = optionalTags;

    const onClickOnIconHandler = () => () =>  {
        if (action != undefined)  onAcionHandler(action);
    }   
    const onClickOnLabelHandler = () => () =>  {
         onAcionHandler(constants.ONCLICK);
    }

    return (   
        <div className={css.gridTableCell}> 
            {iconType!=undefined && 
                <div onClick={onClickOnIconHandler()}>
                    <SVGIcon iconType={iconType} tooltip={tooltip} />
                </div>}
            <span className={css.label} onClick={onClickOnLabelHandler()}>{label}<small>{subLabel}</small></span>     
        </div>
    )
}

interface SelectValues {
    value: string | number ;
    label: string;
}


interface GridTableRowProps{
    selectable?: boolean;
    isSelected?: boolean;
    selectedValue?: string | number;
    selectValues?: SelectValues[] | undefined;
    row: GridTableRow;
    columns: GridTableColumnsProps[];
    onActionRow: (rowId: string, action: string) => void;
}


export const GridTableRow: React.FC<GridTableRowProps> = (props) => {
    const {selectable, selectValues, selectedValue, isSelected, row, columns, onActionRow} = props;

    const changeSelectHandler = (checked:boolean):void => {
        onActionRow(row.rowId, (checked)? constants.SELECTED : constants.UNSELECTED);  
    }

    const onActiontHandler = (action: string):void => {
        onActionRow(row.rowId, action);
    }

    const onSelectHandler = (e: { target: { value: string; }; }):void => {
        onActionRow(row.rowId, e.target.value); 
    }

    return (   
        <div className={css.gridTableRow}> 
            {selectValues && 
                <select className={css.select} onChange={onSelectHandler} value={selectedValue}>
                    {selectValues.map((item) => { return (<option key={item.value}  value={item.value}>{item.label}</option>)})}
                 </select>
            }
            
            {(selectable??true) && <GridTableCheckbox key={`${row.rowId}_c`}  checked={isSelected!} onSelect={changeSelectHandler}  />}    
            {row.data.map((item, index) => {
                return <Cell key={`${row.rowId}_${index}`} 
                 onAcionHandler={onActiontHandler}
                 label={item.label} column={columns[index]}
                 optionalTags={{iconType:item.iconType, tooltip:item.tooltip, action:item.action, subLabel:item.subLabel}} />   
            })}
        </div>
    )
}



interface GridTableProps {
    headerOff?: boolean;
    selectable?: boolean;
    selectValues?: SelectValues[];
    columns: GridTableColumnsProps[];
    data: GridTableRow[];
    onActionRow: (rowId: string, action: string) => void;
}


export const GridTable: React.FC<GridTableProps> = ({selectable, selectValues , headerOff = false, columns, data, onActionRow}) => {

    const onActionRowHandler = (rowId: string, action:string) =>  {
        onActionRow(rowId, action);
    }
    
    return (
        <div className= {css.gridtable}>
            {!headerOff && (
                <>
                    {columns.map((item, index) => (
                        <GridTableHeader key={index} label={item.label} type={item.type} />
                    ))}
                </>
            )}
            {data.map((item) => {
                return <GridTableRow key={item.rowId}  selectedValue={item.selectedValue}   selectValues={selectValues} selectable={selectable} isSelected={item.isSelected} row={item} columns={columns} onActionRow={onActionRowHandler} />
            })}

        </div>
    )
}





