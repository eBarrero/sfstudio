# Guía del sprint 02: Ciclo de vida de conexiones multi-org

## Objetivo

Permitir que un workspace mantenga al menos dos organizaciones Salesforce autenticadas simultáneamente, con identidad estable y recuperación explícita cuando una conexión deja de estar disponible.

## Criterios de entrada

- Sprint 01 terminado
- Sesión de workspace segura
- OAuth state validado

## PBIs

- [PBI-005: Identidad estable de organización y contratos multi-org](./PBI-005.md)
- [PBI-006: OAuth correcto para producción y sandbox](./PBI-006.md)
- [PBI-007: Registro de conexiones por workspace](./PBI-007.md)
- [PBI-008: Desconexión y reautenticación explícitas](./PBI-008.md)

## Orden recomendado

1. PBI-005: Identidad estable de organización y contratos multi-org.
2. PBI-006: OAuth correcto para producción y sandbox.
3. PBI-007: Registro de conexiones por workspace.
4. PBI-008: Desconexión y reautenticación explícitas.

## Demostración de fin de sprint

- El usuario conecta Integración y UAT en el mismo workspace.
- La API lista ambas conexiones con identidad y estado inequívocos.
- Se puede desconectar una org sin cerrar la otra.
- Tras reiniciar el servidor, cada conexión perdida se marca como REAUTH_REQUIRED.

## Definition of Done del sprint

- Dos orgs reales o simuladas conviven en un workspace.
- Aislamiento entre workspaces probado.
- Reautenticación y desconexión tienen estados explícitos.
- Build, lint y tests pasan en CI.

## Riesgos

- Las orgs existentes guardadas por dbName necesitarán migración o reconexión.
- Production y sandbox usan el mismo comportamiento, pero distinto login host.

## Fuera de alcance

- Interfaz completa del workspace.
- Persistencia de refresh tokens.
- Comparación de metadata.

