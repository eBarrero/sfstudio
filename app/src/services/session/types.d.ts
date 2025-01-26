


type PublicConnectionDefinition = {
  alias: string;
  dbName: string;
  tech: string;
  isConnected: boolean;
  isOnError: boolean;
  isClose: boolean;
  }


type PublicSesionDefinition = {
    connections: PublicConnectionDefinition[];
    currentConnection: number | null;
} 