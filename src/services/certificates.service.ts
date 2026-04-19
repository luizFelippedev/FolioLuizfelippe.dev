import { AppError } from '@utils/helpers/error.helper';

import CertificateModel, { type CertificateDocument } from '@models/Certificate.model';
import type { CreateCertificateInput, UpdateCertificateInput } from '@validators/certificate.validator';

interface ListOptions {
  skip?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
  filters?: Record<string, unknown>;
}

const applyOptions = (
  query: ReturnType<typeof CertificateModel.find> | ReturnType<typeof CertificateModel.findOne>,
  options?: ListOptions
) => {
  if (options?.sort) {
    query = query.sort(options.sort);
  }
  if (options?.skip !== undefined) {
    query = query.skip(options.skip);
  }
  if (options?.limit !== undefined) {
    query = query.limit(options.limit);
  }
  return query;
};

export const listCertificates = async (options?: ListOptions) => {
  const query = CertificateModel.find(options?.filters ?? {});
  return applyOptions(query, {
    sort: { issueDate: -1, ...(options?.sort ?? {}) },
    skip: options?.skip,
    limit: options?.limit
  });
};

export const listCertificatesByLevel = async (level: string, options?: ListOptions) => {
  return listCertificates({
    ...options,
    filters: { ...(options?.filters ?? {}), level }
  });
};

export const getCertificateById = async (id: string) => {
  return CertificateModel.findById(id);
};

export const getCertificateBySlug = async (slug: string) => {
  return CertificateModel.findOne({ slug });
};

export const incrementCertificateView = async (slug: string) => {
  return CertificateModel.findOneAndUpdate(
    { slug },
    { $inc: { 'metrics.views': 1 } },
    { new: true }
  );
};

const applyPinMetadata = <T extends { featured?: boolean }>(payload: T) => {
  const next = { ...payload } as T & { pinnedAt?: Date };
  if (payload.featured === true) {
    next.pinnedAt = new Date();
  } else if (payload.featured === false) {
    next.pinnedAt = undefined;
  }
  return next;
};

export const createCertificate = async (
  payload: CreateCertificateInput
): Promise<CertificateDocument> => {
  const exists = await CertificateModel.findOne({ slug: payload.slug });
  if (exists) {
    throw new AppError('Certificate slug already exists', 409);
  }

  const data = applyPinMetadata(payload);

  return CertificateModel.create(data);
};

export const updateCertificate = async (
  id: string,
  payload: UpdateCertificateInput
): Promise<CertificateDocument | null> => {
  const data = applyPinMetadata(payload);

  return CertificateModel.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true
  });
};

export const deleteCertificate = async (id: string): Promise<CertificateDocument | null> => {
  return CertificateModel.findByIdAndDelete(id);
};
