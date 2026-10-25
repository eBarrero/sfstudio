import React, { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  // Este método se llama cuando ocurre un error en alguno de los componentes hijos.
  static getDerivedStateFromError(): ErrorBoundaryState {
    // Actualizamos el estado para renderizar la UI alternativa en la próxima renderización.
    return { hasError: true };
  }

  // Este método se utiliza para capturar detalles del error.
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error capturado en ErrorBoundary:", error, errorInfo);
    // Aquí podrías enviar el error a un servicio de logging o monitoreo.
  }

  render() {
    if (this.state.hasError) {
      // Renderizamos una interfaz de fallback cuando hay un error.
      return <h1>Algo salió mal.</h1>;
    }
    // Si no hay error, renderizamos los componentes hijos.
    return this.props.children;
  }
}

export default ErrorBoundary;
