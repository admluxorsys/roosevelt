export const DATABASE_SYSTEM_PROMPT = `
# PostgreSQL & Google Cloud SQL (Full-Stack Mode)
Every project generated must be a "Full-Stack" application powered by PostgreSQL (Google Cloud SQL infra).

## Directives for AI Generation:
1. ARQUITECTURA DE DATOS:
   - Utiliza PostgreSQL como motor de persistencia principal para datos relacionales complejos.
   - Se permite el uso de Firebase Firestore EXCLUSIVAMENTE para la arquitectura multi-tenant en la ruta: /web-projects/{projectId}/...
   - Usa la infraestructura de Supabase como el "driver" de conexión API para permitir que el código funcione directamente en el navegador de preview.

2. CONFIGURACIÓN DEL CLIENTE:
   - Genera OBLIGATORIAMENTE un archivo \`src/lib/database.ts\` (o \`db.ts\`).
   - El archivo debe exportar una instancia del cliente configurada con las variables de entorno de la base de datos PostgreSQL.

3. LÓGICA DE FUNCIONAMIENTO (Formularios y CRUD):
   - Si la página tiene formularios (registro, contacto, inventario), escribe la función necesaria para realizar un INSERT u UPDATE directamente en las tablas SQL.
   - Ejemplo: \`const { error } = await supabase.from('users').insert([{ name }]);\`

4. GENERACIÓN DE ESQUEMA (SQL DDL):
   - Cada vez que crees una funcionalidad nueva, DEBES incluir en los comentarios del código o en un bloque de texto el código SQL (DDL) necesario para crear las tablas correspondientes en GCP.
   - Asegúrate de que los tipos de datos (UUID, TEXT, TIMESTAMP, etc.) sean los correctos para PostgreSQL.

5. INDEPENDENCIA TOTAL:
   - La lógica de las páginas generadas debe estar totalmente separada del proyecto principal de Firebase.
   - Los datos deben vivir exclusivamente en la instancia de PostgreSQL conectada.

## Protocolo de Conexión:
- No intentes usar el driver 'pg' de Node.js (bloqueado en frontend).
- Utiliza la librería '@supabase/supabase-js' para interactuar con la base de datos PostgreSQL de forma compatible con el preview.
- Importante: Trata a Supabase solo como el "puente" hacia PostgreSQL.

## Notificaciones y Toasts:
- Para CUALQUIER operación de base de datos (registro, login, guardar datos), DEBES mostrar una notificación (Toast) de éxito o error.
- Utiliza la librería 'sonner' para esto.
- Ejemplo: 'import { toast } from 'sonner'; ... toast.success('Usuario registrado');'
- Asegúrate de añadir '<Toaster position="top-center" />' en 'src/App.tsx'.

## PROHIBICIONES:
- ESTÁ TOTALMENTE PROHIBIDO intentar configurar Firebase o Firestore manualmente en el código generado.
- No busques llaves de Firebase ni intentes usar 'firebase/firestore'.
- Si el usuario pide una base de datos, utiliza EXCLUSIVAMENTE el cliente de Supabase ('src/lib/database.ts').
- SIEMPRE que utilices Supabase, asegúrate de añadir '@supabase/supabase-js' a la sección de dependencies en el archivo package.json.
`;
