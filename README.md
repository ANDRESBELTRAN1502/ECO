# ECO · Identificador visual de residuos

Aplicación web para reconocer residuos con una red neuronal convolucional (CNN) y mostrar en qué caneca deben depositarse, según el código de colores de Colombia (Resolución 2184 de 2019). El modelo se entrenó con 15.493 imágenes y distingue 12 tipos de residuo. La cámara y el análisis de imágenes funcionan en el navegador; las fotos no se envían al servidor.

## Ejecutar en el computador

Necesitas Python 3.10 o superior.

```bash
python -m venv .venv
```

Activa el entorno e instala las dependencias:

```bash
# Windows
.venv\Scripts\activate
pip install -r requirements.txt

# macOS o Linux
source .venv/bin/activate
pip install -r requirements.txt
```

Inicia Flask:

```bash
python app.py
```

Abre <http://127.0.0.1:5000>. Para usar la cámara en producción, el sitio debe publicarse con HTTPS.

## Publicar

El archivo `render.yaml` configura el despliegue de Flask en Render. En Render, crea un **Blueprint** y conecta el repositorio de GitHub; Render leerá la configuración, instalará las dependencias e iniciará la aplicación. Los siguientes comandos también pueden configurarse manualmente:

- **Build command:** `pip install -r requirements.txt`
- **Start command:** `gunicorn app:app`

GitHub Pages solo publica sitios estáticos y no ejecuta `app.py`; se necesita un servicio de alojamiento para Flask.

## Guardar y publicar modelos entrenados

Guarda cada modelo exportado por la sección 12 del cuaderno en una subcarpeta distinta de `modelos_entrenados/`, junto con sus archivos `eco_web.json` y `eco_web_pesos.bin`. Para activar uno, copia esos dos archivos a `modelo/` reemplazando la versión actual y súbelos a la rama `main`; Render volverá a desplegar la aplicación con el modelo nuevo.

## Estructura

```text
app.py
index.html                 # Versión estática independiente
modelo/
  eco_web_modelo.js        # Modelo incluido por la versión estática
  eco_web.json
  eco_web_pesos.bin
modelos_entrenados/        # Copias de modelos entrenados por versión
templates/
  primera_pagina/       # Detector
  como_se_hace/         # Explicación del proyecto
  sitio.html             # Diseño compartido
static/
  css/estilos.css
  img/fondo.jpg
  js/app.js
requirements.txt
```

La aplicación Flask sirve el modelo desde `modelo/`; así se mantiene una sola copia de los pesos.
