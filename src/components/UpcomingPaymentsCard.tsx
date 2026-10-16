/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * EduPlata - Tarjeta en el Inicio: "Próximos pagos"
 * Muestra los 3 pagos más cercanos, el total de los próximos 15 días,
 * y compara contra el saldo actual mostrando alerta en rojo si falta plata.
 */

import React from 'react';
import { 
  Calendar, 
  ArrowRight, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Repeat,
  CalendarDays
} from 'lucide-react';
import { ScheduledPayment } from '../types';
import { formatCOP } from '../utils/formatters';
import { formatDueBadge, getDaysDifference } from '../utils/calendarUtils';

interface UpcomingPaymentsCardProps {
  payments: ScheduledPayment[];
  currentBalance: number;
  onNavigateToCalendar: () => void;
  onPayPayment: (payment: ScheduledPayment) => void;
}

export const UpcomingPaymentsCard: React.FC<UpcomingPaymentsCardProps> = ({
  payments,
  currentBalance,
  onNavigateToCalendar,
  onPayPayment
}) => {
  // Filtrar pendientes y ordenar por fecha más cercana
  const unpaidPayments = payments
    .filter((p) => !p.isPaid)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  // Los 3 más cercanos
  const next3Payments = unpaidPayments.slice(0, 3);

  // Pagos en los próximos 15 días
  const next15DaysPayments = unpaidPayments.filter((p) => {
    const diff = getDaysDifference(p.dueDate);
    return diff >= 0 && diff <= 15;
  });

  const totalNext15Days = next15DaysPayments.reduce((sum, p) => sum + p.amount, 0);
  const shortfall = Math.max(0, totalNext15Days - currentBalance);
  const isShortfall = shortfall > 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-5">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <span>Próximos Pagos</span>
              <span className="text-xs bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-bold px-2 py-0.5 rounded-full">
                {unpaidPayments.length} pendientes
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Compromisos futuros y vencimientos del mes
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToCalendar}
          className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1 transition-colors cursor-pointer group"
        >
          <span>Ver calendario</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* BANNER DE BALANCE VS PRÓXIMOS 15 DÍAS */}
      <div
        className={`p-4 rounded-2xl border transition-all ${
          isShortfall
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-xl shrink-0 mt-0.5 ${
              isShortfall ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
            }`}
          >
            {isShortfall ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          </div>

          <div className="flex-1 text-xs">
            {isShortfall ? (
              <div>
                <p className="font-extrabold text-sm text-rose-600 dark:text-rose-400">
                  Te faltan {formatCOP(shortfall)} para cubrir tus pagos de los próximos 15 días.
                </p>
                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  Vienen compromisos por <strong>{formatCOP(totalNext15Days)}</strong> y tu saldo actual en bolsillo es de <strong>{formatCOP(currentBalance)}</strong>. Procura reservar plata o moderar gastos en ocio.
                </p>
              </div>
            ) : (
              <div>
                <p className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                  ¡Vas bien! Tienes saldo suficiente para cubrir tus pagos de los próximos 15 días.
                </p>
                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  Compromisos próximos: <strong>{formatCOP(totalNext15Days)}</strong> vs Saldo actual: <strong>{formatCOP(currentBalance)}</strong>. Te quedará un colchón de <strong>{formatCOP(currentBalance - totalNext15Days)}</strong>.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LISTA DE LOS 3 PAGOS MÁS CERCANOS */}
      {next3Payments.length === 0 ? (
        <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs space-y-1">
          <CalendarDays className="w-6 h-6 mx-auto text-slate-400 mb-1" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">No tienes pagos futuros programados</p>
          <p>Usa el Chat rápido para escribir "el 30 pago arriendo 650k" y quedará aquí registrado.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {next3Payments.map((p) => {
            const dueBadge = formatDueBadge(p.dueDate);

            return (
              <div
                key={p.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 hover:border-purple-300 dark:hover:border-purple-800/80 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                        {p.description}
                      </h4>
                      {p.recurrence !== 'ninguna' && (
                        <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.2 rounded-md font-medium">
                          {p.recurrence}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span>{p.category}</span>
                      <span>•</span>
                      <span>{p.dueDate}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${dueBadge.colorClass}`}>
                      {dueBadge.text}
                    </span>
                    <p className="font-extrabold text-sm sm:text-base font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                      {formatCOP(p.amount)}
                    </p>
                  </div>

                  {/* Botón rápido "Ya lo pagué" */}
                  <button
                    onClick={() => onPayPayment(p)}
                    className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all cursor-pointer shadow-xs hover:scale-105"
                    title="Marcar como pagado hoy (registra gasto real)"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer link */}
      <div className="pt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
        <span>Sincroniza con Google Calendar y .ics</span>
        <button
          onClick={onNavigateToCalendar}
          className="font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
        >
          Gestionar en Calendario →
        </button>
      </div>

    </div>
  );
};
