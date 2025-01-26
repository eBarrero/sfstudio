import { request,  URL_PATH } from './controller';




  export async function createSession(): Promise<PublicSesionDefinition>  {
    const s = await request('init');
    console.log('createSession:' + s);
    if (s==='newsession') {
      return { connections: [], currentConnection: null};
    }
    if (s==='#Error') {
      return { connections: [], currentConnection: null};
    }
    if (s==='reseted') {
      return { connections: [], currentConnection: null};
    }
    
    const token = JSON.parse(atob(s ));
    return token as PublicSesionDefinition;
  }

  export function loginSFDC(): void {
    window.location.href=`${URL_PATH}auth/SF_Prod`;
  }

  export function loginSandBox(): void {
    window.location.href=`${URL_PATH}auth/SF_Test`;
  }

  export function loginOrganization(connectionId: number): void {
    window.location.href=`${URL_PATH}connections/${connectionId}`;
  }

  export function disconnect(orgName: string): void {
    console.log(`${URL_PATH}/logout/${orgName}`);
    window.location.href=`${URL_PATH}logout/${orgName}`;
  }

  