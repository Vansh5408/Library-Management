# Google Books API Integration - Setup Guide

## Overview

Your library management system now features **Google Books API integration**, allowing users to search millions of books from Google's catalog and add them to your library. The integration is **already fully implemented** and works out of the box without an API key!

## Features

✅ **Search millions of books** from Google Books catalog  
✅ **Multiple search options**: by title, author, subject, or ISBN  
✅ **Rich book information**: covers, descriptions, page counts, categories  
✅ **Add to library**: Import external books directly into your collection  
✅ **No API key required** for basic usage (1,000 requests/day)  
✅ **Optional API key** for higher quotas (10,000 requests/day)

---

## Quick Start (No Setup Required!)

The Google Books API is **already working** in your application. Just start your server and frontend:

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Navigate to your user dashboard and you'll see the **"Search External Books"** tab where you can search Google Books!

---

## Optional: Get a Google Books API Key (For Higher Quota)

While the integration works without an API key, getting one is **free** and increases your daily quota from 1,000 to 10,000 requests.

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click **"Select a project"** → **"New Project"**
4. Enter a project name (e.g., "Library Management System")
5. Click **"Create"**

### Step 2: Enable Google Books API

1. In your new project, go to **"APIs & Services"** → **"Library"**
2. Search for **"Books API"**
3. Click on **"Books API"**
4. Click **"Enable"**

### Step 3: Create API Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** → **"API key"**
3. Your API key will be generated
4. **Important**: Click **"Restrict Key"** for security:
   - Under **"API restrictions"**, select **"Restrict key"**
   - Choose **"Books API"** from the dropdown
   - Click **"Save"**

### Step 4: Add API Key to Your Backend

1. Navigate to your backend folder:
   ```bash
   cd backend
   ```

2. Create a `.env` file (if it doesn't exist):
   ```bash
   cp .env.example .env
   ```

3. Open `.env` and add your API key:
   ```env
   # Google Books API Key
   GOOGLE_BOOKS_API_KEY=AIzaSyC_your_actual_api_key_here
   ```

4. Restart your backend server:
   ```bash
   npm run dev
   ```

**That's it!** Your application now uses the API key for higher request limits.

---

## How to Use in Your Application

### For End Users

1. **Login** to your library account
2. Navigate to the **User Dashboard**
3. Click on the **"Search External Books"** tab
4. Search for books using:
   - **Search query**: General book search
   - **Author name**: Find books by specific authors
   - **Subject**: Browse by category (Fiction, Science, History, etc.)
   - **ISBN**: Look up specific books by ISBN

5. Click on any book to view details
6. Click **"Add to Library"** to import it into your collection

### For Admins/Librarians

Admins can also access the external book search from their dashboard to quickly add new books to the library catalog.

---

## API Endpoints Available

Your backend exposes these endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/external-books/search` | GET | Search both Google Books and Open Library |
| `/api/external-books/search/google` | GET | Search Google Books only |
| `/api/external-books/search/openlibrary` | GET | Search Open Library only |
| `/api/external-books/isbn/:isbn` | GET | Get book details by ISBN |
| `/api/external-books/subjects` | GET | Get popular book subjects |

### Example API Calls

#### Search Books
```bash
curl "http://localhost:5000/api/external-books/search?query=javascript&page=1&pageSize=10"
```

#### Search by Author
```bash
curl "http://localhost:5000/api/external-books/search?author=Tolkien"
```

#### Search by ISBN
```bash
curl "http://localhost:5000/api/external-books/search?isbn=9780132350884"
```

#### Get Popular Subjects
```bash
curl "http://localhost:5000/api/external-books/subjects"
```

---

## Technical Details

### Backend Implementation

**Location**: `backend/src/controllers/externalBookController.ts`

Key features:
- ✅ Query sanitization to prevent injection attacks
- ✅ 10-second request timeout
- ✅ Pagination support
- ✅ Multiple search parameters
- ✅ Error handling and logging
- ✅ Response formatting

### Frontend Implementation

**Location**: `frontend/src/components/ExternalBookSearch.tsx`

Features:
- ✅ Beautiful, responsive UI
- ✅ Advanced search filters
- ✅ Book preview with covers
- ✅ One-click add to library
- ✅ Popular subjects browsing
- ✅ Pagination

---

## Quotas & Limits

### Without API Key
- **Daily requests**: 1,000
- **Sufficient for**: Small libraries, personal use

### With Free API Key
- **Daily requests**: 10,000
- **Sufficient for**: Medium to large libraries

### If You Need More
- Contact Google Cloud to request quota increase
- Typical response time: 2-3 business days
- Usually approved for legitimate library use

---

## Troubleshooting

### "Failed to search Google Books"

**Check:**
1. Internet connection is working
2. Backend server is running on port 5000
3. No firewall blocking external API calls

### "API quota exceeded"

**Solutions:**
1. Wait until tomorrow (quota resets daily)
2. Add an API key to increase quota
3. Request quota increase from Google

### "Invalid API key"

**Fixes:**
1. Verify API key is correctly copied to `.env`
2. Ensure Books API is enabled in Google Cloud Console
3. Check API key restrictions allow Books API

---

## Security Best Practices

### DO ✅
- Keep your API key in `.env` file only
- Never commit `.env` to version control
- Restrict API key to Books API only
- Use environment variables in production

### DON'T ❌
- Share your API key publicly
- Commit API key to GitHub
- Use API key in frontend code
- Expose API key in client-side requests

---

## Cost Information

✨ **Good news:** Google Books API is **completely FREE** for the quota levels mentioned above!

- No credit card required
- No hidden costs
- Free tier includes 10,000 requests/day with API key
- Google may charge only if you explicitly upgrade to paid tiers

---

## Status Check

To verify Google Books integration is working:

1. **Start both servers**:
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```

2. **Test the API directly**:
   ```bash
   curl "http://localhost:5000/api/external-books/search?query=programming&pageSize=5"
   ```

3. **Check in browser**:
   - Login to your application
   - Go to User Dashboard
   - Click "Search External Books" tab
   - Search for any book (e.g., "Harry Potter")

---

## Additional Resources

- [Google Books API Documentation](https://developers.google.com/books/docs/v1/using)
- [Google Cloud Console](https://console.cloud.google.com/)
- [API Key Best Practices](https://cloud.google.com/docs/authentication/api-keys)

---

## Support

If you encounter any issues:

1. Check backend console for error messages
2. Check browser console (F12) for frontend errors
3. Verify `.env` configuration
4. Ensure all dependencies are installed (`npm install`)
5. Try without API key first to isolate issues

---

**Last Updated**: February 12, 2026  
**Status**: ✅ Fully Implemented and Working
