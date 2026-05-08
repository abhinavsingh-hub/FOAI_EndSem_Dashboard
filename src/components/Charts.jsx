import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Activity, PieChart as PieIcon } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658'];

export default function Charts() {
  const [speedData, setSpeedData] = useState([]);
  const [newsData, setNewsData] = useState([]);

  useEffect(() => {
    // Load initial speed history
    const loadSpeed = () => {
      const history = JSON.parse(localStorage.getItem('iss_speed_history') || '[]');
      setSpeedData(history);
    };
    
    // Load news distribution
    const loadNews = () => {
      const articles = JSON.parse(localStorage.getItem('cached_news') || '{"articles":[]}').articles || [];
      const sourceCount = {};
      articles.forEach(article => {
        const sourceName = article.source?.name || 'Unknown';
        sourceCount[sourceName] = (sourceCount[sourceName] || 0) + 1;
      });
      
      const formattedNewsData = Object.keys(sourceCount).map((key) => ({
        name: key,
        value: sourceCount[key]
      }));
      setNewsData(formattedNewsData);
    };

    loadSpeed();
    loadNews();

    // Listen to custom events
    window.addEventListener('iss_speed_update', loadSpeed);
    window.addEventListener('news_update', loadNews);

    return () => {
      window.removeEventListener('iss_speed_update', loadSpeed);
      window.removeEventListener('news_update', loadNews);
    };
  }, []);

  return (
    <div className="flex flex-col gap-8 h-full">
      {/* Speed Chart */}
      <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-4 flex-1 flex flex-col min-h-[300px]">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-red-500" />
          ISS Speed Trend
        </h2>
        <div className="flex-1 w-full relative">
          {speedData.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              Waiting for speed data... (calculating on next update)
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={speedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.2} />
                <XAxis dataKey="time" tick={{fontSize: 12}} />
                <YAxis domain={['auto', 'auto']} tick={{fontSize: 12}} width={45} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--popover-foreground))' }}
                />
                <Line type="monotone" dataKey="speed" stroke="#8884d8" strokeWidth={2} dot={false} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* News Distribution Chart */}
      <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-4 flex-1 flex flex-col min-h-[300px]">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <PieIcon className="h-5 w-5 text-green-500" />
          News Distribution
        </h2>
        <div className="flex-1 w-full relative">
          {newsData.length === 0 ? (
             <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              No news data available yet.
             </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={newsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {newsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--popover-foreground))' }}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }}/>
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
