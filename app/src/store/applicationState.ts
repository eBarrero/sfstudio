
import {create} from 'zustand';
import { addCommand, searchCommand, readCommand, CONTEXT_LEVEL,APP_CMD } from '../core/commandManager';



interface LocalAplicationState {
    context_level: CONTEXT_LEVEL; // Update the type here
    currentCommand:string; 
    filter: string;         
    command?: CommandImplementation;
    commandConfirmed?: CommandImplementation
    errorState?: string;
    helpOnLine?: string;
    suggestions: string[];
}

interface ApplicationState extends LocalAplicationState {
    setObjectName: (newFilter: string) => void;
    setContextLevel: (newContext: CONTEXT_LEVEL) => void;
    setCommand: (newCommand: string | null) => void;    
    exeCommand: (newCommand: string) => void;
    exeCommandFromUI: (newCommand: string) => void;
    initializeApp: () => void;
}

const applicationState = create<ApplicationState>((set, get) => {
    return  {
        context_level: CONTEXT_LEVEL.INIT,
        currentCommand: '',
        filter:'',
        suggestions:[],
        setContextLevel: (newContext: CONTEXT_LEVEL) => {
            if (newContext !== get().context_level) {
                const newState: LocalAplicationState = {
                    context_level: newContext, 
                    currentCommand: '', 
                    helpOnLine:'',  
                    filter: '', 
                    errorState: undefined, 
                    suggestions:[], 
                    command: undefined};
                set(newState);
            }
            
        },
        setObjectName: (newFilter: string ) => {
            set({filter: newFilter});
        },
        setCommand: (newCommand: string | null) => {
            console.log('setCommand', newCommand);

            if (newCommand === null) newCommand = '';
            if (newCommand === '' || (get().currentCommand.startsWith(newCommand) && get().currentCommand !== newCommand))  {
                set({currentCommand: newCommand, errorState: undefined, commandConfirmed: undefined,helpOnLine:'',  suggestions:[]});
                return;
            }

            console.log('setCommand:'+ newCommand + ':');  

            const newState: LocalAplicationState = {context_level: get().context_level, currentCommand: newCommand, helpOnLine:'',  filter: '', errorState: undefined, suggestions:[], command: undefined};            
            const firstWord = newCommand.split(' ')[0];
            const secondWord = newCommand.split(' ')[1] ?? '';
            const {commandNameList, commandImplementation} = searchCommand(firstWord, newState.context_level);
            if (commandNameList.length === 0) {
                newState.errorState = '#CMD.not_Found';
                newState.currentCommand = newCommand;
            } else if (commandNameList.length === 1) {
                const command = commandImplementation!;
                newState.helpOnLine = command.description;
                newState.command  = command;
                newState.currentCommand = command.command + ' ' + secondWord;
            } else  {
                newState.suggestions = commandNameList  ;
            }
            set(newState);
        },
        exeCommand: (newCommand: string) => {


            const newState: LocalAplicationState = {context_level: get().context_level, currentCommand: newCommand, helpOnLine:'',  filter: '', errorState: undefined, suggestions:[], command: undefined};            
            if (get().command !== undefined) {
                newState.commandConfirmed = get().command;
            } else {
                newState.errorState = '#CMD.not_Found';
            }
            set(newState);              
        },
        exeCommandFromUI: (newCommand: string) => {
            console.log('exeCommandFromUI', newCommand);
            const c = newCommand.trim();
            const firstWord = c.split(' ')[0];
            const newState: LocalAplicationState = {context_level: get().context_level, currentCommand: c, helpOnLine:'',  filter: '', errorState: undefined, suggestions:[], command: undefined};   
            const command = readCommand(firstWord, newState.context_level);                     
            if (command !== undefined) {
                newState.commandConfirmed = command;
            } else {
                newState.errorState = '#CMD.not_Found';
            }             
            set(newState);
        },   
             
        initializeApp: () => {
            addCommand( { ...APP_CMD.BACK_FROM_ORG,  action: (params: AcctionParams) => { 
                // missing implementation
                // close salesforce connection
                const { view } = params;
                get().setContextLevel(CONTEXT_LEVEL.INIT) 
                view.setCurrentView('INIT');
                
            }} );
            addCommand( { ...APP_CMD.BACK_FROM_OBJ,  action: (params: AcctionParams ) => { 
                const { view, model } = params;
                view.setCurrentView(CONTEXT_LEVEL.ORG);
                model.setOrg(model.state.orgSfName);
                get().setContextLevel(CONTEXT_LEVEL.ORG);
            }} );
            addCommand( { ...APP_CMD.BACK_FROM_SQL,  action: (params: AcctionParams) => { 
                const { view } = params;
                view.setCurrentView('sobject');
                get().setContextLevel(CONTEXT_LEVEL.OBJECT);
            }} );
            addCommand( { ...APP_CMD.OBJEXT,  action: (params: AcctionParams) => {
                const { view, data, model } = params;
                data.loadMetadataFields(model.state.orgSfName, model.state.sObjectLocalId);
                view.setCurrentView('OBJECT_EXTEND');
            }} );
        }        
    }   
});


export default applicationState;
