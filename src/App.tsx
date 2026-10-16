/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * EduPlata - Aplicación Web de Finanzas para Universitarios en Colombia
 * Componente principal que orquesta estado, persistencia local y vistas.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { TabsNav } from './components/TabsNav';
import { DashboardView } from './components/views/DashboardView';
import { TransactionsView } from './components/views/TransactionsView';
import { BudgetView } from './components/views/BudgetView';
import { GoalsView } from './components/views/GoalsView';
import { AIAssistantView } from './components/views/AIAssistantView';
import { SettingsView } from './components/views/SettingsView';
import { TransactionModal } from './components/TransactionModal';
import { GoalModal } from './components/GoalModal';
import { GoalDepositModal } from './components/GoalDepositModal';
import { BalanceAdjustmentModal } from './components/BalanceAdjustmentModal';
import { BudgetModal } from './components/BudgetModal';
import { QuickChatView } from './components/views/QuickChatView';
import { CalendarView } from './components/views/CalendarView';
import { 
  ActiveTab, 
  AIAnalysisResult, 
  BudgetConfig, 
  SavingsGoal, 
  SemesterConfig,
  ScheduledPayment,
  Transaction, 
  UserProfile 
} from './types';
import { 
  INITIAL_BUDGET, 
  INITIAL_SAVINGS_GOALS, 
  INITIAL_SCHEDULED_PAYMENTS,
  INITIAL_SEMESTER_CONFIG,
  INITIAL_TRANSACTIONS, 
  INITIAL_USER_PROFILE,
  SAMPLE_BUDGET,
  SAMPLE_SAVINGS_GOALS,
  SAMPLE_SCHEDULED_PAYMENTS,
  SAMPLE_SEMESTER_CONFIG,
  SAMPLE_TRANSACTIONS,
  SAMPLE_USER_PROFILE
} from './data/initialData';
import { generateFinancialPDFReport } from './services/pdfReport';
import { exportTransactionsToExcel } from './services/excelReport';
import { getNextRecurringDate } from './utils/calendarUtils';
import { Plus } from 'lucide-react';

const STORAGE_KEYS = {
  TRANSACTIONS: 'bolsiuni_v2_transactions',
  BUDGET: 'bolsiuni_v2_budget',
  GOALS: 'bolsiuni_v2_goals',
  PROFILE: 'bolsiuni_v2_profile',
  AI_ANALYSIS: 'bolsiuni_v2_ai_analysis',
  DARK_MODE: 'bolsiuni_dark_mode',
  SEMESTER: 'bolsiuni_v2_semester',
  SCHEDULED_PAYMENTS: 'bolsiuni_v2_scheduled_payments'
};

export default function App() {
  // Pestaña activa
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Modo Oscuro
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DARK_MODE);
      if (saved !== null) return JSON.parse(saved);
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Efecto para sincronizar la clase 'dark' en el documento raíz
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DARK_MODE, JSON.stringify(darkMode));
    } catch (e) {
      console.error(e);
    }
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Transacciones
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TRANSACTIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error(e);
    }
  }, [transactions]);

  // Presupuesto
  const [budget, setBudget] = useState<BudgetConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BUDGET);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_BUDGET;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(budget));
    } catch (e) {
      console.error(e);
    }
  }, [budget]);

  // Metas de ahorro
  const [goals, setGoals] = useState<SavingsGoal[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GOALS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_SAVINGS_GOALS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    } catch (e) {
      console.error(e);
    }
  }, [goals]);

  // Perfil del estudiante
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_USER_PROFILE;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(userProfile));
    } catch (e) {
      console.error(e);
    }
  }, [userProfile]);

  // Plan del semestre y proyección
  const [semesterConfig, setSemesterConfig] = useState<SemesterConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SEMESTER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_SEMESTER_CONFIG;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SEMESTER, JSON.stringify(semesterConfig));
    } catch (e) {
      console.error(e);
    }
  }, [semesterConfig]);

  // Pagos programados y calendario de pagos
  const [scheduledPayments, setScheduledPayments] = useState<ScheduledPayment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SCHEDULED_PAYMENTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_SCHEDULED_PAYMENTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SCHEDULED_PAYMENTS, JSON.stringify(scheduledPayments));
    } catch (e) {
      console.error(e);
    }
  }, [scheduledPayments]);

  // Mensaje precargado desde el Inicio para el Chat Rápido
  const [initialChatMessage, setInitialChatMessage] = useState<string>('');

  // Último análisis de IA
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AI_ANALYSIS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const handleSaveAnalysis = (result: AIAnalysisResult) => {
    setAiAnalysis(result);
    try {
      localStorage.setItem(STORAGE_KEYS.AI_ANALYSIS, JSON.stringify(result));
    } catch (e) {
      console.error(e);
    }
  };

  // Estado de IA (conectada en servidor mediante Claude)
  const hasApiKey = true;

  // Estados de Modales
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositGoal, setDepositGoal] = useState<SavingsGoal | null>(null);

  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  // Cálculo del saldo general en tiempo real
  const currentBalance = useMemo(() => {
    const inc = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const exp = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return inc - exp;
  }, [transactions]);

  // Manejo de Movimientos
  const handleSaveTransaction = (
    txData: Omit<Transaction, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      setTransactions((prev) =>
        prev.map((t) => (t.id === existingId ? { ...t, ...txData } : t))
      );
    } else {
      const newTx: Transaction = {
        ...txData,
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: Date.now()
      };
      setTransactions((prev) => [newTx, ...prev]);
    }
    setIsTxModalOpen(false);
    setSelectedTx(null);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Manejo de Metas
  const handleSaveGoal = (
    goalData: Omit<SavingsGoal, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      setGoals((prev) =>
        prev.map((g) => (g.id === existingId ? { ...g, ...goalData } : g))
      );
    } else {
      const newGoal: SavingsGoal = {
        ...goalData,
        id: `goal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: Date.now()
      };
      setGoals((prev) => [...prev, newGoal]);
    }
    setIsGoalModalOpen(false);
    setSelectedGoal(null);
  };

  const handleDeleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const handleDepositToGoal = (goalId: string, amount: number) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g
      )
    );
  };

  // Generar y Descargar Informe PDF
  const handleExportPDF = () => {
    generateFinancialPDFReport({
      userProfile,
      transactions,
      budget,
      goals,
      aiAnalysis
    });
  };

  // Generar y Descargar en Excel
  const handleExportExcel = () => {
    exportTransactionsToExcel(transactions, userProfile, budget);
  };

  // Ajustar Saldo en Bolsillo directamente
  const handleSaveAdjustedBalance = (newBalance: number, note: string, resetAll: boolean) => {
    if (resetAll) {
      if (newBalance > 0) {
        const initTx: Transaction = {
          id: `tx-init-${Date.now()}`,
          type: 'income',
          amount: newBalance,
          category: 'mesada',
          date: new Date().toISOString().slice(0, 10),
          note: note || 'Saldo inicial en bolsillo',
          createdAt: Date.now()
        };
        setTransactions([initTx]);
      } else {
        setTransactions([]);
      }
    } else {
      const diff = newBalance - currentBalance;
      if (diff === 0) return;
      const adjustTx: Transaction = {
        id: `tx-adj-${Date.now()}`,
        type: diff > 0 ? 'income' : 'expense',
        amount: Math.abs(diff),
        category: diff > 0 ? 'mesada' : 'otros',
        date: new Date().toISOString().slice(0, 10),
        note: note || 'Ajuste de saldo en bolsillo',
        createdAt: Date.now()
      };
      setTransactions((prev) => [adjustTx, ...prev]);
    }
    setIsBalanceModalOpen(false);
  };

  // Manejo de Pagos Programados
  const handleAddScheduledPayment = (paymentData: Omit<ScheduledPayment, 'id' | 'createdAt'>) => {
    const newPayment: ScheduledPayment = {
      ...paymentData,
      id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now()
    };
    setScheduledPayments((prev) => [...prev, newPayment]);
  };

  const handleUpdateScheduledPayment = (payment: ScheduledPayment) => {
    setScheduledPayments((prev) => prev.map((p) => (p.id === payment.id ? payment : p)));
  };

  const handleDeleteScheduledPayment = (id: string) => {
    setScheduledPayments((prev) => prev.filter((p) => p.id !== id));
  };

  // Botón "Ya lo pagué": registra como gasto real hoy y si es recurrente genera el siguiente automáticamente
  const handlePayScheduledPayment = (payment: ScheduledPayment) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const newTx: Transaction = {
      id: `tx-pay-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: 'expense',
      amount: payment.amount,
      category: payment.categoryId || 'otros',
      date: todayStr,
      note: `Pago: ${payment.description}`,
      createdAt: Date.now()
    };
    setTransactions((prev) => [newTx, ...prev]);

    if (payment.recurrence === 'mensual' || payment.recurrence === 'semanal') {
      const nextDueDate = getNextRecurringDate(payment.dueDate, payment.recurrence);
      const nextPayment: ScheduledPayment = {
        ...payment,
        id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        dueDate: nextDueDate,
        isPaid: false,
        paidAt: undefined,
        createdAt: Date.now()
      };
      setScheduledPayments((prev) => [
        ...prev.filter((p) => p.id !== payment.id),
        nextPayment
      ]);
    } else {
      setScheduledPayments((prev) =>
        prev.map((p) => (p.id === payment.id ? { ...p, isPaid: true, paidAt: todayStr } : p))
      );
    }
  };

  // Restablecer Datos de Ejemplo
  const handleResetSampleData = () => {
    setTransactions(SAMPLE_TRANSACTIONS);
    setBudget(SAMPLE_BUDGET);
    setGoals(SAMPLE_SAVINGS_GOALS);
    setUserProfile(SAMPLE_USER_PROFILE);
    setSemesterConfig(SAMPLE_SEMESTER_CONFIG);
    setScheduledPayments(SAMPLE_SCHEDULED_PAYMENTS);
    setAiAnalysis(null);
  };

  // Borrar Todos los Datos
  const handleClearAllData = () => {
    setTransactions([]);
    setGoals([]);
    setScheduledPayments([]);
    setBudget({
      monthlyIncomeTarget: 0,
      monthlyExpenseLimit: 0,
      categoryLimits: {
        comida: 0,
        transporte: 0,
        fotocopias: 0,
        matricula: 0,
        ocio: 0,
        suscripciones: 0,
        vivienda: 0,
        salud: 0,
        otros: 0
      }
    });
    setSemesterConfig(INITIAL_SEMESTER_CONFIG);
    setAiAnalysis(null);
  };

  // Importar Respaldo
  const handleImportData = (data: any) => {
    if (data.transactions) setTransactions(data.transactions);
    if (data.budget) setBudget(data.budget);
    if (data.goals) setGoals(data.goals);
    if (data.userProfile) setUserProfile(data.userProfile);
    if (data.semester) setSemesterConfig(data.semester);
    if (data.scheduledPayments) setScheduledPayments(data.scheduledPayments);
    if (data.aiAnalysis) setAiAnalysis(data.aiAnalysis);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col transition-colors selection:bg-emerald-500 selection:text-white">
      
      {/* Barra de Navegación Superior */}
      <Navbar
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        balance={currentBalance}
        onExportPDF={handleExportPDF}
        onExportExcel={handleExportExcel}
        onOpenSettings={() => setActiveTab('settings')}
        studentName={userProfile.name}
      />

      {/* Navegación por pestañas (Desktop top bar & Mobile bottom bar) */}
      <TabsNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        hasApiKey={hasApiKey}
      />

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        {activeTab === 'dashboard' && (
          <DashboardView
            transactions={transactions}
            budget={budget}
            goals={goals}
            userProfile={userProfile}
            semesterConfig={semesterConfig}
            scheduledPayments={scheduledPayments}
            onPayPayment={handlePayScheduledPayment}
            onQuickChatMessage={(msg) => {
              setInitialChatMessage(msg);
              setActiveTab('chat');
            }}
            onUpdateUserName={(name) => setUserProfile((prev) => ({ ...prev, name }))}
            onUpdateProfile={(partial) => setUserProfile((prev) => ({ ...prev, ...partial }))}
            onOpenAddModal={(defaultType) => {
              setSelectedTx(null);
              setIsTxModalOpen(true);
            }}
            onEditTransaction={(t) => {
              setSelectedTx(t);
              setIsTxModalOpen(true);
            }}
            onNavigateTab={(tab) => setActiveTab(tab)}
            hasApiKey={hasApiKey}
            onOpenBalanceAdjustment={() => setIsBalanceModalOpen(true)}
            onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
            onLoadSampleData={handleResetSampleData}
            onResetToZeros={handleClearAllData}
            isShowingSampleData={transactions.length > 0 && transactions[0].id === 'tx-1'}
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
          />
        )}

        {activeTab === 'chat' && (
          <QuickChatView
            transactions={transactions}
            onAddTransaction={(tx) => handleSaveTransaction(tx)}
            onAddScheduledPayment={handleAddScheduledPayment}
            onOpenManualTransactionModal={() => {
              setSelectedTx(null);
              setIsTxModalOpen(true);
            }}
            initialMessageToSend={initialChatMessage}
            onClearInitialMessage={() => setInitialChatMessage('')}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            payments={scheduledPayments}
            onAddPayment={handleAddScheduledPayment}
            onUpdatePayment={handleUpdateScheduledPayment}
            onDeletePayment={handleDeleteScheduledPayment}
            onPayPayment={handlePayScheduledPayment}
            currentBalance={currentBalance}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            transactions={transactions}
            onOpenAddModal={() => {
              setSelectedTx(null);
              setIsTxModalOpen(true);
            }}
            onEditTransaction={(t) => {
              setSelectedTx(t);
              setIsTxModalOpen(true);
            }}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetView
            budget={budget}
            transactions={transactions}
            onUpdateBudget={(newBudget) => setBudget(newBudget)}
            onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
          />
        )}

        {activeTab === 'goals' && (
          <GoalsView
            goals={goals}
            onOpenCreateModal={() => {
              setSelectedGoal(null);
              setIsGoalModalOpen(true);
            }}
            onEditGoal={(g) => {
              setSelectedGoal(g);
              setIsGoalModalOpen(true);
            }}
            onDeleteGoal={handleDeleteGoal}
            onOpenDepositModal={(g) => {
              setDepositGoal(g);
              setIsDepositModalOpen(true);
            }}
          />
        )}

        {activeTab === 'ai' && (
          <AIAssistantView
            transactions={transactions}
            budget={budget}
            goals={goals}
            userProfile={userProfile}
            aiAnalysis={aiAnalysis}
            onSaveAnalysis={handleSaveAnalysis}
            hasApiKey={hasApiKey}
            onOpenSettings={() => setActiveTab('settings')}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            userProfile={userProfile}
            onUpdateProfile={(p) => setUserProfile(p)}
            semesterConfig={semesterConfig}
            onUpdateSemesterConfig={(c) => setSemesterConfig(c)}
            onResetSampleData={handleResetSampleData}
            onClearAllData={handleClearAllData}
            allData={{
              transactions,
              budget,
              goals,
              userProfile,
              semester: semesterConfig,
              scheduledPayments
            }}
            onImportData={handleImportData}
          />
        )}
      </main>

      {/* Botón flotante rápido para agregar movimiento en móviles */}
      <button
        onClick={() => {
          setSelectedTx(null);
          setIsTxModalOpen(true);
        }}
        className="md:hidden fixed right-4 bottom-20 z-30 w-14 h-14 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xl shadow-slate-900/30 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform"
        title="Registrar movimiento"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Modales */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setSelectedTx(null);
        }}
        onSave={handleSaveTransaction}
        onDelete={handleDeleteTransaction}
        initialTransaction={selectedTx}
      />

      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setSelectedGoal(null);
        }}
        onSave={handleSaveGoal}
        onDelete={handleDeleteGoal}
        initialGoal={selectedGoal}
      />

      <GoalDepositModal
        isOpen={isDepositModalOpen}
        onClose={() => {
          setIsDepositModalOpen(false);
          setDepositGoal(null);
        }}
        goal={depositGoal}
        onDeposit={handleDepositToGoal}
      />

      <BalanceAdjustmentModal
        isOpen={isBalanceModalOpen}
        onClose={() => setIsBalanceModalOpen(false)}
        currentBalance={currentBalance}
        onSaveBalance={handleSaveAdjustedBalance}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        budget={budget}
        onSaveBudget={(newBudget) => {
          setBudget(newBudget);
          setIsBudgetModalOpen(false);
        }}
      />

    </div>
  );
}
