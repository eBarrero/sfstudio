import css from './style.module.css'
import useModelState  from '../../../store/modelState'





export default function SOQLPanel() {
    const {sql} = useModelState((state) => state.sqlState);
    return (
        <div className={css.container}>
            {sql}
        </div>
    )

}