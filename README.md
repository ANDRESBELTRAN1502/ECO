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

Sube el proyecto a GitHub y conecta el repositorio a un servicio que ejecute aplicaciones Flask, como Render. Configura:

- **Build command:** `pip install -r requirements.txt`
- **Start command:** `gunicorn app:app`

GitHub Pages solo publica sitios estáticos y no ejecuta `app.py`; se necesita un servicio de alojamiento para Flask.

## Estructura

```text
app.py
index.html                 # Versión estática independiente
modelo/
  eco_web_modelo.js        # Modelo incluido por la versión estática
  eco_web.json
  eco_web_pesos.bin
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
