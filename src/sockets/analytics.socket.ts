import type { Namespace } from 'socket.io';

let latestSummary: Record<string, unknown>[] = [];

export const updateAnalyticsSnapshot = (summary: Record<string, unknown>[]) => {
  latestSummary = summary;
};

export const registerAnalyticsNamespace = (namespace: Namespace) => {
  namespace.on('connection', (socket) => {
    if (latestSummary.length) {
      socket.emit('analytics:summary', latestSummary);
    }

    socket.on('analytics:ping', () => {
      socket.emit('analytics:pong', { timestamp: Date.now() });
    });
  });
};

export const emitAnalyticsUpdate = (namespace: Namespace, summary: Record<string, unknown>[]) => {
  updateAnalyticsSnapshot(summary);
  namespace.emit('analytics:summary', summary);
};
