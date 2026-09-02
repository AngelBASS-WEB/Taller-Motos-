const STORAGE_KEY = 'taller_ordenes_v1';
const STOCK_KEY = 'taller_stock_v1';
const THEME_KEY = 'taller_theme_v1';
const AGENDA_KEY = 'taller_agenda_v1';

const APPOINTMENT_TYPES = {
  mantenimiento: { label: 'Mantenimiento', color: '#2563eb', soft: '#dbeafe' },
  revision: { label: 'Revisión', color: '#7c3aed', soft: '#ede9fe' },
  reparacion: { label: 'Reparación', color: '#dc2626', soft: '#fee2e2' },
  entrega: { label: 'Entrega', color: '#16a34a', soft: '#dcfce7' },
  servicio: { label: 'Servicio', color: '#f59e0b', soft: '#fef3c7' }
};

const state = {
  orders: loadOrders(),
  stock: loadStock(),
  appointments: loadAppointments(),
  stockSearch: '',
  stockFilters: {
    code: '',
    brand: '',
    model: '',
    displacement: '',
    part: '',
    quantity: '',
    price: ''
  },
  clientSearch: '',
  clientFilters: {
    name: '',
    lastName: '',
    dni: '',
    rut: '',
    phone: '',
    email: ''
  },
  vehicleSearch: '',
  vehicleFilters: {
    brand: '',
    model: '',
    year: '',
    plate: '',
    vin: '',
    fuel: '',
    transmission: ''
  },
  activeOrderId: null,
  currentView: 'orders',
  orderFilter: 'all',
  agendaWeekStart: getStartOfWeek(new Date())
};

const money = (value = 0) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(value || 0));
};

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const generateId = () => {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

function getStartOfWeek(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function addDays(date, amount) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date) {
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(date);
}

function formatLongDate(date) {
  return new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
}

function timeToMinutes(timeValue = '09:00') {
  const [hours, minutes] = String(timeValue).split(':').map(Number);
  return (Number(hours) || 0) * 60 + (Number(minutes) || 0);
}

function getAgendaSlots() {
  const times = [];
  const startMinutes = 8 * 60;
  const endMinutes = 18 * 60;

  for (let totalMinutes = startMinutes; totalMinutes < endMinutes; totalMinutes += 15) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const label = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    times.push({ value: label, minutes: totalMinutes, label });
  }

  return times;
}

function getWeekDates(startDate) {
  const dates = [];
  for (let index = 0; index < 7; index += 1) {
    dates.push(addDays(startDate, index));
  }
  return dates;
}

function loadOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('No se pudieron leer las órdenes guardadas:', error);
    return [];
  }
}

function saveOrders() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.orders));
}

function normalizeAppointment(item = {}) {
  return {
    id: item.id || generateId(),
    date: item.date || new Date().toISOString().slice(0, 10),
    time: item.time || '09:00',
    duration: Number(item.duration || 60),
    type: APPOINTMENT_TYPES[item.type] ? item.type : 'servicio',
    client: item.client || '',
    vehicle: item.vehicle || '',
    notes: item.notes || '',
    color: item.color || APPOINTMENT_TYPES[item.type]?.color || APPOINTMENT_TYPES.servicio.color
  };
}

function loadAppointments() {
  try {
    const raw = localStorage.getItem(AGENDA_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeAppointment) : [];
  } catch (error) {
    console.error('No se pudieron leer los turnos guardados:', error);
    return [];
  }
}

function saveAppointments() {
  localStorage.setItem(AGENDA_KEY, JSON.stringify(state.appointments.map(normalizeAppointment)));
}

function normalizeStockItem(item = {}) {
  return {
    id: item.id || generateId(),
    code: item.code || '',
    brand: item.brand || '',
    model: item.model || '',
    displacement: item.displacement || '',
    part: item.part || '',
    quantity: Number(item.quantity || 0),
    price: Number(item.price || 0)
  };
}

function loadStock() {
  try {
    const raw = localStorage.getItem(STOCK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeStockItem) : [];
  } catch (error) {
    console.error('No se pudo leer el stock guardado:', error);
    return [];
  }
}

function saveStock() {
  localStorage.setItem(STOCK_KEY, JSON.stringify(state.stock.map(normalizeStockItem)));
}

function applyTheme(theme) {
  const validThemes = ['light', 'dark', 'forest', 'clay'];
  const selectedTheme = validThemes.includes(theme) ? theme : 'light';
  document.documentElement.dataset.theme = selectedTheme;
  localStorage.setItem(THEME_KEY, selectedTheme);
  document.querySelectorAll('[data-theme-choice]').forEach((button) => {
    button.classList.toggle('active', button.dataset.themeChoice === selectedTheme);
  });
}

function bindThemePicker() {
  const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
  applyTheme(savedTheme);
  document.querySelectorAll('[data-theme-choice]').forEach((button) => {
    button.addEventListener('click', () => applyTheme(button.dataset.themeChoice));
  });
}

function getNextOrderNumber() {
  const maxNumber = state.orders.reduce((max, order) => Math.max(max, Number(order.number || 0)), 0);
  return maxNumber + 1;
}

function emptyItem(type = 'labor') {
  return {
    id: generateId(),
    type,
    description: '',
    qty: 1,
    unitPrice: 0
  };
}

function createEmptyOrder() {
  return {
    id: generateId(),
    number: getNextOrderNumber(),
    status: 'Nueva',
    createdAt: new Date().toISOString(),
    client: {
      name: '',
      lastName: '',
      rut: '',
      phone: '',
      email: '',
      address: ''
    },
    vehicle: {
      brand: '',
      model: '',
      year: '',
      plate: '',
      color: '',
      km: '',
      engine: '',
      vin: '',
      fuel: '',
      transmission: ''
    },
    service: {
      clientWords: '',
      advisorWords: ''
    },
    items: [emptyItem('labor')]
  };
}

function getOrderById(orderId) {
  return state.orders.find((order) => order.id === orderId) || null;
}

function updateSummaryCards() {
  const statusCounts = {
    all: state.orders.length,
    Nueva: state.orders.filter((order) => order.status === 'Nueva').length,
    'En revisión': state.orders.filter((order) => order.status === 'En revisión').length,
    'Espera repuestos': state.orders.filter((order) => order.status === 'Espera repuestos').length,
    'En reparación': state.orders.filter((order) => order.status === 'En reparación').length,
    Terminada: state.orders.filter((order) => order.status === 'Terminada').length,
    Entregada: state.orders.filter((order) => order.status === 'Entregada').length
  };

  document.getElementById('totalOrders').textContent = statusCounts.all;
  document.getElementById('newOrders').textContent = statusCounts.Nueva;
  document.getElementById('reviewOrders').textContent = statusCounts['En revisión'];
  document.getElementById('waitingPartsOrders').textContent = statusCounts['Espera repuestos'];
  document.getElementById('repairOrders').textContent = statusCounts['En reparación'];
  document.getElementById('finishedOrders').textContent = statusCounts.Terminada;
  document.getElementById('deliveredOrders').textContent = statusCounts.Entregada;
}

function getOrderTotal(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  return items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.unitPrice || 0), 0);
}

function renderOrders() {
  const list = document.getElementById('ordersList');

  const allOrders = [...state.orders].sort((a, b) => Number(b.number) - Number(a.number));
  const filteredOrders = allOrders.filter((order) => {
    if (state.orderFilter === 'all') {
      return true;
    }

    return order.status === state.orderFilter;
  });

  if (!filteredOrders.length) {
    const emptyMessage = state.orderFilter === 'all'
      ? 'No hay órdenes registradas'
      : `No hay órdenes en estado "${state.orderFilter}".`;

    list.innerHTML = `
      <div class="empty-state">
        <h3>${emptyMessage}</h3>
        <p>${state.orderFilter === 'all' ? 'Haz clic en “Nueva orden” para crear la primera.' : 'Prueba con otro filtro.'}</p>
      </div>
    `;
    updateSummaryCards();
    return;
  }

  list.innerHTML = filteredOrders.map((order) => {
    const total = getOrderTotal(order);
    const statusClass = order.status.toLowerCase().replace(/\s+/g, '-');
    const clientName = `${(order.client?.name || '').trim() || 'Cliente sin nombre'} ${(order.client?.lastName || '').trim()}`.trim();
    const vehicleName = `${(order.vehicle?.brand || '').trim() || 'Sin marca'} ${(order.vehicle?.model || '').trim()}`.trim();

    return `
      <article class="order-card" data-order-id="${order.id}">
        <div class="order-main">
          <span class="order-number">OT-${String(order.number).padStart(4, '0')}</span>
          <div class="order-identity">
            <strong>${clientName}</strong>
            <small>${vehicleName || 'Vehículo sin nombre'} · ${order.vehicle?.plate || 'Sin patente'}</small>
          </div>
        </div>

        <div class="order-meta-inline">
          <span class="status-badge ${statusClass}">${order.status}</span>
          <span class="order-total">${money(total)}</span>
          <button class="secondary-btn" type="button" data-action="open-order" data-order-id="${order.id}">Abrir</button>
          <button class="secondary-btn" type="button" data-action="pdf-order" data-order-id="${order.id}">PDF</button>
        </div>
      </article>
    `;
  }).join('');

  updateSummaryCards();
}

function readItemRows() {
  return [...document.querySelectorAll('.item-row')].map((row) => ({
    id: row.dataset.itemId || generateId(),
    stockItemId: row.dataset.stockItemId || null,
    type: row.querySelector('.item-type').value,
    description: row.querySelector('.item-description').value.trim(),
    qty: Number(row.querySelector('.item-qty').value || 0),
    unitPrice: Number(row.querySelector('.item-price').value || 0)
  }));
}

function renderItemRows(items = []) {
  const itemsContainer = document.getElementById('itemsContainer');
  if (!itemsContainer) return;

  const sourceItems = Array.isArray(items) && items.length ? items : [emptyItem('labor')];
  itemsContainer.innerHTML = '';

  sourceItems.forEach((item) => {
    const row = document.createElement('div');
    const itemId = item.id || generateId();
    const isParts = item.type === 'parts';

    row.className = 'item-row';
    row.dataset.itemId = itemId;
    row.dataset.stockItemId = item.stockItemId || '';
    row.innerHTML = `
      <select class="item-type">
        <option value="labor" ${!isParts ? 'selected' : ''}>Mano de obra</option>
        <option value="parts" ${isParts ? 'selected' : ''}>Repuesto</option>
      </select>
      <input class="item-description" type="text" placeholder="Descripción" value="${escapeHtml(item.description || '')}" />
      <input class="item-qty" type="number" min="1" step="1" value="${Number(item.qty || 1)}" />
      <input class="item-price" type="number" min="0" step="1" value="${Number(item.unitPrice || 0)}" />
      <button class="icon-btn danger" type="button" data-action="remove-item" data-item-id="${itemId}">×</button>
    `;

    itemsContainer.appendChild(row);
    row.querySelectorAll('input, select').forEach((field) => {
      field.addEventListener('input', updateTotals);
      field.addEventListener('change', updateTotals);
    });
  });

  updateTotals();
}

function updateTotals() {
  const items = readItemRows();
  const labor = items
    .filter((item) => item.type === 'labor')
    .reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.unitPrice || 0), 0);

  const parts = items
    .filter((item) => item.type === 'parts')
    .reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.unitPrice || 0), 0);

  const total = labor + parts;

  document.getElementById('laborTotal').textContent = money(labor);
  document.getElementById('partsTotal').textContent = money(parts);
  document.getElementById('grandTotal').textContent = money(total);
}

function findVehicleByChassis(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return null;

  return state.orders
    .map((order) => order.vehicle)
    .find((vehicle) => {
      const values = [vehicle?.vin, vehicle?.chassis, vehicle?.plate].filter(Boolean).map((item) => String(item).trim().toLowerCase().replace(/\s+/g, ''));
      return values.includes(normalized.replace(/\s+/g, ''));
    }) || null;
}

function findClientByDni(value) {
  const normalized = String(value || '').trim().toLowerCase().replace(/\s+/g, '');
  if (!normalized) return null;

  return state.orders
    .map((order) => order.client)
    .find((client) => {
      const values = [client?.dni, client?.rut].filter(Boolean).map((value) => String(value).trim().toLowerCase().replace(/\s+/g, ''));
      return values.includes(normalized.replace(/\s+/g, ''));
    }) || null;
}

function fillVehicleFromMatch(vehicle) {
  if (!vehicle) return;

  document.getElementById('vehicleBrand').value = vehicle.brand || '';
  document.getElementById('vehicleModel').value = vehicle.model || '';
  document.getElementById('vehicleYear').value = vehicle.year || '';
  document.getElementById('vehiclePlate').value = vehicle.plate || '';
  document.getElementById('vehicleColor').value = vehicle.color || '';
  document.getElementById('vehicleKm').value = vehicle.km || '';
  document.getElementById('vehicleEngine').value = vehicle.engine || '';
  document.getElementById('vehicleVin').value = vehicle.vin || vehicle.chassis || '';
  document.getElementById('vehicleFuel').value = vehicle.fuel || '';
  document.getElementById('vehicleTransmission').value = vehicle.transmission || '';
}

function fillClientFromMatch(client) {
  if (!client) return;

  document.getElementById('clientName').value = client.name || '';
  document.getElementById('clientLastName').value = client.lastName || '';
  document.getElementById('clientDni').value = client.dni || '';
  document.getElementById('clientRut').value = client.rut || '';
  document.getElementById('clientPhone').value = client.phone || '';
  document.getElementById('clientEmail').value = client.email || '';
  document.getElementById('clientAddress').value = client.address || '';
}

function applyLiveAutocomplete() {
  const vehicleMatch = findVehicleByChassis(document.getElementById('vehicleSearch').value);
  const clientMatch = findClientByDni(document.getElementById('clientSearch').value || document.getElementById('clientDni').value || document.getElementById('clientRut').value);

  if (vehicleMatch) fillVehicleFromMatch(vehicleMatch);
  if (clientMatch) fillClientFromMatch(clientMatch);
}

function fillOrderForm(order) {
  const orderNumberInput = document.getElementById('orderNumber');
  const orderStatusInput = document.getElementById('orderStatus');
  const orderIdInput = document.getElementById('orderId');

  orderIdInput.value = order.id;
  orderNumberInput.value = order.number || getNextOrderNumber();
  orderStatusInput.value = order.status || 'Nueva';

  const vehicleLabel = [order.vehicle?.brand, order.vehicle?.model, order.vehicle?.year]
    .filter(Boolean)
    .join(' ')
    .trim() || order.vehicle?.plate || order.vehicle?.vin || 'Sin vehículo';
  const clientLabel = [order.client?.name, order.client?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim() || order.client?.dni || order.client?.rut || 'Sin cliente';

  document.getElementById('summaryVehicle').textContent = vehicleLabel;
  document.getElementById('summaryClient').textContent = clientLabel;

  document.getElementById('clientName').value = order.client?.name || '';
  document.getElementById('clientLastName').value = order.client?.lastName || '';
  document.getElementById('clientDni').value = order.client?.dni || '';
  document.getElementById('clientRut').value = order.client?.rut || '';
  document.getElementById('clientPhone').value = order.client?.phone || '';
  document.getElementById('clientEmail').value = order.client?.email || '';
  document.getElementById('clientAddress').value = order.client?.address || '';

  document.getElementById('vehicleBrand').value = order.vehicle?.brand || '';
  document.getElementById('vehicleModel').value = order.vehicle?.model || '';
  document.getElementById('vehicleYear').value = order.vehicle?.year || '';
  document.getElementById('vehiclePlate').value = order.vehicle?.plate || '';
  document.getElementById('vehicleColor').value = order.vehicle?.color || '';
  document.getElementById('vehicleKm').value = order.vehicle?.km || '';
  document.getElementById('vehicleEngine').value = order.vehicle?.engine || '';
  document.getElementById('vehicleVin').value = order.vehicle?.vin || order.vehicle?.chassis || '';
  document.getElementById('vehicleFuel').value = order.vehicle?.fuel || '';
  document.getElementById('vehicleTransmission').value = order.vehicle?.transmission || '';

  document.getElementById('vehicleSearch').value = document.getElementById('vehicleVin').value;
  document.getElementById('clientSearch').value = document.getElementById('clientDni').value || document.getElementById('clientRut').value;

  document.getElementById('clientWords').value = order.service?.clientWords || '';
  document.getElementById('advisorWords').value = order.service?.advisorWords || '';

  renderItemRows(order.items || []);
}

function resetForm() {
  const newOrder = createEmptyOrder();
  state.activeOrderId = null;
  document.getElementById('modalTitle').textContent = 'Nueva orden';
  document.getElementById('orderId').value = '';
  document.getElementById('orderNumber').value = newOrder.number;
  document.getElementById('orderStatus').value = 'Nueva';
  document.getElementById('orderForm').reset();
  document.getElementById('orderStatus').value = 'Nueva';
  fillOrderForm(newOrder);
}

function openModalForOrder(orderId = null) {
  const order = orderId ? getOrderById(orderId) : createEmptyOrder();
  state.activeOrderId = orderId;
  document.getElementById('modalTitle').textContent = orderId ? 'Editar orden' : 'Nueva orden';
  fillOrderForm(order);

  const orderModal = document.getElementById('orderModal');
  const modalPanel = orderModal.querySelector('.modal-panel');

  orderModal.classList.remove('hidden');
  orderModal.setAttribute('aria-hidden', 'false');

  requestAnimationFrame(() => {
    if (modalPanel) {
      modalPanel.scrollTop = modalPanel.scrollHeight;
    }
  });
}

function closeModal() {
  document.getElementById('orderModal').classList.add('hidden');
  document.getElementById('orderModal').setAttribute('aria-hidden', 'true');
  state.activeOrderId = null;
}

function saveOrder(event) {
  event.preventDefault();

  const payload = {
    id: document.getElementById('orderId').value || generateId(),
    number: Number(document.getElementById('orderNumber').value || getNextOrderNumber()),
    status: document.getElementById('orderStatus').value,
    createdAt: getOrderById(document.getElementById('orderId').value)?.createdAt || new Date().toISOString(),
    client: {
      name: document.getElementById('clientName').value.trim(),
      lastName: document.getElementById('clientLastName').value.trim(),
      dni: document.getElementById('clientDni').value.trim(),
      rut: document.getElementById('clientRut').value.trim(),
      phone: document.getElementById('clientPhone').value.trim(),
      email: document.getElementById('clientEmail').value.trim(),
      address: document.getElementById('clientAddress').value.trim()
    },
    vehicle: {
      brand: document.getElementById('vehicleBrand').value.trim(),
      model: document.getElementById('vehicleModel').value.trim(),
      year: document.getElementById('vehicleYear').value.trim(),
      plate: document.getElementById('vehiclePlate').value.trim(),
      color: document.getElementById('vehicleColor').value.trim(),
      km: document.getElementById('vehicleKm').value.trim(),
      engine: document.getElementById('vehicleEngine').value.trim(),
      vin: document.getElementById('vehicleVin').value.trim(),
      chassis: document.getElementById('vehicleVin').value.trim(),
      fuel: document.getElementById('vehicleFuel').value.trim(),
      transmission: document.getElementById('vehicleTransmission').value.trim()
    },
    service: {
      clientWords: document.getElementById('clientWords').value.trim(),
      advisorWords: document.getElementById('advisorWords').value.trim()
    },
    items: readItemRows().filter((item) => item.description || Number(item.qty) > 0 || Number(item.unitPrice) > 0)
  };

  const existingIndex = state.orders.findIndex((order) => order.id === payload.id);

  if (existingIndex >= 0) {
    state.orders[existingIndex] = payload;
  } else {
    state.orders.push(payload);
  }

  saveOrders();
  renderOrders();
  renderClientsTable();
  renderVehiclesTable();
  closeModal();
}

function deleteOrder(orderId) {
  const order = getOrderById(orderId);
  if (!order) return;

  const confirmed = window.confirm(`¿Deseas eliminar la OT-${String(order.number).padStart(4, '0')}?`);
  if (!confirmed) return;

  state.orders = state.orders.filter((item) => item.id !== orderId);
  saveOrders();
  renderOrders();
  renderClientsTable();
  renderVehiclesTable();
}

function printOrderPdf(orderId) {
  const order = getOrderById(orderId);
  if (!order) return;

  const clientName = [order.client?.name, order.client?.lastName].filter(Boolean).join(' ') || 'Cliente sin nombre';
  const vehicleName = [order.vehicle?.brand, order.vehicle?.model, order.vehicle?.year].filter(Boolean).join(' ') || 'Vehículo sin detalle';
  const items = Array.isArray(order.items) ? order.items : [];
  const labor = items.filter((item) => item.type === 'labor');
  const parts = items.filter((item) => item.type === 'parts');

  const renderRows = (rows, typeLabel) => {
    if (!rows.length) {
      return '<tr><td colspan="4" class="muted">Sin registros.</td></tr>';
    }

    return rows.map((item) => {
      const total = Number(item.qty || 0) * Number(item.unitPrice || 0);
      return `
        <tr>
          <td>${typeLabel}</td>
          <td>${item.description || 'Sin descripción'}</td>
          <td>${Number(item.qty || 0)}</td>
          <td>${money(total)}</td>
        </tr>
      `;
    }).join('');
  };

  const laborTotal = labor.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.unitPrice || 0), 0);
  const partsTotal = parts.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.unitPrice || 0), 0);
  const grandTotal = laborTotal + partsTotal;

  const printWindow = window.open('', '_blank', 'width=900,height=900');
  if (!printWindow) {
    window.alert('El navegador bloqueó la ventana de impresión. Permite ventanas emergentes para generar el PDF.');
    return;
  }

  printWindow.document.write(`<!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Presupuesto OT-${String(order.number || '').padStart(4, '0')}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111827; margin: 32px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #d1d5db; padding-bottom: 16px; margin-bottom: 24px; }
          .company { font-size: 12px; line-height: 1.5; }
          .title { font-size: 28px; font-weight: 700; margin: 0; }
          .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
          .box { border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; }
          .box h3 { margin: 0 0 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; }
          table { width: 100%; border-collapse: collapse; margin-top: 14px; }
          th, td { border: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; font-size: 12px; }
          th { background: #f3f4f6; }
          .totals { margin-top: 18px; width: 280px; margin-left: auto; }
          .totals-row { display: flex; justify-content: space-between; padding: 8px 0; border-top: 1px solid #e5e7eb; font-size: 13px; }
          .totals-row.total { font-size: 18px; font-weight: 700; }
          .muted { color: #6b7280; font-style: italic; }
          @media print { body { margin: 0; } button { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="company">
              <strong>Taller Motos</strong><br />
              Presupuesto / Cotización
            </div>
          </div>
          <div>
            <p class="title">Presupuesto OT-${String(order.number || '').padStart(4, '0')}</p>
          </div>
        </div>

        <div class="meta">
          <div class="box">
            <h3>Cliente</h3>
            <div>${clientName}</div>
            <div>${order.client?.dni || ''}</div>
            <div>${order.client?.phone || ''}</div>
            <div>${order.client?.email || ''}</div>
          </div>
          <div class="box">
            <h3>Vehículo</h3>
            <div>${vehicleName}</div>
            <div>Patente: ${order.vehicle?.plate || 'Sin patente'}</div>
            <div>VIN: ${order.vehicle?.vin || 'Sin VIN'}</div>
            <div>KM: ${order.vehicle?.km || 'Sin kilometraje'}</div>
          </div>
        </div>

        <div class="box">
          <h3>Detalle del servicio</h3>
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Cant.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${renderRows(labor, 'Mano de obra')}
              ${renderRows(parts, 'Repuesto')}
            </tbody>
          </table>
        </div>

        <div class="totals">
          <div class="totals-row"><span>Mano de obra</span><strong>${money(laborTotal)}</strong></div>
          <div class="totals-row"><span>Repuestos</span><strong>${money(partsTotal)}</strong></div>
          <div class="totals-row total"><span>Total</span><strong>${money(grandTotal)}</strong></div>
        </div>
      </body>
    </html>`);

  printWindow.document.close();
  setTimeout(() => printWindow.focus(), 200);
  setTimeout(() => printWindow.print(), 400);
}

function handleListClick(event) {
  const action = event.target.dataset.action;
  const orderId = event.target.dataset.orderId;

  if (action === 'open-order' && orderId) {
    openModalForOrder(orderId);
    return;
  }

  if (action === 'pdf-order' && orderId) {
    printOrderPdf(orderId);
    return;
  }
}

function handleSummaryClick(event) {
  const filterButton = event.target.closest('[data-order-filter]');
  if (!filterButton) return;

  applyOrderFilter(filterButton.dataset.orderFilter);
}

function applyOrderFilter(filterName) {
  state.orderFilter = filterName;

  document.querySelectorAll('.summary-card[data-order-filter]').forEach((card) => {
    const isActive = card.dataset.orderFilter === filterName;
    card.classList.toggle('active', isActive);
  });

  renderOrders();
}

function handleItemActions(event) {
  const action = event.target.dataset.action;
  const itemId = event.target.dataset.itemId;

  if (action === 'remove-item' && itemId) {
    const itemsContainer = document.getElementById('itemsContainer');
    const itemRow = itemsContainer.querySelector(`[data-item-id="${itemId}"]`);
    if (itemRow) {
      const stockItemId = itemRow.dataset.stockItemId;
      const qtyToRestore = Number(itemRow.querySelector('.item-qty')?.value || 0);

      if (stockItemId) {
        const stockItem = state.stock.find((entry) => entry.id === stockItemId);
        if (stockItem) {
          stockItem.quantity = Number(stockItem.quantity || 0) + qtyToRestore;
          saveStock();
          renderStockTable();
        }
      }

      itemRow.remove();
      updateTotals();
    }
    return;
  }
}

function addItemRow() {
  const itemsContainer = document.getElementById('itemsContainer');
  const newRow = document.createElement('div');
  newRow.className = 'item-row';
  newRow.dataset.itemId = generateId();
  newRow.innerHTML = `
    <select class="item-type">
      <option value="labor" selected>Mano de obra</option>
      <option value="parts">Repuesto</option>
    </select>
    <input class="item-description" type="text" placeholder="Descripción" value="" />
    <input class="item-qty" type="number" min="1" step="1" value="1" />
    <input class="item-price" type="number" min="0" step="1" value="0" />
    <button class="icon-btn danger" type="button" data-action="remove-item" data-item-id="${newRow.dataset.itemId}">×</button>
  `;

  itemsContainer.appendChild(newRow);
  newRow.querySelectorAll('input, select').forEach((field) => {
    field.addEventListener('input', updateTotals);
    field.addEventListener('change', updateTotals);
  });

  updateTotals();
}

function renderStockTable() {
  const stockTableBody = document.getElementById('stockTableBody');
  const stockTotalValue = document.getElementById('stockTotalValue');
  const totalStockAmount = state.stock.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0), 0);

  if (stockTotalValue) {
    stockTotalValue.textContent = money(totalStockAmount);
  }

  const searchValue = state.stockSearch.trim().toLowerCase();
  const columnFilters = state.stockFilters;

  const filteredItems = state.stock.filter((item) => {
    const matchesSearch = !searchValue || String(item.code || '').toLowerCase().includes(searchValue);
    const matchesColumnFilters = Object.entries(columnFilters).every(([key, filterValue]) => {
      if (!filterValue) return true;
      const itemValue = String(item[key] ?? '').toLowerCase();
      return itemValue.includes(String(filterValue).toLowerCase());
    });

    return matchesSearch && matchesColumnFilters;
  });

  if (!filteredItems.length) {
    stockTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-table">No hay piezas en stock.</td>
      </tr>
    `;
    return;
  }

  stockTableBody.innerHTML = filteredItems.map((item) => `
    <tr>
      <td>${item.code || '—'}</td>
      <td>${item.brand || '—'}</td>
      <td>${item.model || '—'}</td>
      <td>${item.displacement || '—'}</td>
      <td>${item.part || '—'}</td>
      <td>${item.quantity || 0}</td>
      <td>${money(item.price || 0)}</td>
      <td class="table-actions">
        <button class="secondary-btn small-btn" type="button" data-stock-add="${item.id}">Agregar</button>
        <button class="secondary-btn small-btn" type="button" data-stock-edit="${item.id}">Editar</button>
        <button class="icon-btn danger" type="button" data-stock-delete="${item.id}">×</button>
      </td>
    </tr>
  `).join('');

  const stockSelector = document.getElementById('stockSelector');
  if (stockSelector) {
    stockSelector.innerHTML = `
      <option value="">Seleccione una pieza</option>
      ${filteredItems.map((item) => `
        <option value="${item.id}">
          ${item.code || 'Sin código'} · ${item.brand || '—'} / ${item.model || '—'} / ${item.part || '—'} (${item.quantity || 0} dispo.)
        </option>
      `).join('')}
    `;
  }
}

function getUniqueClients() {
  const map = new Map();

  state.orders.forEach((order) => {
    const client = order.client || {};
    const candidate = {
      orderId: order.id,
      name: String(client.name || '').trim(),
      lastName: String(client.lastName || '').trim(),
      dni: String(client.dni || '').trim(),
      rut: String(client.rut || '').trim(),
      phone: String(client.phone || '').trim(),
      email: String(client.email || '').trim(),
      address: String(client.address || '').trim()
    };

    const key = [candidate.dni, candidate.rut, `${candidate.name} ${candidate.lastName}`.trim()].find(Boolean) || `client-${Math.random()}`;
    if (!candidate.name && !candidate.lastName && !candidate.dni && !candidate.rut && !candidate.phone && !candidate.email) {
      return;
    }

    if (!map.has(key)) {
      map.set(key, candidate);
    }
  });

  return [...map.values()];
}

function renderClientsTable() {
  const clientsTableBody = document.getElementById('clientsTableBody');
  const clientsTotalValue = document.getElementById('clientsTotalValue');
  const clients = getUniqueClients();

  if (clientsTotalValue) {
    clientsTotalValue.textContent = String(clients.length);
  }

  const searchValue = state.clientSearch.trim().toLowerCase();
  const filters = state.clientFilters;

  const filteredClients = clients.filter((client) => {
    const combined = [client.name, client.lastName, client.dni, client.rut, client.phone, client.email].filter(Boolean).join(' ').toLowerCase();
    const matchesSearch = !searchValue || combined.includes(searchValue);
    const matchesFilters = Object.entries(filters).every(([key, filterValue]) => {
      if (!filterValue) return true;
      return String(client[key] || '').toLowerCase().includes(String(filterValue).toLowerCase());
    });

    return matchesSearch && matchesFilters;
  });

  if (!filteredClients.length) {
    clientsTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-table">No hay clientes registrados.</td>
      </tr>
    `;
    return;
  }

  clientsTableBody.innerHTML = filteredClients.map((client) => `
    <tr>
      <td>${client.name || '—'}</td>
      <td>${client.lastName || '—'}</td>
      <td>${client.dni || '—'}</td>
      <td>${client.rut || '—'}</td>
      <td>${client.phone || '—'}</td>
      <td>${client.email || '—'}</td>
      <td class="table-actions">
        <button class="secondary-btn small-btn" type="button" data-client-open="${client.orderId || ''}">Editar</button>
      </td>
    </tr>
  `).join('');
}

function getUniqueVehicles() {
  const map = new Map();

  state.orders.forEach((order) => {
    const vehicle = order.vehicle || {};
    const candidate = {
      orderId: order.id,
      brand: String(vehicle.brand || '').trim(),
      model: String(vehicle.model || '').trim(),
      year: String(vehicle.year || '').trim(),
      plate: String(vehicle.plate || '').trim(),
      vin: String(vehicle.vin || vehicle.chassis || '').trim(),
      fuel: String(vehicle.fuel || '').trim(),
      transmission: String(vehicle.transmission || '').trim()
    };

    const key = [candidate.plate, candidate.vin, `${candidate.brand} ${candidate.model}`.trim()].find(Boolean) || `vehicle-${Math.random()}`;
    if (!candidate.brand && !candidate.model && !candidate.plate && !candidate.vin && !candidate.fuel && !candidate.transmission) {
      return;
    }

    if (!map.has(key)) {
      map.set(key, candidate);
    }
  });

  return [...map.values()];
}

function renderVehiclesTable() {
  const vehiclesTableBody = document.getElementById('vehiclesTableBody');
  const vehiclesTotalValue = document.getElementById('vehiclesTotalValue');
  const vehicles = getUniqueVehicles();

  if (vehiclesTotalValue) {
    vehiclesTotalValue.textContent = String(vehicles.length);
  }

  const searchValue = state.vehicleSearch.trim().toLowerCase();
  const filters = state.vehicleFilters;

  const filteredVehicles = vehicles.filter((vehicle) => {
    const combined = [vehicle.brand, vehicle.model, vehicle.year, vehicle.plate, vehicle.vin, vehicle.fuel, vehicle.transmission].filter(Boolean).join(' ').toLowerCase();
    const matchesSearch = !searchValue || combined.includes(searchValue);
    const matchesFilters = Object.entries(filters).every(([key, filterValue]) => {
      if (!filterValue) return true;
      return String(vehicle[key] || '').toLowerCase().includes(String(filterValue).toLowerCase());
    });

    return matchesSearch && matchesFilters;
  });

  if (!filteredVehicles.length) {
    vehiclesTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-table">No hay vehículos registrados.</td>
      </tr>
    `;
    return;
  }

  vehiclesTableBody.innerHTML = filteredVehicles.map((vehicle) => `
    <tr>
      <td>${vehicle.brand || '—'}</td>
      <td>${vehicle.model || '—'}</td>
      <td>${vehicle.year || '—'}</td>
      <td>${vehicle.plate || '—'}</td>
      <td>${vehicle.vin || '—'}</td>
      <td>${vehicle.fuel || '—'}</td>
      <td>${vehicle.transmission || '—'}</td>
      <td class="table-actions">
        <button class="secondary-btn small-btn" type="button" data-vehicle-open="${vehicle.orderId || ''}">Editar</button>
      </td>
    </tr>
  `).join('');
}

function handleClientActionClick(event) {
  const button = event.target.closest('[data-client-open]');
  if (!button || !button.dataset.clientOpen) return;
  openModalForOrder(button.dataset.clientOpen);
}

function handleVehicleActionClick(event) {
  const button = event.target.closest('[data-vehicle-open]');
  if (!button || !button.dataset.vehicleOpen) return;
  openModalForOrder(button.dataset.vehicleOpen);
}

function handleStockSearchInput(event) {
  state.stockSearch = event.target.value;
  renderStockTable();
}

function handleStockColumnFilterInput(event) {
  const filterKey = event.target.dataset.filter;
  if (!filterKey) return;
  state.stockFilters[filterKey] = event.target.value;
  renderStockTable();
}

function handleClientSearchInput(event) {
  state.clientSearch = event.target.value;
  renderClientsTable();
}

function handleClientColumnFilterInput(event) {
  const filterKey = event.target.dataset.filter;
  if (!filterKey) return;
  state.clientFilters[filterKey] = event.target.value;
  renderClientsTable();
}

function handleVehicleSearchInput(event) {
  state.vehicleSearch = event.target.value;
  renderVehiclesTable();
}

function handleVehicleColumnFilterInput(event) {
  const filterKey = event.target.dataset.filter;
  if (!filterKey) return;
  state.vehicleFilters[filterKey] = event.target.value;
  renderVehiclesTable();
}

function clearStockFilters() {
  state.stockSearch = '';
  Object.keys(state.stockFilters).forEach((key) => {
    state.stockFilters[key] = '';
  });

  const stockSearchInput = document.getElementById('stockSearchInput');
  if (stockSearchInput) {
    stockSearchInput.value = '';
  }

  document.querySelectorAll('.stock-filter-input').forEach((input) => {
    input.value = '';
  });
}

function renderView(viewName) {
  if (state.currentView === 'stock' && viewName !== 'stock') {
    clearStockFilters();
    renderStockTable();
  }

  state.currentView = viewName;

  const title = document.querySelector('.topbar h1');
  if (title) {
    const labels = {
      orders: 'Órdenes',
      agenda: 'Agenda',
      stock: 'Stock',
      clients: 'Clientes',
      vehicles: 'Vehículos'
    };
    title.textContent = labels[viewName] || 'Gestión';
  }

  const newOrderButton = document.getElementById('newOrderBtn');
  if (newOrderButton) {
    const isOrdersView = viewName === 'orders';
    newOrderButton.style.visibility = isOrdersView ? 'visible' : 'hidden';
    newOrderButton.style.opacity = isOrdersView ? '1' : '0';
    newOrderButton.style.pointerEvents = isOrdersView ? 'auto' : 'none';
  }

  const summaryBar = document.getElementById('summaryBar');
  if (summaryBar) {
    const hideSummaryBar = ['agenda', 'stock', 'clients', 'vehicles'].includes(viewName);
    summaryBar.style.display = hideSummaryBar ? 'none' : 'grid';
  }

  const views = ['orders', 'agenda', 'stock', 'clients', 'vehicles'];
  views.forEach((view) => {
    const panel = document.getElementById(`${view}View`);
    const button = document.querySelector(`.nav-btn[data-view="${view}"]`);

    if (panel) {
      panel.classList.toggle('active', view === viewName);
      panel.classList.toggle('hidden-view', view !== viewName);
    }

    if (button) {
      button.classList.toggle('active', view === viewName);
    }
  });

  if (viewName === 'agenda') {
    renderAgenda();
  }
}

function renderAgenda() {
  const agendaGrid = document.getElementById('agendaGrid');
  const weekLabel = document.getElementById('agendaWeekLabel');

  if (!agendaGrid || !weekLabel) return;

  const slots = getAgendaSlots();
  const weekDates = getWeekDates(state.agendaWeekStart);
  const startDate = weekDates[0];
  const endDate = weekDates[weekDates.length - 1];
  const visibleRange = `${formatDisplayDate(startDate)} – ${formatDisplayDate(endDate)}`;
  weekLabel.textContent = `Semana del ${visibleRange}`;

  const renderDayColumn = (date) => {
    const key = formatDateKey(date);
    const appointments = state.appointments.filter((appointment) => appointment.date === key);
    const dayName = new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(date);
    const dayNumber = new Intl.DateTimeFormat('es-ES', { day: 'numeric' }).format(date);
    const isToday = key === formatDateKey(new Date());

    const slotMarkup = slots.map((slot) => `
      <button
        type="button"
        class="agenda-slot"
        data-date="${key}"
        data-time="${slot.value}"
        aria-label="Agendar turno el ${formatLongDate(date)} a las ${slot.value}"
      ></button>
    `).join('');

    const appointmentMarkup = appointments.map((appointment) => {
      const startMinutes = timeToMinutes(appointment.time);
      const startOffsetMinutes = Math.max(0, startMinutes - 8 * 60);
      const top = (startOffsetMinutes / 15) * 24 + 4;
      const height = Math.max((Number(appointment.duration || 60) / 15) * 24 - 6, 24);
      const typeConfig = APPOINTMENT_TYPES[appointment.type] || APPOINTMENT_TYPES.servicio;

      return `
        <button
          type="button"
          class="appointment-block"
          data-appointment-id="${appointment.id}"
          data-type="${appointment.type}"
          style="top: ${top}px; height: ${height}px; background: ${typeConfig.soft}; border-color: ${typeConfig.color}; color: ${typeConfig.color};"
          title="${appointment.client} · ${appointment.vehicle}"
        >
          <strong>${appointment.client || 'Sin cliente'}</strong>
          <small>${appointment.vehicle || 'Sin vehículo'}</small>
          <small>${appointment.time} · ${APPOINTMENT_TYPES[appointment.type]?.label || 'Servicio'}</small>
        </button>
      `;
    }).join('');

    return `
      <div class="agenda-day-column ${isToday ? 'today' : ''}" data-date="${key}">
        <div class="agenda-header-cell ${isToday ? 'today' : ''}">
          <strong>${dayName}</strong>
          <span>${dayNumber}</span>
        </div>
        ${slotMarkup}
        ${appointmentMarkup}
      </div>
    `;
  };

  agendaGrid.innerHTML = `
    <div class="agenda-time-column">
      <div class="agenda-header-cell"></div>
      ${slots.map((slot) => `<div class="agenda-time-slot">${slot.label}</div>`).join('')}
    </div>
    ${weekDates.map(renderDayColumn).join('')}
  `;
}

function fillAppointmentForm(appointment = null) {
  const defaultDate = appointment?.date || formatDateKey(state.agendaWeekStart);
  const defaultTime = appointment?.time || '09:00';

  document.getElementById('appointmentId').value = appointment?.id || '';
  document.getElementById('appointmentDate').value = defaultDate;
  document.getElementById('appointmentType').value = appointment?.type || 'servicio';
  document.getElementById('appointmentTime').value = defaultTime;
  document.getElementById('appointmentDuration').value = String(appointment?.duration || 60);
  document.getElementById('appointmentClient').value = appointment?.client || '';
  document.getElementById('appointmentVehicle').value = appointment?.vehicle || '';
  document.getElementById('appointmentNotes').value = appointment?.notes || '';
}

function openAppointmentModal(appointmentId = null, date = null, time = null) {
  const appointment = appointmentId ? state.appointments.find((entry) => entry.id === appointmentId) || null : null;
  const modal = document.getElementById('appointmentModal');

  if (appointment) {
    fillAppointmentForm(appointment);
    document.getElementById('appointmentModalTitle').textContent = 'Editar turno';
  } else {
    const presetDate = date || formatDateKey(new Date());
    const presetTime = time || '09:00';
    document.getElementById('appointmentModalTitle').textContent = 'Nuevo turno';
    document.getElementById('appointmentId').value = '';
    document.getElementById('appointmentDate').value = presetDate;
    document.getElementById('appointmentType').value = 'servicio';
    document.getElementById('appointmentTime').value = presetTime;
    document.getElementById('appointmentDuration').value = '60';
    document.getElementById('appointmentClient').value = '';
    document.getElementById('appointmentVehicle').value = '';
    document.getElementById('appointmentNotes').value = '';
  }

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  document.getElementById('appointmentClient').focus();
}

function closeAppointmentModal() {
  const modal = document.getElementById('appointmentModal');
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  document.getElementById('appointmentForm').reset();
  document.getElementById('appointmentId').value = '';
}

function saveAppointment(event) {
  event.preventDefault();

  const payload = normalizeAppointment({
    id: document.getElementById('appointmentId').value || generateId(),
    date: document.getElementById('appointmentDate').value,
    time: document.getElementById('appointmentTime').value,
    duration: Number(document.getElementById('appointmentDuration').value || 60),
    type: document.getElementById('appointmentType').value,
    client: document.getElementById('appointmentClient').value.trim(),
    vehicle: document.getElementById('appointmentVehicle').value.trim(),
    notes: document.getElementById('appointmentNotes').value.trim()
  });

  if (!payload.date || !payload.time || !payload.client || !payload.vehicle) {
    alert('Completa cliente, vehículo, fecha y hora para guardar el turno.');
    return;
  }

  const index = state.appointments.findIndex((entry) => entry.id === payload.id);
  if (index >= 0) {
    state.appointments[index] = payload;
  } else {
    state.appointments.push(payload);
  }

  saveAppointments();
  renderAgenda();
  closeAppointmentModal();
}

function deleteAppointment(appointmentId) {
  const appointment = state.appointments.find((entry) => entry.id === appointmentId);
  if (!appointment) return;

  if (window.confirm(`¿Eliminar el turno de ${appointment.client} (${appointment.time})?`)) {
    state.appointments = state.appointments.filter((entry) => entry.id !== appointmentId);
    saveAppointments();
    renderAgenda();
  }
}

function handleAgendaClick(event) {
  const appointmentBlock = event.target.closest('.appointment-block');
  if (appointmentBlock) {
    const appointmentId = appointmentBlock.dataset.appointmentId;
    openAppointmentModal(appointmentId);
    return;
  }

  const slot = event.target.closest('.agenda-slot');
  if (slot) {
    openAppointmentModal(null, slot.dataset.date, slot.dataset.time);
    return;
  }

  const weekButton = event.target.closest('[data-week-change]');
  if (weekButton) {
    const direction = Number(weekButton.dataset.weekChange === 'next' ? 1 : -1);
    state.agendaWeekStart = addDays(state.agendaWeekStart, direction * 7);
    renderAgenda();
  }
}

function handleAgendaContextMenu(event) {
  const block = event.target.closest('.appointment-block');
  if (!block) return;
  event.preventDefault();
  deleteAppointment(block.dataset.appointmentId);
}

function handleAppointmentFormButton(event) {
  const button = event.target.closest('[data-week-change]');
  if (!button) return;
  const direction = button.dataset.weekChange === 'next' ? 1 : -1;
  state.agendaWeekStart = addDays(state.agendaWeekStart, direction * 7);
  renderAgenda();
}

function handleStockSubmit(event) {
  event.preventDefault();

  const stockEditId = document.getElementById('stockEditId').value;
  const nextEntry = normalizeStockItem({
    id: stockEditId || generateId(),
    code: document.getElementById('stockCode').value.trim(),
    brand: document.getElementById('stockBrand').value.trim(),
    model: document.getElementById('stockModel').value.trim(),
    displacement: document.getElementById('stockDisplacement').value.trim(),
    part: document.getElementById('stockPart').value.trim(),
    quantity: Number(document.getElementById('stockQuantity').value || 0),
    price: Number(document.getElementById('stockPrice').value || 0)
  });

  if (!nextEntry.brand || !nextEntry.model || !nextEntry.part) return;

  if (stockEditId) {
    state.stock = state.stock.map((item) => (item.id === stockEditId ? nextEntry : item));
  } else {
    state.stock.push(nextEntry);
  }

  saveStock();
  renderStockTable();
  resetStockForm();
  document.getElementById('stockCode').focus();
}

function resetStockForm() {
  const stockForm = document.getElementById('stockForm');
  if (stockForm) stockForm.reset();
  document.getElementById('stockEditId').value = '';
  document.getElementById('stockQuantity').value = 1;
  document.getElementById('stockPrice').value = 0;
  document.getElementById('stockSubmitBtn').textContent = 'Agregar stock';
  document.getElementById('stockCancelEditBtn').classList.add('hidden');
}

function fillStockForm(item) {
  document.getElementById('stockEditId').value = item.id;
  document.getElementById('stockCode').value = item.code || '';
  document.getElementById('stockBrand').value = item.brand || '';
  document.getElementById('stockModel').value = item.model || '';
  document.getElementById('stockDisplacement').value = item.displacement || '';
  document.getElementById('stockPart').value = item.part || '';
  document.getElementById('stockQuantity').value = Number(item.quantity || 0);
  document.getElementById('stockPrice').value = Number(item.price || 0);
  document.getElementById('stockSubmitBtn').textContent = 'Guardar cambios';
  document.getElementById('stockCancelEditBtn').classList.remove('hidden');
}

function handleStockDelete(event) {
  const button = event.target.closest('[data-stock-delete]');
  if (!button) return;

  const id = button.dataset.stockDelete;
  state.stock = state.stock.filter((item) => item.id !== id);
  saveStock();
  renderStockTable();
}

function handleStockEdit(event) {
  const button = event.target.closest('[data-stock-edit]');
  if (!button) return;

  const id = button.dataset.stockEdit;
  const item = state.stock.find((entry) => entry.id === id);
  if (item) {
    fillStockForm(item);
    document.getElementById('stockBrand').focus();
  }
}

function openStockQuickAdd(itemId) {
  const item = state.stock.find((entry) => entry.id === itemId);
  if (!item) return;

  const modal = document.getElementById('stockQuickAddModal');
  const idInput = document.getElementById('stockQuickAddId');
  const qtyInput = document.getElementById('stockQuickAddQty');
  const priceInput = document.getElementById('stockQuickAddPrice');
  const title = document.getElementById('stockQuickAddTitle');

  idInput.value = item.id;
  qtyInput.value = 1;
  priceInput.value = '';
  title.textContent = `Agregar piezas · ${item.brand || '—'} ${item.model || '—'} ${item.part || ''}`.trim();

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  qtyInput.focus();
}

function closeStockQuickAdd() {
  const modal = document.getElementById('stockQuickAddModal');
  if (!modal) return;

  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  document.getElementById('stockQuickAddForm').reset();
  document.getElementById('stockQuickAddId').value = '';
}

function handleStockQuickAddSubmit(event) {
  event.preventDefault();

  const itemId = document.getElementById('stockQuickAddId').value;
  const qtyToAdd = Number(document.getElementById('stockQuickAddQty').value || 0);
  const nextPriceRaw = document.getElementById('stockQuickAddPrice').value;

  if (!itemId || qtyToAdd <= 0) {
    alert('Ingresá una cantidad válida para sumar al stock.');
    return;
  }

  const item = state.stock.find((entry) => entry.id === itemId);
  if (!item) {
    alert('La pieza seleccionada ya no existe.');
    return;
  }

  item.quantity = Number(item.quantity || 0) + qtyToAdd;

  if (nextPriceRaw !== '') {
    const nextPrice = Number(nextPriceRaw);
    if (!Number.isNaN(nextPrice) && nextPrice >= 0) {
      item.price = nextPrice;
    }
  }

  saveStock();
  renderStockTable();
  closeStockQuickAdd();
}

function addStockItemToOrder() {
  const stockSelector = document.getElementById('stockSelector');
  const stockQtyInput = document.getElementById('stockQuantitySelector');
  const selectedId = stockSelector.value;
  const requestedQty = Number(stockQtyInput.value || 0);

  if (!selectedId || requestedQty <= 0) {
    alert('Selecciona un repuesto y una cantidad válida.');
    return;
  }

  const stockItem = state.stock.find((item) => item.id === selectedId);
  if (!stockItem) {
    alert('El repuesto seleccionado ya no existe en stock.');
    return;
  }

  if (requestedQty > Number(stockItem.quantity || 0)) {
    alert(`Solo quedan ${stockItem.quantity} unidades de este repuesto en stock.`);
    return;
  }

  const itemRow = document.createElement('div');
  itemRow.className = 'item-row';
  itemRow.dataset.itemId = generateId();
  itemRow.dataset.stockItemId = stockItem.id;
  itemRow.innerHTML = `
    <select class="item-type">
      <option value="labor">Mano de obra</option>
      <option value="parts" selected>Repuesto</option>
    </select>
    <input class="item-description" type="text" value="${(stockItem.part || '').replace(/"/g, '&quot;')}" />
    <input class="item-qty" type="number" min="1" step="1" value="${requestedQty}" />
    <input class="item-price" type="number" min="0" step="1" value="${Number(stockItem.price || 0)}" />
    <button class="icon-btn danger" type="button" data-action="remove-item" data-item-id="${itemRow.dataset.itemId}">×</button>
  `;

  stockItem.quantity = Number(stockItem.quantity || 0) - requestedQty;
  saveStock();
  renderStockTable();

  document.getElementById('itemsContainer').appendChild(itemRow);
  itemRow.querySelectorAll('input, select').forEach((field) => {
    field.addEventListener('input', updateTotals);
    field.addEventListener('change', updateTotals);
  });
  updateTotals();
  stockSelector.value = '';
  stockQtyInput.value = 1;
}

function bindEvents() {
  document.getElementById('newOrderBtn').addEventListener('click', () => {
    resetForm();
    openModalForOrder();
  });

  document.getElementById('newAppointmentBtn').addEventListener('click', () => {
    openAppointmentModal();
  });

  document.getElementById('closeAppointmentModalBtn').addEventListener('click', closeAppointmentModal);
  document.getElementById('cancelAppointmentBtn').addEventListener('click', closeAppointmentModal);
  document.getElementById('appointmentForm').addEventListener('submit', saveAppointment);
  document.getElementById('agendaGrid').addEventListener('click', handleAgendaClick);
  document.getElementById('agendaGrid').addEventListener('contextmenu', handleAgendaContextMenu);
  document.querySelectorAll('[data-week-change]').forEach((button) => {
    button.addEventListener('click', handleAppointmentFormButton);
  });

  document.getElementById('vehicleSearch').addEventListener('input', applyLiveAutocomplete);
  document.getElementById('clientSearch').addEventListener('input', applyLiveAutocomplete);

  document.getElementById('searchVehicleBtn').addEventListener('click', () => {
    const vehicleMatch = findVehicleByChassis(document.getElementById('vehicleSearch').value);
    if (!vehicleMatch) {
      alert('No se encontró un vehículo con ese chasis o VIN guardado.');
      return;
    }

    fillVehicleFromMatch(vehicleMatch);
  });

  document.getElementById('searchClientBtn').addEventListener('click', () => {
    const clientMatch = findClientByDni(document.getElementById('clientSearch').value || document.getElementById('clientDni').value || document.getElementById('clientRut').value);
    if (!clientMatch) {
      alert('No se encontró un cliente con ese DNI o RUT guardado.');
      return;
    }

    fillClientFromMatch(clientMatch);
  });

  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  document.getElementById('cancelOrderBtn').addEventListener('click', closeModal);
  document.getElementById('addItemBtn').addEventListener('click', addItemRow);
  document.getElementById('addStockItemBtn').addEventListener('click', addStockItemToOrder);
  document.getElementById('orderForm').addEventListener('submit', saveOrder);
  document.getElementById('summaryBar').addEventListener('click', handleSummaryClick);
  document.getElementById('ordersList').addEventListener('click', handleListClick);
  document.getElementById('itemsContainer').addEventListener('click', handleItemActions);
  document.getElementById('itemsContainer').addEventListener('input', updateTotals);
  document.getElementById('itemsContainer').addEventListener('change', updateTotals);
  document.getElementById('stockForm').addEventListener('submit', handleStockSubmit);
  document.getElementById('stockCancelEditBtn').addEventListener('click', resetStockForm);
  document.getElementById('stockSearchInput').addEventListener('input', handleStockSearchInput);
  document.querySelectorAll('.stock-filter-input').forEach((input) => {
    input.addEventListener('input', handleStockColumnFilterInput);
  });
  document.getElementById('clientSearchInput').addEventListener('input', handleClientSearchInput);
  document.querySelectorAll('.client-filter-input').forEach((input) => {
    input.addEventListener('input', handleClientColumnFilterInput);
  });
  document.getElementById('vehicleSearchInput').addEventListener('input', handleVehicleSearchInput);
  document.querySelectorAll('.vehicle-filter-input').forEach((input) => {
    input.addEventListener('input', handleVehicleColumnFilterInput);
  });
  document.addEventListener('click', (event) => {
    const navButton = event.target.closest('.nav-btn');
    if (navButton) {
      renderView(navButton.dataset.view);
    }

    if (event.target.closest('[data-client-open]')) {
      handleClientActionClick(event);
    }

    if (event.target.closest('[data-vehicle-open]')) {
      handleVehicleActionClick(event);
    }

    if (event.target.closest('[data-stock-add]')) {
      openStockQuickAdd(event.target.closest('[data-stock-add]').dataset.stockAdd);
    }

    if (event.target.closest('[data-stock-edit]')) {
      handleStockEdit(event);
    }

    if (event.target.closest('[data-stock-delete]')) {
      handleStockDelete(event);
    }

    if (event.target.closest('[data-close-stock-add]')) {
      closeStockQuickAdd();
    }
  });

  document.getElementById('stockQuickAddForm').addEventListener('submit', handleStockQuickAddSubmit);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeModal();
      closeAppointmentModal();
      closeStockQuickAdd();
    }
  });

  document.getElementById('ordersList').addEventListener('dblclick', (event) => {
    const card = event.target.closest('.order-card');
    if (card) {
      openModalForOrder(card.dataset.orderId);
    }
  });
}

function init() {
  bindThemePicker();
  renderView('orders');
  renderOrders();
  renderStockTable();
  renderClientsTable();
  renderVehiclesTable();
  renderAgenda();
  bindEvents();
  resetForm();
}

window.addEventListener('DOMContentLoaded', init);
