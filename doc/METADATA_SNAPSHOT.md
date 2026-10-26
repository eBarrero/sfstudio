# Contrato de snapshot de metadatos

`app/src/services/salesforceSchema/metadataSnapshot.ts` define el contrato JSON de la primera fase.
La clave combina `schemaVersion`, `organizationId`, `userId`, versión de la API de
Salesforce y locale. `orgKey` debe ser exactamente `organizationId:userId`.

Un snapshot contiene `fetchedAt` y `expiresAt` como milisegundos Unix, y un
diccionario de objetos por API name. Cada objeto contiene diccionarios de campos
por API name y relaciones hijas por `childSObject.field`. Las claves y listas se
ordenan antes de serializar. `null` para campos o relaciones significa que aún
no se descargó el describe de ese objeto; un diccionario vacío significa que se
descargó y no contiene entradas. Un cambio de `schemaVersion` invalida las
entradas anteriores.

El formato conserva las propiedades de objetos, campos, picklists y relaciones
necesarias para exploración y comparación. No contiene conexiones, credenciales,
registros ni resultados SOQL. Los describes completos se cargan por objeto,
cuando el usuario lo abre.

La caché usa memoria como L1 e IndexedDB como L2 (`sfstudio-metadata-v1`,
almacenes `global` y `object`). Las lecturas y escrituras son asíncronas. Si
IndexedDB no está disponible, falla o devuelve una entrada corrupta, se trata
como un miss y la exploración continúa con la copia en memoria o una nueva
lectura remota. La telemetría de caché solo emite códigos de evento, sin
identificadores de org ni contenido del describe.
