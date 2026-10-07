export const buildPagination = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit) || 1,
  hasNext: page * limit < total,
  hasPrev: page > 1,
});
