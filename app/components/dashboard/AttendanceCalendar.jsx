import React from 'react';

export default function AttendanceCalendar() {
  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  
  // Generating exact layout from image for February
  const dates = [
    [1, 2, 3, 4, 5, 6, 7],
    [8, 9, 10, 11, 12, 13, 14],
    [15, 16, 17, 18, 19, 20, 21],
    [22, 23, 24, 25, 26, 27, 28]
  ];

  return (
    <div className="bg-white rounded-[2.5rem] p-8 h-full shadow-sm border border-gray-200 flex flex-col items-center justify-center min-h-[340px]">
      <div className="w-full max-w-sm">
        <h3 className="text-center text-red-600 font-bold uppercase tracking-[0.1em] mb-8 text-[15px]">
          FEBRUARY
        </h3>
        
        <div className="grid grid-cols-7 gap-4 mb-6 text-center border-b border-gray-100 pb-4">
          {daysOfWeek.map((day, idx) => (
            <span key={idx} className={`text-sm font-bold ${idx === 0 ? 'text-red-500' : 'text-slate-500'}`}>
              {day}
            </span>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-y-7 gap-x-4 text-center">
          {dates.flat().map((date, idx) => {
            const isSunday = idx % 7 === 0;
            return (
              <div 
                key={date} 
                className={`text-[17px] font-semibold ${isSunday ? 'text-red-500' : 'text-[#004475]'}`}
              >
                {date}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
