/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * EduPlata - Backend Express Server
 * Proxy seguro para la API de Claude (Anthropic) y servidor de desarrollo/producción.
 */

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper para fecha y día de la semana en Colombia (America/Bogota)
function getBogotaDateTime() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long'
  });

  const parts = formatter.formatToParts(now);
  let year = '', month = '', day = '', weekday = '';
  for (const part of parts) {
    if (part.type === 'year') year = part.value;
    if (part.type === 'month') month = part.value;
    if (part.type === 'day') day = part.value;
    if (part.type === 'weekday') weekday = part.value;
  }
  const todayDate = `${year}-${month}-${day}`;
  const dayOfWeek = weekday ? weekday.charAt(0).toUpperCase() + weekday.slice(1) : 'Hoy';
  return { todayDate, dayOfWeek };
}

// Herramientas especificadas para Claude
const CLAUDE_TOOLS = [
  {
    name: 'registrar_movimiento',
    description: 'Registra un gasto o un ingreso real que el estudiante ya realizó o recibió.',
    input_schema: {
      type: 'object',
      properties: {
        tipo: {
          type: 'string',
          enum: ['gasto', 'ingreso'],
          description: 'Si es un gasto o un ingreso'
        },
        monto: {
          type: 'integer',
          description: 'Monto en COP como número entero sin puntos ni comas, ej: 4000, 12000, 400000'
        },
        categoria: {
          type: 'string',
          enum: [
            'Comida',
            'Transporte',
            'Fotocopias y útiles',
            'Suscripciones',
            'Salidas y rumba',
            'Vivienda',
            'Salud',
            'Matrícula y U',
            'Mesada familiar',
            'Trabajo/freelance',
            'Becas y auxilios',
            'Otros'
          ],
          description: 'Categoría específica a la que corresponde el movimiento'
        },
        descripcion: {
          type: 'string',
          description: 'Descripción concisa del movimiento (ej: Empanada, TransMilenio, Almuerzo corrientazo)'
        },
        fecha: {
          type: 'string',
          description: 'Fecha en formato AAAA-MM-DD'
        }
      },
      required: ['tipo', 'monto', 'categoria', 'descripcion', 'fecha']
    }
  },
  {
    name: 'programar_pago',
    description: 'Programa un pago futuro o recurrente (ej: arriendo, suscripciones, cuota de matrícula, etc.).',
    input_schema: {
      type: 'object',
      properties: {
        descripcion: {
          type: 'string',
          description: 'Descripción corta del pago programado'
        },
        monto: {
          type: 'integer',
          description: 'Monto en COP entero sin puntos ni comas'
        },
        categoria: {
          type: 'string',
          enum: [
            'Comida',
            'Transporte',
            'Fotocopias y útiles',
            'Suscripciones',
            'Salidas y rumba',
            'Vivienda',
            'Salud',
            'Matrícula y U',
            'Mesada familiar',
            'Trabajo/freelance',
            'Becas y auxilios',
            'Otros'
          ],
          description: 'Categoría del pago'
        },
        fecha_vencimiento: {
          type: 'string',
          description: 'Fecha en formato AAAA-MM-DD'
        },
        recurrencia: {
          type: 'string',
          enum: ['ninguna', 'semanal', 'mensual'],
          description: 'Tipo de recurrencia'
        },
        recordatorio_dias_antes: {
          type: 'integer',
          description: 'Número de días antes para enviar alerta de recordatorio (por defecto 1)'
        }
      },
      required: ['descripcion', 'monto', 'categoria', 'fecha_vencimiento', 'recurrencia']
    }
  },
  {
    name: 'pedir_aclaracion',
    description: 'Pide aclaración al usuario cuando falte el monto, la fecha u otro dato importante, o no sea claro si es gasto o ingreso.',
    input_schema: {
      type: 'object',
      properties: {
        pregunta: {
          type: 'string',
          description: 'Pregunta amable y cercana en jerga universitaria colombiana para pedir el dato faltante'
        }
      },
      required: ['pregunta']
    }
  }
];

// Parser heurístico colombiano de respaldo en caso de que no haya conexión externa o API key aún
function parseNaturalLanguageFallback(text: string, todayDate: string) {
  const lower = text.toLowerCase().trim();
  const tools: Array<{ toolName: string; parameters: any }> = [];

  // Función para parsear montos en jerga colombiana
  const parseAmount = (str: string): number | null => {
    // 1 palo / un palo
    if (/un palo|1 palo/.test(str)) return 1000000;
    if (/medio palo/.test(str)) return 500000;
    
    // X lucas / X barras
    const lucasMatch = str.match(/(\d+(?:[.,]\d+)?)\s*(?:lucas?|barras?)/);
    if (lucasMatch) {
      const val = parseFloat(lucasMatch[1].replace(',', '.'));
      return Math.round(val * 1000);
    }

    // X k (ej: 20k)
    const kMatch = str.match(/(\d+(?:[.,]\d+)?)\s*k\b/);
    if (kMatch) {
      const val = parseFloat(kMatch[1].replace(',', '.'));
      return Math.round(val * 1000);
    }

    // X mil (ej: 400 mil)
    const milMatch = str.match(/(\d+(?:[.,]\d+)?)\s*(?:mil\b|millones?\b)/);
    if (milMatch) {
      const isMillion = /millon/.test(milMatch[0]);
      const val = parseFloat(milMatch[1].replace(',', '.'));
      return Math.round(val * (isMillion ? 1000000 : 1000));
    }

    // Números directos con punto de miles ej: 4.000, 650.000, 9.900 o 4000
    const rawNumberMatch = str.match(/\$?\s*(\d{1,3}(?:\.\d{3})+|\d{3,9})/);
    if (rawNumberMatch) {
      const clean = rawNumberMatch[1].replace(/\./g, '');
      return parseInt(clean, 10);
    }

    return null;
  };

  // Detectar pagos futuros / programados
  const isFuture = /tengo que pagar|me toca pagar|me van a cobrar|pagar el|el \d+ tengo|cada mes|cada semana|vence/i.test(lower);
  const isRecurrentMonthly = /cada mes|mensual|todos los meses/i.test(lower);
  const isRecurrentWeekly = /cada semana|semanal|todos los \w+s/i.test(lower);

  // Fecha para futuros
  let dueDate = todayDate;
  const dayOfMonthMatch = lower.match(/(?:el|cada)\s*(\d{1,2})/);
  if (dayOfMonthMatch) {
    const targetDay = parseInt(dayOfMonthMatch[1], 10);
    const [yStr, mStr, dStr] = todayDate.split('-');
    let year = parseInt(yStr, 10);
    let month = parseInt(mStr, 10);
    const currentDay = parseInt(dStr, 10);
    if (targetDay < currentDay) {
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }
    dueDate = `${year}-${String(month).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
  }

  // Si es pago futuro
  if (isFuture) {
    const amount = parseAmount(lower);
    if (!amount) {
      tools.push({
        toolName: 'pedir_aclaracion',
        parameters: { pregunta: '¿De cuánto es el valor de ese pago que quieres programar?' }
      });
      return tools;
    }

    let cat = 'Otros';
    if (/arriendo|pieza|apartamento|residencia|servicios/i.test(lower)) cat = 'Vivienda';
    else if (/spotify|netflix|canva|suscripci/i.test(lower)) cat = 'Suscripciones';
    else if (/matricula|semestre|u\b|universidad/i.test(lower)) cat = 'Matrícula y U';
    else if (/pasaje|transmilenio|metro|mio/i.test(lower)) cat = 'Transporte';

    let desc = 'Pago programado';
    if (/arriendo/i.test(lower)) desc = 'Pago de arriendo';
    else if (/spotify/i.test(lower)) desc = 'Spotify';
    else if (/netflix/i.test(lower)) desc = 'Netflix';
    else if (/matricula/i.test(lower)) desc = 'Matrícula U';

    tools.push({
      toolName: 'programar_pago',
      parameters: {
        descripcion: desc,
        monto: amount,
        categoria: cat,
        fecha_vencimiento: dueDate,
        recurrencia: isRecurrentMonthly ? 'mensual' : (isRecurrentWeekly ? 'semanal' : 'ninguna'),
        recordatorio_dias_antes: 1
      }
    });
    return tools;
  }

  // Movimientos cotidianos (gasto o ingreso)
  // Manejo de múltiples movimientos en una frase con "y", ej: "almuerzo 12 lucas y pasaje 3200"
  const segments = lower.includes(' y ') && !lower.includes('becas y') ? lower.split(/\s+y\s+/) : [lower];

  for (const seg of segments) {
    const amount = parseAmount(seg);
    if (!amount) continue;

    const isIncome = /consignaron|consignaron|me llegó|recibí|ingreso|mesada|sueldo|pago de monitoria|gané/i.test(seg);
    let category = 'Otros';
    let desc = 'Movimiento';

    if (isIncome) {
      if (/mesada/i.test(seg)) {
        category = 'Mesada familiar';
        desc = 'Mesada';
      } else if (/trabajo|turno|sueldo|freelance|monitoria/i.test(seg)) {
        category = 'Trabajo/freelance';
        desc = 'Trabajo / freelance';
      } else if (/beca|auxilio|jovenes en accion|renta joven/i.test(seg)) {
        category = 'Becas y auxilios';
        desc = 'Auxilio / Beca';
      } else {
        category = 'Mesada familiar';
        desc = 'Ingreso de mesada';
      }
      tools.push({
        toolName: 'registrar_movimiento',
        parameters: {
          tipo: 'ingreso',
          monto: amount,
          categoria: category,
          descripcion: desc,
          fecha: todayDate
        }
      });
    } else {
      // Gasto
      if (/empanada|almuerzo|comida|tinto|cafeteria|desayuno|cena|corrientazo|pizza/i.test(seg)) {
        category = 'Comida';
        desc = /empanada/i.test(seg) ? 'Empanada' : (/almuerzo/i.test(seg) ? 'Almuerzo' : 'Comida');
      } else if (/pasaje|transmilenio|metro|mio|buseta|taxi|uber|didi/i.test(seg)) {
        category = 'Transporte';
        desc = /pasaje/i.test(seg) ? 'Pasaje' : (/transmilenio/i.test(seg) ? 'TransMilenio' : 'Transporte');
      } else if (/fotocopia|copias|impresion|cuaderno|utiles/i.test(seg)) {
        category = 'Fotocopias y útiles';
        desc = 'Fotocopias / útiles';
      } else if (/pola|cerveza|rumba|cine|salida|amigos|parche/i.test(seg)) {
        category = 'Salidas y rumba';
        desc = 'Salida / ocio';
      } else if (/arriendo|alquiler|servicios/i.test(seg)) {
        category = 'Vivienda';
        desc = 'Vivienda';
      } else if (/spotify|netflix/i.test(seg)) {
        category = 'Suscripciones';
        desc = 'Suscripción';
      }

      tools.push({
        toolName: 'registrar_movimiento',
        parameters: {
          tipo: 'gasto',
          monto: amount,
          categoria: category,
          descripcion: desc,
          fecha: todayDate
        }
      });
    }
  }

  if (tools.length === 0) {
    tools.push({
      toolName: 'pedir_aclaracion',
      parameters: {
        pregunta: '¿Cuánto gastaste o recibiste? Cuéntame el valor (por ejemplo: "empanada 4.000" o "12 lucas de almuerzo").'
      }
    });
  }

  return tools;
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());

  // Endpoint de Backend para Claude
  app.post('/api/claude/chat', async (req: Request, res: Response) => {
    try {
      const { message, history = [] } = req.body;

      if (!message || typeof message !== 'string' || message.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'El mensaje no puede estar vacío.'
        });
      }

      const { todayDate, dayOfWeek } = getBogotaDateTime();

      const systemPrompt = `Eres el asistente de registro de EduPlata, una app de finanzas para universitarios colombianos. Hoy es ${dayOfWeek} ${todayDate} (hora de Colombia). Tu única tarea es convertir lo que escribe el usuario en movimientos usando las herramientas disponibles.
Reglas:
- Entiende jerga colombiana: 'luca' o 'barra' = 1.000; '12 lucas' = 12.000; '20k' = 20.000; 'un palo' = 1.000.000; 'medio palo' = 500.000. 'x2' o 'dos' multiplica.
- '4.000' y '4000' significan cuatro mil pesos. El punto es separador de miles.
- Si el usuario habla en pasado o presente ('compré', 'pagué', 'me llegó'), usa registrar_movimiento.
- Si habla de algo futuro ('tengo que pagar', 'el viernes me toca', 'me van a cobrar'), usa programar_pago.
- Convierte fechas relativas ('mañana', 'el viernes', 'el 30', 'fin de mes') a AAAA-MM-DD. Si el día del mes ya pasó, usa el del mes siguiente.
- Si falta el monto o no es claro si es gasto o ingreso, usa pedir_aclaracion en vez de inventar.
- Nunca inventes montos.`;

      const apiKey = process.env.ANTHROPIC_API_KEY;

      // Si no hay API key de Anthropic configurada en el servidor, usamos el intérprete heurístico colombiano
      if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_ANTHROPIC_API_KEY') {
        const extractedTools = parseNaturalLanguageFallback(message, todayDate);
        return res.json({
          success: true,
          mode: 'heuristic',
          tools: extractedTools.map((t, index) => ({
            id: `call-fallback-${Date.now()}-${index}`,
            toolName: t.toolName,
            parameters: t.parameters
          })),
          text: extractedTools.some(t => t.toolName === 'pedir_aclaracion')
            ? extractedTools.find(t => t.toolName === 'pedir_aclaracion')?.parameters.pregunta
            : 'Listo, detecté lo siguiente de tu mensaje:'
        });
      }

      // Preparar historial de mensajes para Claude
      // Formatear mensajes previos
      const formattedMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
      for (const h of history) {
        if (h.sender === 'user' && h.text) {
          formattedMessages.push({ role: 'user', content: h.text });
        } else if (h.sender === 'assistant' && h.text) {
          formattedMessages.push({ role: 'assistant', content: h.text });
        }
      }
      formattedMessages.push({ role: 'user', content: message });

      // Modelos a probar: claude-haiku-5-5 especificado por el usuario, con fallback si es necesario
      const candidateModels = ['claude-haiku-5-5', 'claude-3-5-haiku-20241022', 'claude-3-haiku-20240307'];
      let lastError: any = null;
      let responseData: any = null;

      for (const modelName of candidateModels) {
        try {
          const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': apiKey.trim(),
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              model: modelName,
              max_tokens: 1024,
              system: systemPrompt,
              tools: CLAUDE_TOOLS,
              messages: formattedMessages
            })
          });

          if (!claudeResponse.ok) {
            const errText = await claudeResponse.text();
            lastError = new Error(`Anthropic Error (${claudeResponse.status}): ${errText}`);
            // Si el error es de modelo no encontrado, probamos el siguiente candidato
            if (claudeResponse.status === 404 || errText.includes('model') || claudeResponse.status === 400) {
              continue;
            } else {
              break;
            }
          }

          responseData = await claudeResponse.json();
          break; // Éxito con este modelo
        } catch (fetchErr) {
          lastError = fetchErr;
        }
      }

      if (!responseData) {
        console.warn('Anthropic API request failed, falling back to local heuristic:', lastError?.message);
        // Usar respaldo para no bloquear al usuario
        const extractedTools = parseNaturalLanguageFallback(message, todayDate);
        return res.json({
          success: true,
          mode: 'heuristic_after_api_error',
          warning: 'No pude conectar con Claude directamente, pero interpreté tu mensaje:',
          tools: extractedTools.map((t, index) => ({
            id: `call-fallback-${Date.now()}-${index}`,
            toolName: t.toolName,
            parameters: t.parameters
          })),
          text: extractedTools.some(t => t.toolName === 'pedir_aclaracion')
            ? extractedTools.find(t => t.toolName === 'pedir_aclaracion')?.parameters.pregunta
            : 'Listo, detecté lo siguiente de tu mensaje:'
        });
      }

      // Procesar respuesta de Claude
      const toolsFound: Array<{ id: string; toolName: string; parameters: any }> = [];
      let assistantText = '';

      if (Array.isArray(responseData.content)) {
        for (const block of responseData.content) {
          if (block.type === 'text') {
            assistantText += (assistantText ? '\n' : '') + block.text;
          } else if (block.type === 'tool_use') {
            toolsFound.push({
              id: block.id,
              toolName: block.name,
              parameters: block.input
            });
          }
        }
      }

      return res.json({
        success: true,
        mode: 'claude',
        text: assistantText || 'Listo, detecté lo siguiente de tu mensaje:',
        tools: toolsFound
      });

    } catch (error: any) {
      console.error('Error en /api/claude/chat:', error);
      res.status(500).json({
        success: false,
        error: 'No pude procesar eso ahora, intenta de nuevo'
      });
    }
  });

  // Helper para construir el contexto financiero del estudiante
  const buildFinancialContext = (transactions: any[] = [], budget: any = {}, goals: any[] = [], userProfile: any = {}) => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const balance = totalIncome - totalExpense;

    const expensesByCategory: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type === 'expense') {
        const cat = t.category || 'Otros';
        expensesByCategory[cat] = (expensesByCategory[cat] || 0) + (Number(t.amount) || 0);
      }
    }

    const sortedCategories = Object.entries(expensesByCategory)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, amount]) => `- ${cat}: $${amount.toLocaleString('es-CO')} COP`)
      .join('\n');

    return `
Estudiante: ${userProfile?.name || 'Estudiante'}
Universidad: ${userProfile?.university || 'Universidad en Colombia'}
Carrera: ${userProfile?.career || 'Pregrado'} (${userProfile?.semester || 'Semestre'})
Ingresos totales registrados: $${totalIncome.toLocaleString('es-CO')} COP
Gastos totales registrados: $${totalExpense.toLocaleString('es-CO')} COP
Saldo actual disponible: $${balance.toLocaleString('es-CO')} COP
Límite mensual fijado: $${(budget?.monthlyExpenseLimit || 0).toLocaleString('es-CO')} COP

Gastos por categoría:
${sortedCategories || 'Sin gastos registrados todavía.'}

Metas de ahorro:
${(goals || []).map(g => `- ${g.title}: $${(g.currentAmount || 0).toLocaleString('es-CO')} de $${(g.targetAmount || 0).toLocaleString('es-CO')}`).join('\n') || 'Sin metas activas.'}
`;
  };

  // Helper de diagnóstico financiero inteligente de respaldo
  const generateFallbackAnalysis = (transactions: any[] = [], budget: any = {}, goals: any[] = [], userProfile: any = {}) => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const balance = totalIncome - totalExpense;

    return {
      summary: balance >= 0
        ? `¡Vas bien este mes! Tu saldo actual está en $${balance.toLocaleString('es-CO')} COP. Si mantienes el ritmo y optimizas los gastos en ocio y cafetería, podrás abonar más rápido a tus metas de ahorro sin sufrir a final de mes.`
        : `Ojo con el bolsillo: tus gastos superan tus ingresos por $${Math.abs(balance).toLocaleString('es-CO')} COP. Es momento de recortar gastos hormiga en salidas, empanadas y domicilios para no quedarte sin plata antes del próximo corte.`,
      cutSuggestions: [
        {
          title: 'Llevar almuerzo preparado a la U',
          explanation: 'Preparar comida en casa 2 o 3 días a la semana en vez de pagar corrientazos de $14.000 a $18.000 diarios.',
          potentialSaving: 75000
        },
        {
          title: 'Moderar rondas de polas y cafés en el campus',
          explanation: 'Ponerte un tope fijo de $25.000 por salida con los amigos de la facultad evita que se esfumen 50 o 60 lucas en una sola tarde.',
          potentialSaving: 50000
        },
        {
          title: 'Aprovechar fotocopiadoras del centro o biblioteca digital',
          explanation: 'Descargar lecturas pesadas en PDF o imprimir en fotocopiadoras populares fuera de la U puede ahorrarte hasta un 40% en papel.',
          potentialSaving: 25000
        }
      ],
      savingsTips: [
        'Recarga tu tarjeta de transporte público (TransMilenio, Metro, MIO) al inicio de semana con el valor exacto para no desviar la plata.',
        'Aprovecha los descuentos de estudiante en Spotify, YouTube Premium y licencias de software con tu correo institucional (.edu.co).',
        'Aparta el 10% de tu mesada o salario apenas te llegue antes de empezar a gastar en antojos.'
      ],
      analyzedAt: new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
    };
  };

  // Endpoint: Diagnóstico Financiero con Claude
  app.post('/api/claude/analyze', async (req: Request, res: Response) => {
    try {
      const { transactions = [], budget = {}, goals = [], userProfile = {} } = req.body;
      const apiKey = process.env.ANTHROPIC_API_KEY;

      if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_ANTHROPIC_API_KEY') {
        const fallback = generateFallbackAnalysis(transactions, budget, goals, userProfile);
        return res.json({ success: true, result: fallback, mode: 'heuristic' });
      }

      const financialContext = buildFinancialContext(transactions, budget, goals, userProfile);
      const systemPrompt = `Eres el asesor financiero senior de EduPlata, una app de finanzas para universitarios colombianos.
Tu tarea es analizar los datos financieros del estudiante y generar un diagnóstico con recomendaciones realistas en jerga universitaria colombiana cercana, constructiva y juvenil (sin vulgaridad).

Debes responder ÚNICAMENTE con un objeto JSON válido con esta estructura exacta:
{
  "summary": "Resumen de 2-3 oraciones sobre su situación financiera actual",
  "cutSuggestions": [
    { "title": "Nombre corto del recorte", "explanation": "Por qué y cómo recortar", "potentialSaving": 50000 }
  ],
  "savingsTips": [
    "Consejo 1 práctico para estudiantes en Colombia",
    "Consejo 2...",
    "Consejo 3..."
  ],
  "analyzedAt": "16 oct 2026"
}
Reglas:
- cutSuggestions debe tener exactamente 3 elementos. potentialSaving debe ser un número entero en COP.
- savingsTips debe tener exactamente 3 consejos.
- No incluyas texto antes ni después del bloque JSON.`;

      const candidateModels = ['claude-haiku-5-5', 'claude-3-5-haiku-20241022', 'claude-3-haiku-20240307'];
      let claudeResponseText = '';

      for (const modelName of candidateModels) {
        try {
          const resp = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': apiKey.trim(),
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              model: modelName,
              max_tokens: 1500,
              system: systemPrompt,
              messages: [
                {
                  role: 'user',
                  content: `Analiza mis finanzas universitarias y dame el diagnóstico en JSON:\n\n${financialContext}`
                }
              ]
            })
          });

          if (resp.ok) {
            const data: any = await resp.json();
            const textBlock = data.content?.find((c: any) => c.type === 'text');
            if (textBlock?.text) {
              claudeResponseText = textBlock.text;
              break;
            }
          }
        } catch (e) {
          console.warn('Error llamando a Claude para análisis:', e);
        }
      }

      if (claudeResponseText) {
        const cleaned = claudeResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
        try {
          const parsed = JSON.parse(cleaned);
          return res.json({ success: true, result: parsed, mode: 'claude' });
        } catch (jsonErr) {
          console.warn('Error parseando JSON de Claude, usando fallback:', jsonErr);
        }
      }

      // Si no pudo obtener JSON válido de Claude, fallback
      const fallback = generateFallbackAnalysis(transactions, budget, goals, userProfile);
      return res.json({ success: true, result: fallback, mode: 'heuristic_fallback' });

    } catch (err: any) {
      console.error('Error en /api/claude/analyze:', err);
      const fallback = generateFallbackAnalysis();
      return res.json({ success: true, result: fallback, mode: 'error_fallback' });
    }
  });

  // Endpoint: Asesor Financiero Universitario interactivo con Claude
  app.post('/api/claude/financial-advisor', async (req: Request, res: Response) => {
    try {
      const { question, history = [], transactions = [], budget = {}, goals = [], userProfile = {} } = req.body;

      if (!question || typeof question !== 'string') {
        return res.status(400).json({ success: false, error: 'Pregunta requerida.' });
      }

      const apiKey = process.env.ANTHROPIC_API_KEY;
      const financialContext = buildFinancialContext(transactions, budget, goals, userProfile);

      if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_ANTHROPIC_API_KEY') {
        // Respuesta heurística amigable
        const totalExpense = transactions.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + (Number(t.amount) || 0), 0);
        const totalIncome = transactions.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + (Number(t.amount) || 0), 0);
        const balance = totalIncome - totalExpense;

        let answer = `¡Qué más ${userProfile?.name ? userProfile.name.split(' ')[0] : 'parcero'}! `;
        if (question.toLowerCase().includes('concierto') || question.toLowerCase().includes('alcanza')) {
          answer += balance > 100000 
            ? `Revisando tu bolsillo, tienes un saldo de $${balance.toLocaleString('es-CO')} COP disponible. Si el plan no supera tus compromisos de la semana, te podrías dar el gusto, pero procura dejar al menos un colchón de $50.000 para fotocopias y pasajes.`
            : `Haciendo cuentas con tus números, tu saldo actual está en $${balance.toLocaleString('es-CO')} COP. En este momento te recomendaría aguantar un poco o buscar boleta más económica, porque podrías quedar apretado para los pasajes de la semana.`;
        } else if (question.toLowerCase().includes('ahorr') || question.toLowerCase().includes('consejo')) {
          answer += `El mejor truco para la universidad es la regla del 'porta': llevar almuerzo 3 días te ahorra más de $45.000 semanales. Además, define un monto fijo para salir los viernes y no lleves tarjetas de crédito al parche.`;
        } else {
          answer += `Actualmente tienes un saldo de $${balance.toLocaleString('es-CO')} COP y has gastado $${totalExpense.toLocaleString('es-CO')} este mes. Si necesitas planear un gasto específico, cuéntame cuánto cuesta y te digo cómo impacta tu presupuesto.`;
        }

        return res.json({ success: true, answer, mode: 'heuristic' });
      }

      const systemPrompt = `Eres el asesor financiero personal de EduPlata para estudiantes universitarios colombianos.
Tienes acceso a la información real de gastos, ingresos, presupuesto y metas del estudiante:
${financialContext}

Instrucciones:
- Responde en español colombiano cercano, amigable, cálido y juvenil, pero con criterio financiero responsable.
- Cita cifras exactas en pesos colombianos con formato $1.000 COP cuando sea relevante.
- Da respuestas prácticas y concisas (2 a 4 párrafos cortos).
- Nunca inventes que el estudiante tiene más plata de la que figura en su saldo.`;

      const candidateModels = ['claude-haiku-5-5', 'claude-3-5-haiku-20241022', 'claude-3-haiku-20240307'];
      let advisorAnswer = '';

      const formattedMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
      for (const h of history) {
        if (h.sender === 'user' && h.text) formattedMessages.push({ role: 'user', content: h.text });
        else if (h.sender === 'assistant' && h.text) formattedMessages.push({ role: 'assistant', content: h.text });
      }
      formattedMessages.push({ role: 'user', content: question });

      for (const modelName of candidateModels) {
        try {
          const resp = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': apiKey.trim(),
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              model: modelName,
              max_tokens: 1000,
              system: systemPrompt,
              messages: formattedMessages
            })
          });

          if (resp.ok) {
            const data: any = await resp.json();
            const textBlock = data.content?.find((c: any) => c.type === 'text');
            if (textBlock?.text) {
              advisorAnswer = textBlock.text;
              break;
            }
          }
        } catch (e) {
          console.warn('Error llamando a Claude para asesor financiero:', e);
        }
      }

      if (!advisorAnswer) {
        advisorAnswer = 'Lo siento, no pude conectar con Claude en este instante. Intenta nuevamente en un momento.';
      }

      return res.json({ success: true, answer: advisorAnswer, mode: 'claude' });

    } catch (err: any) {
      console.error('Error en /api/claude/financial-advisor:', err);
      res.status(500).json({ success: false, error: 'Error procesando tu consulta financiera.' });
    }
  });

  // Montar Vite middlewares en desarrollo o servir dist en producción
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EduPlata servidor listo en http://localhost:${PORT}`);
  });
}

startServer();
