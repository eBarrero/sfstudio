import {cmd_Login} from "../../../constants/application";
import sessionState from "../../../store/sessionState";
import applicationState from "../../../store/applicationState";




const DBConnectionManager = () => {
    const { doCommand } = applicationState();    
    const { publicSession} = sessionState();

    const onClikHandler = (cmd:CommandDefinition) => () => { 
        doCommand(cmd);
    }

    return (
        <div>
            <button onClick={onClikHandler(cmd_Login)}>Connect</button>
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
