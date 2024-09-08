
import sessionState from "../../../store/sessionState";
import applicationState from "../../../store/applicationState";
import {SESSION_CMD} from "../../../core/commandManager";



const DBConnectionManager = () => {
    const { exeCommandFromUI } = applicationState();    
    const { publicSession} = sessionState();
    
    const cmd_prod = SESSION_CMD.PROD.command;
    const cmd_sandbox = SESSION_CMD.SANDBOX.command;

    const onClikHandler = (cmd:string) => () => { 
        exeCommandFromUI(cmd);
    }

    return (
        <div>
            <button onClick={onClikHandler(cmd_prod)}>Prod</button>
            <span>&nbsp;</span>
            <button onClick={onClikHandler(cmd_sandbox)}>Sanbox</button>
            {publicSession.connections && publicSession.connections.map((c, i) => {
                return (
                    <div key={i}>
                        <div>{c.name}</div>
                        <div>{c.alias}</div>
                    </div>
                )
            })}
        </div>
    );
}

export default DBConnectionManager;