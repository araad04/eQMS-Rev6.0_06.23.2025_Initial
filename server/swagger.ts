
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'eQMS API Documentation',
      version: '1.0.0',
      description: 'API documentation for the eQMS system',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
  },
  apis: ['./server/routes.ts'], // Path to the API routes
};

export const specs = swaggerJsdoc(options);
