import type { Server as HttpServer } from 'http';

import { Server, type Namespace } from 'socket.io';

import env from '@config/env.config';

import { registerAnalyticsNamespace } from './analytics.socket';
import { registerChatNamespace } from './chat.socket';
import { registerNotificationsNamespace } from './notifications.socket';

let io: Server | null = null;
let chatNamespace: Namespace | null = null;
let notificationsNamespace: Namespace | null = null;
let analyticsNamespace: Namespace | null = null;

const socketOrigins =
  env.CORS_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [env.CLIENT_URL];

export const initializeSockets = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: socketOrigins,
      credentials: true
    }
  });

  chatNamespace = io.of('/chat');
  notificationsNamespace = io.of('/notifications');
  analyticsNamespace = io.of('/analytics');

  registerChatNamespace(chatNamespace);
  registerNotificationsNamespace(notificationsNamespace);
  registerAnalyticsNamespace(analyticsNamespace);

  io.of('/').on('connection', (socket) => {
    socket.emit('connected', { socketId: socket.id });
  });

  return io;
};

export const getSocketServer = (): Server => {
  if (!io) {
    throw new Error('Socket.io server has not been initialized');
  }
  return io;
};

export const getAnalyticsNamespace = (): Namespace => {
  if (!analyticsNamespace) {
    throw new Error('Analytics namespace is not ready');
  }
  return analyticsNamespace;
};

export const getNotificationsNamespace = (): Namespace => {
  if (!notificationsNamespace) {
    throw new Error('Notifications namespace is not ready');
  }
  return notificationsNamespace;
};
