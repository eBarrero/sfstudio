
import sessionState from "../../../store/sessionState";


const DBConnectionManager = () => {

    const { publicSession} = sessionState();

    return (
        <div>
            {publicSession.connections && publicSession.connections.map((c, i) => {
                return (
                    <span key={i}>-{c.isConnected}-&nbsp;{c.name}</span>
                )
            })}
        </div>
    );
}

export default DBConnectionManager;
