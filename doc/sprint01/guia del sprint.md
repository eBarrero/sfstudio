# Guía del sprint 01: Base técnica y seguridad de acceso

## Objetivo

Dejar una base reproducible y cerrar los riesgos que impedirían identificar de forma segura un workspace antes de conectar organizaciones.

## Criterios de entrada

- Node 24 y npm instalados
- Repositorio compila en API y app
- Variables actuales de Salesforce y MongoDB identificadas

## PBIs

- [PBI-001: Pipeline local reproducible y CI mínima](./PBI-001.md)
- [PBI-002: Configuración validada y endpoints de salud](./PBI-002.md)
- [PBI-003: Sesión de workspace segura](./PBI-003.md)
- [PBI-004: OAuth state seguro y logging con redacción](./PBI-004.md)

## Orden recomendado

1. PBI-001: Pipeline local reproducible y CI mínima.
2. PBI-002: Configuración validada y endpoints de salud.
3. PBI-003: Sesión de workspace segura.
4. PBI-004: OAuth state seguro y logging con redacción.

## Demostración de fin de sprint

- Un commit se valida con build, typecheck, lint y tests desde la raíz.
- La API expone health/readiness sin filtrar secretos.
- Una sesión usa un identificador criptográfico y una cookie endurecida.
- Un intento OAuth con state inválido es rechazado y los logs no contienen credenciales.

## Definition of Done del sprint

- Todas las PBIs Must cumplen su Definition of Done.
- CI pasa desde un checkout limpio.
- No hay secretos, tokens o PII en código, fixtures, salidas o logs.
- Se documentan decisiones y desviaciones del alcance.

## Riesgos

- Cambiar la cookie invalida sesiones antiguas; se acepta durante esta fase.
- La configuración OAuth real debe probarse también en un entorno no productivo.

## Fuera de alcance

- Funcionalidad multi-org visible.
- Comparación de organizaciones.
- Escritura en Salesforce.
- Extensión de navegador.

