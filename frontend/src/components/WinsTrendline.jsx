import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import './WinsTrendline.css';
import AISparkle from './AISparkle';
import './AISparkle.css';

function WinsTrendline({ data }) {
  if (!data || data.length === 0) {
    return null;
  }

  // Format week labels (e.g., "Oct 20" from "2025-10-20")
  const formattedData = data.map(week => {
    const date = new Date(week.weekStart);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();

    return {
      ...week,
      weekLabel: `${month} ${day}`,
      count: week.count
    };
  });

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="wins-tooltip">
          <p className="tooltip-label">Week of {data.weekLabel}</p>
          <p className="tooltip-value">
            {data.count} {data.count === 1 ? 'win' : 'wins'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="wins-trendline">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={formattedData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <defs>
            {/* Magenta-forward gradient matching send button (no blue) */}
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="40%" stopColor="#d946ef" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="weekLabel"
            tick={{ fontSize: 12, fill: '#666' }}
            stroke="#e0e0e0"
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#666' }}
            stroke="#e0e0e0"
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="count"
            stroke="url(#lineGradient)"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Memoize component to prevent re-renders when data hasn't changed
// Deep comparison of data array to avoid redrawing chart unnecessarily
export default React.memo(WinsTrendline, (prevProps, nextProps) => {
  // Compare data arrays for equality
  if (!prevProps.data && !nextProps.data) return true;
  if (!prevProps.data || !nextProps.data) return false;
  if (prevProps.data.length !== nextProps.data.length) return false;

  // Deep compare each data point
  return prevProps.data.every((item, index) => {
    const nextItem = nextProps.data[index];
    return item.weekStart === nextItem.weekStart &&
           item.count === nextItem.count;
  });
});
