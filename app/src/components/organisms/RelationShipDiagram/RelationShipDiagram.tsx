import React, { useRef, useEffect, useState } from 'react';

// Definición de tipos e interfaces
interface Relationship {
  parent: string;
  relationField: string;
  child: string;
}

interface Coordinates {
  x: number;
  y: number;
}

interface Node {
  name: string;
  coordinates: Coordinates;
}

// Configuración básica para los nodos
const NODE_WIDTH = 120;
const NODE_HEIGHT = 50;
const NODE_PADDING = 20;

// Función para dibujar el objeto principal
const drawMainObject = (ctx: CanvasRenderingContext2D, node: Node) => {
  const { x, y } = node.coordinates;
  ctx.fillStyle = '#4CAF50';
  ctx.fillRect(x, y, NODE_WIDTH, NODE_HEIGHT);
  ctx.strokeStyle = 'black';
  ctx.strokeRect(x, y, NODE_WIDTH, NODE_HEIGHT);
  ctx.fillStyle = 'white';
  ctx.font = '16px Arial';
  ctx.fillText(node.name, x + 10, y + 30);
};

// Función para dibujar un nodo hijo y la relación con el padre
const drawChildObject = (
  ctx: CanvasRenderingContext2D,
  parent: Node,
  child: Node,
  relationField: string
) => {
  // Dibujar el nodo hijo
  drawMainObject(ctx, child);

  // Dibujar la línea de relación entre el padre y el hijo
  ctx.beginPath();
  ctx.moveTo(parent.coordinates.x + NODE_WIDTH / 2, parent.coordinates.y + NODE_HEIGHT);
  ctx.lineTo(child.coordinates.x + NODE_WIDTH / 2, child.coordinates.y);
  ctx.strokeStyle = 'gray';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Etiquetar la relación
  ctx.fillStyle = 'black';
  ctx.fillText(
    relationField,
    (parent.coordinates.x + child.coordinates.x) / 2,
    (parent.coordinates.y + child.coordinates.y) / 2 - 5
  );
};

// Componente React principal para dibujar el diagrama
const RelationshipDiagram: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);

  // Función para agregar un nodo principal
  const addMainNode = (name: string) => {
    setNodes([{ name, coordinates: { x: 250, y: 50 } }]);
  };

  // Función para agregar un nodo hijo
  const addChildNode = (parentName: string, relationField: string, childName: string) => {
    const parentNode = nodes.find((node) => node.name === parentName);
    if (!parentNode) return;

    const childNode: Node = {
      name: childName,
      coordinates: {
        x: parentNode.coordinates.x + 50,
        y: parentNode.coordinates.y + NODE_HEIGHT + NODE_PADDING,
      },
    };

    setNodes((prevNodes) => [...prevNodes, childNode]);
    setRelationships((prevRels) => [
      ...prevRels,
      { parent: parentName, relationField, child: childName },
    ]);
  };

  // Dibuja los nodos y relaciones en el canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpiar canvas antes de redibujar

    // Dibujar cada nodo
    nodes.forEach((node) => drawMainObject(ctx, node));

    // Dibujar cada relación
    relationships.forEach((relation) => {
      const parentNode = nodes.find((node) => node.name === relation.parent);
      const childNode = nodes.find((node) => node.name === relation.child);
      if (parentNode && childNode) {
        drawChildObject(ctx, parentNode, childNode, relation.relationField);
      }
    });
  }, [nodes, relationships]);

  // Simulación de agregar un nodo y relaciones (puedes personalizarlo)
  useEffect(() => {
    addMainNode('Account');
    addChildNode('Account', 'ContactId', 'Contact');
    addChildNode('Contact', 'OpportunityId', 'Opportunity');
  }, []);

  return (
    <div>
      <h2>Object Relationship Diagram</h2>
      <canvas ref={canvasRef} width={600} height={400} style={{ border: '1px solid #000' }} />
    </div>
  );
};

export default RelationshipDiagram;
