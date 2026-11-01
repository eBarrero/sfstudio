import { qualifiedFieldName } from '../../../core/soql/whereOwnership';
import modelState from '../../../store/modelState';
import css from './style.module.css';

export default function OrderClausePanel() {
  const elements = modelState(state => state.queryState.queryElemnts);
  const groups = elements.flatMap((element, index) => element.type !== 'RELETED' && element.orderBy?.length
    ? [{ element, index }] : []);
  const remove = (block: number, index: number) => modelState.getState().removeOrderBy(block, index);
  const move = (block: number, index: number, destination: number) =>
    modelState.getState().moveOrderBy(block, index, destination);

  return <section aria-labelledby="order-clause-heading">
    <h2 id="order-clause-heading">Order Clause</h2>
    {groups.length === 0 && <p>No ORDER BY fields have been added.</p>}
    {groups.map(({ element, index }) => <section key={index}>
      <h3>{element.sObjectId.sObjectApiName}
        {element.type === 'SUBQUERY' && ` · ${element.relationshipName}`}</h3>
      <ol className={css.whereConditions}>
        {element.orderBy?.map((order, priority) => <li key={qualifiedFieldName(order.field)}>
          <code>{qualifiedFieldName(order.field)} {order.direction}{order.nulls ? ` NULLS ${order.nulls}` : ''}</code>{' '}
          <button type="button" disabled={priority === 0}
            aria-label={`Move ${qualifiedFieldName(order.field)} up`}
            onClick={() => move(index, priority, priority - 1)}>Up</button>{' '}
          <button type="button" disabled={priority === element.orderBy!.length - 1}
            aria-label={`Move ${qualifiedFieldName(order.field)} down`}
            onClick={() => move(index, priority, priority + 1)}>Down</button>{' '}
          <button type="button" aria-label={`Remove ${qualifiedFieldName(order.field)}`}
            onClick={() => remove(index, priority)}>Remove</button>
        </li>)}
      </ol>
    </section>)}
  </section>;
}
