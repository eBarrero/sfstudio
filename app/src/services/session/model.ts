import { request,  URL_PATH } from './controller';




  export async function createSession(): Promise<PublicSesionDefinition>  {
    const s = await request('init');
    console.log('createSession:' + s);
    if (s==='newsession') {
      return { connections: [], currentConnection: null };
    }
    if (s==='#Error') {
      return { connections: [], currentConnection: null };
    }
    if (s==='reseted') {
      return { connections: [], currentConnection: null };
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

  export function loginOrganization(orgName: string): void {
    window.location.href=`${URL_PATH}/auth/${orgName}`;
  }

  export function disconnect(orgName: string): void {
    window.location.href=`${URL_PATH}/auth/logout/${orgName}`;
  }

  