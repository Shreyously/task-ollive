export interface PaginatedMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: PaginatedMeta;
}
