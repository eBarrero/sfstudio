import { useState, useEffect } from "react";
import {t} from '../utils/utils'
import applicationState  from "./applicationState";
import { CONTEXT_LEVEL}  from "../constants/application";
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
        if (application.commandConfirmed===undefined) return;
        sethistory(application.lastCommand + '\n' + history);
        try {
            if (application.commandConfirmed.context===CONTEXT_LEVEL.INIT) {
                application.commandConfirmed.action();
            }
            if (application.commandConfirmed.context===CONTEXT_LEVEL.ORG) {
                application.commandConfirmed.action(model.state.orgSfName, application.lastCommand);
            }
            if (application.commandConfirmed.context===CONTEXT_LEVEL.OBJECT) {
                application.commandConfirmed.action(model.state.orgSfName, model.state.sObjectLocalId, application.lastCommand);
            }
        } catch (e) {
            setLastError(t((e as Error).message));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [application.commandConfirmed, application.lastCommand, application.errorState]);


    const setCommand = (newCommand: string | null) => {
        if (newCommand===null || newCommand.charAt(0)!=='.')   { 
            application.setCommand(newCommand);
            if (context_level === CONTEXT_LEVEL.ORG)  data.setObjectFilterText(model.state.orgSfName, newCommand!);
            if (context_level === CONTEXT_LEVEL.OBJECT) data.setFieldFilterText(model.state.orgSfName, model.state.sObjectLocalId, newCommand!);
        } else {
            application.setCommand(newCommand);
        }
    }
    const exeCommand = (newCommand: string) => {
        setLastError(null);
        if (newCommand.charAt(0)==='.') { application.exeCommand(newCommand); return; }
        if (context_level === CONTEXT_LEVEL.ORG) {
            console.log('HOOK setCommand', context_level);
            data.loadFieldsByName(model.state.orgSfName, currentCommand!, (sObjectLocalId: SObjectLocalId) => {
                application.setContextLevel(CONTEXT_LEVEL.OBJECT);
                view.setCurrentView('sobject');
                model.setSObject(sObjectLocalId);
                data.loadChildRelationships(model.state.orgSfName, sObjectLocalId);                        
            });    
            return;
        }            
        
        
    }
    
    
    const helpOnLine = application.helpOnLine && t(application.helpOnLine);
    return {setCommand, exeCommand, currentCommand, history, lastError, helpOnLine, context_level, suggestions};
}

export default useApplication;