/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Datos iniciales (vacíos) y datos de ejemplo para EduPlata
 * Contextualizados para un estudiante universitario en Colombia
 */

import { BudgetConfig, SavingsGoal, Transaction, UserProfile, SemesterConfig, ScheduledPayment } from '../types';

// Helper para calcular fechas relativas
const addDaysToToday = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const INITIAL_SEMESTER_CONFIG: SemesterConfig = {
  startDate: addDaysToToday(-45),
  endDate: addDaysToToday(65),
  incomeFrequency: 'mensual',
  incomeDay: 15,
  incomeDaySecond: 30,
  events: [
    {
      id: 'event-parciales-init',
      title: 'Semana de Parciales',
      type: 'parciales',
      date: addDaysToToday(6)
    },
    {
      id: 'event-finales-init',
      title: 'Exámenes Finales',
      type: 'finales',
      date: addDaysToToday(45)
    },
    {
      id: 'event-matricula-init',
      title: 'Pago de Matrícula',
      type: 'matricula',
      date: addDaysToToday(55)
    },
    {
      id: 'event-vacaciones-init',
      title: 'Inicio de Vacaciones',
      type: 'vacaciones',
      date: addDaysToToday(65)
    }
  ]
};

// Estado inicial: la app arranca en ceros para que cada estudiante ingrese sus datos
export const INITIAL_USER_PROFILE: UserProfile = {
  name: '',
  university: '',
  career: '',
  semester: ''
};

export const INITIAL_BUDGET: BudgetConfig = {
  monthlyIncomeTarget: 0,
  monthlyExpenseLimit: 0,
  categoryLimits: {
    comida: 0,
    transporte: 0,
    fotocopias: 0,
    ocio: 0,
    suscripciones: 0,
    vivienda: 0,
    salud: 0,
    matricula: 0,
    otros: 0
  }
};

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_SAVINGS_GOALS: SavingsGoal[] = [];

export const INITIAL_SCHEDULED_PAYMENTS: ScheduledPayment[] = [];

// Datos de ejemplo (botón "Restablecer datos de ejemplo" en Configuración)
export const SAMPLE_USER_PROFILE: UserProfile = {
  name: 'Camilo Restrepo',
  university: 'Universidad de Colombia',
  career: 'Ingeniería de Sistemas',
  semester: '5to Semestre'
};

export const SAMPLE_BUDGET: BudgetConfig = {
  monthlyIncomeTarget: 870000,
  monthlyExpenseLimit: 750000,
  categoryLimits: {
    comida: 280000,
    transporte: 160000,
    fotocopias: 60000,
    ocio: 120000,
    suscripciones: 35000,
    vivienda: 0,
    salud: 30000,
    matricula: 0,
    otros: 65000
  }
};

export const SAMPLE_SCHEDULED_PAYMENTS: ScheduledPayment[] = [
  {
    id: 'pay-1',
    description: 'Arriendo habitación universitaria',
    amount: 650000,
    category: 'Vivienda',
    categoryId: 'vivienda',
    dueDate: addDaysToToday(5),
    recurrence: 'mensual',
    reminderDaysBefore: 2,
    createdAt: Date.now() - 86400000 * 5
  },
  {
    id: 'pay-2',
    description: 'Spotify Plan Universitario',
    amount: 9900,
    category: 'Suscripciones',
    categoryId: 'suscripciones',
    dueDate: addDaysToToday(8),
    recurrence: 'mensual',
    reminderDaysBefore: 1,
    createdAt: Date.now() - 86400000 * 10
  },
  {
    id: 'pay-3',
    description: 'Recarga tarjeta de transporte Masivo',
    amount: 40000,
    category: 'Transporte',
    categoryId: 'transporte',
    dueDate: addDaysToToday(12),
    recurrence: 'semanal',
    reminderDaysBefore: 1,
    createdAt: Date.now() - 86400000 * 2
  }
];

export const SAMPLE_SEMESTER_CONFIG: SemesterConfig = {
  startDate: addDaysToToday(-45),
  endDate: addDaysToToday(65),
  incomeFrequency: 'mensual',
  incomeDay: 15,
  incomeDaySecond: 30,
  events: [
    {
      id: 'event-parciales-sample',
      title: 'Segundos Parciales',
      type: 'parciales',
      date: addDaysToToday(6)
    },
    {
      id: 'event-finales-sample',
      title: 'Exámenes Finales',
      type: 'finales',
      date: addDaysToToday(45)
    },
    {
      id: 'event-matricula-sample',
      title: 'Pago de Matrícula Próximo Semestre',
      type: 'matricula',
      date: addDaysToToday(55)
    },
    {
      id: 'event-vacaciones-sample',
      title: 'Vacaciones de Fin de Semestre',
      type: 'vacaciones',
      date: addDaysToToday(65)
    }
  ]
};

// Generamos fechas relativas a hoy para que siempre luzca fresco y actual
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = String(now.getMonth() + 1).padStart(2, '0');

function getDate(day: number): string {
  const safeDay = Math.min(28, Math.max(1, day));
  return `${currentYear}-${currentMonth}-${String(safeDay).padStart(2, '0')}`;
}

export const SAMPLE_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    type: 'income',
    amount: 650000,
    category: 'mesada',
    date: getDate(1),
    note: 'Mesada mensual de mis papás',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 12
  },
  {
    id: 'tx-2',
    type: 'income',
    amount: 220000,
    category: 'trabajo',
    date: getDate(5),
    note: 'Pago de monitoría académica en la U',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 9
  },
  {
    id: 'tx-3',
    type: 'expense',
    amount: 14500,
    category: 'comida',
    date: getDate(2),
    note: 'Almuerzo corriente con sopa y seco frente a la portería',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 11
  },
  {
    id: 'tx-4',
    type: 'expense',
    amount: 32000,
    category: 'transporte',
    date: getDate(2),
    note: 'Recarga tarjeta de transporte (semana completa)',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 11
  },
  {
    id: 'tx-5',
    type: 'expense',
    amount: 12400,
    category: 'fotocopias',
    date: getDate(3),
    note: 'Taller de cálculo integral y lecturas de humanidades',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10
  },
  {
    id: 'tx-6',
    type: 'expense',
    amount: 10900,
    category: 'suscripciones',
    date: getDate(4),
    note: 'Spotify Premium Universitario',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 9
  },
  {
    id: 'tx-7',
    type: 'expense',
    amount: 15000,
    category: 'comida',
    date: getDate(4),
    note: 'Almuerzo corriente + jugo en cafetería central',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 9
  },
  {
    id: 'tx-8',
    type: 'expense',
    amount: 38000,
    category: 'ocio',
    date: getDate(6),
    note: 'Salida a tomar polas con el parche después de parciales',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7
  },
  {
    id: 'tx-9',
    type: 'expense',
    amount: 6500,
    category: 'comida',
    date: getDate(7),
    note: 'Empanada con ají y café para trasnocho de estudio',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 6
  },
  {
    id: 'tx-10',
    type: 'expense',
    amount: 32000,
    category: 'transporte',
    date: getDate(8),
    note: 'Recarga semanal de transporte público',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5
  },
  {
    id: 'tx-11',
    type: 'expense',
    amount: 22000,
    category: 'salud',
    date: getDate(9),
    note: 'Acetaminofén y suero para la gripa en droguería',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4
  },
  {
    id: 'tx-12',
    type: 'expense',
    amount: 14000,
    category: 'comida',
    date: getDate(10),
    note: 'Almuerzo universitario corriente',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3
  },
  {
    id: 'tx-13',
    type: 'expense',
    amount: 18000,
    category: 'fotocopias',
    date: getDate(11),
    note: 'Impresión en acetato y encuadernado de proyecto',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2
  },
  {
    id: 'tx-14',
    type: 'expense',
    amount: 45000,
    category: 'ocio',
    date: getDate(12),
    note: 'Cine 2x1 y hamburguesa de promo con compañeros',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1
  },
  {
    id: 'tx-15',
    type: 'expense',
    amount: 16000,
    category: 'otros',
    date: getDate(13),
    note: 'Paquete de datos prepago para el celular',
    createdAt: Date.now() - 1000 * 60 * 60 * 12
  }
];

export const SAMPLE_SAVINGS_GOALS: SavingsGoal[] = [
  {
    id: 'goal-1',
    title: 'Portátil nuevo para programar (Ryzen 5 / 16GB)',
    targetAmount: 2600000,
    currentAmount: 1450000,
    deadline: `${currentYear}-12-15`,
    emoji: '💻',
    color: '#8b5cf6',
    notes: 'Para proyectos de ingeniería y no depender de las salas de la U',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 60
  },
  {
    id: 'goal-2',
    title: 'Viaje de fin de semestre a Santa Marta',
    targetAmount: 650000,
    currentAmount: 420000,
    deadline: `${currentYear}-11-30`,
    emoji: '🏖️',
    color: '#06b6d4',
    notes: 'Alojamiento en hostal y pasajes terrestres con el parche',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 40
  },
  {
    id: 'goal-3',
    title: 'Fondo de emergencia para fotocopias y parciales',
    targetAmount: 150000,
    currentAmount: 110000,
    deadline: `${currentYear}-11-15`,
    emoji: '🛡️',
    color: '#10b981',
    notes: 'Colchón de seguridad para no quedar varado a fin de mes',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 20
  }
];
