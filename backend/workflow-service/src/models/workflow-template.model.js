const mongoose = require('mongoose');

const workflowTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  config: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    description: 'Template configuration'
  },
  createdBy: { type: String, required: true },
  workspaceId: { type: String, required: true },
  public: { type: Boolean, default: false },
  color: { type: String, default: 'blue' },
  emoji: { type: String, default: '' },
  readme: { type: String, default: '' },
  inputSchema: { 
    type: [mongoose.Schema.Types.Mixed], 
    default: [] 
  },
  outputType: { type: String, default: null },
  configVariables: { 
    type: [mongoose.Schema.Types.Mixed], 
    default: [] 
  },
  deletedAt: { type: Date, default: null }
}, {
  timestamps: true
});

// Indexes for faster queries
workflowTemplateSchema.index({ name: 1, workspaceId: 1 });
workflowTemplateSchema.index({ public: 1 });
workflowTemplateSchema.index({ deletedAt: 1 });

module.exports = mongoose.model('WorkflowTemplate', workflowTemplateSchema); 