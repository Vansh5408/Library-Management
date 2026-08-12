// Environment configuration for frontend-backend connection

// API Configuration
const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:5000/api',
    timeout: 10000,
  },
  production: {
    baseURL: 'https://your-api-domain.com/api',
    timeout: 10000,
  },
};

const environment = (import.meta.env.MODE || 'development') as keyof typeof API_CONFIG;
export const API_BASE_URL = API_CONFIG[environment].baseURL;
export const API_TIMEOUT = API_CONFIG[environment].timeout;

// API Endpoints
export const AUTH_ENDPOINTS = {
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  PROFILE: '/auth/profile',
};

export const BOOK_ENDPOINTS = {
  GET_ALL: '/books',
  GET_ONE: '/books/:id',
  GET_AVAILABLE: '/books/available',
  SEARCH: '/books/search',
  GET_STATS: '/books/stats',
  CREATE: '/books',
  UPDATE: '/books/:id',
  DELETE: '/books/:id',
};

export const BORROW_ENDPOINTS = {
  BORROW: '/borrows/borrow',
  RETURN: '/borrows/return',
  GET_ACTIVE: '/borrows/active',
  GET_HISTORY: '/borrows/history',
  GET_ALL: '/borrows/admin/all',
  PAY_FINE: '/borrows/pay-fine',
  GET_STATS: '/borrows/stats',
};

export const RESERVATION_ENDPOINTS = {
  RESERVE: '/reservations/reserve',
  MY_RESERVATIONS: '/reservations/my-reservations',
  CANCEL: '/reservations/cancel/:reservationId',
  GET_QUEUE: '/reservations/queue/:bookId',
  GET_ALL: '/reservations/admin/all',
};

export const LIBRARIAN_ENDPOINTS = {
  GET_ALL_USERS: '/librarian/users',
  SEARCH_USERS: '/librarian/users/search',
  GET_USER: '/librarian/users/:userId',
  ADD_BOOK: '/librarian/books',
  UPDATE_BOOK: '/librarian/books/:bookId',
  DELETE_BOOK: '/librarian/books/:bookId',
  GET_STATS: '/librarian/stats',
};

export const AI_ENDPOINTS = {
  RECOMMENDATIONS: '/ai/recommendations',
  SIMILAR_BOOKS: '/ai/similar',
  SMART_SEARCH: '/ai/smart-search',
  BOOK_SUMMARY: '/ai/summary',
  BATCH_SUMMARIES: '/ai/summaries/batch',
  USER_INSIGHTS: '/ai/insights',
  READING_TRENDS: '/ai/trends',
  CHATBOT: '/ai/chat',
};

// Helper Functions
export async function apiCall<T>(
  endpoint: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (typeof fetchOptions.headers === 'object' && fetchOptions.headers !== null && !Array.isArray(fetchOptions.headers)) {
    Object.assign(headers, fetchOptions.headers as Record<string, string>);
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data.message || data.error || 'API request failed';
    throw new Error(errorMessage);
  }

  return data;
}

// Auth API Calls

/**
 * Register a new user account
 * SECURITY: Only creates regular 'user' accounts
 * Admin/librarian accounts must be created via database seeding
 */
export async function registerUser(email: string, password: string, name: string) {
  return apiCall(AUTH_ENDPOINTS.REGISTER, {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
}

export async function loginUser(email: string, password: string) {
  return apiCall(AUTH_ENDPOINTS.LOGIN, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getProfile(token: string) {
  return apiCall(AUTH_ENDPOINTS.PROFILE, { token });
}

// Book API Calls
export async function getAllBooks() {
  return apiCall(BOOK_ENDPOINTS.GET_ALL);
}

export async function getBook(id: string) {
  return apiCall(BOOK_ENDPOINTS.GET_ONE.replace(':id', id));
}

export async function getAvailableBooks() {
  return apiCall(BOOK_ENDPOINTS.GET_AVAILABLE);
}

export async function searchBooks(query: string, filter?: string, sort?: string, page?: number, pageSize?: number) {
  let url = `${BOOK_ENDPOINTS.SEARCH}?`;
  if (query) url += `query=${encodeURIComponent(query)}&`;
  if (filter) url += `filter=${encodeURIComponent(filter)}&`;
  if (sort) url += `sort=${encodeURIComponent(sort)}&`;
  if (page) url += `page=${page}&`;
  if (pageSize) url += `pageSize=${pageSize}`;
  
  const response = await apiCall<{
    success: boolean;
    message: string;
    data: any;
    pagination?: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }>(url);

  const rawData = response.data;
  const isPaginatedObject = rawData && typeof rawData === 'object' && Array.isArray(rawData.books);
  const books = isPaginatedObject ? rawData.books : Array.isArray(rawData) ? rawData : [];
  const total = isPaginatedObject
    ? (rawData.total ?? books.length)
    : (response.pagination?.total ?? books.length);
  const resolvedPage = isPaginatedObject
    ? (rawData.page ?? page ?? 1)
    : (response.pagination?.page ?? page ?? 1);
  const resolvedTotalPages = isPaginatedObject
    ? (rawData.totalPages ?? Math.max(1, Math.ceil(total / (pageSize || 50))))
    : (response.pagination?.totalPages ?? Math.max(1, Math.ceil(total / (pageSize || 50))));
  
  // Return consistent structure
  return {
    ...response,
    data: {
      books,
      total,
      page: resolvedPage,
      totalPages: resolvedTotalPages,
    },
  };
}

export async function getBookStats() {
  return apiCall(BOOK_ENDPOINTS.GET_STATS);
}

// Borrow API Calls
export async function borrowBook(bookId: string, token: string) {
  return apiCall(BORROW_ENDPOINTS.BORROW, {
    method: 'POST',
    body: JSON.stringify({ bookId }),
    token,
  });
}

export async function returnBook(bookId: string, token: string) {
  return apiCall(BORROW_ENDPOINTS.RETURN, {
    method: 'POST',
    body: JSON.stringify({ bookId }),
    token,
  });
}

export async function getActiveBorrows(token: string) {
  return apiCall(BORROW_ENDPOINTS.GET_ACTIVE, { token });
}

export async function getBorrowHistory(token: string) {
  return apiCall(BORROW_ENDPOINTS.GET_HISTORY, { token });
}
// Book Management API Calls (Admin)
export async function createBook(
  title: string,
  author: string,
  isbn: string,
  description: string,
  totalCopies: number,
  token: string
) {
  return apiCall(BOOK_ENDPOINTS.CREATE, {
    method: 'POST',
    body: JSON.stringify({ title, author, isbn, description, totalCopies }),
    token,
  });
}

export async function updateBook(
  id: string,
  title: string,
  author: string,
  isbn: string,
  description: string,
  totalCopies: number,
  token: string
) {
  return apiCall(BOOK_ENDPOINTS.UPDATE.replace(':id', id), {
    method: 'PUT',
    body: JSON.stringify({ title, author, isbn, description, totalCopies }),
    token,
  });
}

export async function deleteBook(id: string, token: string) {
  return apiCall(BOOK_ENDPOINTS.DELETE.replace(':id', id), {
    method: 'DELETE',
    token,
  });
}

// Get all borrow records (Admin)
export async function getAllBorrowRecords(token: string) {
  return apiCall(BORROW_ENDPOINTS.GET_ALL, { token });
}

// Pay fine
export async function payFine(borrowRecordId: string, token: string) {
  return apiCall(BORROW_ENDPOINTS.PAY_FINE, {
    method: 'POST',
    body: JSON.stringify({ borrowRecordId }),
    token,
  });
}

// Get dashboard statistics
export async function getDashboardStats(token: string) {
  return apiCall(BORROW_ENDPOINTS.GET_STATS, { token });
}

// ==================== RESERVATION API CALLS ====================

// Reserve a book
export async function reserveBook(bookId: string, token: string) {
  return apiCall(RESERVATION_ENDPOINTS.RESERVE, {
    method: 'POST',
    body: JSON.stringify({ bookId }),
    token,
  });
}

// Get user's reservations
export async function getMyReservations(token: string) {
  return apiCall(RESERVATION_ENDPOINTS.MY_RESERVATIONS, { token });
}

// Cancel a reservation
export async function cancelReservation(reservationId: string, token: string) {
  return apiCall(RESERVATION_ENDPOINTS.CANCEL.replace(':reservationId', reservationId), {
    method: 'DELETE',
    token,
  });
}

// Get book queue
export async function getBookQueue(bookId: string) {
  return apiCall(RESERVATION_ENDPOINTS.GET_QUEUE.replace(':bookId', bookId));
}

// Admin: Get all reservations
export async function getAllReservations(token: string) {
  return apiCall(RESERVATION_ENDPOINTS.GET_ALL, { token });
}

// ==================== EXTERNAL BOOK SEARCH API CALLS ====================

export const EXTERNAL_BOOK_ENDPOINTS = {
  SEARCH: '/external-books/search',
  SEARCH_GOOGLE: '/external-books/search/google',
  SEARCH_OPENLIBRARY: '/external-books/search/openlibrary',
  GET_BY_ISBN: '/external-books/isbn',
  GET_SUBJECTS: '/external-books/subjects',
};

export interface ExternalBook {
  id: string;
  title: string;
  author: string;
  authors: string[];
  isbn: string;
  description: string;
  publishedDate: string;
  publisher: string;
  pageCount: number;
  categories: string[];
  thumbnail: string;
  language: string;
  previewLink: string;
  infoLink: string;
  source: 'google' | 'openlibrary';
}

export interface ExternalSearchResult {
  totalItems: number;
  books: ExternalBook[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface SearchParams {
  query?: string;
  author?: string;
  subject?: string;
  isbn?: string;
  page?: number;
  pageSize?: number;
  source?: 'all' | 'google' | 'openlibrary';
}

// Search external books (combined Google Books + Open Library)
export async function searchExternalBooks(params: SearchParams) {
  const searchParams = new URLSearchParams();
  if (params.query) searchParams.append('query', params.query);
  if (params.author) searchParams.append('author', params.author);
  if (params.subject) searchParams.append('subject', params.subject);
  if (params.isbn) searchParams.append('isbn', params.isbn);
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.pageSize) searchParams.append('pageSize', params.pageSize.toString());
  if (params.source) searchParams.append('source', params.source);
  
  return apiCall<{ success: boolean; message: string; data: ExternalSearchResult }>(
    `${EXTERNAL_BOOK_ENDPOINTS.SEARCH}?${searchParams.toString()}`
  );
}

// Search Google Books only
export async function searchGoogleBooks(params: SearchParams) {
  const searchParams = new URLSearchParams();
  if (params.query) searchParams.append('query', params.query);
  if (params.author) searchParams.append('author', params.author);
  if (params.subject) searchParams.append('subject', params.subject);
  if (params.isbn) searchParams.append('isbn', params.isbn);
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.pageSize) searchParams.append('pageSize', params.pageSize.toString());
  
  return apiCall<{ success: boolean; message: string; data: ExternalSearchResult }>(
    `${EXTERNAL_BOOK_ENDPOINTS.SEARCH_GOOGLE}?${searchParams.toString()}`
  );
}

// Search Open Library only
export async function searchOpenLibraryBooks(params: SearchParams) {
  const searchParams = new URLSearchParams();
  if (params.query) searchParams.append('query', params.query);
  if (params.author) searchParams.append('author', params.author);
  if (params.subject) searchParams.append('subject', params.subject);
  if (params.isbn) searchParams.append('isbn', params.isbn);
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.pageSize) searchParams.append('pageSize', params.pageSize.toString());
  
  return apiCall<{ success: boolean; message: string; data: ExternalSearchResult }>(
    `${EXTERNAL_BOOK_ENDPOINTS.SEARCH_OPENLIBRARY}?${searchParams.toString()}`
  );
}

// Get book by ISBN
export async function getExternalBookByISBN(isbn: string) {
  return apiCall<{ success: boolean; message: string; data: ExternalBook }>(
    `${EXTERNAL_BOOK_ENDPOINTS.GET_BY_ISBN}/${isbn}`
  );
}

// Get popular subjects
export async function getPopularSubjects() {
  return apiCall<{ success: boolean; message: string; data: { name: string; key: string; count: number }[] }>(
    EXTERNAL_BOOK_ENDPOINTS.GET_SUBJECTS
  );
}

// Librarian API Calls
export async function getAllUsers(token: string) {
  return apiCall(LIBRARIAN_ENDPOINTS.GET_ALL_USERS, { token });
}

export async function searchUsers(query: string, token: string) {
  return apiCall(`${LIBRARIAN_ENDPOINTS.SEARCH_USERS}?query=${encodeURIComponent(query)}`, { token });
}

export async function getUserDetails(userId: string, token: string) {
  return apiCall(LIBRARIAN_ENDPOINTS.GET_USER.replace(':userId', userId), { token });
}

export async function addNewBook(bookData: {
  title: string;
  author: string;
  isbn?: string;
  description?: string;
  totalCopies?: number;
  categories?: string[];
  publisher?: string;
  publicationYear?: number;
  pageCount?: number;
}, token: string) {
  return apiCall(LIBRARIAN_ENDPOINTS.ADD_BOOK, {
    method: 'POST',
    body: JSON.stringify(bookData),
    token,
  });
}

export async function updateExistingBook(bookId: string, bookData: Partial<{
  title: string;
  author: string;
  isbn: string;
  description: string;
  totalCopies: number;
  categories: string[];
  publisher: string;
  publicationYear: number;
  pageCount: number;
}>, token: string) {
  return apiCall(LIBRARIAN_ENDPOINTS.UPDATE_BOOK.replace(':bookId', bookId), {
    method: 'PUT',
    body: JSON.stringify(bookData),
    token,
  });
}

export async function deleteBookById(bookId: string, token: string) {
  return apiCall(LIBRARIAN_ENDPOINTS.DELETE_BOOK.replace(':bookId', bookId), {
    method: 'DELETE',
    token,
  });
}

export async function getLibraryStats(token: string) {
  return apiCall(LIBRARIAN_ENDPOINTS.GET_STATS, { token });
}

// ==================== AI API CALLS ====================

// Get personalized AI recommendations
export async function getAIRecommendations(limit: number = 10, token: string) {
  return apiCall(`${AI_ENDPOINTS.RECOMMENDATIONS}?limit=${limit}`, { token });
}

// Get similar books
export async function getSimilarBooks(bookId: string, limit: number = 5) {
  return apiCall(`${AI_ENDPOINTS.SIMILAR_BOOKS}/${bookId}?limit=${limit}`);
}

// Smart NLP search
export async function smartSearch(query: string, limit: number = 50) {
  return apiCall(`${AI_ENDPOINTS.SMART_SEARCH}?query=${encodeURIComponent(query)}&limit=${limit}`);
}

// Get AI book summary
export async function getBookSummary(bookId: string) {
  return apiCall(`${AI_ENDPOINTS.BOOK_SUMMARY}/${bookId}`);
}

// Get batch book summaries
export async function getBatchBookSummaries(bookIds: string[]) {
  return apiCall(AI_ENDPOINTS.BATCH_SUMMARIES, {
    method: 'POST',
    body: JSON.stringify({ bookIds }),
  });
}

// Get user reading insights
export async function getUserReadingInsights(token: string) {
  return apiCall(AI_ENDPOINTS.USER_INSIGHTS, { token });
}

// Get reading trends
export async function getReadingTrends() {
  return apiCall(AI_ENDPOINTS.READING_TRENDS);
}

// Chat with AI assistant
export async function chatWithAI(message: string, conversationId?: string) {
  return apiCall(AI_ENDPOINTS.CHATBOT, {
    method: 'POST',
    body: JSON.stringify({ message, conversationId }),
  });
}