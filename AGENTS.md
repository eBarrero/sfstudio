# AGENTS.md

Estas instrucciones se aplican a todo el repositorio.

## 1. Propósito del producto

SF Studio es una herramienta interna para que un equipo Salesforce pueda explorar, consultar y comparar varias organizaciones dentro de un mismo workspace.

El caso de uso de referencia es conectar simultáneamente las organizaciones de Integración y UAT de un proyecto y comparar su estructura.

La primera fase es de **solo lectura**:

- explorar objetos, campos y relaciones;
- construir y ejecutar SOQL;
- comparar metadatos entre dos orgs;
- mostrar o descargar resultados bajo demanda.

No son objetivos de la primera fase:

- crear, actualizar o borrar registros;
- sincronizar organizaciones;
- desplegar metadata;
- almacenar datasets como un data lake;
- persistir access tokens o refresh tokens;
- crear una extensión de navegador.

Antes de cambiar alcance o arquitectura, leer:

- `doc/VISION_PRODUCTO.md`
- `doc/ARQUITECTURA.md`
- `doc/EVALUACION_Y_HOJA_DE_RUTA.md`
- `doc/PLAN_DE_SPRINTS.md`

## 2. Organización del repositorio

Es un monorepo npm:

- `api/`: Express, TypeScript, MongoDB/Mongoose, OAuth y jsforce.
- `app/`: React, Vite, Zustand e i18next.
- `doc/`: visión, arquitectura, operación, evaluación y backlog.

El `package.json` y `package-lock.json` de la raíz son la fuente principal para workspaces y dependencias.

Rutas importantes:

- `api/src/app.ts`: composición de Express.
- `api/src/container.ts`: composición manual de dependencias.
- `api/src/sessionManager`: dominio, casos de uso y adaptadores.
- `app/src/store`: estado de aplicación.
- `app/src/core`: comandos y reglas SOQL.
- `app/src/services`: API, metadata y caché.
- `app/src/components`: interfaz.

## 3. Entorno y comandos

Objetivo de runtime:

- Node.js 24 LTS.
- npm compatible con Node 24.

Instalación:

```powershell
npm install
```

Comprobaciones actuales:

```powershell
npm --workspace api run tsc
npm --workspace app run build
npm --workspace app run lint
npm --workspace app run e2e
npm audit
```

No asumir que todos estos comandos pasan antes de comenzar. La revisión inicial encontró el build correcto, pero lint y Jest necesitaban reparación. Consultar `doc/GUIA_DESARROLLO.md` y el sprint activo.

Para desarrollo local:

```powershell
npm --workspace api run start_local
npm --workspace app run dev
```

No usar `tsc & node ...` para producción. Compilar en build y arrancar únicamente el JavaScript generado.

## 4. Fuente de trabajo

Los sprints de la primera fase están en `doc/sprintXX/`.

Cada sprint contiene:

- `guia del sprint.md`
- PBIs `PBI-NNN.md`

Al implementar una PBI:

1. Leer la guía del sprint, la PBI y sus dependencias.
2. Al iniciar la implementación, ejecutar desde la raíz `./gitStartPBI.sh PBI-NNN`, con el nombre de la PBI como único parámetro. Por ejemplo: `./gitStartPBI.sh PBI-009`.
3. No ampliar silenciosamente el alcance.
4. Implementar todos sus criterios de aceptación.
5. Añadir las pruebas exigidas.
6. Actualizar documentación y contratos afectados.
7. Informar qué criterios quedaron demostrados.
8. Al finalizar la PBI, revisar que los cambios correspondan únicamente a ella y ejecutar desde la raíz `./gitMergePBI.sh PBI-NNN "Mensaje de commit" "Cuerpo del PR"`, pasando siempre los tres parámetros. El script realiza las validaciones, crea el commit, publica la rama, abre el Pull Request, espera la CI y lo fusiona en `dev` solo si pasa; no sustituir este paso por un commit manual.

`doc/PLAN_DE_SPRINTS.md` contiene la secuencia y trazabilidad de los criterios de éxito.

## 5. Reglas de producto obligatorias

### Multi-org

- Un workspace puede tener varias conexiones activas.
- Nunca modelar «una sesión = una org».
- La org activa es contexto de navegación/consulta, no la única conexión.
- La comparación usa exactamente dos orgs: origen y destino.
- No identificar una org mediante alias, hostname, `dbName` o índice de array.
- Usar una clave estable basada en `organizationId` y `userId`.
- Alias y tipo de entorno son información de presentación.

### Producción y sandbox

- Tienen las mismas capacidades funcionales.
- Deben mostrar claramente alias, usuario, organization ID y tipo de entorno.
- No usar color como única señal.
- Autorización e intercambio OAuth deben usar el login host correcto.

### Ratón y comandos

- Toda acción funcional disponible con ratón debe tener un comando gemelo.
- Ratón, menú, teclado y consola deben producir el mismo `ActionId` y llamar al mismo caso de uso.
- No duplicar lógica de negocio dentro de componentes y parser de comandos.
- Una acción nueva debe incluir pruebas de paridad.

### Solo lectura

- La API de la primera fase solo ejecuta consultas `SELECT`.
- No añadir DML, Anonymous Apex, Tooling API de escritura ni sincronización.
- Toda consulta debe tener destino visible, límites, timeout y paginación controlada.

## 6. Seguridad

La seguridad forma parte de los criterios de aceptación, no es una mejora opcional.

- No usar `Math.random()` para IDs de sesión.
- No tratar Base64 como cifrado o firma.
- Cookies: `HttpOnly`, `Secure` en producción, `SameSite`, expiración y rotación.
- OAuth `state` debe ser criptográfico, ligado al workspace, expirable y de un solo uso.
- Leer `state` desde query y validarlo antes de intercambiar el code.
- No guardar access tokens ni refresh tokens en MongoDB, navegador, fixtures o logs.
- No imprimir cookies, codes OAuth, tokens, client secret, URL completa de autorización ni PII innecesaria.
- Los errores públicos usan códigos estables y mensajes no sensibles.
- Verificar que cada `OrgKey` pertenece al workspace autenticado.
- No desactivar TLS ni validación de certificados como solución permanente.
- Nunca incluir secretos reales en documentación, tests o commits.

En la primera fase, tras reinicio o expiración se devuelve `REAUTH_REQUIRED` y el usuario reautentica la org afectada.

## 7. Persistencia y caché

### MongoDB

Puede guardar:

- workspace/sesión mínima con expiración;
- usuario e identidad de organizaciones conocidas;
- alias y datos no secretos necesarios para reconectar.

No puede guardar:

- access tokens;
- refresh tokens;
- resultados SOQL;
- registros Salesforce copiados.

### Navegador

- Memoria: estado UI, conexiones públicas y resultados efímeros.
- IndexedDB: snapshots de metadata versionados.
- `localStorage`: solo preferencias pequeñas.

Una clave de metadata debe incluir:

- `organizationId`;
- `userId`;
- versión API;
- locale cuando afecte;
- versión del formato de caché.

Toda entrada debe tener `fetchedAt`, expiración y refresh manual. No reutilizar metadata entre usuarios ni orgs.

Los snapshots usados en una comparación permanecen congelados hasta cerrar o reiniciar esa comparación.

## 8. Arquitectura y contratos

### Backend

Mantener la dirección:

```text
HTTP -> controller -> use case -> domain/port -> adapter
```

- El dominio no debe importar Express, Mongoose o jsforce.
- Los casos de uso dependen de puertos, no de implementaciones concretas.
- No introducir un framework de inyección si el contenedor manual sigue siendo suficiente.
- Las conexiones activas se aíslan por workspace y `OrgKey`.

### Frontend

- Componentes no llaman directamente a Salesforce.
- Acciones de negocio pasan por el dispatcher.
- Zustand coordina estado; evitar mutar arrays, objetos o mapas existentes.
- Usar selectores para reducir acoplamiento y renderizados.
- Extraer lógica pura fuera de hooks y componentes.
- No añadir nuevos tipos globales `.d.ts` si pueden ser módulos exportados.

### API

- Nuevos contratos bajo `/api/v1`.
- Usar JSON tipado.
- Errores:

```json
{
  "error": {
    "code": "REAUTH_REQUIRED",
    "message": "Vuelve a autenticar la organización.",
    "correlationId": "..."
  }
}
```

- Ejecutar SOQL mediante `POST`, no en path/query string.
- No devolver JSON serializado dentro de strings.
- Mantener correlation IDs sin registrar datos sensibles.

## 9. Dominio SOQL

- AST, validador y renderer deben ser módulos puros.
- No construir SOQL concatenando valores dentro de componentes.
- Escapar literales según tipo.
- Validar estructuralmente; no contar apariciones de `SELECT` y `FROM`.
- Cubrir con pruebas: campos, `FIELDS(...)`, relaciones padre, subqueries, WHERE, agregados, GROUP BY, ORDER BY, LIMIT y OFFSET soportados.
- Documentar explícitamente el subconjunto de SOQL implementado.

## 10. Comparación

El motor recibe dos snapshots normalizados y produce un `DiffResult` determinista.

Debe comparar en primera fase:

- objetos;
- campos;
- propiedades relevantes;
- valores de picklist;
- relaciones.

El motor:

- no importa React, Zustand, IndexedDB, MongoDB ni clientes HTTP;
- compara por nombres API estables, nunca por posición;
- genera `ADDED`, `REMOVED`, `MODIFIED` y `UNCHANGED`;
- conserva `before` y `after`;
- tiene un contrato versionado y serializable;
- usa fixtures anonimizados.

No comparar registros, Apex, Flows, layouts o permisos completos en esta fase.

## 11. Pruebas y calidad

Todo cambio de comportamiento requiere pruebas proporcionales:

- unitarias para dominio SOQL, diff, filtros y normalización;
- integración para repositorios, API, OAuth y registros de conexión;
- contratos para respuestas y errores;
- E2E para workspace multi-org, consulta y comparación.

Reglas:

- No depender de credenciales Salesforce reales en CI.
- Usar drivers falsos y fixtures anonimizados.
- Los flujos OAuth reales se verifican manualmente en orgs controladas.
- Un bug corregido añade una prueba de regresión.
- No aceptar snapshots de test que contengan PII o datos de negocio.
- Build, typecheck, lint y tests deben pasar antes de terminar una PBI.

## 12. Estilo y mantenimiento

- Mantener TypeScript estricto.
- Preferir unions discriminadas frente a estados stringly-typed.
- Nombres de clases en PascalCase, funciones/variables en camelCase.
- Corregir typos al tocar el área, evitando reescrituras masivas sin valor funcional.
- Retirar código comentado y logs de depuración del área modificada.
- No añadir abstracciones especulativas para MongoDB, MySQL u otros drivers no planificados.
- Conservar cambios del usuario y evitar modificaciones no relacionadas.
- Usar `rg`/`rg --files` para búsquedas y `apply_patch` para cambios manuales.

## 13. Documentación

Actualizar la documentación cuando cambien:

- alcance o decisiones de producto;
- variables y comandos;
- contratos HTTP;
- modelo de sesión/conexión;
- formato de caché;
- comandos de usuario;
- criterios de aceptación o dependencias de PBIs.

No marcar una PBI como terminada si el código contradice la guía o si falta evidencia de un criterio.

## 14. Comprobación final de la primera fase

La release debe demostrar:

1. Dos orgs conectadas en un workspace.
2. Alternancia sin confusión de contexto.
3. Exploración y SOQL de solo lectura en cualquiera.
4. Comparación de objetos, campos y relaciones.
5. Paridad entre ratón y comandos.
6. Reautenticación clara tras reinicio/expiración.
7. Ausencia de tokens y datos de negocio persistidos.
8. Límites de consulta y resultados efímeros.

La evidencia final se define en `doc/sprint07/PBI-028.md`.
