const escapeRegExp = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const buildPager = (query) => {
  const page = toPositiveInt(query.page, 1);
  const limit = Math.min(toPositiveInt(query.limit, 10), 1000);
  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const buildSearch = (search, fields) => {
  if (!search) return null;
  const expression = new RegExp(escapeRegExp(search.trim()), 'i');
  return { $or: fields.map((field) => ({ [field]: expression })) };
};

module.exports = { buildPager, buildSearch };
