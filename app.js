// Portal del Clima
// Consume dos servicios públicos de Open-Meteo con fetch():
//   1. Geocodificación: convierte el nombre de una ciudad en coordenadas.
//   2. Pronóstico: devuelve el clima actual y los próximos días para esas coordenadas.

const URL_GEOCODIFICACION = 'https://geocoding-api.open-meteo.com/v1/search';
const URL_PRONOSTICO = 'https://api.open-meteo.com/v1/forecast';

// La API devuelve el clima como un código numérico (estándar WMO).
// Este objeto lo traduce a una descripción en español y un ícono.
const CODIGOS_CLIMA = {
  0: ['Cielo despejado', '☀️'],
  1: ['Mayormente despejado', '🌤️'],
  2: ['Parcialmente nublado', '⛅'],
  3: ['Nublado', '☁️'],
  45: ['Niebla', '🌫️'],
  48: ['Niebla con escarcha', '🌫️'],
  51: ['Llovizna ligera', '🌦️'],
  53: ['Llovizna moderada', '🌦️'],
  55: ['Llovizna densa', '🌦️'],
  56: ['Llovizna helada ligera', '🌧️'],
  57: ['Llovizna helada densa', '🌧️'],
  61: ['Lluvia ligera', '🌧️'],
  63: ['Lluvia moderada', '🌧️'],
  65: ['Lluvia fuerte', '🌧️'],
  66: ['Lluvia helada ligera', '🌧️'],
  67: ['Lluvia helada fuerte', '🌧️'],
  71: ['Nevada ligera', '🌨️'],
  73: ['Nevada moderada', '🌨️'],
  75: ['Nevada fuerte', '❄️'],
  77: ['Granos de nieve', '❄️'],
  80: ['Chubascos ligeros', '🌦️'],
  81: ['Chubascos moderados', '🌧️'],
  82: ['Chubascos violentos', '⛈️'],
  85: ['Chubascos de nieve ligeros', '🌨️'],
  86: ['Chubascos de nieve fuertes', '🌨️'],
  95: ['Tormenta eléctrica', '⛈️'],
  96: ['Tormenta con granizo ligero', '⛈️'],
  97: ['Tormenta fuerte', '⛈️'],
  99: ['Tormenta con granizo fuerte', '⛈️']
};

// Elementos de la página con los que trabaja el script
const formulario = document.getElementById('form-busqueda');
const campoCiudad = document.getElementById('ciudad');
const estado = document.getElementById('estado');
const resultado = document.getElementById('resultado');

// ---------------------------------------------------------------
// Consumo de la API
// ---------------------------------------------------------------

// Versión con Promesas (.then / .catch): busca las coordenadas de una ciudad.
function buscarCiudad(nombre) {
  const url = `${URL_GEOCODIFICACION}?name=${encodeURIComponent(nombre)}&count=1&language=es&format=json`;

  return fetch(url)
    .then(respuesta => {
      // respuesta.ok es falso si el servidor contestó con un error HTTP (400, 500, etc.)
      if (!respuesta.ok) {
        throw new Error(`Error HTTP: ${respuesta.status}`);
      }
      return respuesta.json();
    })
    .then(datos => {
      // Si no hay coincidencias, la API no incluye la lista "results"
      if (!datos.results || datos.results.length === 0) {
        throw new Error(`No se encontró la ciudad "${nombre}".`);
      }
      return datos.results[0];
    })
    .catch(error => {
      // Un TypeError de fetch significa que la petición no pudo salir (sin internet)
      if (error instanceof TypeError) {
        throw new Error('No hay conexión con el servicio. Revisa tu internet.');
      }
      throw error;
    });
}

// Versión con async / await: obtiene el clima actual y el pronóstico de 5 días.
async function obtenerPronostico(latitud, longitud) {
  const variablesActuales = 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m';
  const variablesDiarias = 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max';
  const url = `${URL_PRONOSTICO}?latitude=${latitud}&longitude=${longitud}`
    + `&current=${variablesActuales}&daily=${variablesDiarias}&timezone=auto&forecast_days=5`;

  try {
    const respuesta = await fetch(url);

    if (!respuesta.ok) {
      throw new Error(`Error HTTP: ${respuesta.status}`);
    }

    return await respuesta.json();
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('No hay conexión con el servicio. Revisa tu internet.');
    }
    throw error;
  }
}

// Flujo completo: ciudad -> coordenadas -> pronóstico -> pantalla
async function consultarClima(nombreCiudad) {
  mostrarEstado('Buscando...');
  resultado.replaceChildren();

  try {
    const lugar = await buscarCiudad(nombreCiudad);
    const pronostico = await obtenerPronostico(lugar.latitude, lugar.longitude);

    mostrarClima(lugar, pronostico);
    mostrarEstado('');
  } catch (error) {
    mostrarEstado(error.message, true);
  }
}

// ---------------------------------------------------------------
// Dibujo de los resultados
// ---------------------------------------------------------------

function mostrarEstado(mensaje, esError = false) {
  estado.textContent = mensaje;
  estado.classList.toggle('error', esError);
}

// Crea un elemento HTML con clase y texto. Se usa textContent (y no innerHTML)
// para que los datos que vienen de la API se muestren siempre como texto.
function crearElemento(etiqueta, clase, texto) {
  const elemento = document.createElement(etiqueta);
  if (clase) {
    elemento.className = clase;
  }
  if (texto !== undefined) {
    elemento.textContent = texto;
  }
  return elemento;
}

function describirClima(codigo) {
  return CODIGOS_CLIMA[codigo] || ['Condición desconocida', '❔'];
}

function formatearFecha(fechaISO) {
  // Se agrega una hora al mediodía para que el navegador no la interprete en UTC
  // y muestre el día anterior.
  const fecha = new Date(`${fechaISO}T12:00:00`);
  return fecha.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' });
}

function mostrarClima(lugar, datos) {
  const actual = datos.current;
  const unidades = datos.current_units;
  const [descripcion, icono] = describirClima(actual.weather_code);
  const nombreLugar = [lugar.name, lugar.admin1, lugar.country].filter(Boolean).join(', ');

  // Tarjeta del clima actual
  const tarjetaActual = crearElemento('article', 'tarjeta-actual');
  tarjetaActual.append(
    crearElemento('h2', 'lugar', nombreLugar),
    crearElemento('p', 'icono-grande', icono),
    crearElemento('p', 'temperatura', `${Math.round(actual.temperature_2m)}${unidades.temperature_2m}`),
    crearElemento('p', 'descripcion', descripcion)
  );

  const detalles = crearElemento('ul', 'detalles');
  const datosActuales = [
    ['Sensación térmica', `${Math.round(actual.apparent_temperature)}${unidades.apparent_temperature}`],
    ['Humedad', `${actual.relative_humidity_2m}${unidades.relative_humidity_2m}`],
    ['Viento', `${actual.wind_speed_10m} ${unidades.wind_speed_10m}`]
  ];
  datosActuales.forEach(([etiqueta, valor]) => {
    const item = crearElemento('li');
    item.append(crearElemento('span', 'etiqueta', etiqueta), crearElemento('strong', '', valor));
    detalles.append(item);
  });
  tarjetaActual.append(detalles);

  // Tarjetas del pronóstico: una por día
  const diario = datos.daily;
  const contenedorDias = crearElemento('div', 'dias');

  diario.time.forEach((fecha, i) => {
    const [descDia, icoDia] = describirClima(diario.weather_code[i]);
    const probabilidad = diario.precipitation_probability_max[i];
    const textoLluvia = (probabilidad === null || probabilidad === undefined)
      ? 'Lluvia: sin dato'
      : `Lluvia: ${probabilidad}%`;

    const dia = crearElemento('article', 'dia');
    dia.append(
      crearElemento('h3', '', formatearFecha(fecha)),
      crearElemento('p', 'icono', icoDia),
      crearElemento('p', 'desc-dia', descDia),
      crearElemento('p', 'rango', `${Math.round(diario.temperature_2m_max[i])}° / ${Math.round(diario.temperature_2m_min[i])}°`),
      crearElemento('p', 'lluvia', textoLluvia)
    );
    contenedorDias.append(dia);
  });

  resultado.replaceChildren(
    tarjetaActual,
    crearElemento('h2', 'titulo-seccion', 'Pronóstico de 5 días'),
    contenedorDias
  );
}

// ---------------------------------------------------------------
// Eventos
// ---------------------------------------------------------------

formulario.addEventListener('submit', evento => {
  evento.preventDefault();
  const ciudad = campoCiudad.value.trim();
  if (ciudad) {
    consultarClima(ciudad);
  }
});

// Al abrir la página se muestra una ciudad por defecto
campoCiudad.value = 'Managua';
consultarClima('Managua');