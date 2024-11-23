


type PublicConnectionDefinition = {
    alias: string;
    name: string;
    sandbox: boolean;
    isConnected: boolean;
    isError: boolean;
  }


type PublicSesionDefinition = {
    connections: PublicConnectionDefinition[];
    currentConnection: number | null;
} 