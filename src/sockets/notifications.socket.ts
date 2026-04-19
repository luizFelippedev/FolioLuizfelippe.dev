import type { Namespace } from 'socket.io';

export interface NotificationPayload {
  code?: string;
  params?: Record<string, string | number | boolean | null | undefined>;
  title?: string;
  message?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  timestamp?: number;
}

const activeUsers = new Set<string>();

export const registerNotificationsNamespace = (namespace: Namespace) => {
  namespace.on('connection', (socket) => {
    activeUsers.add(socket.id);
    namespace.emit('notifications:stats', { activeUsers: activeUsers.size });

    socket.on('notifications:subscribe', (channels: string[]) => {
      channels.forEach((channel) => socket.join(channel));
    });

    socket.on('notifications:unsubscribe', (channels: string[]) => {
      channels.forEach((channel) => socket.leave(channel));
    });

    socket.on('notifications:emit', (payload: NotificationPayload & { channel?: string }) => {
      const target = payload.channel ? namespace.to(payload.channel) : namespace;
      target.emit('notifications:message', {
        code: payload.code,
        params: payload.params,
        title: payload.title,
        message: payload.message,
        type: payload.type ?? 'info',
        timestamp: payload.timestamp ?? Date.now()
      });
    });

    socket.on('disconnect', () => {
      activeUsers.delete(socket.id);
      namespace.emit('notifications:stats', { activeUsers: activeUsers.size });
    });
  });
};
