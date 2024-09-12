import css from './style.module.css'
import modelState  from '../../../store/modelState'



export default function SOQLPanel() {
    const {sql} = modelState((state) => state.sqlState);
    
    return (
        <div className={css.container}>
            {sql}
        </div>
    )

}