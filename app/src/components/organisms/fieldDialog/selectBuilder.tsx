
import { useState, useEffect } from 'react';
import { SQLClauseAllowedByTypeField, SFFieldTypesEnum} from '../../../core/constants/fields';
import { t  } from '../../../utils/utils';
import viewState from '../../../store/viewState';

import constants from '../../constants';
import RetroCheckboxGroup                       from '../../atoms/RetroStyle/RadioGroup/RetroRadioGroup';

interface SelectProps {
    typeField: string;
    currentFieldSelection: SOQLFieldSelectionState;
    doFieldAction(action: string, value: string, isAggregateFunction: boolean, makeGroupBy:boolean ): void;
}

const Select = (props: SelectProps) => {
    const { setMsgbox } = viewState();
    const { typeField, currentFieldSelection, doFieldAction } = props;
    const [selects, setSelects] = useState<string[]>([]);  
    const [selectUnGrouped, setSelectUnGrouped] = useState<{code: string, label: string, help: string}[]>([]);
    const [selectGrouped, setSelectGrouped] = useState<{code: string, label: string, help: string}[]>([]);
    const [mirrors, setMirrors] = useState<string[]>([]);
    useEffect(() => {
        try {
            setSelectUnGrouped( SQLClauseAllowedByTypeField
                .get((typeField) as SFFieldTypesEnum)!
                .filter( (selectClause) => selectClause.unGroupable)
                .map( (selectClause) =>  ({code:selectClause.keyWord, label:selectClause.description, help:t(selectClause.help)}) )
            );
            setSelectGrouped(SQLClauseAllowedByTypeField
                .get((typeField) as SFFieldTypesEnum)!
                .filter( (selectClause) => selectClause.groupable)
                .map( (selectClause) =>  ({code:selectClause.keyWord, label:selectClause.description, help:t(selectClause.help)}) )
            );
            setMirrors(SQLClauseAllowedByTypeField
                .get((typeField) as SFFieldTypesEnum)!
                .filter( (selectClause) => selectClause.makeGroupBy)
                .map( (selectClause) =>  selectClause.keyWord )
            );
        } catch (error) {
            setMsgbox('#Error', 'General Error', (error as Error).message);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    useEffect(() => {
        setSelects([...currentFieldSelection.selectFunction]);
    },[currentFieldSelection.selectFunction]);

    const handelButton = (isAggregateFunction: boolean) => (newCode: string, checked: boolean) =>   {
        try {
            if (checked)  doFieldAction(constants.SELECTED, newCode, isAggregateFunction, mirrors.includes(newCode));
            else  doFieldAction(constants.UNSELECTED, newCode, false, false);
        } catch (error) {
            setMsgbox('#Error', 'SOQL Salsforce rules', (error as Error).message);
            return;
        }

        setSelects( (currentCodes) => {
            if (currentCodes.includes(newCode)) return currentCodes.filter( (code) => code !== newCode);
            else return [...currentCodes, newCode];
        });          
    
    }


    return (
        <div>
            <RetroCheckboxGroup 
                label="Select ungroupped" 
                options={selectUnGrouped} 
                currentCodes={selects}
                onChange={handelButton(false)}
                enabled={true}
                />
            <RetroCheckboxGroup 
                label="Just for Grouping Selects" 
                options={selectGrouped} 
                currentCodes={selects}
                onChange={handelButton(true)}
                enabled={true}
                />
        </div>
        

    );
}

export default Select;