export type WSMessage =
  | { type: 'chunk'; content: string }
  | { type: 'done' }
  | { type: 'error'; content: string }
  | { type: 'crisis'; data: CrisisData }
  | { type: 'tool_start'; tool: string; display_name: string }
  | { type: 'tool_result'; tool: string; result: Record<string, unknown> };

export interface CrisisData {
  detected: boolean;
  severity: string;
  message: string;
  resources: Record<string, { name: string; action: string; available: string }>;
}

export function createChatWS(conversationId: number) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${protocol}//${window.location.host}/api/chat/ws/${conversationId}`);
  return ws;
}
