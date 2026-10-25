# Guía de desarrollo y operación

## Requisitos

- Node.js 24 LTS. La revisión se realizó con `v24.22.1`.
- npm. La revisión se realizó con `12.2.1`.
- MongoDB accesible localmente o por URI.
- Una Connected App de Salesforce.

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
CLIENT_ID=<consumer-key-de-la-connected-app>
CLIENT_SECRET=<consumer-secret>
REDIRECT_URI=http://localhost:3000
API_SF_VERSION=<version-de-salesforce-probada>
MONGO=mongodb://localhost:27017/sessions
ENCRYPTION_KEY=<32-bytes-si-se-usa-cryptoWrapper>
```

Notas:

- El código llama `CLIENTE_SECRET` a la constante, pero lee `CLIENT_SECRET`.
- La variable de MongoDB se llama `MONGO`, no `MONGO_URL`.
- En `DEV` y `TESTING` el callback se fuerza a `http://Localhost:3000/api/callback`.
- `ENCRYPTION_KEY` pertenece a un wrapper que actualmente no se usa.
- Ajusta `API_SF_VERSION` a una versión soportada y probada; el valor por defecto del código es `58.0`.

En Salesforce, la callback URL de la Connected App debe coincidir exactamente con:

```text
http://localhost:3000/api/callback
```

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

Los tests existentes son:

- un smoke test que siempre pasa;
- una prueba de `App` que solo comprueba una sesión vacía.

No existen pruebas de API, OAuth, repositorio, caché, generador SOQL ni transformación de resultados.

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

El script `api:start` ejecuta únicamente `node build/index.js`; la compilación pertenece al Build Command.

Verificaciones después del deploy:

1. El log muestra Node 24.
2. MongoDB conecta.
3. `GET /api/init` devuelve 200.
4. OAuth usa el callback HTTPS exacto.
5. La SPA llama al dominio actual, no a `localhost`.
6. La conexión sobrevive a navegación y consulta.
7. Un reinicio fuerza una reautenticación comprensible, no un error genérico.

## Diagnóstico rápido

| Síntoma | Causa probable |
| --- | --- |
| «Driver not found» al entrar en producción | `isSalesforce()` no reconoce `SF_Prod`. |
| OAuth de producción falla al intercambiar el code | `salesforceOAuth2.login()` fija `https://test.salesforce.com`. |
| En producción el navegador intenta conectar a tu PC | `URL_PATH` está fijado a `localhost`. |
| «Connection not found» tras deploy/reinicio | `ConnectionPool` vive solo en memoria. |
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
