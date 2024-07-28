import css from './local.module.css'
import { useAppState } from '../../../store/modelState'





export default function SOQLPanel() {
    const {sql} = useAppState((state) => state.sqlState);
    return (
        <div className={css.container}>
            {sql}
        </div>
    )

}