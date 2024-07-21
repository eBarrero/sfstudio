import { useEffect, useState } from 'react';

import PanelSObjects  from './components/PanelSObjects.tsx';
import PanelSObject from './components/PanelSObject.tsx';
import './App.css'
import { useAppState } from './store/AppState.ts';
import SOQLPanel from './components/Organisms/SOQLPanel/index.tsx';
import SOQLPath from './components/Organisms/SOQLPath/index.tsx';
import DateTime from './components/Organisms/FieldDialog/DateTime.tsx';

import './i18n.js';

type PublicConnectionDefinition = {
  alias: string;
  name: string;
  sandbox: boolean;
}

type PublicSesionDefinition = {
  currentConnection: number;
  connections: PublicConnectionDefinition[];
} 

/*
interface Items {
  text: string;
  type: string;
  level: string;
  }
  */
/*
  type Appstate = {
    localProject: Items[];
    remoteProject: Items[];
  }
*/
/*
const ExplorerItems = (props:Items): JSX.Element => {

  return (
    <div>
      {props.text}
    </div>
  )

}
*/

interface ConnectorProps {
  fn: () => void; 

}

function Connector(props: ConnectorProps) {
  const fn =props.fn;

  return (
    <div className="Option">
      <div className="Tree">-</div>
      <div className="Caption">Connection 1</div>
      <div className="Button" onClick={()=>fn("btn")}>==</div>
    </div>
  )
}








function App() {
  const {appState, dialogState,  showSObjects  } = useAppState();
  const {
    orgSfName,
    action,
    connectionStatus
   } = appState

  const [sfdc, setSfdc] = useState<PublicSesionDefinition>({
    currentConnection: 0,
    connections: []
  });
  
  async function  loadSession() {
    const res = await fetch("/api/init2");
    if (!res.ok) {
      console.log('error' + res.statusText);
      return;
    } 

    const s = await res.json();
    console.log(s);
    if (s==='newsession') return;
    if (s==='error') return;
    if (s==='reseted') return;
    const token = JSON.parse(atob(s ));
    setSfdc(token);
    console.log(token);
  }
  
  
  useEffect(() => {
    console.log(window.location.href);
    loadSession();

/*
    const param:string[] = window.location.href.split('#');
    window.location.href = "/#"
    if (param.length===1)  { 
      window.location.href='/api/init';
    } else {
      // decodificar en base64 y pasar a json para obtener el token del tipo PublicSesionDefinition
      if (param[1].length>10) {
        const token = JSON.parse(atob(param[1]));
        setSfdc(token);
        console.log(token);
      }
   }*/
    return () => {
      console.log('cleanup');
    }
  }, [connectionStatus]);

  const loginSF=() =>  window.location.href='/api/auth/login';
  

  

  return (
    <main>
      <section className='features'>
      </section>
      <section className='explorer'>
        <div>cosas</div>
        <Connector fn={loginSF}/>
        {sfdc.connections.map((conn) => (
          <div className="Button" key={conn.name} onClick={() => showSObjects(conn.name)}>
            {conn.name}
          </div>))}
          <SOQLPath/>
      </section>
      <section className='editor'>



        



        {action==='btn' && <PanelSObjects orgSfName={orgSfName} />}
        {action==='sobject' && <PanelSObject/> }
      </section>
      {dialogState && dialogState.map((dialog, index) => { if (dialog.component==="DataTime") return <DateTime key={index} fieldId={dialog.info} />})}
    </main>
    
  )
}

export default App

/*
  const [applocalState, setAppLocalState] = useState(()=>{
    const fromStorage = localStorage.getItem('localProject');
    if (fromStorage) {
      return JSON.parse(fromStorage);
    } else {
      return [{text:'Local Project', type:'folder', level:'0'},{text:'new Salesforce connetion', type:'newSFConn', level:'01'}];
    }
  })

  const setLocalState = (newState: Items[]) => {
    setAppLocalState(newState);
    localStorage.setItem('localProject', JSON.stringify(newState));
  }  

*/