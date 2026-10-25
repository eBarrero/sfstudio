# Guía de desarrollo y operación

## Requisitos

- Node.js 24 LTS. La revisión se realizó con `v24.22.1`.
- npm. La revisión se realizó con `12.2.1`.
- MongoDB accesible localmente o por URI.
- Una Connected App o External Client App de Salesforce con OAuth Web Server Flow (authorization code) habilitado.

La versión está fijada mediante `.node-version` y `engines.node`.

## Instalación

Desde la raíz:

```powershell
npm install
```

El proyecto usa workspaces, por lo que el `package.json` y `package-lock.json` de la raíz son la fuente principal.

## Variables de la API

El script local busca `api/.env`:

```dotenv
PORT=3000
ENV=DEV
CLIENT_ID=<consumer-key-de-la-app-oauth>
CLIENT_SECRET=<consumer-secret>
REDIRECT_URI=http://localhost:3000
API_SF_VERSION=<version-de-salesforce-probada>
MONGO=mongodb://localhost:27017/sessions
ENCRYPTION_KEY=<32-bytes-si-se-usa-cryptoWrapper>
```

Notas:

- `CLIENT_ID`, `CLIENT_SECRET`, `REDIRECT_URI` y `MONGO` son obligatorias en `DEV` y `PROD`; la API falla antes de escuchar el puerto si falta alguna.
- `REDIRECT_URI` es la URL pública base de la API, sin `/api/callback`; el callback se deriva añadiendo esa ruta.
- `TESTING` permite valores aislados por defecto y no necesita credenciales reales.
- La variable externa de MongoDB se llama `MONGO`; el módulo tipado la expone internamente como `mongoUrl`.
- `ENCRYPTION_KEY` pertenece a un wrapper que actualmente no se usa.
- Ajusta `API_SF_VERSION` a una versión soportada y probada; el valor por defecto del código es `58.0`.

En Salesforce, la callback URL de la Connected App o External Client App debe coincidir exactamente con:

```text
http://localhost:3000/api/callback
```

Ambos tipos de app usan las mismas variables `CLIENT_ID` (consumer key) y `CLIENT_SECRET` (consumer secret); no se cambia la configuración de una Connected App existente para adoptar External Client App. Configura el flujo OAuth Web Server Flow y los scopes que usa SF Studio (`api`, `web`, `id`, `profile`, `email`). En producción, registra la callback HTTPS pública exacta. Si una External Client App exige PKCE, su configuración debe ajustarse antes de usarla con este flujo; SF Studio aún no genera un code challenge. Consulta la [configuración OAuth de External Client Apps](https://help.salesforce.com/s/articleView?id=sf.configure_external_client_app_oauth_settings.htm&language=en_US&type=5) y el [Web Server Flow de Salesforce](https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_web_server_flow.htm&language=en_US&type=5).

## Ejecución local

Terminal 1:

```powershell
npm --workspace api run start_local
```

Terminal 2:

```powershell
npm --workspace app run dev
```

Vite abre normalmente `http://localhost:5173` y proxyfica `/api` a `http://localhost:3000`.

Hay una excepción importante: `app/src/services/session/controller.ts` contiene `http://localhost:3000/api/` de forma fija. Debe sustituirse por `/api/` o por una variable de entorno antes de confiar en producción.

## Compilación verificada

```powershell
npm run build
```

Comandos canónicos desde la raíz:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm run audit
```

`npm run audit` valida las dependencias de producción con severidad alta o crítica. Para revisar también el toolchain de desarrollo se puede ejecutar `npm run audit:all`.

## Calidad

### Lint

El lint de ambos workspaces se ejecuta con:

```powershell
npm run lint
```

Las configuraciones flat ignoran artefactos generados como `dist` y `coverage`.

### Pruebas

El comando canónico es:

```powershell
npm test
```

Jest usa un `fetch` controlado en el entorno jsdom y no necesita `node-fetch`.

Los tests existentes cubren, entre otros casos:

- pruebas unitarias del parsing de configuración para `DEV`, `TESTING` y `PROD`;
- pruebas de integración de liveness/readiness con Mongo disponible y no disponible;
- generación, expiración, asociación y consumo único de OAuth `state`;
- callbacks OAuth válidos, inválidos, expirados, repetidos y de otro workspace con un driver falso;
- redacción de secretos y PII en el logger estructurado;
- un smoke test que siempre pasa;
- una prueba de `App` que solo comprueba una sesión vacía.

Todavía no existen pruebas suficientes de repositorio, caché, generador SOQL ni transformación de resultados.

## Salud de la API

La API expone dos endpoints sin autenticación y sin información sensible:

| Ruta | Significado | Respuesta correcta |
| --- | --- | --- |
| `GET /health` | El proceso HTTP está vivo; no consulta MongoDB ni Salesforce. | `200 {"status":"ok"}` |
| `GET /ready` | La conexión Mongoose con MongoDB está disponible. | `200 {"status":"ready"}` |

Cuando MongoDB no está disponible, `/ready` devuelve `503 {"status":"not_ready"}`. La respuesta no incluye URI, credenciales ni el detalle interno del error.

## Sesión de workspace

La API usa la cookie `sfstudio_workspace` como identificador opaco del workspace:

- UUID v4 generado mediante `crypto.randomUUID`;
- duración de ocho horas, tanto en cookie como en `expiresAt` de MongoDB;
- `HttpOnly`, `SameSite=Lax` y `Path=/` en todos los entornos;
- `Secure` adicional cuando `ENV=PROD`;
- rotación después de completar una autenticación OAuth.

El UUID no aparece en el DTO público ni debe escribirse en logs. Una cookie ausente inicia el flujo de un workspace nuevo; una cookie malformada, desconocida o expirada devuelve `401 SESSION_INVALID` y se elimina del navegador.

MongoDB dispone de una colección mínima `WorkspaceSession` con referencia al usuario y un índice TTL sobre `expiresAt`. Al volver a autenticarse se crea esta sesión para los usuarios anteriores sin borrar sus organizaciones conocidas; las cookies numéricas/Base64 antiguas quedan invalidadas.

`User.sessionId` se conserva temporalmente como clave heredada para mantener compatible el índice único ya desplegado. No se consulta para autenticar, no se envía al navegador y no coincide con el UUID de `WorkspaceSession`. Retirarlo exige una migración operativa explícita del índice de la colección `User`; la aplicación no borra ese índice ni el campo automáticamente.

`WorkspaceSession.user` ya no es único: el mismo usuario puede abrir dos workspaces independientes. En el primer alta de sesión tras actualizar, el repositorio elimina solo el índice único heredado `user_1` de esa colección. La cuenta MongoDB necesita permiso para `dropIndex` durante esta migración; si no lo tiene, el operador debe retirar ese índice antes de usar sesiones concurrentes. Se conservan el índice único de `sessionId` y el TTL de `expiresAt`.

## Seguridad OAuth y trazabilidad

Cada autorización crea un `state` aleatorio de 256 bits, válido durante diez minutos y consumible una sola vez. Se asocia en memoria al workspace, al destino solicitado y al `correlationId`. Durante el primer login, la cookie temporal `sfstudio_oauth_flow` enlaza el navegador con ese intento; es `HttpOnly`, `SameSite=Lax`, limitada a `/api` y `Secure` en producción.

El contexto del `state` guarda también el host canónico: `https://login.salesforce.com` para `SF_Prod` y `https://test.salesforce.com` para `SF_Test`. La URL de autorización y el intercambio del código usan ese mismo host. La query del callback y `instanceUrl` nunca eligen el host de intercambio. El driver conserva un `OrgConnection` con el mismo contrato en ambos entornos; solo cambian `environmentKind` y `loginHost`.

El callback valida y consume `state` antes de invocar Salesforce. Los rechazos tienen contratos estables:

| Situación | HTTP | Código |
| --- | ---: | --- |
| Falta `state` o `code` | 400 | `OAUTH_CALLBACK_INVALID` |
| `state` desconocido, expirado o ya consumido | 400 | `OAUTH_STATE_INVALID` |
| El intento pertenece a otro workspace | 401 | `OAUTH_STATE_MISMATCH` |
| Tecnología u host OAuth no válidos | 400 | `OAUTH_CONTEXT_INVALID` |
| Salesforce rechaza autorización, intercambio o identidad | 502 | `SALESFORCE_AUTH_FAILED` |

Todos los errores incluyen un `correlationId` y la respuesta HTTP expone el mismo valor en `X-Correlation-Id`. Los logs son JSON y no deben registrar cookies, códigos OAuth, `state`, tokens, secretos, URLs completas de autorización, correo o nombre de usuario. El logger aplica redacción defensiva, pero los llamadores deben seguir enviando solo los campos mínimos.

`OAuthStateStore` vive en memoria. Tras reiniciar la API o al saltar entre instancias, un callback pendiente se rechazará y habrá que iniciar de nuevo OAuth. En esta fase no se persisten refresh tokens.

### Verificación manual controlada de PBI-006

En orgs de prueba de producción y sandbox, con una app OAuth autorizada para cada una:

1. Inicia `GET /api/auth/SF_Prod`; comprueba que la redirección va a `login.salesforce.com` y completa el login. Verifica `environmentKind: PRODUCTION`, `loginHost` y `status: CONNECTED` en `GET /api/v1/workspace`.
2. Inicia `GET /api/auth/SF_Test` dentro del mismo workspace; comprueba `test.salesforce.com`, completa el login y verifica `environmentKind: SANDBOX`, `loginHost` y ambos `OrgKey` distintos.
3. Reautentica cada conexión por `/api/v1/connections/:orgKey/authorize` y verifica que vuelve al host de su entorno. No copies cookies, códigos ni tokens a tickets o registros.
4. Confirma que las dos conexiones pueden invocar el mismo endpoint de lectura y que un fallo OAuth muestra `SALESFORCE_AUTH_FAILED` sin detalles del proveedor.

### Auditoría npm

```powershell
npm audit
```

Estado al 25-10-2026: 4 vulnerabilidades (1 alta, 3 moderadas), todas derivadas de Vite/esbuild y plugins de desarrollo. La API de producción ya no presenta los 4 avisos críticos anteriores.

No usar `npm audit fix --force` de forma rutinaria. La corrección restante propone un salto mayor de Vite; debe hacerse como migración probada.

## Despliegue en Render

Configuración conceptual:

- Root Directory: raíz del repositorio.
- Build Command: `npm ci && npm run build`.
- Start Command: `node api/build/index.js` ejecutado desde la raíz, o ajustar la ruta de estáticos si se ejecuta desde `api`.
- Variables: las de la sección anterior, con `ENV=PROD` y `REDIRECT_URI=https://<dominio>`.
- Node: fijar `24.22.1`.
- Health Check Path: `/health`.

El script `api:start` ejecuta únicamente `node build/index.js`; la compilación pertenece al Build Command.

Verificaciones después del deploy:

1. El log muestra Node 24.
2. `GET /health` devuelve 200.
3. `GET /ready` devuelve 200 cuando MongoDB conecta y 503 cuando no está disponible.
4. `GET /api/init` devuelve 200.
5. OAuth usa el callback HTTPS exacto.
6. La SPA llama al dominio actual, no a `localhost`.
7. La conexión sobrevive a navegación y consulta.
8. Un reinicio fuerza una reautenticación comprensible, no un error genérico.

## Diagnóstico rápido

| Síntoma | Causa probable |
| --- | --- |
| `OAUTH_CONTEXT_INVALID` al conectar | La tecnología o el host guardado no corresponde al entorno Salesforce. |
| `SALESFORCE_AUTH_FAILED` | Revisa callback, permisos y credenciales de la app OAuth en Salesforce sin registrar el código ni el token. |
| En producción el navegador intenta conectar a tu PC | `URL_PATH` está fijado a `localhost`. |
| `REAUTH_REQUIRED` tras deploy/reinicio | El registro de drivers vive solo en memoria; reautentica la org afectada. |
| Metadatos de descripción de campos fallan con 404 | Falta la ruta `/api/getObjectmetadata/...`. |
| Esquema obsoleto | `localStorage` no tiene TTL ni clave de versión. |
| Logout parece funcionar pero la sesión sigue abierta | `UserEntity.signOut()` es un TODO. |
| `FIELDS(ALL)` produce SOQL inválido | El generador concatena un segundo `SELECT`. |

## Convenciones recomendadas para continuar

- Nuevos endpoints bajo `/api/v1` y contratos JSON tipados.
- Errores con `code` estable, mensaje público y detalle solo en logs.
- Pruebas unitarias para toda regla del generador SOQL.
- No imprimir cookies, OAuth URLs, códigos ni identidad en logs.
- No mutar arrays/maps recuperados desde Zustand; crear una nueva referencia.
- Nombres de clases en PascalCase y corrección gradual de typos, sin reescritura masiva.
