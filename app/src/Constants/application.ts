export const enum Commands {
    LOGIN,
    LOGOUT,
    FILTER,
}


export const cmd_Login =  {command: 'login',  description: 'Login to Salesforce',   action:Commands.LOGIN};
export const cmd_Logout = {command: 'logout', description: 'Logout from Salesforce',action:Commands.LOGOUT};
export const cmd_Filter = {command: '.filter', description: 'Filter the list of objects', action:Commands.FILTER};



export const allCommandsList: Map<string,  CommandDefinition> = new Map<string, CommandDefinition>([
            [cmd_Login.command,    cmd_Login],
            [cmd_Logout.command,   cmd_Logout],
            [cmd_Filter.command,   cmd_Filter]
]);

