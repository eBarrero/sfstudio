import { useEffect } from 'react';

//import './App.css'
import useSessionState  from './store/sessionState.ts';
import useViewState     from './store/viewState.ts'
import HomePage from './components/pages/homePage/homepage.tsx';
import DateTime from './components/organisms/FieldDialog/DateTime';


function App() {
const { createSession } = useSessionState();
const { dialogStack } = useViewState();
useEffect(() => {createSession()},[]);
  return (
    <>
    <HomePage/>
    {dialogStack && dialogStack.map((dialog) => { if (dialog==="DataTime") return <DateTime key={dialog}/>})}
    </>
  )
}

export default App

