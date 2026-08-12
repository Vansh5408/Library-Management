# Google Books API - Quick Reference

## 🚀 It Already Works!

The Google Books integration is **fully functional** without any setup. Just start your servers:

```bash
# Backend (Terminal 1)
cd backend
npm run dev

# Frontend (Terminal 2)  
cd frontend
npm run dev
```

Then go to **User Dashboard → "Search External Books"** tab.

---

## 📈 Want Higher Quota? (Optional)

### Get Free API Key (2 minutes)

1. **Visit**: https://console.cloud.google.com/
2. **Create** a new project
3. **Enable** "Books API" 
4. **Create** an API key
5. **Add to** `backend/.env`:
   ```env
   GOOGLE_BOOKS_API_KEY=your_key_here
   ```
6. **Restart** backend

### Quotas

| Type | Daily Limit |
|------|-------------|
| Without key | 1,000 requests |
| With key (free) | 10,000 requests |

---

## 🔍 How to Use

### Search Options
- **Query**: General search (title, content)
- **Author**: Find books by author name
- **Subject**: Browse categories (Fiction, Science, etc.)
- **ISBN**: Lookup specific book

### Add Books to Library
1. Search for a book
2. Click on the book card
3. Click "Add to Library"
4. Book is now in your catalog!

---

## 🛠️ API Endpoints

```bash
# Search all sources
curl "localhost:5000/api/external-books/search?query=python"

# Google Books only
curl "localhost:5000/api/external-books/search/google?author=Tolkien"

# By ISBN
curl "localhost:5000/api/external-books/isbn/9780140283334"

# Popular subjects
curl "localhost:5000/api/external-books/subjects"
```

---

## ✅ Quick Test

```bash
# Test if it's working
curl "http://localhost:5000/api/external-books/search?query=javascript&pageSize=5"
```

Should return JSON with book results!

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `backend/src/controllers/externalBookController.ts` | API logic |
| `backend/src/routes/externalBookRoutes.ts` | Routes |
| `frontend/src/components/ExternalBookSearch.tsx` | UI component |
| `frontend/src/api/apiClient.ts` | API client |
| `backend/.env` | Configuration (API key) |

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Not seeing search tab | Check ExternalBookSearch is imported |
| API errors | Check backend is running on port 5000 |
| Quota exceeded | Add API key or wait 24 hours |
| Invalid API key | Verify Books API is enabled |

---

## 💡 Tips

- **No key needed** for testing and small libraries
- **API key is free** - no credit card required
- **10,000 requests/day** is plenty for most libraries
- **Restrict your key** to Books API only for security

---

See **GOOGLE_BOOKS_SETUP.md** for detailed instructions!
