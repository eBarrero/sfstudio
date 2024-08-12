
import {create} from 'zustand';
import { allCommandsList } from '../constants/application';
import sessionState from './sessionState';




interface ApplicationState {
    status: string;
    currentCommand:string; 
    command?: CommandDefinition;
    setCommand: (newCommand: string | null) => void;    
    doCommand: (newCommand: CommandDefinition) => void;
    
}

const applicationState = create<ApplicationState>((set, get) => {
    return  {
        status: 'idle',
        currentCommand: '',
        setCommand: (newCommand: string | null) => {
            if (newCommand === null || newCommand === '') {
                set({currentCommand: ''});
                return;
            }
            
            if (newCommand === 'ENTER') {
                const back = get().currentCommand;
                if (allCommandsList.has(back)) {
                    const command = allCommandsList.get(back)!;
                    get().doCommand(command);
                    set({currentCommand: ''});
                }
                return;
            } 
            if (newCommand[0] !== '.') {
                set({currentCommand: ''});
                return;
            }
            set({currentCommand: newCommand});
        },
        doCommand: (newCommand: CommandDefinition) => {
            set({command: newCommand});
            console.log('doCommand', newCommand);   
           

        }
    }   
});


export default applicationState;
