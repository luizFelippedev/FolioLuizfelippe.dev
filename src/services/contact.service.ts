import ContactMessageModel, { type IContactMessage } from '@models/ContactMessage.model';
import { AppError } from '@utils/helpers/error.helper';

import type {
  CreateContactMessageInput
} from '@validators/contact.validator';

export const createContactMessage = async (
  payload: CreateContactMessageInput
): Promise<IContactMessage> => {
  return ContactMessageModel.create(payload);
};

export const listContactMessages = async () => {
  return ContactMessageModel.find().sort({ createdAt: -1 });
};

export const getContactMessageById = async (id: string) => {
  return ContactMessageModel.findById(id);
};

export const updateContactStatus = async (id: string, status: 'new' | 'in-progress' | 'resolved') => {
  const message = await ContactMessageModel.findById(id);
  if (!message) {
    throw new AppError('Message not found', 404);
  }

  message.status = status;
  return message.save();
};

export const deleteContactMessage = async (id: string) => {
  return ContactMessageModel.findByIdAndDelete(id);
};
