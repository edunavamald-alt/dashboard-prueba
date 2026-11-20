/* ==========================================================================
   1. ESTADO GLOBAL Y CONFIGURACIÓN
   ========================================================================== */

let usuarioActual = { nombre: "", codigoE: "" };
let listaGestiones = [];
let plantillaPendiente = null;
let fechaToaPorDefecto = "";
let franjaToaPorDefecto = "AM1";

// Variables extraídas de TOA
let planoExtraido = "S/N";
let subTipoExtraido = "S/N";
let codClienteExtraido = "S/N";
let direccionExtraida = "S/N";
let distritoExtraido = "S/N";

/* ==========================================================================
   CONFIGURACIÓN CORREGIDA DE RECHAZOS (8 CATEGORÍAS)
   ========================================================================== */

const SUBMOTIVOS_RECHAZO = {
  RECH_NO_DESEA: [
    "Cliente indica tener problemas económicos",
    "Cuenta con servicio de otro operador",
    "Demora en atención, no desea esperar",
    "Incumplimiento de fecha pactada",
    "Motivos personales, no da razones",
    "Mudanza o viaje",
    "No desea recibir a personal técnico",
    "No está de acuerdo con pago",
    "No ha contratado ningún servicio",
    "Requiere cambio de titularidad",
    "Solicitó otra fecha de instalación en la venta",
    "Técnico indujo al rechazo por mala información",
    "Tiene propuesta de otro operador"
  ],
  RECH_DUPLICIDAD: [
    "Doble SOT de diferentes puntos de venta",
    "Doble SOT del mismo punto de venta",
    "Se atendió con otra SOT",
    "Se rechazó con otra SOT"
  ],
  RECH_FACILIDADES: [
    "Ductos obstruidos",
    "Dueño de casa o edificio no autoriza instalación",
    "Sin acceso al techo, montantes u otros ambientes"
  ],
  RECH_CONTACTO: [
    "Numero equivocado, no existe o no responde"
  ],
  RECH_DIRECCION: [
    "Direccion incorrecta"
  ],
  RECH_OFERTA: [
    "Cliente solicito PostVenta (Adicionales, traslado)",
    "Equipo no autorizado para venta",
    "Paquete no es lo solicitado por el Cliente",
    "Solicita instalación compartida para 2 direcciones",
    "Tecnología incorrecta",
    "Tecnología incorrecta, cliente no acepta FTTH",
    "Tecnología incorrecta, cliente no acepta HFC",
    "Tecnología incorrecta, se genera SOT de reemplazo",
    "Velocidad supera capacidad de plano"
  ],
  RECH_SISTEMA: [
    "Campaña mal configurada, etiquetas incorrectas Duplicidad de números o etiquetas",
    "Mal generada, no genera reservas",
    "Nombre del Cliente con errores NN NN NN",
    "Sin workflow, sin tareas generadas",
    "SOT sin customer, plano, Co_id"
  ],
  RECH_FRAUDE: [
    "Cliente ya tiene un servicio activo en la misma dirección"
  ]
};

const CATEGORIAS_CONFIG = {
  CONFIRMA: [
    { id: 'CONF_LLAMADA', nombre: 'Confirma visita en llamada' },
    { id: 'CONF_ADELANTO', nombre: 'Adelanto de visita' },
    { id: 'CONF_MANTIENE', nombre: 'Mantiene fecha programada' }
  ],
  CICLO: [
    { id: 'CICLO_CONTACTO', nombre: 'Ciclo de llamadas (Falta de contacto)' }
  ],
  REPROGRAMAR: [
    { id: 'REPRO_CLIENTE', nombre: 'Reprogramado por Cliente' },
    { id: 'REPRO_CLARO', nombre: 'Reprogramado por Claro' }
  ],
  RECHAZOS: [
    { id: 'RECH_NO_DESEA', nombre: 'Cliente no desea servicio' },
    { id: 'RECH_DUPLICIDAD', nombre: 'Por duplicidad - Mesa' },
    { id: 'RECH_FACILIDADES', nombre: 'Por facilidades técnicas del cliente - Mesa' },
    { id: 'RECH_CONTACTO', nombre: 'Por falta de contacto - Mesa' },
    { id: 'RECH_DIRECCION', nombre: 'Por mal ingreso de dirección - Mesa' },
    { id: 'RECH_OFERTA', nombre: 'Por mala oferta - Mesa' },
    { id: 'RECH_SISTEMA', nombre: 'Por SOT con errores de Sistema - Mesa' },
    { id: 'RECH_FRAUDE', nombre: 'Por posible fraude - Mesa' }
  ],
  FUERA_TOA: [
    { id: 'FTOA_GENERAL', nombre: 'Plantilla Fuera de TOA' }
  ]
};

/* ==========================================================================
   2. INICIALIZACIÓN Y EVENTOS DOM
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function() {
  cargarSesionGuardada();
  inicializarTema();

  const btnIngresar = document.getElementById('btnIngresarLogin');
  if (btnIngresar) {
    btnIngresar.addEventListener('click', function(e) {
      e.preventDefault();
      iniciarSesion();
    });
  }

  const inputE = document.getElementById('inputUsuarioE');
  if (inputE) {
    inputE.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        iniciarSesion();
      }
    });
  }

  document.getElementById('btnToggleTheme')?.addEventListener('click', function() {
    const temaActual = document.documentElement.getAttribute('data-theme');
    const nuevoTema = temaActual === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nuevoTema);
    localStorage.setItem('themeADP', nuevoTema);
    actualizarBotonTema(nuevoTema);
  });

  document.getElementById('btnCerrarSesion')?.addEventListener('click', cerrarSesion);
  document.getElementById('btnProcesarTOA')?.addEventListener('click', procesarTextoTOA);
  document.getElementById('btnLimpiarCol1y2')?.addEventListener('click', limpiarColumnas1y2);
  document.getElementById('selectCategoria')?.addEventListener('change', actualizarSubcategorias);
  document.getElementById('selectSubcategoria')?.addEventListener('change', renderizarCamposDinamicos);
  document.getElementById('btnGenerarPlantilla')?.addEventListener('click', generarPlantilla);
  document.getElementById('btnCopiarPlantilla')?.addEventListener('click', copiarPlantilla);
  document.getElementById('btnGuardarBloc')?.addEventListener('click', intentarGuardarEnBloc);
  document.getElementById('btnExportarBloc')?.addEventListener('click', exportarBloc);

  document.getElementById('btnConfirmarDuplicado')?.addEventListener('click', confirmarAgregarDuplicado);
  document.getElementById('btnCancelarDuplicado')?.addEventListener('click', cancelarAgregarDuplicado);

  document.getElementById('btnGenerarHabilitar')?.addEventListener('click', function() {
    actualizarFormatoHabilitarFranja();
    mostrarToast("✅ Formato Habilitar Franja generado");
  });

  document.getElementById('btnCopiarHabilitar')?.addEventListener('click', function() {
    const area = document.getElementById('outputHabilitarFranja');
    if (!area || !area.value.trim()) {
      mostrarToast("⚠️ Genera un formato primero", "#dc3545");
      return;
    }

    const textoLimpio = area.value.replace(/\r?\n/g, "\r\n");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textoLimpio);
    }
    mostrarToast("📋 Formato Habilitar Franja copiado");
  });

  document.getElementById('inputSupCargo')?.addEventListener('input', actualizarFormatoHabilitarFranja);

  // Eventos del Dashboard
  const btnVista = document.getElementById('btnToggleVista');
  const genContainer = document.querySelector('.container');
  const dashContainer = document.getElementById('dashboardContainer');

  btnVista?.addEventListener('click', () => {
    const viendoDash = dashContainer.style.display === 'block';
    dashContainer.style.display = viendoDash ? 'none' : 'block';
    genContainer.style.display = viendoDash ? 'grid' : 'none';
    btnVista.innerText = viendoDash ? '📊 Ver Dashboard' : '🛠️ Volver al Generador';

    if (!viendoDash && datosExcelRaw.length === 0) {
      cargarExcelAutomatico();
    }
  });

  document.getElementById('btnRefrescarDB')?.addEventListener('click', cargarExcelAutomatico);

  ['filtroSemana', 'filtroDia', 'filtroSubarea', 'filtroFranja', 'filtroAsesor'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', actualizarDashboard);
  });

  actualizarSubcategorias();
  actualizarContadorGestiones();
});

/* ==========================================================================
   3. GESTIÓN DE SESIÓN Y TEMA
   ========================================================================== */

function iniciarSesion() {
  const inputNombre = document.getElementById('inputNombreADP');
  const inputE = document.getElementById('inputUsuarioE');

  if (!inputNombre || !inputE) return;

  const nombre = inputNombre.value.trim();
  const codigoE = inputE.value.trim().toUpperCase();
  const regexE = /^E\d{6}$/;

  if (!nombre) {
    mostrarToast("⚠️ Por favor, ingresa tu nombre completo", "#dc3545");
    return;
  }
  if (!regexE.test(codigoE)) {
    mostrarToast("⚠️ El código debe empezar con 'E' seguido de 6 números (Ej: E750344)", "#dc3545");
    return;
  }

  usuarioActual = { nombre, codigoE };
  localStorage.setItem('adpNombre', nombre);
  localStorage.setItem('adpCodigoE', codigoE);

  const labelUser = document.getElementById('labelUsuario');
  if (labelUser) labelUser.innerText = `ADP: ${usuarioActual.nombre} (${usuarioActual.codigoE})`;

  const modalLogin = document.getElementById('loginModal');
  if (modalLogin) modalLogin.style.display = 'none';

  mostrarToast(`👋 ¡Bienvenido/a, ${nombre}!`);
}

function cargarSesionGuardada() {
  const n = localStorage.getItem('adpNombre');
  const e = localStorage.getItem('adpCodigoE');

  if (n && e) {
    usuarioActual = { nombre: n, codigoE: e };
    const inputNombre = document.getElementById('inputNombreADP');
    const inputE = document.getElementById('inputUsuarioE');
    if (inputNombre) inputNombre.value = n;
    if (inputE) inputE.value = e;

    const labelUser = document.getElementById('labelUsuario');
    if (labelUser) labelUser.innerText = `ADP: ${n} (${e})`;

    const modalLogin = document.getElementById('loginModal');
    if (modalLogin) modalLogin.style.display = 'none';
  } else {
    const modalLogin = document.getElementById('loginModal');
    if (modalLogin) modalLogin.style.display = 'flex';
  }
}

function cerrarSesion() {
  localStorage.removeItem('adpNombre');
  localStorage.removeItem('adpCodigoE');
  
  const labelUser = document.getElementById('labelUsuario');
  if (labelUser) labelUser.innerText = "ADP: No conectado";

  const modalLogin = document.getElementById('loginModal');
  if (modalLogin) modalLogin.style.display = 'flex';
}

function inicializarTema() {
  const temaGuardado = localStorage.getItem('themeADP') || 'light';
  document.documentElement.setAttribute('data-theme', temaGuardado);
  actualizarBotonTema(temaGuardado);
}

function actualizarBotonTema(tema) {
  const icon = document.getElementById('themeIcon');
  const text = document.getElementById('themeText');
  
  if (icon && text) {
    if (tema === 'dark') {
      text.innerText = 'Claro';
    } else {
      text.innerText = 'Oscuro';
    }
  }
}

/* ==========================================================================
   4. PROCESADOR DE TEXTO TOA (EXTRACCIÓN DE DATOS)
   ========================================================================== */

function procesarTextoTOA() {
  const text = document.getElementById('rawInput').value;

  if (!text.trim()) {
    mostrarToast("⚠️ Pega el texto extraído de TOA", "#dc3545");
    return;
  }

  const sotMatch = text.match(/(?:SOT|sot|Nro SOT|N° SOT|Orden)\s*[:\t\r\n]*\s*(\d+)/i) || text.match(/\b\d{8,9}\b/);
  const telMatch = text.match(/(?:Telefono|Telefono\s*Cliente|Contacto|Movil|Celular|Telefonos)\s*[:\t\r\n]*\s*(\d{7,9})/i) || text.match(/\b9\d{8}\b/);

  let cliente = "S/N";
  const clienteMatch = text.match(/Nombre\s*[:\t\r\n]+\s*([\s\S]*?)(?=\s*Tipo\s*de\s*Documento)/i);
  if (clienteMatch && clienteMatch[1]) {
    cliente = clienteMatch[1].replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
  } else {
    const clienteFallback = text.match(/(?:CLIENTE|Abonado|Cliente)\s*[:\t\r\n]*\s*([A-ZÁÉÍÓÚÑa-zñáéíóú\s.,]+)(?=\r|\n|$)/i);
    if (clienteFallback && clienteFallback[1]) {
      cliente = clienteFallback[1].trim();
    }
  }

  if (/^(CLIENTE|NOMBRE|ABONADO|S\/N)$/i.test(cliente)) cliente = "S/N";

  let contrata = "SAVAL";
  const contrataDirectaMatch = text.match(/\b(?:INST|MANT|REVI|MANTENIMIENTO)\s+([A-Z0-9]+)/i);
  if (contrataDirectaMatch && contrataDirectaMatch[1]) {
    contrata = contrataDirectaMatch[1].toUpperCase().trim();
  } else {
    const detallesMatch = text.match(/Detalles?\s+de\s+actividad[\s\S]*?\n\s*([A-Z0-9]+)/i);
    if (detallesMatch && detallesMatch[1] && !/^(DETALLES|DATOS|VELASQUEZ|ORACLE)$/i.test(detallesMatch[1])) {
      contrata = detallesMatch[1].toUpperCase().trim();
    }
  }

  const fechaMatch = text.match(/(?:Fecha\s*de\s*Programacion|Fecha)\s*[:\t\r\n]*\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i) || text.match(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/);
  if (fechaMatch && fechaMatch[1]) {
    const partes = fechaMatch[1].split('/');
    if (partes.length === 3) {
      let dia = partes[0].padStart(2, '0');
      let mes = partes[1].padStart(2, '0');
      let anio = partes[2].length === 2 ? `20${partes[2]}` : partes[2];
      fechaToaPorDefecto = `${anio}-${mes}-${dia}`;
    }
  } else {
    fechaToaPorDefecto = new Date().toISOString().split('T')[0];
  }

  const franjaMatch = text.match(/\b(AM0|AM1|PM1|PM2|PM3)\b/i);
  franjaToaPorDefecto = franjaMatch ? franjaMatch[1].toUpperCase() : "AM1";

  const planoMatch = text.match(/(?:Plano)\s*[:\t\r\n]*\s*([A-Z0-9-]+)/i);
  if (planoMatch) planoExtraido = planoMatch[1].trim();

  const subTipoMatch = text.match(/(?:Sub\s*Tipo\s*de\s*Orden|Subtipo)\s*[:\t\r\n]*\s*([^\r\n]+)/i);
  if (subTipoMatch) subTipoExtraido = subTipoMatch[1].trim();

  const codClienteMatch = text.match(/(?:Código\s*de\s*Cliente|Cod\s*Cliente)\s*[:\t\r\n]*\s*(\d+)/i);
  if (codClienteMatch) codClienteExtraido = codClienteMatch[1].trim();

  const dirMatch = text.match(/(?:Direccion|Dirección)\s*[:\t\r\n]*\s*([^\r\n]+)/i);
  if (dirMatch) direccionExtraida = dirMatch[1].trim();

  const distMatch = text.match(/(?:Distrito)\s*[:\t\r\n]*\s*([^\r\n]+)/i);
  if (distMatch) distritoExtraido = distMatch[1].trim();

  const sot = sotMatch ? (sotMatch[1] || sotMatch[0]) : "S/N";
  const telefono = telMatch ? (telMatch[1] || telMatch[0]) : "S/N";

  document.getElementById('pvSOT').value = sot;
  document.getElementById('pvTel').value = telefono;
  document.getElementById('pvCliente').value = cliente;
  document.getElementById('pvContrata').value = contrata;

  renderizarCamposDinamicos();
  actualizarFormatoHabilitarFranja();
  mostrarToast("✅ Datos procesados correctamente");
}

function obtenerClienteData() {
  return {
    sot: document.getElementById('pvSOT').value.trim() || "S/N",
    telefono: document.getElementById('pvTel').value.trim() || "S/N",
    cliente: document.getElementById('pvCliente').value.trim() || "S/N",
    contrata: document.getElementById('pvContrata').value.trim() || "SAVAL"
  };
}

/* ==========================================================================
   5. CONTROLES DINÁMICOS
   ========================================================================== */

function actualizarSubcategorias() {
  const cat = document.getElementById('selectCategoria').value;
  const subSelect = document.getElementById('selectSubcategoria');
  subSelect.innerHTML = '';

  if (CATEGORIAS_CONFIG[cat]) {
    CATEGORIAS_CONFIG[cat].forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = item.nombre;
      subSelect.appendChild(opt);
    });
  }

  renderizarCamposDinamicos();
}

function renderizarCamposDinamicos() {
  const subcat = document.getElementById('selectSubcategoria').value;
  const contenedor = document.getElementById('contenedorDinamico');
  contenedor.innerHTML = '';

  let html = '<div class="grid-2">';

  if (subcat.startsWith('CONF_') || subcat === 'FTOA_GENERAL') {
    html += `
      <div>
        <label class="lbl-sm">Fecha de Visita</label>
        <input type="date" id="inputFecha">
      </div>
      <div>
        <label class="lbl-sm">Franja Horaria</label>
        <select id="selectFranja">
          <option value="AM0">AM0</option>
          <option value="AM1">AM1</option>
          <option value="PM1">PM1</option>
          <option value="PM2">PM2</option>
          <option value="PM3">PM3</option>
        </select>
      </div>
      <div style="grid-column: span 2;">
        <label class="lbl-sm">ID Llamada</label>
        <input type="text" id="inputIDLlamada" placeholder="Ej: 17909701296">
      </div>
    `;
  } else if (subcat === 'CICLO_CONTACTO') {
    html += `
      <div>
        <label class="lbl-sm">Ciclo Nro</label>
        <input type="text" id="inputCiclo" value="1">
      </div>
      <div>
        <label class="lbl-sm">Cant. Llamadas</label>
        <input type="text" id="inputCantLlamadas" value="4">
      </div>
      <div>
        <label class="lbl-sm">Sub-Motivo</label>
        <select id="selectSubmotivo">
          <option value="No contesta">No contesta</option>
          <option value="Buzón de voz">Buzón de voz</option>
          <option value="Número no existe">Número no existe</option>
          <option value="Apagado">Apagado</option>
          <option value="Corta llamada">Corta llamada</option>
        </select>
      </div>
      <div>
        <label class="lbl-sm">ID Llamada</label>
        <input type="text" id="inputIDLlamada" placeholder="Ej: 17909701296">
      </div>
    `;
  } else if (subcat.startsWith('REPRO_')) {
    const esClaro = subcat === 'REPRO_CLARO';
    html += `
      <div style="grid-column: span 2;">
        <label class="lbl-sm">Motivo Reprogramación</label>
        <select id="inputMotivoDetalle">
          ${esClaro ? `
            <option value="# Pérdida de fecha de agendamiento"># Pérdida de fecha de agendamiento</option>
            <option value="Errores en la generación de la SOT">Errores en la generación de la SOT</option>
            <option value="Inconvenientes con la contratista">Inconvenientes con la contratista</option>
            <option value="Configuraciones de TOA (OFSC)">Configuraciones de TOA (OFSC)</option>
          ` : `
            <option value="# Cambios en las fechas y franjas solicitadas"># Cambios en fechas/franjas solicitadas</option>
            <option value="Facilidades del cliente">Facilidades del cliente</option>
            <option value="Falta de contacto">Falta de contacto</option>
            <option value="Ausente">Ausente</option>
          `}
        </select>
      </div>
      <div>
        <label class="lbl-sm">Nueva Fecha</label>
        <input type="date" id="inputFecha">
      </div>
      <div>
        <label class="lbl-sm">Nueva Franja</label>
        <select id="selectFranja">
          <option value="AM0">AM0</option>
          <option value="AM1">AM1</option>
          <option value="PM1">PM1</option>
          <option value="PM2">PM2</option>
          <option value="PM3">PM3</option>
        </select>
      </div>
      <div>
        <label class="lbl-sm">ID Llamada</label>
        <input type="text" id="inputIDLlamada" placeholder="Ej: 17909701296">
      </div>
      <div>
        <label class="lbl-sm">Observación</label>
        <input type="text" id="inputObs" placeholder="Observaciones adicionales...">
      </div>
    `;
  } else if (subcat.startsWith('RECH_')) {
    const clienteData = obtenerClienteData();
    const opciones = SUBMOTIVOS_RECHAZO[subcat] || [];

    if (subcat === 'RECH_DUPLICIDAD') {
      html += `
        <div>
          <label class="lbl-sm">Nro. SOT Duplicada Atendida</label>
          <input type="text" id="inputSotDuplicada" placeholder="Ej: 91501234">
        </div>
        <div>
          <label class="lbl-sm">ID Llamada</label>
          <input type="text" id="inputIDLlamada" placeholder="Ej: 17909701296">
        </div>
        <div style="grid-column: span 2;">
          <label class="lbl-sm">Submotivo de Rechazo</label>
          <select id="selectSubmotivoRechazo">
            ${opciones.map(s => `<option value="${s}">${s}</option>`).join('')}
          </select>
        </div>
      `;
    } else if (subcat === 'RECH_DIRECCION') {
      html += `
        <div>
          <label class="lbl-sm">Persona que Contesta</label>
          <input type="text" id="inputPersonaContesta" value="${clienteData.cliente}">
        </div>
        <div>
          <label class="lbl-sm">ID Llamada</label>
          <input type="text" id="inputIDLlamada" placeholder="Ej: 17909701296">
        </div>
        <div style="grid-column: span 2;">
          <label class="lbl-sm">Dirección Correcta</label>
          <input type="text" id="inputDireccionCorrecta" placeholder="Escribe la dirección correcta completa...">
        </div>
        <div style="grid-column: span 2;">
          <label class="lbl-sm">Submotivo de Rechazo</label>
          <select id="selectSubmotivoRechazo">
            ${opciones.map(s => `<option value="${s}">${s}</option>`).join('')}
          </select>
        </div>
      `;
    } else if (subcat === 'RECH_SISTEMA') {
      html += `
        <div style="grid-column: span 2;">
          <label class="lbl-sm">Submotivo de Rechazo</label>
          <select id="selectSubmotivoRechazo">
            ${opciones.map(s => `<option value="${s}">${s}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="lbl-sm">Detalle Error de Sistema</label>
          <input type="text" id="inputDetalleSistema" placeholder="Ej: Sin Co_id / Sin workflow">
        </div>
        <div>
          <label class="lbl-sm">ID Llamada</label>
          <input type="text" id="inputIDLlamada" placeholder="Ej: 17909701296">
        </div>
      `;
    } else if (subcat === 'RECH_FRAUDE') {
      html += `
        <div>
          <label class="lbl-sm">Persona que Contesta</label>
          <input type="text" id="inputPersonaContesta" value="${clienteData.cliente}">
        </div>
        <div>
          <label class="lbl-sm">ID Llamada</label>
          <input type="text" id="inputIDLlamada" placeholder="Ej: 17909701296">
        </div>
        <div>
          <label class="lbl-sm">Customer ID / DNI</label>
          <input type="text" id="inputCustomerID" placeholder="Ej: 44868042">
        </div>
        <div>
          <label class="lbl-sm">Autorizado Por</label>
          <input type="text" id="inputAutorizadoPor" placeholder="Ej: SUPERVISOR JUAN PEREZ">
        </div>
      `;
    } else {
      html += `
        <div>
          <label class="lbl-sm">Persona que Contesta</label>
          <input type="text" id="inputPersonaContesta" value="${subcat === 'RECH_CONTACTO' ? 'NO RESPONDE / SIN CONTACTO' : clienteData.cliente}">
        </div>
        <div>
          <label class="lbl-sm">ID Llamada</label>
          <input type="text" id="inputIDLlamada" placeholder="Ej: 17909701296">
        </div>
        <div style="grid-column: span 2;">
          <label class="lbl-sm">Submotivo de Rechazo</label>
          <select id="selectSubmotivoRechazo">
            ${opciones.map(s => `<option value="${s}">${s}</option>`).join('')}
          </select>
        </div>
      `;
    }
  }

  html += '</div>';
  contenedor.innerHTML = html;

  const inputFecha = document.getElementById('inputFecha');
  if (inputFecha) {
    inputFecha.value = fechaToaPorDefecto || new Date().toISOString().split('T')[0];
    inputFecha.addEventListener('change', actualizarFormatoHabilitarFranja);
  }

  const selectFranja = document.getElementById('selectFranja');
  if (selectFranja) {
    if (franjaToaPorDefecto) selectFranja.value = franjaToaPorDefecto;
    selectFranja.addEventListener('change', actualizarFormatoHabilitarFranja);
  }
}

/* ==========================================================================
   6. GENERACIÓN INDEPENDIENTE Y AUTOMÁTICA DE PLANTILLAS
   ========================================================================== */

function v(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function obtenerFechaYFranjaFormateada() {
  const rawFecha = v('inputFecha');
  const franja = v('selectFranja');
  
  if (!rawFecha) return `XX/XX ${franja}`.trim();

  const partes = rawFecha.split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]} ${franja}`;
  }
  return `${rawFecha} ${franja}`;
}

function generarPlantilla() {
  if (!usuarioActual.nombre) {
    mostrarToast("⚠️ Debes iniciar sesión primero", "#dc3545");
    const modalLogin = document.getElementById('loginModal');
    if (modalLogin) modalLogin.style.display = 'flex';
    return;
  }

  const clienteData = obtenerClienteData();
  const subcat = document.getElementById('selectSubcategoria').value;
  const idLlamada = v('inputIDLlamada') || "S/N";
  const fechaVisita = obtenerFechaYFranjaFormateada();
  const obs = v('inputObs') || "SIN OBSERVACIONES";
  const motivoDetalle = v('inputMotivoDetalle') || "# Cambios en las fechas y franjas solicitadas";
  const personaContesta = v('inputPersonaContesta') || clienteData.cliente;
  const submotivo = v('selectSubmotivoRechazo');
  const realizadorCompleto = `${usuarioActual.nombre.toUpperCase()} - ADP MULTISKILL HITSS`;

  let p = "";

  switch (subcat) {
    case 'FTOA_GENERAL':
      const ftoa = `*FUERA DE TOA*\n📌 SOT: ${clienteData.sot}\n⚙️ SUB TIPO: ${subTipoExtraido}\n🏡 DIRECCIÓN: ${direccionExtraida}\n📍 DISTRITO: ${distritoExtraido}\n🛠️ SERVICIO: FTTH\n🔑 PLANO: ${planoExtraido}\n👤 CLIENTE: ${clienteData.cliente}\n🔢 COD CLIENTE: ${codClienteExtraido}\n📱 CELULAR DEL CLIENTE: ${clienteData.telefono}\n📅 FECHA Y FRANJA: ${fechaVisita}\n✍️ REALIZADO POR: ${realizadorCompleto}`;
      const repro = `MESA MULTISKILL HITSS\nREPROGRAMADO EN CAMPO / REAGENDADO POR CLIENTE\nMOTIVO DE REPROGRAMACIÓN: CLIENTE ${motivoDetalle}\nCLIENTE: ${clienteData.cliente}\nTELÉFONO: ${clienteData.telefono}\nNUEVA FECHA Y FRANJA DE VISITA: ${fechaVisita}\nOBSERVACIÓN: ${obs}\nCONTRATA: ${clienteData.contrata}\nREALIZADO POR: ${usuarioActual.nombre.toUpperCase()}\nCÓD LLAMADA: ${idLlamada}`;
      p = `${ftoa}\n\n===================================\n\n${repro}`;
      break;

    case 'CONF_LLAMADA':
      p = `MESA MULTISKILL HITSS - CONFIRMA VISITA\nSOT: ${clienteData.sot}\nDÍA Y FRANJA: ${fechaVisita}\nCLIENTE: ${clienteData.cliente}\nNUMERO: ${clienteData.telefono}\nCONTRATA: ${clienteData.contrata}\nID DE LLAMADA: ${idLlamada}\nREALIZADO POR: ${usuarioActual.nombre.toUpperCase()}`;
      break;
    case 'CONF_ADELANTO':
      p = `MESA MULTISKILL HITSS - ADELANTA VISITA\nSOT: ${clienteData.sot}\nDÍA Y FRANJA: ${fechaVisita}\nCLIENTE: ${clienteData.cliente}\nNUMERO: ${clienteData.telefono}\nCONTRATA: ${clienteData.contrata}\nID DE LLAMADA: ${idLlamada}\nREALIZADO POR: ${realizadorCompleto}`;
      break;
    case 'CONF_MANTIENE':
      p = `MESA MULTISKILL HITSS - MANTIENE FECHA DE VISITA\nSOT: ${clienteData.sot}\nDÍA Y FRANJA: ${fechaVisita}\nCLIENTE: ${clienteData.cliente}\nNUMERO: ${clienteData.telefono}\nCONTRATA: ${clienteData.contrata}\nID DE LLAMADA: ${idLlamada}\nREALIZADO POR: ${usuarioActual.nombre.toUpperCase()}`;
      break;
    case 'CICLO_CONTACTO':
      p = `MESA MULTISKILL HITSS - CICLO DE LLAMADAS\nCICLO DE LLAMADA NRO: ${v('inputCiclo') || '1'}\nCANTIDAD DE LLAMADAS: ${v('inputCantLlamadas') || '4'}\nNUMERO: ${clienteData.telefono}\nMOTIVO: FALTA DE CONTACTO\nSUB-MOTIVO: ${v('selectSubmotivo')}\nID DE LLAMADA: ${idLlamada}\nREALIZADO POR: ${realizadorCompleto}`;
      break;
    case 'REPRO_CLIENTE':
      p = `MESA MULTISKILL HITSS\nREPROGRAMADO EN MESA / REAGENDADO POR CLIENTE\nMOTIVO DE REPROGRAMACIÓN: CLIENTE ${motivoDetalle}\nCLIENTE: ${clienteData.cliente}\nTELÉFONO: ${clienteData.telefono}\nNUEVA FECHA Y FRANJA DE VISITA: ${fechaVisita}\nOBSERVACIÓN: ${obs}\nCONTRATA: ${clienteData.contrata}\nREALIZADO POR: ${realizadorCompleto}\nCÓD LLAMADA: ${idLlamada}`;
      break;
    case 'REPRO_CLARO':
      p = `MESA MULTISKILL HITSS\nREPROGRAMADO EN MESA / REAGENDADO POR CLARO\nMOTIVO DE REPROGRAMACIÓN: CLARO ${motivoDetalle}\nCLIENTE: ${clienteData.cliente}\nTELÉFONO: ${clienteData.telefono}\nNUEVA FECHA Y FRANJA DE VISITA: ${fechaVisita}\nOBSERVACIÓN: ${obs}\nCONTRATA: ${clienteData.contrata}\nREALIZADO POR: ${realizadorCompleto}\nCÓD LLAMADA: ${idLlamada}`;
      break;
    case 'RECH_NO_DESEA':
      p = `MESA MULTISKILL HITSS\nRECHAZO EN MESA / CAMPO: RECHAZO EN MESA\nPERSONA QUE CONTESTA: ${personaContesta}\nNUMERO DE CONTACTO: ${clienteData.telefono}\nMOTIVO DEL RECHAZO: CLIENTE NO DESEA EL SERVICIO - MESA\nSUBMOTIVO DE RECHAZO: ${submotivo}\nID DE LLAMADA: ${idLlamada}\nREALIZADO POR: ${realizadorCompleto}`;
      break;
    case 'RECH_DUPLICIDAD':
      p = `MESA MULTISKILL HITSS\nRECHAZO EN MESA / CAMPO: RECHAZADO EN MESA\nNUMERO DE CONTACTO: ${clienteData.telefono}\nMOTIVO DEL RECHAZO: RECHAZADO POR DUPLICIDAD\nSUBMOTIVO DE RECHAZO: ${submotivo}\nSE PROCEDE AL RECHAZO DE LA SOLICITUD POR DUPLICIDAD DE SOT, SE ATENDIÓ CON LA SOT: ${v('inputSotDuplicada') || 'S/N'}\nID DE LLAMADA: ${idLlamada}\nREALIZADO POR: ${realizadorCompleto}`;
      break;
    case 'RECH_FACILIDADES':
      p = `MESA MULTISKILL HITSS\nRECHAZO EN MESA / CAMPO: RECHAZADO EN MESA\nPERSONA QUE CONTESTA: ${personaContesta}\nNUMERO DE CONTACTO: ${clienteData.telefono}\nMOTIVO DEL RECHAZO: FACILIDADES TÉCNICAS DEL CLIENTE\nSUBMOTIVO DE RECHAZO: ${submotivo}\nID DE LLAMADA: ${idLlamada}\nREALIZADO POR: ${realizadorCompleto}`;
      break;
    case 'RECH_CONTACTO':
      p = `MESA MULTISKILL HITSS\nRECHAZO EN MESA / CAMPO: RECHAZO EN MESA\nPERSONA QUE CONTESTA: ${personaContesta}\nNUMERO DE CONTACTO: ${clienteData.telefono}\nMOTIVO DEL RECHAZO: FALTA DE CONTACTO\nSUBMOTIVO DE RECHAZO: ${submotivo}\nID DE LLAMADA: ${idLlamada}\nREALIZADO POR: ${realizadorCompleto}`;
      break;
    case 'RECH_DIRECCION':
      p = `MESA MULTISKILL HITSS\nRECHAZO EN MESA / CAMPO: RECHAZADO EN MESA\nPERSONA QUE CONTESTA: ${personaContesta}\nNUMERO DE CONTACTO: ${clienteData.telefono}\nMOTIVO DEL RECHAZO: MAL INGRESO DE DIRECCIÓN\nDIRECCIÓN CORRECTA: ${v('inputDireccionCorrecta') || 'S/N'}\nSUBMOTIVO DE RECHAZO: ${submotivo}\nID DE LLAMADA: ${idLlamada}\nREALIZADO POR: ${realizadorCompleto}`;
      break;
    case 'RECH_OFERTA':
      p = `MESA MULTISKILL HITSS\nRECHAZO EN MESA / CAMPO: RECHAZADO EN MESA\nPERSONA QUE CONTESTA: ${personaContesta}\nNUMERO DE CONTACTO: ${clienteData.telefono}\nMOTIVO DEL RECHAZO: MALA OFERTA\nSUBMOTIVO DE RECHAZO: ${submotivo}\nID DE LLAMADA: ${idLlamada}\nREALIZADO POR: ${realizadorCompleto}`;
      break;
    case 'RECH_SISTEMA':
      p = `MESA MULTISKILL HITSS\nRECHAZO EN MESA / CAMPO: RECHAZADO EN MESA\nMOTIVO DEL RECHAZO: SOT CON ERRORES EN EL SISTEMA\nSUBMOTIVO DE RECHAZO: ${submotivo}\nSE PROCEDE AL RECHAZO DE LA SOLICITUD POR TENER ERRORES DE SISTEMAS\nID DE LLAMADA: ${idLlamada}\nREALIZADO POR: ${realizadorCompleto}`;
      break;
    case 'RECH_FRAUDE':
      p = `MESA MULTISKILL HITSS\nRECHAZO EN MESA / CAMPO: RECHAZADO EN MESA\nPERSONA QUE CONTESTA: ${personaContesta}\nNUMERO DE CONTACTO: ${clienteData.telefono}\nMOTIVO DEL RECHAZO: POSIBLE FRAUDE\nSUBMOTIVO DE RECHAZO: Cliente ya tiene un servicio activo en la misma dirección\nCUSTOMER ID: ${v('inputCustomerID') || 'S/N'}\nAUTORIZADO POR: ${v('inputAutorizadoPor') || 'S/N'}\nID DE LLAMADA: ${idLlamada}\nREALIZADO POR: ${realizadorCompleto}`;
      break;
  }

  document.getElementById('outputPlantilla').value = p;
  actualizarFormatoHabilitarFranja();
}

function actualizarFormatoHabilitarFranja() {
  const clienteData = obtenerClienteData();
  const fechaVisita = obtenerFechaYFranjaFormateada();
  const supCargo = v('inputSupCargo') || "SIN ASIGNAR";

  const formato = `MESA MULTISKILL HITSS - FORMATO PARA HABILITAR FRANJA\n📥 SOT: ${clienteData.sot}\n🪚 PLANO: ${planoExtraido}\n📅 FECHA Y FRANJA: ${fechaVisita}\n📧 Motivo: SIN FRANJAS DISPONIBLES\n🚨 Sup acargo: ${supCargo}`;
  
  const elHabilitar = document.getElementById('outputHabilitarFranja');
  if (elHabilitar) {
    elHabilitar.value = formato;
  }
}

/* ==========================================================================
   7. BOTÓN LIMPIAR, BLOC DE NOTAS Y CONTADOR
   ========================================================================== */

function limpiarColumnas1y2() {
  const rawInput = document.getElementById('rawInput');
  if (rawInput) rawInput.value = '';

  document.getElementById('pvSOT').value = '';
  document.getElementById('pvTel').value = '';
  document.getElementById('pvCliente').value = '';
  document.getElementById('pvContrata').value = '';

  planoExtraido = "S/N";
  subTipoExtraido = "S/N";
  codClienteExtraido = "S/N";
  direccionExtraida = "S/N";
  distritoExtraido = "S/N";

  const outputPlantilla = document.getElementById('outputPlantilla');
  if (outputPlantilla) outputPlantilla.value = '';

  const outputHabilitar = document.getElementById('outputHabilitarFranja');
  if (outputHabilitar) outputHabilitar.value = '';

  renderizarCamposDinamicos();
  mostrarToast("🧹 Columnas 1 y 2 limpiadas");
}

function actualizarContadorGestiones() {
  const cont = document.getElementById('contadorGestiones');
  if (cont) {
    cont.innerText = `Total: ${listaGestiones.length}`;
  }
}

let toastTimeout;

function mostrarToast(mensaje, color = "#28a745") {
  const toast = document.getElementById('toastNotification');
  if (!toast) return;

  clearTimeout(toastTimeout);
  toast.innerText = mensaje;
  toast.style.backgroundColor = color;
  toast.classList.add('show');

  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function copiarPlantilla() {
  const area = document.getElementById('outputPlantilla');
  if (!area || !area.value.trim()) {
    mostrarToast("⚠️ Genera una plantilla antes de copiar", "#dc3545");
    return;
  }

  const textoLimpio = area.value.replace(/\r?\n/g, "\r\n").replace(/\u200B/g, "");

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(textoLimpio);
  }
  mostrarToast("📋 ¡Plantilla copiada correctamente!");
}

function intentarGuardarEnBloc() {
  const plantillaGen = document.getElementById('outputPlantilla').value.trim();
  if (!plantillaGen) {
    mostrarToast("⚠️ Genera una plantilla primero", "#dc3545");
    return;
  }

  const esDuplicado = listaGestiones.some(g => g.plantilla === plantillaGen);

  if (esDuplicado) {
    plantillaPendiente = plantillaGen;
    const modalDup = document.getElementById('duplicateModal');
    if (modalDup) modalDup.style.display = 'flex';
  } else {
    guardarEnBlocDirecto(plantillaGen);
  }
}

function confirmarAgregarDuplicado() {
  if (plantillaPendiente) {
    guardarEnBlocDirecto(plantillaPendiente);
    plantillaPendiente = null;
  }
  const modalDup = document.getElementById('duplicateModal');
  if (modalDup) modalDup.style.display = 'none';
}

function cancelarAgregarDuplicado() {
  plantillaPendiente = null;
  const modalDup = document.getElementById('duplicateModal');
  if (modalDup) modalDup.style.display = 'none';
}

function guardarEnBlocDirecto(textoPlantilla) {
  const clienteDataActual = obtenerClienteData();
  const item = {
    id: listaGestiones.length + 1,
    sot: clienteDataActual.sot,
    telefono: clienteDataActual.telefono,
    plantilla: textoPlantilla
  };

  listaGestiones.push(item);
  renderizarBloc();
  actualizarContadorGestiones();
    
  mostrarToast("💾 ¡Plantilla guardada en el Bloc!");
  limpiarColumnas1y2();
}

function renderizarBloc() {
  const container = document.getElementById('blocNotasView');
  if (!container) return;

  if (listaGestiones.length === 0) {
    container.innerText = "Aún no hay registros guardados hoy.";
    return;
  }

  let textContent = "";
  listaGestiones.forEach(g => {
    textContent += `${g.id}.\nNumero SOT: ${g.sot}\nTelefono: ${g.telefono}\nPlantilla generada:\n${g.plantilla}\n\n**********\n\n`;
  });

  container.innerText = textContent;
}

function exportarBloc() {
  if (listaGestiones.length === 0) {
    mostrarToast("⚠️ No hay registros en el bloc para exportar", "#dc3545");
    return;
  }
  const container = document.getElementById('blocNotasView');
  if (!container) return;

  const text = container.innerText;
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `Registro_Gestiones_${new Date().toISOString().slice(0,10)}.txt`;
  a.click();
}

/* ==========================================================================
   8. MÓDULO DASHBOARD / PANEL DEL ADMINISTRADOR (CARGA AUTOMÁTICA)
   ========================================================================== */

let datosExcelRaw = [];
let mapaLeyenda = {};
let chartFranjaInst = null;
let chartHorasInst = null;

async function cargarExcelAutomatico() {
  const URL_EXCEL = 'https://docs.google.com/spreadsheets/d/1-NdYh_lX7heBaU3TCJMftvxWtQgmovGF/export?format=xlsx&v=' + Date.now();
  mostrarToast("⏳ Sincronizando base de datos...", "#007bff");

  try {
    const response = await fetch(URL_EXCEL);
    if (!response.ok) throw new Error("No se pudo descargar el Excel desde Google Drive");

    const arrayBuffer = await response.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: 'array', cellDates: true });

    mapaLeyenda = {};
    if (workbook.Sheets['Leyenda']) {
      const leyendaRows = XLSX.utils.sheet_to_json(workbook.Sheets['Leyenda'], { defval: "" });
      leyendaRows.forEach(r => {
        const cod = String(r['Usuario E'] || '').trim().toUpperCase();
        if (cod) {
          mapaLeyenda[cod] = {
            nombre: String(r['Apellidos y Nombres'] || '').trim(),
            modalidad: String(r['__EMPTY'] || r['Modalidad'] || 'Full Time').trim()
          };
        }
      });
    }

    const sheet1 = workbook.Sheets['Sheet1'];
    if (!sheet1) {
      mostrarToast("⚠️ No se encontró la pestaña 'Sheet1'", "#dc3545");
      return;
    }

    const rows = XLSX.utils.sheet_to_json(sheet1, { defval: "" });
    datosExcelRaw = rows.map(r => {
      const codLimpio = String(r['Usuario E'] || '').replace(/\s+/g, '').toUpperCase();
      const infoMaestro = mapaLeyenda[codLimpio];
      const nombre2 = String(r['NOMBRE2'] || '').trim();
      const asesorFinal = (nombre2 && nombre2 !== '#N/D') ? nombre2 : (infoMaestro ? infoMaestro.nombre : 'NO IDENTIFICADO (#N/D)');
      const modalidadFinal = String(r['Modalidad'] || (infoMaestro ? infoMaestro.modalidad : 'Sin dato')).trim();

      let minDuracion = 0;
      if (r['Hora de inicio'] instanceof Date && r['Hora de finalización'] instanceof Date) {
        minDuracion = (r['Hora de finalización'] - r['Hora de inicio']) / 60000;
      }

      // Conversión en hora local para evitar salto de día por zona horaria UTC
      let fechaStr = "";
      const fg = r['Fecha gestion'] || r['Hora de inicio'];
      if (fg instanceof Date && !isNaN(fg)) {
        const anio = fg.getFullYear();
        const mes = String(fg.getMonth() + 1).padStart(2, '0');
        const dia = String(fg.getDate()).padStart(2, '0');
        fechaStr = `${anio}-${mes}-${dia}`;
      } else {
        fechaStr = String(fg).split(' ')[0];
      }

      return {
        sot: String(r['SOT'] || '').trim(),
        usuarioE: codLimpio,
        asesor: asesorFinal,
        modalidad: modalidadFinal,
        gestion: String(r['GESTION'] || '').trim().toUpperCase(),
        franja: String(r['FRANJA'] || '').trim().toUpperCase(),
        subarea: String(r['SOT GESTIONADA MANUAL'] || '').trim().toUpperCase(),
        semana: String(r['Semana'] || '').trim(),
        intervalo: parseInt(r['INTERVALO'], 10),
        fecha: fechaStr,
        duracionMin: minDuracion > 0 && minDuracion < 180 ? minDuracion : null,
        esErrorCodigo: !/^E\d{6}$/.test(codLimpio) || asesorFinal.includes('#N/D')
      };
    });

    poblarFiltrosDashboard();
    actualizarDashboard();
    mostrarToast(`✅ ${datosExcelRaw.length.toLocaleString()} registros cargados automáticamente`);
  } catch (err) {
    console.error(err);
    mostrarToast("❌ Error al leer el Excel desde Google Drive.", "#dc3545");
  }
}

function poblarFiltrosDashboard() {
  llenarSelect('filtroSemana', [...new Set(datosExcelRaw.map(d => d.semana).filter(Boolean))].sort());
  llenarSelect('filtroDia', [...new Set(datosExcelRaw.map(d => d.fecha).filter(Boolean))].sort());
  llenarSelect('filtroSubarea', [...new Set(datosExcelRaw.map(d => d.subarea).filter(Boolean))].sort());
  llenarSelect('filtroFranja', [...new Set(datosExcelRaw.map(d => d.franja).filter(Boolean))].sort());
  llenarSelect('filtroAsesor', [...new Set(datosExcelRaw.map(d => d.asesor).filter(Boolean))].sort());
}

function llenarSelect(id, items) {
  const sel = document.getElementById(id);
  if (!sel) return;
  const primera = sel.options[0].outerHTML;
  sel.innerHTML = primera + items.map(i => `<option value="${i}">${i}</option>`).join('');
}

function actualizarDashboard() {
  const fSem = document.getElementById('filtroSemana').value;
  const fDia = document.getElementById('filtroDia').value;
  const fSub = document.getElementById('filtroSubarea').value;
  const fFra = document.getElementById('filtroFranja').value;
  const fAse = document.getElementById('filtroAsesor').value;

  const filtrados = datosExcelRaw.filter(d =>
    (fSem === 'TODAS' || d.semana === fSem) &&
    (fDia === 'TODOS' || d.fecha === fDia) &&
    (fSub === 'TODAS' || d.subarea === fSub) &&
    (fFra === 'TODAS' || d.franja === fFra) &&
    (fAse === 'TODOS' || d.asesor === fAse)
  );

  const total = filtrados.length;
  const sotsUnicas = new Set(filtrados.map(d => d.sot)).size;
  const confirmo = filtrados.filter(d => d.gestion === 'CONFIRMO').length;
  const contactados = filtrados.filter(d => ['CONFIRMO', 'RECHAZADO', 'REPROGRAMADO'].includes(d.gestion)).length;
  const erroresE = filtrados.filter(d => d.esErrorCodigo).length;

  const tiemposValidos = filtrados.map(d => d.duracionMin).filter(v => v !== null).sort((a, b) => a - b);
  const medianaMin = tiemposValidos.length ? tiemposValidos[Math.floor(tiemposValidos.length / 2)] : 0;

  document.getElementById('kpiTotal').innerText = total.toLocaleString();
  document.getElementById('kpiUnicas').innerText = `${sotsUnicas.toLocaleString()} SOTs únicas`;
  document.getElementById('kpiContactabilidad').innerText = total ? `${((contactados / total) * 100).toFixed(1)}%` : '0%';
  document.getElementById('kpiContactadosDet').innerText = `${contactados.toLocaleString()} contactados de ${total.toLocaleString()}`;
  document.getElementById('kpiConfirmados').innerText = contactados ? `${((confirmo / contactados) * 100).toFixed(1)}%` : '0%';
  document.getElementById('kpiConfirmadosCant').innerText = `${confirmo.toLocaleString()} confirmados`;
  document.getElementById('kpiTiempo').innerText = `${medianaMin.toFixed(2)} min`;
  document.getElementById('kpiErroresE').innerText = total ? `${((erroresE / total) * 100).toFixed(1)}%` : '0%';
  document.getElementById('kpiErroresCant').innerText = `${erroresE} registros sin match en Leyenda`;

  renderizarGraficos(filtrados);
  renderizarTablaADP(filtrados);
}

function renderizarGraficos(data) {
  const franjas = ['AM0', 'AM1', 'AM2', 'PM1', 'PM2'];
  const estados = ['CONFIRMO', 'NO CONTESTA', 'RECHAZADO', 'REPROGRAMADO'];
  const colores = ['#198754', '#6c757d', '#dc3545', '#ffc107'];

  if (chartFranjaInst) chartFranjaInst.destroy();
  chartFranjaInst = new Chart(document.getElementById('chartFranja'), {
    type: 'bar',
    data: {
      labels: franjas,
      datasets: estados.map((est, idx) => ({
        label: est,
        backgroundColor: colores[idx],
        data: franjas.map(f => data.filter(d => d.franja === f && d.gestion === est).length)
      }))
    },
    options: { responsive: true, scales: { x: { stacked: true }, y: { stacked: true } } }
  });

  const horas = Array.from({ length: 15 }, (_, i) => i + 6);
  if (chartHorasInst) chartHorasInst.destroy();
  chartHorasInst = new Chart(document.getElementById('chartHoras'), {
    type: 'line',
    data: {
      labels: horas.map(h => `${h}:00`),
      datasets: [{
        label: 'Gestiones por Hora',
        borderColor: '#e30613',
        backgroundColor: 'rgba(227, 6, 19, 0.15)',
        fill: true,
        tension: 0.3,
        data: horas.map(h => data.filter(d => d.intervalo === h).length)
      }]
    },
    options: { responsive: true }
  });
}

function renderizarTablaADP(data) {
  const porAsesor = {};
  data.forEach(d => {
    if (!porAsesor[d.asesor]) {
      porAsesor[d.asesor] = { usuarioE: d.usuarioE, modalidad: d.modalidad, total: 0, porDia: {} };
    }
    porAsesor[d.asesor].total++;
    porAsesor[d.asesor].porDia[d.fecha] = (porAsesor[d.asesor].porDia[d.fecha] || 0) + 1;
  });

  const ranking = Object.entries(porAsesor).map(([nombre, info]) => {
    const dias = Object.values(info.porDia);
    const diasTrab = dias.length;
    const diasMeta = dias.filter(c => c >= 80).length;
    const cumplimiento = diasTrab ? ((diasMeta / diasTrab) * 100).toFixed(1) : '0.0';
    const promDia = diasTrab ? (info.total / diasTrab).toFixed(1) : '0.0';
    return { nombre, ...info, diasTrab, diasMeta, cumplimiento, promDia };
  }).sort((a, b) => b.total - a.total);

  const tbody = document.getElementById('tablaAvanceADP');
  tbody.innerHTML = ranking.map(r => `
    <tr style="border-bottom: 1px solid var(--border-color);">
      <td style="padding: 8px; font-weight: 600;">${r.nombre}</td>
      <td style="padding: 8px;">${r.usuarioE}</td>
      <td style="padding: 8px;">${r.modalidad}</td>
      <td style="padding: 8px;">${r.diasTrab}</td>
      <td style="padding: 8px; font-weight: bold;">${r.total}</td>
      <td style="padding: 8px;">${r.promDia}</td>
      <td style="padding: 8px;">${r.diasMeta} / ${r.diasTrab}</td>
      <td style="padding: 8px; font-weight: bold; color: ${parseFloat(r.cumplimiento) >= 50 ? 'var(--success)' : 'var(--primary)'};">${r.cumplimiento}%</td>
    </tr>
  `).join('');
}