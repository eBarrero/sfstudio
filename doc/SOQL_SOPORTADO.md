# Subconjunto SOQL de la primera fase

El constructor genera únicamente `SELECT`. La raíz usa un objeto API, campos individuales o `FIELDS(ALL|CUSTOM|STANDARD)`; estos últimos ocupan toda la lista de selección. Se admiten rutas de relación padre, una subconsulta hija por relación con campos seleccionados, funciones `COUNT`, `COUNT_DISTINCT`, `SUM`, `AVG`, `MIN`, `MAX`, `FORMAT` y las funciones de fecha enumeradas en `app/src/core/soql/domain.ts`.

Las condiciones estructuradas usan comparaciones (`=`, `!=`, `<`, `<=`, `>`, `>=`, `LIKE`), conjuntos (`IN`, `NOT IN`, `INCLUDES`, `EXCLUDES`) y grupos `AND`/`OR`. Los literales se representan por tipo y se escapan al renderizar. `ORDER BY`, `GROUP BY`, `LIMIT` y `OFFSET` están disponibles; `LIMIT` y `OFFSET` aceptan enteros entre 1 y 2000, y 0 y 2000, respectivamente. Las consultas agregadas con campos sencillos exigen `GROUP BY` para esos campos. La subconsulta no admite otra subconsulta.

No se implementa un parser de SOQL libre, `HAVING`, `TYPEOF`, funciones arbitrarias ni mutaciones. Una consulta inválida produce errores con código y ruta del nodo. La API valida por separado cualquier texto SOQL recibido, porque el AST del navegador no es una frontera de seguridad.
