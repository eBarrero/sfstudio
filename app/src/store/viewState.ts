import {create} from 'zustand';
import { addCommand, VIEW_CMD } from '../core/commandManager';
import { Dialog } from '../components/constants';
import { dispatchObjectPanelAction, OBJECT_PANEL_ACTION } from '../core/objectPanelActions';




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
            set({dialogStack: get().dialogStack.slice(0, -1)});
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
            addCommand({ ...VIEW_CMD.HELP4, action: () => { get().pushDialog(Dialog.Help)}} );
            addCommand({ ...VIEW_CMD.HELP5, action: () => { get().pushDialog(Dialog.Help)}} );
            addCommand({ ...VIEW_CMD.SHOW_FIELDS, action: () => {
                dispatchObjectPanelAction(OBJECT_PANEL_ACTION.SHOW_FIELDS);
            }});
            addCommand({ ...VIEW_CMD.SHOW_RELATIONS, action: () => {
                dispatchObjectPanelAction(OBJECT_PANEL_ACTION.SHOW_RELATIONS);
            }});
            addCommand({ ...VIEW_CMD.SHOW_WHERE, action: () => {
                dispatchObjectPanelAction(OBJECT_PANEL_ACTION.SHOW_WHERE);
            }});
        }
    }

});   

export default viewState;

