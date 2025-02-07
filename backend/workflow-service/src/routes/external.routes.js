const express = require('express');
const router = express.Router();
const Agent = require('../models/agent.model');
const axios = require('axios');
const { extractUserContext } = require('../middleware/auth.middleware');



/**
 * @swagger
 * /workflow-service/v1/external/trigger/agent:
 *   post:
 *     summary: Trigger agents from external systems
 *     tags: [External]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trigger_type:
 *                 type: string
 *               trigger_input:
 *                 type: string
 *               triggered_by:
 *                 type: string
 */
router.post('/external/trigger/agent', async (req, res) => {
  try {
    const payload = req.body;

    // Find all agents that have matching trigger_type in their integrations
    const matchingAgents = await Agent.find({
      'integrations.triggerType': payload.trigger_type
    });

    if (!matchingAgents || matchingAgents.length === 0) {
      return res.status(404).json({ 
        error: 'No agents found matching the trigger type' 
      });
    }

    // Trigger each matching agent
    const triggerPromises = matchingAgents.map(async (agent) => {
      try {
        // Trigger agent execution
        const response = await axios.post(
          `http://localhost:8000/agent/${agent._id}/createExecution`,
          {
            trigger_type: payload.trigger_type,
            trigger_input: payload.trigger_input,
            triggered_by: payload.triggered_by
          }
        );
        return {
          agent: {
            id: agent._id,
            name: agent.name,
            description: agent.description,
            emoji: agent.emoji,
            integrations: agent.integrations.filter(
              integration => integration.triggerType === payload.trigger_type
            ),
            workspaceId: agent.workspaceId
          },
          status: 'success',
          executionId: response.data.id
        };
      } catch (error) {
        return {
          agent: {
            id: agent._id,
            name: agent.name
          },
          status: 'failed',
          error: error.message
        };
      }
    });

    const results = await Promise.all(triggerPromises);

    res.json({
      message: 'Agents triggered',
      trigger_type: payload.trigger_type,
      matched_agents_count: matchingAgents.length,
      results
    });

  } catch (error) {
    console.error('Error triggering agents:', error);
    res.status(500).json({ 
      error: 'Failed to trigger agents',
      details: error.message 
    });
  }
});

module.exports = router; 