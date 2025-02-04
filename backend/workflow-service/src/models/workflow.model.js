const mongoose = require('mongoose');

const workflowSchema = new mongoose.Schema({
  name: { type: String, default: '', required: false },
  description: { type: String, default: '', required: false },
  createdBy: { type: String, required: true },
  config: {
    type: mongoose.Schema.Types.Mixed,
    required: false,
    default: {},
    description: 'Current working configuration (unpublished changes)'
  },
  defaultVersion: { 
    type: Number, 
    default: 0,
    description: 'Default version number to use'
  },
  totalVersions: {
    type: Number,
    default: 0,
    description: 'Total number of versions created, used to generate next version number'
  },
  defaultVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkflowVersion',
    description: 'Reference to default version to use'
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  uuid: { 
    type: String, 
    default: () => require('crypto').randomUUID() 
  },
  workspaceId: { type: String, required: true }, 
  public: { type: Boolean, default: false },
  color: { type: String, default: 'blue' },
  emoji: { type: String, default: '' },
  readme: { type: String, default: '' },
  deletedAt: { type: Date, default: null }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields for computed properties
workflowSchema.virtual('active_version_number').get(function() {
  return this.defaultVersion;
});

workflowSchema.virtual('folder_name').get(function() {
  return null; // Implement folder logic if needed
});

workflowSchema.virtual('type').get(function() {
  return 'Workflow';
});

// Methods for computed properties
workflowSchema.methods.getLinkedGridsCount = async function() {
  // Implement if needed
  return 0;
};

workflowSchema.methods.getLastSevenDaysExecutionsCount = async function() {
  // Implement if needed
  return 0;
};

workflowSchema.methods.canCreateGrid = function() {
  return true;
};

// Static method to handle field selection
workflowSchema.statics.selectFields = function(query, { methods = [], include = [], except = [] }) {
  const projection = {};
  
  // Handle excluded fields
  except.forEach(field => {
    projection[field] = 0;
  });

  // Handle included relations
  if (include.length > 0) {
    query = query.populate(include);
  }

  return { query, projection };
};

// Indexes for faster queries
workflowSchema.index({ name: 1, workspaceId: 1 });
workflowSchema.index({ uuid: 1 }, { unique: true });
workflowSchema.index({ workspaceId: 1 });
workflowSchema.index({ deletedAt: 1 });

module.exports = mongoose.model('Workflow', workflowSchema); 