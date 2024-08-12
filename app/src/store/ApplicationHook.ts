import { useEffect } from "react";
import applicationState  from "./applicationState";
import dataState from "./dataState";
import modelState from "./modelState";
import sessionState from "./sessionState";
import viewState from "./viewState";
import { Commands } from "../constants/application";


const useApplication = () => {
    const application = applicationState();
    const data = dataState();
    const model = modelState();
    const session = sessionState();
    const view = viewState();



    useEffect(() => { 
        console.log('useEffect session');
        if (session.publicSession.connections.length === 0) return;
        console.log('useEffect session : ' + session.publicSession.connections[0].name);
        model.setOrg(session.publicSession.connections[0].name);
        data.loadSchema(session.publicSession.connections[0].name);
        view.setCurrentView('MAIN');
    }, [session.publicSession]);


    useEffect(() => {
        console.log('useEffect command:' + application.command );
         if (application.command === undefined || application.command === null) return;
         if (application.command.action === Commands.LOGIN ) session.loginSFDC();
         if (application.command.action === Commands.FILTER ) view.setComponentShowed('OBJECT_FILTER');
    }, [application.command]);


    const setCommand = (newCommand: string | null) => {
        data.setObjectFilterText(model.state.orgSfName, newCommand!);
        application.setCommand(newCommand);
    }

    const doCommand = (newCommand: CommandDefinition) => {
        application.doCommand(newCommand);
    }
    
    const currentCommand = application.currentCommand;
    const publicSession = session.publicSession;
    const sessionStatus = session.sessionStatus
    const lastCommand = application.command?.command;
    return {sessionStatus, publicSession, setCommand, currentCommand, doCommand, lastCommand};
}

export default useApplication;