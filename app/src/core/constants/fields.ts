const I18TEXT   = '#TextLiteral' as const;
//const I18NUMBER = '#NumberLiteral' as const;

//depricated
export enum IconCharacter  {
  UNDO = '&#8634;',      // ↺ U+21BA
  BACK = '&#8630;',      // ↶
  ORDER_ASC = '&#8593;', // ⬆️
  ORDER_DESC = '&#8595;',// ⬇️
  WHERE = '&#128269;',   // 🔍  U+1F50D
  EXE = '&#128498',     // 🗲  U+1F5F2
}

export enum SelectAllFieldsEnum {
  ALL = 'FIELDS(ALL)',
  CUSTOM = 'FIELDS(CUSTOM)',
  STANDARD = 'FIELDS(STANDARD)',
} 

export const NumberFieldLiteralTypeEnum = {
  NULL: 'Null',
  SINGLE: 'Single',
  RANGE: 'Range',
} as const;



export const TextFieldLiteralTypeEnum = {
  NULL: 'Null',
  SINGLE: 'Single',
  RANGE: 'Range',
  LIST: 'List',  
} as const;


export type TypeHTML = 'text' | 'date' | 'datetime-local' | 'number' | 'geo' | 'picklist' | 'big-text' | 'Multi' | 'time';
export type SelectComponent= 'TEXT' | 'DATATIME' | 'ID' | 'NUMBER' |'PICKLIST' |'MULTI_PICKLIST' | 'NOT_ALLOWED';
interface SalesforceFieldTypesDefinition {
  typeHTML: TypeHTML;
  selectComponent: SelectComponent;
  description: string;
  icon?: string;
}


export enum SFFieldTypesEnum   {
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
  Percent = "percent",
  Phone = "phone",
  Picklist = "picklist",
  MultiselectPicklist = "multiselectPicklist",
  Text = "string",
  TextArea = "textarea",
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






export const salesforceFieldTypesDefinition: Map<SFFieldTypesEnum, SalesforceFieldTypesDefinition> = new Map<SFFieldTypesEnum, SalesforceFieldTypesDefinition>([
  [SFFieldTypesEnum.Id,            { typeHTML: 'text',            selectComponent: 'TEXT',  description: "Unique identifier for each record" }],
  [SFFieldTypesEnum.Address,       { typeHTML: 'text',            selectComponent: 'TEXT' , description: "Geographical address data" }],
  [SFFieldTypesEnum.AutoNumber,    { typeHTML: 'text' ,           selectComponent: 'TEXT' , description: "Automatically generated number" }],
  [SFFieldTypesEnum.RollUpSummary, { typeHTML: 'number',          selectComponent: 'NUMBER' ,description: "Summarizes child records" }],
  [SFFieldTypesEnum.Lookup,        { typeHTML: 'number',          selectComponent: 'NUMBER' ,description: "Lookup relationship field" }],
  [SFFieldTypesEnum.MasterDetail,  { typeHTML: 'number',          selectComponent: 'NUMBER' ,description: "Master-Detail relationship field" }],
  [SFFieldTypesEnum.Checkbox,      { typeHTML: 'text',            selectComponent: 'TEXT' ,description: "Boolean field type" }],
  [SFFieldTypesEnum.Currency,      { typeHTML: 'number',          selectComponent: 'NUMBER' ,description: "Currency values with precision" }],
  [SFFieldTypesEnum.Date,          { typeHTML: 'date' ,           selectComponent: 'DATATIME' ,description: "Date field without time" }],
  [SFFieldTypesEnum.DateTime,      { typeHTML: 'datetime-local' , selectComponent: 'DATATIME' ,description: "Date and time field" }],
  [SFFieldTypesEnum.Double,        { typeHTML: 'number' ,         selectComponent: 'NUMBER' ,description: "Double-precision number" }],
  [SFFieldTypesEnum.Email,         { typeHTML: 'text' ,           selectComponent: 'TEXT' ,description: "Email address field" }],
  [SFFieldTypesEnum.Geolocation,   { typeHTML: 'geo' , selectComponent: 'TEXT' ,description: "Latitude and longitude coordinates" }],
  [SFFieldTypesEnum.Percent,       { typeHTML: 'number' , selectComponent: 'TEXT' ,description: "Percentage field" }],
  [SFFieldTypesEnum.Phone,         { typeHTML: 'text' , selectComponent: 'TEXT' ,description: "Phone number field" }],
  [SFFieldTypesEnum.Picklist,      { typeHTML: 'picklist' , selectComponent: 'PICKLIST' ,description: "Single picklist selection" }],
  [SFFieldTypesEnum.Text,          { typeHTML: 'text' , selectComponent: 'TEXT' ,description: "String or text field" }],
  [SFFieldTypesEnum.TextArea,      { typeHTML: 'text' , selectComponent: 'NOT_ALLOWED' ,description: "Text area with multi-line support" }],
  [SFFieldTypesEnum.LongTextArea,  { typeHTML: 'text' , selectComponent: 'NOT_ALLOWED' ,description: "Long text area field" }],
  [SFFieldTypesEnum.Reference,     { typeHTML: 'text' , selectComponent: 'TEXT' ,description: "Reference to another object" }],
  [SFFieldTypesEnum.RichTextArea,  { typeHTML: 'text' , selectComponent: 'NOT_ALLOWED' ,description: "Rich text area with formatting" }],
  [SFFieldTypesEnum.URL,           { typeHTML: 'text' , selectComponent: 'TEXT' ,description: "URL field" }],
  [SFFieldTypesEnum.Time,          { typeHTML: 'time' , selectComponent: 'TEXT' ,description: "Time field without date" }],
  [SFFieldTypesEnum.EncryptedText, { typeHTML: 'text' , selectComponent: 'NOT_ALLOWED' ,description: "Encrypted text field" }],
  [SFFieldTypesEnum.ExternalLookup,{ typeHTML: 'text' , selectComponent: 'TEXT' ,description: "External lookup relationship" }],
  [SFFieldTypesEnum.IndirectLookup,{ typeHTML: 'text' , selectComponent: 'TEXT' ,description: "Indirect lookup relationship" }],
  [SFFieldTypesEnum.MultiselectPicklist,  { typeHTML: 'Multi' , selectComponent: 'TEXT' ,description: "Multiple picklist selection" }],
  [SFFieldTypesEnum.MetadataRelationship, { typeHTML: 'text' , selectComponent: 'TEXT' ,description: "Relationship to metadata" }],
]);


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
  Excludes= "EXCLUDES",
  NotNull= "!= Null",
  IsNull= "= Null",
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
  SQL_DATETIME: { keyWord: '%1',                    description: 'Default',           makeGroupBy: false,  unGroupable: true,  groupable: false, help: '#SOQL.Fun.DATETIME' } as const,
  SQL_DATE:     { keyWord: '%1',                    description: 'Default',           makeGroupBy: false,  unGroupable: true,  groupable: false, help: '#SOQL.Fun.DATE' } as const,
  SQL_ID:       { keyWord: '%1',                    description: 'Default',           makeGroupBy: false,  unGroupable: true,  groupable: false, help: '#SOQL_ID' } as const,
  SQL_CURRENCY: { keyWord: '%1',                    description: 'Default',           makeGroupBy: false,  unGroupable: true,  groupable: false, help: '#SOQL_CURRENCY' } as const,
  SQL_NUMBER:   { keyWord: '%1',                    description: 'Default',           makeGroupBy: false,  unGroupable: true,  groupable: false, help: '#SOQL_NUMBER' } as const,
  SQL_PERCENT:  { keyWord: '%1',                    description: 'Default',           makeGroupBy: false,  unGroupable: true,  groupable: false, help: '#SOQL_PERCENT' } as const,
  SQL_TEXT:     { keyWord: '%1',                    description: 'Default',           makeGroupBy: false,  unGroupable: true,  groupable: false, help: '#SOQL_TEXT' } as const,
  SQL_BOOLEAN:  { keyWord: '%1',                    description: 'Default',           makeGroupBy: false,  unGroupable: true,  groupable: true,  help: '#SOQL_BOOLEAN' } as const,
  SQL_PICKLIST: { keyWord: '%1',                    description: 'Default',           makeGroupBy: false,  unGroupable: true,  groupable: false, help: '#SOQL_PICKLIST' } as const,
  // agregate functions
  SQL_PICKLISTA:{ keyWord: '%1 ',                   description: 'Group by',          makeGroupBy: true,   unGroupable: false,  groupable: true, help: '#SOQL.Fun.PICKLIST_GROUPBY' } as const,
  SQL_COUNT0:   { keyWord: 'COUNT()',               description: 'Count records',     makeGroupBy: false,  unGroupable: false, groupable: true,  help: '#SOQL.Fun.COUNT()'} as const,
  SQL_COUNT1:   { keyWord: 'COUNT(%1)',             description: 'Count fields',      makeGroupBy: false,  unGroupable: false, groupable: true,  help: '#SOQL.Fun.COUNT(%1)' } as const,
  SQL_COUNT2:   { keyWord: 'COUNT_DISTINCT(%1)',    description: 'Count Distinct',    makeGroupBy: false,  unGroupable: false, groupable: true,  help: '#SOQL.Fun.COUNT_DISTINCT(%1)' } as const,
  SQL_SUM:      { keyWord: 'SUM(%1)',               description: 'Sum',               makeGroupBy: false,  unGroupable: false, groupable: true,  help: '#SOQL.Fun.SUM(%1)' } as const,
  SQL_AVG:      { keyWord: 'AVG(%1)',               description: 'Average',           makeGroupBy: false,  unGroupable: false, groupable: true,  help: '#SOQL.Fun.AVG(%1)' } as const,
  SQL_MIN:      { keyWord: 'MIN(%1)',               description: 'Minimum',           makeGroupBy: false,  unGroupable: false, groupable: true,  help: '#SOQL.Fun.MIN(%1)' } as const,
  SQL_MAX:      { keyWord: 'MAX(%1)',               description: 'Maximum',           makeGroupBy: false,  unGroupable: false, groupable: true,  help: '#SOQL.Fun.MAX(%1)' } as const,
  SQL_TYPEOF:   { keyWord: 'TYPEOF',                description: 'Type Of',           makeGroupBy: false,  unGroupable: false, groupable: true,  help: '#SOQL.Fun.TYPEOF' } as const,
  SQL_FORMAT:   { keyWord: 'FORMAT(%1)',            description: 'Format',            makeGroupBy: false,  unGroupable: true,  groupable: false, help: '#SOQL.Fun.FORMAT(%1)' } as const,
  SQL_CMONTH:   { keyWord: 'CALENDAR_MONTH(%1)',    description: 'Calendar Month',    makeGroupBy: true,   unGroupable: false, groupable: true,  help: '#SOQL.Fun.CALENDAR_MONTH(%1)' } as const,
  SQL_CQUARTER: { keyWord: 'CALENDAR_QUARTER(%1)',  description: 'Calendar Quarter',  makeGroupBy: true,   unGroupable: false, groupable: true,  help: '#SOQL.Fun.CALENDAR_QUARTER(%1)' } as const,
  SQL_CYEAR:    { keyWord: 'CALENDAR_YEAR(%1)',     description: 'Calendar Year',     makeGroupBy: true,   unGroupable: false, groupable: true,  help: '#SOQL.Fun.CALENDAR_YEAR(%1)' } as const,
  SQL_DAYONLY:  { keyWord: 'DAY_ONLY(%1)',          description: 'Day Only',          makeGroupBy: true,   unGroupable: false, groupable: true,  help: '#SOQL.Fun.DAY_ONLY(%1)' } as const,
  SQL_FMONTH:   { keyWord: 'FISCAL_MONTH(%1)',      description: 'Fiscal Month',      makeGroupBy: true,   unGroupable: false, groupable: true,  help: '#SOQL.Fun.FISCAL_MONTH(%1)' } as const,
  SQL_FQUARTER: { keyWord: 'FISCAL_QUARTER(%1)',    description: 'Fiscal Quarter',    makeGroupBy: true,   unGroupable: false, groupable: true,  help: '#SOQL.Fun.FISCAL_QUARTER(%1)' } as const,
  SQL_FYEAR:    { keyWord: 'FISCAL_YEAR(%1)',       description: 'Fiscal Year',       makeGroupBy: true,   unGroupable: false, groupable: true,  help: '#SOQL.Fun.FISCAL_YEAR(%1)' } as const,
  SQL_HOUR:     { keyWord: 'HOUR_IN_DAY(%1)',       description: 'Hour In Day',       makeGroupBy: true,   unGroupable: false, groupable: true,  help: '#SOQL.Fun.HOUR_IN_DAY(%1)' } as const,
  SQL_WEEK:     { keyWord: 'WEEK_IN_YEAR(%1)',      description: 'Week In Year',      makeGroupBy: true,   unGroupable: false, groupable: true,  help: '#SOQL.Fun.WEEK_IN_YEAR(%1)' } as const,
  SQL_CONV:     { keyWord: 'convertTimezone(%1)',   description: 'Convert Time',      makeGroupBy: false,  unGroupable: false, groupable: true,  help: '#SOQL.Fun.convertTimezone(%1)' } as const,
};

 export type SelectClauseKeywordsEnum = typeof SelectClauseKeywords[keyof typeof SelectClauseKeywords];
 

/**
 * @description: this Map relates the field type with the corresponding Select Clause Keywords available for that field type
 */
export const SQLClauseAllowedByTypeField: Map<SFFieldTypesEnum, SelectClauseKeywords[]> = new Map<SFFieldTypesEnum, SelectClauseKeywords[]>([
  [SFFieldTypesEnum.Id, [
    SelectClauseKeywords.SQL_ID,
    SelectClauseKeywords.SQL_COUNT0,  
    SelectClauseKeywords.SQL_COUNT1,  
    SelectClauseKeywords.SQL_COUNT2
  ]],
  [SFFieldTypesEnum.Date, [
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
  [SFFieldTypesEnum.DateTime, [
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
  [SFFieldTypesEnum.Currency, [
    SelectClauseKeywords.SQL_CURRENCY,
    SelectClauseKeywords.SQL_SUM,
    SelectClauseKeywords.SQL_AVG,
    SelectClauseKeywords.SQL_MIN,
    SelectClauseKeywords.SQL_MAX,
  ]],
  [SFFieldTypesEnum.Double, [
    SelectClauseKeywords.SQL_NUMBER,
    SelectClauseKeywords.SQL_SUM,
    SelectClauseKeywords.SQL_AVG,
    SelectClauseKeywords.SQL_MIN,
    SelectClauseKeywords.SQL_MAX,
  ]],
  [SFFieldTypesEnum.Percent, [
    SelectClauseKeywords.SQL_PERCENT,
    SelectClauseKeywords.SQL_SUM,
    SelectClauseKeywords.SQL_AVG,
    SelectClauseKeywords.SQL_MIN,
    SelectClauseKeywords.SQL_MAX,
  ]],
  [SFFieldTypesEnum.Text, [
    SelectClauseKeywords.SQL_TEXT
  ]],
  [SFFieldTypesEnum.TextArea, [
    SelectClauseKeywords.SQL_TEXT
  ]],
  [SFFieldTypesEnum.LongTextArea, [
    SelectClauseKeywords.SQL_TEXT
  ]],
  [SFFieldTypesEnum.Email, [
    SelectClauseKeywords.SQL_TEXT
  ]],
  [SFFieldTypesEnum.Phone, [
    SelectClauseKeywords.SQL_TEXT
  ]],
  [SFFieldTypesEnum.URL, [
    SelectClauseKeywords.SQL_TEXT
  ]],
  [SFFieldTypesEnum.Checkbox, [
    SelectClauseKeywords.SQL_BOOLEAN
  ]],
  [SFFieldTypesEnum.Picklist, [
    SelectClauseKeywords.SQL_PICKLIST,
    SelectClauseKeywords.SQL_PICKLISTA
  ]],
  [SFFieldTypesEnum.MultiselectPicklist, [
    SelectClauseKeywords.SQL_PICKLIST
  ]],
  [SFFieldTypesEnum.Lookup, [
    SelectClauseKeywords.SQL_ID,
    SelectClauseKeywords.SQL_COUNT0,  
    SelectClauseKeywords.SQL_COUNT1,  
    SelectClauseKeywords.SQL_COUNT2
  ]],
]);


const TextLiteralCondition:  [Operator, {typeCondition: string, description:string}][] = [
  [Operator.Equals,               {typeCondition: TextFieldLiteralTypeEnum.SINGLE, description:"EQUAL"}],
  [Operator.NotEquals,            {typeCondition: TextFieldLiteralTypeEnum.SINGLE, description:"NOT_EQUAL"}],
  [Operator.GreaterThan,          {typeCondition: TextFieldLiteralTypeEnum.SINGLE, description:"GREATER_THAN"}],
  [Operator.LessThan,             {typeCondition: TextFieldLiteralTypeEnum.SINGLE, description:"LESS_THAN"}],
  [Operator.GreaterThanOrEquals,  {typeCondition: TextFieldLiteralTypeEnum.SINGLE, description:"GREATER_THAN_OR_EQUAL"}],
  [Operator.LessThanOrEquals,     {typeCondition: TextFieldLiteralTypeEnum.SINGLE, description:"LESS_THAN_OR_EQUAL"}],
  [Operator.Like,                 {typeCondition: TextFieldLiteralTypeEnum.SINGLE, description:"LIKE"}],

  [Operator.Equals,               {typeCondition: TextFieldLiteralTypeEnum.RANGE, description:"EQUAL"}],
  [Operator.NotEquals,            {typeCondition: TextFieldLiteralTypeEnum.RANGE, description:"NOT_EQUAL"}],
  [Operator.GreaterThan,          {typeCondition: TextFieldLiteralTypeEnum.RANGE, description:"GREATER_THAN"}],
  [Operator.LessThan,             {typeCondition: TextFieldLiteralTypeEnum.RANGE, description:"LESS_THAN"}],
  [Operator.GreaterThanOrEquals,  {typeCondition: TextFieldLiteralTypeEnum.RANGE, description:"GREATER_THAN_OR_EQUAL"}],
  [Operator.LessThanOrEquals,     {typeCondition: TextFieldLiteralTypeEnum.RANGE, description:"LESS_THAN_OR_EQUAL"}],

  [Operator.In,                   {typeCondition: TextFieldLiteralTypeEnum.LIST,  description:"IN"}],
  [Operator.NotIn,                {typeCondition: TextFieldLiteralTypeEnum.LIST,  description:"NOT_IN"}],

  [Operator.Equals,               {typeCondition: TextFieldLiteralTypeEnum.NULL,  description:"EQUAL"}],
  [Operator.NotEquals,            {typeCondition: TextFieldLiteralTypeEnum.NULL,  description:"NOT_EQUAL"}],
];  


const NumberLiteralCondition:  [Operator, {typeCondition: string, description:string}][] = [
  [Operator.Equals,               {typeCondition: TextFieldLiteralTypeEnum.SINGLE, description:"EQUAL"}],
  [Operator.NotEquals,            {typeCondition: TextFieldLiteralTypeEnum.SINGLE, description:"NOT_EQUAL"}],
  [Operator.GreaterThan,          {typeCondition: TextFieldLiteralTypeEnum.SINGLE, description:"GREATER_THAN"}],
  [Operator.LessThan,             {typeCondition: TextFieldLiteralTypeEnum.SINGLE, description:"LESS_THAN"}],
  [Operator.GreaterThanOrEquals,  {typeCondition: TextFieldLiteralTypeEnum.SINGLE, description:"GREATER_THAN_OR_EQUAL"}],
  [Operator.LessThanOrEquals,     {typeCondition: TextFieldLiteralTypeEnum.SINGLE, description:"LESS_THAN_OR_EQUAL"}],

  [Operator.Equals,               {typeCondition: TextFieldLiteralTypeEnum.RANGE, description:"EQUAL"}],
  [Operator.NotEquals,            {typeCondition: TextFieldLiteralTypeEnum.RANGE, description:"NOT_EQUAL"}],
  [Operator.GreaterThan,          {typeCondition: TextFieldLiteralTypeEnum.RANGE, description:"GREATER_THAN"}],
  [Operator.LessThan,             {typeCondition: TextFieldLiteralTypeEnum.RANGE, description:"LESS_THAN"}],
  [Operator.GreaterThanOrEquals,  {typeCondition: TextFieldLiteralTypeEnum.RANGE, description:"GREATER_THAN_OR_EQUAL"}],
  [Operator.LessThanOrEquals,     {typeCondition: TextFieldLiteralTypeEnum.RANGE, description:"LESS_THAN_OR_EQUAL"}],

  [Operator.Equals,               {typeCondition: TextFieldLiteralTypeEnum.NULL,  description:"EQUAL"}],
  [Operator.NotEquals,            {typeCondition: TextFieldLiteralTypeEnum.NULL,  description:"NOT_EQUAL"}],
];  




interface TextConditionLiteralType {
  type: string;
  description: string;
}

interface TextConditionLiteral {
  sqlKeyWord: string;
  description: string;
}


export class TextFieldCtrl {
    /**
     * @description get an array of TypeLiteral and description
     */
    static getType = (): TextConditionLiteralType[] => {
      return  Object.entries(TextFieldLiteralTypeEnum).
              map(([key, value]):TextConditionLiteralType => ({type: value, description: `${I18TEXT}.Type.${key}` }));
    }

    /**
     * @description get an array of conditions and description
     */
    static getTextCondition = (typeCondition: string ): TextConditionLiteral[] => {
      return TextLiteralCondition
        .filter(([, value]) => value.typeCondition === typeCondition)
        .map(([key, value]):TextConditionLiteral => (
          {
              sqlKeyWord: key, 
              description: `${I18TEXT}.${value.typeCondition}.${value.description}`
          }
      ));
    }


      
    static getSQLChunck = (params: {fieldApiName: string, fieldIndex: number, condition: string, keyWordWhere: string, whereParamValues: WhereParamValues | undefined}): SimpleCondition | pairCondition => {
      const {fieldApiName, fieldIndex, condition, keyWordWhere, whereParamValues} = params;
      const field: FieldId = { fieldApiName, fieldIndex }

    if (whereParamValues) {
        const from = `'${whereParamValues.from}'`;
        const to = `'${whereParamValues.to}'`;
        
      
        if (keyWordWhere===TextFieldLiteralTypeEnum.NULL.toString()) {
              return {field, operator: condition, value: 'null', 
                sqlString: `${fieldApiName} ${condition} null` };
        }            

        if (keyWordWhere===TextFieldLiteralTypeEnum.SINGLE.toString()) {
            return {field, operator: condition, value: from, 
              sqlString: `${fieldApiName} ${condition} ${from}` };          
        }


        if (keyWordWhere===TextFieldLiteralTypeEnum.LIST.toString()) {
            

            const list = (whereParamValues.list)? whereParamValues.list!
              .replaceAll(',','') 
              .split('\n')
              .map((item) => `'${item}'`).join(',') : '?'
            return {field, operator: condition, value: whereParamValues.list, 
              sqlString: `${fieldApiName} ${condition}  (${list})` };

        }


        if (condition === '=') {
            return {field, operator: '>=', value: from, logicalOperator: 'AND' , operatorTo: '<=', valueTo: to,
                sqlString: `(${fieldApiName} >= ${from} AND ${fieldApiName} <= ${to})`};
                    
        }
        if (condition === '!=') {
            return {field, operator: '<', value: from, logicalOperator: 'AND' , operatorTo: '>', valueTo: to,
                    sqlString: `(${fieldApiName} < ${from} AND ${fieldApiName} > ${to})`};
        }

        if (condition === '>' || condition === '>=') {
            return {field, operator: condition, value: to, sqlString: `${fieldApiName} ${condition} ${to}` };
        }

        if (condition === '<' || condition === '<=') {
            return {field, operator: condition, value: from, sqlString: `${fieldApiName} ${condition} ${from}` };
        }
    }
    return {field, operator: condition, value: keyWordWhere, sqlString: `${fieldApiName} ${condition} ${keyWordWhere}` }; 
  }
}

export class NumberFieldCtrl {
  /**
   * @description get an array of TypeLiteral and description
   */
  static getType = (): TextConditionLiteralType[] => {
    return  Object.entries(NumberFieldLiteralTypeEnum).
            map(([key, value]):TextConditionLiteralType => ({type: value, description: `${I18TEXT}.Type.${key}` }));
  }

  /**
   * @description get an array of conditions and description
   */
  static getTextCondition = (typeCondition: string ): TextConditionLiteral[] => {
    return NumberLiteralCondition
      .filter(([, value]) => value.typeCondition === typeCondition)
      .map(([key, value]):TextConditionLiteral => (
        {
            sqlKeyWord: key, 
            description: `${I18TEXT}.${value.typeCondition}.${value.description}`
        }
    ));
  }


    
  static getSQLChunck = (params: {fieldApiName: string, fieldIndex: number, condition: string, keyWordWhere: string, whereParamValues: WhereParamValues | undefined}): SimpleCondition | pairCondition => {
    const {fieldApiName, fieldIndex, condition, keyWordWhere, whereParamValues} = params;
    const field: FieldId = { fieldApiName, fieldIndex }

  if (whereParamValues) {
      const {from, to} = whereParamValues; 
    
      if (keyWordWhere===TextFieldLiteralTypeEnum.NULL.toString()) {
            return {field, operator: condition, value: 'null', 
              sqlString: `${fieldApiName} ${condition} null` };
      }            

      if (keyWordWhere===TextFieldLiteralTypeEnum.SINGLE.toString()) {
          return {field, operator: condition, value: from, 
            sqlString: `${fieldApiName} ${condition} ${from}` };          
      }


      if (condition === '=') {
          return {field, operator: '>=', value: from, logicalOperator: 'AND' , operatorTo: '<=', valueTo: to,
              sqlString: `(${fieldApiName} >= ${from} AND ${fieldApiName} <= ${to})`};
                  
      }
      if (condition === '!=') {
          return {field, operator: '<', value: from, logicalOperator: 'AND' , operatorTo: '>', valueTo: to,
                  sqlString: `(${fieldApiName} < ${from} AND ${fieldApiName} > ${to})`};
      }

      if (condition === '>' || condition === '>=') {
          return {field, operator: condition, value: to, sqlString: `${fieldApiName} ${condition} ${to}` };
      }

      if (condition === '<' || condition === '<=') {
          return {field, operator: condition, value: from, sqlString: `${fieldApiName} ${condition} ${from}` };
      }
  }
  return {field, operator: condition, value: keyWordWhere, sqlString: `${fieldApiName} ${condition} ${keyWordWhere}` }; 
}
}
