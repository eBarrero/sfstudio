# Evaluación constructiva y hoja de ruta

## Resumen ejecutivo

SF Studio tiene un núcleo valioso: transforma metadatos complejos de Salesforce en navegación visual y una consulta SOQL estructurada. Su dirección de producto queda definida como un workspace interno, multi-org y de solo lectura en la primera fase, con comparación de Integración y UAT como caso principal. No es un prototipo vacío; hay aproximadamente 7.500 líneas entre API y frontend, compilación correcta, un modelo de relaciones y una interfaz propia.

El mayor problema no es la antigüedad del stack. Es que las piezas críticas —autenticación, sesión, generación de consultas y despliegue— tienen fallos que impiden considerar el sistema fiable. La recomendación es **conservar la idea y gran parte del código**, estabilizar el recorrido principal y después ampliar hacia administración de datos.

## Fortalezas

### Producto

- Ataca una tarea frecuente: descubrir nombres API, relaciones y campos antes de escribir SOQL.
- La navegación padre/hijo puede diferenciar el producto de una consola SOQL convencional.
- La command palette es una idea potente para usuarios técnicos.
- El modelo permite crecer hacia plantillas, historial, exportación y operaciones masivas.

### Diseño

- Backend con puertos/adaptadores y factoría de drivers.
- Separación de stores por responsabilidad.
- AST informal para SOQL en vez de una única cadena mutable.
- Carga perezosa de descripción de objetos.
- Índices locales para búsquedas eficientes de objetos y campos.
- Tokens de Salesforce solo en memoria.

### Estado técnico

- TypeScript estricto.
- API y frontend compilan.
- Dependencias críticas de Express/Mongoose ya fueron actualizadas.
- Los componentes están razonablemente segmentados.

## Hallazgos prioritarios

### P0 — Seguridad y funcionamiento básico

#### 1. Sesión falsificable y predecible

La cookie contiene solo un `sessionId` numérico en Base64. El ID se genera con `Math.random()` entre 0 y 999.999. Base64 no firma ni cifra; un cliente puede fabricar valores y probar IDs.

Impacto: posible acceso a organizaciones/sesiones de otro usuario y colisiones.

Propuesta:

- identificador criptográfico de 128 bits como mínimo;
- sesión guardada en un store con expiración;
- cookie `httpOnly`, `secure` en producción, `sameSite=lax` o más estricta, path y max-age;
- rotación al autenticar;
- no devolver `sessionId` al frontend si no es necesario.

#### 2. OAuth no valida `state`

El `state` se usa como etiqueta de tecnología/organización y no como nonce antifalsificación. Tampoco se compara el valor del callback con uno asociado a la sesión.

Impacto: riesgo de login CSRF y confusión de conexiones.

Propuesta: nonce criptográfico de un solo uso ligado a sesión y destino; considerar PKCE si la integración elegida lo soporta.

#### 3. Flujo producción/sandbox roto o muy frágil

- `ConnectionDriverDTO.isSalesforce()` comprueba `SF_Test` dos veces y omite `SF_Prod`.
- El intercambio OAuth crea `jsforce.OAuth2` con `loginUrl: https://test.salesforce.com` incluso para producción.
- El callback consulta `req.params.state`, aunque `state` llega en `req.query.state`.

Propuesta: un único objeto de contexto OAuth persistido temporalmente, con `loginUrl`, nonce y organización esperada.

#### 4. API de sesión fijada a localhost

`app/src/services/session/controller.ts` usa una URL absoluta local. En un navegador de producción, «localhost» es el ordenador del usuario.

Propuesta: usar rutas relativas `/api/...` y dejar el proxy solo para desarrollo.

#### 5. Secretos y datos sensibles en logs

Se imprimen URL de autorización, cookie/token Base64, sesión, IP, DTO y objetos de usuario.

Propuesta: logger estructurado con redacción; nunca registrar code, cookie, token, client secret ni PII completa.

### P1 — Fiabilidad

#### 6. Estado crítico solo en memoria

`Sessions` y `ConnectionPool` son singletons en memoria. No funcionan bien con:

- reinicios;
- suspensión del servicio;
- más de una instancia;
- despliegues rolling.

Alternativas:

1. MVP: aceptar reautenticación, detectar pool vacío y devolver `401 REAUTH_REQUIRED`.
2. Producción: guardar refresh token cifrado con rotación/expiración y reconstruir conexiones.
3. Distribuido: store de sesiones compartido y estrategia explícita para credenciales.

La elección depende del nivel de confianza y del público del producto.

#### 7. Logout no implementado

`UserEntity.signOut()` no hace nada. Tampoco se borra la cookie, se revoca Salesforce ni se elimina el driver del pool.

Propuesta: definir claramente «desconectar org» frente a «cerrar sesión completa» y probar ambos flujos.

#### 8. Generador SOQL sin red de seguridad

Problemas visibles:

- `FIELDS(ALL/CUSTOM/STANDARD)` añade `SELECT SELECT ...`;
- `ORDER BY` y `HAVING` tienen variables pero no implementación efectiva;
- la validez se reduce a contar apariciones de `SELECT` y `FROM`;
- condiciones se almacenan como `sqlString` ya concatenado;
- no hay escaping central de literales;
- se envía SOQL en la URL, exponiéndolo a límites y logs.

Propuesta:

- extraer un paquete/módulo puro `soql-domain`;
- AST discriminado y renderer sin estado;
- validación estructural;
- escape por tipo;
- pruebas de snapshot/casos límite;
- `POST /api/v1/query` con cuerpo JSON.

#### 9. Caché sin invalidación

`localStorage` devuelve indefinidamente el esquema anterior. Esto coincide con el bug histórico de caché más nueva/vieja que la org.

Propuesta: clave por `orgId + apiVersion + schemaVersion`, TTL, botón «refrescar» y borrado al cambiar usuario.

#### 10. Errores poco consistentes

La API devuelve a veces strings, a veces JSON serializado dentro de strings y a veces mensajes internos con la URL.

Propuesta:

```json
{
  "error": {
    "code": "CONNECTION_NOT_ACTIVE",
    "message": "Vuelve a autenticar la organización."
  }
}
```

Los detalles técnicos deben quedar en logs con correlation ID.

### P2 — Mantenibilidad

#### 11. Pruebas insuficientes

No hay tests útiles para la lógica más valiosa.

Pirámide propuesta:

- unitarios: renderer SOQL, filtros, índices, conversión de resultados;
- integración: repositorio con Mongo temporal, controladores con driver falso;
- contrato: respuestas de Salesforce grabadas y anonimizadas;
- E2E: login simulado, elegir objeto, construir y ejecutar consulta.

#### 12. Toolchain duplicado y roto

Hay versiones distintas de ESLint/TypeScript en raíz, API y app. El lint no arranca y Jest depende de un módulo ausente.

Propuesta: una configuración compartida de TypeScript/ESLint, scripts raíz `build/lint/test/typecheck` y CI.

#### 13. Tipos globales y estado stringly-typed

Los `.d.ts` globales facilitan empezar, pero esconden dependencias. Estados como `'INIT'`, `'org'`, `'SQL_RESULT'` y acciones se reparten como strings.

Propuesta: módulos de tipos exportados, unions discriminadas y constantes únicas.

#### 14. Mutaciones y efectos difíciles de seguir

Algunos stores mutan arrays/objetos antes de llamar a `set`. `applicationHook` coordina demasiadas responsabilidades y silencia dependencias de hooks.

Propuesta: acciones inmutables pequeñas, selectores Zustand, servicios inyectables y hooks enfocados.

#### 15. Código inacabado visible

- adaptadores no Salesforce no implementados;
- ruta de metadata usada por frontend pero ausente en backend;
- `Orderby` vacío;
- RelationshipDiagram no integrado;
- mucho logging de depuración;
- código comentado y nombres con errores tipográficos.

Propuesta: eliminar promesas de alcance que no estén en el roadmap y convertir los TODO reales en issues verificables.

## Brecha respecto al objetivo

Para ser una herramienta de «administración de datos» faltan:

- vista y edición de un registro;
- creación y borrado con confirmación;
- edición masiva;
- importación/exportación CSV;
- selección de campos y mapeo;
- dry-run, validación y resumen antes de mutar;
- papelera/rollback cuando Salesforce lo permita;
- auditoría de acciones;
- límites, paginación y Bulk API;
- control explícito de permisos CRUD/FLS;
- protección para producción frente a sandbox.

No conviene implementar mutaciones antes de resolver autenticación, permisos, trazabilidad y tests.

## Hoja de ruta recomendada

### Fase 0 — Recuperar control (1–2 días)

- Fijar Node 24 y documentar entorno.
- Crear scripts raíz `build`, `typecheck`, `lint` y `test`.
- Reparar lint y Jest.
- Añadir CI con instalación limpia, compilación, lint, tests y audit.
- Convertir los hallazgos P0 en issues.

Criterio de salida: un commit limpio puede validarse con un solo comando.

### Fase 1 — Hacer seguro el recorrido de lectura

- Rediseñar cookie/sesión y OAuth state.
- Corregir producción/sandbox.
- Sustituir localhost por API relativa.
- Implementar logout/desconexión.
- Respuesta `401 REAUTH_REQUIRED` cuando falte el driver.
- Logger con redacción y errores estables.
- Health/readiness endpoints.

Criterio de salida: login, reinicio, reautenticación y logout tienen comportamiento determinista.

### Fase 2 — Consolidar el producto actual

- Extraer y probar el dominio SOQL.
- Corregir `FIELDS`, WHERE, relaciones, agregados y límites.
- Implementar o retirar ORDER BY, HAVING y metadata extra.
- Versionar e invalidar caché.
- POST para ejecución de consultas.
- Paginación con `nextRecordsUrl`.
- Exportación CSV de solo lectura.
- Selector de organización activa basado en una clave estable.
- Mantener varias conexiones simultáneas dentro del workspace.

Criterio de salida: exploración y consultas complejas tienen pruebas y errores comprensibles.

### Fase 3 — Comparación multi-org

- Normalizar snapshots de esquema por `organizationId` y versión API.
- Selector de origen y destino.
- Diff de objetos, campos, propiedades, picklists y relaciones.
- Filtros «solo origen», «solo destino» y «modificados».
- Navegación desde una diferencia a cualquiera de las orgs.
- Comandos gemelos de todas las acciones de comparación.
- Pruebas con snapshots anonimizados de Integración y UAT.

Criterio de salida: un usuario puede identificar por qué dos orgs difieren sin exportar manualmente su esquema.

### Fase 4 — Mejorar UX y observabilidad

- Navegación accesible sin depender de comandos.
- Estados loading/empty/error.
- Historial de consultas local o por usuario.
- Editor de SOQL con vista previa y validación.
- Métricas de latencia/error y correlation IDs.
- Aviso visible de org, usuario y tipo producción/sandbox.

### Fase 5 — Administración de datos

Empezar por operaciones reversibles:

1. vista detallada;
2. edición de un registro con FLS/CRUD;
3. creación;
4. borrado con confirmación;
5. CSV con dry-run;
6. Bulk API y trabajos reanudables.

Toda mutación debe mostrar organización, objeto, cantidad de registros, campos y consecuencias antes de ejecutar.

## Decisiones de producto acordadas

1. Herramienta interna de un equipo de trabajo.
2. Solo lectura en la primera fase.
3. No persistir refresh tokens inicialmente; varias conexiones viven durante el workspace y solicitan reautenticación tras reinicio o expiración.
4. Producción y sandbox tienen las mismas capacidades; únicamente cambia la identidad visible del contexto.
5. Toda acción de ratón tiene un comando gemelo y ambas usan la misma acción interna.
6. No es un data lake: consulta y presenta datos bajo demanda.
7. Multi-org es una capacidad central, con comparación Integración–UAT como caso de uso principal.

El alcance detallado y los criterios de éxito están en `VISION_PRODUCTO.md`.

## Recomendación final

No reescribiría el proyecto desde cero. Conservaría:

- el concepto de navegación de metadatos;
- el modelo estructurado de consultas, después de aislarlo;
- la separación backend/driver;
- buena parte de los componentes visuales.

Reharía de forma localizada:

- sesión y OAuth;
- cliente HTTP y contratos;
- renderer/validador SOQL;
- scripts, pruebas y CI.

Esa estrategia preserva el trabajo valioso y reduce el riesgo antes de incorporar operaciones de escritura sobre datos reales.
