import { Request, Response } from 'express';
import { ApiResponse } from '../models/types.js';

// External Book interface for API responses
interface ExternalBook {
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

interface SearchResult {
  totalItems: number;
  books: ExternalBook[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Search books using Google Books API
export async function searchGoogleBooks(req: Request, res: Response): Promise<void> {
  try {
    const { query, author, subject, isbn, page = '1', pageSize = '40' } = req.query;

    if (!query && !author && !subject && !isbn) {
      res.status(400).json({
        success: false,
        message: 'At least one search parameter is required (query, author, subject, or isbn)',
      } as ApiResponse<null>);
      return;
    }

    // Sanitize inputs to prevent injection attacks
    const sanitizeParam = (param: any) => {
      if (typeof param !== 'string') return '';
      return String(param).trim().substring(0, 200);
    };

    // Build Google Books API query with sanitized inputs
    let searchQuery = '';
    if (query) searchQuery += sanitizeParam(query);
    if (author) searchQuery += `+inauthor:${sanitizeParam(author)}`;
    if (subject) searchQuery += `+subject:${sanitizeParam(subject)}`;
    if (isbn) searchQuery += `+isbn:${sanitizeParam(isbn)}`;

    const startIndex = Math.max(0, (parseInt(page as string) - 1) * parseInt(pageSize as string));
    const maxResults = Math.min(Math.max(1, parseInt(pageSize as string)), 40); // Google Books API max is 40

    // Build API URL with optional API key for higher quotas
    let apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&startIndex=${startIndex}&maxResults=${maxResults}&printType=books`;
    
    // Add API key if available (increases quota from 1,000 to 10,000 requests/day)
    if (process.env.GOOGLE_BOOKS_API_KEY) {
      apiUrl += `&key=${process.env.GOOGLE_BOOKS_API_KEY}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(apiUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      const data: any = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch from Google Books API');
      }

    const books: ExternalBook[] = (data.items || []).map((item: any) => ({
      id: item.id,
      title: item.volumeInfo?.title || 'Unknown Title',
      author: (item.volumeInfo?.authors || ['Unknown Author']).join(', '),
      authors: item.volumeInfo?.authors || ['Unknown Author'],
      isbn: getISBN(item.volumeInfo?.industryIdentifiers),
      description: item.volumeInfo?.description || 'No description available',
      publishedDate: item.volumeInfo?.publishedDate || 'Unknown',
      publisher: item.volumeInfo?.publisher || 'Unknown Publisher',
      pageCount: item.volumeInfo?.pageCount || 0,
      categories: item.volumeInfo?.categories || [],
      thumbnail: item.volumeInfo?.imageLinks?.thumbnail || item.volumeInfo?.imageLinks?.smallThumbnail || '',
      language: item.volumeInfo?.language || 'en',
      previewLink: item.volumeInfo?.previewLink || '',
      infoLink: item.volumeInfo?.infoLink || '',
      source: 'google' as const,
    }));

    const result: SearchResult = {
      totalItems: data.totalItems || 0,
      books,
      page: parseInt(page as string),
      pageSize: maxResults,
      hasMore: startIndex + books.length < (data.totalItems || 0),
    };

      res.status(200).json({
        success: true,
        message: `Found ${data.totalItems || 0} books`,
        data: result,
      } as ApiResponse<SearchResult>);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if ((fetchError as Error).name === 'AbortError') {
        throw new Error('Request timeout - external API took too long to respond');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Google Books API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search Google Books',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

// Search books using Open Library API
export async function searchOpenLibrary(req: Request, res: Response): Promise<void> {
  try {
    const { query, author, subject, isbn, page = '1', pageSize = '40' } = req.query;

    if (!query && !author && !subject && !isbn) {
      res.status(400).json({
        success: false,
        message: 'At least one search parameter is required (query, author, subject, or isbn)',
      } as ApiResponse<null>);
      return;
    }

    let apiUrl = '';
    const limit = Math.min(parseInt(pageSize as string), 100);
    const offset = (parseInt(page as string) - 1) * limit;

    if (isbn) {
      // Search by ISBN
      apiUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
    } else if (subject) {
      // Search by subject
      apiUrl = `https://openlibrary.org/subjects/${encodeURIComponent((subject as string).toLowerCase().replace(/\s+/g, '_'))}.json?limit=${limit}&offset=${offset}`;
    } else if (author) {
      // Search by author
      apiUrl = `https://openlibrary.org/search.json?author=${encodeURIComponent(author as string)}&limit=${limit}&offset=${offset}`;
    } else {
      // General search
      let searchQuery = query as string;
      apiUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}&limit=${limit}&offset=${offset}`;
    }

    const response = await fetch(apiUrl);
    const data: any = await response.json();

    if (!response.ok) {
      throw new Error('Failed to fetch from Open Library API');
    }

    let books: ExternalBook[] = [];
    let totalItems = 0;

    if (isbn) {
      // Handle ISBN response format
      const key = `ISBN:${isbn}`;
      if (data[key]) {
        const book = data[key];
        books = [{
          id: key,
          title: book.title || 'Unknown Title',
          author: (book.authors || []).map((a: any) => a.name).join(', ') || 'Unknown Author',
          authors: (book.authors || []).map((a: any) => a.name),
          isbn: isbn as string,
          description: book.notes || book.excerpts?.[0]?.text || 'No description available',
          publishedDate: book.publish_date || 'Unknown',
          publisher: (book.publishers || []).map((p: any) => p.name).join(', ') || 'Unknown Publisher',
          pageCount: book.number_of_pages || 0,
          categories: (book.subjects || []).map((s: any) => s.name),
          thumbnail: book.cover?.medium || book.cover?.small || '',
          language: 'en',
          previewLink: book.url || '',
          infoLink: book.url || '',
          source: 'openlibrary' as const,
        }];
        totalItems = 1;
      }
    } else if (subject) {
      // Handle subject response format
      books = (data.works || []).map((work: any) => ({
        id: work.key,
        title: work.title || 'Unknown Title',
        author: (work.authors || []).map((a: any) => a.name).join(', ') || 'Unknown Author',
        authors: (work.authors || []).map((a: any) => a.name),
        isbn: '',
        description: work.description?.value || work.description || 'No description available',
        publishedDate: work.first_publish_year?.toString() || 'Unknown',
        publisher: 'Unknown Publisher',
        pageCount: 0,
        categories: [subject as string],
        thumbnail: work.cover_id ? `https://covers.openlibrary.org/b/id/${work.cover_id}-M.jpg` : '',
        language: 'en',
        previewLink: `https://openlibrary.org${work.key}`,
        infoLink: `https://openlibrary.org${work.key}`,
        source: 'openlibrary' as const,
      }));
      totalItems = data.work_count || books.length;
    } else {
      // Handle search response format
      books = (data.docs || []).map((doc: any) => ({
        id: doc.key,
        title: doc.title || 'Unknown Title',
        author: (doc.author_name || ['Unknown Author']).join(', '),
        authors: doc.author_name || ['Unknown Author'],
        isbn: (doc.isbn || [])[0] || '',
        description: doc.first_sentence?.join(' ') || 'No description available',
        publishedDate: doc.first_publish_year?.toString() || 'Unknown',
        publisher: (doc.publisher || ['Unknown Publisher'])[0],
        pageCount: doc.number_of_pages_median || 0,
        categories: doc.subject?.slice(0, 5) || [],
        thumbnail: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : '',
        language: (doc.language || ['en'])[0],
        previewLink: `https://openlibrary.org${doc.key}`,
        infoLink: `https://openlibrary.org${doc.key}`,
        source: 'openlibrary' as const,
      }));
      totalItems = data.numFound || books.length;
    }

    const result: SearchResult = {
      totalItems,
      books,
      page: parseInt(page as string),
      pageSize: limit,
      hasMore: offset + books.length < totalItems,
    };

    res.status(200).json({
      success: true,
      message: `Found ${totalItems} books`,
      data: result,
    } as ApiResponse<SearchResult>);
  } catch (error) {
    console.error('Open Library API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search Open Library',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

// Combined search from both APIs
export async function searchAllBooks(req: Request, res: Response): Promise<void> {
  try {
    const { query, author, subject, isbn, page = '1', pageSize = '20', source = 'all' } = req.query;

    if (!query && !author && !subject && !isbn) {
      res.status(400).json({
        success: false,
        message: 'At least one search parameter is required (query, author, subject, or isbn)',
      } as ApiResponse<null>);
      return;
    }

    const limit = Math.min(parseInt(pageSize as string), 40);
    const pageNum = parseInt(page as string);

    let googleBooks: ExternalBook[] = [];
    let openLibraryBooks: ExternalBook[] = [];
    let googleTotal = 0;
    let openLibraryTotal = 0;

    // Fetch from both APIs in parallel
    const promises: Promise<any>[] = [];

    if (source === 'all' || source === 'google') {
      // Build Google Books API query
      let googleQuery = '';
      if (query) googleQuery += query;
      if (author) googleQuery += `+inauthor:${author}`;
      if (subject) googleQuery += `+subject:${subject}`;
      if (isbn) googleQuery += `+isbn:${isbn}`;

      const googleStartIndex = (pageNum - 1) * Math.floor(limit / 2);
      const googleUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(googleQuery)}&startIndex=${googleStartIndex}&maxResults=${Math.floor(limit / 2)}&printType=books`;

      promises.push(
        fetch(googleUrl)
          .then(r => r.json())
          .then((data: any) => {
            googleTotal = data.totalItems || 0;
            googleBooks = (data.items || []).map((item: any) => ({
              id: `google_${item.id}`,
              title: item.volumeInfo?.title || 'Unknown Title',
              author: (item.volumeInfo?.authors || ['Unknown Author']).join(', '),
              authors: item.volumeInfo?.authors || ['Unknown Author'],
              isbn: getISBN(item.volumeInfo?.industryIdentifiers),
              description: item.volumeInfo?.description || 'No description available',
              publishedDate: item.volumeInfo?.publishedDate || 'Unknown',
              publisher: item.volumeInfo?.publisher || 'Unknown Publisher',
              pageCount: item.volumeInfo?.pageCount || 0,
              categories: item.volumeInfo?.categories || [],
              thumbnail: item.volumeInfo?.imageLinks?.thumbnail?.replace('http:', 'https:') || '',
              language: item.volumeInfo?.language || 'en',
              previewLink: item.volumeInfo?.previewLink || '',
              infoLink: item.volumeInfo?.infoLink || '',
              source: 'google' as const,
            }));
          })
          .catch(err => {
            console.error('Google Books error:', err);
          })
      );
    }

    if (source === 'all' || source === 'openlibrary') {
      let openLibraryUrl = '';
      const olLimit = Math.floor(limit / 2);
      const olOffset = (pageNum - 1) * olLimit;

      if (subject) {
        openLibraryUrl = `https://openlibrary.org/subjects/${encodeURIComponent((subject as string).toLowerCase().replace(/\s+/g, '_'))}.json?limit=${olLimit}&offset=${olOffset}`;
      } else if (author) {
        openLibraryUrl = `https://openlibrary.org/search.json?author=${encodeURIComponent(author as string)}&limit=${olLimit}&offset=${olOffset}`;
      } else {
        const searchQ = query || isbn || '';
        openLibraryUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(searchQ as string)}&limit=${olLimit}&offset=${olOffset}`;
      }

      promises.push(
        fetch(openLibraryUrl)
          .then(r => r.json())
          .then((data: any) => {
            if (subject && data.works) {
              openLibraryTotal = data.work_count || 0;
              openLibraryBooks = (data.works || []).map((work: any) => ({
                id: `ol_${work.key}`,
                title: work.title || 'Unknown Title',
                author: (work.authors || []).map((a: any) => a.name).join(', ') || 'Unknown Author',
                authors: (work.authors || []).map((a: any) => a.name),
                isbn: '',
                description: work.description?.value || work.description || 'No description available',
                publishedDate: work.first_publish_year?.toString() || 'Unknown',
                publisher: 'Unknown Publisher',
                pageCount: 0,
                categories: [subject as string],
                thumbnail: work.cover_id ? `https://covers.openlibrary.org/b/id/${work.cover_id}-M.jpg` : '',
                language: 'en',
                previewLink: `https://openlibrary.org${work.key}`,
                infoLink: `https://openlibrary.org${work.key}`,
                source: 'openlibrary' as const,
              }));
            } else {
              openLibraryTotal = data.numFound || 0;
              openLibraryBooks = (data.docs || []).map((doc: any) => ({
                id: `ol_${doc.key}`,
                title: doc.title || 'Unknown Title',
                author: (doc.author_name || ['Unknown Author']).join(', '),
                authors: doc.author_name || ['Unknown Author'],
                isbn: (doc.isbn || [])[0] || '',
                description: doc.first_sentence?.join(' ') || 'No description available',
                publishedDate: doc.first_publish_year?.toString() || 'Unknown',
                publisher: (doc.publisher || ['Unknown Publisher'])[0],
                pageCount: doc.number_of_pages_median || 0,
                categories: doc.subject?.slice(0, 5) || [],
                thumbnail: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : '',
                language: (doc.language || ['en'])[0],
                previewLink: `https://openlibrary.org${doc.key}`,
                infoLink: `https://openlibrary.org${doc.key}`,
                source: 'openlibrary' as const,
              }));
            }
          })
          .catch(err => {
            console.error('Open Library error:', err);
          })
      );
    }

    await Promise.all(promises);

    // Combine and deduplicate results by ISBN and title
    const bookMap = new Map<string, ExternalBook>();
    
    // Add Google Books first (usually higher quality metadata)
    googleBooks.forEach(book => {
      const key = book.isbn || book.title.toLowerCase();
      if (!bookMap.has(key)) {
        bookMap.set(key, book);
      }
    });
    
    // Add Open Library books if not already present
    openLibraryBooks.forEach(book => {
      const key = book.isbn || book.title.toLowerCase();
      if (!bookMap.has(key)) {
        bookMap.set(key, book);
      }
    });
    
    const allBooks = Array.from(bookMap.values());
    // Don't add totals together due to duplicates
    const totalItems = Math.max(googleTotal, openLibraryTotal);

    // Calculate if there are more pages
    // If we got less books than requested, it might be due to deduplication
    // So check based on the total available items from the APIs
    const currentOffset = (pageNum - 1) * limit;
    const estimatedNextOffset = currentOffset + limit;
    const hasMore = estimatedNextOffset < totalItems;

    const result: SearchResult = {
      totalItems,
      books: allBooks,
      page: pageNum,
      pageSize: limit,
      hasMore,
    };

    res.status(200).json({
      success: true,
      message: `Found ${totalItems} books from external sources`,
      data: result,
    } as ApiResponse<SearchResult>);
  } catch (error) {
    console.error('Combined search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search external book APIs',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

// Get book details by ISBN from external APIs
export async function getBookByISBN(req: Request, res: Response): Promise<void> {
  try {
    const { isbn } = req.params;

    if (!isbn) {
      res.status(400).json({
        success: false,
        message: 'ISBN is required',
      } as ApiResponse<null>);
      return;
    }

    // Try Google Books first
    const googleUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
    const googleResponse = await fetch(googleUrl);
    const googleData = await googleResponse.json() as { items?: any[] };

    if (googleData.items && googleData.items.length > 0) {
      const item = googleData.items[0];
      const book: ExternalBook = {
        id: item.id,
        title: item.volumeInfo?.title || 'Unknown Title',
        author: (item.volumeInfo?.authors || ['Unknown Author']).join(', '),
        authors: item.volumeInfo?.authors || ['Unknown Author'],
        isbn: isbn,
        description: item.volumeInfo?.description || 'No description available',
        publishedDate: item.volumeInfo?.publishedDate || 'Unknown',
        publisher: item.volumeInfo?.publisher || 'Unknown Publisher',
        pageCount: item.volumeInfo?.pageCount || 0,
        categories: item.volumeInfo?.categories || [],
        thumbnail: item.volumeInfo?.imageLinks?.thumbnail?.replace('http:', 'https:') || '',
        language: item.volumeInfo?.language || 'en',
        previewLink: item.volumeInfo?.previewLink || '',
        infoLink: item.volumeInfo?.infoLink || '',
        source: 'google',
      };

      res.status(200).json({
        success: true,
        message: 'Book found',
        data: book,
      } as ApiResponse<ExternalBook>);
      return;
    }

    // Fallback to Open Library
    const olUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
    const olResponse = await fetch(olUrl);
    const olData = await olResponse.json() as Record<string, any>;

    const key = `ISBN:${isbn}`;
    if (olData[key]) {
      const book = olData[key];
      const result: ExternalBook = {
        id: key,
        title: book.title || 'Unknown Title',
        author: (book.authors || []).map((a: any) => a.name).join(', ') || 'Unknown Author',
        authors: (book.authors || []).map((a: any) => a.name),
        isbn: isbn,
        description: book.notes || 'No description available',
        publishedDate: book.publish_date || 'Unknown',
        publisher: (book.publishers || []).map((p: any) => p.name).join(', ') || 'Unknown Publisher',
        pageCount: book.number_of_pages || 0,
        categories: (book.subjects || []).map((s: any) => s.name),
        thumbnail: book.cover?.medium || book.cover?.small || '',
        language: 'en',
        previewLink: book.url || '',
        infoLink: book.url || '',
        source: 'openlibrary',
      };

      res.status(200).json({
        success: true,
        message: 'Book found',
        data: result,
      } as ApiResponse<ExternalBook>);
      return;
    }

    res.status(404).json({
      success: false,
      message: 'Book not found with this ISBN',
    } as ApiResponse<null>);
  } catch (error) {
    console.error('ISBN lookup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch book by ISBN',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

// Get popular subjects/categories
export async function getPopularSubjects(req: Request, res: Response): Promise<void> {
  const subjects = [
    { name: 'Fiction', key: 'fiction', count: 500000 },
    { name: 'Science Fiction', key: 'science_fiction', count: 150000 },
    { name: 'Fantasy', key: 'fantasy', count: 120000 },
    { name: 'Romance', key: 'romance', count: 200000 },
    { name: 'Mystery', key: 'mystery', count: 180000 },
    { name: 'Thriller', key: 'thriller', count: 100000 },
    { name: 'Horror', key: 'horror', count: 80000 },
    { name: 'History', key: 'history', count: 300000 },
    { name: 'Biography', key: 'biography', count: 250000 },
    { name: 'Science', key: 'science', count: 400000 },
    { name: 'Technology', key: 'technology', count: 150000 },
    { name: 'Programming', key: 'programming', count: 100000 },
    { name: 'Java', key: 'java', count: 50000 },
    { name: 'Python', key: 'python', count: 40000 },
    { name: 'JavaScript', key: 'javascript', count: 35000 },
    { name: 'Web Development', key: 'web_development', count: 60000 },
    { name: 'Machine Learning', key: 'machine_learning', count: 30000 },
    { name: 'Data Science', key: 'data_science', count: 25000 },
    { name: 'Philosophy', key: 'philosophy', count: 150000 },
    { name: 'Psychology', key: 'psychology', count: 200000 },
    { name: 'Self Help', key: 'self_help', count: 100000 },
    { name: 'Business', key: 'business', count: 180000 },
    { name: 'Economics', key: 'economics', count: 120000 },
    { name: 'Art', key: 'art', count: 200000 },
    { name: 'Music', key: 'music', count: 150000 },
    { name: 'Cooking', key: 'cooking', count: 100000 },
    { name: 'Travel', key: 'travel', count: 80000 },
    { name: 'Children', key: 'children', count: 300000 },
    { name: 'Young Adult', key: 'young_adult', count: 150000 },
    { name: 'Comics', key: 'comics', count: 50000 },
    { name: 'Poetry', key: 'poetry', count: 100000 },
    { name: 'Religion', key: 'religion', count: 200000 },
    { name: 'Hinduism', key: 'hinduism', count: 50000 },
    { name: 'Indian Literature', key: 'indian_literature', count: 80000 },
    { name: 'Hindi', key: 'hindi', count: 40000 },
  ];

  res.status(200).json({
    success: true,
    message: 'Popular subjects retrieved',
    data: subjects,
  });
}

// Helper function to extract ISBN
function getISBN(identifiers: any[]): string {
  if (!identifiers) return '';
  const isbn13 = identifiers.find((id: any) => id.type === 'ISBN_13');
  const isbn10 = identifiers.find((id: any) => id.type === 'ISBN_10');
  return isbn13?.identifier || isbn10?.identifier || '';
}
