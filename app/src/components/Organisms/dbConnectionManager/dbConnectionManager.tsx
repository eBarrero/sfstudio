
import sessionState from "../../../store/sessionState";
import applicationState from "../../../store/applicationState";




const DBConnectionManager = () => {
    const { exeCommandFromUI } = applicationState();    
    const { publicSession} = sessionState();

    const onClikHandler = (cmd:string) => () => { 
        exeCommandFromUI(cmd);
    }

    return (
        <div>
            <button onClick={onClikHandler('prod')}>Connect</button>
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
