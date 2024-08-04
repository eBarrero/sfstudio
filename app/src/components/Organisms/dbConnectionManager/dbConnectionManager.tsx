import { useEffect } from 'react';
import useSessionState from './../../../store/sessionState';
import useViewState from '../../../store/viewState';
import useMoldeState   from './../../../store/modelState';
import useDataState from '../../../store/dataState';




const DBConnectionManager = () => {
    const { loadSchema } = useDataState();
    const { publicSession, loginSFDC } = useSessionState();
    const { setCurrentView } = useViewState();
    const { setOrg } = useMoldeState();

    useEffect(() => { 
        if (publicSession.connections.length === 0) return;
        setOrg(publicSession.connections[0].name);
        loadSchema(publicSession.connections[0].name);
        setCurrentView('MAIN');
    }, [publicSession]);

    
    return (

        <div>
            <button onClick={loginSFDC}>Connect</button>
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
