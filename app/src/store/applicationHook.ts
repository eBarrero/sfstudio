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
    const filter = application.filter;

    useEffect(() => { 
        try {
            if (session.publicSession.currentConnection===null) {
                application.setContextLevel(CONTEXT_LEVEL.INIT);
                return;
            }
            const index = session.publicSession.currentConnection;
            console.log(`currentConnection: ${session.publicSession.currentConnection}`);
            model.setOrg(session.publicSession.connections[index].name);
            data.loadSchema(session.publicSession.connections[index].name);
            view.setCurrentView(CONTEXT_LEVEL.ORG);
            application.setContextLevel(CONTEXT_LEVEL.ORG);
        } catch (e) {
            console.log((e as Error).message);
            setLastError((e as Error).message);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session.publicSession]);


    useEffect(() => {
        if (filter==='') return;
        if (context_level === CONTEXT_LEVEL.ORG) {
            sethistory(filter! + '\n' + history);  
            data.loadFieldsByName(model.state.orgSfName, application.filter!, (sObjectLocalId: SObjectLocalId) => {
                application.setContextLevel(CONTEXT_LEVEL.OBJECT);
                view.setCurrentView('sobject');
                model.setSObject(sObjectLocalId);
                data.loadChildRelationships(model.state.orgSfName, sObjectLocalId);    
            });  
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }   , [application.filter]);


    useEffect(() => {
        setLastError(application.errorState===undefined ? '': t(application.errorState));
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
    }, [application.commandConfirmed, application.filter, application.errorState]);


    useEffect(() => {
        setLastError(data.dataLastErrorMessage==='' ? '': t(data.dataLastErrorMessage));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.dataLastErrorMessage]);



    const sendFilter = (newFileter: string | null) => {
        if (context_level === CONTEXT_LEVEL.ORG)    data.setObjectFilterText(model.state.orgSfName, newFileter!);
        if (context_level === CONTEXT_LEVEL.OBJECT) data.setFieldFilterText(model.state.orgSfName, model.state.sObjectLocalId, newFileter!);
        application.setObjectName( (newFileter===null) ? '' : newFileter);
    }


    const setCommand = (newCommand: string | null) => {
        application.setCommand(newCommand);
        
    }
    const exeCommand = (newCommand: string) => {
        setLastError(null);
        application.exeCommand(newCommand)
    }
    
    
    const helpOnLine = application.helpOnLine && t(application.helpOnLine);
    return {setCommand, sendFilter, exeCommand, filter, currentCommand, history, lastError, helpOnLine, context_level, suggestions};
}

export default useApplication;