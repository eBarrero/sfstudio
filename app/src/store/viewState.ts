import {create} from 'zustand';
import { addCommand, VIEW_CMD } from '../core/commandManager';
import { Dialog } from '../components/constants';




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
            addCommand({ ...VIEW_CMD.FILTER, action: () => { get().setComponentShowed('OBJECT_FILTER')}} );
            addCommand({ ...VIEW_CMD.HELP0, action: () => { get().pushDialog(Dialog.Help)}} );
            addCommand({ ...VIEW_CMD.HELP1, action: () => { get().pushDialog(Dialog.Help)}} );
            addCommand({ ...VIEW_CMD.HELP2, action: () => { get().pushDialog(Dialog.Help)}} );
            addCommand({ ...VIEW_CMD.HELP3, action: () => { get().pushDialog(Dialog.Help)}} );
        }
    }

});   

export default viewState;

