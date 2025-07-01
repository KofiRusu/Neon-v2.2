'use client';

import { useState } from 'react';

interface CalendarEvent {
  id: string;
  title: string;
  platform: string;
  time: string;
  status: 'scheduled' | 'published' | 'draft';
}

export function SocialCalendar(): JSX.Element {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Mock events - in a real app, this would come from your data source
  const events: CalendarEvent[] = [
    {
      id: '1',
      title: 'New Product Launch Post',
      platform: 'Instagram',
      time: '2:00 PM',
      status: 'scheduled',
    },
    {
      id: '2',
      title: 'Weekly Newsletter Promo',
      platform: 'Twitter',
      time: '10:00 AM',
      status: 'published',
    },
    {
      id: '3',
      title: 'Behind the Scenes Story',
      platform: 'LinkedIn',
      time: '4:30 PM',
      status: 'draft',
    },
  ];

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  return (
    <div className="w-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-neutral-200">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() =>
              setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
            }
            className="p-2 text-neutral-400 hover:text-white transition-colors"
          >
            ←
          </button>
          <button
            onClick={() =>
              setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
            }
            className="p-2 text-neutral-400 hover:text-white transition-colors"
          >
            →
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-neutral-400">
            {day}
          </div>
        ))}

        {/* Empty days */}
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="p-2 h-16"></div>
        ))}

        {/* Month days */}
        {days.map(day => {
          const dayEvents = events.filter(
            _event =>
              // Mock filter - in real app, you'd filter by actual date
              day === 15 || day === 20 || day === 25
          );

          return (
            <div
              key={day}
              className="p-2 h-16 border border-neutral-800 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <div className="text-sm text-neutral-300 mb-1">{day}</div>
              {dayEvents.length > 0 && (
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map(event => (
                    <div
                      key={event.id}
                      className={`text-xs px-2 py-1 rounded text-white ${
                        event.status === 'scheduled'
                          ? 'bg-blue-600'
                          : event.status === 'published'
                            ? 'bg-green-600'
                            : 'bg-yellow-600'
                      }`}
                    >
                      {event.title.substring(0, 10)}...
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-neutral-500">+{dayEvents.length - 2} more</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Upcoming Events */}
      <div className="mt-6">
        <h4 className="text-md font-medium text-neutral-200 mb-3">Upcoming Posts</h4>
        <div className="space-y-2">
          {events.slice(0, 3).map(event => (
            <div
              key={event.id}
              className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg"
            >
              <div>
                <p className="text-sm font-medium text-neutral-200">{event.title}</p>
                <p className="text-xs text-neutral-400">
                  {event.platform} • {event.time}
                </p>
              </div>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  event.status === 'scheduled'
                    ? 'bg-blue-600 text-white'
                    : event.status === 'published'
                      ? 'bg-green-600 text-white'
                      : 'bg-yellow-600 text-black'
                }`}
              >
                {event.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
