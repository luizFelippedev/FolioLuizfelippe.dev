import { getNotificationsNamespace } from '@sockets/index';
import type { NotificationPayload } from '@sockets/notifications.socket';

interface AdminNotificationPayload extends Partial<NotificationPayload> {
  title: string;
  message: string;
  channel?: string;
}

export const broadcastAdminNotification = (payload: AdminNotificationPayload) => {
  try {
    const namespace = getNotificationsNamespace();
    const targetChannel = payload.channel ?? 'admin-alerts';
    namespace.to(targetChannel).emit('notifications:message', {
      title: payload.title,
      message: payload.message,
      type: payload.type ?? 'info',
      timestamp: payload.timestamp ?? Date.now()
    });
  } catch (error) {
    // sockets not ready; silently ignore
  }
};
