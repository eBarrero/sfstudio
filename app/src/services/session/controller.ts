
export const URL_PATH = '/api/';

export async function  request(uri: string ): Promise<string> {    
    const URL = `${URL_PATH}${uri}`;
    const res = await fetch(URL);
    if (!res.ok) {
      console.log('#Error' + res.statusText);
      return '#Error';
    } 
    return await res.json();
}




