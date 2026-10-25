# Guía del sprint 06: Motor de comparación de esquemas

## Objetivo

Construir un motor puro que compare snapshots coherentes de dos orgs y produzca diferencias deterministas de objetos, campos, propiedades, picklists y relaciones.

## Criterios de entrada

- Snapshots normalizados y versionados
- Dos orgs conectables en el workspace
- Caché con refresh y congelación

## PBIs

- [PBI-021: Orquestación de pareja de snapshots](./PBI-021.md)
- [PBI-022: Diff determinista de objetos](./PBI-022.md)
- [PBI-023: Diff de campos, propiedades y picklists](./PBI-023.md)
- [PBI-024: Diff de relaciones y suite de contratos](./PBI-024.md)

## Orden recomendado

1. PBI-021: Orquestación de pareja de snapshots.
2. PBI-022: Diff determinista de objetos.
3. PBI-023: Diff de campos, propiedades y picklists.
4. PBI-024: Diff de relaciones y suite de contratos.

## Demostración de fin de sprint

- Dos fixtures de Integración y UAT producen un diff estable.
- El diff detecta objetos y campos añadidos/eliminados/modificados.
- Picklists y relaciones se comparan semánticamente.
- El motor no depende de UI, red ni almacenamiento.

## Definition of Done del sprint

- El motor cubre objetos, campos, propiedades, picklists y relaciones.
- Los snapshots permanecen congelados durante el cálculo.
- DiffResult está versionado y documentado.
- La suite es determinista y rápida.

## Riesgos

- Salesforce puede devolver propiedades ruidosas o dependientes del usuario.
- Comparar snapshots con distinta API version puede generar falsos positivos.

## Fuera de alcance

- UI de comparación.
- Comparación de registros o metadata no incluida.
- Escritura o sincronización.

