import {create} from 'zustand';
import { addCommand,CONTEXT_LEVEL, SOQL_CMD } from '../constants/application';
import  Proxy  from '../services/salesforceSchema/proxy';
import { salesforceJsontoInlineJson, inlineJsonToArray} from '../utils/inlineJson'



interface SqlExecutionState {
    sqlExecutionStatus: string;
    selectResponse: InlineJsonArray;
    executeSql: (orgSfName: SchemaName, query: string) => void;
    initializeSqlExecution: () => void;
}

const sqlExecutionState = create<SqlExecutionState>((set, get) => {
    return  {
        sqlExecutionStatus: 'INIT',
        selectResponse: ({captions:[], rows:[]}),
        executeSql: (orgSfName: SchemaName, query: string) => {
            Proxy.sendSoqlAdapter(orgSfName, query).then((data) => {
                set({selectResponse: inlineJsonToArray(salesforceJsontoInlineJson(data))});
            });
        },
        initializeSqlExecution: () => {
            // Create command to run a SOQL query
            addCommand({...SOQL_CMD.RUN_SOQL, 
                action: (actionParams: AcctionParams) => {
                    const {model, view, application} = actionParams;
                    get().executeSql(model.state.orgSfName , model.sqlState.sql);
                    view.setCurrentView('SQL_RESULT');                
                    application.setContextLevel(CONTEXT_LEVEL.SQL_EXECUTION);
                }
            });            
        }
    }
});

export default sqlExecutionState;