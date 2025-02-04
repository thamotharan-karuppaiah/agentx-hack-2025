const Redis = require('redis');

const redisClient = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.connect().catch(console.error);

// Helper methods for workflow caching
const cacheWorkflow = async (workflowId, data) => {
  await redisClient.set(`workflow:${workflowId}`, JSON.stringify(data), {
    EX: 3600 // Cache for 1 hour
  });
};

const getCachedWorkflow = async (workflowId) => {
  const data = await redisClient.get(`workflow:${workflowId}`);
  return data ? JSON.parse(data) : null;
};

const invalidateWorkflowCache = async (workflowId) => {
  await redisClient.del(`workflow:${workflowId}`);
};

module.exports = {
  redisClient,
  cacheWorkflow,
  getCachedWorkflow,
  invalidateWorkflowCache
}; 