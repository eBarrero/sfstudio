import {create} from 'zustand';
import { allCommandsList, CONTEXT_LEVEL } from '../constants/application';



interface ViewState {
    currentView: string;
    componentShowed?: string;
    dialogStack: string[];

    setCurrentView: (newView: string) => void;
    setComponentShowed: (componentName: string) => void;
    reSetComponentShowed: () => void;
    pushDialog: (newWindow: string) => void;
    popDialog: () => void;
    initializeView: () => void;
}

const viewState = create<ViewState>((set, get) => {
    return  {
        currentView: 'INIT',
        dialogStack: [],
        commandState: 'INIT',
        command: '',/*
        setCommand: (newCommand: string | null) => {
            if (newCommand === null || newCommand === '') {
                set({commandState: 'INIT'});
                return;
            }
            if (newCommand[0] === '.') {
                set({commandState: 'COMMAND'});
            } else {
                set({commandState: 'FILTER'});
            }
            set({command: newCommand});
        },*/
        setCurrentView: (newView: string) => {
            set({currentView: newView});
        },
        setComponentShowed: (componentName: string) => {
            console.log('setComponentShowed', componentName, get().componentShowed);

            const newValue =  (get().componentShowed !== componentName)?componentName:undefined
            set({componentShowed: newValue}) ;
        },
        reSetComponentShowed: () => {
            set({componentShowed: undefined});
        },
        pushDialog: (newWindow: string) => {
            set({dialogStack: [...get().dialogStack, newWindow]});
        },
        popDialog: () => {
            const dialogArray = get().dialogStack;
            dialogArray.pop();
            set({dialogStack: dialogArray});
        },
        initializeView: () => {
            allCommandsList.set( '.filter', { command: '.filter', description: 'Filter the list of objects', context:CONTEXT_LEVEL.ORG,  action: () => { get().setComponentShowed('OBJECT_FILTER')}} );
        }
    }

});   

export default viewState;

