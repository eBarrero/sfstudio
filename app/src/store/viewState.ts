import {create} from 'zustand';
import { addCommand, VIEW_CMD } from '../core/commandManager';
import { Dialog } from '../components/constants';




const viewState = create<ViewState>((set, get) => {
    return  {
        currentView: 'INIT',
        dialogStack: [],
        commandState: 'INIT',
        command: '',
        msgbox : {type: '', title: '', message: ''}, 
    
        
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
        setMsgbox(type: string, title: string, message: string) {
            set({msgbox: {type, title, message}, dialogStack: [...get().dialogStack, Dialog.MSGBOX]});
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

