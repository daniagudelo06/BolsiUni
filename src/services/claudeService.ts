/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * EduPlata - Servicio Frontend para Claude (Anthropic)
 * Se comunica exclusivamente con el backend (/api/claude/chat), protegiendo la API key.
 */

import { QuickChatMessage, ClaudeToolCall } from '../types';

export interface ClaudeChatResponse {
  success: boolean;
  text?: string;
  tools?: ClaudeToolCall[];
  error?: string;
  mode?: string;
}

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
        history: history.slice(-8) // últimos mensajes relevantes
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
