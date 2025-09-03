import React, { useState, useEffect } from 'react';
import moment from 'moment';
import 'moment/locale/es';
// Importar el layout específico del consultor
import ConsultorLayout from '../../components/ConsultorLayout';
// Ruta para el CSS de esta página
import '../../styles/consultor-payment.css';
// Importa tu hook de autenticación si necesitas el ID del consultor para filtrar pagos
// import { useAuth } from '../../context/AuthContext';

moment.locale('es');

const ConsultorPaymentPage = () => {
  // const { currentUser } = useAuth(); // Obtener el usuario actual para filtrar pagos
  const [allEvents, setAllEvents] = useState([]); // Lista completa de eventos con info de pago
  const [filteredEvents, setFilteredEvents] = useState([]); // Eventos filtrados por mes/año
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para el resumen de pagos (ahora por mes seleccionado)
  const [monthlyTotalHours, setMonthlyTotalHours] = useState(0);
  const [monthlyPaidAmount, setMonthlyPaidAmount] = useState(0);
  const [monthlyPendingAmount, setMonthlyPendingAmount] = useState(0);

  // Estados para la selección de mes y año
  const [selectedMonth, setSelectedMonth] = useState(moment().format('YYYY-MM')); // Formato YYYY-MM

  // TODO: Implementar la carga real de eventos con información de pago
  useEffect(() => {
    const fetchConsultorPayments = async () => {
      setLoading(true);
      setError(null);
      try {
        // Aquí deberías hacer la llamada a tu API para obtener los eventos
        // asignados a este consultor que sean relevantes para pagos.
        // Asegúrate de que la API devuelva campos como:
        // id, title, start, end, nroHorasPagarDocente, valorTotalPagarDocente,
        // isPaid (boolean), paidDate (Date | null), estadoActividad (para filtrar por finalizados/pagados)
        // const consultorId = currentUser?.id;
        // const response = await fetch(`/api/payments?consultorId=${consultorId}`); // Ejemplo de endpoint
        // if (!response.ok) throw new Error('Error al cargar la información de pagos');
        // const data = await response.json();
        // setAllEvents(data.map(event => ({
        //    ...event,
        //    start: new Date(event.start),
        //    end: new Date(event.end),
        //    paidDate: event.paidDate ? new Date(event.paidDate) : null, // Convertir fecha de pago
        // })));

        // Simular carga de datos
        await new Promise(resolve => setTimeout(resolve, 500));

        // Datos mock (simulados) con información de pago, incluyendo eventos de diferentes meses
        const mockEvents = [
           {
              id: 'pay-event-2025-05-1',
              title: 'Taller de Innovación (Pagado)',
              start: moment('2025-05-15T09:00:00').toDate(),
              end: moment('2025-05-15T12:00:00').toDate(),
              nroHorasPagarDocente: 3,
              valorTotalPagarDocente: 270000, // 3 * 90000
              isPaid: true, // <-- Pagado
              paidDate: moment('2025-06-01').toDate(), // Fecha de pago
              estadoActividad: 'Finalizado', // Generalmente solo se pagan eventos finalizados
           },
            {
              id: 'pay-event-2025-05-2',
              title: 'Reunión de Estrategia (Pendiente)',
              start: moment('2025-05-20T14:00:00').toDate(),
              end: moment('2025-05-20T16:00:00').toDate(),
              nroHorasPagarDocente: 2,
              valorTotalPagarDocente: 200000, // 2 * 100000
              isPaid: false, // <-- Pendiente
              paidDate: null,
              estadoActividad: 'Finalizado',
           },
            {
              id: 'pay-event-2025-06-1',
              title: 'Seminario Marketing (Pagado)',
              start: moment('2025-06-05T10:00:00').toDate(),
              end: moment('2025-06-05T13:00:00').toDate(),
              nroHorasPagarDocente: 3,
              valorTotalPagarDocente: 255000, // 3 * 85000
              isPaid: true,
              paidDate: moment('2025-07-05').toDate(),
              estadoActividad: 'Finalizado',
           },
           {
              id: 'pay-event-2025-06-2',
              title: 'Entrenamiento Liderazgo (Pendiente)',
              start: moment('2025-06-10T15:00:00').toDate(),
              end: moment('2025-06-10T17:00:00').toDate(),
              nroHorasPagarDocente: 2,
              valorTotalPagarDocente: 180000, // 2 * 90000
              isPaid: false,
              paidDate: null,
              estadoActividad: 'Finalizado',
           },
            {
              id: 'pay-event-2025-06-3',
              title: 'Asesoría Plan Negocio (Pendiente)',
              start: moment('2025-06-18T09:30:00').toDate(),
              end: moment('2025-06-18T11:00:00').toDate(),
              nroHorasPagarDocente: 1.5,
              valorTotalPagarDocente: 127500, // 1.5 * 85000
              isPaid: false,
              paidDate: null,
              estadoActividad: 'Finalizado',
           },
           {
              id: 'pay-event-2025-07-1',
              title: 'Taller de Ventas (Pendiente)', // Este evento es en Julio
              start: moment('2025-07-01T09:00:00').toDate(),
              end: moment('2025-07-01T12:00:00').toDate(),
              nroHorasPagarDocente: 3,
              valorTotalPagarDocente: 270000, // 3 * 90000
              isPaid: false,
              paidDate: null,
              estadoActividad: 'Finalizado',
           },
            {
              id: 'pay-event-2025-07-2',
              title: 'Asesoría Finanzas (Pagado)', // Este evento es en Julio
              start: moment('2025-07-10T10:00:00').toDate(),
              end: moment('2025-07-10T11:30:00').toDate(),
              nroHorasPagarDocente: 1.5,
              valorTotalPagarDocente: 150000, // 1.5 * 100000
              isPaid: true,
              paidDate: moment('2025-08-10').toDate(),
              estadoActividad: 'Finalizado',
           },
            {
              id: 'pay-event-2025-04-1',
              title: 'Taller Pasado (Pagado)', // Evento en Abril
              start: moment('2025-04-20T10:00:00').toDate(),
              end: moment('2025-04-20T12:00:00').toDate(),
              nroHorasPagarDocente: 2,
              valorTotalPagarDocente: 180000,
              isPaid: true,
              paidDate: moment('2025-05-15').toDate(),
              estadoActividad: 'Finalizado',
           },
        ];

        // Filtrar solo eventos que sean relevantes para pagos (ej. estado Finalizado)
        // Mantendremos todos los eventos finalizados en allEvents para poder filtrar por mes
        const payableEvents = mockEvents.filter(event => event.estadoActividad === 'Finalizado');

        setAllEvents(payableEvents);
      } catch (err) {
        setError('Hubo un error al cargar la información de pagos.');
        console.error('Error fetching payments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConsultorPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [/* Dependencia del ID del consultor si filtras por él */]); // Añadir dependencia si usas currentUser.id

  // Efecto para filtrar eventos y calcular totales por mes seleccionado
  useEffect(() => {
    const startOfMonth = moment(selectedMonth, 'YYYY-MM').startOf('month');
    const endOfMonth = moment(selectedMonth, 'YYYY-MM').endOf('month');

    // Filtrar eventos cuya fecha de inicio esté dentro del mes seleccionado
    const eventsInSelectedMonth = allEvents.filter(event =>
      moment(event.start).isBetween(startOfMonth, endOfMonth, null, '[]')
    );

    setFilteredEvents(eventsInSelectedMonth);

    // Calcular totales solo para los eventos filtrados (del mes seleccionado)
    let monthlyHours = 0;
    let monthlyPaid = 0;
    let monthlyPending = 0;

    eventsInSelectedMonth.forEach(event => {
         monthlyHours += event.nroHorasPagarDocente || 0;
         if (event.isPaid) {
             monthlyPaid += event.valorTotalPagarDocente || 0;
         } else {
             monthlyPending += event.valorTotalPagarDocente || 0;
         }
    });

    setMonthlyTotalHours(monthlyHours);
    setMonthlyPaidAmount(monthlyPaid);
    setMonthlyPendingAmount(monthlyPending);

  }, [allEvents, selectedMonth]); // Depende de todos los eventos y del mes seleccionado

  // Generar opciones de mes y año para el selector
  const generateMonthYearOptions = () => {
      const options = [];
      const startYear = moment().subtract(2, 'years').year(); // Por ejemplo, 2 años atrás
      const endYear = moment().add(1, 'year').year(); // Hasta 1 año adelante

      for (let year = startYear; year <= endYear; year++) {
          for (let month = 0; month < 12; month++) {
              const monthMoment = moment({ year: year, month: month });
              options.push({
                  value: monthMoment.format('YYYY-MM'),
                  label: monthMoment.format('MMMM YYYY'), // Nombre del mes y año
              });
          }
      }
      // Ordenar las opciones de más reciente a más antiguo
      return options.sort((a, b) => moment(b.value).valueOf() - moment(a.value).valueOf());
  };

  const monthYearOptions = generateMonthYearOptions();


  // Función para formatear valores de moneda para mostrar en UI
  const formatCurrency = (amount) => {
      if (amount === null || amount === undefined) return '$ 0';
      // Usar toLocaleString para formato de moneda colombiana
      return `$ ${amount.toLocaleString('es-CO')}`;
  };

   // Función para formatear valores de moneda para CSV (sin símbolos, solo número)
  const formatCurrencyForCSV = (amount) => {
       if (amount === null || amount === undefined) return '0';
       // Quitar símbolos y usar punto como separador decimal si es necesario
       return amount.toString().replace(/\./g, ','); // Reemplazar punto por coma si tu Excel usa coma decimal
  };


  // Función para manejar la descarga del soporte (CSV mejorado)
  const handleDownloadSupport = () => {
      // Filtrar eventos PENDIENTES de pago para el mes seleccionado
      const pendingEventsInMonth = filteredEvents.filter(event => !event.isPaid);

      if (pendingEventsInMonth.length === 0) {
          alert(`No hay eventos pendientes de pago para ${moment(selectedMonth, 'YYYY-MM').format('MMMM YYYY')} para generar un soporte.`);
          return;
      }

      // Crear contenido CSV con mejor estructura
      let csvContent = "";

      // Añadir título y mes/año
      csvContent += `"Reporte de Pagos Pendientes - ${moment(selectedMonth, 'YYYY-MM').format('MMMM YYYY')}"\n\n`;

      // Añadir resumen del mes
      csvContent += `"Resumen del Mes"\n`;
      csvContent += `"Total Horas Dictadas",${monthlyTotalHours}\n`;
      csvContent += `"Total Pendiente de Pago",${formatCurrencyForCSV(monthlyPendingAmount)}\n\n`; // Usar formato CSV para moneda

      // Añadir encabezado de la tabla de eventos
      csvContent += `"Detalle de Eventos Pendientes"\n`;
      csvContent += `"ID","Título","Fecha","Hora Inicio","Hora Fin","Horas Programadas Pago","Valor Total a Pagar","Estado de Pago"\n`; // Cabecera de columnas

      // Añadir filas de datos de eventos
      pendingEventsInMonth.forEach(event => {
          const id = event.id;
          const title = `"${event.title.replace(/"/g, '""')}"`; // Escapar comillas dobles
          const date = moment(event.start).format('DD/MM/YYYY');
          const startTime = moment(event.start).format('HH:mm');
          const endTime = moment(event.end).format('HH:mm');
          const hours = event.nroHorasPagarDocente;
          const value = formatCurrencyForCSV(event.valorTotalPagarDocente); // Usar formato CSV para moneda
          const paymentStatus = event.isPaid ? 'Pagado' : 'Pendiente'; // Estado de pago

          csvContent += `${id},${title},${date},${startTime},${endTime},${hours},${value},${paymentStatus}\n`;
      });


      // Crear un Blob del contenido CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

      // Crear una URL para el Blob
      const url = URL.createObjectURL(blob);

      // Crear un enlace temporal y hacer clic en él para descargar
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `soporte_pagos_pendientes_${moment(selectedMonth, 'YYYY-MM').format('YYYY_MM')}.csv`); // Nombre del archivo con mes/año
      link.style.visibility = 'hidden'; // Ocultar el enlace
      document.body.appendChild(link); // Añadirlo al DOM temporalmente
      link.click(); // Simular clic

      // Limpiar el enlace temporal y la URL del Blob
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log(`Descarga simulada del soporte de pagos pendientes para ${selectedMonth}.`);
      // En una aplicación real, aquí harías una llamada a tu API para obtener el archivo
      // fetch(`/api/download-payment-support?consultorId=${currentUser?.id}&month=${selectedMonth}`, { headers: { 'Accept': 'text/csv' } })
      // .then(response => response.blob())
      // .then(blob => {
      //     const url = URL.createObjectURL(blob);
      //     const link = document.createElement('a');
      //     link.href = url;
      //     link.download = `soporte_pago_${moment(selectedMonth, 'YYYY-MM').format('YYYY_MM')}.csv`; // Nombre del archivo
      //     link.click();
      //     URL.revokeObjectURL(url);
      // })
      // .catch(error => console.error('Error al descargar el soporte:', error));
  };


  if (loading) {
    return (
      <ConsultorLayout>
        <div className="consultor-payment-container">
          <p className="loading-message">Cargando información de pagos...</p>
        </div>
      </ConsultorLayout>
    );
  }

  if (error) {
    return (
      <ConsultorLayout>
        <div className="consultor-payment-container">
          <p className="error-message">{error}</p>
        </div>
      </ConsultorLayout>
    );
  }


  return (
    <ConsultorLayout>
      <div className="consultor-payment-container">
        <h2>Mi Historial de Pagos</h2>

        {/* Filtro de Mes/Año */}
        <div className="month-year-filter">
             <label htmlFor="month-year-select">Seleccionar Mes:</label>
             <select
                 id="month-year-select"
                 value={selectedMonth}
                 onChange={(e) => setSelectedMonth(e.target.value)}
             >
                 {monthYearOptions.map(option => (
                     <option key={option.value} value={option.value}>
                         {option.label}
                     </option>
                 ))}
             </select>
        </div>

        {/* Resumen de Pagos (Mensual) */}
        <div className="payment-summary">
            <h3>Resumen ({moment(selectedMonth, 'YYYY-MM').format('MMMM YYYY')})</h3> {/* Título dinámico */}
            <div className="summary-items">
                 <div className="summary-item">
                     <strong>Horas Dictadas:</strong> {/* Cambiado a "Horas Dictadas" para el mes */}
                     <span>{monthlyTotalHours} horas</span>
                 </div>
                 <div className="summary-item paid">
                     <strong>Total Pagado:</strong>
                     <span>{formatCurrency(monthlyPaidAmount)}</span>
                 </div>
                 <div className="summary-item pending">
                     <strong>Total Pendiente:</strong>
                     <span>{formatCurrency(monthlyPendingAmount)}</span>
                 </div>
                 {/* Puedes añadir el estimado mensual aquí si tienes esa lógica */}
            </div>
             {/* Botón de Descarga en el Resumen */}
             {/* Mostrar el botón solo si hay eventos pendientes en el mes seleccionado */}
             {monthlyPendingAmount > 0 && (
                 <button onClick={handleDownloadSupport} className="download-support-button">
                     Descargar Soporte Pagos Pendientes ({moment(selectedMonth, 'YYYY-MM').format('MMMM YYYY')})
                 </button>
             )}
        </div>

        {/* Lista de Eventos Pagados (del mes seleccionado) */}
        <div className="payment-list-section">
             <h3>Eventos Pagados ({moment(selectedMonth, 'YYYY-MM').format('MMMM YYYY')})</h3> {/* Título dinámico */}
             <ul className="payment-event-list">
                 {filteredEvents.filter(event => event.isPaid).length > 0 ? (
                     filteredEvents.filter(event => event.isPaid).map(event => (
                         <li key={event.id} className="payment-event-item paid">
                             <div className="event-title">{event.title}</div>
                             <div className="event-details">
                                 <span>{moment(event.start).format('DD/MM/YYYY HH:mm')}</span> {/* Mostrar fecha y hora */}
                                 <span>{event.nroHorasPagarDocente} horas</span>
                                 <span>{formatCurrency(event.valorTotalPagarDocente)}</span>
                                 {event.paidDate && (
                                     <span className="paid-date">Pagado: {moment(event.paidDate).format('DD/MM/YYYY')}</span>
                                 )}
                             </div>
                         </li>
                     ))
                 ) : (
                     <li className="no-payments">No hay eventos pagados en este mes.</li>
                 )}
             </ul>
        </div>

         {/* Lista de Eventos Pendientes de Pago (del mes seleccionado) */}
        <div className="payment-list-section">
             <h3>Eventos Pendientes de Pago ({moment(selectedMonth, 'YYYY-MM').format('MMMM YYYY')})</h3> {/* Título dinámico */}
             <ul className="payment-event-list">
                 {filteredEvents.filter(event => !event.isPaid).length > 0 ? (
                     filteredEvents.filter(event => !event.isPaid).map(event => (
                         <li key={event.id} className="payment-event-item pending">
                             <div className="event-title">{event.title}</div>
                             <div className="event-details">
                                  <span>{moment(event.start).format('DD/MM/YYYY HH:mm')}</span> {/* Mostrar fecha y hora */}
                                 <span>{event.nroHorasPagarDocente} horas</span>
                                 <span>{formatCurrency(event.valorTotalPagarDocente)}</span>
                             </div>
                         </li>
                     ))
                 ) : (
                     <li className="no-payments">No hay eventos pendientes de pago en este mes.</li>
                 )}
             </ul>
        </div>


        {/* Puedes añadir filtros adicionales aquí si lo deseas */}
        {/* <div className="payment-filters">
             <h4>Otros Filtros</h4>
             </div> */}

      </div>
    </ConsultorLayout>
  );
};

export default ConsultorPaymentPage;
