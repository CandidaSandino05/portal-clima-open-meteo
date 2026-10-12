# Portal del Clima

Portal web que consume la API pública de Open-Meteo para mostrar el clima actual y el pronóstico de 5 días de cualquier ciudad. Proyecto de la asignatura **Diseño de Sistemas en Internet** (UNI).

## API utilizada

- **Geocoding API** (`https://geocoding-api.open-meteo.com/v1/search`): convierte el nombre de una ciudad en coordenadas.
- **Weather Forecast API** (`https://api.open-meteo.com/v1/forecast`): devuelve el clima actual y el pronóstico diario.

No requiere clave. Documentación: https://open-meteo.com/en/docs

Datos del clima por [Open-Meteo.com](https://open-meteo.com/) (licencia CC BY 4.0).

## Cómo funciona

1. El usuario escribe una ciudad y pulsa **Buscar**.
2. `buscarCiudad()` usa `fetch` con Promesas (`.then` / `.catch`) para obtener la latitud y la longitud.
3. `obtenerPronostico()` usa `fetch` con `async/await` y `try/catch` para pedir el clima con esas coordenadas.
4. `mostrarClima()` construye las tarjetas con JavaScript a partir del JSON recibido.

Se manejan tres casos de error: respuesta HTTP fallida, ciudad no encontrada y falta de conexión.

## Estructura del proyecto

```
portal-clima/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── app.js
└── README.md
```

## Cómo ejecutarlo

Abre `index.html` en un navegador con conexión a internet.

## Autora

Candida Carolina Sandino Gaitán, estudiante de Ingeniería de Sistemas, UNI.
