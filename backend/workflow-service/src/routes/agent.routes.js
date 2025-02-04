const express = require('express');
const router = express.Router();
const Agent = require('../models/agent.model');
const { extractUserContext } = require('../middleware/auth.middleware');

// Apply middleware to all routes
router.use(extractUserContext);

/**
 * @swagger
 * /workflow-service/v1/agents:
 *   get:
 *     summary: List all agents
 *     tags: [Agents]
 */
router.get('/agents', async (req, res) => {
  try {
    const agents = await Agent.find({ 
      workspaceId: req.userContext.workspaceId 
    });
    res.json(agents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /workflow-service/v1/agents:
 *   post:
 *     summary: Create a new agent
 *     tags: [Agents]
 */
router.post('/agents', async (req, res) => {
  try {
    const agent = new Agent({
      ...req.body,
      workspaceId: req.userContext.workspaceId,
      createdBy: req.userContext.userId
    });
    await agent.save();
    res.status(201).json(agent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /workflow-service/v1/agents/{id}:
 *   get:
 *     summary: Get an agent by ID
 *     tags: [Agents]
 */
router.get('/agents/:id', async (req, res) => {
  try {
    const agent = await Agent.findOne({
      _id: req.params.id,
      workspaceId: req.userContext.workspaceId
    });
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json(agent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /workflow-service/v1/agents/{id}:
 *   put:
 *     summary: Update an agent
 *     tags: [Agents]
 */
router.put('/agents/:id', async (req, res) => {
  try {
    const agent = await Agent.findOneAndUpdate(
      { 
        _id: req.params.id,
        workspaceId: req.userContext.workspaceId
      },
      req.body,
      { new: true }
    );
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json(agent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /workflow-service/v1/agents/{id}:
 *   delete:
 *     summary: Delete an agent
 *     tags: [Agents]
 */
router.delete('/agents/:id', async (req, res) => {
  try {
    const agent = await Agent.findOneAndDelete({
      _id: req.params.id,
      workspaceId: req.userContext.workspaceId
    });
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 