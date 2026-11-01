# Guía del sprint 09: Coherencia de filtros SOQL en relaciones padre

## Estado y objetivo

Implementado en PBI-032. Se corrigió la propiedad de las condiciones `WHERE` creadas al navegar por relaciones padre. Una consulta puede combinar con `AND`, `OR` y paréntesis condiciones del objeto del bloque `SELECT` y de sus padres relacionados. Los sprints 06 y 07 siguen aplazados.

## Criterios de entrada

- El constructor SOQL, el parser de `whereLogic` y la pestaña «Where Clause» están disponibles.
- Las consultas guardadas en IndexedDB conservan el estado del constructor.
- Se mantienen las reglas multi-org y de solo lectura.

## PBI

- [PBI-032: Unificar las condiciones WHERE del bloque SOQL y sus relaciones padre](./PBI-032.md).

## Demostración de fin de sprint

1. Partir de `Contact`, añadir `LastName = 'Soto'` y navegar a `Account` para añadir `Account.Industry = 'Tech'`.
2. Mostrar ambas condiciones en una lista `C1`, `C2` y aplicar `C1 OR C2`.
3. Verificar que la SOQL contiene un único `WHERE` en `FROM Contact` con las dos condiciones.
4. Crear una subconsulta hija y repetir el flujo con una relación padre de la hija: su condición debe quedar en el `WHERE` de la subconsulta, independiente del de `Contact`.
5. Guardar y cargar la consulta en otra org compatible sin perder la ruta de relación ni la lógica.

## Definition of Done

- Se demuestran los criterios de aceptación de PBI-032 con fixtures anonimizados y sin credenciales Salesforce en CI.
- Typecheck, build, lint y pruebas afectadas pasan.
- Se actualizan los contratos y la documentación SOQL afectados.

## Fuera de alcance

- Comparar registros o modificar datos Salesforce.
- Combinar con `OR` condiciones pertenecientes a bloques `SELECT` distintos.
- Migrar datos persistidos de esquemas anteriores; durante el desarrollo se puede reiniciar IndexedDB según `AGENTS.md`.
- Implementar los sprints 06 y 07.
