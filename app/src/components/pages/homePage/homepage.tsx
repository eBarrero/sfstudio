import css from './style.module.css'
import {t} from '../../../utils/utils';
import parse from 'html-react-parser';
import DBConnectionManager from '../../organisms/dbConnectionManager/dbConnectionManager'; 
import SOQLPath from '../../organisms/SOQLPath/soqlPath';
import SchemaPanel from '../../organisms/schemaPanel/schemaPanel';
import SObjectPanel from '../../organisms/sObjectPanel/sObjectPanel';
import viewState from '../../../store/viewState';
import Console from '../../organisms/console/console';
import ResultSheet from '../../organisms/resultSheet/resultSheet';




const HomePage = () => {
    const { currentView } = viewState();

    return (
            <main className={css.main}>
                <nav className={css.options_container}>
                    <section className={css.frame_features}>
                        <DBConnectionManager/>
                    </section>                    
                    <section className={css.frame_explorer}>
                        <SOQLPath/>
                        <Console/>
                    </section>
                </nav>
                <section className={css.panel_container}>
                    <section className={css.frame_editor}>
                        {currentView==='INIT' && <AppIntro/> }
                        {currentView==='org' && <SchemaPanel/> }
                        {currentView==='sobject' && <SObjectPanel/> }     
                        {currentView==='SQL_RESULT' && <ResultSheet/> }                   
                    </section>
                </section>    
            </main>
            
          )
};

export default HomePage;


const AppIntro = () => {

    return (
        <article className={css.AppPresentation}>
            <header className={css.AppHeader}>
                <img src="Logo64.png" alt="SFStudio Logo" className={css.AppHeader__logo} />
                <h1 className={css.AppHeader__title}>sfStudio</h1>
            </header>
            <section className={css.AppBody}>
                <p className={css.AppBody__subtitle}>
                    {t('APP.Welcome')}
                </p>
                <aside className={css.AppBody__disclaimer}>
                    {parse(t('APP.Disclaimer'))}
                </aside>
            </section>    
        </article>
    );
};