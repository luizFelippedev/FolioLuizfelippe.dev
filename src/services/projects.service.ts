import { AppError } from '@utils/helpers/error.helper';

import ProjectModel, { type IProject } from '@models/Project.model';
import type { CreateProjectInput, UpdateProjectInput } from '@validators/project.validator';

interface ListOptions {
  skip?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
  filters?: Record<string, unknown>;
}

const applyPagination = (
  query: ReturnType<typeof ProjectModel.find> | ReturnType<typeof ProjectModel.findOne>,
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

export const getProjects = async (options?: ListOptions) => {
  const query = ProjectModel.find(options?.filters ?? {});
  return applyPagination(query, {
    sort: { order: 1, createdAt: -1, ...(options?.sort ?? {}) },
    skip: options?.skip,
    limit: options?.limit
  });
};

export const getProjectById = async (id: string) => {
  return ProjectModel.findById(id);
};

export const getProjectBySlug = async (slug: string) => {
  return ProjectModel.findOne({ slug });
};

export const getFeaturedProjects = async (options?: ListOptions) => {
  const query = ProjectModel.find({ featured: true });
  return applyPagination(query, {
    sort: { order: 1, ...(options?.sort ?? {}) },
    skip: options?.skip,
    limit: options?.limit
  });
};

export const createProject = async (payload: CreateProjectInput): Promise<IProject> => {
  const existingProject = await ProjectModel.findOne({ slug: payload.slug });
  if (existingProject) {
    throw new AppError('Project slug already exists', 409);
  }

  return ProjectModel.create(payload);
};

export const updateProject = async (
  id: string,
  payload: UpdateProjectInput
): Promise<IProject | null> => {
  return ProjectModel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true
  });
};

export const deleteProject = async (id: string): Promise<IProject | null> => {
  return ProjectModel.findByIdAndDelete(id);
};
