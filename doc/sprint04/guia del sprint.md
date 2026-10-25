# Guía del sprint 04: Metadatos aislados, persistentes y actualizables

## Objetivo

Permitir explorar objetos, campos y relaciones de cualquier org activa sin mezclar datos, con caché IndexedDB versionada y actualización comprensible.

## Criterios de entrada

- Selector multi-org operativo
- OrgKey estable disponible en frontend y API
- Cliente HTTP compartido

## PBIs

- [PBI-013: Modelo normalizado de snapshot de metadatos](./PBI-013.md)
- [PBI-014: Caché IndexedDB con memoria como nivel rápido](./PBI-014.md)
- [PBI-015: Expiración, refresco y consistencia de snapshots](./PBI-015.md)
- [PBI-016: Explorador aislado por organización activa](./PBI-016.md)

## Orden recomendado

1. PBI-013: Modelo normalizado de snapshot de metadatos.
2. PBI-014: Caché IndexedDB con memoria como nivel rápido.
3. PBI-015: Expiración, refresco y consistencia de snapshots.
4. PBI-016: Explorador aislado por organización activa.

## Demostración de fin de sprint

- Se explora Account en Integración y UAT sin contaminación cruzada.
- Cerrar y abrir el navegador reutiliza metadata vigente desde IndexedDB.
- Una recarga forzada actualiza el snapshot y muestra su fecha.
- Cambiar usuario, API version o formato no reutiliza una caché incompatible.

## Definition of Done del sprint

- Exploración multi-org aislada y probada.
- IndexedDB es la persistencia de metadata; localStorage queda para preferencias pequeñas.
- Fecha, expiración y refresh son visibles.
- CI y auditoría pasan según política del proyecto.

## Riesgos

- Describe completo puede consumir cuota; la carga debe seguir siendo perezosa.
- La metadata visible depende del usuario, no solo de organizationId.

## Fuera de alcance

- Diff de snapshots.
- Persistencia de resultados de consulta.
- Metadata Apex, Flow o layouts.

