const express = require('express');
const router = express.Router();
const workflowService = require('../services/workflow.service');
const { extractUserContext } = require('../middleware/auth.middleware');

// Apply middleware to all routes
router.use(extractUserContext);

/**
 * @swagger
 * components:
 *   parameters:
 *     workspaceHeader:
 *       in: header
 *       name: x-workspace-id
 *       required: true
 *       schema:
 *         type: string
 *       description: Workspace ID for the current context
 *     userHeader:
 *       in: header
 *       name: x-user-id
 *       required: true
 *       schema:
 *         type: string
 *       description: User ID for the current context
 */

/**
 * @swagger
 * /workflow-service/v1/workflows:
 *   post:
 *     summary: Create a new workflow
 *     tags: [Workflows]
 *     parameters:
 *       - $ref: '#/components/parameters/workspaceHeader'
 *       - $ref: '#/components/parameters/userHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 default: ''
 *               description:
 *                 type: string
 *                 default: ''
 *               config:
 *                 type: object
 *                 default: {}
 *     responses:
 *       201:
 *         description: Workflow created successfully
 */
router.post('/workflows', async (req, res) => {
  try {
    const workflowData = {
      ...req.body,
      createdBy: req.userContext.userId,
      workspaceId: req.userContext.workspaceId
    };
    const workflow = await workflowService.createWorkflow(workflowData);
    res.status(201).json(workflow);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /workflow-service/v1/workflows/template/{templateId}:
 *   post:
 *     summary: Create a workflow from template
 *     tags: [Workflows]
 *     parameters:
 *       - $ref: '#/components/parameters/workspaceHeader'
 *       - $ref: '#/components/parameters/userHeader'
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Workflow created from template successfully
 */
router.post('/workflows/template/:templateId', async (req, res) => {
  try {
    const workflow = await workflowService.createFromTemplate(
      req.params.templateId,
      { userId: req.userContext.userId, workspaceId: req.userContext.workspaceId }
    );
    res.status(201).json(workflow);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /workflow-service/v1/workflows/{id}:
 *   patch:
 *     summary: Partially update a workflow
 *     tags: [Workflows]
 *     parameters:
 *       - $ref: '#/components/parameters/workspaceHeader'
 *       - $ref: '#/components/parameters/userHeader'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               config:
 *                 type: object
 *                 description: Partial config updates will be merged with existing config
 *           example:
 *             name: "Updated Name"
 *             config:
 *               newSetting: true
 *     responses:
 *       200:
 *         description: Workflow updated successfully
 *       400:
 *         description: Invalid update data or attempt to modify protected field
 *       404:
 *         description: Workflow not found
 */
router.patch('/workflows/:id', async (req, res) => {
  try {
    const workflow = await workflowService.patchWorkflow(
      req.params.id,
      req.body,
      req.userContext
    );
    res.json(workflow);
  } catch (error) {
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

/**
 * @swagger
 * /workflow-service/v1/workflows/{id}:
 *   put:
 *     summary: Update a workflow
 *     tags: [Workflows]
 *     parameters:
 *       - $ref: '#/components/parameters/workspaceHeader'
 *       - $ref: '#/components/parameters/userHeader'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               config:
 *                 type: object
 *     responses:
 *       200:
 *         description: Workflow updated successfully
 */
router.put('/workflows/:id', async (req, res) => {
  try {
    const workflow = await workflowService.updateWorkflow(
      req.params.id,
      req.body,
      req.userContext
    );
    res.json(workflow);
  } catch (error) {
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

/**
 * @swagger
 * /workflow-service/v1/workflows/{id}/publish:
 *   post:
 *     summary: Publish a workflow version
 *     tags: [Workflows]
 *     parameters:
 *       - $ref: '#/components/parameters/workspaceHeader'
 *       - $ref: '#/components/parameters/userHeader'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               inputSchema:
 *                 type: array
 *                 items:
 *                   type: object
 *               outputType:
 *                 type: string
 *               configVariables:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Workflow published successfully
 */
router.post('/workflows/:id/publish', async (req, res) => {
  try {
    const workflow = await workflowService.publishWorkflow(
      req.params.id,
      req.userContext.userId,
      req.body
    );
    res.json(workflow);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /workflow-service/v1/workflows:
 *   get:
 *     summary: List all workflows
 *     tags: [Workflows]
 *     parameters:
 *       - $ref: '#/components/parameters/workspaceHeader'
 *       - $ref: '#/components/parameters/userHeader'
 *       - in: query
 *         name: methods
 *         schema:
 *           type: string
 *         description: Comma-separated list of computed methods to include
 *       - in: query
 *         name: include
 *         schema:
 *           type: string
 *         description: Comma-separated list of relations to include
 *       - in: query
 *         name: except
 *         schema:
 *           type: string
 *         description: Comma-separated list of fields to exclude
 *     responses:
 *       200:
 *         description: List of workflows
 */
router.get('/workflows', async (req, res) => {
  try {
    const filters = {
      workspaceId: req.userContext.workspaceId
    };

    const options = {
      methods: req.query.methods?.split(',') || [],
      include: req.query.include?.split(',') || [],
      except: req.query.except?.split(',') || []
    };

    const workflows = await workflowService.listWorkflows(filters, options);
    res.json(workflows);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /workflow-service/v1/workflows/{id}:
 *   get:
 *     summary: Get a workflow by ID
 *     tags: [Workflows]
 *     parameters:
 *       - $ref: '#/components/parameters/workspaceHeader'
 *       - $ref: '#/components/parameters/userHeader'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: methods
 *         schema:
 *           type: string
 *         description: Comma-separated list of computed methods to include
 *       - in: query
 *         name: include
 *         schema:
 *           type: string
 *         description: Comma-separated list of relations to include
 *       - in: query
 *         name: except
 *         schema:
 *           type: string
 *         description: Comma-separated list of fields to exclude
 *     responses:
 *       200:
 *         description: Workflow details
 */
router.get('/workflows/:id', async (req, res) => {
  try {
    const options = {
      methods: req.query.methods?.split(',') || [],
      include: req.query.include?.split(',') || [],
      except: req.query.except?.split(',') || []
    };

    const workflow = await workflowService.getWorkflow(req.params.id, options);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.json(workflow);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /workflow-service/v1/workflows/{id}:
 *   delete:
 *     summary: Delete a workflow
 *     tags: [Workflows]
 *     parameters:
 *       - $ref: '#/components/parameters/workspaceHeader'
 *       - $ref: '#/components/parameters/userHeader'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workflow deleted successfully
 */
router.delete('/workflows/:id', async (req, res) => {
  try {
    const workflow = await workflowService.deleteWorkflow(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.json({ message: 'Workflow deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /workflow-service/v1/workflows/{id}/versions:
 *   get:
 *     summary: List all versions of a workflow
 *     tags: [Workflows]
 *     parameters:
 *       - $ref: '#/components/parameters/workspaceHeader'
 *       - $ref: '#/components/parameters/userHeader'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: include
 *         schema:
 *           type: string
 *         description: Comma-separated list of relations to include (e.g., user)
 *       - in: query
 *         name: except
 *         schema:
 *           type: string
 *         description: Comma-separated list of fields to exclude (e.g., canvas,definition)
 *     responses:
 *       200:
 *         description: List of workflow versions
 */
router.get('/workflows/:id/versions', async (req, res) => {
  try {
    const options = {
      include: req.query.include?.split(',') || [],
      except: req.query.except?.split(',') || []
    };

    const versions = await workflowService.listWorkflowVersions(
      req.params.id,
      options
    );
    res.json(versions);
  } catch (error) {
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

/**
 * @swagger
 * /workflow-service/v1/workflows/{id}/versions/{version}:
 *   get:
 *     summary: Get a specific version of a workflow
 *     tags: [Workflows]
 *     parameters:
 *       - $ref: '#/components/parameters/workspaceHeader'
 *       - $ref: '#/components/parameters/userHeader'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: version
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: include
 *         schema:
 *           type: string
 *         description: Comma-separated list of relations to include (e.g., user)
 *       - in: query
 *         name: except
 *         schema:
 *           type: string
 *         description: Comma-separated list of fields to exclude (e.g., canvas,definition)
 *     responses:
 *       200:
 *         description: Workflow version details
 */
router.get('/workflows/:id/versions/:version', async (req, res) => {
  try {
    const options = {
      include: req.query.include?.split(',') || [],
      except: req.query.except?.split(',') || []
    };

    const version = await workflowService.getWorkflowVersion(
      req.params.id,
      req.params.version,
      options
    );
    res.json(version);
  } catch (error) {
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

/**
 * @swagger
 * /workflow-service/v1/workflows/{id}/versions/{version}/set-default:
 *   post:
 *     summary: Set a specific version as the default version for a workflow
 *     description: Updates the workflow to use the specified version as the default version
 *     tags: [Workflows]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Workflow ID
 *       - in: path
 *         name: version
 *         required: true
 *         schema:
 *           type: integer
 *         description: Version number to set as default
 *     responses:
 *       200:
 *         description: Successfully set default version
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Workflow'
 *       404:
 *         description: Workflow or version not found
 *       403:
 *         description: Not authorized to modify this workflow
 */
router.post('/workflows/:id/versions/:version/set-default', async (req, res) => {
  try {
    const workflow = await workflowService.setDefaultVersion(
      req.params.id,
      req.params.version,
      req.userContext
    );
    res.json(workflow);
  } catch (error) {
    if (error.message === 'Workflow not found' || error.message === 'Version not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

/**
 * @swagger
 * /workflow-service/v1/workflows/{id}/versions/{version}/restore:
 *   post:
 *     summary: Restore a workflow's config from a specific version
 *     description: Updates the workflow's config to match the specified version's config, without changing the default version
 *     tags: [Workflows]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Workflow ID
 *       - in: path
 *         name: version
 *         required: true
 *         schema:
 *           type: string
 *         description: Version ID to restore config from
 *     responses:
 *       200:
 *         description: Successfully restored version config
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Workflow'
 *       404:
 *         description: Workflow or version not found
 *       403:
 *         description: Not authorized to modify this workflow
 */
router.post('/workflows/:id/versions/:version/restore', async (req, res) => {
  try {
    const workflow = await workflowService.restoreVersion(
      req.params.id,
      req.params.version,
      req.userContext
    );
    res.json(workflow);
  } catch (error) {
    if (error.message === 'Workflow not found' || error.message === 'Version not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

module.exports = router; 