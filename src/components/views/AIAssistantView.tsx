/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Vista del Asistente con IA (Gemini API)
 * 1. Diagnóstico completo: Resumen amigable, 3 gastos a recortar, 3 consejos realistas.
 * 2. Chat financiero universitario interactivo ("¿Me alcanza para ir a un concierto?").
 */

import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Scissors, 
  Lightbulb, 
  MessageSquare, 
  Key, 
  RefreshCw, 
  Bot, 
  User, 
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { AIAnalysisResult, BudgetConfig, ChatMessage, SavingsGoal, Transaction, UserProfile } from '../../types';
import { analyzeFinancesWithClaude, chatWithClaudeFinancialAdvisor } from '../../services/claudeService';
import { formatCOP } from '../../utils/formatters';

interface AIAssistantViewProps {
  transactions: Transaction[];
  budget: BudgetConfig;
  goals: SavingsGoal[];
  userProfile: UserProfile;
  aiAnalysis: AIAnalysisResult | null;
  onSaveAnalysis: (result: AIAnalysisResult) => void;
  hasApiKey?: boolean;
  onOpenSettings?: () => void;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  transactions,
  budget,
  goals,
  userProfile,
  aiAnalysis,
  onSaveAnalysis
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Chat interactivo
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `¡Hola ${userProfile.name.split(' ')[0] || 'parcero'}! 👋 Soy tu asesor EduPlata con IA. Conozco tus movimientos, tu presupuesto y tus metas de ahorro.\n\nPuedes preguntarme cosas como "¿Me alcanza para ir a un concierto este mes?", "¿Cuánto me queda después de pagar el transporte?", o pedirme ideas para ahorrar en la cafetería. ¿Qué duda tienes sobre tu plata?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Ejecutar el diagnóstico completo con Claude
  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const result = await analyzeFinancesWithClaude(transactions, budget, goals, userProfile);
      onSaveAnalysis(result);
    } catch (err: any) {
      setAnalysisError(err.message || 'Error al conectar con el Asistente IA. Inténtalo de nuevo.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Enviar mensaje en el chat con Claude
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputQuestion.trim();
    if (!textToSend || isSending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    setInputQuestion('');
    setIsSending(true);
    setChatError(null);

    try {
      const replyText = await chatWithClaudeFinancialAdvisor(
        textToSend,
        newHistory,
        transactions,
        budget,
        goals,
        userProfile
      );

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setChatError(err.message || 'No pude responder en este momento.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* CABECERA PRINCIPAL Y BOTÓN DE ANÁLISIS */}
      <div className="bg-gradient-to-r from-violet-700 via-indigo-700 to-purple-800 text-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-violet-900/20 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-amber-300 mb-3 border border-white/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Asistente Inteligente de Bolsillo • Claude AI</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Diagnóstico Financiero con IA
          </h2>
          <p className="text-xs sm:text-sm text-violet-200 mt-2 leading-relaxed">
            El Asistente analiza en segundos todos tus movimientos de comida, fotocopias, transporte y salidas para decirte exactamente dónde se te va la plata y darte 3 recortes y 3 tips realistas.
          </p>
        </div>

        <div className="relative z-10 shrink-0">
          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm text-violet-950 bg-white hover:bg-amber-300 transition-all shadow-lg shadow-black/15 cursor-pointer ${
              isAnalyzing ? 'opacity-80 cursor-wait' : ''
            }`}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-violet-600" />
                <span>Analizando tus cuentas...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-violet-600" />
                <span>Analizar mis finanzas</span>
              </>
            )}
          </button>
        </div>

        {/* Círculos decorativos de fondo */}
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
      </div>

      {analysisError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{analysisError}</span>
        </div>
      )}

      {/* RESULTADOS DEL ANÁLISIS DE IA (SI EXISTEN) */}
      {aiAnalysis && (
        <div className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
          
          {/* A) RESUMEN AMIGABLE */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950/80 flex items-center justify-center text-violet-600 dark:text-violet-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Diagnóstico de tu Bolsillo
                </h3>
                <span className="text-[11px] text-slate-400">
                  Generado con Gemini AI en lenguaje simple
                </span>
              </div>
            </div>

            <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed bg-violet-50/50 dark:bg-violet-950/30 p-4 rounded-2xl border border-violet-100 dark:border-violet-900/40">
              {aiAnalysis.summary}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* B) 3 GASTOS DONDE MÁS SE PUEDE RECORTAR */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center text-rose-600 dark:text-rose-400">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Los 3 Gastos para Recortar
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      Donde se te está escapando más plata
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {aiAnalysis.cutSuggestions.map((cut, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-rose-200 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200 flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <span>{cut.title}</span>
                        </span>
                        {cut.potentialSaving > 0 && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                            Ahorras ~{formatCOP(cut.potentialSaving)}/mes
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal pl-6">
                        {cut.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* C) 3 CONSEJOS DE AHORRO REALISTAS */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      3 Consejos Realistas de Ahorro
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      Adaptados a la vida universitaria
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {aiAnalysis.savingsTips.map((tip, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 flex items-start gap-3"
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-200 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-normal">
                        {tip}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* SECCIÓN DE CHAT CON BOLSUNI */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        
        {/* Cabecera del chat */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                Chat Financiero Universitario
              </h3>
              <p className="text-[11px] text-slate-400">
                Pregúntale lo que quieras sobre tu plata, gastos y si te alcanza para tus planes
              </p>
            </div>
          </div>
        </div>

        {/* Mensajes del chat */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[420px] min-h-[260px] overflow-y-auto">
          {chatMessages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950 flex items-center justify-center text-violet-700 dark:text-violet-300 shrink-0 text-xs font-bold">
                    🤖
                  </div>
                )}
                
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-xs sm:text-sm shadow-xs leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-emerald-600 text-white rounded-br-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-xs border border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  {msg.text}
                  <div
                    className={`text-[9px] mt-1.5 ${isUser ? 'text-emerald-100 text-right' : 'text-slate-400'}`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0 text-xs font-bold">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isSending && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950 flex items-center justify-center text-violet-700 dark:text-violet-300 shrink-0 text-xs">
                🤖
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-500 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>EduPlata está revisando tus cuentas y pensando...</span>
              </div>
            </div>
          )}

          {chatError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs">
              {chatError}
            </div>
          )}
        </div>

        {/* Preguntas rápidas sugeridas */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-1.5">
          <span className="text-[11px] text-slate-400 flex items-center mr-1">
            Preguntas frecuentes:
          </span>
          <button
            type="button"
            onClick={() => handleSendMessage('¿Me alcanza para ir a un concierto este mes?')}
            className="text-xs px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-violet-400 text-slate-700 dark:text-slate-300 transition-colors"
          >
            🎫 ¿Me alcanza para un concierto?
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage('¿En qué categoría se me está yendo más plata?')}
            className="text-xs px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-violet-400 text-slate-700 dark:text-slate-300 transition-colors"
          >
            📉 ¿En qué se me va más plata?
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage('¿Cómo puedo ahorrar $100.000 este mes con mi mesada?')}
            className="text-xs px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-violet-400 text-slate-700 dark:text-slate-300 transition-colors"
          >
            💰 ¿Cómo ahorro $100.000 este mes?
          </button>
        </div>

        {/* Campo de entrada de texto */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            placeholder="Pregunta algo como: ¿me alcanza para comprarme unos tenis hoy?"
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <button
            type="submit"
            disabled={!inputQuestion.trim() || isSending}
            className="p-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white disabled:opacity-40 transition-all cursor-pointer shadow-md shadow-violet-600/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

      </div>

    </div>
  );
};
