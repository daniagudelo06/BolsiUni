/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * EduPlata - Servicio Frontend para Claude (Anthropic)
 * Se comunica exclusivamente con el backend (/api/claude/*), protegiendo la API key.
 * Incluye registro inteligente por chat, diagnóstico financiero y asesor de bolsillo.
 */

import { QuickChatMessage, ClaudeToolCall, AIAnalysisResult, BudgetConfig, ChatMessage, SavingsGoal, Transaction, UserProfile } from '../types';

export interface ClaudeChatResponse {
  success: boolean;
  text?: string;
  tools?: ClaudeToolCall[];
  error?: string;
  mode?: string;
}

/**
 * Enviar mensaje al chat rápido para registrar gastos, ingresos o pagos programados
 */
export async function sendChatMessageToClaude(
  message: string,
  history: QuickChatMessage[] = []
): Promise<ClaudeChatResponse> {
  try {
    const response = await fetch('/api/claude/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        history: history.slice(-8)
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      return {
        success: false,
        error: errData?.error || 'No pude procesar eso ahora, intenta de nuevo.'
      };
    }

    const data = await response.json();
    return {
      success: true,
      text: data.text,
      tools: data.tools || [],
      mode: data.mode
    };
  } catch (err: any) {
    console.error('Error llamando a Claude backend:', err);
    return {
      success: false,
      error: 'No pude procesar eso ahora, intenta de nuevo.'
    };
  }
}

/**
 * Genera el diagnóstico financiero inteligente (resumen, 3 recortes y 3 tips)
 */
export async function analyzeFinancesWithClaude(
  transactions: Transaction[],
  budget: BudgetConfig,
  goals: SavingsGoal[],
  userProfile?: UserProfile
): Promise<AIAnalysisResult> {
  try {
    const response = await fetch('/api/claude/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        transactions,
        budget,
        goals,
        userProfile
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(errData?.error || 'No se pudo generar el diagnóstico financiero con Claude.');
    }

    const data = await response.json();
    return data.result;
  } catch (err: any) {
    console.error('Error en diagnóstico con Claude:', err);
    throw err;
  }
}

/**
 * Consulta al Asesor Financiero Universitario interactivo con Claude
 */
export async function chatWithClaudeFinancialAdvisor(
  question: string,
  history: ChatMessage[],
  transactions: Transaction[],
  budget: BudgetConfig,
  goals: SavingsGoal[],
  userProfile?: UserProfile
): Promise<string> {
  try {
    const response = await fetch('/api/claude/financial-advisor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question,
        history: history.slice(-6),
        transactions,
        budget,
        goals,
        userProfile
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(errData?.error || 'No pude consultar a Claude en este momento.');
    }

    const data = await response.json();
    return data.answer;
  } catch (err: any) {
    console.error('Error en chat financiero con Claude:', err);
    throw err;
  }
}
