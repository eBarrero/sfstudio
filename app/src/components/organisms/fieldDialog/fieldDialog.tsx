import { useState } from 'react';
import css from './style.module.css'
import { fieldCapabilities, fieldEditorContext, selectedFunctions } from '../../../core/soql/fieldEditor';


import modelState  from '../../../store/modelState';  
import viewState from '../../../store/viewState';

// Components


import TitleBar from '../../atoms/TitleBar/titleBar';
import Tabs     from '../../atoms/Tabs/tabs';
import Select from './selectBuilder';
import WhereBuilder from './whereBuilder/whereBuilder';
import OrderByBuilder from './orderByBuilder';









const FieldDialog = () => { 
    const { state, queryState, addWhere, doFieldAction } = modelState();
    const { currentField, currentPath }  = state;
    const { popDialog } = viewState();  

    const [currentTab, setCurrentTab] = useState('W');
    const capabilities = currentField ? fieldCapabilities(currentField.type) : undefined;
    const whereDialog = capabilities?.where ?? 'NOT_ALLOWED';
    const activeTab = currentTab === 'W' && whereDialog === 'NOT_ALLOWED' ? 'S' : currentTab;
    const context = currentField ? fieldEditorContext(queryState, queryState.indexCurrentElement, currentField) : undefined;

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
                    <Tabs tabs={whereDialog === 'NOT_ALLOWED'
                        ? [['Select', 'S'], ['Order', 'O']]
                        : [['Select', 'S'], ['Where', 'W'], ['Order', 'O']]}
                        value={activeTab} onTabChange={setCurrentTab}/>
                    {activeTab === 'S' && <Select
                                                typeField={currentField.type} 
                                                selectedFunctions={context ? selectedFunctions(queryState, context) : []}
                                                doFieldAction={hanndleDoFieldAction} />}
                    {activeTab === 'W' && whereDialog !== 'NOT_ALLOWED' && <WhereBuilder
                        key={`${queryState.indexCurrentElement}:${currentField.fieldApiName}`}
                        applyNewCondition={addWhere} field={currentField} path={currentPath ?? ''} />}

                    {activeTab === 'O' && <OrderByBuilder key={`${queryState.indexCurrentElement}:${currentField.fieldApiName}`}
                        field={currentField} path={currentPath ?? ''} />}


                </>}
            </div>
        </article>
    );
} 

export default FieldDialog ;

















