# Guía del sprint 03: Workspace multi-org y paridad de acciones

## Objetivo

Hacer visible y utilizable el workspace multi-org, asegurando que ratón y consola invoquen exactamente las mismas acciones.

## Criterios de entrada

- API multi-org del sprint 02
- Contratos versionados de workspace y OrgConnection

## PBIs

- [PBI-009: Cliente API relativo y contratos tipados](./PBI-009.md)
- [PBI-010: Selector y contexto visible de organización](./PBI-010.md)
- [PBI-011: Dispatcher único para ratón y comandos](./PBI-011.md)
- [PBI-012: Pruebas E2E del workspace multi-org](./PBI-012.md)

## Orden recomendado

1. PBI-009: Cliente API relativo y contratos tipados.
2. PBI-010: Selector y contexto visible de organización.
3. PBI-011: Dispatcher único para ratón y comandos.
4. PBI-012: Pruebas E2E del workspace multi-org.

## Demostración de fin de sprint

- El gestor muestra Integración y UAT con usuario, tipo y estado.
- Se cambia la org activa por clic y por comando con idéntico resultado.
- Cerrar/reconectar funciona desde ambos mecanismos.
- Una prueba E2E recorre conexión, alternancia y desconexión.

## Definition of Done del sprint

- El workspace multi-org es usable con ratón y teclado.
- Todas las acciones del sprint tienen comando gemelo.
- La suite E2E multi-org pasa en CI.
- No se usa alias ni índice como identidad técnica.

## Riesgos

- El registro actual de comandos es global y mutable; hay que evitar duplicados.
- Los alias no son identidad y pueden repetirse.

## Fuera de alcance

- Descarga y caché nueva de metadatos.
- Constructor SOQL renovado.
- Comparación de orgs.

