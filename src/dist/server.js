"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const yamljs_1 = __importDefault(require("yamljs"));
const path_1 = __importDefault(require("path"));
const connection_1 = require("./database/connection");
const errorHandler_1 = require("./middleware/errorHandler");
const tasks_1 = __importDefault(require("./routes/tasks"));
const sync_1 = __importDefault(require("./routes/sync"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '3000', 10);
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://your-frontend.com']
        : true,
    credentials: true
}));
// Parse JSON bodies
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Serve static files
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// Request logging in development
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});
// Load Swagger specification
const swaggerPath = process.env.NODE_ENV === 'production'
    ? path_1.default.join(__dirname, 'swagger.yaml')
    : path_1.default.join(__dirname, '../swagger.yaml');
let swaggerDocument;
try {
    swaggerDocument = yamljs_1.default.load(swaggerPath);
}
catch (error) {
    console.error('Error loading Swagger document:', error);
    swaggerDocument = {
        openapi: '3.0.3',
        info: { title: 'Task Management API', version: '1.0.0' },
        paths: {}
    };
}
// Swagger UI setup with minimal, professional styling
const swaggerOptions = {
    customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { 
      color: #1a365d; 
      font-size: 2.5rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }
    .swagger-ui .info .description { 
      font-size: 1rem; 
      line-height: 1.6;
      color: #4a5568;
    }
    .swagger-ui .scheme-container { 
      background: #f7fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem;
    }
    .swagger-ui .opblock .opblock-summary {
      border-radius: 6px;
      padding: 0.75rem 1rem;
    }
    .swagger-ui .opblock.opblock-get .opblock-summary {
      background: rgba(97, 175, 254, 0.1);
      border-color: #61affe;
    }
    .swagger-ui .opblock.opblock-post .opblock-summary {
      background: rgba(73, 204, 144, 0.1);
      border-color: #49cc90;
    }
    .swagger-ui .opblock.opblock-put .opblock-summary {
      background: rgba(252, 161, 48, 0.1);
      border-color: #fca130;
    }
    .swagger-ui .opblock.opblock-delete .opblock-summary {
      background: rgba(249, 62, 62, 0.1);
      border-color: #f93e3e;
    }
    .swagger-ui .opblock-tag {
      font-size: 1.1rem;
      font-weight: 600;
      color: #2d3748;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 0.5rem;
      margin-bottom: 1rem;
    }
    .swagger-ui .btn.execute {
      background: #4299e1;
      border-color: #4299e1;
    }
    .swagger-ui .btn.execute:hover {
      background: #3182ce;
      border-color: #3182ce;
    }
  `,
    customSiteTitle: 'Task Management API - Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
        docExpansion: 'list',
        filter: true,
        showRequestHeaders: true,
        tryItOutEnabled: true,
        supportedSubmitMethods: ['get', 'post', 'put', 'delete'],
        validatorUrl: null,
        displayRequestDuration: true,
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
        defaultModelRendering: 'model',
        tagsSorter: 'alpha',
        operationsSorter: 'alpha'
    }
};
// Serve Swagger UI
app.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocument, swaggerOptions));
// Redirect /docs to /api/docs for convenience
app.get('/docs', (req, res) => {
    res.redirect('/api/docs');
});
// API routes
app.use('/api/tasks', tasks_1.default);
app.use('/api/sync', sync_1.default);
// Error handling
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
// Initialize database and start server
async function startServer() {
    try {
        console.log('Initializing database...');
        const db = (0, connection_1.getDatabase)();
        await db.initialize();
        console.log('Database initialized successfully');
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`📝 Tasks API: http://localhost:${PORT}/api/tasks`);
            console.log(`🔄 Sync API: http://localhost:${PORT}/api/sync`);
            console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
            console.log(`📖 Swagger UI: http://localhost:${PORT}/docs`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Received SIGINT. Shutting down gracefully...');
    const db = (0, connection_1.getDatabase)();
    await db.close();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('Received SIGTERM. Shutting down gracefully...');
    const db = (0, connection_1.getDatabase)();
    await db.close();
    process.exit(0);
});
startServer();
//# sourceMappingURL=server.js.map