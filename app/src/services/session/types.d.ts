type PublicConnectionDefinition = {
    alias: string;
    name: string;
    sandbox: boolean;
  }


type PublicSesionDefinition = {
    currentConnection: number;
    connections: PublicConnectionDefinition[];
} 