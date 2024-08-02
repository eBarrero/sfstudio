import css from './style.module.css'
import DBConnectionManager from '../../organisms/dbConnectionManager/dbConnectionManager'; 
import SOQLPath from '../../organisms/SOQLPath';
import SchemaPanel from '../../organisms/schemaPanel/schemaPanel';
import SObjectPanel from '../../organisms/sObjectPanel/sObjectPanel';
import useViewState from '../../../store/viewState';


const HomePage = () => {
    const { currentView} = useViewState();

    return (
            <main className={css.main}>
                <div className={css.options_container}>
                    <section className={css.frame_features}>
                        <DBConnectionManager/>
                    </section>                    
                    <section className={css.frame_explorer}>
                        <SOQLPath/>
                    </section>
                </div>
                <div className={css.panel_container}>
                    <section className={css.frame_editor}>
                    <SchemaPanel/>
                    {currentView==='sobject' && <SObjectPanel/> }                        
                    </section>
                </div>    
            </main>
            
          )
}   

export default HomePage;


