

export enum CONTEXT_LEVEL  {
    INIT = 'init',
    ORG = 'org',
    OBJECT = 'object',
    SQL_EXECUTION = 'sql_execution'
} 

export const VIEW_CMD : { [key: string]: CommandDefinition } = {
    FILTER: { command: '.Filter', description: 'CMD.filterObjects',  iconSymbol: '🔍', context: CONTEXT_LEVEL.ORG } as const,
    HELP0:  { command: '.Help',   description: 'CMD.help',           iconSymbol: '❓', context: CONTEXT_LEVEL.INIT } as const,
    HELP1:  { command: '.Help',   description: 'CMD.help',           iconSymbol: '❓', context: CONTEXT_LEVEL.ORG } as const,
    HELP2:  { command: '.Help',   description: 'CMD.help',           iconSymbol: '❓', context: CONTEXT_LEVEL.OBJECT } as const,
    HELP3:  { command: '.Help',   description: 'CMD.help',           iconSymbol: '❓', context: CONTEXT_LEVEL.SQL_EXECUTION } as const,
  };
  
export const SESSION_CMD : { [key: string]: CommandDefinition } = {
    PROD:    { command: '.Login_to_Prod',    description: 'CMD.init.prod',    context: CONTEXT_LEVEL.INIT } as const,
    SANDBOX: { command: '.Login_to_Sandbox', description: 'CMD.init.sandbox', context: CONTEXT_LEVEL.INIT } as const
  };

export const APP_CMD : { [key: string]: CommandDefinition } = {
    BACK_FROM_ORG: { command: '.Back',  description: 'CMD.back', iconSymbol: '⇦', context: CONTEXT_LEVEL.ORG   } as const,
    BACK_FROM_OBJ: { command: '.Back',  description: 'CMD.back', iconSymbol: '⇦', context: CONTEXT_LEVEL.OBJECT } as const,
    BACK_FROM_SQL: { command: '.Back',  description: 'CMD.back', iconSymbol: '⇦', context: CONTEXT_LEVEL.SQL_EXECUTION } as const

  }; 

export const NODEL_CMD : { [key: string]: CommandDefinition } = {
    SELECT_ALL_FIELDS:      { command: '.Select_all_fields',      description: 'field.filter.ALL_FIELDS',       context: CONTEXT_LEVEL.OBJECT } as const,
    SELECT_STANDARD_FIELDS: { command: '.Select_standard_fields', description: 'field.filter.STANDARD_FIELDS',  context: CONTEXT_LEVEL.OBJECT } as const,
    SELECT_CUSTOM_FIELDS:   { command: '.Select_custom_fields',   description: 'field.filter.CUSTOM_FIELDS',    context: CONTEXT_LEVEL.OBJECT } as const
  };

export const SOQL_CMD : { [key: string]: CommandDefinition } = {
    RUN_SOQL: { command: '.Run_SQOL', description: 'CMD.soql', iconSymbol: '🗲', context: CONTEXT_LEVEL.OBJECT } as const
  };




const allCommandsList: Map<string,  CommandImplementation> = new Map<string, CommandImplementation>([]);




export function addCommand(newCommand: CommandImplementation) : void{
    allCommandsList.set(newCommand.command.toUpperCase() + ' ' +  newCommand.context, newCommand); 
}

/**
 * Searches for a command based on the provided search string and context level.
 * 
 * @param search - The search string to match the command against.
 * @param contextLevel - The context level to filter the commands by.
 * @returns An array of matching command keys or a single command implementation.
 */
export function searchCommand(search: string, contextLevel: CONTEXT_LEVEL) : {commandNameList: string[], commandImplementation: CommandImplementation | undefined} {
    const searchUpper = search.toUpperCase();
    const commandNameList = Array
        .from(allCommandsList)
        .filter(([cmdKey, commandImplementation]) => { return cmdKey.startsWith(searchUpper) && (commandImplementation.context === contextLevel || commandImplementation.context === null);})
        .map(([_, commandImplementation]) => commandImplementation.command); // Extraer solo las claves
    const r= {commandNameList, commandImplementation: (commandNameList.length === 1)?readCommand(commandNameList[0], contextLevel)!:undefined};
    return r;
}   

export function readCommand(search: string, contextLevel: CONTEXT_LEVEL) : CommandImplementation | undefined {
    return allCommandsList.get(search.toUpperCase() + ' ' + contextLevel);
}


/**
 * @description delete commands for buttons base the provided search string
 * @param search - The search string to match the command against.
 */
export function deleteCommand(search: string) : void {
    const searchUpper = search.toUpperCase();
    for ( const key of allCommandsList.keys()) {
        if (key.startsWith(searchUpper)) allCommandsList.delete(key);
    }    
}


/**
 * @description retrieve command buttons base the context provided 
 * @param contextLevel - The context level to filter the commands by.
 * @returns An array of matching command keys or a single command implementation.
 */
export function getCommands(contextLevel: CONTEXT_LEVEL) : CommandImplementation[] {
    return Array
          .from(allCommandsList.values())
          .filter((commandImplementation) => commandImplementation.context === contextLevel && commandImplementation.iconSymbol !== undefined);
}

/**
 * @description retrieve command buttons base the context provided 
 * @param contextLevel - The context level to filter the commands by.
 * @returns An array of matching command keys or a single command implementation.
 */
export function getAllCommands(contextLevel: CONTEXT_LEVEL) : CommandImplementation[] {
  return Array
        .from(allCommandsList.values())
        .filter((commandImplementation) => commandImplementation.context === contextLevel);
}