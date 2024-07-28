import css from './style.module.css'
import DBConnectionManager from '../../organisms/dbConnectionManager/dbConnectionManager'; 
import SOQLPath from '../../organisms/SOQLPath';
import SObjectsPanel from '../../organisms/sObjectsPanel/sObjectsPanel';
const action=""

const HomePage = () => {

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
                    <SObjectsPanel/>
                    {action==='sobject' && <PanelSObject/> }                        
                    </section>
                </div>    
            </main>
            
          )
}   

export default HomePage;


