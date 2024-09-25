

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


interface AcctionParams {
    data: DataState;
    model: ModelState;
    view: ViewState;
    application: ApplicationState;
}

interface CommandDefinition  {
    command: string;
    description: string;
    examples?: string[];
    context: string;
    iconSymbol?: string;
}

interface CommandImplementation extends CommandDefinition {
    action: (acctionParams: AcctionParams) => void;
}






type SFDateFormat = string

// controles
interface DateTimeValues {
    type: string
    typeField: SalesforceFieldTypes
    from: string;
    to: string;
    startDate?: SFDateFormat;
    endDate?: SFDateFormat;
  }