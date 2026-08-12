import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PARTITIONS_DIR = path.join(__dirname, '../database/partitions');
const PARTITION_SIZE = 10000;

// Book categories
const categories = [
  'Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Mystery', 'Thriller',
  'Romance', 'Horror', 'Biography', 'History', 'Science', 'Technology',
  'Self-Help', 'Philosophy', 'Psychology', 'Business', 'Economics', 'Politics',
  'Art', 'Music', 'Poetry', 'Drama', 'Children', 'Young Adult', 'Comics',
  'Travel', 'Cooking', 'Health', 'Religion', 'Sports', 'Education', 'Reference',
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Engineering',
  'Medicine', 'Law', 'Architecture', 'Photography', 'Crafts', 'Gardening'
];

// Famous authors and common names
const authors = [
  'William Shakespeare', 'Jane Austen', 'Charles Dickens', 'Mark Twain', 'Ernest Hemingway',
  'F. Scott Fitzgerald', 'Virginia Woolf', 'James Joyce', 'George Orwell', 'Aldous Huxley',
  'Leo Tolstoy', 'Fyodor Dostoevsky', 'Franz Kafka', 'Gabriel García Márquez', 'Jorge Luis Borges',
  'Haruki Murakami', 'Salman Rushdie', 'Toni Morrison', 'Maya Angelou', 'Stephen King',
  'J.K. Rowling', 'Dan Brown', 'John Grisham', 'Michael Crichton', 'Isaac Asimov',
  'Arthur C. Clarke', 'Philip K. Dick', 'Ray Bradbury', 'Ursula K. Le Guin', 'Neil Gaiman',
  'Terry Pratchett', 'Douglas Adams', 'Agatha Christie', 'Arthur Conan Doyle', 'Edgar Allan Poe',
  'H.P. Lovecraft', 'Oscar Wilde', 'Emily Brontë', 'Charlotte Brontë', 'Thomas Hardy',
  'Herman Melville', 'Nathaniel Hawthorne', 'Henry James', 'Edith Wharton', 'Jack London',
  'John Steinbeck', 'William Faulkner', 'Cormac McCarthy', 'Don DeLillo', 'Thomas Pynchon',
  'Kurt Vonnegut', 'Joseph Heller', 'Ken Kesey', 'Hunter S. Thompson', 'Tom Wolfe',
  'Truman Capote', 'Harper Lee', 'J.D. Salinger', 'Sylvia Plath', 'Anne Frank',
  'Paulo Coelho', 'Khaled Hosseini', 'Chimamanda Ngozi Adichie', 'Arundhati Roy', 'Vikram Seth',
  'R.K. Narayan', 'Rabindranath Tagore', 'Premchand', 'Ruskin Bond', 'Amish Tripathi',
  'Chetan Bhagat', 'Jhumpa Lahiri', 'Kiran Desai', 'Anita Desai', 'Shashi Tharoor'
];

// Title words for generating book titles
const titleAdjectives = [
  'The', 'A', 'An', 'Lost', 'Hidden', 'Secret', 'Ancient', 'Modern', 'Dark', 'Bright',
  'Silent', 'Eternal', 'Infinite', 'Sacred', 'Forgotten', 'Last', 'First', 'Final',
  'Golden', 'Silver', 'Crystal', 'Diamond', 'Ruby', 'Emerald', 'Sapphire', 'Midnight',
  'Crimson', 'Azure', 'Mystic', 'Divine', 'Royal', 'Noble', 'Brave', 'Wild', 'Free'
];

const titleNouns = [
  'Kingdom', 'Empire', 'World', 'Universe', 'Galaxy', 'Star', 'Moon', 'Sun', 'Sky',
  'Ocean', 'Mountain', 'Forest', 'Desert', 'River', 'Valley', 'Island', 'City', 'Tower',
  'Castle', 'Palace', 'Temple', 'Garden', 'Road', 'Path', 'Journey', 'Quest', 'Adventure',
  'Mystery', 'Secret', 'Legend', 'Myth', 'Tale', 'Story', 'Chronicle', 'Saga', 'Epic',
  'Dream', 'Vision', 'Shadow', 'Light', 'Fire', 'Ice', 'Wind', 'Storm', 'Thunder',
  'Dragon', 'Phoenix', 'Wolf', 'Lion', 'Eagle', 'Serpent', 'Knight', 'Warrior', 'King',
  'Queen', 'Prince', 'Princess', 'Wizard', 'Witch', 'Prophet', 'Oracle', 'Guardian',
  'Heart', 'Soul', 'Mind', 'Spirit', 'Blood', 'Bone', 'Stone', 'Sword', 'Crown', 'Ring'
];

const titleSuffixes = [
  'of Destiny', 'of Fate', 'of Time', 'of Ages', 'of Eternity', 'of Dreams', 'of Shadows',
  'of Light', 'of Darkness', 'of Fire', 'of Ice', 'of Blood', 'of Kings', 'of Queens',
  'of Dragons', 'of Magic', 'of Power', 'of Glory', 'of Honor', 'of Truth', 'of Lies',
  'Awakening', 'Rising', 'Falling', 'Ascending', 'Descending', 'Returning', 'Beginning',
  'Ending', 'Continues', 'Reborn', 'Unleashed', 'Revealed', 'Discovered', 'Forgotten',
  '', '', '', '', '' // Empty strings for variety
];

// Publishers
const publishers = [
  'Penguin Random House', 'HarperCollins', 'Simon & Schuster', 'Hachette Book Group',
  'Macmillan Publishers', 'Scholastic', 'Pearson Education', 'McGraw-Hill Education',
  'Wiley', 'Oxford University Press', 'Cambridge University Press', 'MIT Press',
  'Springer Nature', 'Elsevier', 'Taylor & Francis', 'SAGE Publications',
  'Bloomsbury Publishing', 'Vintage Books', 'Anchor Books', 'Knopf Doubleday',
  'Little, Brown and Company', 'Grand Central Publishing', 'Atria Books', 'Gallery Books',
  'Tor Books', 'Del Rey', 'Ace Books', 'DAW Books', 'Baen Books', 'Orbit Books',
  'Rupa Publications', 'Westland Publications', 'Juggernaut Books', 'Aleph Book Company',
  'Speaking Tiger', 'HarperCollins India', 'Penguin India', 'Pan Macmillan India'
];

// Description templates
const descriptionTemplates = [
  'An unforgettable journey through {theme} that will captivate readers from the first page to the last.',
  'A masterfully crafted {genre} that explores the depths of {theme} with stunning prose and vivid imagery.',
  'In this {genre} masterpiece, {author} takes us on a compelling exploration of {theme}.',
  'A thought-provoking examination of {theme} that challenges our understanding of {genre}.',
  'This {genre} novel weaves together elements of {theme} into a tapestry of unforgettable storytelling.',
  'A groundbreaking work that redefines {genre} while exploring profound themes of {theme}.',
  '{author} delivers a powerful narrative about {theme} in this acclaimed {genre} novel.',
  'An epic tale of {theme} that spans generations and continents in this sweeping {genre} saga.',
  'A intimate portrait of {theme} told through the lens of {genre} with remarkable insight.',
  'This {genre} gem offers a fresh perspective on {theme} with memorable characters and gripping plot.',
  'A critically acclaimed exploration of {theme} that has earned praise from readers worldwide.',
  'In this stunning {genre} debut, discover a world where {theme} takes center stage.',
  'A beautifully written {genre} that illuminates the complexities of {theme} with grace and power.',
  'This {genre} classic continues to resonate with readers through its timeless exploration of {theme}.',
  'A must-read {genre} that tackles {theme} with both sensitivity and unflinching honesty.'
];

const themes = [
  'love and loss', 'identity and belonging', 'power and corruption', 'hope and despair',
  'family and legacy', 'friendship and betrayal', 'justice and revenge', 'faith and doubt',
  'freedom and oppression', 'life and death', 'truth and deception', 'courage and fear',
  'ambition and sacrifice', 'tradition and change', 'nature and technology', 'war and peace',
  'wealth and poverty', 'youth and aging', 'memory and forgetting', 'dreams and reality'
];

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateISBN(index: number): string {
  const prefix = '978';
  const group = Math.floor(Math.random() * 2) === 0 ? '0' : '1';
  const publisher = String(Math.floor(Math.random() * 90000) + 10000).padStart(5, '0');
  const title = String(index % 1000).padStart(3, '0');
  const checkDigit = Math.floor(Math.random() * 10);
  return `${prefix}-${group}-${publisher}-${title}-${checkDigit}`;
}

function generateTitle(): string {
  const adj = randomElement(titleAdjectives);
  const noun = randomElement(titleNouns);
  const suffix = randomElement(titleSuffixes);
  
  if (suffix) {
    return `${adj} ${noun} ${suffix}`.trim();
  }
  return `${adj} ${noun}`;
}

function generateDescription(author: string, category: string): string {
  const template = randomElement(descriptionTemplates);
  const theme = randomElement(themes);
  
  return template
    .replace('{author}', author)
    .replace('{genre}', category.toLowerCase())
    .replace('{theme}', theme)
    .replace('{genre}', category.toLowerCase())
    .replace('{theme}', theme);
}

function generateBook(index: number): any {
  const author = randomElement(authors);
  const category = randomElement(categories);
  const totalCopies = Math.floor(Math.random() * 10) + 1;
  const availableCopies = Math.floor(Math.random() * (totalCopies + 1));
  const year = Math.floor(Math.random() * 125) + 1900; // 1900-2025
  
  return {
    id: uuidv4(),
    title: generateTitle(),
    author,
    isbn: generateISBN(index),
    description: generateDescription(author, category),
    available: availableCopies > 0,
    totalCopies,
    availableCopies,
    borrowedBy: [],
    createdAt: new Date(year, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
    publisher: randomElement(publishers),
    publicationYear: year,
    pageCount: Math.floor(Math.random() * 800) + 100,
    categories: [category, ...(Math.random() > 0.5 ? [randomElement(categories)] : [])].filter((v, i, a) => a.indexOf(v) === i),
    coverImage: `https://picsum.photos/seed/${index}/200/300`,
    rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0 to 5.0
  };
}

function savePartition(partitionId: string, books: any[]): void {
  const partitionPath = path.join(PARTITIONS_DIR, `${partitionId}.json`);
  const partition = { books, lastIndex: books.length };
  fs.writeFileSync(partitionPath, JSON.stringify(partition, null, 2));
  console.log(`  ✓ Saved ${partitionId} with ${books.length} books`);
}

function saveMetadata(metadata: any[]): void {
  const metadataPath = path.join(PARTITIONS_DIR, 'metadata.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
}

async function seedBooks(totalBooks: number = 100000): Promise<void> {
  console.log(`\n📚 Starting to generate ${totalBooks.toLocaleString()} books...\n`);
  
  // Ensure partitions directory exists
  if (!fs.existsSync(PARTITIONS_DIR)) {
    fs.mkdirSync(PARTITIONS_DIR, { recursive: true });
  }
  
  const metadata: any[] = [];
  let currentPartition: any[] = [];
  let partitionIndex = 0;
  let startId = '';
  
  const startTime = Date.now();
  
  for (let i = 0; i < totalBooks; i++) {
    const book = generateBook(i);
    
    if (currentPartition.length === 0) {
      startId = book.id;
    }
    
    currentPartition.push(book);
    
    // Save partition when it reaches PARTITION_SIZE or at the end
    if (currentPartition.length >= PARTITION_SIZE || i === totalBooks - 1) {
      const partitionId = `partition_${partitionIndex}`;
      
      savePartition(partitionId, currentPartition);
      
      metadata.push({
        partitionId,
        startId,
        endId: book.id,
        totalBooks: currentPartition.length,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      });
      
      currentPartition = [];
      partitionIndex++;
    }
    
    // Progress update every 10000 books
    if ((i + 1) % 10000 === 0) {
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = Math.round((i + 1) / elapsed);
      console.log(`  📖 Generated ${(i + 1).toLocaleString()} books (${rate} books/sec)`);
    }
  }
  
  // Save metadata
  saveMetadata(metadata);
  
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log(`\n✅ Successfully generated ${totalBooks.toLocaleString()} books!`);
  console.log(`📁 Created ${metadata.length} partitions`);
  console.log(`⏱️  Total time: ${totalTime} seconds`);
  console.log(`📍 Location: ${PARTITIONS_DIR}\n`);
}

// Run the seeder
const bookCount = parseInt(process.argv[2]) || 100000;
seedBooks(bookCount).catch(console.error);
