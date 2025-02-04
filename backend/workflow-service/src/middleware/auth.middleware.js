/**
 * Middleware to extract and validate workspace and user IDs from headers
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
const extractUserContext = (req, res, next) => {
  const workspaceId = req.headers['x-workspace-id'];
  const userId = req.headers['x-user-id'];

  if (!workspaceId) {
    return res.status(401).json({ error: 'Workspace ID is required (x-workspace-id)' });
  }

  if (!userId) {
    return res.status(401).json({ error: 'User ID is required (x-user-id)' });
  }

  // Add to request object for use in routes
  req.userContext = {
    workspaceId,
    userId
  };

  next();
};

module.exports = {
  extractUserContext
}; 