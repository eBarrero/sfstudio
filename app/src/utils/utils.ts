import i18next from "i18next";


/* split the message into an array of strings, the first one is the key and the rest (if exist) add params as p0,p1,pn  */
export function t(message:string | null) { 
    if (message===undefined || message===null || message==='')  return 'null value';
    const parts = message.split('|');
    if (parts.length === 1) return i18next.t(message);
    const params: { [key: string]: string } = {};
    for (let i = 1; i < parts.length; i++) {
      params[`p${i - 1}`] = parts[i];
    }
    return i18next.t(parts[0], params);
  } 