// AI Routes - API endpoints for all AI-powered features
// Smart recommendations, NLP search, summaries, analytics, and chatbot

import { Router } from 'express';
import {
  getRecommendations,
  getSimilarBooks,
  smartSearch,
  getBookSummary,
  getBatchSummaries,
  getUserInsights,
  getReadingTrends,
  chatbot,
} from '../controllers/aiController.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = Router();

// ==================== AI RECOMMENDATIONS ====================

// Get personalized recommendations (requires authentication)
router.get('/recommendations', authenticateToken, getRecommendations);

// Get similar books based on a book
router.get('/similar/:bookId', getSimilarBooks);

// ==================== SMART SEARCH ====================

// Intelligent NLP-powered search
router.get('/smart-search', smartSearch);

// ==================== AI SUMMARIES ====================

// Get AI-generated summary for a book
router.get('/summary/:bookId', getBookSummary);

// Batch generate summaries for multiple books
router.post('/summaries/batch', getBatchSummaries);

// ==================== READING ANALYTICS ====================

// Get personalized reading insights (requires authentication)
router.get('/insights', authenticateToken, getUserInsights);

// Get global reading trends and statistics
router.get('/trends', getReadingTrends);

// ==================== AI CHATBOT ====================

// Chat with AI library assistant
router.post('/chat', chatbot);

export default router;
