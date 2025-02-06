const mongoose = require('mongoose');
const { Schema } = mongoose;

const actionSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: String
}, { _id: true });

// Add integration schema
const integrationSchema = new Schema({
  id: {
    type: String,
    required: true
  },
  moduleId: {
    type: String,
    required: true
  },
  moduleName: {
    type: String,
    required: true
  },
  moduleIcon: {
    type: String,
    required: true
  },
  triggerType: {
    type: String,
    required: true
  },
  triggerName: {
    type: String,
    required: true
  },
  required: {
    type: Boolean,
    default: false
  }
});

const agentSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  emoji: String,
  systemPrompt: String,
  tools: [{
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: false
    },
    icon: {
      type: String,
      required: false
    },
    approvalMode: {
      type: String,
      enum: ['required', 'none', 'optional'],
      default: 'required'
    },
    maxApprovals: {
      type: Schema.Types.Mixed, // To support both number and 'no-limit' string
      default: 'no-limit'
    },
    prompt: {
      type: String,
      required: false
    }
  }],
  // Add integrations array to schema
  integrations: [integrationSchema],
  actions: [actionSchema],
  lastRunDate: Date,
  tasksDone: {
    type: Number,
    default: 0
  },
  workspaceId: {
    type: String,
    required: true
  },
  createdBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      ret.created = ret.createdAt;
      ret.lastModified = ret.updatedAt;
      delete ret.createdAt;
      delete ret.updatedAt;
    }
  }
});

const Agent = mongoose.model('Agent', agentSchema);

module.exports = Agent; 