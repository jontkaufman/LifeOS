import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { createChatWS, type WSMessage, type CrisisData } from '@/lib/ws';

interface Message {
  id: number;
  role: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
}

export interface ToolActivity {
  tool: string;
  display_name: string;
  status: 'running' | 'done';
  result?: Record<string, unknown>;
}

interface Conversation {
  id: number;
  title: string | null;
  mode: string;
  created_at: string;
  updated_at: string;
}

interface ConversationDetail extends Conversation {
  messages: Message[];
  summary: string | null;
}

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<ConversationDetail | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [crisis, setCrisis] = useState<CrisisData | null>(null);
  const [toolActivity, setToolActivity] = useState<ToolActivity[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const loadConversations = useCallback(async () => {
    const list = await api.get<Conversation[]>('/chat/conversations');
    setConversations(list);
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const loadConversation = async (id: number) => {
    const convo = await api.get<ConversationDetail>(`/chat/conversations/${id}`);
    setActiveConvo(convo);
    setCrisis(null);
    return convo;
  };

  const createConversation = async (mode: string) => {
    const result = await api.post<{ id: number; mode: string }>('/chat/conversations', { mode });
    await loadConversations();
    return loadConversation(result.id);
  };

  const deleteConversation = async (id: number) => {
    await api.delete(`/chat/conversations/${id}`);
    if (activeConvo?.id === id) setActiveConvo(null);
    await loadConversations();
  };

  const sendMessage = (content: string) => {
    if (!activeConvo || streaming) return;

    // Optimistically add user message
    const userMsg: Message = {
      id: Date.now(),
      role: 'user',
      content,
      is_pinned: false,
      created_at: new Date().toISOString(),
    };
    setActiveConvo(prev => prev ? {
      ...prev,
      messages: [...prev.messages, userMsg],
    } : null);

    setStreaming(true);
    setStreamContent('');

    const ws = createChatWS(activeConvo.id);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ content }));
    };

    ws.onmessage = (event) => {
      const msg: WSMessage = JSON.parse(event.data);
      if (msg.type === 'chunk') {
        setStreamContent(prev => prev + msg.content);
      } else if (msg.type === 'tool_start') {
        setToolActivity(prev => [...prev, { tool: msg.tool, display_name: msg.display_name, status: 'running' }]);
      } else if (msg.type === 'tool_result') {
        setToolActivity(prev => prev.map(a =>
          a.tool === msg.tool && a.status === 'running'
            ? { ...a, status: 'done' as const, result: msg.result }
            : a
        ));
      } else if (msg.type === 'crisis') {
        setCrisis(msg.data);
      } else if (msg.type === 'done') {
        setStreamContent(prev => {
          const assistantMsg: Message = {
            id: Date.now() + 1,
            role: 'assistant',
            content: prev,
            is_pinned: false,
            created_at: new Date().toISOString(),
          };
          setActiveConvo(convo => convo ? {
            ...convo,
            messages: [...convo.messages, assistantMsg],
          } : null);
          return '';
        });
        setToolActivity([]);
        setStreaming(false);
        ws.close();
      } else if (msg.type === 'error') {
        setStreaming(false);
        ws.close();
      }
    };

    ws.onerror = () => {
      setStreaming(false);
    };

    ws.onclose = () => {
      setStreaming(false);
      loadConversations();
    };
  };

  const togglePin = async (messageId: number) => {
    await api.post(`/chat/messages/${messageId}/pin`);
    if (activeConvo) {
      await loadConversation(activeConvo.id);
    }
  };

  return {
    conversations, activeConvo, streaming, streamContent, crisis, toolActivity,
    loadConversations, loadConversation, createConversation, deleteConversation,
    sendMessage, togglePin, setCrisis,
  };
}

export type { Message, Conversation, ConversationDetail };
