
import {create} from 'zustand';
import { addCommand, searchCommand, readCommand, CONTEXT_LEVEL,APP_CMD } from '../core/commandManager';



interface LocalAplicationState {
    context_level: CONTEXT_LEVEL; // Update the type here
    currentCommand:string; 
    filterConfirmed: string;         
    command?: CommandImplementation;
    commandConfirmed?: CommandImplementation
    errorState?: string;
    helpOnLine?: string;
    suggestions: string[];
}

interface ApplicationState extends LocalAplicationState {
    setFilter: (newFilter: string) => void;
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
        filterConfirmed:'',
        suggestions:[],
        setContextLevel: (newContext: CONTEXT_LEVEL) => {
            if (newContext !== get().context_level) {
                const newState: LocalAplicationState = {
                    context_level: newContext, 
                    currentCommand: '', 
                    helpOnLine:'',  
                    filterConfirmed: '', 
                    errorState: undefined, 
                    suggestions:[], 
                    command: undefined};
                set(newState);
            }
            
        },
        setFilter: (newFilter: string) => {
            console.log('setFilter', newFilter);
            set({currentCommand: newFilter});
        },
        setCommand: (newCommand: string | null) => {
            console.log('setCommand', newCommand);
            if (newCommand === ".Backspace") { 
                set({currentCommand: get().currentCommand.slice(0, get().currentCommand.length-1), errorState: undefined, commandConfirmed: undefined,helpOnLine:'',  suggestions:[]});
                return;
            }

            if (newCommand === null || newCommand === '') {
                set({currentCommand: '', commandConfirmed: undefined,helpOnLine:'',  suggestions:[]});
                return;
            }
 
            if (!newCommand.startsWith('.') && !get().currentCommand.startsWith('.')) {
                get().setFilter(newCommand);
                return;
            }
            console.log('setCommand:'+ newCommand + ':');  

            const newState: LocalAplicationState = {context_level: get().context_level, currentCommand: newCommand, helpOnLine:'',  filterConfirmed: '', errorState: undefined, suggestions:[], command: undefined};            
            const firstWord = newCommand.split(' ')[0];
            const secondWord = newCommand.split(' ')[1] ?? '';
            const {commandNameList, commandImplementation} = searchCommand(firstWord, newState.context_level);
            if (commandNameList.length === 0) {
                newState.errorState = 'CMD.not_Found';
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
            if (!newCommand.startsWith('.'))  {
                set({ filterConfirmed: newCommand, currentCommand: ''});
                return;
            }  

            const newState: LocalAplicationState = {context_level: get().context_level, currentCommand: newCommand, helpOnLine:'',  filterConfirmed: '', errorState: undefined, suggestions:[], command: undefined};            
            if (get().command !== undefined) {
                newState.commandConfirmed = get().command;
            } else {
                newState.errorState = 'CMD.not_Found';
            }
            set(newState);              
        },
        exeCommandFromUI: (newCommand: string) => {
            console.log('exeCommandFromUI', newCommand);
            const c = newCommand.trim();
            const firstWord = c.split(' ')[0];
            const newState: LocalAplicationState = {context_level: get().context_level, currentCommand: c, helpOnLine:'',  filterConfirmed: '', errorState: undefined, suggestions:[], command: undefined};   
            const command = readCommand(firstWord, newState.context_level);                     
            if (command !== undefined) {
                newState.commandConfirmed = command;
            } else {
                newState.errorState = 'CMD.not_Found';
            }             
            set(newState);
        },        
        initializeApp: () => {
            addCommand( { ...APP_CMD.BACK_FROM_ORG,  action: () => { 
                // missing implementation
                // close salesforce connection
                get().setContextLevel(CONTEXT_LEVEL.INIT) 
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
                get().setContextLevel(CONTEXT_LEVEL.OBJECT) 
            }} );
        }        
    }   
});


export default applicationState;
