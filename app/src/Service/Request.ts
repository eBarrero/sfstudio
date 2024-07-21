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
        window.localStorage.setItem(url, JSON.stringify(json));
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
