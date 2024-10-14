




interface AcctionParams {
    data: DataState;
    model: ModelState;
    view: ViewState;
    application: ApplicationState;
}

interface CommandDefinition  {
    menuItem?: string;
    menuOption?: string;
    menuCaption?: string;
    command: string;
    description: string;
    examples?: string[];
    context: string;
    iconSymbol?: string;
}

interface CommandImplementation extends CommandDefinition {
    action: (acctionParams: AcctionParams) => void;
}






