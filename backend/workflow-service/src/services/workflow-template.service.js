const WorkflowTemplate = require('../models/workflow-template.model');
const Workflow = require('../models/workflow.model');

class WorkflowTemplateService {
  async createTemplate(templateData) {
    const template = new WorkflowTemplate(templateData);
    return await template.save();
  }

  async getTemplate(templateId) {
    return await WorkflowTemplate.findOne({
      _id: templateId,
      deletedAt: null
    });
  }

  async listTemplates(filters = {}, options = {}) {
    return await WorkflowTemplate.find({
      ...filters,
      deletedAt: null
    }).sort({ updatedAt: -1 });
  }

  async updateTemplate(templateId, updates) {
    const template = await WorkflowTemplate.findById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    Object.assign(template, updates);
    return await template.save();
  }

  async deleteTemplate(templateId) {
    return await WorkflowTemplate.findByIdAndUpdate(templateId, {
      deletedAt: new Date()
    });
  }

  async createWorkflowFromTemplate(templateId, userData) {
    const template = await WorkflowTemplate.findOne({
      _id: templateId,
      deletedAt: null
    });
    
    if (!template) {
      throw new Error('Template not found');
    }

    // Create a new workflow using template configuration
    const workflow = new Workflow({
      name: template.name,
      description: template.description,
      config: template.config,
      createdBy: userData.userId,
      workspaceId: userData.workspaceId,
      inputSchema: template.inputSchema,
      outputType: template.outputType,
      configVariables: template.configVariables
    });

    return await workflow.save();
  }

  async getTemplateConfig(templateId) {
    const template = await WorkflowTemplate.findOne({
      _id: templateId,
      deletedAt: null
    });
    
    if (!template) {
      throw new Error('Template not found');
    }

    // Return only the configuration and related fields
    return {
      config: template.config,
      inputSchema: template.inputSchema,
      outputType: template.outputType,
      configVariables: template.configVariables
    };
  }
}

module.exports = new WorkflowTemplateService(); 