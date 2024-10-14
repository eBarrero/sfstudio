import { useState, useEffect } from 'react';
import css from './style.module.css'
import { t } from '../../../utils/utils';
import {salesforceFieldTypesDefinition, SelectComponent} from '../../../core/constants/fields';


import modelState  from '../../../store/modelState';  
import viewState from '../../../store/viewState';

// Components


import TitleBar from '../../atoms/TitleBar/titleBar';
import Tabs     from '../../atoms/Tabs/tabs';
import Select from './selectBuilder';
import WhereDataTime from './whereBuilder/dataTime';
import WhereTextField from './whereBuilder/textFields';
import WhereNumberField from './whereBuilder/numberFields';
import Orderby from './orderByBuilder';









const FieldDialog = () => { 
    const { state, addWhere, currentSOQLFieldSelection, doFieldAction   }  = modelState();
    const { currentField, currentPath }  = state;
    const { popDialog } = viewState();  

    const [currentTab, setCurrentTab] = useState('W');
    const [whereDialog, setWhereDialog] = useState<SelectComponent>('NOT_ALLOWED');

    function onClose() {
        popDialog();
    }   

    const hanndleDoFieldAction = ( action: string, value: string,  isAggregateFunction:boolean, makeGroupBy:boolean) => {
        if (currentField) {
            doFieldAction(currentField.fieldLocalId, action, value, isAggregateFunction,  makeGroupBy);
        }
    }

    
    useEffect(() => {
            if (!currentField) return;
            console.log('currentField.type', currentField.type);
            const typeDefinition = salesforceFieldTypesDefinition.get(currentField.type);
            console.log('typeDefinition', typeDefinition);
            setWhereDialog(typeDefinition!.selectComponent);
            

    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    return (
        <article className={css.container}>
            <div className={css.win}>
                {currentField &&  <>
                    <TitleBar title={`${currentField.type} - ${currentPath}${currentField.fieldApiName}`} onClose={onClose}  />
                    {whereDialog !== 'NOT_ALLOWED' && 
                    <Tabs tabs={[['Select',"S"],['Where',"W"],['Order',"O"]]} value={currentTab} onTabChange={setCurrentTab}/>}
                    {whereDialog === 'NOT_ALLOWED' && <div>{t('#NOTE.TYPE.CANNOT.BEUSED.IN.SOQL')}</div>}
                    {currentTab === 'S' && <Select 
                                                typeField={currentField.type} 
                                                currentFieldSelection={currentSOQLFieldSelection.get(currentField.fieldLocalId)!} 
                                                doFieldAction={hanndleDoFieldAction} />}
                    {currentTab === 'W' && whereDialog === 'DATATIME' &&
                                                <WhereDataTime 
                                                applyNewCondition={addWhere}     
                                                field={currentField} 
                                                path={ (currentPath===undefined) ?'':currentPath } />}
                    {currentTab === 'W' && whereDialog === 'TEXT' &&
                                                <WhereTextField 
                                                applyNewCondition={addWhere}     
                                                field={currentField} 
                                                path={ (currentPath===undefined) ?'':currentPath } />}
                    {currentTab === 'W' && whereDialog === 'NUMBER' &&
                                                <WhereNumberField 
                                                applyNewCondition={addWhere}     
                                                field={currentField} 
                                                path={ (currentPath===undefined) ?'':currentPath } />}


                    {currentTab === 'O' && <Orderby/>}
                </>}
            </div>
        </article>
    );
} 

export default FieldDialog ;

















