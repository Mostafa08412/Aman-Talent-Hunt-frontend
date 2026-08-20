// ============================================================
// Generic API Result wrappers
// ============================================================

export interface Result {
  isCompletedSuccessfully: boolean;
  message?: string | null;
  code: number;
}

export interface ResultWithData<T> extends Result {
  data?: T | null;
}

export interface PagedResult<T> {
  items: T[] | null;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface GuidResult extends ResultWithData<string> {}
