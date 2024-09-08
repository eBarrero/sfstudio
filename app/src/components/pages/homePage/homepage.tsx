import css from './style.module.css'
import DBConnectionManager from '../../xorganisms/dbConnectionManager/dbConnectionManager'; 
import SOQLPath from '../../xorganisms/SOQLPath/xsoqlPath';
import SchemaPanel from '../../xorganisms/schemaPanel/schemaPanel';
import SObjectPanel from '../../xorganisms/sObjectPanel/sObjectPanel';
import viewState from '../../../store/viewState';
import Console from '../../xorganisms/console/console';
import ResultSheet from '../../xorganisms/resultSheet/resultSheet';

console.log('*****HomePage');
const HomePage = () => {
    const { currentView } = viewState();

    return (
            <main className={css.main}>
                <aside className={css.options_container}>
                    <section className={css.frame_features}>
                        <DBConnectionManager/>
                    </section>                    
                    <section className={css.frame_explorer}>
                        <SOQLPath/>
                        <Console/>
                    </section>
                </aside>
                <section className={css.panel_container}>
                    <section className={css.frame_editor}>
                    {currentView==='org' && <SchemaPanel/> }
                    {currentView==='sobject' && <SObjectPanel/> }     
                    {currentView==='SQL_RESULT' && <ResultSheet/> }                   
                    </section>
                </section>    
            </main>
            
          )
}   

export default HomePage;


