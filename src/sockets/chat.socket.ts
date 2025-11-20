import type { Namespace } from 'socket.io';

interface ChatMessage {
  room: string;
  author: string;
  message: string;
  timestamp: number;
}

const messageHistory = new Map<string, ChatMessage[]>();

const addMessageToHistory = (room: string, message: ChatMessage) => {
  const history = messageHistory.get(room) ?? [];
  history.push(message);
  if (history.length > 50) {
    history.shift();
  }
  messageHistory.set(room, history);
};

export const registerChatNamespace = (namespace: Namespace) => {
  namespace.on('connection', (socket) => {
    socket.emit('chat:welcome', { id: socket.id });

    socket.on('chat:join', ({ room, author }: { room: string; author: string }) => {
      socket.join(room);
      const history = messageHistory.get(room) ?? [];
      socket.emit('chat:history', history);
      namespace.to(room).emit('chat:user_joined', { room, author, id: socket.id });
    });

    socket.on('chat:message', ({ room, author, message }: { room: string; author: string; message: string }) => {
      const payload: ChatMessage = {
        room,
        author,
        message,
        timestamp: Date.now()
      };
      addMessageToHistory(room, payload);
      namespace.to(room).emit('chat:message', payload);
    });

    socket.on('disconnect', () => {
      socket.rooms.forEach((room) => {
        if (room !== socket.id) {
          namespace.to(room).emit('chat:user_left', { room, id: socket.id });
        }
      });
    });
  });
};
