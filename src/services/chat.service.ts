import type { Readable } from 'node:stream';

import axios from 'axios';

import env from '@config/env.config';
import type { VisitorSegment } from '@models/VisitorSession.model';
import type { VisitorAccessContext } from '@services/visitor.service';
import { getWiseToneForSegment } from '@services/assistantSettings.service';
import { AppError } from '@utils/helpers/error.helper';
import logger from '@utils/logger/logger';

export interface PortfolioAssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface PortfolioAssistantStatus {
  provider: 'groq';
  available: boolean;
  model: string;
  modelReady: boolean;
  latencyMs: number;
  updatedAt: string;
  suggestions: string[];
}

interface StreamPortfolioAssistantParams {
  messages: PortfolioAssistantMessage[];
  locale?: string;
  page?: string;
  visitorContext?: VisitorAccessContext;
  signal?: AbortSignal;
  onReady?: (payload: { model: string }) => void;
  onToken: (token: string) => void;
}

interface GroqModelsResponse {
  data?: Array<{
    id?: string;
  }>;
}

interface GroqChatCompletionChunk {
  error?: {
    message?: string;
  };
  model?: string;
  choices?: Array<{
    delta?: {
      content?: string;
    };
    finish_reason?: string | null;
  }>;
}

const MAX_HISTORY_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 2500;
const PROVIDER_STATUS_TIMEOUT_MS = 2500;

const normalizeLocale = (locale?: string) => {
  if (!locale?.trim()) {
    return 'en';
  }

  return locale.trim().toLowerCase().split('-')[0];
};

const resolveLanguageDirective = (locale?: string) => {
  const normalizedLocale = normalizeLocale(locale);

  const mapping: Record<string, string> = {
    pt: 'Portuguese (Brazil)',
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    ja: 'Japanese',
    zh: 'Chinese'
  };

  return mapping[normalizedLocale] ?? 'English';
};

const describeSegment = (segment?: VisitorSegment) => {
  if (segment === 'company') {
    return 'company';
  }

  if (segment === 'recruiter') {
    return 'recruiter';
  }

  return 'visitor';
};

const buildPortfolioContext = async (
  locale?: string,
  page?: string,
  visitorContext?: VisitorAccessContext
) => {
  const currentPage = page?.trim() || '/';
  const viewerSegment = visitorContext?.viewerSegment;
  const visitorName = visitorContext?.account?.identity.name ?? visitorContext?.session?.identity?.name;
  const companyName =
    visitorContext?.account?.identity.companyName ?? visitorContext?.session?.identity?.companyName;
  const toneDirective = await getWiseToneForSegment(viewerSegment);
  const visitorIdentityLines = [
    `Current visitor segment: ${describeSegment(viewerSegment)}.`,
    visitorName ? `Current visitor name: ${visitorName}.` : 'Current visitor name: not declared.',
    companyName ? `Current visitor company: ${companyName}.` : 'Current visitor company: not declared.'
  ];

  return [
    'You are Wise, the AI portfolio concierge for Luiz Felippe.',
    'Your job is to help visitors understand Luiz, his projects, his stack, and how to contact him through the public portfolio.',
    'Use a formal, polished, professional tone at all times.',
    `Current tone directive for this visitor segment: ${toneDirective}`,
    'You only know the conversation, the current route, and the curated public portfolio snapshot below.',
    'You cannot access source code, environment variables, private dashboards, database records, analytics raw logs, inboxes, hidden files, unpublished pages, or secrets.',
    'If someone asks what you can access, explain those limits clearly instead of pretending you can browse private data.',
    'Never invent facts, numbers, clients, prices, deadlines, phone numbers, certifications, or production claims.',
    'If something is missing, say that the public portfolio does not expose that detail yet and suggest using the contact page.',
    'Keep answers high-signal and practical. Default to 2-5 short paragraphs or a compact bullet list when it helps.',
    `Reply in the same language used by the visitor. Locale hint: ${resolveLanguageDirective(locale)}.`,
    `Current portfolio route: ${currentPage}. Use that only as a small hint for navigation suggestions.`,
    ...visitorIdentityLines,
    'Audience access policy:',
    '- The portfolio may expose different levels of detail depending on whether the visitor is a company, recruiter, or general visitor.',
    '- If a piece of content is not available to the current audience, explain that the visibility is intentionally limited to another audience and suggest changing the declared profile if appropriate.',
    '- Do not claim that restricted content is visible when the current audience would normally see only a teaser.',
    'When a route is the right next step, mention the exact internal path and explain in one short sentence why that page is relevant.',
    'Prefer one or two precise internal routes instead of listing every page.',
    'Public routes you may reference when useful:',
    '- / -> homepage, positioning, high-level profile, highlights, and main entry point.',
    '- /projects -> strongest implementation depth, product scope, stack, architecture, and technical execution.',
    '- /certificates -> formal certifications, proof of study, and credential validation.',
    '- /blog -> technical writing, engineering reasoning, architecture notes, and deeper explanations.',
    '- /faq -> quick clarifications about workflow, profile, and common questions.',
    '- /contact -> proposals, hiring, partnerships, direct outreach, and next-step conversations.',
    '- /terms -> terms of use and platform conditions.',
    '- /privacy -> privacy, visitor data handling, and transparency details.',
    'Navigation guidance:',
    '- If someone asks for the most technical work, send them to /projects first.',
    '- If someone asks for proof of study or formal credentials, send them to /certificates.',
    '- If someone asks how Luiz thinks, writes, or explains engineering decisions, send them to /blog.',
    '- If someone wants to hire, propose work, ask for availability, or continue the conversation, send them to /contact.',
    '- If someone asks about policies, data, consent, or legal terms, send them to /privacy or /terms as appropriate.',
    '- If the visitor is already on the most relevant page, say that clearly instead of redirecting them elsewhere.',
    'Do not direct visitors to /admin unless they explicitly ask what it is; if they do, explain that it is restricted.',
    'Luiz profile snapshot:',
    '- Software engineer in training, focused on advanced full-stack delivery.',
    '- Strong areas: React, TypeScript, Vite, Tailwind, Framer Motion, Three.js, Node.js, Express, MongoDB, Redis, Socket.IO, Docker.',
    '- Works on premium interfaces, realtime systems, automation, observability, admin dashboards, AI integrations, and cloud-ready APIs.',
    '- Portfolio positioning: immersive UI, strong engineering rigor, realtime metrics, admin tooling, and scalable backend architecture.',
    '- Contact path for proposals or custom work: /contact.',
    'If a visitor asks how this assistant works, explain that the frontend talks to the portfolio backend and the backend streams answers from Groq.'
  ].join('\n');
};

export const buildPortfolioAssistantMessages = async (
  messages: PortfolioAssistantMessage[],
  locale?: string,
  page?: string,
  visitorContext?: VisitorAccessContext
) => {
  const sanitizedMessages = messages
    .filter((message) => ['user', 'assistant'].includes(message.role))
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, MAX_MESSAGE_LENGTH)
    }))
    .filter((message) => message.content.length > 0)
    .slice(-MAX_HISTORY_MESSAGES);

  const lastUserMessage = [...sanitizedMessages].reverse().find((message) => message.role === 'user');

  if (!lastUserMessage) {
    throw new AppError('A user message is required to start the portfolio assistant.', 400, undefined, true, 'chatbot_invalid_request');
  }

  return [
    {
      role: 'system' as const,
      content: [
        await buildPortfolioContext(locale, page, visitorContext),
        `Preferred response language when ambiguous: ${resolveLanguageDirective(locale)}.`
      ].join('\n')
    },
    ...sanitizedMessages
  ];
};

const createProviderError = (message: string, code = 'chatbot_upstream_error', statusCode = 502) =>
  new AppError(message, statusCode, undefined, true, code);

const readErrorPayload = async (data: unknown) => {
  if (!data) {
    return '';
  }

  if (typeof data === 'string') {
    return data;
  }

  if (Buffer.isBuffer(data)) {
    return data.toString('utf8');
  }

  if (typeof (data as Readable).on === 'function') {
    return await new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const stream = data as Readable;

      stream.on('data', (chunk: Buffer | string) => {
        chunks.push(Buffer.from(chunk));
      });
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      stream.on('error', reject);
    });
  }

  return '';
};

const extractAxiosErrorMessage = async (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    return null;
  }

  const payload = await readErrorPayload(error.response?.data);

  try {
    const parsedPayload = JSON.parse(payload) as { error?: { message?: string }; message?: string };
    return parsedPayload.error?.message ?? parsedPayload.message ?? payload;
  } catch {
    return payload || error.message;
  }
};

const getProviderHeaders = () => ({
  Authorization: `Bearer ${env.GROQ_API_KEY}`,
  'Content-Type': 'application/json'
});

export const getPortfolioAssistantStatus = async (): Promise<PortfolioAssistantStatus> => {
  if (!env.GROQ_API_KEY?.trim()) {
    return {
      provider: 'groq',
      available: false,
      model: env.GROQ_MODEL,
      modelReady: false,
      latencyMs: 0,
      updatedAt: new Date().toISOString(),
      suggestions: ['set GROQ_API_KEY']
    };
  }

  const startedAt = Date.now();

  try {
    const response = await axios.get<GroqModelsResponse>(`${env.GROQ_API_BASE_URL}/models`, {
      headers: getProviderHeaders(),
      timeout: PROVIDER_STATUS_TIMEOUT_MS
    });

    const modelReady = (response.data.data ?? []).some((model) => model.id === env.GROQ_MODEL);

    return {
      provider: 'groq',
      available: true,
      model: env.GROQ_MODEL,
      modelReady,
      latencyMs: Date.now() - startedAt,
      updatedAt: new Date().toISOString(),
      suggestions: modelReady ? [] : [`verify GROQ_MODEL (${env.GROQ_MODEL})`]
    };
  } catch {
    return {
      provider: 'groq',
      available: false,
      model: env.GROQ_MODEL,
      modelReady: false,
      latencyMs: Date.now() - startedAt,
      updatedAt: new Date().toISOString(),
      suggestions: ['verify GROQ_API_KEY', 'verify GROQ_API_BASE_URL']
    };
  }
};

export const streamPortfolioAssistant = async ({
  messages,
  locale,
  page,
  visitorContext,
  signal,
  onReady,
  onToken
}: StreamPortfolioAssistantParams) => {
  const assembledMessages = await buildPortfolioAssistantMessages(messages, locale, page, visitorContext);

  if (!env.GROQ_API_KEY?.trim()) {
    throw createProviderError(
      'The assistant provider is not configured yet.',
      'chatbot_unavailable',
      503
    );
  }

  let responseText = '';
  let responseModel = env.GROQ_MODEL;
  let readySent = false;

  try {
    const response = await axios.post<Readable>(
      `${env.GROQ_API_BASE_URL}/chat/completions`,
      {
        model: env.GROQ_MODEL,
        messages: assembledMessages,
        temperature: env.GROQ_TEMPERATURE,
        top_p: env.GROQ_TOP_P,
        stream: true
      },
      {
        headers: getProviderHeaders(),
        responseType: 'stream',
        timeout: env.GROQ_REQUEST_TIMEOUT_MS,
        signal
      }
    );

    await new Promise<void>((resolve, reject) => {
      let buffer = '';

      const fail = (error: unknown) => reject(error);

      const handleBlock = (block: string) => {
        const lines = block
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);

        for (const line of lines) {
          if (!line.startsWith('data:')) {
            continue;
          }

          const payload = line.slice(5).trim();

          if (!payload) {
            continue;
          }

          if (payload === '[DONE]') {
            resolve();
            return;
          }

          try {
            const chunk = JSON.parse(payload) as GroqChatCompletionChunk;

            if (chunk.error?.message) {
              reject(createProviderError(chunk.error.message));
              return;
            }

            responseModel = chunk.model ?? env.GROQ_MODEL;
            const token = chunk.choices?.[0]?.delta?.content ?? '';
            const finishReason = chunk.choices?.[0]?.finish_reason;

            if (!readySent) {
              onReady?.({ model: responseModel });
              readySent = true;
            }

            if (token) {
              responseText += token;
              onToken(token);
            }

            if (finishReason) {
              resolve();
              return;
            }
          } catch {
            reject(createProviderError('Failed to parse Groq stream response.'));
            return;
          }
        }
      };

      response.data.on('data', (chunk: Buffer | string) => {
        buffer += chunk.toString();

        let separatorIndex = buffer.indexOf('\n\n');
        while (separatorIndex >= 0) {
          const block = buffer.slice(0, separatorIndex);
          buffer = buffer.slice(separatorIndex + 2);
          handleBlock(block);
          separatorIndex = buffer.indexOf('\n\n');
        }
      });

      response.data.on('end', () => {
        if (buffer.trim()) {
          handleBlock(buffer);
        }
        resolve();
      });
      response.data.on('error', fail);
      signal?.addEventListener(
        'abort',
        () => {
          response.data.destroy();
          resolve();
        },
        { once: true }
      );
    });

    return {
      text: responseText,
      model: responseModel
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const upstreamMessage = await extractAxiosErrorMessage(error);

      if (error.code === 'ERR_CANCELED') {
        return {
          text: responseText,
          model: responseModel
        };
      }

      if (error.response?.status === 401 || error.response?.status === 403) {
        throw createProviderError(
          'Groq authentication failed. Check the API key.',
          'chatbot_unavailable',
          503
        );
      }

      if (error.response?.status === 429) {
        throw createProviderError(
          'The assistant is busy right now. Try again in a moment.',
          'chatbot_rate_limited',
          429
        );
      }

      if (error.code === 'ECONNABORTED') {
        throw createProviderError(
          'The assistant timed out while generating a response.',
          'chatbot_timeout',
          504
        );
      }

      logger.warn('Portfolio assistant request failed with Groq upstream error', {
        reason: upstreamMessage ?? error.message,
        status: error.response?.status
      });

      throw createProviderError(upstreamMessage || 'Failed to generate a response with Groq.');
    }

    if (error instanceof AppError) {
      throw error;
    }

    logger.error('Portfolio assistant request failed with unexpected Groq error', { error });
    throw createProviderError('Failed to generate a response with Groq.');
  }
};
