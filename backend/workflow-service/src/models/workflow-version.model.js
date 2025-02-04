const mongoose = require('mongoose');

const workflowVersionSchema = new mongoose.Schema({
  workflowId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Workflow',
    required: true 
  },
  version: { 
    type: Number, 
    required: true 
  },
  config: { 
    type: mongoose.Schema.Types.Mixed, 
    required: true 
  },
  inputSchema: { 
    type: [mongoose.Schema.Types.Mixed], 
    default: [] 
  },
  outputType: { 
    type: String, 
    default: null 
  },
  configVariables: { 
    type: [mongoose.Schema.Types.Mixed], 
    default: [] 
  },
  publishedAt: { 
    type: Date, 
    default: Date.now 
  },
  publishedBy: { 
    type: String, 
    required: true 
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      return ret;
    }
  },
  toObject: { 
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      return ret;
    }
  }
});

// Compound index for faster queries
workflowVersionSchema.index({ workflowId: 1, version: 1 }, { unique: true });

module.exports = mongoose.model('WorkflowVersion', workflowVersionSchema); 