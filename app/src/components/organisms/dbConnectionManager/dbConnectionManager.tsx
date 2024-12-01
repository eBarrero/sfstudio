
import sessionState from "../../../store/sessionState";
import { IconCharacter } from "../../constants";

const DBConnectionManager = () => {

    const { publicSession} = sessionState();

    return (
        <div>
            {publicSession.connections && publicSession.connections.map((c, i) => {
                if (c.isConnected) {
                    return (
                        <span key={i}>{(i===publicSession.currentConnection)?IconCharacter.CHECK:''}{c.name}<br/></span>
                    )
                }
            })}
        </div>
    );
}

export default DBConnectionManager;
