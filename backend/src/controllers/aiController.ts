// AI Controller - API endpoints for AI-powered features
// Provides intelligent recommendations, smart search, summaries, and analytics

import { Request, Response } from 'express';
import { ApiResponse, Book, BorrowRecord, User } from '../models/types.js';
import { readDatabase } from '../database/db.js';
import AIService from '../services/aiService.js';

// ==================== AI RECOMMENDATIONS ====================

/**
 * Get personalized book recommendations for a user
 * Uses ML algorithms to analyze user preferences and reading history
 * 
 * @route GET /api/ai/recommendations
 * @access Private (requires authentication)
 */
export async function getRecommendations(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      } as ApiResponse<null>);
      return;
    }

    const limit = parseInt(req.query.limit as string) || 10;
    const db = readDatabase();

    // Get user's borrow history
    const userHistory = db.borrowRecords.filter((r: BorrowRecord) => r.userId === userId);

    // Get recommendations using AI
    const recommendations = await AIService.RecommendationEngine.getRecommendations(
      userId,
      userHistory,
      db.books,
      limit
    );

    res.status(200).json({
      success: true,
      message: `Generated ${recommendations.length} personalized recommendations`,
      data: {
        recommendations,
        basedOnHistory: userHistory.length,
        confidence: recommendations.length > 0 ? 'high' : 'low',
      },
    } as ApiResponse<any>);
  } catch (error) {
    console.error('AI Recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recommendations',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

/**
 * Get similar books based on a specific book
 * 
 * @route GET /api/ai/similar/:bookId
 * @access Public
 */
export async function getSimilarBooks(req: Request, res: Response): Promise<void> {
  try {
    const { bookId } = req.params;
    const limit = parseInt(req.query.limit as string) || 5;
    const db = readDatabase();

    const targetBook = db.books.find((b: Book) => b.id === bookId);
    if (!targetBook) {
      res.status(404).json({
        success: false,
        message: 'Book not found',
      } as ApiResponse<null>);
      return;
    }

    // Find similar books based on categories and author
    const similarBooks = db.books
      .filter((b: Book) => b.id !== bookId && b.available)
      .map((book: Book) => {
        let similarity = 0;

        // Same author
        if (book.author === targetBook.author) similarity += 50;

        // Shared categories
        if (book.categories && targetBook.categories) {
          const sharedCategories = book.categories.filter((cat: string) =>
            targetBook.categories!.includes(cat)
          );
          similarity += sharedCategories.length * 20;
        }

        // Similar publication year
        if (book.publicationYear && targetBook.publicationYear) {
          const yearDiff = Math.abs(book.publicationYear - targetBook.publicationYear);
          similarity += Math.max(0, 10 - yearDiff);
        }

        return { book, similarity };
      })
      .filter((item: { book: Book; similarity: number }) => item.similarity > 0)
      .sort((a: { similarity: number }, b: { similarity: number }) => b.similarity - a.similarity)
      .slice(0, limit)
      .map((item: { book: Book; similarity: number }) => ({
        ...item.book,
        similarityScore: item.similarity,
      }));

    res.status(200).json({
      success: true,
      message: `Found ${similarBooks.length} similar books`,
      data: {
        targetBook: {
          id: targetBook.id,
          title: targetBook.title,
          author: targetBook.author,
        },
        similarBooks,
      },
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Similar books error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find similar books',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

// ==================== SMART SEARCH ====================

/**
 * Intelligent search using NLP to understand user intent
 * 
 * @route GET /api/ai/smart-search
 * @access Public
 */
export async function smartSearch(req: Request, res: Response): Promise<void> {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Search query is required',
      } as ApiResponse<null>);
      return;
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const db = readDatabase();

    // Use AI-powered smart search
    const results = await AIService.SmartSearchEngine.smartSearch(
      query,
      db.books,
      limit
    );

    // Parse search intent for frontend display
    const intent = AIService.SmartSearchEngine.parseQuery(query);

    res.status(200).json({
      success: true,
      message: `Found ${results.length} results using AI search`,
      data: {
        results,
        searchIntent: intent,
        totalResults: results.length,
      },
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Smart search error:', error);
    res.status(500).json({
      success: false,
      message: 'Smart search failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

// ==================== AI BOOK SUMMARIES ====================

/**
 * Get AI-generated summary and insights for a book
 * 
 * @route GET /api/ai/summary/:bookId
 * @access Public
 */
export async function getBookSummary(req: Request, res: Response): Promise<void> {
  try {
    const { bookId } = req.params;
    const db = readDatabase();

    const book = db.books.find((b: Book) => b.id === bookId);
    if (!book) {
      res.status(404).json({
        success: false,
        message: 'Book not found',
      } as ApiResponse<null>);
      return;
    }

    // Generate AI summary
    const summary = AIService.BookSummaryGenerator.generateSummary(book);

    // Get similar books for recommendations
    const similarBooks = db.books
      .filter((b: Book) => b.id !== bookId && b.categories?.some((cat: string) => book.categories?.includes(cat)))
      .slice(0, 3)
      .map((b: Book) => ({ id: b.id, title: b.title, author: b.author }));

    res.status(200).json({
      success: true,
      message: 'Book summary generated',
      data: {
        ...summary,
        similarBooks,
        generatedAt: new Date().toISOString(),
      },
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Book summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate book summary',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

/**
 * Batch generate summaries for multiple books
 * 
 * @route POST /api/ai/summaries/batch
 * @access Public
 */
export async function getBatchSummaries(req: Request, res: Response): Promise<void> {
  try {
    const { bookIds } = req.body;

    if (!Array.isArray(bookIds) || bookIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Array of book IDs required',
      } as ApiResponse<null>);
      return;
    }

    const db = readDatabase();
    const summaries = [];

    for (const bookId of bookIds.slice(0, 50)) { // Limit to 50 books
      const book = db.books.find((b: Book) => b.id === bookId);
      if (book) {
        const summary = AIService.BookSummaryGenerator.generateSummary(book);
        summaries.push(summary);
      }
    }

    res.status(200).json({
      success: true,
      message: `Generated ${summaries.length} summaries`,
      data: summaries,
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Batch summaries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate summaries',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

// ==================== READING ANALYTICS ====================

/**
 * Get AI-powered reading insights for the authenticated user
 * 
 * @route GET /api/ai/insights
 * @access Private
 */
export async function getUserInsights(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      } as ApiResponse<null>);
      return;
    }

    const db = readDatabase();
    const user = db.users.find((u: User) => u.id === userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      } as ApiResponse<null>);
      return;
    }

    const borrowHistory = db.borrowRecords.filter((r: BorrowRecord) => r.userId === userId);

    // Generate AI insights
    const insights = AIService.ReadingAnalytics.generateInsights(
      user,
      borrowHistory,
      db.books
    );

    // Get AI recommendations
    const recommendations = await AIService.RecommendationEngine.getRecommendations(
      userId,
      borrowHistory,
      db.books,
      5
    );

    insights.aiRecommendations = recommendations.map(r => r.book.id);

    res.status(200).json({
      success: true,
      message: 'Reading insights generated',
      data: {
        insights,
        recommendations: recommendations.slice(0, 3).map(r => ({
          book: r.book,
          reasons: r.reasons,
          confidence: r.confidence,
        })),
      },
    } as ApiResponse<any>);
  } catch (error) {
    console.error('User insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate insights',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

/**
 * Get reading trends and statistics
 * 
 * @route GET /api/ai/trends
 * @access Public
 */
export async function getReadingTrends(req: Request, res: Response): Promise<void> {
  try {
    const db = readDatabase();

    // Calculate global trends
    const totalBorrows = db.borrowRecords.length;
    const activeBorrows = db.borrowRecords.filter((r: BorrowRecord) => r.status === 'active').length;
    const completedBorrows = db.borrowRecords.filter((r: BorrowRecord) => r.returnedAt).length;

    // Most popular books
    const borrowCounts = new Map<string, number>();
    db.borrowRecords.forEach((r: BorrowRecord) => {
      borrowCounts.set(r.bookId, (borrowCounts.get(r.bookId) || 0) + 1);
    });

    const popularBooks = Array.from(borrowCounts.entries())
      .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
      .slice(0, 10)
      .map(([bookId, count]: [string, number]) => {
        const book = db.books.find((b: Book) => b.id === bookId);
        return book ? { book, borrowCount: count } : null;
      })
      .filter(Boolean);

    // Most popular categories
    const categoryCounts = new Map<string, number>();
    db.borrowRecords.forEach((r: BorrowRecord) => {
      const book = db.books.find((b: Book) => b.id === r.bookId);
      if (book?.categories) {
        book.categories.forEach((cat: string) => {
          categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
        });
      }
    });

    const popularCategories = Array.from(categoryCounts.entries())
      .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
      .slice(0, 10)
      .map(([category, count]: [string, number]) => ({ category, count }));

    // Reading activity by month
    const monthlyActivity = calculateMonthlyActivity(db.borrowRecords);

    res.status(200).json({
      success: true,
      message: 'Reading trends calculated',
      data: {
        overview: {
          totalBorrows,
          activeBorrows,
          completedBorrows,
          totalBooks: db.books.length,
          totalUsers: db.users.length,
        },
        popularBooks,
        popularCategories,
        monthlyActivity,
        generatedAt: new Date().toISOString(),
      },
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Reading trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate trends',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

/**
 * Calculate monthly borrow activity
 */
function calculateMonthlyActivity(records: BorrowRecord[]): any[] {
  const last6Months = new Map<string, number>();
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    last6Months.set(key, 0);
  }

  records.forEach(record => {
    const date = new Date(record.borrowedAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (last6Months.has(key)) {
      last6Months.set(key, last6Months.get(key)! + 1);
    }
  });

  return Array.from(last6Months.entries()).map(([month, count]) => ({
    month,
    borrowCount: count,
  }));
}

// ==================== AI CHATBOT ====================

/**
 * AI Chatbot assistant for library queries
 * 
 * @route POST /api/ai/chat
 * @access Public
 */
export async function chatbot(req: Request, res: Response): Promise<void> {
  try {
    const { message, conversationId } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Message is required',
      } as ApiResponse<null>);
      return;
    }

    const db = readDatabase();
    const response = await generateChatbotResponse(message, db);

    res.status(200).json({
      success: true,
      message: 'Response generated',
      data: {
        response,
        conversationId: conversationId || Date.now().toString(),
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      message: 'Chatbot failed to respond',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

/**
 * Generate chatbot response using pattern matching and AI
 */
async function generateChatbotResponse(message: string, db: any): Promise<string> {
  const lowerMessage = message.toLowerCase();

  // Handle greetings
  if (/^(hi|hello|hey|good morning|good evening)/.test(lowerMessage)) {
    return "Hello! 👋 I'm your AI library assistant. I can help you find books, get recommendations, check availability, or answer questions about our library. What would you like to know?";
  }

  // Handle recommendations request
  if (lowerMessage.includes('recommend') || lowerMessage.includes('suggestion')) {
    const randomBook = db.books[Math.floor(Math.random() * Math.min(5, db.books.length))];
    return `I'd be happy to recommend a book! Based on our collection, I suggest "${randomBook.title}" by ${randomBook.author}. It's ${randomBook.available ? 'currently available' : 'currently checked out'}. ${randomBook.description ? randomBook.description.substring(0, 150) + '...' : ''} Would you like more recommendations or details about this book?`;
  }

  // Handle book search
  if (lowerMessage.includes('find') || lowerMessage.includes('search') || lowerMessage.includes('looking for')) {
    return "I can help you find a book! You can search by title, author, genre, or ISBN. Try asking me 'Find books by [author name]' or 'Search for books about [topic]'. What are you looking for?";
  }

  // Handle availability questions
  if (lowerMessage.includes('available') || lowerMessage.includes('borrow') || lowerMessage.includes('checkout')) {
    const availableCount = db.books.filter((b: Book) => b.available).length;
    return `We currently have ${availableCount} books available for checkout out of ${db.books.length} total books in our collection. You can browse available books or tell me what genre interests you, and I'll help you find something great to read!`;
  }

  // Handle category questions
  if (lowerMessage.includes('genre') || lowerMessage.includes('category') || lowerMessage.includes('type')) {
    const categories = new Set<string>();
    db.books.forEach((b: Book) => {
      if (b.categories) b.categories.forEach(c => categories.add(c));
    });
    const catList = Array.from(categories).slice(0, 8).join(', ');
    return `Our library has books in many categories including: ${catList}, and more! Which genre interests you?`;
  }

  // Handle hours/general info
  if (lowerMessage.includes('hour') || lowerMessage.includes('open') || lowerMessage.includes('timings')) {
    return "Our library operates 24/7 through our online platform! You can browse, borrow, and return books anytime. Physical locations may have different hours. How else can I assist you?";
  }

  // Handle help request
  if (lowerMessage.includes('help') || lowerMessage.includes('can you')) {
    return "I can assist you with:\n\n📚 Finding books by title, author, or genre\n🎯 Getting personalized recommendations\n✅ Checking book availability\n📊 Viewing your reading statistics\n❓ Answering general library questions\n\nWhat would you like help with?";
  }

  // Handle thanks
  if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
    return "You're welcome! 😊 Is there anything else I can help you with today?";
  }

  // Default response with suggestions
  return "I'm here to help! I can assist you with finding books, getting recommendations, checking availability, or answering questions about our library. What would you like to know? Feel free to ask me things like:\n\n• 'Recommend a book'\n• 'Find books about science'\n• 'What genres do you have?'\n• 'How many books are available?'";
}

// ==================== EXPORT ====================

export default {
  getRecommendations,
  getSimilarBooks,
  smartSearch,
  getBookSummary,
  getBatchSummaries,
  getUserInsights,
  getReadingTrends,
  chatbot,
};
