# Guía del sprint 05: Consultas SOQL seguras y efímeras

## Objetivo

Permitir construir y ejecutar consultas de solo lectura contra una org elegida explícitamente, con límites, paginación y resultados no persistidos.

## Criterios de entrada

- Explorador multi-org aislado
- Dispatcher de acciones estable
- Fixtures de metadata disponibles

## PBIs

- [PBI-017: Dominio SOQL puro y probado](./PBI-017.md)
- [PBI-018: Endpoint POST de consulta de solo lectura](./PBI-018.md)
- [PBI-019: Destino explícito, límites y paginación](./PBI-019.md)
- [PBI-020: Resultados efímeros y paridad de ejecución](./PBI-020.md)

## Orden recomendado

1. PBI-017: Dominio SOQL puro y probado.
2. PBI-018: Endpoint POST de consulta de solo lectura.
3. PBI-019: Destino explícito, límites y paginación.
4. PBI-020: Resultados efímeros y paridad de ejecución.

## Demostración de fin de sprint

- Se construye una consulta válida desde objetos/campos de UAT.
- Se ejecuta por POST indicando OrgKey y límite.
- Los resultados se paginan y no aparecen en IndexedDB, localStorage o MongoDB.
- La misma consulta se ejecuta mediante UI y comando.

## Definition of Done del sprint

- Consulta y destino son explícitos.
- Solo se aceptan operaciones de lectura.
- Límites y paginación están probados.
- No persisten datos de negocio.
- Build, lint, tests y E2E pasan.

## Riesgos

- SOQL tiene reglas amplias; la primera fase debe declarar el subconjunto soportado.
- Las consultas agregadas y subqueries requieren fixtures específicos.

## Fuera de alcance

- Escritura Salesforce.
- Bulk API y data lake.
- Historial persistente de resultados.

