export type DatePeriod = 'Day' | 'Week' | 'Month' | 'Quarter' | 'Year' | 'Fiscal quarter' | 'Fiscal year';

export interface DateLiteralDefinition {
  code: string;
  period: DatePeriod;
  description: string;
  count?: boolean;
}

export const datePeriods: DatePeriod[] = ['Day', 'Week', 'Month', 'Quarter', 'Year', 'Fiscal quarter', 'Fiscal year'];

export const dateLiterals: DateLiteralDefinition[] = [
  { code: 'YESTERDAY', period: 'Day', description: 'The previous calendar day.' },
  { code: 'TODAY', period: 'Day', description: 'The current calendar day.' },
  { code: 'TOMORROW', period: 'Day', description: 'The next calendar day.' },
  { code: 'LAST_N_DAYS', period: 'Day', count: true, description: 'Today and the previous N days.' },
  { code: 'NEXT_N_DAYS', period: 'Day', count: true, description: 'The next N days, excluding today.' },
  { code: 'N_DAYS_AGO', period: 'Day', count: true, description: 'The calendar day N days ago.' },
  { code: 'LAST_WEEK', period: 'Week', description: 'The previous calendar week.' },
  { code: 'THIS_WEEK', period: 'Week', description: 'The current calendar week.' },
  { code: 'NEXT_WEEK', period: 'Week', description: 'The next calendar week.' },
  { code: 'LAST_N_WEEKS', period: 'Week', count: true, description: 'The previous N calendar weeks, excluding this week.' },
  { code: 'NEXT_N_WEEKS', period: 'Week', count: true, description: 'The next N calendar weeks, excluding this week.' },
  { code: 'N_WEEKS_AGO', period: 'Week', count: true, description: 'The calendar week N weeks ago.' },
  { code: 'LAST_MONTH', period: 'Month', description: 'The previous calendar month.' },
  { code: 'THIS_MONTH', period: 'Month', description: 'The current calendar month.' },
  { code: 'NEXT_MONTH', period: 'Month', description: 'The next calendar month.' },
  { code: 'LAST_N_MONTHS', period: 'Month', count: true, description: 'The previous N calendar months, excluding this month.' },
  { code: 'NEXT_N_MONTHS', period: 'Month', count: true, description: 'The next N calendar months, excluding this month.' },
  { code: 'N_MONTHS_AGO', period: 'Month', count: true, description: 'The calendar month N months ago.' },
  { code: 'LAST_90_DAYS', period: 'Quarter', description: 'Today and the previous 90 days.' },
  { code: 'NEXT_90_DAYS', period: 'Quarter', description: 'The next 90 days, excluding today.' },
  { code: 'LAST_QUARTER', period: 'Quarter', description: 'The previous calendar quarter.' },
  { code: 'THIS_QUARTER', period: 'Quarter', description: 'The current calendar quarter.' },
  { code: 'NEXT_QUARTER', period: 'Quarter', description: 'The next calendar quarter.' },
  { code: 'LAST_N_QUARTERS', period: 'Quarter', count: true, description: 'The previous N calendar quarters, excluding this quarter.' },
  { code: 'NEXT_N_QUARTERS', period: 'Quarter', count: true, description: 'The next N calendar quarters, excluding this quarter.' },
  { code: 'N_QUARTERS_AGO', period: 'Quarter', count: true, description: 'The calendar quarter N quarters ago.' },
  { code: 'LAST_YEAR', period: 'Year', description: 'The previous calendar year.' },
  { code: 'THIS_YEAR', period: 'Year', description: 'The current calendar year.' },
  { code: 'NEXT_YEAR', period: 'Year', description: 'The next calendar year.' },
  { code: 'LAST_N_YEARS', period: 'Year', count: true, description: 'The previous N calendar years, excluding this year.' },
  { code: 'NEXT_N_YEARS', period: 'Year', count: true, description: 'The next N calendar years, excluding this year.' },
  { code: 'N_YEARS_AGO', period: 'Year', count: true, description: 'The calendar year N years ago.' },
  { code: 'LAST_FISCAL_QUARTER', period: 'Fiscal quarter', description: 'The previous fiscal quarter.' },
  { code: 'THIS_FISCAL_QUARTER', period: 'Fiscal quarter', description: 'The current fiscal quarter.' },
  { code: 'NEXT_FISCAL_QUARTER', period: 'Fiscal quarter', description: 'The next fiscal quarter.' },
  { code: 'LAST_N_FISCAL_QUARTERS', period: 'Fiscal quarter', count: true, description: 'The previous N fiscal quarters, excluding this quarter.' },
  { code: 'NEXT_N_FISCAL_QUARTERS', period: 'Fiscal quarter', count: true, description: 'The next N fiscal quarters, excluding this quarter.' },
  { code: 'N_FISCAL_QUARTERS_AGO', period: 'Fiscal quarter', count: true, description: 'The fiscal quarter N quarters ago.' },
  { code: 'LAST_FISCAL_YEAR', period: 'Fiscal year', description: 'The previous fiscal year.' },
  { code: 'THIS_FISCAL_YEAR', period: 'Fiscal year', description: 'The current fiscal year.' },
  { code: 'NEXT_FISCAL_YEAR', period: 'Fiscal year', description: 'The next fiscal year.' },
  { code: 'LAST_N_FISCAL_YEARS', period: 'Fiscal year', count: true, description: 'The previous N fiscal years, excluding this year.' },
  { code: 'NEXT_N_FISCAL_YEARS', period: 'Fiscal year', count: true, description: 'The next N fiscal years, excluding this year.' },
  { code: 'N_FISCAL_YEARS_AGO', period: 'Fiscal year', count: true, description: 'The fiscal year N years ago.' },
];

export function isSupportedDateLiteral(value: string): boolean {
  const [code, count, extra] = value.split(':');
  if (extra !== undefined) return false;
  const definition = dateLiterals.find(item => item.code === code);
  if (!definition) return false;
  return definition.count
    ? count !== undefined && /^[1-9]\d{0,2}$/.test(count)
    : count === undefined;
}
