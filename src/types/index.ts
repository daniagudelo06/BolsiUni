/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * EduPlata - Tipos y modelos de datos
 * Diseñado específicamente para finanzas de estudiantes universitarios en Colombia.
 */

export type MovementType = 'income' | 'expense';

// Categorías de gastos universitarios
export type ExpenseCategoryId =
  | 'comida'
  | 'transporte'
  | 'fotocopias'
  | 'matricula'
  | 'ocio'
  | 'suscripciones'
  | 'vivienda'
  | 'salud'
  | 'otros';

// Categorías de ingresos universitarios
export type IncomeCategoryId =
  | 'mesada'
  | 'trabajo'
  | 'auxilio'
  | 'emprendimiento'
  | 'otros_ingresos';

export type CategoryId = ExpenseCategoryId | IncomeCategoryId;

export interface CategoryInfo {
  id: CategoryId;
  name: string;
  emoji: string;
  color: string;
  bgLight: string;
  type: MovementType;
  description: string;
}

export interface Transaction {
  id: string;
  type: MovementType;
  amount: number; // En pesos colombianos (COP)
  category: CategoryId;
  date: string; // Formato YYYY-MM-DD
  note?: string;
  createdAt: number;
}

export interface CategoryBudget {
  categoryId: ExpenseCategoryId;
  limit: number; // Límite en COP
}

export interface BudgetConfig {
  monthlyIncomeTarget: number; // Estimado mensual
  monthlyExpenseLimit: number; // Presupuesto mensual total
  categoryLimits: Record<ExpenseCategoryId, number>;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number; // Monto objetivo en COP
  currentAmount: number; // Ahorro actual en COP
  deadline: string; // Fecha límite YYYY-MM-DD
  emoji: string;
  color: string;
  notes?: string;
  createdAt: number;
}

export interface CutSuggestion {
  title: string;
  explanation: string;
  potentialSaving: number; // Ahorro potencial mensual en COP
}

export interface AIAnalysisResult {
  summary: string;
  cutSuggestions: CutSuggestion[];
  savingsTips: string[];
  analyzedAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface UserProfile {
  name: string;
  university: string;
  career: string;
  semester: string;
}

export type IncomeFrequency = 'semanal' | 'quincenal' | 'mensual';

export type AcademicEventType = 'parciales' | 'finales' | 'matricula' | 'vacaciones' | 'otro';

export interface AcademicEvent {
  id: string;
  title: string;
  type: AcademicEventType;
  date: string; // Formato YYYY-MM-DD
}

export interface SemesterConfig {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  incomeFrequency: IncomeFrequency;
  incomeDay: number; // Día del mes (1-31) o día de semana (1=Lunes .. 7=Domingo)
  incomeDaySecond?: number; // Segundo día para quincenas (ej. 30)
  events: AcademicEvent[];
}

export type PaymentRecurrence = 'ninguna' | 'semanal' | 'mensual';

export interface ScheduledPayment {
  id: string;
  description: string;
  amount: number;
  category: string;
  categoryId: CategoryId;
  dueDate: string; // YYYY-MM-DD
  recurrence: PaymentRecurrence;
  reminderDaysBefore: number; // por defecto 1
  isPaid?: boolean;
  paidAt?: string;
  createdAt: number;
}

export interface ClaudeMovementParam {
  tipo: 'gasto' | 'ingreso';
  monto: number;
  categoria: string;
  descripcion: string;
  fecha: string;
}

export interface ClaudePaymentParam {
  descripcion: string;
  monto: number;
  categoria: string;
  fecha_vencimiento: string;
  recurrencia: 'ninguna' | 'semanal' | 'mensual';
  recordatorio_dias_antes?: number;
}

export interface ClaudeToolCall {
  id: string;
  toolName: 'registrar_movimiento' | 'programar_pago' | 'pedir_aclaracion';
  parameters: any;
  status?: 'pending' | 'saved' | 'discarded' | 'edited';
}

export interface QuickChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text?: string;
  toolCalls?: ClaudeToolCall[];
  timestamp: string;
}

export type ActiveTab = 
  | 'dashboard' 
  | 'chat' 
  | 'calendar' 
  | 'transactions' 
  | 'budget' 
  | 'goals' 
  | 'ai' 
  | 'settings';
