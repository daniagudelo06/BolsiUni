/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * EduPlata - Barra de Chat Rápido en el Inicio (WhatsApp Style)
 * Accesible desde el Dashboard para dictar o escribir movimientos en lenguaje natural.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Mic, MicOff, Send, MessageSquareQuote } from 'lucide-react';

interface QuickChatBarProps {
  onSubmitMessage: (message: string) => void;
  onOpenFullChat: () => void;
}

export const QuickChatBar: React.FC<QuickChatBarProps> = ({
  onSubmitMessage,
  onOpenFullChat
}) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-CO';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const handleToggleRecord = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!recognitionRef.current) {
      onOpenFullChat();
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Error starting recognition:', err);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      onOpenFullChat();
      return;
    }
    onSubmitMessage(text.trim());
    setText('');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            Registro Inteligente con Claude
          </span>
        </div>
        <button
          onClick={onOpenFullChat}
          className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
        >
          <MessageSquareQuote className="w-3.5 h-3.5" />
          Abrir Chat Completo
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* Botón Micrófono */}
        <button
          type="button"
          onClick={handleToggleRecord}
          className={`p-2.5 sm:p-3 rounded-2xl transition-all cursor-pointer flex items-center justify-center shrink-0 ${
            isRecording
              ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300'
          }`}
          title="Dictar en español colombiano"
        >
          {isRecording ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />}
        </button>

        {/* Input */}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            isRecording
              ? 'Escuchando en vivo...'
              : 'Escribe: "almuerzo 12 lucas y pasaje 3200", "el 30 arriendo 650.000"...'
          }
          className="flex-1 px-4 py-2.5 sm:py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white placeholder-slate-600 dark:placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        />

        {/* Enviar */}
        <button
          type="submit"
          className="p-2.5 sm:p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 flex items-center justify-center cursor-pointer transition-transform active:scale-95 shrink-0"
          title="Enviar a Claude"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </form>
    </div>
  );
};
