import { getNotificationsNamespace } from '@sockets/index';
import type { NotificationPayload } from '@sockets/notifications.socket';

interface AdminNotificationPayload extends Partial<NotificationPayload> {
  title?: string;
  message?: string;
  code?: string;
  params?: Record<string, string | number | boolean | null | undefined>;
  channel?: string;
}

export const broadcastAdminNotification = (payload: AdminNotificationPayload) => {
  try {
    const namespace = getNotificationsNamespace();
    const targetChannel = payload.channel ?? 'admin-alerts';
    namespace.to(targetChannel).emit('notifications:message', {
      code: payload.code,
      params: payload.params,
      title: payload.title,
      message: payload.message,
      type: payload.type ?? 'info',
      timestamp: payload.timestamp ?? Date.now()
    });
  } catch (error) {
    // sockets not ready; silently ignore
  }
};

interface ViewUpdatePayload {
  contentType: 'blog' | 'project' | 'certificate';
  contentKey: string;
  views: number;
}

export const broadcastViewUpdate = (payload: ViewUpdatePayload) => {
  try {
    const namespace = getNotificationsNamespace();
    const message = {
      ...payload,
      code: 'views.update',
      params: {
        contentType: payload.contentType,
        contentKey: payload.contentKey,
        views: payload.views
      },
      timestamp: Date.now()
    };

    namespace.to('public-metrics').emit('views:update', message);
    namespace.to('admin-alerts').emit('views:update', message);
  } catch (error) {
    // sockets not ready; silently ignore
  }
};
