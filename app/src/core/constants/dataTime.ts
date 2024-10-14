import { Operator } from './fields';
const translationName= '#DateTimeLiteral' as const;


const DateTimeLiteralTypeEnum = {
    DAY: 1,
    WEEK: 2,
    MONTH: 3,
    QUARTER: 4,
    YEAR: 5,
    FISCAL_QUARTER:6,
    FISCAL_YEAR: 7,
    NULL_VALUE: 8
} as const;

export const CUSTOM_DATE = 'ACUSTOM';
export const CUSTOM_RANGE_DATE = 'CUSTOM_RANGE';  
       const NULL_VALUES = 'NULL_VALUES';

const DateTimeLiteralKeyWord: [string, number][] = [
    [`${NULL_VALUES}`, DateTimeLiteralTypeEnum.NULL_VALUE],

    ['YESTERDAY', DateTimeLiteralTypeEnum.DAY],
    ['TODAY', DateTimeLiteralTypeEnum.DAY],
    ['TOMORROW', DateTimeLiteralTypeEnum.DAY],
    ['LAST_N_DAYS', DateTimeLiteralTypeEnum.DAY],
    ['NEXT_N_DAYS', DateTimeLiteralTypeEnum.DAY],
    ['N_DAYS_AGO', DateTimeLiteralTypeEnum.DAY],
    [`${CUSTOM_DATE}_DAY`, DateTimeLiteralTypeEnum.DAY],
    [`${CUSTOM_RANGE_DATE}_DAYS`, DateTimeLiteralTypeEnum.DAY],

    ['LAST_WEEK', DateTimeLiteralTypeEnum.WEEK],
    ['THIS_WEEK', DateTimeLiteralTypeEnum.WEEK],
    ['NEXT_WEEK', DateTimeLiteralTypeEnum.WEEK],
    ['NEXT_N_WEEKS', DateTimeLiteralTypeEnum.WEEK],
    ['LAST_N_WEEKS', DateTimeLiteralTypeEnum.WEEK],
    ['N_WEEKS_AGO', DateTimeLiteralTypeEnum.WEEK],
    [`${CUSTOM_DATE}_WEEK`, DateTimeLiteralTypeEnum.WEEK],
    [`${CUSTOM_RANGE_DATE}_WEEKS`, DateTimeLiteralTypeEnum.WEEK],    


    ['LAST_MONTH', DateTimeLiteralTypeEnum.MONTH],
    ['THIS_MONTH', DateTimeLiteralTypeEnum.MONTH],
    ['NEXT_MONTH', DateTimeLiteralTypeEnum.MONTH],
    ['NEXT_N_MONTHS', DateTimeLiteralTypeEnum.MONTH],
    ['LAST_N_MONTHS', DateTimeLiteralTypeEnum.MONTH],
    ['N_MONTHS_AGO', DateTimeLiteralTypeEnum.MONTH],
    [`${CUSTOM_DATE}_MONTH`, DateTimeLiteralTypeEnum.MONTH],
    [`${CUSTOM_RANGE_DATE}_MONTHS`, DateTimeLiteralTypeEnum.MONTH],        


    ['LAST_90_DAYS', DateTimeLiteralTypeEnum.QUARTER],
    ['NEXT_90_DAYS', DateTimeLiteralTypeEnum.QUARTER],
    ['THIS_QUARTER', DateTimeLiteralTypeEnum.QUARTER],
    ['LAST_QUARTER', DateTimeLiteralTypeEnum.QUARTER],
    ['NEXT_QUARTER', DateTimeLiteralTypeEnum.QUARTER],
    ['NEXT_N_QUARTERS', DateTimeLiteralTypeEnum.QUARTER],
    ['LAST_N_QUARTERS', DateTimeLiteralTypeEnum.QUARTER],
    ['N_QUARTERS_AGO', DateTimeLiteralTypeEnum.QUARTER],

    ['THIS_YEAR', DateTimeLiteralTypeEnum.YEAR],
    ['LAST_YEAR', DateTimeLiteralTypeEnum.YEAR],
    ['NEXT_YEAR', DateTimeLiteralTypeEnum.YEAR],
    ['NEXT_N_YEARS', DateTimeLiteralTypeEnum.YEAR],
    ['LAST_N_YEARS', DateTimeLiteralTypeEnum.YEAR],
    ['N_YEARS_AGO', DateTimeLiteralTypeEnum.YEAR],
    [`${CUSTOM_DATE}_YEAR`, DateTimeLiteralTypeEnum.YEAR],
    [`${CUSTOM_RANGE_DATE}_YEARS`, DateTimeLiteralTypeEnum.YEAR],        


    ['THIS_FISCAL_QUARTER', DateTimeLiteralTypeEnum.FISCAL_QUARTER],
    ['LAST_FISCAL_QUARTER', DateTimeLiteralTypeEnum.FISCAL_QUARTER],
    ['NEXT_FISCAL_QUARTER', DateTimeLiteralTypeEnum.FISCAL_QUARTER],
    ['NEXT_N_FISCAL_QUARTERS', DateTimeLiteralTypeEnum.FISCAL_QUARTER],
    ['LAST_N_FISCAL_QUARTERS', DateTimeLiteralTypeEnum.FISCAL_QUARTER],
    ['N_FISCAL_QUARTERS_AGO', DateTimeLiteralTypeEnum.FISCAL_QUARTER],

    ['THIS_FISCAL_YEAR', DateTimeLiteralTypeEnum.FISCAL_YEAR],
    ['LAST_FISCAL_YEAR', DateTimeLiteralTypeEnum.FISCAL_YEAR],
    ['NEXT_FISCAL_YEAR', DateTimeLiteralTypeEnum.FISCAL_YEAR],
    ['NEXT_N_FISCAL_YEARS', DateTimeLiteralTypeEnum.FISCAL_YEAR],
    ['LAST_N_FISCAL_YEARS', DateTimeLiteralTypeEnum.FISCAL_YEAR],
];










const DateTimeLiteralCondition:  [Operator, string][] = [
    [Operator.Equals, `${translationName}.EQUAL`],
    [Operator.NotEquals, `${translationName}.NOT_EQUAL`],
    [Operator.GreaterThan, `${translationName}.GREATER_THAN`],
    [Operator.LessThan, `${translationName}.LESS_THAN`],
    [Operator.GreaterThanOrEquals, `${translationName}.GREATER_THAN_OR_EQUAL`],
    [Operator.LessThanOrEquals, `${translationName}.LESS_THAN_OR_EQUAL`],
    [Operator.NotNull, `${translationName}.NOT_NULL`],
    [Operator.IsNull, `${translationName}.IS_NULL`]
];

interface DateTimeLiteralType {
    type:  number ;
    description: string;
}

interface DateTimeLiteral {
    sqlKeyWord: string;
    description: string;
}



interface getSQLChunckParams {
    fieldApiName: FieldApiName;
    fieldIndex: FieldLocalId;
    condition: string;
    sqlKeyWord: string;
    whereParamValues: WhereParamValues | undefined;
    
}

class DataTime {

    /**
     * @description get an array of TypeLiteralDateTime and description
     */
    static getType = (): DateTimeLiteralType[] => {
        return  Object.entries(DateTimeLiteralTypeEnum).
                map(([key, value]):DateTimeLiteralType => ({type: value, description: `${translationName}.Type.${key}` }));
    }

    /**
     * @description get an array of TypeLiteralDateTime and description
     */
    static getDateTimeLiteral = (dateTimeLiteralType: number) : DateTimeLiteral[] => {
        return DateTimeLiteralKeyWord.filter(([, value]) => value === dateTimeLiteralType)
                                    .map(([key]):DateTimeLiteral => (
                                        {
                                            sqlKeyWord: key, 
                                            description: `${translationName}.${key}`, 
                                        }
                                    ));
    }

    /**
     * @description get an array of conditions and description
     */
    static getDateTimeCondition = (dateTimeLiteral: string): DateTimeLiteral[] => {
        console.log('dateTimeLiteral', dateTimeLiteral);
        return DateTimeLiteralCondition
            .filter(([key]):boolean =>  ( dateTimeLiteral===NULL_VALUES  && ( key === Operator.IsNull || key === Operator.NotNull)) ||
                                        ( dateTimeLiteral!==NULL_VALUES  &&   key !== Operator.IsNull && key !== Operator.NotNull)  
        )
            .map(([key, value]):DateTimeLiteral => (
            {
                sqlKeyWord: key, 
                description: value
            }
        ));
    }

    static figureOutInputType = (sqlKeyWord: string, typeField: SalesforceFieldTypes): typeInputDates => {
        if (sqlKeyWord.includes('WEEK')) return 'week';
        if (sqlKeyWord.includes('MONTH')) return 'month';
        if (sqlKeyWord.includes('YEAR')) return 'year';
        if (sqlKeyWord.includes('DAY') && typeField === 'datetime') return 'datetime-local';
        return 'date';
    }        

    static getSQLChunck = (params: getSQLChunckParams): (SimpleCondition | pairCondition ) => {
        const {fieldApiName, fieldIndex,  condition, sqlKeyWord, whereParamValues} = params;

        const field: FieldId = { fieldApiName, fieldIndex }
        

        if (whereParamValues !== undefined) {
            console.log('dateTimes', whereParamValues);
            if (whereParamValues.typeHTML === 'week') {
                ({startDate: whereParamValues.startDate, endDate: whereParamValues.endDate} = DataTime.getWeekStartAndEnd(whereParamValues));
            } else if (whereParamValues.typeHTML === 'month') {
                ({startDate: whereParamValues.startDate, endDate: whereParamValues.endDate} = DataTime.getMonthStartAndEnd(whereParamValues));
            } else if (whereParamValues.typeHTML === 'year') {
                whereParamValues.startDate = 'toDO'; whereParamValues.endDate= 'toDO';
            } else {

                const seconds = (whereParamValues.typeField === 'datetime')? ':00Z':'';
                whereParamValues.startDate = whereParamValues.from + seconds;
                whereParamValues.endDate = whereParamValues.to + seconds;
            }

            if (sqlKeyWord.includes('ACUSTOM')) {
                if (whereParamValues.typeHTML === 'datetime-local' || whereParamValues.typeHTML === 'date') 
                    return {field, operator: condition, value: whereParamValues.startDate, sqlString: `${fieldApiName} ${condition} ${whereParamValues.startDate}` };
            }            

            if (condition === '=') {
                return {field, operator: '>=', value: whereParamValues.startDate, logicalOperator: 'AND' , operatorTo: '<=', valueTo: whereParamValues.endDate,
                    sqlString: `(${fieldApiName} >= ${whereParamValues.startDate} AND ${fieldApiName} <= ${whereParamValues.endDate})`};
                        
            }
            if (condition === '!=') {
                return {field, operator: '<', value: whereParamValues.startDate, logicalOperator: 'OR' , operatorTo: '>', valueTo: whereParamValues.endDate,
                        sqlString: `(${fieldApiName} < ${whereParamValues.startDate} OR ${fieldApiName} > ${whereParamValues.endDate})`};
            }

            if (condition === '>' || condition === '>=') {
                return {field, operator: condition, value: whereParamValues.endDate, sqlString: `${fieldApiName} ${condition} ${whereParamValues.endDate}` };
            }

            if (condition === '<' || condition === '<=') {
                return {field, operator: condition, value: whereParamValues.startDate, sqlString: `${fieldApiName} ${condition} ${whereParamValues.startDate}` };
            }
        }
        return {field, operator: condition, value: sqlKeyWord, 
        sqlString: `${fieldApiName} ${condition} ${sqlKeyWord}` }; 
        
        
    }

    static getWeekStartAndEnd = (newValue: WhereParamValues):WhereParamValues => {
        const {startDate, endDate} = getWeekStartAndEnd(newValue.from);
        const r = { startDate: formatDateToSalesforce(startDate), endDate: formatDateToSalesforce(endDate), ...newValue};
        if (r.to) {
            r.endDate = formatDateToSalesforce(getWeekStartAndEnd(newValue.to).endDate);
        }
        return r;
    }    

    static getMonthStartAndEnd = (newValue: WhereParamValues):WhereParamValues => {
        const {startDate, endDate} = getMonthStartAndEnd(newValue.from);
        const r = { startDate: formatDateToSalesforce(startDate), endDate: formatDateToSalesforce(endDate), ...newValue};
        if (r.to) {
            r.endDate = formatDateToSalesforce(getMonthStartAndEnd(newValue.to).endDate);
        }
        return r;
    }


    
}
export default DataTime;





function getWeekStartAndEnd(weekString: string):{startDate: Date, endDate: Date} {
    const [year, week] = weekString.split('-W').map(Number);    // break down the year and week number
    const startOfYear = new Date(year, 0, 1);                   // Create a date for the first day of the year
    
    const dayOfWeek = startOfYear.getDay();                     // Gets the day of the week for the first day of the year (0 = Sunday, 1 = Monday, etc.)
    const firstMonday = new Date(startOfYear);
    
    // Ajustar para que comience el lunes, movemos al primer lunes del año si es necesario
    if (dayOfWeek <= 4) {
        firstMonday.setDate(startOfYear.getDate() - dayOfWeek + 1); // Mueve hacia adelante hasta el lunes
    } else {
        firstMonday.setDate(startOfYear.getDate() + (8 - dayOfWeek)); // Mueve hacia atrás si estamos más cerca del próximo lunes
    }
    
    // Ahora sumamos el número de semanas - 1 (porque ya estamos en la primera semana)
    const weekStartDate = new Date(firstMonday);
    weekStartDate.setDate(firstMonday.getDate() + (week - 1) * 7);
    
    // La fecha de fin será 6 días después
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);
    
    // Establecer horas al inicio y final de los días
    weekStartDate.setHours(0, 0, 0, 0); // Inicio del día
    weekEndDate.setHours(23, 59, 59, 999); // Final del día
    
    return  {
            startDate: weekStartDate,
            endDate: weekEndDate
    }
}


function getMonthStartAndEnd(monthString: string):{startDate: Date, endDate: Date} {
        const [year, month] = monthString.split('-').map(Number);
        const startDate = new Date(year, month - 1, 1); 
        startDate.setHours(0, 0, 0, 0); 
        const endDate = new Date(year, month, 0); 
        endDate.setHours(23, 59, 59, 999); 
    
        return {
            startDate,
            endDate
        };
}


function formatDateToSalesforce(date: Date): string {
        return date.getUTCFullYear() + '-' +
            String(date.getUTCMonth() + 1).padStart(2, '0') + '-' +
            String(date.getUTCDate()).padStart(2, '0') + 'T' +
            String(date.getUTCHours()).padStart(2, '0') + ':' +
            String(date.getUTCMinutes()).padStart(2, '0') + ':' +
            String(date.getUTCSeconds()).padStart(2, '0') + 'Z';
            
}    


    