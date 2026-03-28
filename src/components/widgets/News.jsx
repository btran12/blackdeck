import React, { useState, useEffect } from 'react';
import { Widget } from '../Widget';

export const News = ({ apiKey }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!apiKey) {
      setError('API key not configured');
      setLoading(false);
      return;
    }

    const fetchNews = async () => {
      try {
        setLoading(true);
        const url = `https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch news');
        }
        
        const data = await response.json();
        setArticles(data.articles?.slice(0, 5) || []);
        setError(null);
      } catch (err) {
        setError(err.message);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
    const interval = setInterval(fetchNews, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [apiKey]);

  return (
    <Widget title="Top Headlines">
      {loading && <div className="text-gray-400">Loading news...</div>}
      {error && <div className="text-red-400 text-sm">{error}</div>}
      {!loading && !error && (
        <div className="space-y-4">
          {articles.length === 0 ? (
            <div className="text-gray-400">No articles found</div>
          ) : (
            articles.map((article, index) => (
              <div key={index} className="border-l-2 border-blue-500 pl-3 pb-3">
                <h3 className="text-sm font-semibold line-clamp-2 mb-1">{article.title}</h3>
                <p className="text-xs text-gray-400 line-clamp-2 mb-2">{article.description}</p>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>{article.source.name}</span>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Read →
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </Widget>
  );
};
