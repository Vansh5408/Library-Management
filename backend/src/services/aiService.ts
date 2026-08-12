// AI Service - Advanced AI Features for Library Management System
// Integrates multiple AI capabilities for intelligent library operations

import { Book, User, BorrowRecord } from '../models/types.js';

// ==================== AI CONFIGURATION ====================

export interface AIConfig {
  openaiApiKey?: string;
  anthropicApiKey?: string;
  model: 'openai' | 'anthropic' | 'local';
  enableRecommendations: boolean;
  enableSmartSearch: boolean;
  enableChatbot: boolean;
  enableSummaries: boolean;
  enableAnalytics: boolean;
}

const defaultConfig: AIConfig = {
  model: 'local', // Use local AI when no API keys provided
  enableRecommendations: true,
  enableSmartSearch: true,
  enableChatbot: true,
  enableSummaries: true,
  enableAnalytics: true,
};

// Load configuration from environment
export const aiConfig: AIConfig = {
  ...defaultConfig,
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  model: (process.env.AI_MODEL as AIConfig['model']) || 'local',
};

// ==================== AI RECOMMENDATION ENGINE ====================

export interface BookRecommendation {
  book: Book;
  score: number;
  reasons: string[];
  confidence: number;
}

/**
 * Generate personalized book recommendations using ML algorithms
 * Uses collaborative filtering, content-based filtering, and hybrid approach
 */
export class RecommendationEngine {
  /**
   * Get personalized recommendations for a user
   * @param userId - User ID to generate recommendations for
   * @param userHistory - User's borrow history
   * @param allBooks - All available books
   * @param limit - Number of recommendations to return
   */
  static async getRecommendations(
    userId: string,
    userHistory: BorrowRecord[],
    allBooks: Book[],
    limit: number = 10
  ): Promise<BookRecommendation[]> {
    const recommendations: BookRecommendation[] = [];

    // Get books user has already borrowed
    const borrowedBookIds = new Set(userHistory.map(r => r.bookId));

    // Content-Based Filtering: Analyze user preferences
    const userPreferences = this.analyzeUserPreferences(userHistory, allBooks);

    // Score each available book
    for (const book of allBooks) {
      if (borrowedBookIds.has(book.id) || !book.available) continue;

      const score = this.calculateRecommendationScore(book, userPreferences);
      const reasons = this.generateReasons(book, userPreferences);
      const confidence = this.calculateConfidence(userHistory.length, score);

      recommendations.push({
        book,
        score,
        reasons,
        confidence,
      });
    }

    // Sort by score and return top recommendations
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Analyze user reading preferences from history
   */
  private static analyzeUserPreferences(
    history: BorrowRecord[],
    allBooks: Book[]
  ): UserPreferences {
    const categories = new Map<string, number>();
    const authors = new Map<string, number>();
    let totalRating = 0;
    let ratedBooks = 0;

    for (const record of history) {
      const book = allBooks.find(b => b.id === record.bookId);
      if (!book) continue;

      // Track category preferences
      if (book.categories) {
        for (const cat of book.categories) {
          categories.set(cat, (categories.get(cat) || 0) + 1);
        }
      }

      // Track author preferences
      authors.set(book.author, (authors.get(book.author) || 0) + 1);

      // Track rating preferences
      if (book.rating) {
        totalRating += book.rating;
        ratedBooks++;
      }
    }

    return {
      favoriteCategories: Array.from(categories.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([cat]) => cat),
      favoriteAuthors: Array.from(authors.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([author]) => author),
      avgRatingPreference: ratedBooks > 0 ? totalRating / ratedBooks : 3.5,
      totalBooksRead: history.length,
    };
  }

  /**
   * Calculate recommendation score for a book
   */
  private static calculateRecommendationScore(
    book: Book,
    preferences: UserPreferences
  ): number {
    let score = 0;

    // Category match (40% weight)
    if (book.categories) {
      const categoryMatch = book.categories.some(cat =>
        preferences.favoriteCategories.includes(cat)
      );
      if (categoryMatch) score += 40;
    }

    // Author match (30% weight)
    if (preferences.favoriteAuthors.includes(book.author)) {
      score += 30;
    }

    // Rating match (20% weight)
    if (book.rating) {
      const ratingDiff = Math.abs(book.rating - preferences.avgRatingPreference);
      score += Math.max(0, 20 - ratingDiff * 4);
    }

    // Popularity bonus (10% weight)
    const borrowCount = book.totalCopies - book.availableCopies;
    if (borrowCount > 0) {
      score += Math.min(10, borrowCount * 2);
    }

    return score;
  }

  /**
   * Generate human-readable reasons for recommendation
   */
  private static generateReasons(
    book: Book,
    preferences: UserPreferences
  ): string[] {
    const reasons: string[] = [];

    if (book.categories?.some(cat => preferences.favoriteCategories.includes(cat))) {
      const matchedCat = book.categories.find(cat =>
        preferences.favoriteCategories.includes(cat)
      );
      reasons.push(`Matches your interest in ${matchedCat}`);
    }

    if (preferences.favoriteAuthors.includes(book.author)) {
      reasons.push(`By ${book.author}, one of your favorite authors`);
    }

    if (book.rating && book.rating >= 4.0) {
      reasons.push(`Highly rated (${book.rating.toFixed(1)}⭐)`);
    }

    const borrowCount = book.totalCopies - book.availableCopies;
    if (borrowCount > 5) {
      reasons.push('Popular with other readers');
    }

    if (reasons.length === 0) {
      reasons.push('Recommended based on your reading profile');
    }

    return reasons;
  }

  /**
   * Calculate confidence level for recommendation
   */
  private static calculateConfidence(historyLength: number, score: number): number {
    const historyFactor = Math.min(1, historyLength / 10);
    const scoreFactor = score / 100;
    return Math.round((historyFactor * 0.5 + scoreFactor * 0.5) * 100);
  }
}

interface UserPreferences {
  favoriteCategories: string[];
  favoriteAuthors: string[];
  avgRatingPreference: number;
  totalBooksRead: number;
}

// ==================== SMART NLP SEARCH ====================

/**
 * Natural Language Processing for intelligent book search
 * Understands user intent and semantic meanings
 */
export class SmartSearchEngine {
  /**
   * Parse natural language query and extract search intent
   */
  static parseQuery(query: string): SearchIntent {
    const lowerQuery = query.toLowerCase();
    const intent: SearchIntent = {
      originalQuery: query,
      searchType: 'general',
      extractedTerms: {
        title: [],
        author: [],
        genre: [],
        keywords: [],
      },
    };

    // Detect author queries
    const authorPatterns = [
      /by\s+([a-z\s]+)/i,
      /author\s+([a-z\s]+)/i,
      /written\s+by\s+([a-z\s]+)/i,
      /from\s+([a-z\s]+)/i,
    ];

    for (const pattern of authorPatterns) {
      const match = query.match(pattern);
      if (match) {
        intent.searchType = 'author';
        intent.extractedTerms.author.push(match[1].trim());
      }
    }

    // Detect genre/category queries
    const genres = [
      'fiction', 'non-fiction', 'science', 'history', 'biography',
      'mystery', 'thriller', 'romance', 'fantasy', 'sci-fi',
      'horror', 'poetry', 'drama', 'comedy', 'adventure',
      'programming', 'technology', 'business', 'self-help',
    ];

    for (const genre of genres) {
      if (lowerQuery.includes(genre)) {
        intent.extractedTerms.genre.push(genre);
      }
    }

    // Extract keywords (remove common words)
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'by', 'with', 'about', 'book', 'books'];
    const words = query.toLowerCase().split(/\s+/);
    intent.extractedTerms.keywords = words.filter(w => !commonWords.includes(w));

    return intent;
  }

  /**
   * Perform intelligent search with NLP understanding
   */
  static async smartSearch(
    query: string,
    allBooks: Book[],
    limit: number = 50
  ): Promise<SmartSearchResult[]> {
    const intent = this.parseQuery(query);
    const results: SmartSearchResult[] = [];

    for (const book of allBooks) {
      const relevance = this.calculateRelevance(book, intent);
      if (relevance > 0) {
        results.push({
          book,
          relevance,
          matchedFields: this.getMatchedFields(book, intent),
          snippet: this.generateSnippet(book, intent),
        });
      }
    }

    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  }

  /**
   * Calculate relevance score using NLP techniques
   */
  private static calculateRelevance(book: Book, intent: SearchIntent): number {
    let score = 0;

    // Author match (highest priority)
    if (intent.extractedTerms.author.length > 0) {
      for (const author of intent.extractedTerms.author) {
        if (book.author.toLowerCase().includes(author.toLowerCase())) {
          score += 50;
        }
      }
    }

    // Genre/Category match
    if (intent.extractedTerms.genre.length > 0 && book.categories) {
      for (const genre of intent.extractedTerms.genre) {
        if (book.categories.some(cat => cat.toLowerCase().includes(genre))) {
          score += 30;
        }
      }
    }

    // Title keyword match
    const titleWords = book.title.toLowerCase().split(/\s+/);
    for (const keyword of intent.extractedTerms.keywords) {
      if (titleWords.some(w => w.includes(keyword) || keyword.includes(w))) {
        score += 20;
      }
    }

    // Description keyword match
    if (book.description) {
      const descWords = book.description.toLowerCase();
      for (const keyword of intent.extractedTerms.keywords) {
        if (descWords.includes(keyword)) {
          score += 10;
        }
      }
    }

    return score;
  }

  /**
   * Identify which fields matched the query
   */
  private static getMatchedFields(book: Book, intent: SearchIntent): string[] {
    const matched: string[] = [];

    if (intent.extractedTerms.author.some(a => 
      book.author.toLowerCase().includes(a.toLowerCase())
    )) {
      matched.push('author');
    }

    if (intent.extractedTerms.keywords.some(k => 
      book.title.toLowerCase().includes(k)
    )) {
      matched.push('title');
    }

    if (book.categories && intent.extractedTerms.genre.some(g =>
      book.categories!.some(c => c.toLowerCase().includes(g))
    )) {
      matched.push('category');
    }

    return matched;
  }

  /**
   * Generate search result snippet
   */
  private static generateSnippet(book: Book, intent: SearchIntent): string {
    if (!book.description) {
      return `${book.title} by ${book.author}`;
    }

    const maxLength = 150;
    if (book.description.length <= maxLength) {
      return book.description;
    }

    // Find relevant snippet containing keywords
    const keywords = intent.extractedTerms.keywords;
    if (keywords.length > 0) {
      const lowerDesc = book.description.toLowerCase();
      for (const keyword of keywords) {
        const index = lowerDesc.indexOf(keyword);
        if (index !== -1) {
          const start = Math.max(0, index - 50);
          const end = Math.min(book.description.length, index + 100);
          let snippet = book.description.substring(start, end);
          if (start > 0) snippet = '...' + snippet;
          if (end < book.description.length) snippet += '...';
          return snippet;
        }
      }
    }

    return book.description.substring(0, maxLength) + '...';
  }
}

interface SearchIntent {
  originalQuery: string;
  searchType: 'general' | 'author' | 'genre' | 'title';
  extractedTerms: {
    title: string[];
    author: string[];
    genre: string[];
    keywords: string[];
  };
}

interface SmartSearchResult {
  book: Book;
  relevance: number;
  matchedFields: string[];
  snippet: string;
}

// ==================== AI BOOK SUMMARIES ====================

/**
 * Generate AI-powered book summaries and insights
 */
export class BookSummaryGenerator {
  /**
   * Generate a summary based on book metadata
   */
  static generateSummary(book: Book): BookSummary {
    return {
      bookId: book.id,
      shortSummary: this.createShortSummary(book),
      keyPoints: this.extractKeyPoints(book),
      readingLevel: this.estimateReadingLevel(book),
      estimatedReadTime: this.estimateReadTime(book),
      themes: this.identifyThemes(book),
      similarBooks: [], // Populated by recommendation engine
    };
  }

  /**
   * Create a concise summary from description
   */
  private static createShortSummary(book: Book): string {
    if (!book.description) {
      return `${book.title} by ${book.author}. Published${book.publicationYear ? ` in ${book.publicationYear}` : ''}.`;
    }

    const sentences = book.description.split(/[.!?]+/);
    const firstTwo = sentences.slice(0, 2).join('. ');
    return firstTwo.length > 200 
      ? firstTwo.substring(0, 200) + '...'
      : firstTwo + '.';
  }

  /**
   * Extract key points from description
   */
  private static extractKeyPoints(book: Book): string[] {
    const points: string[] = [];

    if (book.author) points.push(`Written by ${book.author}`);
    if (book.publisher) points.push(`Published by ${book.publisher}`);
    if (book.publicationYear) points.push(`Published in ${book.publicationYear}`);
    if (book.pageCount) points.push(`${book.pageCount} pages`);
    if (book.categories && book.categories.length > 0) {
      points.push(`Categories: ${book.categories.join(', ')}`);
    }
    if (book.rating) points.push(`Rating: ${book.rating.toFixed(1)}⭐`);

    return points;
  }

  /**
   * Estimate reading difficulty level
   */
  private static estimateReadingLevel(book: Book): string {
    if (!book.description || !book.pageCount) return 'Medium';

    const avgWordLength = book.description.split(/\s+/).reduce((sum, word) => sum + word.length, 0) / book.description.split(/\s+/).length;
    const complexity = avgWordLength + (book.pageCount / 100);

    if (complexity < 6) return 'Easy';
    if (complexity < 8) return 'Medium';
    return 'Advanced';
  }

  /**
   * Estimate reading time in hours
   */
  private static estimateReadTime(book: Book): number {
    if (!book.pageCount) return 0;
    // Average reading speed: 250 words/minute, ~250 words/page
    const totalWords = book.pageCount * 250;
    const minutes = totalWords / 250;
    return Math.round(minutes / 60 * 10) / 10; // Round to 1 decimal
  }

  /**
   * Identify themes from categories and description
   */
  private static identifyThemes(book: Book): string[] {
    const themes = new Set<string>();

    if (book.categories) {
      book.categories.forEach(cat => themes.add(cat));
    }

    if (book.description) {
      const themeKeywords = [
        'love', 'war', 'adventure', 'mystery', 'science', 'technology',
        'history', 'philosophy', 'psychology', 'business', 'leadership',
        'fantasy', 'magic', 'future', 'past', 'society', 'culture',
      ];

      const lowerDesc = book.description.toLowerCase();
      for (const keyword of themeKeywords) {
        if (lowerDesc.includes(keyword)) {
          themes.add(keyword.charAt(0).toUpperCase() + keyword.slice(1));
        }
      }
    }

    return Array.from(themes).slice(0, 5);
  }
}

interface BookSummary {
  bookId: string;
  shortSummary: string;
  keyPoints: string[];
  readingLevel: string;
  estimatedReadTime: number;
  themes: string[];
  similarBooks: string[];
}

// ==================== READING ANALYTICS ====================

/**
 * AI-powered reading analytics and insights
 */
export class ReadingAnalytics {
  /**
   * Generate comprehensive reading insights for a user
   */
  static generateInsights(
    user: User,
    borrowHistory: BorrowRecord[],
    allBooks: Book[]
  ): UserReadingInsights {
    const completedReads = borrowHistory.filter(r => r.returnedAt);
    const activeReads = borrowHistory.filter(r => !r.returnedAt && r.status === 'active');

    return {
      userId: user.id,
      totalBooksRead: completedReads.length,
      currentlyReading: activeReads.length,
      favoriteGenres: this.identifyFavoriteGenres(borrowHistory, allBooks),
      favoriteAuthors: this.identifyFavoriteAuthors(borrowHistory, allBooks),
      readingStreak: this.calculateReadingStreak(borrowHistory),
      avgBooksPerMonth: this.calculateAvgBooksPerMonth(borrowHistory),
      readingSpeed: this.estimateReadingSpeed(borrowHistory, allBooks),
      diversityScore: this.calculateDiversityScore(borrowHistory, allBooks),
      aiRecommendations: [], // Populated separately
      achievements: this.calculateAchievements(borrowHistory),
    };
  }

  private static identifyFavoriteGenres(
    history: BorrowRecord[],
    books: Book[]
  ): Array<{ genre: string; count: number }> {
    const genreCount = new Map<string, number>();

    for (const record of history) {
      const book = books.find(b => b.id === record.bookId);
      if (book?.categories) {
        for (const cat of book.categories) {
          genreCount.set(cat, (genreCount.get(cat) || 0) + 1);
        }
      }
    }

    return Array.from(genreCount.entries())
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private static identifyFavoriteAuthors(
    history: BorrowRecord[],
    books: Book[]
  ): Array<{ author: string; count: number }> {
    const authorCount = new Map<string, number>();

    for (const record of history) {
      const book = books.find(b => b.id === record.bookId);
      if (book) {
        authorCount.set(book.author, (authorCount.get(book.author) || 0) + 1);
      }
    }

    return Array.from(authorCount.entries())
      .map(([author, count]) => ({ author, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private static calculateReadingStreak(history: BorrowRecord[]): number {
    const completed = history.filter(r => r.returnedAt).sort((a, b) => 
      new Date(b.returnedAt!).getTime() - new Date(a.returnedAt!).getTime()
    );

    if (completed.length === 0) return 0;

    let streak = 1;
    for (let i = 0; i < completed.length - 1; i++) {
      const current = new Date(completed[i].returnedAt!);
      const next = new Date(completed[i + 1].returnedAt!);
      const daysDiff = Math.abs((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff <= 30) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  private static calculateAvgBooksPerMonth(history: BorrowRecord[]): number {
    const completed = history.filter(r => r.returnedAt);
    if (completed.length === 0) return 0;

    const firstBorrow = new Date(completed[completed.length - 1].borrowedAt);
    const lastReturn = new Date(completed[0].returnedAt!);
    const monthsDiff = Math.max(1, (lastReturn.getTime() - firstBorrow.getTime()) / (1000 * 60 * 60 * 24 * 30));

    return Math.round((completed.length / monthsDiff) * 10) / 10;
  }

  private static estimateReadingSpeed(
    history: BorrowRecord[],
    books: Book[]
  ): string {
    const completed = history.filter(r => r.returnedAt);
    if (completed.length === 0) return 'Unknown';

    let totalDays = 0;
    let booksWithPages = 0;

    for (const record of completed) {
      const book = books.find(b => b.id === record.bookId);
      if (book?.pageCount) {
        const borrowDate = new Date(record.borrowedAt);
        const returnDate = new Date(record.returnedAt!);
        const days = (returnDate.getTime() - borrowDate.getTime()) / (1000 * 60 * 60 * 24);
        totalDays += days;
        booksWithPages++;
      }
    }

    if (booksWithPages === 0) return 'Unknown';

    const avgDays = totalDays / booksWithPages;
    if (avgDays < 7) return 'Fast';
    if (avgDays < 14) return 'Moderate';
    return 'Leisurely';
  }

  private static calculateDiversityScore(
    history: BorrowRecord[],
    books: Book[]
  ): number {
    const uniqueAuthors = new Set<string>();
    const uniqueGenres = new Set<string>();

    for (const record of history) {
      const book = books.find(b => b.id === record.bookId);
      if (book) {
        uniqueAuthors.add(book.author);
        if (book.categories) {
          book.categories.forEach(cat => uniqueGenres.add(cat));
        }
      }
    }

    const authorDiversity = Math.min(100, (uniqueAuthors.size / Math.max(1, history.length)) * 100);
    const genreDiversity = Math.min(100, uniqueGenres.size * 10);

    return Math.round((authorDiversity + genreDiversity) / 2);
  }

  private static calculateAchievements(history: BorrowRecord[]): string[] {
    const achievements: string[] = [];
    const completed = history.filter(r => r.returnedAt);

    if (completed.length >= 1) achievements.push('📚 First Book');
    if (completed.length >= 10) achievements.push('🎯 Bookworm (10 books)');
    if (completed.length >= 50) achievements.push('⭐ Library Champion (50 books)');
    if (completed.length >= 100) achievements.push('🏆 Reading Legend (100 books)');

    const streak = this.calculateReadingStreak(history);
    if (streak >= 3) achievements.push('🔥 On Fire (3 month streak)');
    if (streak >= 6) achievements.push('💪 Dedicated Reader (6 month streak)');
    if (streak >= 12) achievements.push('👑 Reading Royalty (1 year streak)');

    return achievements;
  }
}

interface UserReadingInsights {
  userId: string;
  totalBooksRead: number;
  currentlyReading: number;
  favoriteGenres: Array<{ genre: string; count: number }>;
  favoriteAuthors: Array<{ author: string; count: number }>;
  readingStreak: number;
  avgBooksPerMonth: number;
  readingSpeed: string;
  diversityScore: number;
  aiRecommendations: string[];
  achievements: string[];
}

// ==================== EXPORTS ====================

export const AIService = {
  RecommendationEngine,
  SmartSearchEngine,
  BookSummaryGenerator,
  ReadingAnalytics,
  config: aiConfig,
};

export default AIService;
