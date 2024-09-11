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


export const SalesforceFieldTypes = {
  Id : "id",
  Address : "address",
  AutoNumber : "autoNumber",
  RollUpSummary : "rollUpSummary",
  Lookup : "lookup",
  MasterDetail : "masterDetail",
  Checkbox : "checkbox",
  Currency : "currency",
  Date : "date",
  DateTime : "datetime",
  Double : "double",
  Email : "email",
  Geolocation : "Geolocation",
  Number : "number",
  Percent : "percent",
  Phone : "phone",
  Picklist : "picklist",
  MultiselectPicklist : "multiselectPicklist",
  Text : "text",
  TextArea : "textArea",
  LongTextArea : "longTextArea",
  Reference : "reference",
  RichTextArea : "richTextArea",
  URL : "url",
  Time : "time",
  EncryptedText : "encryptedText",
  ExternalLookup : "externalLookup",
  IndirectLookup : "indirectLookup",
  MetadataRelationship : "metadataRelationship"
} as const;




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