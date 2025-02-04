/**
 * Protected fields that cannot be updated from frontend
 * @type {string[]}
 */
const PROTECTED_FIELDS = [
  'createdBy',
  'createdAt',
  'updatedAt',
  'workspaceId',
  'uuid',
  'deletedAt',
  '_id',
  'id',
  'currentVersion',
  'latestVersionId',
  'status'
];

/**
 * Remove protected fields from update payload
 * @param {Object} payload - Update payload from frontend
 * @returns {Object} Sanitized payload
 */
const sanitizeUpdatePayload = (payload) => {
  const sanitized = { ...payload };
  PROTECTED_FIELDS.forEach(field => {
    delete sanitized[field];
  });
  return sanitized;
};

module.exports = {
  PROTECTED_FIELDS,
  sanitizeUpdatePayload
}; 