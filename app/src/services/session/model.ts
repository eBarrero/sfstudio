import { loadSession } from './controller';




  export async function createSession(): Promise<PublicSesionDefinition>  {

    const s = await loadSession();
    console.log('createSession:' + s);
    if (s==='newsession') {
      return { currentConnection: 0, connections: [] };
    }
    if (s==='error') {
      return { currentConnection: 0, connections: [] };
    }
    if (s==='reseted') {
      return { currentConnection: 0, connections: [] };
    }
    
    const token = JSON.parse(atob(s ));
    return token as PublicSesionDefinition;
  }

  export function loginSFDC(): void {
    window.location.href='/api/auth/login';
  }

  export function loginSandBox(): void {
    window.location.href='/api/auth/test';
  }