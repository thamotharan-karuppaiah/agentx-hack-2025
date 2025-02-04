const express = require('express');
const router = express.Router();
const workflowTemplateService = require('../services/workflow-template.service');
const workflowService = require('../services/workflow.service');
const { extractUserContext } = require('../middleware/auth.middleware');

// Apply middleware to all routes
router.use(extractUserContext);

/**
 * @swagger
 * /workflow-service/v1/templates:
 *   post:
 *     summary: Create a new template
 *     tags: [Templates]
 *     parameters:
 *       - in: header
 *         name: x-workspace-id
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: x-user-id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - config
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               config:
 *                 type: object
 *     responses:
 *       201:
 *         description: Template created successfully
 */
router.post('/templates', async (req, res) => {
  try {
    const templateData = {
      ...req.body,
      createdBy: req.userContext.userId,
      workspaceId: req.userContext.workspaceId
    };
    const template = await workflowTemplateService.createTemplate(templateData);
    res.status(201).json(template);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /workflow-service/v1/templates/from-workflow/{workflowId}:
 *   post:
 *     summary: Create a template from an existing workflow
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: workflowId
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: x-workspace-id
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: x-user-id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Template created from workflow successfully
 */
router.post('/templates/from-workflow/:workflowId', async (req, res) => {
  try {
    const workflow = await workflowService.getWorkflow(req.params.workflowId);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const templateData = {
      name: req.body.name,
      description: req.body.description || workflow.description,
      config: workflow.config,
      createdBy: req.userContext.userId,
      workspaceId: req.userContext.workspaceId,
      inputSchema: workflow.inputSchema,
      outputType: workflow.outputType,
      configVariables: workflow.configVariables
    };

    const template = await workflowTemplateService.createTemplate(templateData);
    res.status(201).json(template);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /workflow-service/v1/templates:
 *   get:
 *     summary: List all templates
 *     tags: [Templates]
 *     parameters:
 *       - in: header
 *         name: x-workspace-id
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: x-user-id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: public
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of templates
 */
router.get('/templates', async (req, res) => {
  try {
    const filters = {
      workspaceId: req.userContext.workspaceId
    };
    if (req.query.public !== undefined) {
      filters.public = req.query.public === 'true';
    }

    const templates = await workflowTemplateService.listTemplates(filters);
    res.json(templates);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /workflow-service/v1/templates/{id}:
 *   get:
 *     summary: Get a template by ID
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template details
 */
router.get('/templates/:id', async (req, res) => {
  try {
    const template = await workflowTemplateService.getTemplate(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /workflow-service/v1/templates/{id}:
 *   put:
 *     summary: Update a template
 *     tags: [Templates]
 *     parameters:
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
 *     responses:
 *       200:
 *         description: Template updated successfully
 */
router.put('/templates/:id', async (req, res) => {
  try {
    const template = await workflowTemplateService.updateTemplate(req.params.id, req.body);
    res.json(template);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /workflow-service/v1/templates/{id}:
 *   delete:
 *     summary: Delete a template
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template deleted successfully
 */
router.delete('/templates/:id', async (req, res) => {
  try {
    const template = await workflowTemplateService.deleteTemplate(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 