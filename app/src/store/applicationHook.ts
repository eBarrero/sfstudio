import { useState, useEffect } from "react";
import {t} from '../utils/utils'
import applicationState  from "./applicationState";
import { CONTEXT_LEVEL}  from "../core/commandManager";
import dataState from "./dataState";
import modelState from "./modelState";
import sessionState from "./sessionState";
import viewState from "./viewState";




const useApplication = () => {
    const [history, sethistory] = useState<string>(''); 
    const [lastError, setLastError] = useState<string | null>(null);
    const application = applicationState();
    const data = dataState();
    const model = modelState();
    const session = sessionState();
    const view = viewState();
    const currentCommand = application.currentCommand;
    const context_level = application.context_level;
    const suggestions = application.suggestions;

    useEffect(() => { 
        console.log('useEffect session');
        if (session.publicSession.connections.length === 0) {
            application.setContextLevel(CONTEXT_LEVEL.INIT);
            return;
        }
        console.log('useEffect session : ' + session.publicSession.connections[0].name);
        model.setOrg(session.publicSession.connections[0].name);
        data.loadSchema(session.publicSession.connections[0].name);
        view.setCurrentView(CONTEXT_LEVEL.ORG);
        application.setContextLevel(CONTEXT_LEVEL.ORG);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session.publicSession]);


    useEffect(() => {
        setLastError(application.errorState===undefined ? '': t(application.errorState));
        if (application.commandConfirmed===undefined  && application.filterConfirmed!=='') {
            if (context_level === CONTEXT_LEVEL.ORG) {
                sethistory(application.filterConfirmed! + '\n' + history);  
                data.loadFieldsByName(model.state.orgSfName, application.filterConfirmed!, (sObjectLocalId: SObjectLocalId) => {
                    application.setContextLevel(CONTEXT_LEVEL.OBJECT);
                    view.setCurrentView('sobject');
                    model.setSObject(sObjectLocalId);
                    data.loadChildRelationships(model.state.orgSfName, sObjectLocalId);    
                });  
            }
            return;
        }
        try {
            if (application.commandConfirmed!==undefined) { 
                application.commandConfirmed.action({data,model,view, application});
                sethistory(application.currentCommand + '\n' + history);  
            }    
            application.setCommand(null);
        } catch (e) {
            setLastError(t((e as Error).message));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [application.commandConfirmed, application.filterConfirmed, application.errorState]);


    useEffect(() => {
        setLastError(data.dataLastErrorMessage==='' ? '': t(data.dataLastErrorMessage));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.dataLastErrorMessage]);




    const setCommand = (newCommand: string | null) => {
        if (newCommand===null || newCommand.charAt(0)!=='.')   { 
            if (context_level === CONTEXT_LEVEL.ORG)  data.setObjectFilterText(model.state.orgSfName, newCommand!);
            if (context_level === CONTEXT_LEVEL.OBJECT) data.setFieldFilterText(model.state.orgSfName, model.state.sObjectLocalId, newCommand!);
        } 
        application.setCommand(newCommand);
        
    }
    const exeCommand = (newCommand: string) => {
        setLastError(null);
        application.exeCommand(newCommand)
    }
    
    
    const helpOnLine = application.helpOnLine && t(application.helpOnLine);
    return {setCommand, exeCommand, currentCommand, history, lastError, helpOnLine, context_level, suggestions};
}

export default useApplication;