const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { redisClient } = require('./config/redis');
const workflowRoutes = require('./routes/workflow.routes');
const templateRoutes = require('./routes/template.routes');
const agentRoutes = require('./routes/agent.routes');

const app = express();
const PORT = process.env.PORT || 8096;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/workflow-service')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Swagger Configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Workflow Service API',
      version: '1.0.0',
      description: 'API documentation for the Workflow Service'
    },
    servers: [
      {
        url: '/'
      }
    ]
  },
  apis: ['./src/routes/*.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/workflow-service/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use('/workflow-service/v1', workflowRoutes);
app.use('/workflow-service/v1', templateRoutes);
app.use('/workflow-service/v1', agentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 