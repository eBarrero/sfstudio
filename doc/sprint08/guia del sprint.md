# Guía del sprint 08: Interfaz compacta de conexiones y objetos

## Estado y objetivo

Implementado. Reducir el espacio ocupado por el gestor de conexiones y facilitar la exploración de campos y relaciones hijas. Los sprints 06 y 07 siguen aplazados y se reevaluarán antes de implementarlos.

## Criterios de entrada

- Workspace multi-org y exploración de objetos disponibles.
- La API y el modelo de solo lectura permanecen vigentes.
- Los cambios previos del usuario en el repositorio se conservan.

## PBIs

- [PBI-029: Eliminar el contexto de org duplicado](./PBI-029.md).
- [PBI-030: Compactar el gestor de conexiones](./PBI-030.md).
- [PBI-031: Mostrar campos y relaciones en pestañas](./PBI-031.md).

## Orden recomendado

1. PBI-029: retirar la duplicación visual.
2. PBI-030: compactar conexiones y trasladar detalles y acciones al diálogo.
3. PBI-031: separar las dos vistas del objeto y añadir sus comandos.

## Demostración de fin de sprint

- El contexto de org aparece una sola vez en el explorador y no en `frame_editor`.
- Cada conexión ocupa una fila compacta con alias, entorno, estado legible y señal de org activa; el botón de engranaje abre el detalle y las acciones actuales.
- Un objeto muestra una pestaña de campos o una de relaciones hijas; `show_fields` y `Show_Relations` cambian a la misma vista que sus botones.
- La vista ampliada de campos continúa funcionando.

La selección de pestaña vuelve a Campos al abrir otro objeto. `SOQLPanel` deja de aparecer en la vista de objeto; la ejecución SOQL sigue disponible desde el comando `query run` y su botón de la barra de comandos.

## Definition of Done

- Las acciones existentes de conexión siguen usando los casos de uso actuales.
- Estado, entorno y organización activa se distinguen sin depender solo del color o del icono.
- Diálogo y pestañas son operables con teclado y tienen nombres accesibles.
- Los dos comandos de pestaña comparten la acción de sus botones y tienen pruebas de paridad.
- Typecheck, build, lint y pruebas afectadas pasan.

## Fuera de alcance

- Implementación o aceptación de los sprints 06 y 07.
- Cambios en OAuth, persistencia o API.
- Nuevos comandos para abrir el diálogo o para acciones de conexión ya existentes; se conservan los que haya.
