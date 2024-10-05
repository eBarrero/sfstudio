import css from './style.module.css'
import {t} from '../../../utils/utils'
import TitleBar from '../TitleBar/titleBar'

interface MsgBoxProps {
    title: string,
    message: string,
    btnClose: () => void
}


const MsgBox = (props: MsgBoxProps) => {
  const {title, message, btnClose} = props;

    return (
        <section className={css.container}>
            <div className={css.win}>
                <div className={css.winInner}>
                    <TitleBar title={t(title)} onClose={btnClose}/>
                    <div className={css.panel}>
                        <div className={css.panelMessage}>{t(message)}</div>
                    </div>    
                </div>
            </div>
        </section>
    );
}

export default MsgBox;