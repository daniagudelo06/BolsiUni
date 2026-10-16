/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Barra de navegación superior de EduPlata
 */

import React from 'react';
import { Download, FileSpreadsheet, Moon, Sun, Wallet, Sparkles, GraduationCap } from 'lucide-react';
import { formatCOP } from '../utils/formatters';

interface NavbarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  balance: number;
  onExportPDF: () => void;
  onExportExcel: () => void;
  hasApiKey?: boolean;
  onOpenSettings: () => void;
  studentName: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  onToggleDarkMode,
  balance,
  onExportPDF,
  onExportExcel,
  onOpenSettings,
  studentName
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo y Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-violet-600 dark:from-emerald-400 dark:to-violet-400 bg-clip-text text-transparent">
                EduPlata
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800/60 hidden sm:inline-flex items-center gap-1">
                🇨🇴 COP
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Finanzas para Universitarios
            </p>
          </div>
        </div>

        {/* Acciones del header */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Indicador de Saldo Rápido */}
          <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
            <span className="text-xs text-slate-500 dark:text-slate-400">Saldo:</span>
            <span className={`text-sm font-bold font-mono ${balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCOP(balance)}
            </span>
          </div>

          {/* Botón Descargar PDF */}
          <button
            onClick={onExportPDF}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
            title="Descargar informe del mes en PDF"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden xs:inline">Informe PDF</span>
          </button>

          {/* Botón Descargar Excel */}
          <button
            onClick={onExportExcel}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
            title="Descargar movimientos en Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden xs:inline">Excel</span>
          </button>

          {/* Alternar Modo Oscuro / Claro */}
          <button
            onClick={onToggleDarkMode}
            aria-label="Alternar tema"
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Perfil del estudiante avatar */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 pl-1 group cursor-pointer"
            title={`Perfil de ${studentName}`}
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
          </button>

        </div>
      </div>
    </header>
  );
};
