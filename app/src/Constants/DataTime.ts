import { Operator } from './Fields';
const translationName= 'DataTimeLiteral' as const;


const DateTimeLiteralTypeEnum = {
    DAY: 1,
    WEEK: 2,
    MONTH: 3,
    QUARTER: 4,
    YEAR: 5,
    FISCAL_QUARTER:6,
    FISCAL_YEAR: 7
} as const;


const DateTimeLiteralKeyWord: [string, number][] = [
    ['YESTERDAY', DateTimeLiteralTypeEnum.DAY],
    ['TODAY', DateTimeLiteralTypeEnum.DAY],
    ['TOMORROW', DateTimeLiteralTypeEnum.DAY],
    ['LAST_N_DAYS', DateTimeLiteralTypeEnum.DAY],
    ['NEXT_N_DAYS', DateTimeLiteralTypeEnum.DAY],
    ['N_DAYS_AGO', DateTimeLiteralTypeEnum.DAY],

    ['LAST_WEEK', DateTimeLiteralTypeEnum.WEEK],
    ['THIS_WEEK', DateTimeLiteralTypeEnum.WEEK],
    ['NEXT_WEEK', DateTimeLiteralTypeEnum.WEEK],
    ['NEXT_N_WEEKS', DateTimeLiteralTypeEnum.WEEK],
    ['LAST_N_WEEKS', DateTimeLiteralTypeEnum.WEEK],
    ['N_WEEKS_AGO', DateTimeLiteralTypeEnum.WEEK],

    ['LAST_MONTH', DateTimeLiteralTypeEnum.MONTH],
    ['THIS_MONTH', DateTimeLiteralTypeEnum.MONTH],
    ['NEXT_MONTH', DateTimeLiteralTypeEnum.MONTH],
    ['NEXT_N_MONTHS', DateTimeLiteralTypeEnum.MONTH],
    ['LAST_N_MONTHS', DateTimeLiteralTypeEnum.MONTH],
    ['N_MONTHS_AGO', DateTimeLiteralTypeEnum.MONTH],

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
    [Operator.LessThanOrEquals, `${translationName}.LESS_THAN_OR_EQUAL`]
];

interface DateTimeLiteralType {
    type:  number ;
    description: string;
}

interface DateTimeLiteral {
    sqlKeyWord: string;
    description: string;
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
    static getDateTimeLiteral = (dateTimeLiteralType: number): DateTimeLiteral[] => {
        return DateTimeLiteralKeyWord.filter(([, value]) => value === dateTimeLiteralType)
                                    .map(([key]):DateTimeLiteral => (
                                        {
                                            sqlKeyWord: key, 
                                            description: `${translationName}.${key}` 

                                        }
                                    ));
    }

    /**
     * @description get an array of conditions and description
     */
    static getDateTimeCondition = (): DateTimeLiteral[] => {
        return DateTimeLiteralCondition.map(([key, value]):DateTimeLiteral => (
            {
                sqlKeyWord: key, 
                description: value
            }
        ));
    }

}

export default DataTime;






    