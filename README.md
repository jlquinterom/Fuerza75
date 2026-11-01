# Fuerza75 v1.1 — edición GitHub Pages (iPhone)

Aplicación PWA estática para registrar el programa de fuerza, caminatas, alimentación y progreso del **2 de noviembre de 2026 al 31 de enero de 2027**. Sin backend, sin cuentas, sin analítica. Los datos de entrenamiento se guardan **solo en el navegador/dispositivo** donde se utiliza la aplicación.

## Publicar en GitHub Pages (sin usar comandos)

1. Accede a [GitHub](https://github.com/) y crea un repositorio **público** denominado `fuerza75` (puedes cambiar el nombre si lo deseas).
2. Descomprime el ZIP. Abre la carpeta extraída y sube **los archivos que contiene**, no la carpeta contenedora ni el archivo ZIP, a la **raíz** del repositorio: GitHub → `Add file` → `Upload files` → `Commit changes`. Asegúrate de que `index.html` aparece en la raíz. El fichero `.nojekyll` puede estar oculto según el sistema operativo: inclúyelo si aparece, o créalo directamente desde GitHub (`Add file` → `Create new file` → `.nojekyll`) si no se ha subido.
3. Ve a `Settings` → `Pages` → `Build and deployment`: `Source = Deploy from a branch`, `Branch = main`, carpeta `/(root)` → `Save`.
4. Cuando GitHub muestre la URL publicada, ábrela en el ordenador para comprobar que carga. El formato habitual será `https://TU-USUARIO.github.io/fuerza75/`.
5. Abre esa misma dirección HTTPS en **Safari del iPhone**; pulsa `Compartir` → `Añadir a pantalla de inicio` → `Abrir como app web` → `Añadir` (la nomenclatura depende de iOS).
6. Comprueba que se guarda una sesión de prueba, que puedes exportar una copia JSON y que la app arranca **sin conexión** tras la primera carga. Borra después los datos de prueba.

Para publicar una versión posterior, modifica los archivos en **este mismo repositorio** y confirma los cambios (`commit`). GitHub Pages volverá a publicar automáticamente. Si cambias archivos estáticos, aumenta `CACHE_NAME` en `sw.js` (por ejemplo de `v4` a `v5`) para actualizar los archivos guardados para uso offline.

## Privacidad y copias

- En GitHub Free el repositorio de Pages debe ser **público**; la web publicada también es pública. **No subas datos personales, copias JSON, historial de entrenamientos, informes clínicos ni credenciales** al repositorio.
- El sitio contiene código y archivos estáticos; los registros que introduzcas en Fuerza75 **no se publican en GitHub**. Permanecen en el almacenamiento local del iPhone. GitHub puede almacenar datos técnicos de acceso al sitio, como la IP.
- **Exporta al menos semanalmente una copia JSON** a Archivos/iCloud Drive. Al borrar la app, cambiar de dispositivo o eliminar los datos del navegador, puedes perder registros locales.
- Si has usado la app alojada en Netlify u otro dominio, exporta su historial ANTES de migrar y luego impórtalo en la instalación de GitHub Pages. Los dominios tienen almacenamientos distintos.
- La importación reemplaza el historial actual tras confirmar la operación; conserva una copia previa.

## Compatibilidad y límites

- `manifest.webmanifest`, `sw.js` y rutas a CSS/JS/iconos son **relativas** a la carpeta publicada, por lo que funcionan bajo `/fuerza75/` sin necesitar configurar una ruta base.
- Se incluye `.nojekyll` para publicar los archivos tal cual, sin transformación Jekyll.
- La versión original contenía `_headers`, un archivo específico de Netlify: **GitHub Pages no lo utiliza**. Para conservar parte de la política de seguridad se han añadido `Content-Security-Policy` y `referrer` en etiquetas HTML compatibles. No equivalen a todas las cabeceras HTTP originales.
- Sin conexión a Apple Health y sin sincronización automática entre dispositivos.
- El modo offline necesita una carga inicial en línea y debe probarse en el iPhone real. No se ha verificado un despliegue real desde aquí.

## Ficheros de la app

- `index.html`: punto de entrada
- `app.js`: interfaz y persistencia local
- `styles.css`: estilos
- `sw.js`: caché offline y control de actualizaciones
- `manifest.webmanifest`: instalación de la PWA
- `icon-192.png`, `icon-1024.png`, `apple-touch-icon.png`: iconos
- `.nojekyll`: evita procesamiento Jekyll de Github Pages

**No se ha publicado nada en tu cuenta de GitHub.**
