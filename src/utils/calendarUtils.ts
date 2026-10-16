/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * EduPlata - Utilidades de Calendario y Pagos Programados
 * Generación de enlaces de Google Calendar, archivos .ics con alarmas (VALARM) y proyecciones.
 */

import { ScheduledPayment } from '../types';

/**
 * Formatea una fecha YYYY-MM-DD a formato YYYYMMDD para calendarios
 */
export function formatDateToCalendarString(dateStr: string): string {
  return dateStr.replace(/-/g, '');
}

/**
 * Calcula la fecha del día siguiente en formato YYYYMMDD
 */
export function getNextDayCalendarString(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr.replace(/-/g, '');
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

/**
 * Genera el enlace directo a Google Calendar según la especificación
 * https://calendar.google.com/calendar/render?action=TEMPLATE&text={descripcion}%20-%20${monto}&dates={AAAAMMDD}/{AAAAMMDD+1}&details=Pago%20registrado%20desde%20EduPlata
 */
export function generateGoogleCalendarUrl(payment: ScheduledPayment): string {
  const start = formatDateToCalendarString(payment.dueDate);
  const end = getNextDayCalendarString(payment.dueDate);
  const title = `${payment.description} - $${payment.amount.toLocaleString('es-CO')}`;
  const details = `Pago registrado desde EduPlata. Categoría: ${payment.category || 'General'}`;

  let url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${end}&details=${encodeURIComponent(details)}`;

  if (payment.recurrence === 'mensual') {
    url += '&recur=RRULE:FREQ=MONTHLY';
  } else if (payment.recurrence === 'semanal') {
    url += '&recur=RRULE:FREQ=WEEKLY';
  }

  return url;
}

/**
 * Genera el contenido del archivo .ics estándar RFC 5545 con alarma VALARM
 */
export function generateICSContent(payment: ScheduledPayment): string {
  const start = formatDateToCalendarString(payment.dueDate);
  const end = getNextDayCalendarString(payment.dueDate);
  const title = `${payment.description} - $${payment.amount.toLocaleString('es-CO')}`;
  const daysBefore = Math.max(1, payment.reminderDaysBefore || 1);

  let rrule = '';
  if (payment.recurrence === 'mensual') {
    rrule = 'RRULE:FREQ=MONTHLY\r\n';
  } else if (payment.recurrence === 'semanal') {
    rrule = 'RRULE:FREQ=WEEKLY\r\n';
  }

  const nowString = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const uid = `eduplata-${payment.id}-${Date.now()}@eduplata.app`;

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EduPlata//Finanzas Universitarias Colombia//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowString}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:Pago programado desde EduPlata. Monto: $${payment.amount.toLocaleString('es-CO')} COP. Categoria: ${payment.category}`,
    rrule ? rrule.trim() : null,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    `TRIGGER:-P${daysBefore}D`,
    'ACTION:DISPLAY',
    `DESCRIPTION:Recordatorio de pago EduPlata: ${payment.description} ($${payment.amount.toLocaleString('es-CO')})`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean);

  return icsLines.join('\r\n');
}

/**
 * Descarga directamente un archivo .ics en el navegador
 */
export function downloadICSFile(payment: ScheduledPayment) {
  const content = generateICSContent(payment);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = payment.description.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  link.download = `eduplata_pago_${safeName}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Calcula los días de diferencia entre hoy y una fecha YYYY-MM-DD
 */
export function getDaysDifference(dueDateStr: string): number {
  const [y, m, d] = dueDateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Retorna etiqueta humana de vencimiento
 */
export function formatDueBadge(dueDateStr: string): { text: string; colorClass: string; isUrgent: boolean } {
  const days = getDaysDifference(dueDateStr);

  if (days < 0) {
    return {
      text: `Venció hace ${Math.abs(days)} día${Math.abs(days) > 1 ? 's' : ''}`,
      colorClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/40',
      isUrgent: true
    };
  }
  if (days === 0) {
    return {
      text: '¡Vence hoy!',
      colorClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/40 font-bold',
      isUrgent: true
    };
  }
  if (days === 1) {
    return {
      text: 'Vence mañana',
      colorClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/40',
      isUrgent: true
    };
  }
  if (days <= 7) {
    return {
      text: `En ${days} días`,
      colorClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-900/40',
      isUrgent: false
    };
  }
  return {
    text: `En ${days} días`,
    colorClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800',
    isUrgent: false
  };
}

/**
 * Calcula la siguiente fecha para un pago recurrente cuando ya fue pagado
 */
export function getNextRecurringDate(currentDueDate: string, recurrence: 'semanal' | 'mensual'): string {
  const [y, m, d] = currentDueDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);

  if (recurrence === 'semanal') {
    date.setDate(date.getDate() + 7);
  } else if (recurrence === 'mensual') {
    date.setMonth(date.getMonth() + 1);
  }

  const newY = date.getFullYear();
  const newM = String(date.getMonth() + 1).padStart(2, '0');
  const newD = String(date.getDate()).padStart(2, '0');
  return `${newY}-${newM}-${newD}`;
}

/**
 * Calcula el total de pagos en los próximos 15 días
 */
export function getNext15DaysPaymentsSummary(payments: ScheduledPayment[], currentBalance: number) {
  const upcoming = payments
    .filter(p => !p.isPaid)
    .filter(p => {
      const diff = getDaysDifference(p.dueDate);
      return diff >= 0 && diff <= 15;
    });

  const totalAmount = upcoming.reduce((sum, p) => sum + p.amount, 0);
  const shortfall = Math.max(0, totalAmount - currentBalance);
  const hasShortfall = shortfall > 0;

  return {
    upcomingCount: upcoming.length,
    totalAmount,
    shortfall,
    hasShortfall,
    currentBalance
  };
}
