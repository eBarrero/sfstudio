import { request,  URL_PATH } from './controller';




  export async function createSession(): Promise<PublicSesionDefinition>  {
    const s = await request('init');
    console.log('createSession:' + s);
    if (s==='newsession') {
      return { currentConnection: 0, connections: [] };
    }
    if (s==='#Error') {
      return { currentConnection: 0, connections: [] };
    }
    if (s==='reseted') {
      return { currentConnection: 0, connections: [] };
    }
    
    const token = JSON.parse(atob(s ));
    return token as PublicSesionDefinition;
  }

  export function loginSFDC(): void {
    window.location.href=`${URL_PATH}auth/login`;
  }

  export function loginSandBox(): void {
    window.location.href=`${URL_PATH}auth/test`;
  }


  