import { useEffect } from 'react';

//import './App.css'
import sessionState  from './store/sessionState.ts';
import viewState     from './store/viewState.ts'
import HomePage from './components/pages/homePage/homepage.tsx';
import DateTime from './components/organisms/FieldDialog/DateTime';


function App() {
const { createSession } = sessionState();
const { dialogStack } = viewState();
useEffect(() => {createSession()},[]);
  return (
    <>
    <HomePage/>
    {dialogStack && dialogStack.map((dialog) => { if (dialog==="DataTime") return <DateTime key={dialog}/>})}
    </>
  )
}

export default App

