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
  Checkbox = "checkbox",
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
  Text = "text",
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
/**
 * @description: represents one clause of the select statement or the agregate statement
 * @feature:  build the select and agregate clause
 */ 
interface SelectClauseKeywords {
  keyWord: string;        // the key word to be used in the query. the %1 character  
  description: string;    // the description of the key word
  unGroupable: boolean;   // if the key word can be used just for ungrouped SOQL's
  groupable: boolean;     // if the key word can be used just for grouped SOQL's
  help: string;           // the help text to be displayed when the user selects the key word
}

export const SelectClauseKeywords: { [key: string]: SelectClauseKeywords } = {
  SQL_COUNT0:   { keyWord: 'COUNT()',               description: 'Count',             unGroupable: false, groupable: true, help: 'SOQL.Fun.COUNT()'} as const,
  SQL_COUNT1:   { keyWord: 'COUNT(%1)',             description: 'Count',             unGroupable: false, groupable: true, help: 'SOQL.Fun.COUNT(%1)' } as const,
  SQL_COUNT2:   { keyWord: 'COUNT_DISTINCT(%1)',    description: 'Count Distinct',    unGroupable: false, groupable: true, help: 'SOQL.Fun.COUNT_DISTINCT(%1)' } as const,
  SQL_SUM:      { keyWord: 'SUM(%1)',               description: 'Sum',               unGroupable: false, groupable: true, help: 'SOQL.Fun.SUM(%1)' },
  SQL_AVG:      { keyWord: 'AVG(%1)',               description: 'Average',           unGroupable: false, groupable: true, help: 'SOQL.Fun.AVG(%1)' },
  SQL_MIN:      { keyWord: 'MIN(%1)',               description: 'Minimum',           unGroupable: false, groupable: true, help: 'SOQL.Fun.MIN(%1)' },
  SQL_MAX:      { keyWord: 'MAX(%1)',               description: 'Maximum',           unGroupable: false, groupable: true, help: 'SOQL.Fun.MAX(%1)' },
  SQL_TYPEOF:   { keyWord: 'TYPEOF',                description: 'Type Of',           unGroupable: false, groupable: true, help: 'SOQL.Fun.TYPEOF' },
  SQL_FORMAT:   { keyWord: 'FORMAT(%1)',            description: 'Format',            unGroupable: true,  groupable: true, help: 'SOQL.Fun.FORMAT(%1)' },
  SQL_CMONTH:   { keyWord: 'CALENDAR_MONTH(%1)',    description: 'Calendar Month',    unGroupable: false, groupable: true, help: 'SOQL.Fun.CALENDAR_MONTH(%1)' },
  SQL_CQUARTER: { keyWord: 'CALENDAR_QUARTER(%1)',  description: 'Calendar Quarter',  unGroupable: false, groupable: true, help: 'SOQL.Fun.CALENDAR_QUARTER(%1)' },
  SQL_CYEAR:    { keyWord: 'CALENDAR_YEAR(%1)',     description: 'Calendar Year',     unGroupable: false, groupable: true, help: 'SOQL.Fun.CALENDAR_YEAR(%1)' },
  SQL_DAYONLY:  { keyWord: 'DAY_ONLY(%1)',          description: 'Day Only',          unGroupable: false, groupable: true, help: 'SOQL.Fun.DAY_ONLY(%1)' },
  SQL_FMONTH:   { keyWord: 'FISCAL_MONTH(%1)',      description: 'Fiscal Month',      unGroupable: false, groupable: true, help: 'SOQL.Fun.FISCAL_MONTH(%1)' },
  SQL_FQUARTER: { keyWord: 'FISCAL_QUARTER(%1)',    description: 'Fiscal Quarter',    unGroupable: false, groupable: true, help: 'SOQL.Fun.FISCAL_QUARTER(%1)' },
  SQL_FYEAR:    { keyWord: 'FISCAL_YEAR(%1)',       description: 'Fiscal Year',       unGroupable: false, groupable: true, help: 'SOQL.Fun.FISCAL_YEAR(%1)' },
  SQL_HOUR:     { keyWord: 'HOUR_IN_DAY(%1)',       description: 'Hour In Day',       unGroupable: false, groupable: true, help: 'SOQL.Fun.HOUR_IN_DAY(%1)' },
  SQL_WEEK:     { keyWord: 'WEEK_IN_YEAR(%1)',      description: 'Week In Year',      unGroupable: false, groupable: true, help: 'SOQL.Fun.WEEK_IN_YEAR(%1)' },
  SQL_CONV:     { keyWord: 'convertTimezone(%1)',   description: 'Convert Time',      unGroupable: false, groupable: true, help: 'SOQL.Fun.convertTimezone(%1)' },
  SQL_DATE:     { keyWord: '%1',                    description: 'ISO 8601',          unGroupable: false, groupable: true, help: '(By Default) YYYY-MM-DD ' },
  SQL_DATETIME: { keyWord: '%1',                    description: 'ISO 8601',          unGroupable: false, groupable: true, help: '(By Default) AAAA-MM-DDTHH:MM:SSZ' },
};



/**
 * @description: this Map relates the field type with the corresponding Select Clause Keywords available for that field type
 */
export const SQLClauseAllowedByTypeField: Map<SalesforceFieldTypesEnum, SelectClauseKeywords[]> = new Map<SalesforceFieldTypesEnum, SelectClauseKeywords[]>([
  [SalesforceFieldTypesEnum.Id, [
    SelectClauseKeywords.SQL_COUNT0,  
    SelectClauseKeywords.SQL_COUNT1,  
    SelectClauseKeywords.SQL_COUNT2
  ]],
  [SalesforceFieldTypesEnum.Date, [
    SelectClauseKeywords.SQL_MIN,
    SelectClauseKeywords.SQL_MAX,
    SelectClauseKeywords.SQL_FORMAT,
    SelectClauseKeywords.SQL_CMONTH,
    SelectClauseKeywords.SQL_CQUARTER,
    SelectClauseKeywords.SQL_CYEAR,
    SelectClauseKeywords.SQL_DAYONLY,
    SelectClauseKeywords.SQL_FMONTH,
    SelectClauseKeywords.SQL_FQUARTER,
    SelectClauseKeywords.SQL_FYEAR,
  ]],
  [SalesforceFieldTypesEnum.DateTime, [
    SelectClauseKeywords.SQL_MIN,
    SelectClauseKeywords.SQL_MAX,
    SelectClauseKeywords.SQL_FORMAT,
    SelectClauseKeywords.SQL_CMONTH,
    SelectClauseKeywords.SQL_CQUARTER,
    SelectClauseKeywords.SQL_CYEAR,
    SelectClauseKeywords.SQL_DAYONLY,
    SelectClauseKeywords.SQL_FMONTH,
    SelectClauseKeywords.SQL_FQUARTER,
    SelectClauseKeywords.SQL_FYEAR,   
    SelectClauseKeywords.SQL_HOUR,    
    SelectClauseKeywords.SQL_CONV,
  ]],

]);


