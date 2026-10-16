/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Modal para configurar el Presupuesto Mensual y límites de categorías
 */

import React, { useState, useEffect } from 'react';
import { X, Check, BarChart3, AlertCircle } from 'lucide-react';
import { BudgetConfig, ExpenseCategoryId } from '../types';
import { EXPENSE_CATEGORIES } from '../utils/categories';
import { formatCOP } from '../utils/formatters';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget: BudgetConfig;
  onSaveBudget: (newBudget: BudgetConfig) => void;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  budget,
  onSaveBudget
}) => {
  const [monthlyLimitStr, setMonthlyLimitStr] = useState('');
  const [categoryLimits, setCategoryLimits] = useState<Record<ExpenseCategoryId, string>>({
    comida: '',
    transporte: '',
    fotocopias: '',
    matricula: '',
    ocio: '',
    suscripciones: '',
    vivienda: '',
    salud: '',
    otros: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMonthlyLimitStr(budget.monthlyExpenseLimit ? budget.monthlyExpenseLimit.toString() : '');
      const catMap: Record<ExpenseCategoryId, string> = {} as any;
      Object.keys(EXPENSE_CATEGORIES).forEach((k) => {
        const key = k as ExpenseCategoryId;
        const val = budget.categoryLimits[key] || 0;
        catMap[key] = val > 0 ? val.toString() : '';
      });
      setCategoryLimits(catMap);
      setError('');
    }
  }, [isOpen, budget]);

  if (!isOpen) return null;

  const handleCategoryChange = (catId: ExpenseCategoryId, val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    setCategoryLimits((prev) => ({
      ...prev,
      [catId]: clean
    }));
  };

  const handleQuickGlobalLimit = (val: number) => {
    setMonthlyLimitStr(val.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const globalLimit = parseInt(monthlyLimitStr.replace(/[^0-9]/g, ''), 10) || 0;

    const newCatLimits: Record<ExpenseCategoryId, number> = {} as any;
    let sumCats = 0;
    Object.keys(EXPENSE_CATEGORIES).forEach((k) => {
      const key = k as ExpenseCategoryId;
      const strVal = categoryLimits[key] || '';
      const parsed = parseInt(strVal.replace(/[^0-9]/g, ''), 10) || 0;
      newCatLimits[key] = parsed;
      sumCats += parsed;
    });

    if (globalLimit > 0 && sumCats > globalLimit) {
      setError(
        `Los gastos específicos (${formatCOP(sumCats)}) superan el presupuesto total definido (${formatCOP(globalLimit)}). Por favor ajusta los valores para no excederlo.`
      );
      return;
    }

    onSaveBudget({
      ...budget,
      monthlyExpenseLimit: globalLimit,
      categoryLimits: newCatLimits
    });

    onClose();
  };

  const globalLimit = parseInt(monthlyLimitStr.replace(/[^0-9]/g, ''), 10) || 0;
  const totalSpecificExpenses = Object.values(categoryLimits).reduce((acc, str) => {
    return acc + (parseInt(str.replace(/[^0-9]/g, ''), 10) || 0);
  }, 0);

  const isOverBudget = globalLimit > 0 && totalSpecificExpenses > globalLimit;
  const exceededAmount = totalSpecificExpenses - globalLimit;
  const remainingBudget = Math.max(0, globalLimit - totalSpecificExpenses);
  const allocatedPct = globalLimit > 0 ? Math.round((totalSpecificExpenses / globalLimit) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700">
              <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Definir Presupuesto y Límites
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Fija cuánto planeas gastar en el mes para mantener tus cuentas bajo control
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          
          {/* Límite mensual global */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Límite Total de Gastos del Mes (COP) *
              </label>
              {globalLimit > 0 && (
                <span className="text-[11px] font-medium text-slate-400">
                  Tope máximo mensual
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400 font-mono">
                $
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={monthlyLimitStr ? parseInt(monthlyLimitStr.replace(/[^0-9]/g, ''), 10).toLocaleString('es-CO') : ''}
                onChange={(e) => {
                  setMonthlyLimitStr(e.target.value.replace(/[^0-9]/g, ''));
                  setError('');
                }}
                placeholder="700.000"
                autoFocus
                className="w-full pl-10 pr-4 py-3 text-2xl font-bold font-mono bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[11px] text-slate-400 flex items-center mr-1">Sugerencias:</span>
              <button
                type="button"
                onClick={() => { handleQuickGlobalLimit(400000); setError(''); }}
                className="text-xs px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                $400.000
              </button>
              <button
                type="button"
                onClick={() => { handleQuickGlobalLimit(700000); setError(''); }}
                className="text-xs px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                $700.000
              </button>
              <button
                type="button"
                onClick={() => { handleQuickGlobalLimit(1000000); setError(''); }}
                className="text-xs px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                $1.000.000
              </button>
              <button
                type="button"
                onClick={() => { handleQuickGlobalLimit(0); setError(''); }}
                className="text-xs px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                $0 (Sin límite)
              </button>
            </div>
          </div>

          {/* Resumen de Asignación y Control de Límite */}
          {globalLimit > 0 && (
            <div className={`p-4 rounded-2xl border transition-all ${
              isOverBudget 
                ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900' 
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
            }`}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span>Asignación de categorías:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatCOP(totalSpecificExpenses)}
                  </span>
                  <span className="text-slate-400 font-normal">de</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatCOP(globalLimit)}
                  </span>
                </span>
                <span className={`font-mono font-bold ${
                  isOverBudget 
                    ? 'text-rose-600 dark:text-rose-400' 
                    : allocatedPct > 90 
                    ? 'text-amber-600 dark:text-amber-400' 
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {allocatedPct}%
                </span>
              </div>

              {/* Barra de progreso */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isOverBudget
                      ? 'bg-rose-500'
                      : allocatedPct > 90
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, allocatedPct)}%` }}
                />
              </div>

              {/* Indicador de estado */}
              <div className="flex items-center justify-between text-[11px]">
                {isOverBudget ? (
                  <div className="text-rose-700 dark:text-rose-300 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>¡Supera el presupuesto total por {formatCOP(exceededAmount)}!</span>
                  </div>
                ) : (
                  <span className="text-slate-500 dark:text-slate-400">
                    {remainingBudget === 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        ✓ Presupuesto asignado al 100% exactamente
                      </span>
                    ) : (
                      <span>Disponible sin asignar: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{formatCOP(remainingBudget)}</strong></span>
                    )}
                  </span>
                )}

                {isOverBudget && (
                  <button
                    type="button"
                    onClick={() => {
                      setMonthlyLimitStr(totalSpecificExpenses.toString());
                      setError('');
                    }}
                    className="text-xs text-rose-700 dark:text-rose-300 underline font-semibold hover:text-rose-900 transition-colors"
                  >
                    Ajustar total a {formatCOP(totalSpecificExpenses)}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Si no hay presupuesto global pero sí gastos específicos */}
          {globalLimit === 0 && totalSpecificExpenses > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs flex items-center justify-between gap-2">
              <span className="text-amber-800 dark:text-amber-200">
                Has asignado {formatCOP(totalSpecificExpenses)} en categorías específicas sin un total mensual.
              </span>
              <button
                type="button"
                onClick={() => {
                  setMonthlyLimitStr(totalSpecificExpenses.toString());
                  setError('');
                }}
                className="font-bold underline text-amber-900 dark:text-amber-100 shrink-0"
              >
                Fijar total en {formatCOP(totalSpecificExpenses)}
              </button>
            </div>
          )}

          {/* Alerta de bloqueo */}
          {isOverBudget && (
            <div className="p-3 rounded-2xl bg-rose-100/80 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Bloqueo de seguridad:</strong>
                Los gastos específicos no pueden superar el total del presupuesto definido. Reduce las categorías o amplía el límite total para poder guardar.
              </div>
            </div>
          )}

          {/* Límites por categoría */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Límites por categoría de gasto (COP)
              </label>
              <span className="text-[11px] text-slate-400">
                Suma: <strong className="font-mono text-slate-700 dark:text-slate-300">{formatCOP(totalSpecificExpenses)}</strong>
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.values(EXPENSE_CATEGORIES).map((cat) => {
                const catId = cat.id as ExpenseCategoryId;
                const currentVal = categoryLimits[catId] || '';
                const numVal = parseInt(currentVal, 10) || 0;
                const catPctOfTotal = globalLimit > 0 && numVal > 0 
                  ? Math.round((numVal / globalLimit) * 100) 
                  : 0;

                return (
                  <div
                    key={cat.id}
                    className={`p-3 rounded-2xl border transition-colors flex items-center justify-between gap-2 ${
                      numVal > 0 && globalLimit > 0 && numVal > globalLimit
                        ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl shrink-0">{cat.emoji}</span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                          {cat.name}
                        </span>
                        {catPctOfTotal > 0 && (
                          <span className="text-[10px] text-slate-400 block">
                            {catPctOfTotal}% del presupuesto
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="relative w-28 shrink-0">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                        $
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={numVal > 0 ? numVal.toLocaleString('es-CO') : ''}
                        onChange={(e) => {
                          handleCategoryChange(catId, e.target.value);
                          setError('');
                        }}
                        placeholder="0"
                        className="w-full pl-6 pr-2 py-1.5 text-xs font-bold font-mono bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-500 text-right"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isOverBudget}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                isOverBudget
                  ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed opacity-70'
                  : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 shadow-sm cursor-pointer'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Guardar Presupuesto</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
