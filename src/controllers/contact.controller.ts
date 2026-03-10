import { AppError } from '@utils/helpers/error.helper';
import { successResponse } from '@utils/helpers/response.helper';
import logger from '@utils/logger/logger';
import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import env from '@config/env.config';
import { recordActivity } from '@services/activityLog.service';
import {
  createContactMessage,
  deleteContactMessage,
  getContactMessageById,
  listContactMessages,
  updateContactStatus
} from '@services/contact.service';
import { sendContactNotificationEmail } from '@services/email.service';

export const submitContactMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const message = await createContactMessage(req.body);

    if (env.NOTIFICATION_EMAIL) {
      void sendContactNotificationEmail({
        adminEmail: env.NOTIFICATION_EMAIL,
        payload: {
          name: message.name,
          email: message.email,
          message: message.message,
          subject: message.subject
        }
      }).catch((error) => {
        logger.warn('Failed to send contact notification email', { error });
      });
    }

    return successResponse(res, message, 'Message received', StatusCodes.CREATED);
  } catch (error) {
    return next(error);
  }
};

export const getContactMessages = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const messages = await listContactMessages();
    return successResponse(res, messages);
  } catch (error) {
    return next(error);
  }
};

export const getContactMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const message = await getContactMessageById(req.params.id);

    if (!message) {
      return next(new AppError('Message not found', StatusCodes.NOT_FOUND));
    }

    return successResponse(res, message);
  } catch (error) {
    return next(error);
  }
};

export const updateContactMessageStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const message = await updateContactStatus(req.params.id, req.body.status);
    await recordActivity({
      action: 'contact:status',
      actor: req.user,
      target: { id: req.params.id, type: 'ContactMessage' },
      metadata: { status: req.body.status }
    });
    return successResponse(res, message, 'Message status updated');
  } catch (error) {
    return next(error);
  }
};

export const deleteContactMessageHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const message = await deleteContactMessage(req.params.id);

    if (!message) {
      return next(new AppError('Message not found', StatusCodes.NOT_FOUND));
    }

    return successResponse(res, message, 'Message deleted');
  } catch (error) {
    return next(error);
  }
};
