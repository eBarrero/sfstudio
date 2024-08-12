import css from './style.module.css'
import DBConnectionManager from '../../organisms/dbConnectionManager/dbConnectionManager'; 
import SOQLPath from '../../organisms/SOQLPath/SOQLPath';
import SchemaPanel from '../../organisms/schemaPanel/schemaPanel';
import SObjectPanel from '../../organisms/sObjectPanel/sObjectPanel';
import viewState from '../../../store/viewState';
import Console from '../../organisms/console/console';


const HomePage = () => {
    const { currentView} = viewState();

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
                    <SchemaPanel/>
                    {currentView==='sobject' && <SObjectPanel/> }                        
                    </section>
                </section>    
            </main>
            
          )
}   

export default HomePage;


