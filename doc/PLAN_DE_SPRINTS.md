# Plan de sprints de la primera fase

## Propósito

Este plan convierte los criterios de éxito de [VISION_PRODUCTO.md](./VISION_PRODUCTO.md) en incrementos ordenados por dependencia. Los sprints no tienen una duración impuesta: antes de comenzar cada uno, el equipo debe ajustar alcance y capacidad sin partir una PBI entre sprints salvo decisión explícita. Los sprints 06 y 07 quedan aplazados para reevaluarlos antes de implementarlos; el sprint 08 aborda mejoras de interfaz independientes de la comparación.

## Resumen

| Sprint | Resultado |
| --- | --- |
| [Sprint 01](./sprint01/guia%20del%20sprint.md) | Base reproducible, configuración validada, sesión segura y OAuth state. |
| [Sprint 02](./sprint02/guia%20del%20sprint.md) | Varias conexiones por workspace, producción/sandbox y reautenticación. |
| [Sprint 03](./sprint03/guia%20del%20sprint.md) | Selector multi-org y dispatcher común para ratón/comandos. |
| [Sprint 04](./sprint04/guia%20del%20sprint.md) | Metadata normalizada, IndexedDB e exploración aislada por org. |
| [Sprint 05](./sprint05/guia%20del%20sprint.md) | SOQL seguro, destino explícito, límites, paginación y resultados efímeros. |
| [Sprint 06](./sprint06/guia%20del%20sprint.md) | Aplazado: motor puro de comparación de objetos, campos, picklists y relaciones. |
| [Sprint 07](./sprint07/guia%20del%20sprint.md) | Aplazado: experiencia de comparación y aceptación integral; reevaluar la paridad opcional antes de ejecutarlo. |
| [Sprint 08](./sprint08/guia%20del%20sprint.md) | Interfaz más compacta de conexiones y exploración de objetos por pestañas. |
| [Sprint 09](./sprint09/guia%20del%20sprint.md) | PBI-032 implementada: el WHERE del bloque mezcla condiciones locales y de relaciones padre. |
| [Sprint 10](./sprint10/guia%20del%20sprint.md) | Planificado: gestionar `LIMIT` por bloque SOQL desde «Where Clause». |

## Trazabilidad con los criterios de éxito

| Criterio de `VISION_PRODUCTO.md` | PBIs que lo construyen | Evidencia final |
| --- | --- | --- |
| Conectar al menos dos orgs en el mismo workspace | PBI-005, 006, 007, 012 | E2E multi-org y aceptación PBI-028 |
| Alternar sin confundir contexto | PBI-009, 010, 011, 012 | Selector, etiqueta de destino y E2E |
| Explorar y consultar cualquiera en solo lectura | PBI-013 a 020, 032, 033 | E2E explorer/query, filtros en relaciones padre, control de `LIMIT` y rechazo de no-SELECT |
| Comparar Integración y UAT por objeto, campo y relación | PBI-021 a 026 | Golden tests del diff y E2E comparación |
| Acciones con ratón y comando gemelo acordadas | PBI-011, 015, 020, 027, 031 | Pruebas de paridad para las acciones que tengan ambas entradas |
| Reinicio/expiración con reautenticación clara | PBI-007, 008, 025 | Prueba de registro vacío + estado REAUTH_REQUIRED |
| No guardar tokens ni datos de negocio en MongoDB | PBI-003, 004, 007, 014, 020, 028 | Inspección automatizada de DB, stores y logs |
| Consultas limitadas y resultados no persistidos | PBI-018, 019, 020, 033 | Tests de límite/paginación, control visual de `LIMIT` y persistencia |

## Dependencias principales

```mermaid
flowchart LR
    S1[Sprint 01<br/>seguridad] --> S2[Sprint 02<br/>conexiones]
    S2 --> S3[Sprint 03<br/>workspace]
    S3 --> S4[Sprint 04<br/>metadata]
    S4 --> S5[Sprint 05<br/>SOQL]
    S4 --> S6[Sprint 06<br/>diff]
    S5 --> S7[Sprint 07<br/>aceptación]
    S6 --> S7
    S5 --> S8[Sprint 08<br/>UI]
    S8 --> S9[Sprint 09<br/>WHERE de relaciones padre]
    S9 --> S10[Sprint 10<br/>LIMIT por bloque SOQL]
```

Sprint 05 y Sprint 06 podrían desarrollarse en paralelo después de Sprint 04 si el equipo tiene capacidad independiente, pero ambos deben terminar antes de la aceptación del Sprint 07. Sprint 08 puede ejecutarse con Sprint 06 y 07 aplazados; no acredita por sí mismo la release de la primera fase.

## Reglas de planificación

- Todas las PBIs están marcadas Must porque componen la primera fase acordada.
- El tamaño S/M/L es relativo; debe recalibrarse con el equipo.
- Una PBI entra en sprint solo si sus dependencias están terminadas.
- Todo cambio funcional requiere prueba; los flujos OAuth reales añaden una comprobación manual controlada.
- No se aceptan tokens o datos reales en fixtures.
- Cada PBI indica qué acciones visuales requieren comando gemelo; para esas acciones se exige un `ActionId` compartido y pruebas de paridad.
- La extensión de navegador es un épico posterior y no condiciona esta fase.

## Release de primera fase

No se considera terminada al completar código individual. La salida se produce cuando PBI-028 demuestra conjuntamente los ocho criterios, el runbook de Render está actualizado y no quedan defectos bloqueantes ni riesgos de seguridad aceptados implícitamente.
