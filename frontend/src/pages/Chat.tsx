import { useState, useRef, useEffect } from 'react';
import { useChat, type Message, type ToolActivity } from '@/hooks/useChat';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Send, Plus, MessageSquare, Pin, Trash2,
  AlertTriangle, Phone, CheckCircle2, Loader2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const CHAT_MODES = [
  { key: 'open', name: 'Open Coaching', icon: '💬' },
  { key: 'goal_review', name: 'Goal Review', icon: '🎯' },
  { key: 'check_in', name: 'Check-In', icon: '📋' },
  { key: 'deep_session', name: 'Deep Session', icon: '🔍' },
  { key: 'accountability', name: 'Accountability', icon: '✅' },
  { key: 'brainstorming', name: 'Brainstorming', icon: '💡' },
  { key: 'celebration', name: 'Celebration', icon: '🎉' },
  { key: 'decision_making', name: 'Decision Making', icon: '⚖️' },
  { key: 'reflection', name: 'Reflection', icon: '🪞' },
  { key: 'crisis', name: 'Crisis Support', icon: '🆘' },
];

export default function Chat() {
  const {
    conversations, activeConvo, streaming, streamContent, crisis, toolActivity,
    loadConversation, createConversation, deleteConversation,
    sendMessage, togglePin, setCrisis,
  } = useChat();

  const [input, setInput] = useState('');
  const [showModes, setShowModes] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConvo?.messages, streamContent, toolActivity]);

  const handleSend = () => {
    if (!input.trim() || streaming) return;
    sendMessage(input.trim());
    setInput('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = (mode: string) => {
    createConversation(mode);
    setShowModes(false);
  };

  return (
    <div className="flex gap-4 h-full">
      {/* Conversation List */}
      <div className="w-64 shrink-0 flex flex-col">
        <div className="relative mb-3">
          <Button onClick={() => setShowModes(!showModes)} className="w-full">
            <Plus className="h-4 w-4 mr-2" /> New Conversation
          </Button>
          {showModes && (
            <Card className="absolute top-full left-0 right-0 mt-1 z-10">
              <CardContent className="p-2">
                {CHAT_MODES.map(mode => (
                  <button
                    key={mode.key}
                    onClick={() => handleNewChat(mode.key)}
                    className="w-full text-left px-3 py-2 rounded text-sm hover:bg-accent transition-colors flex items-center gap-2"
                  >
                    <span>{mode.icon}</span>
                    <span>{mode.name}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-1">
            {conversations.map(convo => (
              <button
                key={convo.id}
                onClick={() => loadConversation(convo.id)}
                className={`w-full text-left p-3 rounded-lg text-sm transition-colors group ${
                  activeConvo?.id === convo.id ? 'bg-accent' : 'hover:bg-accent/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{convo.title || 'New conversation'}</span>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); deleteConversation(convo.id); }}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px] px-1 py-0">{convo.mode}</Badge>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {activeConvo ? (
          <>
            {/* Crisis Banner */}
            {crisis && (
              <Alert className="mb-3 border-destructive bg-destructive/10">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Crisis Resources Available</AlertTitle>
                <AlertDescription className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span className="font-medium">988</span>
                    <span className="text-xs">Suicide & Crisis Lifeline</span>
                  </div>
                  <div>
                    <span className="font-medium">Text HOME to 741741</span>
                    <span className="text-xs ml-1">Crisis Text Line</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setCrisis(null)} className="ml-auto">
                    Dismiss
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4 pb-4">
                {activeConvo.messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} onTogglePin={togglePin} />
                ))}
                {toolActivity.length > 0 && (
                  <ToolActivityIndicator activities={toolActivity} />
                )}
                {streaming && streamContent && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] bg-card rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{streamContent}</ReactMarkdown>
                      </div>
                      <div className="mt-1 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                        <span className="text-xs text-muted-foreground">Typing...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="mt-3 flex gap-2">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                rows={2}
                className="resize-none"
              />
              <Button onClick={handleSend} disabled={!input.trim() || streaming} className="self-end">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Select a conversation or start a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ToolActivityIndicator({ activities, compact }: { activities: ToolActivity[]; compact?: boolean }) {
  const sizeClass = compact ? 'text-xs' : 'text-sm';
  const iconSize = compact ? 'h-3 w-3' : 'h-4 w-4';
  return (
    <div className="flex justify-start">
      <div className={`bg-card/50 border border-border/50 rounded-lg px-3 py-2 space-y-1 ${sizeClass}`}>
        {activities.map((a, i) => (
          <div key={`${a.tool}-${i}`} className="flex items-center gap-2 text-muted-foreground">
            {a.status === 'running' ? (
              <Loader2 className={`${iconSize} animate-spin text-primary`} />
            ) : (
              <CheckCircle2 className={`${iconSize} text-primary`} />
            )}
            <span>{a.display_name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message, onTogglePin }: { message: Message; onTogglePin: (id: number) => void }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
        isUser
          ? 'bg-primary text-primary-foreground rounded-tr-sm'
          : 'bg-card rounded-tl-sm'
      }`}>
        <div className={`prose prose-sm max-w-none ${isUser ? '' : 'prose-invert'}`}>
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        {!isUser && (
          <div className="mt-1 flex justify-end">
            <button
              onClick={() => onTogglePin(message.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
            >
              <Pin className={`h-3 w-3 ${message.is_pinned ? 'text-primary opacity-100' : ''}`} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
