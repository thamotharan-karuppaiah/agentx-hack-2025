const Workflow = require('../models/workflow.model');
const WorkflowVersion = require('../models/workflow-version.model');
const { cacheWorkflow, getCachedWorkflow, invalidateWorkflowCache } = require('../config/redis');
const { sanitizeUpdatePayload } = require('../utils/field-protection');

class WorkflowService {
  async createWorkflow(workflowData) {
    // Extract version-specific fields
    const { inputSchema, outputType, configVariables, ...workflowFields } = workflowData;

    const workflow = new Workflow({
      ...workflowFields,
      status: 'draft'
    });
    const savedWorkflow = await workflow.save();
    await cacheWorkflow(savedWorkflow._id, savedWorkflow);
    return savedWorkflow;
  }

  async updateWorkflow(workflowId, updates, userContext) {
    const workflow = await Workflow.findOne({
      _id: workflowId,
      workspaceId: userContext.workspaceId
    });

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    // Sanitize updates to remove protected fields
    const sanitizedUpdates = sanitizeUpdatePayload(updates);

    Object.assign(workflow, sanitizedUpdates);
    const updatedWorkflow = await workflow.save();
    await cacheWorkflow(workflowId, updatedWorkflow);
    return updatedWorkflow;
  }

  async patchWorkflow(workflowId, updates, userContext) {
    const workflow = await Workflow.findOne({
      _id: workflowId,
      workspaceId: userContext.workspaceId
    });

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    // Sanitize updates to remove protected fields
    const sanitizedUpdates = sanitizeUpdatePayload(updates);

    // Apply partial updates
    Object.entries(sanitizedUpdates).forEach(([key, value]) => {
      if (key === 'config' && typeof value === 'object') {
        // Merge config objects for partial config updates
        workflow.config = {
          ...workflow.config,
          ...value
        };
      } else {
        workflow[key] = value;
      }
    });

    const updatedWorkflow = await workflow.save();
    await cacheWorkflow(workflowId, updatedWorkflow);
    return updatedWorkflow;
  }

  async publishWorkflow(workflowId, userId, versionData = {}) {
    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    // Increment total versions to get next version number
    const nextVersion = workflow.totalVersions + 1;

    // Create new version with input/output types
    const version = new WorkflowVersion({
      workflowId: workflow._id,
      version: nextVersion,
      config: workflow.config,
      publishedBy: userId,
      inputSchema: versionData.inputSchema || [],
      outputType: versionData.outputType || null,
      configVariables: versionData.configVariables || [],
      definition: versionData.definition || null,
      canvas: versionData.canvas || null
    });

    const savedVersion = await version.save();

    // Update workflow with new version info
    workflow.totalVersions = nextVersion;
    workflow.defaultVersion = nextVersion;
    workflow.defaultVersionId = savedVersion._id;
    workflow.status = 'published';

    const publishedWorkflow = await workflow.save();
    await invalidateWorkflowCache(workflowId);
    return publishedWorkflow;
  }

  async setDefaultVersion(workflowId, versionId, userContext) {
    const workflow = await Workflow.findOne({
      _id: workflowId,
      workspaceId: userContext.workspaceId
    });

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    // Find the requested version
    const version = await WorkflowVersion.findOne({
      workflowId,
      _id: versionId
    });

    if (!version) {
      throw new Error('Version not found');
    }

    // Update workflow to use this version as default
    workflow.defaultVersion = version.version;
    workflow.defaultVersionId = version._id;
    workflow.config = version.config; // Optionally sync config with version

    const updatedWorkflow = await workflow.save();
    await invalidateWorkflowCache(workflowId);
    return updatedWorkflow;
  }

  async restoreVersion(workflowId, versionId, userContext) {
    const workflow = await Workflow.findOne({
      _id: workflowId,
      workspaceId: userContext.workspaceId
    });

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    // Find the requested version
    const version = await WorkflowVersion.findOne({
      workflowId,
      _id: versionId
    });

    if (!version) {
      throw new Error('Version not found');
    }

    // Only update the config from the version
    workflow.config = version.config;

    const updatedWorkflow = await workflow.save();
    await invalidateWorkflowCache(workflowId);
    return updatedWorkflow;
  }

  async getWorkflow(workflowId, options = {}) {
    const cachedWorkflow = await getCachedWorkflow(workflowId);
    if (cachedWorkflow && !options.methods?.length && !options.include?.length) {
      return cachedWorkflow;
    }

    let query = Workflow.findById(workflowId);
    const { query: enhancedQuery, projection } = Workflow.selectFields(query, options);
    
    const workflow = await enhancedQuery.select(projection);
    if (!workflow) {
      return null;
    }

    // Get default version data if workflow is published
    if (workflow.status === 'published' && workflow.defaultVersionId) {
      const defaultVersion = await WorkflowVersion.findById(workflow.defaultVersionId);
      if (defaultVersion) {
        workflow._doc.inputSchema = defaultVersion.inputSchema;
        workflow._doc.outputType = defaultVersion.outputType;
        workflow._doc.configVariables = defaultVersion.configVariables;
      }
    }

    // Handle computed methods if requested
    if (options.methods?.length) {
      const computedFields = {};
      for (const method of options.methods) {
        switch (method) {
          case 'linked_grids_count':
            computedFields.linked_grids_count = await workflow.getLinkedGridsCount();
            break;
          case 'last_seven_days_executions_count':
            computedFields.last_seven_days_executions_count = await workflow.getLastSevenDaysExecutionsCount();
            break;
          case 'can_create_grid':
            computedFields.can_create_grid = workflow.canCreateGrid();
            break;
        }
      }
      Object.assign(workflow, computedFields);
    }

    if (!options.methods?.length && !options.include?.length) {
      await cacheWorkflow(workflowId, workflow);
    }
    
    return workflow;
  }

  async listWorkflows(filters = {}, options = {}) {
    let query = Workflow.find({ ...filters, deletedAt: null });
    const { query: enhancedQuery, projection } = Workflow.selectFields(query, options);

    const workflows = await enhancedQuery
      .sort({ updatedAt: -1 })
      .select(projection);

    // Get latest version data for published workflows
    for (const workflow of workflows) {
      if (workflow.status === 'published' && workflow.latestVersionId) {
        const latestVersion = await WorkflowVersion.findById(workflow.latestVersionId);
        if (latestVersion) {
          workflow._doc.inputSchema = latestVersion.inputSchema;
          workflow._doc.outputType = latestVersion.outputType;
          workflow._doc.configVariables = latestVersion.configVariables;
        }
      }
    }

    // Handle computed methods if requested
    if (options.methods?.length) {
      for (const workflow of workflows) {
        const computedFields = {};
        for (const method of options.methods) {
          switch (method) {
            case 'linked_grids_count':
              computedFields.linked_grids_count = await workflow.getLinkedGridsCount();
              break;
            case 'last_seven_days_executions_count':
              computedFields.last_seven_days_executions_count = await workflow.getLastSevenDaysExecutionsCount();
              break;
            case 'can_create_grid':
              computedFields.can_create_grid = workflow.canCreateGrid();
              break;
          }
        }
        Object.assign(workflow, computedFields);
      }
    }

    return workflows;
  }

  async deleteWorkflow(workflowId) {
    // Soft delete
    const result = await Workflow.findByIdAndUpdate(workflowId, {
      deletedAt: new Date()
    });
    
    if (result) {
      await invalidateWorkflowCache(workflowId);
    }
    return result;
  }

  async getWorkflowVersion(workflowId, versionId, options = {}) {
    const version = await WorkflowVersion.findOne({
      workflowId,
      _id: versionId
    });

    if (!version) {
      throw new Error('Version not found');
    }

    // Handle includes
    if (options.include?.length) {
      await version.populate(options.include);
    }

    // Handle excludes
    if (options.except?.length) {
      const versionObj = version.toObject();
      options.except.forEach(field => {
        delete versionObj[field];
      });
      return versionObj;
    }

    return version;
  }

  async listWorkflowVersions(workflowId, options = {}) {
    // First check if workflow exists and user has access
    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    let query = WorkflowVersion.find({ workflowId })
      .sort({ version: -1 });

    // Handle includes (e.g., user details)
    if (options.include?.length) {
      query = query.populate(options.include);
    }

    const versions = await query;

    // Handle excludes
    if (options.except?.length) {
      return versions.map(version => {
        const versionObj = version.toObject();
        options.except.forEach(field => {
          delete versionObj[field];
        });
        return versionObj;
      });
    }

    return versions;
  }
}

module.exports = new WorkflowService(); 