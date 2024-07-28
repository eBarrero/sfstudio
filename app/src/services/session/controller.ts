


export async function  loadSession(): Promise<string> {    
    const res = await fetch("/api/init2");
    if (!res.ok) {
      console.log('error' + res.statusText);
      return 'error';
    } 
    return await res.json();
}



