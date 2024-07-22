
import css  from './this.module.css'
import SVGIcon from '../Icons';

export interface GridTableCell {
    label: string
    subLabel?: string
    iconType?: string 
    tooltip?: string
    action?: string    
} 

export interface GridTableRow {
    rowId: string
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
            <input type="checkbox" defaultChecked={checked} onChange={chengeHandler} />
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
         onAcionHandler('Click');
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




interface GridTableRowProps{
    selectable?: boolean;
    row: GridTableRow;
    columns: GridTableColumnsProps[];
    onActionRow: (rowId: string, action: string) => void;
}


export const GridTableRow: React.FC<GridTableRowProps> = (props) => {
    const {selectable, row, columns, onActionRow} = props;

    const changeSelectHandler = (checked:boolean):void => {
        onActionRow(row.rowId, (checked)? 'SELECTED' : 'UNSELECTED');  
    }

    const onActiontHandler = (action: string):void => {
        onActionRow(row.rowId, action);
    }

    return (   
        <div className={css.gridTableRow}> 
            {(selectable??true) && <GridTableCheckbox key={`${row.rowId}_c`}  checked={false} onSelect={changeSelectHandler}  />}
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
    columns: GridTableColumnsProps[];
    data: GridTableRow[];
    onActionRow: (rowId: string, action: string) => void;
}


export const GridTable: React.FC<GridTableProps> = ({headerOff = false, columns, data, onActionRow}) => {

    const onActionRowHandler = (rowId: string, action:string) =>  {
        onActionRow(rowId, action);
    }
    
    return (
        <div className= {css.gridtable}>
            {!headerOff && (
                <>
                    <GridTableHeader label='' />
                    {columns.map((item, index) => (
                        <GridTableHeader key={index} label={item.label} type={item.type} />
                    ))}
                </>
            )}
            {data.map((item) => {
                return <GridTableRow key={item.rowId}  row={item} columns={columns} onActionRow={onActionRowHandler} />
            })}

        </div>
    )
}




