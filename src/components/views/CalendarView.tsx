/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * EduPlata - Pestaña Calendario de Pagos Programados
 * Vista de calendario mensual interactivo, lista de próximos pagos,
 * botones 'Ya lo pagué', 'Agregar a Google Calendar' y descarga de archivo .ics con alarma VALARM.
 */

import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  CheckCircle2, 
  CalendarPlus, 
  Download, 
  Clock, 
  Trash2, 
  Bell, 
  BellRing, 
  AlertTriangle, 
  Check, 
  X,
  Repeat
} from 'lucide-react';
import { ScheduledPayment, Transaction, PaymentRecurrence, CategoryId } from '../../types';
import { formatCOP } from '../../utils/formatters';
import { getCategoryInfo } from '../../utils/categories';
import { 
  generateGoogleCalendarUrl, 
  downloadICSFile, 
  formatDueBadge, 
  getNextRecurringDate, 
  getDaysDifference 
} from '../../utils/calendarUtils';

interface CalendarViewProps {
  payments: ScheduledPayment[];
  onAddPayment: (payment: Omit<ScheduledPayment, 'id' | 'createdAt'>) => void;
  onUpdatePayment: (payment: ScheduledPayment) => void;
  onDeletePayment: (paymentId: string) => void;
  onPayPayment: (payment: ScheduledPayment) => void;
  currentBalance: number;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  payments,
  onAddPayment,
  onUpdatePayment,
  onDeletePayment,
  onPayPayment,
  currentBalance
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default';
  });

  // Formulario nuevo pago programado
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState('Vivienda');
  const [newDueDate, setNewDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newRecurrence, setNewRecurrence] = useState<PaymentRecurrence>('mensual');
  const [newReminderDays, setNewReminderDays] = useState('1');

  // Pedir permiso de notificaciones de navegador
  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);
      if (permission === 'granted') {
        new Notification('EduPlata Recordatorios', {
          body: '¡Listo! Te avisaremos cuando tus pagos programados estén por vencer.',
          icon: '/favicon.ico'
        });
      }
    }
  };

  // Navegación de meses
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Días del mes
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Domingo
  // Ajustar para lunes = 0
  const startOffset = (firstDayOfWeek + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Mapeo de pagos por día del mes
  const paymentsByDate: Record<string, ScheduledPayment[]> = {};
  payments.forEach((p) => {
    if (!paymentsByDate[p.dueDate]) paymentsByDate[p.dueDate] = [];
    paymentsByDate[p.dueDate].push(p);
  });

  // Ordenar todos los pagos cronológicamente (pendientes primero)
  const sortedPayments = [...payments].sort((a, b) => {
    if (a.isPaid && !b.isPaid) return 1;
    if (!a.isPaid && b.isPaid) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });

  // Próximos pagos no pagados
  const upcomingPayments = sortedPayments.filter((p) => !p.isPaid);

  // Pagos en los próximos 15 días
  const next15DaysPayments = upcomingPayments.filter((p) => {
    const diff = getDaysDifference(p.dueDate);
    return diff >= 0 && diff <= 15;
  });
  const totalNext15Days = next15DaysPayments.reduce((sum, p) => sum + p.amount, 0);
  const shortfall = Math.max(0, totalNext15Days - currentBalance);

  const handleSaveNewPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(newAmount.replace(/[^0-9]/g, ''), 10);
    if (!newDesc.trim() || !amountNum || amountNum <= 0) return;

    onAddPayment({
      description: newDesc.trim(),
      amount: amountNum,
      category: newCategory,
      categoryId: newCategory.toLowerCase().includes('vivienda') ? 'vivienda' : 'otros',
      dueDate: newDueDate,
      recurrence: newRecurrence,
      reminderDaysBefore: parseInt(newReminderDays, 10) || 1
    });

    setNewDesc('');
    setNewAmount('');
    setIsCreateModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER DE LA SECCIÓN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Calendario de Pagos
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Controla arriendos, suscripciones y cuotas futuras sin afectar tu saldo actual
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {notificationStatus !== 'granted' && (
            <button
              onClick={requestNotificationPermission}
              className="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              title="Activar notificaciones de recordatorio en tu navegador"
            >
              <Bell className="w-4 h-4 text-purple-500" />
              <span>Activar recordatorios</span>
            </button>
          )}

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-md shadow-purple-600/30 flex items-center gap-2 transition-all cursor-pointer hover:scale-102"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nuevo pago</span>
          </button>
        </div>
      </div>

      {/* BANNER DE PRÓXIMOS 15 DÍAS */}
      <div
        className={`p-5 rounded-3xl border transition-all ${
          shortfall > 0
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-100'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`p-2.5 rounded-2xl mt-0.5 ${
                shortfall > 0
                  ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                  : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {shortfall > 0 ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="font-bold text-base">
                {shortfall > 0
                  ? 'Alerta de Pagos Próximos (15 días)'
                  : 'Pagos Cubiertos para los Próximos 15 Días'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                {shortfall > 0 ? (
                  <>
                    Tienes <strong>{next15DaysPayments.length} pago{next15DaysPayments.length > 1 ? 's' : ''}</strong> por un total de{' '}
                    <strong className="font-mono">{formatCOP(totalNext15Days)}</strong>. Tu saldo en bolsillo es{' '}
                    <span className="font-mono">{formatCOP(currentBalance)}</span>.
                    <span className="block font-bold text-rose-600 dark:text-rose-400 mt-1">
                      Te faltan {formatCOP(shortfall)} para cubrir tus pagos de los próximos 15 días.
                    </span>
                  </>
                ) : (
                  <>
                    Tienes <strong>{next15DaysPayments.length} pago{next15DaysPayments.length > 1 ? 's' : ''}</strong> en los próximos 15 días por{' '}
                    <strong className="font-mono">{formatCOP(totalNext15Days)}</strong>. Tu saldo actual en bolsillo cubre estos compromisos con tranquilidad.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-slate-200 dark:sm:border-slate-800 sm:pl-6">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
              Total compromisos (15 días)
            </span>
            <span
              className={`text-xl font-extrabold font-mono ${
                shortfall > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {formatCOP(totalNext15Days)}
            </span>
          </div>
        </div>
      </div>

      {/* GRID PRINCIPAL: CALENDARIO MENSUAL + LISTA DE PRÓXIMOS PAGOS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMNA CALENDARIO MENSUAL (7 COLS EN DESKTOP) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          
          {/* Navegador de Mes */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 capitalize">
              {monthNames[month]} {year}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Mes anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Hoy
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Mes siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 dark:text-slate-500 py-1">
            <span>Lun</span>
            <span>Mar</span>
            <span>Mié</span>
            <span>Jue</span>
            <span>Vie</span>
            <span>Sáb</span>
            <span>Dom</span>
          </div>

          {/* Celdas del calendario */}
          <div className="grid grid-cols-7 gap-1">
            {/* Espacios vacíos antes del primer día */}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="h-16 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30" />
            ))}

            {/* Días del mes */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayPayments = paymentsByDate[dateStr] || [];
              const hasPayments = dayPayments.length > 0;
              const isToday = new Date().toISOString().slice(0, 10) === dateStr;
              const isSelected = selectedDateStr === dateStr;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDateStr(isSelected ? null : dateStr)}
                  className={`h-16 p-1.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative ${
                    isSelected
                      ? 'border-purple-500 bg-purple-500/10 shadow-sm'
                      : isToday
                      ? 'border-emerald-500/60 bg-emerald-500/5'
                      : 'border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-emerald-500 text-white'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {hasPayments && (
                      <span className="w-2 h-2 rounded-full bg-purple-500 ring-2 ring-white dark:ring-slate-900" />
                    )}
                  </div>

                  {/* Indicadores de pago */}
                  {hasPayments && (
                    <div className="overflow-hidden">
                      <span className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400 block truncate">
                        {formatCOP(dayPayments[0].amount)}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Detalle del día seleccionado */}
          {selectedDateStr && (
            <div className="mt-4 p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-purple-900 dark:text-purple-200">
                  Pagos programados para el {selectedDateStr}:
                </h4>
                <button
                  onClick={() => setSelectedDateStr(null)}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                >
                  Cerrar
                </button>
              </div>

              {(paymentsByDate[selectedDateStr] || []).length > 0 ? (
                <div className="space-y-2">
                  {(paymentsByDate[selectedDateStr] || []).map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-purple-200 dark:border-purple-800"
                    >
                      <div>
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                          {p.description}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {p.category} • {p.recurrence}
                        </span>
                      </div>
                      <span className="font-mono font-extrabold text-sm text-purple-600 dark:text-purple-400">
                        {formatCOP(p.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  No hay pagos programados para este día.
                </p>
              )}
            </div>
          )}
        </div>

        {/* COLUMNA LISTA DE PRÓXIMOS PAGOS (5 COLS EN DESKTOP) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>Próximos Pagos</span>
              <span className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-mono">
                {upcomingPayments.length}
              </span>
            </h2>
          </div>

          {upcomingPayments.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                ¡Al día con tus pagos!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                No tienes pagos futuros pendientes. Puedes programar uno escribiendo en el Chat rápido o pulsando "+ Nuevo pago".
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingPayments.map((p) => {
                const dueBadge = formatDueBadge(p.dueDate);
                const gCalUrl = generateGoogleCalendarUrl(p);

                return (
                  <div
                    key={p.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-4 space-y-3 hover:border-purple-300 dark:hover:border-purple-800/80 transition-colors"
                  >
                    {/* Header del Pago */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            {p.description}
                          </h3>
                          {p.recurrence !== 'ninguna' && (
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                              <Repeat className="w-2.5 h-2.5 text-purple-500" />
                              {p.recurrence}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{p.category}</span>
                          <span>•</span>
                          <span>Vence: {p.dueDate}</span>
                        </span>
                      </div>

                      <div className="text-right">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${dueBadge.colorClass}`}>
                          {dueBadge.text}
                        </span>
                        <p className="font-extrabold text-base font-mono text-slate-900 dark:text-slate-100 mt-1">
                          {formatCOP(p.amount)}
                        </p>
                      </div>
                    </div>

                    {/* BOTONES DE ACCIÓN (YA LO PAGUÉ, GOOGLE CALENDAR, DESCARGAR .ICS) */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                      
                      {/* Botón: Ya lo pagué */}
                      <button
                        onClick={() => onPayPayment(p)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        title="Registra como gasto real hoy y programa el siguiente si es recurrente"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        Ya lo pagué
                      </button>

                      {/* Botón: Agregar a Google Calendar */}
                      <a
                        href={gCalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        title="Abrir en Google Calendar"
                      >
                        <CalendarPlus className="w-3.5 h-3.5 text-sky-500" />
                        <span className="hidden sm:inline">Google Calendar</span>
                        <span className="sm:hidden">GCal</span>
                      </a>

                      {/* Botón: Descargar .ics con VALARM */}
                      <button
                        onClick={() => downloadICSFile(p)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        title="Descargar archivo .ics para iPhone, Mac o Outlook con alarma"
                      >
                        <Download className="w-3.5 h-3.5 text-purple-500" />
                        .ics
                      </button>

                      {/* Eliminar pago */}
                      <button
                        onClick={() => onDeletePayment(p.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors ml-auto cursor-pointer"
                        title="Eliminar este pago programado"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODAL CREAR NUEVO PAGO PROGRAMADO */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-purple-500" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Programar Pago Futuro
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewPayment} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Descripción (ej: Arriendo, Spotify, Cuota U)
                </label>
                <input
                  type="text"
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Ej: Pago de arriendo pieza"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Monto en COP ($)
                </label>
                <input
                  type="number"
                  required
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="650000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Categoría
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                  >
                    <option value="Vivienda">Vivienda</option>
                    <option value="Suscripciones">Suscripciones</option>
                    <option value="Matrícula y U">Matrícula y U</option>
                    <option value="Transporte">Transporte</option>
                    <option value="Comida">Comida</option>
                    <option value="Salud">Salud</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Fecha Vencimiento
                  </label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Recurrencia
                  </label>
                  <select
                    value={newRecurrence}
                    onChange={(e) => setNewRecurrence(e.target.value as PaymentRecurrence)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                  >
                    <option value="ninguna">Única vez</option>
                    <option value="mensual">Mensual (cada mes)</option>
                    <option value="semanal">Semanal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Avisar con anticipación
                  </label>
                  <select
                    value={newReminderDays}
                    onChange={(e) => setNewReminderDays(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                  >
                    <option value="1">1 día antes</option>
                    <option value="2">2 días antes</option>
                    <option value="3">3 días antes</option>
                    <option value="5">5 días antes</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  Guardar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
