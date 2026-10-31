import modelState from '../../../store/modelState';
import css from './style.module.css';

export default function WhereClausePanel() {
    const elements = modelState(state => state.queryState.queryElemnts);
    const withWhere = elements.flatMap((element, index) =>
        element.where?.length ? [{ element, index, conditions: element.where }] : []);

    return <section aria-labelledby="where-clause-heading">
        <h2 id="where-clause-heading">Where Clause</h2>
        {withWhere.length === 0 && <p>No hay condiciones WHERE en la consulta.</p>}
        {withWhere.map(({element, index, conditions}) =>
            <section key={index}>
                <h3>{element.sObjectId.sObjectApiName}
                    {element.type === 'SUBQUERY' && ` · ${element.relationshipName}`}
                    {element.type === 'RELETED' && ` · ${element.relatedTo}`}
                </h3>
                <ul className={css.whereConditions}>
                    {conditions.map((condition, conditionIndex) =>
                        <li key={conditionIndex}><code>{condition.sqlString}</code></li>)}
                </ul>
            </section>)}
    </section>;
}
