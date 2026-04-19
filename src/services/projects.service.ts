import { AppError } from '@utils/helpers/error.helper';

import ProjectModel, { type IProject } from '@models/Project.model';
import { fetchGithubRepoMetricsFromUrl } from '@services/githubMetrics.service';
import type { CreateProjectInput, UpdateProjectInput } from '@validators/project.validator';

interface ListOptions {
  skip?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
  filters?: Record<string, unknown>;
}

const applyPinMetadata = <T extends { featured?: boolean }>(payload: T) => {
  const next = { ...payload } as T & { pinnedAt?: Date };
  if (payload.featured === true) {
    next.pinnedAt = new Date();
  } else if (payload.featured === false) {
    next.pinnedAt = undefined;
  }

  return next;
};

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

export const incrementProjectView = async (slug: string) => {
  return ProjectModel.findOneAndUpdate(
    { slug },
    { $inc: { 'metrics.views': 1 } },
    { new: true }
  );
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

  const data = applyPinMetadata(payload);

  return ProjectModel.create(data);
};

export const updateProject = async (
  id: string,
  payload: UpdateProjectInput
): Promise<IProject | null> => {
  const data = applyPinMetadata(payload);

  return ProjectModel.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true
  });
};

export const deleteProject = async (id: string): Promise<IProject | null> => {
  return ProjectModel.findByIdAndDelete(id);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const toProjectObject = (project: IProject | Record<string, unknown>) => {
  if ('toObject' in project && typeof project.toObject === 'function') {
    return project.toObject() as Record<string, unknown>;
  }

  return project as Record<string, unknown>;
};

export const enrichProjectWithLiveMetrics = async (project: IProject | Record<string, unknown> | null) => {
  if (!project) {
    return null;
  }

  const normalizedProject = toProjectObject(project);
  const repositoryUrl =
    typeof normalizedProject.repositoryUrl === 'string' ? normalizedProject.repositoryUrl : undefined;
  const githubMetrics = await fetchGithubRepoMetricsFromUrl(repositoryUrl);

  const existingMetrics = isRecord(normalizedProject.metrics) ? normalizedProject.metrics : {};
  const nextMetrics: Record<string, unknown> = {
    ...existingMetrics
  };

  if (githubMetrics?.stars !== null && githubMetrics?.stars !== undefined) {
    nextMetrics.stars = githubMetrics.stars;
  }
  if (githubMetrics?.forks !== null && githubMetrics?.forks !== undefined) {
    nextMetrics.forks = githubMetrics.forks;
  }

  return {
    ...normalizedProject,
    metrics: nextMetrics
  };
};

export const enrichProjectsWithLiveMetrics = async (
  projects: Array<IProject | Record<string, unknown>>
) => {
  const enriched = await Promise.all(projects.map((project) => enrichProjectWithLiveMetrics(project)));
  return enriched.filter(Boolean) as Array<Record<string, unknown>>;
};
