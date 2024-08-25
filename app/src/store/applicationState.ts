
import {create} from 'zustand';
import { allCommandsList, CONTEXT_LEVEL } from '../constants/application';

interface LocalAplicationState {
    context_level: string;
    currentCommand:string; 
    lastCommand: string;
    command?: CommandDefinition;
    commandConfirmed?: CommandDefinition;
    errorState?: string;
    helpOnLine?: string;
    suggestions: string;
}

interface ApplicationState extends LocalAplicationState {
    setFilter: (newFilter: string) => void;
    setContextLevel: (newContext: string) => void;
    setCommand: (newCommand: string | null) => void;    
    exeCommand: (newCommand: string) => void;
    exeCommandFromUI: (newCommand: string) => void;
    
    
}





const applicationState = create<ApplicationState>((set, get) => {
    return  {
        context_level: CONTEXT_LEVEL.INIT,
        currentCommand: '',
        lastCommand:'',
        suggestions:'',
        setContextLevel: (newContext: string) => {
            if (newContext !== get().context_level) {
                const newState: LocalAplicationState = {
                    context_level: newContext, 
                    currentCommand: '', 
                    helpOnLine:'',  
                    lastCommand: '', 
                    errorState: undefined, 
                    suggestions:'', 
                    command: undefined};
                set(newState);
            }
            
        },
        setFilter: (newFilter: string) => {
            console.log('setFilter', newFilter);
            set({currentCommand: newFilter});
        },
        setCommand: (newCommand: string | null) => {
            if (newCommand === null || newCommand === '') {
                set({currentCommand: ''});
                return;
            }
            
            if (!newCommand.startsWith('.') && !get().currentCommand.startsWith('.')) {
                get().setFilter(newCommand);
                return;
            }


            const newState: LocalAplicationState = {context_level: get().context_level, currentCommand: newCommand, helpOnLine:'',  lastCommand: '', errorState: undefined, suggestions:'', command: undefined};            
            const firstWord = newCommand.split(' ')[0];
            if (allCommandsList.has(firstWord)) {
                const command = allCommandsList.get(firstWord)!;
                newState.helpOnLine = command.description;
                newState.command  = command;
            } else {
                for (const key of allCommandsList.keys()) {
                    if (key.startsWith(firstWord) && allCommandsList.get(key)!.context === get().context_level) {
                        newState.suggestions = key;
                        break;
                    }
                }
                if (newState.suggestions === '') {
                    newState.errorState = 'CMD.not_Found';
                }
            }
            set(newState);
        },
        exeCommand: (newCommand: string) => {
            if (!newCommand.startsWith('.'))  {
                get().setFilter(newCommand);
                return;
            }          
            const newState: LocalAplicationState = {context_level: get().context_level, currentCommand: newCommand, helpOnLine:'',  lastCommand: '', errorState: undefined, suggestions:'', command: undefined};            
            if (get().command !== undefined) {
                newState.commandConfirmed = get().command;
                newState.currentCommand = '';
                newState.lastCommand = get().currentCommand;                    
            } else {
                newState.errorState = 'CMD.not_Found';
            }
            set(newState);              
        },
        exeCommandFromUI: (newCommand: string) => {
            const newState: LocalAplicationState = {context_level: get().context_level, currentCommand: newCommand, helpOnLine:'',  lastCommand: '', errorState: undefined, suggestions:'', command: undefined};                        
            if (allCommandsList.has(newCommand)) {
                newState.commandConfirmed = allCommandsList.get(newCommand)!;
                newState.currentCommand = '';
                newState.lastCommand = newCommand;
            } else {
                newState.errorState = 'CMD.not_Found';
            }             
            set(newState);
        },        
    }   
});


export default applicationState;
