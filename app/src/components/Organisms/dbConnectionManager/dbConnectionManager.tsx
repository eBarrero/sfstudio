import { useEffect } from 'react';
import useSessionState from './../../../store/sessionState';
import useViewState from '../../../store/viewState';
import useMoldeState   from './../../../store/modelState';




const DBConnectionManager = () => {
    const { publicSession, loginSFDC } = useSessionState();
    const { setCurrentView } = useViewState();
    const { setOrg } = useMoldeState();
    useEffect(() => { 
        console.log('publicSession');
        console.log(publicSession);
        if (publicSession.connections.length === 0) return;
        setOrg(publicSession.connections[0].name);
        setCurrentView('SObjectsPanel');
    }, [publicSession]);

    console.log(publicSession);
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
