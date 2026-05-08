import React, { useState, useEffect } from 'react';
import { Newspaper, Search, RefreshCw, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export default function NewsDashboard() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date'); // 'date' or 'source'

  const fetchNews = async (forceRefetch = false) => {
    try {
      setLoading(true);
      
      const cached = localStorage.getItem('cached_news');
      if (!forceRefetch && cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL) {
          setArticles(parsed.articles);
          setLoading(false);
          window.dispatchEvent(new Event('news_update'));
          return;
        }
      }

      // We use the proxy route to bypass NewsAPI localhost restriction on production
      const isDev = import.meta.env.DEV;
      const apiKey = import.meta.env.VITE_NEWS_API_KEY || '8daff9232c69400a835243d301f540de';
      const url = isDev 
        ? `https://newsapi.org/v2/top-headlines?country=us&pageSize=20&apiKey=${apiKey}` 
        : '/api/news?endpoint=top-headlines&country=us&pageSize=20';
        
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === 'ok') {
        const validArticles = data.articles.filter(a => a.title && a.title !== '[Removed]');
        const top10 = validArticles.slice(0, 10); // Show 10 max
        setArticles(top10);
        localStorage.setItem('cached_news', JSON.stringify({
          timestamp: Date.now(),
          articles: top10
        }));
        window.dispatchEvent(new Event('news_update'));
        if (forceRefetch) toast.success('News updated!');
      } else {
        toast.error('Failed to fetch news: ' + (data.message || 'Unknown error'));
      }
    } catch (e) {
      toast.error('Failed to connect to News API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // Filter and Sort
  let filtered = articles.filter(a => 
    (a.title || '').toLowerCase().includes(search.toLowerCase()) || 
    (a.description || '').toLowerCase().includes(search.toLowerCase())
  );

  if (sortBy === 'date') {
    filtered.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  } else if (sortBy === 'source') {
    filtered.sort((a, b) => (a.source?.name || '').localeCompare(b.source?.name || ''));
  }

  return (
    <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/30">
        <h2 className="text-xl font-bold flex items-center gap-2 whitespace-nowrap">
          <Newspaper className="h-5 w-5 text-purple-500" />
          Latest News
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search news..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background border border-border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div className="flex gap-2">
            <div className="relative">
              <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-background border border-border rounded-md pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="date">Sort by Date</option>
                <option value="source">Sort by Source</option>
              </select>
            </div>
            
            <button 
              onClick={() => fetchNews(true)}
              disabled={loading}
              className="p-2 border border-border bg-background rounded-md hover:bg-accent hover:text-accent-foreground transition disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {loading && articles.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse flex flex-col gap-4 border border-border rounded-lg p-4">
                <div className="bg-muted h-40 rounded-md"></div>
                <div className="bg-muted h-6 rounded w-3/4"></div>
                <div className="bg-muted h-4 rounded w-full"></div>
                <div className="bg-muted h-4 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No articles found. Try adjusting your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((article, idx) => (
              <div key={idx} className="flex flex-col border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-background group">
                <div className="h-48 overflow-hidden relative bg-muted">
                  {article.urlToImage ? (
                    <img 
                      src={article.urlToImage} 
                      alt={article.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/400x200?text=No+Image' }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
                  )}
                  <div className="absolute top-2 right-2 bg-background/90 backdrop-blur px-2 py-1 rounded text-xs font-medium">
                    {article.source?.name}
                  </div>
                </div>
                
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-lg leading-tight mb-2 line-clamp-2" title={article.title}>
                    {article.title}
                  </h3>
                  
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3 flex-1">
                    {article.description || "No description available for this article."}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                    <div className="text-xs text-muted-foreground">
                      <span className="block truncate max-w-[120px]" title={article.author}>
                        {article.author ? `By ${article.author}` : 'Unknown Author'}
                      </span>
                      <span>
                        {article.publishedAt ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true }) : ''}
                      </span>
                    </div>
                    
                    <a 
                      href={article.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:text-blue-500 transition-colors"
                    >
                      Read More &rarr;
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
