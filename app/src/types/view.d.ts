interface ViewState {
    currentView: string;
    componentShowed?: string;
    dialogStack: string[];
    msgbox? : {type: string, title: string, message: string}, 
    

    setCurrentView: (newView: string) => void;
    setComponentShowed: (componentName: string) => void;
    reSetComponentShowed: () => void;
    pushDialog: (newWindow: string) => void;
    popDialog: () => void;
    setMsgbox: (type: string, title: string, message: string) => void;
    initializeView: () => void;
}