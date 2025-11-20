export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  sort: Record<string, 1 | -1>;
}

export interface ParseOptions {
  defaultLimit?: number;
  maxLimit?: number;
  defaultSort?: Record<string, 1 | -1>;
  allowedSortFields?: string[];
}

export const parsePagination = (
  query: Record<string, unknown>,
  options: ParseOptions = {}
): PaginationParams => {
  const defaultLimit = options.defaultLimit ?? 10;
  const maxLimit = options.maxLimit ?? 50;
  const page = Math.max(Number(query.page) || 1, 1);
  const rawLimit = Number(query.limit) || defaultLimit;
  const limit = Math.min(Math.max(rawLimit, 1), maxLimit);
  const skip = (page - 1) * limit;

  const sortField = typeof query.sortBy === 'string' ? query.sortBy : undefined;
  const sortOrder = typeof query.sortOrder === 'string' ? query.sortOrder.toLowerCase() : 'desc';

  let sort: Record<string, 1 | -1> = options.defaultSort ?? { createdAt: -1 };

  if (sortField) {
    if (!options.allowedSortFields || options.allowedSortFields.includes(sortField)) {
      sort = {
        [sortField]: sortOrder === 'asc' ? 1 : -1
      } as Record<string, 1 | -1>;
    }
  }

  return { page, limit, skip, sort };
};
