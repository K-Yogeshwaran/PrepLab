import React, { useState } from 'react';

/**
 * ActivityHeatmap component renders a GitHub/LeetCode style contribution grid
 * built strictly from real Supabase daily activity data.
 */
export default function ActivityHeatmap({ dailyMap = {}, weeksToShow = 14 }) {
  const [selectedDay, setSelectedDay] = useState(null);

  // Generate date grid for the last `weeksToShow` weeks ending today
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sun, 6 = Sat
  
  // End on the upcoming Saturday to complete the grid week
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + (6 - dayOfWeek));

  const totalDays = weeksToShow * 7;
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - totalDays + 1);

  const days = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayNum = String(currentDate.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${dayNum}`;

    const isFuture = currentDate > today;
    const dayData = dailyMap[dateKey] || null;

    days.push({
      dateKey,
      date: new Date(currentDate),
      formattedDate: currentDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      isFuture,
      isToday: dateKey === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
      intensity: dayData ? dayData.intensity : 0,
      data: dayData,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Get intensity color class
  const getIntensityClass = (intensity, isFuture) => {
    if (isFuture) return 'bg-slate-50 border-transparent opacity-40 cursor-not-allowed';
    switch (intensity) {
      case 1:
        return 'bg-brand-200 border-brand-300';
      case 2:
        return 'bg-brand-400 border-brand-500';
      case 3:
        return 'bg-brand-600 border-brand-700';
      case 4:
        return 'bg-brand-800 border-brand-900';
      default:
        return 'bg-slate-100 border-slate-200/60 hover:border-slate-300';
    }
  };

  return (
    <div className="space-y-3">
      {/* Heatmap Grid Container */}
      <div className="overflow-x-auto pb-1">
        <div className="inline-grid grid-rows-7 grid-flow-col gap-1.5 min-w-full">
          {days.map((day) => {
            const hasData = Boolean(day.data && day.data.questionsCount > 0);
            const isSelected = selectedDay?.dateKey === day.dateKey;

            return (
              <button
                key={day.dateKey}
                type="button"
                disabled={day.isFuture}
                onClick={() => {
                  if (!day.isFuture) {
                    setSelectedDay(isSelected ? null : day);
                  }
                }}
                onMouseEnter={() => {
                  if (!day.isFuture && hasData) {
                    setSelectedDay(day);
                  }
                }}
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-xs border transition-all cursor-pointer relative group ${getIntensityClass(
                  day.intensity,
                  day.isFuture
                )} ${day.isToday ? 'ring-2 ring-slate-900 ring-offset-1' : ''}`}
                aria-label={`${day.formattedDate}: ${
                  hasData ? `${day.data.questionsCount} questions` : 'No activity'
                }`}
              >
                {/* Desktop Hover Tooltip */}
                {hasData && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-30 pointer-events-none">
                    <div className="bg-slate-900 text-white text-[11px] font-mono rounded-lg py-1.5 px-2.5 whitespace-nowrap shadow-md border border-slate-800 space-y-0.5">
                      <div className="font-bold text-slate-200">{day.formattedDate}</div>
                      <div className="text-brand-300 font-semibold">
                        {day.data.drillsCount} {day.data.drillsCount === 1 ? 'drill' : 'drills'} &middot; {day.data.questionsCount} Qs
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {day.data.accuracy}% accuracy &middot; {day.data.avgTimeSeconds}s / q
                      </div>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend & Selected Day Detail Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
        {/* Selected Day Details display for touch & click */}
        {selectedDay && selectedDay.data ? (
          <div className="font-mono text-[11px] text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80 flex items-center space-x-3">
            <span className="font-bold text-slate-900">{selectedDay.formattedDate}:</span>
            <span>{selectedDay.data.drillsCount} drills</span>
            <span>&middot;</span>
            <span>{selectedDay.data.questionsCount} questions</span>
            <span>&middot;</span>
            <span className="font-bold text-emerald-600">{selectedDay.data.accuracy}% acc</span>
            <span>&middot;</span>
            <span>{selectedDay.data.avgTimeSeconds}s/q</span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-400">
            Hover or tap a day to view details
          </span>
        )}

        {/* Intensity Legend */}
        <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 font-medium">
          <span>Less</span>
          <div className="w-3 h-3 rounded-xs bg-slate-100 border border-slate-200" />
          <div className="w-3 h-3 rounded-xs bg-brand-200 border border-brand-300" />
          <div className="w-3 h-3 rounded-xs bg-brand-400 border border-brand-500" />
          <div className="w-3 h-3 rounded-xs bg-brand-600 border border-brand-700" />
          <div className="w-3 h-3 rounded-xs bg-brand-800 border border-brand-900" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
