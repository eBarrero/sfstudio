# Guía del sprint 07: Experiencia de comparación y cierre de primera fase

## Objetivo

Entregar la comparación multi-org utilizable por ratón y comandos y demostrar todos los criterios de éxito de la primera fase.

## Criterios de entrada

- Motor DiffResult completo
- Workspace y consultas multi-org estables
- CI y E2E operativos

## PBIs

- [PBI-025: Selector y vista resumen de comparación](./PBI-025.md)
- [PBI-026: Detalle, filtros y navegación de diferencias](./PBI-026.md)
- [PBI-027: Comandos gemelos de comparación](./PBI-027.md)
- [PBI-028: Aceptación, seguridad y release de fase 1](./PBI-028.md)

## Orden recomendado

1. PBI-025: Selector y vista resumen de comparación.
2. PBI-026: Detalle, filtros y navegación de diferencias.
3. PBI-027: Comandos gemelos de comparación.
4. PBI-028: Aceptación, seguridad y release de fase 1.

## Demostración de fin de sprint

- El usuario compara Integración y UAT desde selector o comando.
- Filtra objetos/campos solo origen, solo destino y modificados.
- Salta de una diferencia al explorador de cada org.
- La suite de aceptación demuestra los ocho criterios de éxito.

## Definition of Done del sprint

- Los ocho criterios de éxito de la primera fase tienen evidencia.
- Comparación completa disponible por UI y comandos.
- No quedan vulnerabilidades críticas/altas de runtime aceptadas sin decisión explícita.
- Runbook y documentación permiten operar el release.

## Riesgos

- Una vista muy densa puede ocultar diferencias importantes; priorizar navegación antes que visualización sofisticada.
- La prueba real necesita dos orgs controladas o snapshots representativos.

## Fuera de alcance

- Extensión del navegador.
- Escritura o sincronización de orgs.
- Data lake y comparación exhaustiva de registros.

