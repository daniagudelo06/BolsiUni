/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * EduPlata - Pestaña Chat Rápido (Integración con Claude de Anthropic)
 * Entrada por lenguaje natural en jerga universitaria colombiana con texto y dictado por voz (es-CO).
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Mic, 
  MicOff, 
  Sparkles, 
  Check, 
  X, 
  Edit3, 
  Calendar, 
  Clock, 
  ArrowDownRight, 
  ArrowUpRight, 
  Trash2, 
  Info,
  HelpCircle,
  PlusCircle
} from 'lucide-react';
import { 
  QuickChatMessage, 
  ClaudeToolCall, 
  Transaction, 
  ScheduledPayment, 
  CategoryId, 
  MovementType 
} from '../../types';
import { sendChatMessageToClaude } from '../../services/claudeService';
import { formatCOP } from '../../utils/formatters';
import { getCategoryInfo, mapClaudeCategoryToCategoryId, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../utils/categories';

interface QuickChatViewProps {
  onAddTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onAddScheduledPayment: (payment: Omit<ScheduledPayment, 'id' | 'createdAt'>) => void;
  transactions: Transaction[];
  onOpenManualTransactionModal: () => void;
  initialMessageToSend?: string;
  onClearInitialMessage?: () => void;
}

const STORAGE_CHAT_KEY = 'eduplata_claude_quick_chat_history_v1';

export const QuickChatView: React.FC<QuickChatViewProps> = ({
  onAddTransaction,
  onAddScheduledPayment,
  transactions,
  onOpenManualTransactionModal,
  initialMessageToSend,
  onClearInitialMessage
}) => {
  const [messages, setMessages] = useState<QuickChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CHAT_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'msg-welcome',
        sender: 'assistant',
        text: '¡Hola parcero! 🇨🇴 Soy tu asistente de EduPlata impulsado por Claude. Escríbeme o háblame con el micrófono en jerga colombiana ("almuerzo 12 lucas y pasaje 3200", "arriendo 650 mil el 30", etc.) y yo lo convierto en movimientos o pagos programados.',
        timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Estados de edición inline de una tarjeta pendiente
  const [editingCallId, setEditingCallId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Guardar historial en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
  }, [messages]);

  // Auto-scroll al final
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Si viene con mensaje inicial desde el Dashboard
  useEffect(() => {
    if (initialMessageToSend && initialMessageToSend.trim()) {
      handleSendMessage(initialMessageToSend.trim());
      onClearInitialMessage?.();
    }
  }, [initialMessageToSend]);

  // Inicializar SpeechRecognition (Web Speech API es-CO)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-CO';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputVal((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          setSpeechError('Permiso de micrófono denegado en tu navegador.');
        } else if (event.error !== 'no-speech') {
          setSpeechError('No pude escuchar claramente. Puedes intentar de nuevo.');
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const handleToggleRecord = () => {
    if (!recognitionRef.current) {
      setSpeechError('Tu navegador no soporta dictado por voz (Web Speech API). Puedes escribir el texto.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setSpeechError(null);
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Error starting recognition:', err);
      }
    }
  };

  // Enviar mensaje
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputVal).trim();
    if (!query) return;

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    const userMessage: QuickChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputVal('');
    setIsTyping(true);

    // Llamada al backend de Claude
    const response = await sendChatMessageToClaude(query, [...messages, userMessage]);

    setIsTyping(false);

    if (!response.success) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'assistant',
          text: response.error || 'No pude procesar eso ahora, intenta de nuevo.',
          timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      return;
    }

    // Si Claude devolvió herramientas
    const tools = response.tools || [];
    const formattedToolCalls: ClaudeToolCall[] = tools.map((t, idx) => ({
      id: t.id || `call-${Date.now()}-${idx}`,
      toolName: t.toolName as any,
      parameters: t.parameters,
      status: 'pending'
    }));

    // Si tiene pedir_aclaracion, la pregunta va como texto del asistente
    const clarificationCall = formattedToolCalls.find((t) => t.toolName === 'pedir_aclaracion');
    const normalToolCalls = formattedToolCalls.filter((t) => t.toolName !== 'pedir_aclaracion');

    const assistantText = clarificationCall
      ? clarificationCall.parameters.pregunta
      : response.text || (normalToolCalls.length > 0 ? 'Detecté lo siguiente, ¿deseas guardarlo?' : 'Recibido.');

    const assistantMsg: QuickChatMessage = {
      id: `bot-${Date.now()}`,
      sender: 'assistant',
      text: assistantText,
      toolCalls: normalToolCalls.length > 0 ? normalToolCalls : undefined,
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, assistantMsg]);
  };

  // Confirmar y Guardar un movimiento o pago programado
  const handleConfirmTool = (messageId: string, toolCall: ClaudeToolCall) => {
    // 1. Si es registrar_movimiento
    if (toolCall.toolName === 'registrar_movimiento') {
      const p = toolCall.parameters;
      const type: MovementType = p.tipo === 'ingreso' ? 'income' : 'expense';
      const categoryId: CategoryId = mapClaudeCategoryToCategoryId(p.categoria, p.tipo);
      
      onAddTransaction({
        type,
        amount: Number(p.monto),
        category: categoryId,
        date: p.fecha || new Date().toISOString().slice(0, 10),
        note: p.descripcion || 'Registrado con Chat Rápido'
      });

      // Calcular cuánto lleva hoy en esa categoría
      const today = p.fecha || new Date().toISOString().slice(0, 10);
      const catSpentToday = transactions
        .filter((t) => t.category === categoryId && t.type === 'expense' && t.date === today)
        .reduce((sum, t) => sum + t.amount, 0) + (type === 'expense' ? Number(p.monto) : 0);

      const catInfo = getCategoryInfo(categoryId);
      const friendlyFeedback = type === 'expense'
        ? `Listo ✅ Guardé $${Number(p.monto).toLocaleString('es-CO')} en ${catInfo.name}. Llevas $${catSpentToday.toLocaleString('es-CO')} en ${catInfo.name.toLowerCase()} hoy.`
        : `Listo ✅ Ingreso de $${Number(p.monto).toLocaleString('es-CO')} guardado en ${catInfo.name}.`;

      // Marcar herramienta como guardada
      updateToolStatus(messageId, toolCall.id, 'saved');

      // Agregar mensaje de confirmación cordial del asistente
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-conf-${Date.now()}`,
          sender: 'assistant',
          text: friendlyFeedback,
          timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } 
    // 2. Si es programar_pago
    else if (toolCall.toolName === 'programar_pago') {
      const p = toolCall.parameters;
      const categoryId: CategoryId = mapClaudeCategoryToCategoryId(p.categoria, 'gasto');

      onAddScheduledPayment({
        description: p.descripcion || 'Pago programado',
        amount: Number(p.monto),
        category: p.categoria || 'Otros',
        categoryId,
        dueDate: p.fecha_vencimiento,
        recurrence: p.recurrencia || 'ninguna',
        reminderDaysBefore: Number(p.recordatorio_dias_antes) || 1
      });

      updateToolStatus(messageId, toolCall.id, 'saved');

      const friendlyFeedback = `Listo ✅ Pago de ${p.descripcion} ($${Number(p.monto).toLocaleString('es-CO')}) programado para el ${p.fecha_vencimiento}. Recuerda que no se descuenta de tu saldo actual todavía.`;

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-conf-${Date.now()}`,
          sender: 'assistant',
          text: friendlyFeedback,
          timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  // Descartar una herramienta
  const handleDiscardTool = (messageId: string, toolCallId: string) => {
    updateToolStatus(messageId, toolCallId, 'discarded');
  };

  // Iniciar edición de una herramienta
  const handleStartEdit = (toolCall: ClaudeToolCall) => {
    setEditingCallId(toolCall.id);
    setEditFormData({ ...toolCall.parameters });
  };

  // Guardar edición y confirmar
  const handleSaveEdit = (messageId: string, toolCall: ClaudeToolCall) => {
    // Actualizar parámetros modificados
    const updatedCall = {
      ...toolCall,
      parameters: { ...editFormData }
    };
    setEditingCallId(null);
    handleConfirmTool(messageId, updatedCall);
  };

  const updateToolStatus = (messageId: string, toolCallId: string, status: 'saved' | 'discarded') => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId || !msg.toolCalls) return msg;
        return {
          ...msg,
          toolCalls: msg.toolCalls.map((tc) =>
            tc.id === toolCallId ? { ...tc, status } : tc
          )
        };
      })
    );
  };

  const handleClearHistory = () => {
    if (window.confirm('¿Quieres limpiar el historial del chat rápido?')) {
      const initial: QuickChatMessage[] = [
        {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          text: 'Historial reiniciado. ¿Qué movimiento o pago programado quieres registrar hoy?',
          timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
        }
      ];
      setMessages(initial);
      localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(initial));
    }
  };

  const quickChips = [
    { label: 'Empanada 4.000', query: 'compré una empanada de 4.000 pesos' },
    { label: 'Almuerzo 12 lucas y pasaje 3200', query: 'almuerzo 12 lucas y pasaje 3200' },
    { label: 'Mesada 400 mil', query: 'me consignaron 400 mil de la mesada' },
    { label: 'Arriendo 650.000 el 30', query: 'el 30 tengo que pagar el arriendo de 650.000' },
    { label: 'Spotify 9.900 cada mes el 5', query: 'cada mes el 5 me cobran Spotify 9.900' }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-170px)] max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-colors">
      
      {/* HEADER ESTILO WHATSAPP CON TONO UNIVERSITARIO */}
      <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md font-bold text-lg">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-900 rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm sm:text-base leading-tight">Chat Rápido EduPlata</h2>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                Claude Haiku
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {isTyping ? (
                <span className="text-emerald-400 font-medium animate-pulse">escribiendo...</span>
              ) : isRecording ? (
                <span className="text-rose-400 font-medium animate-pulse">escuchando en vivo...</span>
              ) : (
                'En línea • Registro inteligente en COP'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenManualTransactionModal}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer text-xs flex items-center gap-1.5"
            title="Registro manual tradicional"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Manual</span>
          </button>
          <button
            onClick={handleClearHistory}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Limpiar chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ÁREA DE MENSAJES Y BURBUJAS */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100/60 dark:bg-slate-950/70">
        
        {/* Banner de jerga y tips */}
        <div className="text-center my-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800/80 px-3 py-1.5 rounded-full shadow-xs border border-slate-200 dark:border-slate-700">
            <Info className="w-3.5 h-3.5 text-emerald-500" />
            Usa jerga colombiana: <em>"12 lucas"</em>, <em>"un palo"</em>, <em>"20k"</em>, <em>"el 30 arriendo"</em>
          </span>
        </div>

        {/* Lista de burbujas */}
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
            >
              {/* Burbuja principal */}
              <div
                className={`max-w-[88%] sm:max-w-[78%] rounded-2xl px-4 py-2.5 shadow-sm text-sm ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-br-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-xs border border-slate-200/80 dark:border-slate-700/80'
                }`}
              >
                {msg.text && (
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                )}
                <div
                  className={`text-[10px] text-right mt-1 font-medium ${
                    isUser ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {/* TARJETAS DE HERRAMIENTAS (CONFIRMACIÓN ANTES DE GUARDAR) */}
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div className="w-full max-w-[92%] sm:max-w-[85%] space-y-2 mt-1">
                  {msg.toolCalls.map((toolCall) => {
                    const isEditing = editingCallId === toolCall.id;
                    const isSaved = toolCall.status === 'saved';
                    const isDiscarded = toolCall.status === 'discarded';

                    // 1. TARJETA DE MOVIMIENTO (GASTO / INGRESO)
                    if (toolCall.toolName === 'registrar_movimiento') {
                      const p = toolCall.parameters;
                      const isGasto = p.tipo === 'gasto';
                      const catId = mapClaudeCategoryToCategoryId(p.categoria, p.tipo);
                      const catInfo = getCategoryInfo(catId);

                      return (
                        <div
                          key={toolCall.id}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            isSaved
                              ? 'bg-emerald-500/10 border-emerald-500/40 opacity-80'
                              : isDiscarded
                              ? 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-800 opacity-50 line-through'
                              : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-750 shadow-md'
                          }`}
                        >
                          {!isEditing ? (
                            <div className="space-y-3">
                              {/* Header tarjeta */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xl p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                    {catInfo.emoji}
                                  </span>
                                  <div>
                                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                                      {p.descripcion || catInfo.name}
                                    </h4>
                                    <span className="text-xs text-slate-600 dark:text-slate-400">
                                      {p.categoria || catInfo.name} • {p.fecha}
                                    </span>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <span
                                    className={`inline-block text-xs font-bold px-2 py-0.5 rounded-md ${
                                      isGasto
                                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                        : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                    }`}
                                  >
                                    {isGasto ? 'Gasto' : 'Ingreso'}
                                  </span>
                                  <p
                                    className={`text-base font-extrabold font-mono mt-0.5 ${
                                      isGasto
                                        ? 'text-rose-600 dark:text-rose-400'
                                        : 'text-emerald-600 dark:text-emerald-400'
                                    }`}
                                  >
                                    {isGasto ? '-' : '+'} {formatCOP(p.monto)}
                                  </p>
                                </div>
                              </div>

                              {/* Botones de acción */}
                              {!isSaved && !isDiscarded && (
                                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                                  <button
                                    onClick={() => handleDiscardTool(msg.id, toolCall.id)}
                                    className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    Descartar
                                  </button>
                                  <button
                                    onClick={() => handleStartEdit(toolCall)}
                                    className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors cursor-pointer flex items-center gap-1 font-medium"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => handleConfirmTool(msg.id, toolCall)}
                                    className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5 hover:scale-102"
                                  >
                                    <Check className="w-4 h-4 stroke-[3]" />
                                    ✓ Guardar
                                  </button>
                                </div>
                              )}

                              {isSaved && (
                                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
                                  <Check className="w-4 h-4" />
                                  Movimiento guardado exitosamente
                                </div>
                              )}
                            </div>
                          ) : (
                            /* MODO EDICIÓN INLINE */
                            <div className="space-y-3 p-1">
                              <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300">
                                Editar movimiento antes de guardar:
                              </h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div>
                                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Descripción</label>
                                  <input
                                    type="text"
                                    value={editFormData.descripcion || ''}
                                    onChange={(e) =>
                                      setEditFormData({ ...editFormData, descripcion: e.target.value })
                                    }
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                                  />
                                </div>
                                <div>
                                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Monto (COP)</label>
                                  <input
                                    type="number"
                                    value={editFormData.monto || ''}
                                    onChange={(e) =>
                                      setEditFormData({ ...editFormData, monto: parseInt(e.target.value, 10) || 0 })
                                    }
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Categoría</label>
                                  <select
                                    value={editFormData.categoria || 'Comida'}
                                    onChange={(e) =>
                                      setEditFormData({ ...editFormData, categoria: e.target.value })
                                    }
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                                  >
                                    <option value="Comida">Comida</option>
                                    <option value="Transporte">Transporte</option>
                                    <option value="Fotocopias y útiles">Fotocopias y útiles</option>
                                    <option value="Suscripciones">Suscripciones</option>
                                    <option value="Salidas y rumba">Salidas y rumba</option>
                                    <option value="Vivienda">Vivienda</option>
                                    <option value="Salud">Salud</option>
                                    <option value="Matrícula y U">Matrícula y U</option>
                                    <option value="Mesada familiar">Mesada familiar</option>
                                    <option value="Trabajo/freelance">Trabajo/freelance</option>
                                    <option value="Becas y auxilios">Becas y auxilios</option>
                                    <option value="Otros">Otros</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Fecha</label>
                                  <input
                                    type="date"
                                    value={editFormData.fecha || ''}
                                    onChange={(e) =>
                                      setEditFormData({ ...editFormData, fecha: e.target.value })
                                    }
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                  onClick={() => setEditingCallId(null)}
                                  className="px-3 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer"
                                >
                                  Cancelar
                                </button>
                                <button
                                  onClick={() => handleSaveEdit(msg.id, toolCall)}
                                  className="px-4 py-1.5 text-xs bg-emerald-600 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Guardar cambios
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }

                    // 2. TARJETA DE PAGO PROGRAMADO
                    if (toolCall.toolName === 'programar_pago') {
                      const p = toolCall.parameters;
                      const catId = mapClaudeCategoryToCategoryId(p.categoria, 'gasto');
                      const catInfo = getCategoryInfo(catId);

                      return (
                        <div
                          key={toolCall.id}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            isSaved
                              ? 'bg-purple-500/10 border-purple-500/40 opacity-80'
                              : isDiscarded
                              ? 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-800 opacity-50 line-through'
                              : 'bg-white dark:bg-slate-850 border-purple-300/80 dark:border-purple-800/80 shadow-md'
                          }`}
                        >
                          {!isEditing ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                                    <Calendar className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                                        {p.descripcion}
                                      </h4>
                                      <span className="text-[10px] bg-purple-500/15 text-purple-600 dark:text-purple-300 font-semibold px-2 py-0.5 rounded-full border border-purple-500/30">
                                        Pago futuro ({p.recurrencia})
                                      </span>
                                    </div>
                                    <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                      <Clock className="w-3 h-3 text-purple-500" />
                                      Vence: {p.fecha_vencimiento} • {p.categoria}
                                    </span>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <span className="text-xs text-slate-600 dark:text-slate-400 block">
                                    {p.recurrencia === 'mensual' ? 'Cada mes' : p.recurrencia === 'semanal' ? 'Cada semana' : 'Pago único'}
                                  </span>
                                  <p className="text-base font-extrabold font-mono text-purple-600 dark:text-purple-400">
                                    {formatCOP(p.monto)}
                                  </p>
                                </div>
                              </div>

                              {!isSaved && !isDiscarded && (
                                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                                  <button
                                    onClick={() => handleDiscardTool(msg.id, toolCall.id)}
                                    className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    Descartar
                                  </button>
                                  <button
                                    onClick={() => handleStartEdit(toolCall)}
                                    className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors cursor-pointer flex items-center gap-1 font-medium"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => handleConfirmTool(msg.id, toolCall)}
                                    className="px-4 py-1.5 text-xs bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5 hover:scale-102"
                                  >
                                    <Check className="w-4 h-4 stroke-[3]" />
                                    ✓ Guardar en Calendario
                                  </button>
                                </div>
                              )}

                              {isSaved && (
                                <div className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-semibold pt-1">
                                  <Check className="w-4 h-4" />
                                  Pago programado en tu Calendario EduPlata
                                </div>
                              )}
                            </div>
                          ) : (
                            /* EDICIÓN PAGO PROGRAMADO */
                            <div className="space-y-3 p-1 text-xs">
                              <h5 className="font-bold text-slate-700 dark:text-slate-300">
                                Editar pago programado:
                              </h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Descripción</label>
                                  <input
                                    type="text"
                                    value={editFormData.descripcion || ''}
                                    onChange={(e) =>
                                      setEditFormData({ ...editFormData, descripcion: e.target.value })
                                    }
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                                  />
                                </div>
                                <div>
                                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Monto (COP)</label>
                                  <input
                                    type="number"
                                    value={editFormData.monto || ''}
                                    onChange={(e) =>
                                      setEditFormData({ ...editFormData, monto: parseInt(e.target.value, 10) || 0 })
                                    }
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Fecha de vencimiento</label>
                                  <input
                                    type="date"
                                    value={editFormData.fecha_vencimiento || ''}
                                    onChange={(e) =>
                                      setEditFormData({ ...editFormData, fecha_vencimiento: e.target.value })
                                    }
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                                  />
                                </div>
                                <div>
                                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Recurrencia</label>
                                  <select
                                    value={editFormData.recurrencia || 'ninguna'}
                                    onChange={(e) =>
                                      setEditFormData({ ...editFormData, recurrencia: e.target.value })
                                    }
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                                  >
                                    <option value="ninguna">Única vez</option>
                                    <option value="mensual">Mensual</option>
                                    <option value="semanal">Semanal</option>
                                  </select>
                                </div>
                              </div>
                              <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                  onClick={() => setEditingCallId(null)}
                                  className="px-3 py-1 text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer"
                                >
                                  Cancelar
                                </button>
                                <button
                                  onClick={() => handleSaveEdit(msg.id, toolCall)}
                                  className="px-4 py-1.5 bg-purple-600 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Guardar cambios
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* INDICADOR ESCRIBIENDO ESTILO WHATSAPP */}
        {isTyping && (
          <div className="flex items-center gap-2 max-w-[120px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl rounded-bl-xs shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}

        {speechError && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span>{speechError}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* CHIPS RÁPIDOS CLIQUEABLES */}
      <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 overflow-x-auto scrollbar-none flex items-center gap-1.5">
        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-500" />
          Ejemplos:
        </span>
        {quickChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(chip.query)}
            className="text-xs shrink-0 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:border-emerald-500/40 border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* BARRA DE ENTRADA ESTILO WHATSAPP (TEXTO + MICRÓFONO + ENVIAR) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
      >
        {/* Botón de Micrófono Web Speech API (es-CO) */}
        <button
          type="button"
          onClick={handleToggleRecord}
          className={`p-3 rounded-2xl transition-all cursor-pointer flex items-center justify-center shrink-0 ${
            isRecording
              ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30 ring-2 ring-rose-400'
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300'
          }`}
          title={isRecording ? 'Detener dictado' : 'Dictar por voz en español colombiano (es-CO)'}
        >
          {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
        </button>

        {/* Input de texto */}
        <div className="relative flex-1">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={
              isRecording
                ? 'Escuchando tu voz en Colombia...'
                : 'Escribe: "almuerzo 12 lucas y pasaje 3200", "el 30 arriendo 650k"...'
            }
            disabled={isTyping}
            className="w-full pl-4 pr-10 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white placeholder-slate-600 dark:placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>

        {/* Botón Enviar */}
        <button
          type="submit"
          disabled={!inputVal.trim() || isTyping}
          className={`p-3 rounded-2xl flex items-center justify-center transition-all shrink-0 ${
            inputVal.trim() && !isTyping
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 cursor-pointer active:scale-95'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
          }`}
          title="Enviar mensaje"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};
