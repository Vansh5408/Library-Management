import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables as early as possible so modules that read
// process.env during their initialization get correct values.
dotenv.config();

// Validate critical environment variables
if (!process.env.JWT_SECRET) {
  console.error('\n⚠️  CRITICAL ERROR: JWT_SECRET environment variable is not set!');
  console.error('Please create a .env file with JWT_SECRET=your-secret-key');
  console.error('For production, use a strong random secret (minimum 32 characters)\n');
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.warn('\n⚠️  WARNING: JWT_SECRET is too short (less than 32 characters)');
  console.warn('For production security, use a longer secret key\n');
}

if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET === 'your-secret-key-change-this-in-production') {
  console.error('\n⚠️  CRITICAL ERROR: Using default JWT_SECRET in production!');
  console.error('Change JWT_SECRET in your .env file immediately!\n');
  process.exit(1);
}

import { initializeDatabase } from './database/db.js';
import { initializePartitions } from './database/partitions.js';
import { initializePDFStorage } from './database/pdfs.js';
import authRoutes from './routes/authRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import borrowRoutes from './routes/borrowRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import externalBookRoutes from './routes/externalBookRoutes.js';
import pdfRoutes from './routes/pdfRoutes.js';
import librarianRoutes from './routes/librarianRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Initialize database and storage systems
initializeDatabase();
initializePartitions();
initializePDFStorage();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Set timeout for all requests (30 seconds)
app.use((req: Request, res: Response, next) => {
  req.setTimeout(30000); // 30 seconds
  res.setTimeout(30000);
  next();
});

// Request logging
app.use((req: Request, res: Response, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  
  // Log response status when response finishes
  const originalSend = res.send;
  res.send = function(data) {
    console.log(`[${timestamp}] ${req.method} ${req.path} - ${res.statusCode}`);
    return originalSend.call(this, data);
  };
  
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/borrows', borrowRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/external-books', externalBookRoutes);
app.use('/api/pdfs', pdfRoutes);
app.use('/api/librarian', librarianRoutes);
app.use('/api/ai', aiRoutes); // AI-powered features

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Library Management API is running',
    timestamp: new Date().toISOString(),
  });
});

// API documentation
app.get('/api', (req: Request, res: Response) => {
  res.json({
    name: 'AI-Powered Library Management System',
    version: '2.0.0',
    aiFeatures: ['Recommendations', 'Smart Search', 'Chatbot', 'Analytics', 'Summaries'],
    documentation: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile (requires token)',
      },
      books: {
        getAll: 'GET /api/books',
        search: 'GET /api/books/search',
        getById: 'GET /api/books/:id',
        create: 'POST /api/books (requires admin)',
      },
      borrows: {
        borrow: 'POST /api/borrows/borrow',
        return: 'POST /api/borrows/return',
        active: 'GET /api/borrows/active',
        history: 'GET /api/borrows/history',
      },
      ai: {
        recommendations: 'GET /api/ai/recommendations (requires auth)',
        similarBooks: 'GET /api/ai/similar/:bookId',
        smartSearch: 'GET /api/ai/smart-search?query=...',
        bookSummary: 'GET /api/ai/summary/:bookId',
        userInsights: 'GET /api/ai/insights (requires auth)',
        readingTrends: 'GET /api/ai/trends',
        chatbot: 'POST /api/ai/chat',
      },
      externalBooks: {
        search: 'GET /api/external-books/search',
        googleBooks: 'GET /api/external-books/search/google',
        openLibrary: 'GET /api/external-books/search/openlibrary',
      },
    },
  });
});


// Debug endpoint to check JWT secret (DEVELOPMENT ONLY - requires explicit flag)
if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_DEBUG_ENDPOINTS === 'true') {
  app.get('/api/debug/jwt-secret', (req: Request, res: Response) => {
    res.json({
      JWT_SECRET_LENGTH: process.env.JWT_SECRET?.length || 0,
      NODE_ENV: process.env.NODE_ENV || null,
      // Never expose actual secret, only its length
    });
  });
}

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: `${req.method} ${req.path} does not exist`,
  });
});

// Error handling
app.use((err: any, req: Request, res: Response, next: Function) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message || 'Unknown error',
  });
});

// Start server with port fallback
const startServer = (port: number) => {
  const server = app.listen(port, () => {
    console.log(`
╔════════════════════════════════════════╗
║   Library Management System Server     ║
║              Running on                ║
║       http://localhost:${port}          ║
╚════════════════════════════════════════╝
    `);
    console.log(`
📚 Available Endpoints:
  - GET  /api                    (API documentation)
  - GET  /api/health             (Health check)
  
🔐 Authentication:
  - POST /api/auth/register      (Create new account)
  - POST /api/auth/login         (Login)
  - GET  /api/auth/profile       (Get user profile - requires token)

📖 Books:
  - GET  /api/books              (Get all books)
  - GET  /api/books/:id          (Get book by ID)
  - GET  /api/books/available    (Get available books)
  - GET  /api/books/search       (Search books)
  - GET  /api/books/stats        (Get library statistics)

📚 Borrowing:
  - POST /api/borrows/borrow     (Borrow book - requires token)
  - POST /api/borrows/return     (Return book - requires token)
  - GET  /api/borrows/active     (Get active borrows - requires token)
  - GET  /api/borrows/history    (Get borrow history - requires token)
    `);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️ Port ${port} is busy, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
  
  // Graceful shutdown
  const shutdown = () => {
    console.log('\n🛑 Shutting down gracefully...');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
    
    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('⚠️  Forcing shutdown...');
      process.exit(1);
    }, 10000);
  };
  
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer(Number(PORT));

export default app;
