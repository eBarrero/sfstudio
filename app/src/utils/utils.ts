import i18next from "i18next";


/* split the message into an array of strings, the first one is the key and the rest (if exist) add params as p0,p1,pn  */
export function t(message:string | null) { 
    if (message===undefined || message===null || message==='')  return 'null value';
    if (message[0]!=='#') return message; // if there is a space, it is not a key

    const parts = message.split('|');
    if (parts.length === 1) { 
        const r = i18next.t(message);
        //if (r === message) console.log('#Error', message);
        return r;
    }

    const params: { [key: string]: string } = {};
    for (let i = 1; i < parts.length; i++) {
      params[`p${i - 1}`] = parts[i];
    }
    return i18next.t(parts[0], params);
  } 



  export const enum LITERAL {
    DataTimeLiteral_Periods = '#DateTimeLiteral.Periods',
    DataTimeLiteral_Type = '#DateTimeLiteral.Type',
    TextLiteral_Type = '#TextLiteral.Type',
    Condition = '#WORDS.Condition'
  }

