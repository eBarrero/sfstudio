import { useEffect } from 'react';

//import './App.css'
import sessionState  from './store/sessionState.ts';
import dataState     from './store/dataState.ts';
import modelState    from './store/modelState.ts';
import viewState     from './store/viewState.ts'
import sqlExecutionState from './store/sqlExecutionState.ts';
import applicationState from './store/applicationState.ts';
import { Dialog } from './components/constants.ts';
import HomePage from './components/pages/homePage/homepage.tsx';
import FieldDialog from  './components/organisms/fieldDialog/fieldDialog.tsx';
import Help from './components/organisms/helpDialog/help.tsx';
import MsgBox from './components/atoms/MsgBox/MsgBox.tsx';



function App() {
const { initializeSession, createSession } = sessionState();
const { initializeData } = dataState();
const { initializeModel } = modelState();
const { initializeSqlExecution } = sqlExecutionState();
const { initializeView, dialogStack, msgbox, popDialog } = viewState();
const { initializeApp } = applicationState();
useEffect(() => {
  initializeSession();
  initializeData();
  initializeModel();
  initializeView();
  initializeSqlExecution();
  initializeApp();
  createSession();
// eslint-disable-next-line react-hooks/exhaustive-deps
},[]);


  return (
    <>
      <HomePage/>
      {dialogStack && dialogStack.map((dialog) => { 
        console.log('dialog', dialog)
        if (dialog===Dialog.WhereDialog) return <FieldDialog key={dialog}/>
        if (dialog===Dialog.Help) return <Help/>
        if (dialog===Dialog.MSGBOX) return <MsgBox title={msgbox!.title} message={msgbox!.message} btnClose={popDialog} />
      })}
    </>
  )
}

export default App

