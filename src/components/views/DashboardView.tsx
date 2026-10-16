/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Vista de Dashboard / Inicio - EduPlata
 * Estilo sobrio, elegante y profesional.
 * - Saludo personalizado: "Hola [Nombre], vamos a organizar esa plata"
 * - Acceso a exportar datos en PDF o Excel
 * - Explicación clara de que la IA se conecta a los datos registrados del usuario
 * - Modificación de saldo, presupuesto, ingresos y gastos
 */

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  AlertTriangle, 
  Plus, 
  Sparkles, 
  ArrowRight, 
  Calendar,
  PieChart as PieIcon,
  BarChart3,
  Target,
  Edit3,
  FileText,
  FileSpreadsheet,
  Check,
  User,
  SlidersHorizontal,
  Bot
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { ActiveTab, BudgetConfig, MovementType, SavingsGoal, SemesterConfig, ScheduledPayment, Transaction, UserProfile } from '../../types';
import { formatCOP, formatDate } from '../../utils/formatters';
import { getCategoryInfo } from '../../utils/categories';
import { RunwayCard } from '../RunwayCard';
import { UpcomingPaymentsCard } from '../UpcomingPaymentsCard';
import { QuickChatBar } from '../QuickChatBar';

interface DashboardViewProps {
  transactions: Transaction[];
  budget: BudgetConfig;
  goals: SavingsGoal[];
  userProfile: UserProfile;
  semesterConfig: SemesterConfig;
  scheduledPayments?: ScheduledPayment[];
  onPayPayment?: (payment: ScheduledPayment) => void;
  onQuickChatMessage?: (msg: string) => void;
  onUpdateUserName?: (name: string) => void;
  onUpdateProfile?: (profile: Partial<UserProfile>) => void;
  onOpenAddModal: (defaultType?: MovementType) => void;
  onEditTransaction: (t: Transaction) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  hasApiKey: boolean;
  onOpenBalanceAdjustment: () => void;
  onOpenBudgetModal: () => void;
  onLoadSampleData: () => void;
  onResetToZeros: () => void;
  isShowingSampleData: boolean;
  onExportPDF: () => void;
  onExportExcel: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  budget,
  goals,
  userProfile,
  semesterConfig,
  scheduledPayments = [],
  onPayPayment,
  onQuickChatMessage,
  onUpdateUserName,
  onUpdateProfile,
  onOpenAddModal,
  onEditTransaction,
  onNavigateTab,
  hasApiKey,
  onOpenBalanceAdjustment,
  onOpenBudgetModal,
  onLoadSampleData,
  onResetToZeros,
  isShowingSampleData,
  onExportPDF,
  onExportExcel
}) => {
  // Estado para editar el perfil (nombre y universidad)
  const [isEditingProfile, setIsEditingProfile] = useState(!userProfile.name || !userProfile.university);
  const [nameInput, setNameInput] = useState(userProfile.name || '');
  const [universityInput, setUniversityInput] = useState(userProfile.university || '');

  React.useEffect(() => {
    setNameInput(userProfile.name || '');
    setUniversityInput(userProfile.university || '');
    if (userProfile.name && userProfile.university) {
      setIsEditingProfile(false);
    } else {
      setIsEditingProfile(true);
    }
  }, [userProfile.name, userProfile.university]);

  // Cálculos principales
  const { totalIncome, totalExpense, balance, budgetSpentPct, isOver80, isOver100 } = useMemo(() => {
    const inc = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const exp = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const bal = inc - exp;
    const spentPct = budget.monthlyExpenseLimit > 0 
      ? Math.round((exp / budget.monthlyExpenseLimit) * 100) 
      : 0;

    return {
      totalIncome: inc,
      totalExpense: exp,
      balance: bal,
      budgetSpentPct: spentPct,
      isOver80: spentPct >= 80,
      isOver100: spentPct >= 100
    };
  }, [transactions, budget]);

  // Datos para el gráfico de dona (Gastos por Categoría)
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });

    return Object.entries(map)
      .map(([catId, amount]) => {
        const info = getCategoryInfo(catId as any);
        return {
          id: catId,
          name: info.name,
          emoji: info.emoji,
          value: amount,
          color: info.color
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // Datos para la evolución de gastos (agrupados por fecha de los últimos 7 días con movimientos)
  const evolutionData = useMemo(() => {
    const expenseTx = transactions.filter((t) => t.type === 'expense');
    const dayMap: Record<string, number> = {};

    expenseTx.forEach((t) => {
      dayMap[t.date] = (dayMap[t.date] || 0) + t.amount;
    });

    const sortedDates = Object.keys(dayMap).sort();
    return sortedDates.slice(-7).map((d) => {
      const parts = d.split('-');
      const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : d;
      return {
        date: label,
        fullDate: d,
        gasto: dayMap[d]
      };
    });
  }, [transactions]);

  // Movimientos recientes
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.createdAt - a.createdAt)
      .slice(0, 5);
  }, [transactions]);

  const isEmpty = transactions.length === 0;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = nameInput.trim();
    const cleanUni = universityInput.trim();
    if (cleanName) {
      if (onUpdateProfile) {
        onUpdateProfile({ name: cleanName, university: cleanUni });
      } else if (onUpdateUserName) {
        onUpdateUserName(cleanName);
      }
      setIsEditingProfile(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. SALUDO PERSONALIZADO: "Hola [Nombre], vamos a organizar esa plata" */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 w-full md:w-auto">
          {isEditingProfile ? (
            <form onSubmit={handleSaveProfile} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  👋 ¡Hola! Vamos a registrar tus datos para tus informes y consejos:
                </span>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5">
                <div className="flex-1">
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                    Tu Nombre *
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Ej: Daniel"
                    required
                    className="w-full px-3 py-1.5 text-sm font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                    Tu Universidad *
                  </label>
                  <input
                    type="text"
                    value={universityInput}
                    onChange={(e) => setUniversityInput(e.target.value)}
                    placeholder="Ej: Universidad de Antioquia, etc."
                    className="w-full px-3 py-1.5 text-sm font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold transition-colors cursor-pointer shadow-xs shrink-0"
                  >
                    Guardar Datos
                  </button>
                  {userProfile.name && (
                    <button
                      type="button"
                      onClick={() => {
                        setNameInput(userProfile.name || '');
                        setUniversityInput(userProfile.university || '');
                        setIsEditingProfile(false);
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 transition-colors shrink-0"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Hola <span className="text-slate-900 dark:text-slate-100 underline decoration-slate-400 dark:decoration-slate-600 underline-offset-4">{userProfile.name}</span>, vamos a organizar esa plata
                </h2>
                <button
                  onClick={() => {
                    setNameInput(userProfile.name || '');
                    setUniversityInput(userProfile.university || '');
                    setIsEditingProfile(true);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Editar nombre y universidad"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {userProfile.university ? (
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                    🏛️ {userProfile.university}
                  </span>
                ) : (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="text-xs text-emerald-700 dark:text-emerald-400 underline font-medium cursor-pointer"
                  >
                    + Agregar mi universidad
                  </button>
                )}
                <span>• Controla tu presupuesto, evita quedarte corto y toma decisiones inteligentes con tu plata.</span>
              </div>
            </div>
          )}
        </div>

        {/* Acciones Rápidas del Saludo */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onOpenAddModal('expense')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Movimiento</span>
          </button>
        </div>
      </div>

      {/* 2. TARJETA INFORMATIVA: DESCARGAR EN PDF O EXCEL */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
              Tus finanzas siempre disponibles: Descarga en PDF o Excel
            </h4>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs">
              Puedes descargar un informe visual en PDF o exportar tus movimientos organizados a una hoja de cálculo en Excel (.CSV).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            onClick={onExportPDF}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold transition-all shadow-xs cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
            <span>Descargar PDF</span>
          </button>
          <button
            onClick={onExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold transition-all shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
            <span>Descargar Excel</span>
          </button>
        </div>
      </div>

      {/* 3. BANNER: IA CONECTADA DIRECTAMENTE A LOS DATOS REGISTRADOS */}
      <div className="p-5 rounded-3xl bg-slate-900 dark:bg-slate-950 text-white border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400 shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/10 text-[11px] font-bold text-amber-300 mb-1 border border-white/10">
              <Sparkles className="w-3 h-3" />
              <span>EduPlata IA • Conectada a tus números reales</span>
            </div>
            <h3 className="font-bold text-sm sm:text-base text-white">
              Consejos personalizados basados en tus movimientos
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed max-w-2xl">
              Al consultar la IA o solicitar tu diagnóstico, el asistente revisa directamente tus ingresos, gastos, categorías y saldo registrado para decirte con precisión dónde puedes recortar y cómo estás llevando tus finanzas.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('ai')}
          className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm shrink-0 self-start md:self-auto transition-colors shadow-xs cursor-pointer"
        >
          Consultar Asistente IA
        </button>
      </div>

      {/* AVISO SI HAY DATOS DE EJEMPLO CARGADOS */}
      {isShowingSampleData && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">ℹ️</span>
            <div>
              <p className="text-xs sm:text-sm font-bold">
                Estás viendo datos de muestra para pruebas.
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                ¿Deseas vaciar todo y registrar tu dinero real en ceros ($0)?
              </p>
            </div>
          </div>
          <button
            onClick={onResetToZeros}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-700 hover:bg-amber-800 text-white shrink-0 self-start sm:self-center transition-colors cursor-pointer shadow-xs"
          >
            🧹 Empezar en ceros ($0)
          </button>
        </div>
      )}

      {/* BIENVENIDA EN CEROS */}
      {isEmpty && (
        <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Comienza a organizar tu plata
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Elige una acción para dar el primer paso con tus cuentas:
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              onClick={onOpenBalanceAdjustment}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Wallet className="w-4 h-4" />
              <span>1. Definir Saldo Inicial</span>
            </button>

            <button
              onClick={onOpenBudgetModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <BarChart3 className="w-4 h-4" />
              <span>2. Fijar Presupuesto del Mes</span>
            </button>

            <button
              onClick={() => onOpenAddModal('expense')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>3. Registrar Movimiento</span>
            </button>

            <button
              onClick={onLoadSampleData}
              className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 underline ml-2 transition-colors cursor-pointer"
            >
              Cargar datos de ejemplo para explorar
            </button>
          </div>
        </div>
      )}

      {/* ALERTA VISUAL DE PRESUPUESTO > 80% */}
      {isOver80 && budget.monthlyExpenseLimit > 0 && (
        <div className={`p-4 sm:p-5 rounded-2xl border flex items-start gap-3.5 shadow-sm ${
          isOver100 
            ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200' 
            : 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
        }`}>
          <div className={`p-2 rounded-xl shrink-0 ${isOver100 ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-extrabold text-sm sm:text-base">
              {isOver100 
                ? `¡Superaste tu presupuesto! (${budgetSpentPct}% gastado)` 
                : `¡Precaución! Has gastado el ${budgetSpentPct}% de tu presupuesto`}
            </h4>
            <p className="text-xs sm:text-sm mt-0.5 opacity-90">
              {isOver100
                ? `Llevas ${formatCOP(totalExpense)} gastados de tu límite de ${formatCOP(budget.monthlyExpenseLimit)}.`
                : `Te quedan ${formatCOP(Math.max(0, budget.monthlyExpenseLimit - totalExpense))} disponibles este mes.`}
            </p>
          </div>
          <button
            onClick={onOpenBudgetModal}
            className="text-xs px-3 py-1.5 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white shrink-0 self-center transition-all cursor-pointer shadow-xs"
          >
            Ajustar
          </button>
        </div>
      )}

      {/* BARRA DE CHAT RÁPIDO ESTILO WHATSAPP (ACCESIBLE DESDE EL INICIO) */}
      <QuickChatBar
        onSubmitMessage={(msg) => {
          if (onQuickChatMessage) onQuickChatMessage(msg);
          else onNavigateTab('chat');
        }}
        onOpenFullChat={() => onNavigateTab('chat')}
      />

      {/* TARJETAS PRINCIPALES DE MÉTRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Saldo Actual */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Saldo en Bolsillo
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenBalanceAdjustment}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Modificar saldo"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="mt-3">
            <span className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${balance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-700 dark:text-rose-400'}`}>
              {formatCOP(balance)}
            </span>
          </div>

          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Disponible ahora
            </span>
            <button
              onClick={onOpenBalanceAdjustment}
              className="text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:underline cursor-pointer"
            >
              Modificar
            </button>
          </div>
        </div>

        {/* Total Ingresos */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Ingresos del Mes
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenAddModal('income')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-colors cursor-pointer"
                title="Agregar nuevo ingreso"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-700 dark:text-emerald-400 tracking-tight">
              +{formatCOP(totalIncome)}
            </span>
          </div>

          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Mesada y auxilios
            </span>
            <button
              onClick={() => onOpenAddModal('income')}
              className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              + Ingreso
            </button>
          </div>
        </div>

        {/* Total Gastos */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Gastos del Mes
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenAddModal('expense')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                title="Agregar nuevo gasto"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-rose-700 dark:text-rose-400">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-700 dark:text-rose-400 tracking-tight">
              -{formatCOP(totalExpense)}
            </span>
          </div>

          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              {budget.monthlyExpenseLimit > 0 ? `${budgetSpentPct}% del límite` : 'Sin límite'}
            </span>
            <button
              onClick={() => onOpenAddModal('expense')}
              className="text-[11px] font-bold text-rose-700 dark:text-rose-400 hover:underline cursor-pointer"
            >
              + Gasto
            </button>
          </div>
        </div>

        {/* Presupuesto Total */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Límite Mensual
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenBudgetModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Configurar presupuesto"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight">
              {formatCOP(budget.monthlyExpenseLimit)}
            </span>
          </div>

          {/* Barra de progreso sobria */}
          <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                budgetSpentPct > 90 ? 'bg-rose-700' : budgetSpentPct > 70 ? 'bg-amber-600' : 'bg-emerald-700'
              }`}
              style={{ width: `${Math.min(100, budgetSpentPct)}%` }}
            />
          </div>

          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              {budget.monthlyExpenseLimit > 0 ? `${formatCOP(Math.max(0, budget.monthlyExpenseLimit - totalExpense))} libre` : 'Fija tu límite'}
            </span>
            <button
              onClick={onOpenBudgetModal}
              className="text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:underline cursor-pointer"
            >
              Ajustar
            </button>
          </div>
        </div>

      </div>

      {/* TARJETA: ¿HASTA CUÁNDO ME ALCANZA? */}
      <RunwayCard
        balance={balance}
        transactions={transactions}
        semesterConfig={semesterConfig}
        onNavigateToSettings={() => onNavigateTab('settings')}
        onOpenAddModal={onOpenAddModal}
      />

      {/* TARJETA EN EL INICIO: PRÓXIMOS PAGOS */}
      <UpcomingPaymentsCard
        payments={scheduledPayments}
        currentBalance={balance}
        onNavigateToCalendar={() => onNavigateTab('calendar')}
        onPayPayment={(p) => onPayPayment && onPayPayment(p)}
      />

      {/* SECCIÓN DE GRÁFICOS: DONA + BARRAS (COLORES SOBRIOS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Gráfico 1: Gastos por Categoría */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Gastos por Categoría
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Total: {formatCOP(totalExpense)}
            </span>
          </div>

          {categoryData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400 text-center">
              <span className="text-3xl mb-2">📊</span>
              <p className="text-sm font-medium">Aún no hay gastos registrados este mes</p>
              <button
                onClick={() => onOpenAddModal('expense')}
                className="mt-3 text-xs text-slate-700 dark:text-slate-300 font-bold underline cursor-pointer"
              >
                Registrar primer gasto
              </button>
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 items-center gap-4">
              <div className="sm:col-span-7 h-52 sm:h-60 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {categoryData.map((entry) => (
                        <Cell key={`cell-${entry.id}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [formatCOP(Number(value)), 'Gasto']}
                      contentStyle={{
                        borderRadius: '12px',
                        backgroundColor: '#0f172a',
                        border: 'none',
                        color: '#fff',
                        fontSize: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Gastado</span>
                  <span className="text-sm font-extrabold font-mono text-slate-900 dark:text-white">
                    {formatCOP(totalExpense)}
                  </span>
                </div>
              </div>

              {/* Leyenda sobria */}
              <div className="sm:col-span-5 space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {categoryData.map((item) => {
                  const pct = totalExpense > 0 ? Math.round((item.value / totalExpense) * 100) : 0;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="truncate text-slate-700 dark:text-slate-300">
                          {item.emoji} {item.name}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white ml-2 shrink-0">
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Gráfico 2: Evolución de Gastos */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Evolución de Gastos
              </h3>
            </div>
            <span className="text-xs text-slate-400">Días con actividad</span>
          </div>

          {evolutionData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400 text-center">
              <span className="text-3xl mb-2">📈</span>
              <p className="text-sm font-medium">No hay suficiente historial para mostrar la tendencia</p>
            </div>
          ) : (
            <div className="h-56 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={evolutionData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(val) => `$${Math.round(val / 1000)}k`}
                  />
                  <Tooltip
                    formatter={(value: any) => [formatCOP(Number(value)), 'Gasto del día']}
                    labelFormatter={(label) => `Fecha: ${label}`}
                    contentStyle={{
                      borderRadius: '12px',
                      backgroundColor: '#0f172a',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Bar 
                    dataKey="gasto" 
                    fill="#334155" 
                    radius={[6, 6, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

      {/* SECCIÓN INFERIOR: ÚLTIMOS MOVIMIENTOS + METAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Lista de últimos movimientos */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Últimos Movimientos
            </h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onOpenAddModal('expense')}
                className="text-xs font-bold text-slate-800 dark:text-slate-200 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </button>
              <button
                onClick={() => onNavigateTab('transactions')}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <span>Ver todos ({transactions.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="py-8 text-center text-slate-400 space-y-2">
              <p className="text-xs">No hay movimientos registrados todavía.</p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => onOpenAddModal('income')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 cursor-pointer"
                >
                  + Agregar Ingreso
                </button>
                <button
                  onClick={() => onOpenAddModal('expense')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 cursor-pointer"
                >
                  + Agregar Gasto
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentTransactions.map((t) => {
                const info = getCategoryInfo(t.category);
                const isInc = t.type === 'income';
                return (
                  <div
                    key={t.id}
                    onClick={() => onEditTransaction(t)}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 shadow-2xs flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                        {info.emoji}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {t.note || info.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {formatDate(t.date)} • {info.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <span className={`text-xs sm:text-sm font-bold font-mono ${isInc ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>
                        {isInc ? '+' : '-'}{formatCOP(t.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Resumen de Metas de Ahorro */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Tus Metas de Ahorro
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('goals')}
                className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Ver metas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {goals.length === 0 ? (
              <div className="py-6 text-center text-slate-400">
                <p className="text-xs">No te has fijado metas de ahorro aún.</p>
                <button
                  onClick={() => onNavigateTab('goals')}
                  className="mt-2 text-xs text-slate-800 dark:text-slate-200 font-bold underline cursor-pointer"
                >
                  Crear mi primera meta
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {goals.slice(0, 3).map((goal) => {
                  const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                  return (
                    <div key={goal.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 truncate">
                          <span>{goal.emoji}</span>
                          <span className="truncate">{goal.title}</span>
                        </span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 shrink-0 ml-2">
                          {pct}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-slate-800 dark:bg-slate-300 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                        <span>{formatCOP(goal.currentAmount)}</span>
                        <span>Meta: {formatCOP(goal.targetAmount)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Total ahorrado: <strong className="text-slate-800 dark:text-slate-200 font-mono">{formatCOP(goals.reduce((s, g) => s + g.currentAmount, 0))}</strong>
            </span>
            <button
              onClick={() => onNavigateTab('goals')}
              className="text-slate-800 dark:text-slate-200 font-bold hover:underline cursor-pointer"
            >
              + Aportar o crear
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
