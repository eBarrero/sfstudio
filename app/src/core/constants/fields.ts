//depricated
export enum IconCharacter  {
  UNDO = '&#8634;',      // ↺ U+21BA
  BACK = '&#8630;',      // ↶
  ORDER_ASC = '&#8593;', // ⬆️
  ORDER_DESC = '&#8595;',// ⬇️
  WHERE = '&#128269;',   // 🔍  U+1F50D
  EXE = '&#128498',     // 🗲  U+1F5F2
}

export const enum SelectAllFieldsEnum {
  ALL = 'FIELDS(ALL)',
  CUSTOM = 'FIELDS(CUSTOM)',
  STANDARD = 'FIELDS(STANDARD)',
} 

export enum SalesforceFieldTypesEnum  {
  Id = "id",
  Address = "address",
  AutoNumber = "autoNumber",
  RollUpSummary = "rollUpSummary",
  Lookup = "lookup",
  MasterDetail = "masterDetail",
  Checkbox = "boolean",
  Currency = "currency",
  Date = "date",
  DateTime = "datetime",
  Double = "double",
  Email = "email",
  Geolocation = "Geolocation",
  Number = "number",
  Percent = "percent",
  Phone = "phone",
  Picklist = "picklist",
  MultiselectPicklist = "multiselectPicklist",
  Text = "string",
  TextArea = "textArea",
  LongTextArea = "longTextArea",
  Reference = "reference",
  RichTextArea = "richTextArea",
  URL = "url",
  Time = "time",
  EncryptedText = "encryptedText",
  ExternalLookup = "externalLookup",
  IndirectLookup = "indirectLookup",
  MetadataRelationship = "metadataRelationship"
} 

export enum Operator  {
  Equals =  "=",
  NotEquals = "!=",
  GreaterThan = ">",
  LessThan = "<",
  GreaterThanOrEquals = ">=",
  LessThanOrEquals = "<=",
  Like = "LIKE",
  In = "IN",
  NotIn = "NOT IN",
  Includes=  "INCLUDES",
  Excludes= "EXCLUDES"
}

type SOQL_FUN_KEYWORDS = string;

/**
 * @description: represents one clause of the select statement or the agregate statement
 * @feature:  build the select and agregate clause
 */ 
interface SelectClauseKeywords {
  keyWord: SOQL_FUN_KEYWORDS;  // the key word to be used in the query. the %1 character  
  description: string;    // the description of the key word
  makeGroupBy: boolean;   // Indicates this select should be mirrored in the group by clause
  unGroupable: boolean;   // if the key word can be used just for ungrouped SOQL's
  groupable: boolean;     // if the key word can be used just for grouped SOQL's
  help: string;           // the help text to be displayed when the user selects the key word
}

export const SelectClauseKeywords: { [key: string]: SelectClauseKeywords } = {
  // default formats
  SQL_DATETIME: { keyWord: '%1',                    description: 'Default',           makeGroupBy: false,  unGroupable: true,  groupable: false, help: 'SOQL.Fun.DATETIME' } as const,
  SQL_DATE:     { keyWord: '%1',                    description: 'Default',           makeGroupBy: false,  unGroupable: true,  groupable: false, help: 'SOQL.Fun.DATE' } as const,
  SQL_ID:       { keyWord: '%1',                    description: 'Default',           makeGroupBy: false,  unGroupable: true,  groupable: false, help: 'SOQL.Fun.ID' } as const,
  SQL_CURRENCY: { keyWord: '%1',                    description: 'Default',           makeGroupBy: false,  unGroupable: true,  groupable: false, help: 'SOQL.Fun.CURRENCY' } as const,
  SQL_NUMBER:   { keyWord: '%1',                    description: 'Default',           makeGroupBy: false,  unGroupable: true,  groupable: false, help: 'SOQL.Fun.NUMBER' } as const,
  SQL_PERCENT:  { keyWord: '%1',                    description: 'Default',           makeGroupBy: false,  unGroupable: true,  groupable: false, help: 'SOQL.Fun.PERCENT' } as const,
  SQL_TEXT:     { keyWord: '%1',                    description: 'Default',           makeGroupBy: false,  unGroupable: true,  groupable: false, help: 'SOQL.Fun.TEXT' } as const,
  SQL_BOOLEAN:  { keyWord: '%1',                    description: 'Default',           makeGroupBy: false,  unGroupable: true,  groupable: true,  help: 'SOQL.Fun.BOOLEAN' } as const,
  SQL_PICKLIST: { keyWord: '%1',                    description: 'Default',           makeGroupBy: false,  unGroupable: true,  groupable: true,  help: 'SOQL.Fun.PICKLIST' } as const,
  // agregate functions
  SQL_COUNT0:   { keyWord: 'COUNT()',               description: 'Count records',     makeGroupBy: false,  unGroupable: false, groupable: true,  help: 'SOQL.Fun.COUNT()'} as const,
  SQL_COUNT1:   { keyWord: 'COUNT(%1)',             description: 'Count fields',      makeGroupBy: false,  unGroupable: false, groupable: true,  help: 'SOQL.Fun.COUNT(%1)' } as const,
  SQL_COUNT2:   { keyWord: 'COUNT_DISTINCT(%1)',    description: 'Count Distinct',    makeGroupBy: false,  unGroupable: false, groupable: true,  help: 'SOQL.Fun.COUNT_DISTINCT(%1)' } as const,
  SQL_SUM:      { keyWord: 'SUM(%1)',               description: 'Sum',               makeGroupBy: false,  unGroupable: false, groupable: true,  help: 'SOQL.Fun.SUM(%1)' } as const,
  SQL_AVG:      { keyWord: 'AVG(%1)',               description: 'Average',           makeGroupBy: false,  unGroupable: false, groupable: true,  help: 'SOQL.Fun.AVG(%1)' } as const,
  SQL_MIN:      { keyWord: 'MIN(%1)',               description: 'Minimum',           makeGroupBy: false,  unGroupable: false, groupable: true,  help: 'SOQL.Fun.MIN(%1)' } as const,
  SQL_MAX:      { keyWord: 'MAX(%1)',               description: 'Maximum',           makeGroupBy: false,  unGroupable: false, groupable: true,  help: 'SOQL.Fun.MAX(%1)' } as const,
  SQL_TYPEOF:   { keyWord: 'TYPEOF',                description: 'Type Of',           makeGroupBy: false,  unGroupable: false, groupable: true,  help: 'SOQL.Fun.TYPEOF' } as const,
  SQL_FORMAT:   { keyWord: 'FORMAT(%1)',            description: 'Format',            makeGroupBy: false,  unGroupable: true,  groupable: false, help: 'SOQL.Fun.FORMAT(%1)' } as const,
  SQL_CMONTH:   { keyWord: 'CALENDAR_MONTH(%1)',    description: 'Calendar Month',    makeGroupBy: true,   unGroupable: false, groupable: true,  help: 'SOQL.Fun.CALENDAR_MONTH(%1)' } as const,
  SQL_CQUARTER: { keyWord: 'CALENDAR_QUARTER(%1)',  description: 'Calendar Quarter',  makeGroupBy: true,   unGroupable: false, groupable: true,  help: 'SOQL.Fun.CALENDAR_QUARTER(%1)' } as const,
  SQL_CYEAR:    { keyWord: 'CALENDAR_YEAR(%1)',     description: 'Calendar Year',     makeGroupBy: true,   unGroupable: false, groupable: true,  help: 'SOQL.Fun.CALENDAR_YEAR(%1)' } as const,
  SQL_DAYONLY:  { keyWord: 'DAY_ONLY(%1)',          description: 'Day Only',          makeGroupBy: true,   unGroupable: false, groupable: true,  help: 'SOQL.Fun.DAY_ONLY(%1)' } as const,
  SQL_FMONTH:   { keyWord: 'FISCAL_MONTH(%1)',      description: 'Fiscal Month',      makeGroupBy: true,   unGroupable: false, groupable: true,  help: 'SOQL.Fun.FISCAL_MONTH(%1)' } as const,
  SQL_FQUARTER: { keyWord: 'FISCAL_QUARTER(%1)',    description: 'Fiscal Quarter',    makeGroupBy: true,   unGroupable: false, groupable: true,  help: 'SOQL.Fun.FISCAL_QUARTER(%1)' } as const,
  SQL_FYEAR:    { keyWord: 'FISCAL_YEAR(%1)',       description: 'Fiscal Year',       makeGroupBy: true,   unGroupable: false, groupable: true,  help: 'SOQL.Fun.FISCAL_YEAR(%1)' } as const,
  SQL_HOUR:     { keyWord: 'HOUR_IN_DAY(%1)',       description: 'Hour In Day',       makeGroupBy: true,   unGroupable: false, groupable: true,  help: 'SOQL.Fun.HOUR_IN_DAY(%1)' } as const,
  SQL_WEEK:     { keyWord: 'WEEK_IN_YEAR(%1)',      description: 'Week In Year',      makeGroupBy: true,   unGroupable: false, groupable: true,  help: 'SOQL.Fun.WEEK_IN_YEAR(%1)' } as const,
  SQL_CONV:     { keyWord: 'convertTimezone(%1)',   description: 'Convert Time',      makeGroupBy: false,  unGroupable: false, groupable: true,  help: 'SOQL.Fun.convertTimezone(%1)' } as const,
};

 export type SelectClauseKeywordsEnum = typeof SelectClauseKeywords[keyof typeof SelectClauseKeywords];
 

/**
 * @description: this Map relates the field type with the corresponding Select Clause Keywords available for that field type
 */
export const SQLClauseAllowedByTypeField: Map<SalesforceFieldTypesEnum, SelectClauseKeywords[]> = new Map<SalesforceFieldTypesEnum, SelectClauseKeywords[]>([
  [SalesforceFieldTypesEnum.Id, [
    SelectClauseKeywords.SQL_ID,
    SelectClauseKeywords.SQL_COUNT0,  
    SelectClauseKeywords.SQL_COUNT1,  
    SelectClauseKeywords.SQL_COUNT2
  ]],
  [SalesforceFieldTypesEnum.Date, [
    SelectClauseKeywords.SQL_DATE,
    SelectClauseKeywords.SQL_FORMAT,
    SelectClauseKeywords.SQL_MIN,
    SelectClauseKeywords.SQL_MAX,
    SelectClauseKeywords.SQL_DAYONLY,    
    SelectClauseKeywords.SQL_WEEK,    
    SelectClauseKeywords.SQL_CMONTH,
    SelectClauseKeywords.SQL_CQUARTER,
    SelectClauseKeywords.SQL_CYEAR,
    SelectClauseKeywords.SQL_FMONTH,
    SelectClauseKeywords.SQL_FQUARTER,
    SelectClauseKeywords.SQL_FYEAR,
  ]],
  [SalesforceFieldTypesEnum.DateTime, [
    SelectClauseKeywords.SQL_DATETIME,
    SelectClauseKeywords.SQL_FORMAT,
    SelectClauseKeywords.SQL_MIN,
    SelectClauseKeywords.SQL_MAX,
    SelectClauseKeywords.SQL_DAYONLY,    
    SelectClauseKeywords.SQL_WEEK,
    SelectClauseKeywords.SQL_CMONTH,
    SelectClauseKeywords.SQL_CQUARTER,
    SelectClauseKeywords.SQL_CYEAR,
    SelectClauseKeywords.SQL_FMONTH,
    SelectClauseKeywords.SQL_FQUARTER,
    SelectClauseKeywords.SQL_FYEAR,   
    SelectClauseKeywords.SQL_HOUR,    
    SelectClauseKeywords.SQL_CONV,
  ]],
  [SalesforceFieldTypesEnum.Currency, [
    SelectClauseKeywords.SQL_CURRENCY,
    SelectClauseKeywords.SQL_SUM,
    SelectClauseKeywords.SQL_AVG,
    SelectClauseKeywords.SQL_MIN,
    SelectClauseKeywords.SQL_MAX,
  ]],
  [SalesforceFieldTypesEnum.Number, [
    SelectClauseKeywords.SQL_NUMBER,
    SelectClauseKeywords.SQL_SUM,
    SelectClauseKeywords.SQL_AVG,
    SelectClauseKeywords.SQL_MIN,
    SelectClauseKeywords.SQL_MAX,
  ]],
  [SalesforceFieldTypesEnum.Percent, [
    SelectClauseKeywords.SQL_PERCENT,
    SelectClauseKeywords.SQL_SUM,
    SelectClauseKeywords.SQL_AVG,
    SelectClauseKeywords.SQL_MIN,
    SelectClauseKeywords.SQL_MAX,
  ]],
  [SalesforceFieldTypesEnum.Text, [
    SelectClauseKeywords.SQL_TEXT
  ]],
  [SalesforceFieldTypesEnum.TextArea, [
    SelectClauseKeywords.SQL_TEXT
  ]],
  [SalesforceFieldTypesEnum.LongTextArea, [
    SelectClauseKeywords.SQL_TEXT
  ]],
  [SalesforceFieldTypesEnum.Email, [
    SelectClauseKeywords.SQL_TEXT
  ]],
  [SalesforceFieldTypesEnum.Phone, [
    SelectClauseKeywords.SQL_TEXT
  ]],
  [SalesforceFieldTypesEnum.URL, [
    SelectClauseKeywords.SQL_TEXT
  ]],
  [SalesforceFieldTypesEnum.Checkbox, [
    SelectClauseKeywords.SQL_BOOLEAN
  ]],
  [SalesforceFieldTypesEnum.Picklist, [
    SelectClauseKeywords.SQL_PICKLIST
  ]],
  [SalesforceFieldTypesEnum.MultiselectPicklist, [
    SelectClauseKeywords.SQL_PICKLIST
  ]],
  [SalesforceFieldTypesEnum.Lookup, [
    SelectClauseKeywords.SQL_ID,
    SelectClauseKeywords.SQL_COUNT0,  
    SelectClauseKeywords.SQL_COUNT1,  
    SelectClauseKeywords.SQL_COUNT2
  ]],
]);


