import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Book data for generating 1000 books
const categories = [
  'Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Mystery', 
  'Romance', 'Thriller', 'Horror', 'Biography', 'History',
  'Science', 'Technology', 'Self-Help', 'Business', 'Philosophy',
  'Poetry', 'Drama', 'Adventure', 'Children', 'Young Adult'
];

const authors = [
  'James Patterson', 'Stephen King', 'J.K. Rowling', 'Dan Brown', 'John Grisham',
  'Agatha Christie', 'Paulo Coelho', 'George Orwell', 'Jane Austen', 'Mark Twain',
  'Ernest Hemingway', 'F. Scott Fitzgerald', 'Harper Lee', 'Leo Tolstoy', 'Charles Dickens',
  'Virginia Woolf', 'Gabriel García Márquez', 'Haruki Murakami', 'Neil Gaiman', 'Terry Pratchett',
  'Isaac Asimov', 'Arthur C. Clarke', 'Philip K. Dick', 'Ray Bradbury', 'Ursula K. Le Guin',
  'Margaret Atwood', 'Toni Morrison', 'Maya Angelou', 'Chimamanda Ngozi Adichie', 'Khaled Hosseini',
  'Malcolm Gladwell', 'Yuval Noah Harari', 'Michelle Obama', 'Walter Isaacson', 'Bill Bryson',
  'Richard Dawkins', 'Carl Sagan', 'Stephen Hawking', 'Neil deGrasse Tyson', 'Michio Kaku'
];

const publishers = [
  'Penguin Random House', 'HarperCollins', 'Simon & Schuster', 'Hachette Book Group',
  'Macmillan Publishers', 'Scholastic', 'Wiley', "O'Reilly Media", 'Oxford University Press',
  'Cambridge University Press', 'Bloomsbury', 'Little, Brown and Company', 'Vintage Books'
];

const titlePrefixes = [
  'The', 'A', 'An', 'Beyond', 'Into', 'Under', 'Over', 'Through', 'Across', 'Between',
  'Within', 'Without', 'Before', 'After', 'During', 'Against', 'Among', 'Around'
];

const titleNouns = [
  'Shadow', 'Light', 'Fire', 'Water', 'Earth', 'Wind', 'Storm', 'Thunder', 'Lightning',
  'Mountain', 'River', 'Ocean', 'Forest', 'Desert', 'Valley', 'Sky', 'Star', 'Moon', 'Sun',
  'Kingdom', 'Empire', 'Dynasty', 'Legacy', 'Destiny', 'Fate', 'Fortune', 'Mystery', 'Secret',
  'Truth', 'Lie', 'Dream', 'Nightmare', 'Vision', 'Memory', 'Journey', 'Quest', 'Adventure',
  'Battle', 'War', 'Peace', 'Love', 'Heart', 'Soul', 'Mind', 'Spirit', 'Code', 'Algorithm',
  'Network', 'System', 'Protocol', 'Framework', 'Pattern', 'Design', 'Architecture'
];

const titleSuffixes = [
  'Chronicles', 'Tales', 'Stories', 'Saga', 'Legend', 'Myth', 'History', 'Guide',
  'Manual', 'Handbook', 'Encyclopedia', 'Collection', 'Anthology', 'Series', 'Volume',
  'Edition', 'Companion', 'Journey', 'Adventures', 'Memoirs'
];

function generateISBN(): string {
  const prefix = '978';
  const group = Math.floor(Math.random() * 2);
  const publisher = Math.floor(Math.random() * 90000) + 10000;
  const title = Math.floor(Math.random() * 900) + 100;
  const check = Math.floor(Math.random() * 10);
  return `${prefix}-${group}-${publisher}-${title}-${check}`;
}

function generateTitle(): string {
  const usePrefix = Math.random() > 0.3;
  const useSuffix = Math.random() > 0.6;
  
  let title = '';
  
  if (usePrefix) {
    title += titlePrefixes[Math.floor(Math.random() * titlePrefixes.length)] + ' ';
  }
  
  title += titleNouns[Math.floor(Math.random() * titleNouns.length)];
  
  if (Math.random() > 0.5) {
    title += ' of ' + titleNouns[Math.floor(Math.random() * titleNouns.length)];
  }
  
  if (useSuffix) {
    title += ': ' + titleSuffixes[Math.floor(Math.random() * titleSuffixes.length)];
  }
  
  return title;
}

function generateDescription(title: string, author: string, category: string): string {
  const descriptions = [
    `A captivating ${category.toLowerCase()} masterpiece by ${author}. ${title} takes readers on an unforgettable journey.`,
    `${author}'s ${title} is a thought-provoking exploration of ${category.toLowerCase()} themes that will leave you breathless.`,
    `Dive into ${title}, a brilliant ${category.toLowerCase()} work that showcases ${author}'s exceptional storytelling abilities.`,
    `${title} by ${author} is an essential ${category.toLowerCase()} read that has captivated millions of readers worldwide.`,
    `Experience the magic of ${title}, where ${author} weaves a tale of wonder in the ${category.toLowerCase()} genre.`
  ];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

function generateBook(id: number) {
  const title = generateTitle();
  const author = authors[Math.floor(Math.random() * authors.length)];
  const category = categories[Math.floor(Math.random() * categories.length)];
  const totalCopies = Math.floor(Math.random() * 5) + 1;
  const publicationYear = Math.floor(Math.random() * 75) + 1950;
  
  return {
    id: `book_${id}`,
    title,
    author,
    isbn: generateISBN(),
    description: generateDescription(title, author, category),
    available: true,
    totalCopies,
    availableCopies: totalCopies,
    borrowedBy: [],
    createdAt: new Date().toISOString(),
    pageCount: Math.floor(Math.random() * 500) + 100,
    publicationYear,
    publisher: publishers[Math.floor(Math.random() * publishers.length)],
    categories: [category],
    rating: Math.round((Math.random() * 2 + 3) * 10) / 10 // Rating between 3.0 and 5.0
  };
}

async function seedBooks() {
  console.log('🚀 Starting to seed 1000 books...\n');
  
  const libraryPath = path.join(__dirname, '../database/library.json');
  
  // Read existing data
  let data;
  try {
    const content = fs.readFileSync(libraryPath, 'utf-8');
    data = JSON.parse(content);
  } catch (error) {
    data = { users: [], books: [], borrowRecords: [], reservations: [] };
  }
  
  // Keep existing users but replace books
  const existingUsers = data.users || [];
  const existingBorrowRecords = data.borrowRecords || [];
  const existingReservations = data.reservations || [];
  
  // Generate 1000 books
  const books = [];
  const usedTitles = new Set();
  
  for (let i = 1; i <= 1000; i++) {
    let book = generateBook(i);
    
    // Ensure unique titles
    while (usedTitles.has(book.title)) {
      book = generateBook(i);
    }
    usedTitles.add(book.title);
    
    books.push(book);
    
    if (i % 100 === 0) {
      console.log(`📚 Generated ${i} books...`);
    }
  }
  
  // Save to library.json
  const newData = {
    users: existingUsers,
    books: books,
    borrowRecords: existingBorrowRecords,
    reservations: existingReservations
  };
  
  fs.writeFileSync(libraryPath, JSON.stringify(newData, null, 2));
  
  console.log('\n✅ Successfully seeded 1000 books!');
  console.log(`📖 Total books in library: ${books.length}`);
  console.log(`👥 Existing users preserved: ${existingUsers.length}`);
  console.log(`📁 Data saved to: ${libraryPath}`);
}

seedBooks().catch(console.error);
