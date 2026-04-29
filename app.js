// DOM Elements
const navBtns = document.querySelectorAll('.nav-btn');
const screens = document.querySelectorAll('.screen');

const formReg = document.getElementById('form-registration');
const inputTipo = document.getElementById('tipo_entrada');
const btnTypes = document.querySelectorAll('.btn-type');
const inputValor = document.getElementById('valor');
const inputNombre = document.getElementById('nombre');

const counterTotal = document.getElementById('total_acumulado');
const counterAsist = document.getElementById('total_asistentes');
const listaAsistentes = document.getElementById('lista-asistentes');
const monthlyContainer = document.getElementById('monthly-stats-container');

// Lock Screen Elements
const screenLock = document.getElementById('screen-lock');
const btnKeys = document.querySelectorAll('.btn-key');
const pinAsterisks = document.getElementById('pin-asterisks');

// Security Configurations
const PIN_CORRECTO = "1712"; // Define el PIN por defecto aquí. ¡Puedes cambiarlo en cualquier momento!
let currentPin = "";

// Pricing Logic
const PRICING = {
  '2x1': 4000,
  'Preventa': 4000,
  'General': 5000
};

// State
let eventos = JSON.parse(localStorage.getItem('eventos')) || [];
let asistentes = JSON.parse(localStorage.getItem('asistentes')) || [];
let eventoActual = null;

// Initialization
function init() {
  verificarSeguridad();
  crearODarEventoDiario();
  actualizarUI();
}

// Security Logic
function verificarSeguridad() {
  const isUnlocked = sessionStorage.getItem('appUnlocked') === 'true';
  const appContent = document.getElementById('app-content');
  if (isUnlocked) {
    screenLock.style.display = 'none';
    if (appContent) appContent.style.display = 'block';
  } else {
    screenLock.style.display = 'flex';
    if (appContent) appContent.style.display = 'none';
  }
}

btnKeys.forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.getAttribute('data-key');

    if (key === 'clear') {
      currentPin = "";
      actualizarDots();
      return;
    }
    
    if (key === 'ok') {
       if(currentPin.length === 4) {
           validarPin();
       } else {
           alert('Ingresa 4 dígitos primero.');
       }
       return;
    }

    if (currentPin.length < 4) {
      currentPin += key;
      actualizarDots();
    }

    if (currentPin.length === 4) {
      setTimeout(() => {
        validarPin();
      }, 100);
    }
  });
});

function validarPin() {
    if (currentPin === PIN_CORRECTO) {
      sessionStorage.setItem('appUnlocked', 'true');
      screenLock.style.display = 'none';
      const appContent = document.getElementById('app-content');
      if (appContent) appContent.style.display = 'block';
      currentPin = ""; // Reset internal for safety
    } else {
      alert('Acceso Denegado');
      currentPin = "";
      actualizarDots();
    }
}

function actualizarDots() {
  if (pinAsterisks) {
    pinAsterisks.innerText = '*'.repeat(currentPin.length);
  }
}

function formatearMoneda(valor) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valor);
}

function crearODarEventoDiario() {
  const hoyStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  eventoActual = eventos.find(e => e.fecha === hoyStr);
  if (!eventoActual) {
    eventoActual = {
      id: Date.now().toString(),
      nombre_evento: 'Evento ' + hoyStr,
      fecha: hoyStr,
      total_recaudado: 0
    };
    eventos.push(eventoActual);
    guardarDb();
  }
}

function guardarDb() {
  localStorage.setItem('eventos', JSON.stringify(eventos));
  localStorage.setItem('asistentes', JSON.stringify(asistentes));
}

// Navigation
navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // UI update
    navBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Changing screens
    const target = btn.getAttribute('data-target');
    screens.forEach(s => {
      if (s.id === target) {
        s.classList.add('active');
        s.classList.remove('hidden');
      } else {
        s.classList.remove('active');
        s.classList.add('hidden');
      }
    });

    // Specific triggers
    if (target === 'screen-active-event') renderActiveEvent();
    if (target === 'screen-report') renderMonthlyReport();
  });
});

// Reacting to selects
btnTypes.forEach(btn => {
  btn.addEventListener('click', () => {
    btnTypes.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    const tipo = btn.getAttribute('data-value');
    inputTipo.value = tipo;
    const price = PRICING[tipo] || 0;
    inputValor.value = formatearMoneda(price);
  });
});

// Handling form submission
formReg.addEventListener('submit', (e) => {
  e.preventDefault();

  const tipo = inputTipo.value || '';
  const price = PRICING[tipo] || 0;
  const nombre_persona = inputNombre.value.trim() || '';
  const evento_nombre = (eventoActual && eventoActual.nombre_evento) ? eventoActual.nombre_evento : '';

  if (!nombre_persona || !tipo || price <= 0 || !evento_nombre) {
    alert('Faltan campos por completar o hay un error con el evento.');
    return;
  }

  // Create asistent
  const nuevoAsistente = {
    id: Date.now().toString(),
    fecha: new Date().toLocaleString('es-CL').replace(/,/g, '') || '',
    evento: evento_nombre || '',
    nombre_persona: nombre_persona || '',
    tipo_entrada: tipo || '',
    monto: price || 0
  };

  asistentes.push(nuevoAsistente);

  // Update event
  eventoActual.total_recaudado += price;

  // Update events array reference (though objects are by reference, better safe)
  const evIndex = eventos.findIndex(e => e.id === eventoActual.id);
  if (evIndex > -1) eventos[evIndex] = eventoActual;

  guardarDb();

  // Reset form
  formReg.reset();
  inputTipo.value = '';
  btnTypes.forEach(b => b.classList.remove('selected'));
  inputValor.value = '$0';

  // Feedback

  // Provide subtle animation or alert
  const btn = formReg.querySelector('button');
  const oldText = btn.innerText;
  btn.innerText = '¡Registrado!';
  btn.style.backgroundColor = 'var(--success-color)';

  setTimeout(() => {
    btn.innerText = oldText;
    btn.style.backgroundColor = '';
  }, 1000);
});

// Rendering Active Event list
function renderActiveEvent() {
  const asistentesHoy = asistentes.filter(a => a.evento === eventoActual.nombre_evento)
    .sort((a, b) => b.id - a.id);

  counterTotal.innerText = formatearMoneda(eventoActual.total_recaudado);
  counterAsist.innerText = `${asistentesHoy.length} asistentes hoy`;

  listaAsistentes.innerHTML = asistentesHoy.map(asist => `
    <li class="attendee-item">
      <div class="attendee-info">
        <h4>${asist.nombre_persona}</h4>
        <span class="attendee-badge">${asist.tipo_entrada}</span>
      </div>
      <div class="attendee-price">
        ${formatearMoneda(asist.monto)}
      </div>
    </li>
  `).join('');
}

// Rendering Monthly Report
function renderMonthlyReport() {
  const agrupadoPorMes = {};

  eventos.forEach(ev => {
    // Extract YYYY-MM
    const mes = ev.fecha.substring(0, 7);
    if (!agrupadoPorMes[mes]) {
      agrupadoPorMes[mes] = {
        total_recaudado: 0,
        total_asistentes: 0
      };
    }
    agrupadoPorMes[mes].total_recaudado += ev.total_recaudado;
    agrupadoPorMes[mes].total_asistentes += asistentes.filter(a => a.evento === ev.nombre_evento).length;
  });

  const HTML = Object.keys(agrupadoPorMes).sort().reverse().map(mesText => {
    const data = agrupadoPorMes[mesText];

    // Format Month
    const dateObj = new Date(mesText + "-02"); // To avoid timezone issues
    const displayMonth = dateObj.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });

    return `
      <div class="report-card">
        <div class="report-header">
          <div class="report-month" style="text-transform: capitalize;">${displayMonth}</div>
        </div>
        <div class="report-details">
          <div style="color: var(--text-secondary)">${data.total_asistentes} Asistentes</div>
          <div class="report-total">${formatearMoneda(data.total_recaudado)}</div>
        </div>
      </div>
    `;
  }).join('');

  if (Object.keys(agrupadoPorMes).length === 0) {
    monthlyContainer.innerHTML = '<p style="text-align:center; color: var(--text-secondary);">No hay datos mensuales.</p>';
  } else {
    monthlyContainer.innerHTML = HTML;
  }
}

// CSV Export Logic
document.getElementById('btn-export-csv').addEventListener('click', () => {
  if (asistentes.length === 0) {
    alert('No hay datos de asistentes registrados para exportar.');
    return;
  }

  const headers = ['Fecha', 'Evento', 'Persona', 'Tipo', 'Monto'];
  const rows = asistentes.map(a => [
    a.fecha || '',
    `"${a.evento || ''}"`,
    `"${a.nombre_persona || ''}"`,
    a.tipo_entrada || '',
    a.monto || 0
  ]);

  const csvContent = ['sep=,', headers.join(',')]
    .concat(rows.map(row => row.join(',')))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'Reporte_Ganancias_Eventos.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// CSV Import Logic
document.getElementById('input-import-csv').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const confirmacion = confirm("¿Estás seguro de que deseas reemplazar la base de datos actual con este respaldo? Los datos actuales se perderán si no los has exportado.");
  if (!confirmacion) {
    e.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = (eventoLectura) => {
    const text = eventoLectura.target.result;
    const lines = text.split('\n').filter(l => l.trim() !== '');
    if (lines.length < 2) {
      alert("El archivo CSV no tiene datos válidos.");
      return;
    }

    const nuevosAsistentes = [];

    // Parse Rows (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const parts = [];
      let inQuotes = false;
      let currentStr = '';

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          parts.push(currentStr.trim());
          currentStr = '';
        } else {
          currentStr += char;
        }
      }
      parts.push(currentStr.trim());

      if (parts.length >= 5) {
        nuevosAsistentes.push({
          id: Date.now().toString() + Math.random().toString().substring(2, 6),
          fecha: parts[0],
          evento: parts[1],
          nombre_persona: parts[2],
          tipo_entrada: parts[3],
          monto: Number(parts[4]) || 0
        });
      }
    }

    // Reconstruct Eventos
    const mapEventos = {};
    for (const a of nuevosAsistentes) {
      if (!mapEventos[a.evento]) {
        mapEventos[a.evento] = {
          id: Date.now().toString() + Math.random().toString().substring(2, 8),
          nombre_evento: a.evento,
          fecha: a.fecha.substring(0, 10),
          total_recaudado: 0
        };
      }
      mapEventos[a.evento].total_recaudado += a.monto;
    }

    // Overwrite State
    asistentes = nuevosAsistentes;
    eventos = Object.values(mapEventos);
    guardarDb();
    crearODarEventoDiario();

    // Refresh UIs
    renderActiveEvent();
    renderMonthlyReport();

    alert("¡Respaldo importado exitosamente!");
    e.target.value = '';
  };

  reader.readAsText(file);
});

// Start
init();
