import React, { useState } from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  queryAssistantWithGemini,
  runDeterministicAssistantQuery,
} from '../services/indusmindApiService';
import { SectionPanel, SimulatedBanner } from '../components/common/UiPrimitives';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  mode?: string;
  citations?: string[];
  isError?: boolean;
}

const SUGGESTED_QUESTIONS = [
  'Why did production decrease yesterday?',
  'Which stage caused the highest delay?',
  'Which machine had the highest downtime?',
  "What was today's estimated profit?",
  'Which section has the highest expenditure?',
  'Which dairy batch needs temperature verification?',
  'What can improve production efficiency?',
];

export const AiAssistantPage: React.FC = () => {
  const {
    stages,
    machines,
    vehicleOrders,
    dairyBatches,
    tempLogs,
    tempVerifications,
    inventory,
    qualityMetrics,
    financials,
    alerts,
    thresholds,
  } = useApp();

  const [queryMode, setQueryMode] = useState<'deterministic' | 'gemini'>('deterministic');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      mode: 'Deterministic Data Query',
      text: 'Welcome to INDUSMIND AI. Ask any operational question about AutoForge or DairyFlow. All responses are grounded strictly in live simulated application records — no figures are invented.',
      citations: ['Live Application State'],
    },
  ]);

  const snapshot = {
    stages,
    machines,
    vehicleOrders,
    dairyBatches,
    tempLogs,
    tempVerifications,
    inventory,
    qualityMetrics,
    financials,
    alerts,
    thresholds,
  };

  const handleAsk = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    if (queryMode === 'deterministic') {
      const result = runDeterministicAssistantQuery(trimmed, snapshot);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: 'assistant',
          text: result.answer,
          mode: result.mode,
          citations: result.citations,
        },
      ]);
      return;
    }

    // Gemini AI mode grounded in live serialized state
    setLoading(true);
    try {
      const result = await queryAssistantWithGemini(trimmed, snapshot);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: 'assistant',
          text: result.answer,
          mode: result.mode,
          citations: result.citations,
        },
      ]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unable to reach INDUSMIND AI endpoint.';
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: `${errMsg} You can switch to "Deterministic Data Query" mode above to query the live records directly without an external API key.`,
          mode: 'API Error',
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SimulatedBanner label="INDUSMIND AI Factory Assistant · Strictly grounded in live application records; never fabricates metrics" />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
            INDUSMIND AI Factory Assistant
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Query delays, machine downtime, profit estimates, and dairy verification queues
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800">
          <button
            onClick={() => setQueryMode('deterministic')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium ${
              queryMode === 'deterministic'
                ? 'bg-slate-900 text-white dark:bg-blue-600'
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            Deterministic Data Query
          </button>
          <button
            onClick={() => setQueryMode('gemini')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium ${
              queryMode === 'gemini'
                ? 'bg-slate-900 text-white dark:bg-blue-600'
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gemini AI (Grounded)</span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Suggested Prompts */}
        <SectionPanel
          title="Diagnostic Questions"
          subtitle="Click a prompt to query current factory state"
          className="lg:col-span-4"
        >
          <div className="space-y-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => handleAsk(q)}
                className="w-full text-left px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </SectionPanel>

        {/* Chat Thread */}
        <SectionPanel
          title="Conversation Thread"
          subtitle={
            queryMode === 'deterministic'
              ? 'Mode: Deterministic Formula Engine over Live State'
              : 'Mode: Server-Side Gemini 4 Hydrogen Grounded in Live State'
          }
          className="lg:col-span-8"
        >
          <div className="flex flex-col h-[460px]">
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-4 py-3 text-xs space-y-2 ${
                      m.sender === 'user'
                        ? 'bg-slate-900 dark:bg-blue-600 text-white'
                        : m.isError
                        ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {m.sender === 'assistant' && (
                      <div className="flex items-center gap-1.5 text-[11px] font-medium opacity-75">
                        <Bot className="w-3.5 h-3.5" />
                        <span>INDUSMIND AI · {m.mode}</span>
                      </div>
                    )}
                    <div className="whitespace-pre-line leading-relaxed">{m.text}</div>
                    {m.citations && m.citations.length > 0 && (
                      <div className="pt-1.5 border-t border-slate-200/70 dark:border-slate-700 text-[10px] font-mono opacity-75">
                        Sources: {m.citations.join(' · ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="text-xs text-slate-500 font-mono">
                  Querying grounded factory records...
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAsk(input);
              }}
              className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about bottlenecks, downtime, daily profit, or dairy verification..."
                className="flex-1 px-3.5 py-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-medium"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Ask</span>
              </button>
            </form>
          </div>
        </SectionPanel>
      </div>
    </div>
  );
};
