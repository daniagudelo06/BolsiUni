/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Vista de Configuración
 * - Configuración de API Key de Gemini (guardada 100% en localStorage).
 * - Enlace a https://aistudio.google.com/apikey con guía paso a paso gratuita.
 * - Prueba de conexión con la IA.
 * - Gestión de datos (Restablecer datos de ejemplo, Borrar todo, Exportar/Importar JSON).
 * - Perfil de estudiante universitario.
 */

import React, { useState, useEffect } from 'react';
import { 
  Key, 
  ExternalLink, 
  Check, 
  Trash2, 
  RotateCcw, 
  Download, 
  Upload, 
  Eye, 
  EyeOff, 
  User, 
  ShieldCheck, 
  Sparkles,
  Info,
  Building,
  GraduationCap,
  Calendar,
  Hourglass,
  Plus,
  Coins
} from 'lucide-react';
import { 
  AcademicEvent, 
  AcademicEventType, 
  BudgetConfig, 
  IncomeFrequency, 
  SavingsGoal, 
  SemesterConfig, 
  ScheduledPayment,
  Transaction, 
  UserProfile 
} from '../../types';
import { saveStoredApiKey, removeStoredApiKey, testApiKey } from '../../services/gemini';

interface SettingsViewProps {
  apiKey: string;
  onApiKeyChange: (newKey: string) => void;
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  semesterConfig: SemesterConfig;
  onUpdateSemesterConfig: (config: SemesterConfig) => void;
  onResetSampleData: () => void;
  onClearAllData: () => void;
  allData: {
    transactions: Transaction[];
    budget: BudgetConfig;
    goals: SavingsGoal[];
    userProfile: UserProfile;
    semester?: SemesterConfig;
    scheduledPayments?: ScheduledPayment[];
  };
  onImportData: (data: any) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  apiKey,
  onApiKeyChange,
  userProfile,
  onUpdateProfile,
  semesterConfig,
  onUpdateSemesterConfig,
  onResetSampleData,
  onClearAllData,
  allData,
  onImportData
}) => {
  const [keyInput, setKeyInput] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<{ loading: boolean; success?: boolean; message?: string }>({
    loading: false
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Perfil form
  const [profileForm, setProfileForm] = useState(userProfile);
  const [profileSaved, setProfileSaved] = useState(false);

  // Semestre y calendario form
  const [semesterForm, setSemesterForm] = useState<SemesterConfig>(semesterConfig);
  const [semesterSaved, setSemesterSaved] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState<AcademicEventType>('parciales');
  const [newEventDate, setNewEventDate] = useState('');

  useEffect(() => {
    setProfileForm(userProfile);
  }, [userProfile]);

  useEffect(() => {
    setSemesterForm(semesterConfig);
  }, [semesterConfig]);

  const handleSaveKey = () => {
    saveStoredApiKey(keyInput);
    onApiKeyChange(keyInput.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleRemoveKey = () => {
    removeStoredApiKey();
    setKeyInput('');
    onApiKeyChange('');
    setTestStatus({ loading: false });
  };

  const handleTestKey = async () => {
    if (!keyInput.trim()) {
      setTestStatus({ loading: false, success: false, message: 'Primero pega tu API Key para probarla.' });
      return;
    }
    setTestStatus({ loading: true });
    const res = await testApiKey(keyInput.trim());
    setTestStatus({ loading: false, success: res.success, message: res.message });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(profileForm);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleSaveSemester = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSemesterConfig(semesterForm);
    setSemesterSaved(true);
    setTimeout(() => setSemesterSaved(false), 3000);
  };

  const handleAddAcademicEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventDate) return;
    const newEvt: AcademicEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: newEventTitle.trim(),
      type: newEventType,
      date: newEventDate
    };
    const updated: SemesterConfig = {
      ...semesterForm,
      events: [...(semesterForm.events || []), newEvt]
    };
    setSemesterForm(updated);
    onUpdateSemesterConfig(updated);
    setNewEventTitle('');
    setNewEventDate('');
  };

  const handleRemoveAcademicEvent = (id: string) => {
    const updated: SemesterConfig = {
      ...semesterForm,
      events: (semesterForm.events || []).filter((e) => e.id !== id)
    };
    setSemesterForm(updated);
    onUpdateSemesterConfig(updated);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allData, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `EduPlata_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchorElem.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && Array.isArray(parsed.transactions)) {
            onImportData(parsed);
            alert('¡Datos restaurados con éxito desde el archivo!');
          } else {
            alert('El archivo no parece ser un respaldo válido de EduPlata.');
          }
        } catch (err) {
          alert('Error al leer el archivo JSON.');
        }
      };
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Configuración y Privacidad
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Personaliza tu perfil, conecta tu API Key de Gemini y gestiona tus datos
        </p>
      </div>

      {/* SECCIÓN 1: CONFIGURACIÓN DE GEMINI API KEY */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-600/20">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                API Key de Google Gemini AI
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tu clave se almacena exclusivamente en tu navegador (<code className="text-violet-600 font-mono">localStorage</code>), nunca en servidores ni en el código.
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-4 h-4" />
            <span>100% Privado en tu PC</span>
          </div>
        </div>

        {/* Guía para obtener la clave */}
        <div className="p-4 rounded-2xl bg-violet-50/60 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900/40 space-y-2 text-xs text-slate-700 dark:text-slate-300">
          <div className="flex items-center justify-between">
            <span className="font-bold text-violet-900 dark:text-violet-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-violet-600" />
              ¿Cómo obtener tu clave de Gemini gratis en 30 segundos?
            </span>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-violet-700 dark:text-violet-300 hover:underline"
            >
              <span>Abrir Google AI Studio</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 pl-1">
            <li>Entra a <strong className="text-violet-700 dark:text-violet-300">aistudio.google.com/apikey</strong> con tu cuenta de Google.</li>
            <li>Haz clic en el botón azul <strong className="text-slate-800 dark:text-slate-200">"Create API key"</strong>.</li>
            <li>Copia la clave generada y pégala en el campo de abajo. ¡No pide tarjeta de crédito y es gratis!</li>
          </ol>
        </div>

        {/* Campo de texto de la clave */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Tu Gemini API Key
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full pl-4 pr-12 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 font-mono text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              title={showKey ? 'Ocultar clave' : 'Mostrar clave'}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Acciones de la clave */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveKey}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/20 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Clave</span>
            </button>
            <button
              onClick={handleTestKey}
              disabled={testStatus.loading}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
            >
              {testStatus.loading ? 'Verificando...' : 'Probar Conexión'}
            </button>
            {apiKey && (
              <button
                onClick={handleRemoveKey}
                className="px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                Eliminar Clave
              </button>
            )}
          </div>

          {savedSuccess && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <Check className="w-4 h-4" /> ¡Clave guardada en tu navegador!
            </span>
          )}
        </div>

        {testStatus.message && (
          <div
            className={`p-3 rounded-2xl text-xs font-medium ${
              testStatus.success
                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}
          >
            {testStatus.message}
          </div>
        )}
      </div>

      {/* SECCIÓN 2: PERFIL UNIVERSITARIO */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Perfil de Estudiante
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personaliza el nombre que saldrá en tu informe PDF y en los consejos de la IA
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                Tu Nombre *
              </label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                Universidad o Institución *
              </label>
              <input
                type="text"
                value={profileForm.university}
                onChange={(e) => setProfileForm({ ...profileForm, university: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                Carrera o Programa
              </label>
              <input
                type="text"
                value={profileForm.career}
                onChange={(e) => setProfileForm({ ...profileForm, career: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                Semestre
              </label>
              <input
                type="text"
                value={profileForm.semester}
                onChange={(e) => setProfileForm({ ...profileForm, semester: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
            >
              Guardar Perfil
            </button>
            {profileSaved && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                ¡Perfil actualizado!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* SECCIÓN 3: PLAN DEL SEMESTRE Y CALENDARIO DE INGRESOS */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-700 dark:text-amber-400">
            <Hourglass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Plan del Semestre y Calendario de Ingresos
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configura tus fechas para la proyección de "¿Hasta cuándo me alcanza?", mesadas y exámenes
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveSemester} className="space-y-6">
          {/* Subsección A: Fechas del Semestre */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>1. Período Académico del Semestre</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Fecha de Inicio del Semestre *
                </label>
                <input
                  type="date"
                  value={semesterForm.startDate}
                  onChange={(e) => setSemesterForm({ ...semesterForm, startDate: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Fecha de Fin del Semestre *
                </label>
                <input
                  type="date"
                  value={semesterForm.endDate}
                  onChange={(e) => setSemesterForm({ ...semesterForm, endDate: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Subsección B: Frecuencia y Día de Ingresos */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span>2. Calendario de Mesada / Ingresos</span>
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  ¿Cada cuánto te llega plata? *
                </label>
                <select
                  value={semesterForm.incomeFrequency}
                  onChange={(e) => setSemesterForm({ ...semesterForm, incomeFrequency: e.target.value as IncomeFrequency })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="mensual">Mensual (una vez al mes)</option>
                  <option value="quincenal">Quincenal (dos veces al mes)</option>
                  <option value="semanal">Semanal (cada semana)</option>
                </select>
              </div>

              {/* Si es Mensual */}
              {semesterForm.incomeFrequency === 'mensual' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                    ¿Qué día del mes te consignan? * (1 al 31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={semesterForm.incomeDay || 15}
                    onChange={(e) => setSemesterForm({ ...semesterForm, incomeDay: parseInt(e.target.value, 10) || 1 })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Ej: Si pones 15, tu mesada llega el 15 de cada mes.
                  </p>
                </div>
              )}

              {/* Si es Quincenal */}
              {semesterForm.incomeFrequency === 'quincenal' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                      1er Pago (Día)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={semesterForm.incomeDay || 15}
                      onChange={(e) => setSemesterForm({ ...semesterForm, incomeDay: parseInt(e.target.value, 10) || 1 })}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                      2do Pago (Día)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={semesterForm.incomeDaySecond || 30}
                      onChange={(e) => setSemesterForm({ ...semesterForm, incomeDaySecond: parseInt(e.target.value, 10) || 30 })}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* Si es Semanal */}
              {semesterForm.incomeFrequency === 'semanal' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                    ¿Qué día de la semana te llega plata? *
                  </label>
                  <select
                    value={semesterForm.incomeDay || 5}
                    onChange={(e) => setSemesterForm({ ...semesterForm, incomeDay: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="1">Lunes</option>
                    <option value="2">Martes</option>
                    <option value="3">Miércoles</option>
                    <option value="4">Jueves</option>
                    <option value="5">Viernes</option>
                    <option value="6">Sábado</option>
                    <option value="7">Domingo</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Subsección C: Fechas Importantes */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>3. Fechas Importantes del Semestre</span>
              </h4>
              <span className="text-xs text-slate-500">
                Parciales, Finales, Matrícula, Vacaciones
              </span>
            </div>

            {/* Lista de eventos registrados */}
            <div className="space-y-2">
              {(!semesterForm.events || semesterForm.events.length === 0) ? (
                <p className="text-xs text-slate-400 italic py-2">
                  No hay fechas importantes registradas aún. Agrega tus parciales abajo para recibir alertas previas.
                </p>
              ) : (
                semesterForm.events.map((evt) => {
                  const typeLabels: Record<AcademicEventType, { label: string; emoji: string; color: string }> = {
                    parciales: { label: 'Parciales', emoji: '📝', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300' },
                    finales: { label: 'Finales', emoji: '🎓', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300' },
                    matricula: { label: 'Matrícula', emoji: '💳', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300' },
                    vacaciones: { label: 'Vacaciones', emoji: '🏖️', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' },
                    otro: { label: 'Otro', emoji: '📌', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' }
                  };
                  const meta = typeLabels[evt.type] || typeLabels.otro;

                  return (
                    <div
                      key={evt.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 ${meta.color}`}>
                          <span>{meta.emoji}</span>
                          <span>{meta.label}</span>
                        </span>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            {evt.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            Fecha: {evt.date}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveAcademicEvent(evt.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar evento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Formulario rápido para agregar nueva fecha */}
            <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Agregar Fecha Importante
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-3">
                  <select
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value as AcademicEventType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="parciales">📝 Parciales</option>
                    <option value="finales">🎓 Finales</option>
                    <option value="matricula">💳 Matrícula</option>
                    <option value="vacaciones">🏖️ Vacaciones</option>
                    <option value="otro">📌 Otro</option>
                  </select>
                </div>
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    placeholder="Ej: Semana de Parciales 2"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div className="sm:col-span-4">
                  <input
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddAcademicEvent}
                  disabled={!newEventTitle.trim() || !newEventDate}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs disabled:opacity-40 cursor-pointer"
                >
                  + Agregar Evento a la Lista
                </button>
              </div>
            </div>
          </div>

          {/* Botón Guardar Todo */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition-all cursor-pointer"
            >
              Guardar Configuración del Semestre
            </button>
            {semesterSaved && (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" /> ¡Configuración del semestre guardada!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* SECCIÓN 4: GESTIÓN DE DATOS Y RESPALDO */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Gestión de Datos y Copias de Seguridad
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Exporta tus cuentas en formato JSON o restablece los datos de ejemplo iniciales
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Exportar JSON */}
          <button
            onClick={handleExportJSON}
            className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Exportar Copia de Seguridad (JSON)</span>
          </button>

          {/* Importar JSON */}
          <label className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-violet-600" />
            <span>Importar Copia de Seguridad (JSON)</span>
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => {
              if (confirm('¿Restablecer los datos de ejemplo con movimientos universitarios colombianos? Esto reemplazará los datos actuales.')) {
                onResetSampleData();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-amber-500" />
            <span>Restablecer datos de ejemplo</span>
          </button>

          <button
            onClick={() => {
              if (confirm('¿Deseas BORRAR TODOS tus movimientos, presupuesto y metas? Esta acción no se puede deshacer.')) {
                onClearAllData();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Borrar todos mis movimientos</span>
          </button>
        </div>
      </div>

    </div>
  );
};
