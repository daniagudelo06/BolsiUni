/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Categorías y catálogo de EduPlata
 * Orientado al contexto y jerga universitaria en Colombia
 */

import { CategoryId, CategoryInfo, ExpenseCategoryId, IncomeCategoryId } from '../types';

export interface ExpenseCategoryInfo extends CategoryInfo {
  id: ExpenseCategoryId;
  type: 'expense';
}

export interface IncomeCategoryInfo extends CategoryInfo {
  id: IncomeCategoryId;
  type: 'income';
}

export const EXPENSE_CATEGORIES: Record<ExpenseCategoryId, ExpenseCategoryInfo> = {
  comida: {
    id: 'comida',
    name: 'Comida',
    emoji: '🍱',
    color: '#f97316', // Orange
    bgLight: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800/40',
    type: 'expense',
    description: 'Almuerzos corrientazos, empanadas, tinto, cafetería de la U'
  },
  transporte: {
    id: 'transporte',
    name: 'Transporte',
    emoji: '🚌',
    color: '#0284c7', // Sky
    bgLight: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800/40',
    type: 'expense',
    description: 'TransMilenio, Metro, MIO, busetas, gasolina, taxi'
  },
  fotocopias: {
    id: 'fotocopias',
    name: 'Fotocopias y útiles',
    emoji: '📚',
    color: '#eab308', // Yellow/Amber
    bgLight: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40',
    type: 'expense',
    description: 'Impresiones, copias de lecturas, cuadernos, resaltadores'
  },
  matricula: {
    id: 'matricula',
    name: 'Matrícula y semestre',
    emoji: '🎓',
    color: '#8b5cf6', // Violet
    bgLight: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800/40',
    type: 'expense',
    description: 'Cuota de matrícula, derechos de grado, carné estudiantil'
  },
  ocio: {
    id: 'ocio',
    name: 'Salidas y ocio',
    emoji: '🍻',
    color: '#ec4899', // Pink
    bgLight: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800/40',
    type: 'expense',
    description: 'Polas con el parche, rumbas, cine, café de viernes'
  },
  suscripciones: {
    id: 'suscripciones',
    name: 'Suscripciones',
    emoji: '🎧',
    color: '#06b6d4', // Cyan
    bgLight: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800/40',
    type: 'expense',
    description: 'Spotify Estudiantes, Netflix, Canva, almacenamiento'
  },
  vivienda: {
    id: 'vivienda',
    name: 'Vivienda y arriendo',
    emoji: '🏠',
    color: '#0d9488', // Teal
    bgLight: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800/40',
    type: 'expense',
    description: 'Arriendo de pieza, apartamento, residencia estudiantil, servicios'
  },
  salud: {
    id: 'salud',
    name: 'Salud y bienestar',
    emoji: '💊',
    color: '#10b981', // Emerald
    bgLight: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
    type: 'expense',
    description: 'Medicamentos, citas médicas, seguro, gimnasio'
  },
  otros: {
    id: 'otros',
    name: 'Otros gastos',
    emoji: '📦',
    color: '#64748b', // Slate
    bgLight: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800/40',
    type: 'expense',
    description: 'Recargas de celular, regalos, imprevistos'
  }
};

export const INCOME_CATEGORIES: Record<IncomeCategoryId, IncomeCategoryInfo> = {
  mesada: {
    id: 'mesada',
    name: 'Mesada familiar',
    emoji: '👨‍👩‍👦',
    color: '#10b981',
    bgLight: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
    type: 'income',
    description: 'Apoyo económico de tus papás o familiares'
  },
  trabajo: {
    id: 'trabajo',
    name: 'Trabajo / Medio tiempo',
    emoji: '💼',
    color: '#6366f1',
    bgLight: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/40',
    type: 'income',
    description: 'Sueldo de call center, mesero, freelance, monitoría'
  },
  auxilio: {
    id: 'auxilio',
    name: 'Beca / Auxilio U',
    emoji: '📜',
    color: '#8b5cf6',
    bgLight: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/40',
    type: 'income',
    description: 'Jóvenes en Acción / Renta Joven, auxilio de transporte o alimentación'
  },
  emprendimiento: {
    id: 'emprendimiento',
    name: 'Emprendimiento / Ventas',
    emoji: '🧁',
    color: '#f59e0b',
    bgLight: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40',
    type: 'income',
    description: 'Venta de postres, dulces, tareas o asesorías'
  },
  otros_ingresos: {
    id: 'otros_ingresos',
    name: 'Otros ingresos',
    emoji: '💰',
    color: '#14b8a6',
    bgLight: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800/40',
    type: 'income',
    description: 'Regalos de cumpleaños, rifas, ahorros devueltos'
  }
};

export const ALL_CATEGORIES: Record<CategoryId, CategoryInfo> = {
  ...EXPENSE_CATEGORIES,
  ...INCOME_CATEGORIES
};

export function getCategoryInfo(categoryId: CategoryId): CategoryInfo {
  return ALL_CATEGORIES[categoryId] || {
    id: categoryId,
    name: categoryId,
    emoji: '📌',
    color: '#64748b',
    bgLight: 'bg-slate-500/10 text-slate-600 border-slate-200',
    type: 'expense',
    description: 'Categoría general'
  };
}

/**
 * Mapea el nombre de categoría retornado por Claude a un CategoryId interno de EduPlata
 */
export function mapClaudeCategoryToCategoryId(rawCategory: string, movementType?: 'gasto' | 'ingreso'): CategoryId {
  const norm = (rawCategory || '').toLowerCase().trim();

  if (norm.includes('comida') || norm.includes('almuerzo') || norm.includes('empanada')) return 'comida';
  if (norm.includes('transporte') || norm.includes('pasaje') || norm.includes('bus') || norm.includes('metro')) return 'transporte';
  if (norm.includes('fotocopia') || norm.includes('útil') || norm.includes('util')) return 'fotocopias';
  if (norm.includes('suscrip')) return 'suscripciones';
  if (norm.includes('salida') || norm.includes('rumba') || norm.includes('ocio')) return 'ocio';
  if (norm.includes('vivienda') || norm.includes('arriendo') || norm.includes('servicio')) return 'vivienda';
  if (norm.includes('salud')) return 'salud';
  if (norm.includes('matr') || norm.includes('u\b')) return 'matricula';

  if (norm.includes('mesada')) return 'mesada';
  if (norm.includes('trabajo') || norm.includes('freelance') || norm.includes('sueldo')) return 'trabajo';
  if (norm.includes('beca') || norm.includes('auxilio')) return 'auxilio';

  // Por tipo si no encaja
  if (movementType === 'ingreso') return 'otros_ingresos';
  return 'otros';
}

