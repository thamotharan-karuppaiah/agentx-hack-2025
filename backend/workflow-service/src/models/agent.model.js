const mongoose = require('mongoose');

const actionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String
}, { _id: true });

const agentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  emoji: String,
  systemPrompt: String,
  tools: [{
    type: String
  }],
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