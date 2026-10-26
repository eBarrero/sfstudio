export type QueryCell = string | number | boolean | null | string[];
export interface QueryTable { columns: string[]; rows: QueryCell[][] }

function flatten(value: Record<string, unknown>, prefix: string, output: Map<string, QueryCell>): void {
  for (const [key, item] of Object.entries(value)) {
    if (key === 'attributes') continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if (item === null || typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
      output.set(path, item);
    } else if (Array.isArray(item)) {
      output.set(path, item.map(part => String(part)));
    } else if (typeof item === 'object') {
      const nested = item as Record<string, unknown>;
      if (Array.isArray(nested.records)) {
        const childRows = nested.records.filter((row): row is Record<string, unknown> =>
          typeof row === 'object' && row !== null && !Array.isArray(row));
        const childColumns = childRows.map(row => {
          const cells = new Map<string, QueryCell>();
          flatten(row, path, cells);
          return cells;
        });
        const names = new Set(childColumns.flatMap(row => [...row.keys()]));
        for (const name of names) output.set(name, childColumns.map(row => formatQueryCell(row.get(name) ?? null)));
        if (!names.size) output.set(path, []);
      } else flatten(nested, path, output);
    }
  }
}

export function formatQueryCell(cell: QueryCell): string {
  if (cell === null) return '—';
  if (Array.isArray(cell)) return cell.join(', ');
  return String(cell);
}

export function queryTable(records: readonly Record<string, unknown>[]): QueryTable {
  const flatRows = records.map(record => {
    const row = new Map<string, QueryCell>();
    flatten(record, '', row);
    return row;
  });
  const columns = [...new Set(flatRows.flatMap(row => [...row.keys()]))];
  return { columns, rows: flatRows.map(row => columns.map(column => row.get(column) ?? null)) };
}
