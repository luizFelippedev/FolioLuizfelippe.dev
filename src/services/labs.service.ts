import LabModel, { type ILab } from '@models/Lab.model';
import type { CreateLabInput, UpdateLabInput } from '@validators/lab.validator';

interface ListOptions {
  skip?: number;
  limit?: number;
  filters?: Record<string, unknown>;
}

export const listLabs = async (options?: ListOptions) => {
  const query = LabModel.find(options?.filters ?? {});
  if (options?.skip !== undefined) {
    query.skip(options.skip);
  }
  if (options?.limit !== undefined) {
    query.limit(options.limit);
  }
  query.sort({ createdAt: 1 });
  return query.exec();
};

export const getLabById = async (id: string) => {
  return LabModel.findById(id);
};

export const createLab = async (payload: CreateLabInput): Promise<ILab> => {
  return LabModel.create(payload);
};

export const updateLab = async (id: string, payload: UpdateLabInput): Promise<ILab | null> => {
  return LabModel.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
};

export const deleteLab = async (id: string) => {
  return LabModel.findByIdAndDelete(id);
};
