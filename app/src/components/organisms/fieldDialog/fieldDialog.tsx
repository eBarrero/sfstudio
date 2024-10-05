import { useState } from 'react';
import css from './style.module.css'



import modelState  from '../../../store/modelState';  
import viewState from '../../../store/viewState';

// Components


import TitleBar from '../../atoms/TitleBar/titleBar';
import Tabs     from '../../atoms/Tabs/tabs';
import Select from './selectBuilder';
import WhereDataTime from './whereBuilder/dataTime';
import Orderby from './orderByBuilder';








const FieldDialog = () => { 
    const { state, addWhere, currentSOQLFieldSelection, doFieldAction   }  = modelState();
    const { currentField, currentPath }  = state;
    const { popDialog } = viewState();  

    const [currentTab, setCurrentTab] = useState('W');

    function onClose() {
        popDialog();
    }   

    const hanndleDoFieldAction = ( action: string, value: string,  isAggregateFunction:boolean, makeGroupBy:boolean) => {
        if (currentField) {
            doFieldAction(currentField.fieldLocalId, action, value, isAggregateFunction,  makeGroupBy);
        }
    }


    return (
        <article className={css.container}>
            <div className={css.win}>
                {currentField &&  <>
                    <TitleBar title={`${currentField.type} - ${currentPath}${currentField.fieldApiName}`} onClose={onClose}  />
                    <Tabs tabs={[['Select',"S"],['Where',"W"],['Order',"O"]]} value={currentTab} onTabChange={setCurrentTab}/>
                    {currentTab === 'S' && <Select 
                                                typeField={currentField.type} 
                                                currentFieldSelection={currentSOQLFieldSelection.get(currentField.fieldLocalId)!} 
                                                doFieldAction={hanndleDoFieldAction} />}
                    {currentTab === 'W' && currentField.type === 'datetime' &&
                                                <WhereDataTime 
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

















