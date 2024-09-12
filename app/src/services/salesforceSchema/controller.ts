/* eslint-disable @typescript-eslint/no-explicit-any */
import RequestError from "./requestError";



async function request(url: string): Promise<any | null>  {
    console.log('fetching data' + url);
    try {
        const res = await fetch(url);
        if (!res.ok) {
         console.log('error' + res.statusText);   
          throw new RequestError(res, res.statusText);
        }
        const json = await res.json();
        try {
            window.localStorage.setItem(url, JSON.stringify(json));
        } catch (error) {
            console.error(`localStorage.setItem() error: ${(error as Error).message}`);
        }

        return json;
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Unexpected error: ${(error as Error).message}`);
            removeOlderLocalStoreItem();
        }
        throw error;
    }
}

async function requestWithOutCache(url: string): Promise<any | null>  {
    console.log('fetching data' + url);
    try {
        const res = await fetch(url);
        if (!res.ok) {
         console.log('error' + res.statusText);   
          throw new RequestError(res, res.statusText);
        }
        const json = await res.json();
        return json;
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Unexpected error: ${(error as Error).message}`);
        }
        throw error;
    }
}


export  async function  getDescribe(orgSfName: string): Promise<any | null> {
    const url = `/api/describeGlobal/${orgSfName}`;
    const result = window.localStorage.getItem(url);
    if (result) {
        console.log('SI CACHE');
        return Promise.resolve(JSON.parse(result));
    }
    console.log('NO CACHE');
    return  await request(url);
}

export async function getDescribeObject(orgSfName: string, sObject: string): Promise<any | null> {
    const url = `/api/describe/${orgSfName}/${sObject}`;
    const result = window.localStorage.getItem(url);
    if (result) {
        console.log('SI CACHE');
        return JSON.parse(result);
    }
    console.log('NO CACHE');
    try {
        const newResult = await request(url);
        return newResult;
    } catch (error) {
        console.error(`Unexpected error: ${(error as Error).message}`);
        throw error;
    }
    
}

export async function sendQuery(orgSfName: string,  query: string): Promise<any | null> {    
    const url = `/api/soql/${orgSfName}/${toBase64UrlSafe(query)}`;

    try {
        const newResult = await requestWithOutCache(url);
        
        return newResult;
    } catch (error) {
        console.error(`Unexpected error: ${(error as Error).message}`);
        throw error;
    }
}


function toBase64UrlSafe(str: string):string {
    console.log('toBase64UrlSafe' + str);
    const base64 = btoa(str);
    return base64
      .replace(/\+/g, '-') // replace + con -
      .replace(/\//g, '_') // replace / con _
      .replace(/=+$/, ''); // remove padding caracter '='
  }

function removeOlderLocalStoreItem(): void {
    try {
        for (let i = localStorage.length; i > 0; i--) {
            const key = localStorage.key(i);
            if (key?.startsWith('/api/')) {
                localStorage.removeItem(key);
                return;
            }
        }
    } catch (error) {
        console.error(`removeOlderLocalStoreItem error: ${(error as Error).message}`);
    }    
}    