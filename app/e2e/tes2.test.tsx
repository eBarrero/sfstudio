import React from 'react';
import { render, waitFor } from '@testing-library/react';
import App from '../src/App';
import sessionState from '../src/store/sessionState';




describe('Integración de App y sessionState', () => {
  



  it('debe inicializar y actualizar el sessionState correctamente', async () => {
    console.log(React.version);
    // Renderizamos el componente App    
    render(<App />);
    
    // Esperamos a que se ejecute el useEffect y se actualice el estado de sessionState
    await waitFor(() => {
      const state = sessionState.getState();
      // Por ejemplo, si createSession() asigna 'usuarioEjemplo'
      expect(state.publicSession.connections.length).toBe(0);
      expect(state.publicSession.currentConnection).toBe(null);
    });
  });
});