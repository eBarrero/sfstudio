import {create} from 'zustand';


interface ViewState {
    currentView: string;
    componentShowed?: string;
    dialogStack: string[];

    setCurrentView: (newView: string) => void;
    setComponentShowed: (componentName: string) => void;
    reSetComponentShowed: () => void;
    pushDialog: (newWindow: string) => void;
    popDialog: () => void;
}

const viewState = create<ViewState>((set, get) => {
    return  {
        currentView: 'INIT',
        dialogStack: [],
        commandState: 'INIT',
        command: '',
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
        },
        setCurrentView: (newView: string) => {
            set({currentView: newView});
        },
        setComponentShowed: (componentName: string) => {
            set({componentShowed: componentName});
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
    }

});   

export default viewState;