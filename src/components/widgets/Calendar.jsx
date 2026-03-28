import React, { useState, useEffect } from 'react';
import { Widget } from '../Widget';

export const Calendar = () => {
  const [date, setDate] = useState(new Date());
  const [days, setDays] = useState([]);

  useEffect(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const calendarDays = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      calendarDays.push(i);
    }
    
    setDays(calendarDays);
    setDate(today);
  }, []);

  const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
  const today = new Date().getDate();

  return (
    <Widget title="Calendar" widgetType="calendar">
      <div className="flex flex-col gap-4">
        <div className="text-center font-semibold text-lg">{monthName}</div>
        
        <div className="grid grid-cols-7 gap-2 text-center text-xs text-gray-500 mb-2">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => (
            <div
              key={index}
              className={`p-2 text-center rounded text-sm font-semibold ${
                day === today
                  ? 'bg-blue-500 text-white'
                  : day
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'bg-transparent'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="text-xs text-gray-400 text-center mt-2">
          Today: {date.toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
      </div>
    </Widget>
  );
};
