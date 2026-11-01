# Guía del sprint 11: Completar el editor de campos SOQL

## Estado y objetivo

Planificado. Convertir el diagnóstico de [REVISION_FIELD_DIALOG.md](../REVISION_FIELD_DIALOG.md) en un editor fiable para `SELECT`, `WHERE` y `ORDER BY`. El sprint 10 queda cerrado; los sprints 06 y 07 permanecen aplazados.

La interfaz debe mostrar únicamente opciones que el modelo y el renderer pueden ejecutar. La vista previa, el estado guardado y la SOQL generada deben expresar la misma consulta.

## Reglas transversales del sprint

- **All user-facing text in the affected FieldDialog and sObjectPanel flows must be correct English, including existing text.** Esto incluye etiquetas, ayuda, estados vacíos, validaciones, errores, confirmaciones, nombres accesibles (`aria-label`) y textos de menú. No quedan cadenas españolas en esas vistas ni textos de relleno como `toDO`. Mantener las claves de i18n cuando correspondan; no se exige traducir pantallas ajenas al sprint.
- Las acciones de negocio pasan por el dispatcher o un caso de uso compartido; los componentes no concatenan SOQL ni modifican directamente el árbol de consulta.
- `ROOT` y cada `SUBQUERY` son bloques `SELECT` independientes. `RELETED` solo navega: sus campos seleccionados, filtros y órdenes se atribuyen al bloque propietario con ruta de relación cualificada.
- La vista previa debe generarse desde la misma representación validada que se renderiza y ejecuta. Un borrador incompleto no altera `queryState` ni la consulta guardada.
- Mantener la primera fase de solo lectura. La mejora de la persistencia local no requiere migraciones ni compatibilidad con formatos anteriores; esta regla nunca afecta a una organización Salesforce.

## PBIs

| Orden | PBI | Resultado |
| --- | --- | --- |
| 1 | [PBI-034: Estabilizar SELECT y el contrato del editor de campos](./PBI-034.md) | Selecciones por identidad completa, capacidades reales por cláusula y contexto correcto del bloque. |
| 2 | [PBI-035: Corregir la construcción de WHERE](./PBI-035.md) | Rangos, nulos, booleanos, picklists y fechas coherentes con el AST y la vista previa. |
| 3 | [PBI-036: Implementar ORDER BY y el panel Order Clause](./PBI-036.md) | Dirección, prioridad y política `NULLS FIRST`/`NULLS LAST` en raíz y subconsultas. |
| 4 | [PBI-037: Completar la UX y accesibilidad de FieldDialog](./PBI-037.md) | Diálogo operable con teclado, adaptable, con estado y mensajes claros en inglés. |

PBI-035 y PBI-036 usan el contrato de PBI-034. PBI-037 se cierra después de las otras tres para verificar la experiencia completa. El orden no impide preparar pruebas o diseño en paralelo.

## Decisiones de interfaz para ORDER BY

- Completar `app/src/components/organisms/fieldDialog/orderByBuilder.tsx`: el usuario elige `ASC` o `DESC` y, de forma explícita, `NULLS FIRST` o `NULLS LAST` antes de añadir el campo.
- Cada elemento de orden conserva campo cualificado, dirección y política de nulos. El orden de los elementos en la lista determina la prioridad de ordenación; se pueden quitar y reordenar.
- Crear `app/src/components/organisms/sObjectPanel/orderClausePanel.tsx` tomando como base la estructura de `whereClausePanel.tsx` y adaptándola a ORDER BY. Se mostrará en una nueva pestaña **Order Clause** de `sObjectPanel`, con un grupo por bloque `ROOT` o `SUBQUERY` que tenga órdenes. No se crea un grupo separado para `RELETED`.
- El panel muestra, en orden de prioridad, la ruta del campo, `ASC`/`DESC` y `NULLS FIRST`/`NULLS LAST`; ofrece un estado vacío en inglés cuando no hay órdenes. Compartir estilos y lógica reutilizable sin duplicar el editor de WHERE ni su tabla de `LIMIT`.
- No se exige un comando gemelo ni una entrada de menú para la nueva pestaña en este sprint. Si se incorporan otras entradas, todas deben compartir el mismo `ActionId` y caso de uso de la pestaña.

## Demostración de fin de sprint

1. En una consulta con raíz `Contact` y una subconsulta hija, seleccionar dos expresiones del mismo campo, quitar solo una y comprobar que la otra permanece.
2. Añadir desde un campo relacionado un filtro con rango y otro con `NULL`; la vista previa debe coincidir con la SOQL generada y con el bloque propietario.
3. Añadir órdenes a raíz y subconsulta, incluida una ruta padre, con combinaciones de `ASC`/`DESC` y `NULLS FIRST`/`NULLS LAST`. Cambiar su prioridad y quitar uno sin afectar a los demás.
4. Abrir **Order Clause** y comprobar la lista por bloque y el estado vacío; navegar por el diálogo, sus pestañas y la nueva pestaña con teclado.
5. Guardar y cargar la consulta en otra conexión compatible. Verificar campos, WHERE, ORDER BY y textos de la UI en inglés correcto, sin ejecutar escrituras en Salesforce.

## Definition of Done

- Cada criterio de PBI-034 a PBI-037 tiene pruebas automatizadas proporcionadas, con fixtures anonimizados y sin credenciales Salesforce.
- Typecheck, build, lint y tests de los workspaces afectados pasan.
- No quedan controles visibles sin efecto, vistas previas divergentes ni logs con valores de filtros.
- Se actualizan el subconjunto SOQL documentado, el contrato de consultas guardadas si cambia, y los comandos si se añade alguna entrada nueva.
- La revisión final comprueba los textos visibles y accesibles en inglés correcto en todos los componentes modificados.

## Fuera de alcance

- Añadir DML, modificar datos o metadata de Salesforce, y completar los sprints 06 y 07.
- Ampliar indiscriminadamente el catálogo SOQL: una opción nueva entra solo si AST, validador, renderer, UI y tests la soportan.
- Reescribir pantallas no relacionadas con `fieldDialog` o `sObjectPanel` para traducir toda la aplicación en este sprint.
