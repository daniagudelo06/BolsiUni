/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Navegación por pestañas: Inicio, Chat rápido, Calendario, Movimientos, Presupuesto, Metas, Asistente IA, Configuración
 */

import React from 'react';
import { 
  LayoutDashboard, 
  MessageSquare,
  CalendarDays,
  ArrowLeftRight, 
  PieChart, 
  Target, 
  Sparkles, 
  Settings 
} from 'lucide-react';
import { ActiveTab } from '../types';

interface TabsNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  hasApiKey: boolean;
}

interface TabItem {
  id: ActiveTab;
  label: string;
  mobileLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  isSpecial?: boolean;
}

export const TabsNav: React.FC<TabsNavProps> = ({ activeTab, onTabChange, hasApiKey }) => {
  const tabs: TabItem[] = [
    { id: 'dashboard', label: 'Inicio', mobileLabel: 'Inicio', icon: LayoutDashboard },
    { id: 'chat', label: 'Chat rápido', mobileLabel: 'Chat', icon: MessageSquare, isSpecial: true },
    { id: 'calendar', label: 'Calendario', mobileLabel: 'Calendario', icon: CalendarDays },
    { id: 'transactions', label: 'Movimientos', mobileLabel: 'Movimientos', icon: ArrowLeftRight },
    { id: 'budget', label: 'Presupuesto', mobileLabel: 'Presupuesto', icon: PieChart },
    { id: 'goals', label: 'Metas', mobileLabel: 'Metas', icon: Target },
    { 
      id: 'ai', 
      label: 'Asistente IA', 
      mobileLabel: 'IA',
      icon: Sparkles, 
      badge: hasApiKey ? undefined : 'Clave' 
    },
    { id: 'settings', label: 'Configuración', mobileLabel: 'Ajustes', icon: Settings },
  ];

  return (
    <>
      {/* Navegación Desktop / Tablet (Barra superior bajo el header) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-1.5 py-2 overflow-x-auto scrollbar-none" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all relative whitespace-nowrap cursor-pointer ${
                    isActive
                      ? tab.isSpecial
                        ? 'bg-emerald-600 text-white shadow-sm font-bold'
                        : 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 font-bold'
                      : tab.isSpecial
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${
                    isActive && tab.isSpecial
                      ? 'text-white'
                      : isActive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : tab.isSpecial
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-bold animate-pulse">
                      {tab.badge}
                    </span>
                  )}
                  {isActive && !tab.isSpecial && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-emerald-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Navegación Móvil (Barra fija inferior estilo app móvil nativa, scroll horizontal fluido con indicador) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 transition-colors shadow-lg shadow-black/10">
        <div className="flex items-center h-16 px-1 overflow-x-auto scrollbar-none gap-0.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center h-full min-w-[62px] px-1 py-1 transition-all relative shrink-0 cursor-pointer ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <div
                  className={`p-1 rounded-xl transition-all ${
                    tab.isSpecial && isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : tab.isSpecial
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/80 scale-105'
                      : ''
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium leading-tight mt-0.5 truncate max-w-[58px]">
                  {tab.mobileLabel}
                </span>
                {tab.badge && (
                  <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900 animate-ping" />
                )}
                {isActive && !tab.isSpecial && (
                  <span className="absolute top-0 w-8 h-0.5 bg-emerald-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
