# Guía del sprint 10: Control de LIMIT en el constructor SOQL

## Estado y objetivo

Implementado en PBI-033. «Where Clause» incluye una tabla para gestionar el `LIMIT` de la consulta raíz y de cada subconsulta hija. Los sprints 06 y 07 siguen aplazados.

## Criterios de entrada

- El modelo SOQL distingue bloques `SELECT` (`ROOT` y `SUBQUERY`) de nodos de navegación `RELETED`.
- La pestaña «Where Clause», el renderer SOQL y las consultas guardadas funcionan.
- La API mantiene el límite de seguridad y la paginación de resultados.

## PBI

- [PBI-033: Gestionar LIMIT por bloque SOQL desde «Where Clause»](./PBI-033.md).

## Demostración de fin de sprint

1. Abrir una consulta nueva y comprobar `Other = 50` en la raíz.
2. Añadir una subconsulta hija y comprobar `1` en su fila, sin mostrar una fila para un padre `RELETED`.
3. Cambiar la raíz a `All` y comprobar que la SOQL omite su `LIMIT`, mientras el límite de ejecución sigue visible.
4. Elegir `Other = 250` en la raíz y ejecutar la consulta mediante el cupo seguro correspondiente.
5. Guardar y cargar la consulta; comprobar que cada fila recupera su selección.

## Definition of Done

- Los criterios de PBI-033 están demostrados con pruebas automatizadas.
- Typecheck, build, lint y tests pasan.
- La documentación aclara la diferencia entre `LIMIT` SOQL y cupo de ejecución de la API.

## Fuera de alcance

- Descargar todos los registros de una organización o eliminar los límites de seguridad.
- Cambiar `OFFSET`, `ORDER BY` o la lógica de `WHERE`.
- Añadir un `LIMIT` independiente a `RELETED`.
