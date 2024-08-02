import {create} from 'zustand';


interface ViewState {
    currentView: string;
    dialogStack: string[];
    setCurrentView: (newView: string) => void;
    pushDialog: (newWindow: string) => void;
    popDialog: () => void;
}

const useViewState = create<ViewState>((set, get) => {
    return  {
        currentView: 'INIT',
        dialogStack: [],
        setCurrentView: (newView: string) => {
            set({currentView: newView});
        },
        pushDialog: (newWindow: string) => {
            set({dialogStack: [...get().dialogStack, newWindow]});
        },
        popDialog: () => {
            const dialogArray = get().dialogStack;
            dialogArray.pop();
            set({dialogStack: dialogArray});
        }
    }

});   

export default useViewState;