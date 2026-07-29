'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectAuthUser } from '../../../store/slices/authSlice';
import {
  Calendar, Clock, CheckCircle, Upload, MapPin, Search, Plus, User, FileText, ChevronRight, Send,
  ArrowRight, Download, Ticket, AlertCircle, Sun, Cloud, Droplets, Thermometer,
  MoreVertical, Check, X, Megaphone, Users, UserCheck, Banknote, CalendarCheck, FileOutput, Plane
} from 'lucide-react';
import { Person } from '@mui/icons-material';

const QUOTES = [
  { text: "The best way to predict the future is to invent it.", author: "Alan Kay" },
  { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
  { text: "Software is a great combination of artistry and engineering.", author: "Bill Gates" },
  { text: "The science of today is the technology of tomorrow.", author: "Edward Teller" },
  { text: "Quality is never an accident; it is always the result of intelligent effort.", author: "John Ruskin" },
  { text: "Technology is best when it brings people together.", author: "Matt Mullenweg" },
  { text: "The advance of technology is based on making it fit in so that you don't really even notice it.", author: "Bill Gates" },
  { text: "The greatest asset of a company is its people.", author: "Jorge Paulo Lemann" },
  { text: "Coming together is a beginning, staying together is progress, and working together is success.", author: "Henry Ford" },
  { text: "Without continual growth and progress, words such as improvement and success have no meaning.", author: "Benjamin Franklin" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "Continuous improvement is better than delayed perfection.", author: "Mark Twain" },
  { text: "Excellence is not a skill, it's an attitude.", author: "Ralph Marston" },
  { text: "The strength of the team is each individual member. The strength of each member is the team.", author: "Phil Jackson" },
  { text: "Great things in business are never done by one person. They're done by a team of people.", author: "Steve Jobs" },
  { text: "Every accomplishment starts with the decision to try.", author: "John F. Kennedy" },
  { text: "Small improvements every day lead to remarkable results.", author: "Robin Sharma" },
  { text: "A system is only as strong as the people who improve it.", author: "W. Edwards Deming" },
  { text: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { text: "Build things that make a difference.", author: "Satya Nadella" }
];

const AttendanceBarChart = dynamic(() => import('./AttendanceBarChart'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-slate-100 rounded-2xl h-[300px] w-full" />
});

// --- SUBCOMPONENTS ---

function StatCard({ icon, title, mainValue, subValue, subText, valueColor = "text-gray-800", chartLines }) {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-[0_2px_20px_rgb(0,0,0,0.03)] flex flex-col justify-between border border-gray-300 h-full relative overflow-hidden">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50/80 shadow-sm border border-gray-100">
          {icon}
        </div>
        <span className="text-[15px] font-bold font-inter text-[#004475]">{title}</span>
      </div>
      <div>
        <div className={`text-2xl font-bold font-inter tracking-tight mb-1 ${valueColor}`}>{mainValue}</div>
        <div className="text-[11px] font-semibold text-gray-400 flex items-center gap-1 uppercase tracking-wide">
          {subValue && <span className="text-gray-600 font-bold">{subValue}</span>}
          {subText}
        </div>
      </div>
      {chartLines && (
        <div className="absolute bottom-4 right-4 flex items-end gap-1 opacity-70">
          {chartLines.map((h, i) => (
            <div key={i} className="w-1.5 bg-green-500 rounded-t-sm" style={{ height: h }}></div>
          ))}
        </div>
      )}
    </div>
  );
}

// Renders a condition-specific animated overlay for the weather card background.
// Positions/durations are fixed (not randomized) so the effect doesn't visually
// jump on unrelated re-renders elsewhere in the dashboard.
function renderWeatherEffect(condition) {
  switch (condition) {
    case 'Cloudy':
    case 'Partly Cloudy': {
      const clouds = [
        { width: 70, height: 26, top: '18%', left: '5%', duration: '22s', delay: '0s' },
        { width: 50, height: 20, top: '42%', left: '55%', duration: '18s', delay: '-6s' },
        { width: 40, height: 16, top: '65%', left: '20%', duration: '26s', delay: '-12s' },
      ];
      return clouds.map((c, i) => (
        <div
          key={i}
          className="weather-cloud"
          style={{
            width: c.width,
            height: c.height,
            top: c.top,
            left: c.left,
            animationDuration: c.duration,
            animationDelay: c.delay,
          }}
        />
      ));
    }
    case 'Rainy':
      return <div className="weather-rain" />;
    case 'Snow': {
      const flakes = [
        { left: '8%', size: 4, duration: '7s', delay: '0s' },
        { left: '25%', size: 3, duration: '9s', delay: '-2s' },
        { left: '45%', size: 5, duration: '6.5s', delay: '-4s' },
        { left: '65%', size: 3, duration: '8s', delay: '-1s' },
        { left: '85%', size: 4, duration: '7.5s', delay: '-5s' },
      ];
      return flakes.map((f, i) => (
        <div
          key={i}
          className="weather-snowflake"
          style={{
            left: f.left,
            width: f.size,
            height: f.size,
            animationDuration: f.duration,
            animationDelay: f.delay,
          }}
        />
      ));
    }
    case 'Foggy': {
      const bands = [
        { top: '20%', duration: '14s', delay: '0s' },
        { top: '55%', duration: '18s', delay: '-6s' },
      ];
      return bands.map((b, i) => (
        <div
          key={i}
          className="weather-fog-band"
          style={{ top: b.top, animationDuration: b.duration, animationDelay: b.delay }}
        />
      ));
    }
    case 'Thunderstorm':
      return (
        <>
          <div className="weather-rain" />
          <div className="weather-flash" />
        </>
      );
    case 'Warm':
    case 'Clear':
      return <div className="weather-glow" />;
    case 'Windy': {
      const lines = [
        { top: '25%', width: '40%', duration: '3.5s', delay: '0s' },
        { top: '50%', width: '55%', duration: '3s', delay: '-1.5s' },
        { top: '72%', width: '35%', duration: '4s', delay: '-2.5s' },
      ];
      return lines.map((l, i) => (
        <div
          key={i}
          className="weather-wind-line"
          style={{ top: l.top, width: l.width, animationDuration: l.duration, animationDelay: l.delay }}
        />
      ));
    }
    default:
      return null;
  }
}

// --- MAIN COMPONENT ---

export default function EmployeeDashboard({ employeeStats, visibleQuickActions }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAnnouncementsOpen, setIsAnnouncementsOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const authUser = useSelector(selectAuthUser);

  const prevMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  const nextMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));

  const [monthlyStats, setMonthlyStats] = useState({
    workingDays: employeeStats?.workingDays || 0,
    presentDays: employeeStats?.presentDays || 0,
    absentDays: employeeStats?.absentDays || 0,
    dailyAttendance: employeeStats?.dailyAttendance || {}
  });

  useEffect(() => {
    setMonthlyStats({
      workingDays: employeeStats?.workingDays || 0,
      presentDays: employeeStats?.presentDays || 0,
      absentDays: employeeStats?.absentDays || 0,
      dailyAttendance: employeeStats?.dailyAttendance || {}
    });
  }, [employeeStats?.workingDays, employeeStats?.presentDays, employeeStats?.absentDays, employeeStats?.dailyAttendance]);

  useEffect(() => {
    if (!mounted || !authUser?.id) return;

    const now = new Date();
    const isCurrentMonth = calendarDate.getMonth() === now.getMonth() && calendarDate.getFullYear() === now.getFullYear();

    if (isCurrentMonth) {
      setMonthlyStats({
        workingDays: employeeStats?.workingDays || 0,
        presentDays: employeeStats?.presentDays || 0,
        absentDays: employeeStats?.absentDays || 0,
        dailyAttendance: employeeStats?.dailyAttendance || {}
      });
      return;
    }

    const fetchMonthlyStats = async () => {
      try {
        const y = calendarDate.getFullYear();
        const m = (calendarDate.getMonth() + 1).toString().padStart(2, '0');
        const res = await fetch(`/api/hr/attendance?month=${y}-${m}&employeeId=${authUser.id}`);
        if (res.ok) {
          const data = await res.json();
          const att = Array.isArray(data) ? data[0] : data;
          setMonthlyStats({
            workingDays: att?.workingDays || 0,
            presentDays: att?.presentDays || 0,
            absentDays: att?.absentDays || 0,
            dailyAttendance: att?.dailyAttendance || {}
          });
        }
      } catch (err) {
        console.error('Error fetching dynamic monthly stats', err);
      }
    };

    fetchMonthlyStats();
  }, [calendarDate, authUser?.id, mounted, employeeStats?.workingDays, employeeStats?.presentDays, employeeStats?.absentDays, employeeStats?.dailyAttendance]);

  const announcementsList = [];

  const firstName = authUser?.name?.split(' ')[0] || 'Employee';
  const designation = authUser?.designation || 'Employee';
  const department = authUser?.department || 'General';

  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Upcoming Holiday Calculation
  const nextHol = employeeStats?.nextHoliday;
  const holDateStr = nextHol ? new Date(nextHol.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '';
  const holDaysLeft = nextHol ? Math.ceil((new Date(nextHol.date) - new Date()) / (1000 * 60 * 60 * 24)) : 0;

  const currentHour = now.getHours();
  let greeting = 'Good Evening';
  if (currentHour < 12) {
    greeting = 'Good Morning';
  } else if (currentHour < 17) {
    greeting = 'Good Afternoon';
  } else if (currentHour >= 21) {
    greeting = 'Good Night';
  }

  // Adjust timestamp by local timezone offset so it changes exactly at local 12:00 AM (midnight)
  const localTimeMs = now.getTime() - (now.getTimezoneOffset() * 60000);
  const quoteIndex = Math.floor(localTimeMs / (1000 * 60 * 60 * 24)) % QUOTES.length;
  const currentQuote = QUOTES[quoteIndex];

  const [weatherData, setWeatherData] = useState({
    loading: true,
    temp: '--',
    condition: 'Loading...',
    high: '--',
    low: '--',
    humidity: '--',
    windSpeed: '--',
    location: 'Fetching...',
    bgPath: null
  });

  useEffect(() => {
    setMounted(true);

    const fetchWeather = async (lat, lon) => {
      try {
        let city = 'Unknown Location';
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
          const geoData = await geoRes.json();
          city = geoData.address?.city || geoData.address?.town || geoData.address?.county || 'Unknown';
          if (geoData.address?.country) city += `, ${geoData.address.country}`;
        } catch (e) { }

        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`);
        const data = await weatherRes.json();
        const current = data.current;
        const daily = data.daily;

        let bgPath = '/weather/sunny-back.png';
        let condition = 'Clear';

        if (current.weather_code === 1 || current.weather_code === 2) {
          condition = 'Partly Cloudy';
          bgPath = '/weather/partly cloud-back.png';
        } else if (current.weather_code === 3) {
          condition = 'Cloudy';
          bgPath = '/weather/cloudy-back.png';
        } else if (current.weather_code >= 45 && current.weather_code <= 48) {
          condition = 'Foggy';
          bgPath = '/weather/foggy-back.png';
        } else if ((current.weather_code >= 51 && current.weather_code <= 67) || (current.weather_code >= 80 && current.weather_code <= 82)) {
          condition = 'Rainy';
          bgPath = '/weather/rainy-back.png';
        } else if ((current.weather_code >= 71 && current.weather_code <= 77) || (current.weather_code >= 85 && current.weather_code <= 86)) {
          condition = 'Snow';
          bgPath = '/weather/snow-back.png';
        } else if (current.weather_code >= 95 && current.weather_code <= 99) {
          condition = 'Thunderstorm';
          bgPath = '/weather/thunder-back.png';
        }

        // Overrides for extreme temp or wind only when the sky is genuinely clear —
        // codes 2/3 (partly cloudy/overcast) must keep their own condition/background.
        if (current.weather_code <= 1) {
          if (current.temperature_2m >= 35) {
            condition = 'Warm';
            bgPath = '/weather/warm-back.png';
          } else if (current.wind_speed_10m && current.wind_speed_10m >= 25) {
            condition = 'Windy';
            bgPath = '/weather/windy-back.png';
          }
        }

        setWeatherData({
          loading: false,
          temp: Math.round(current.temperature_2m),
          condition: condition,
          high: Math.round(daily.temperature_2m_max[0]),
          low: Math.round(daily.temperature_2m_min[0]),
          humidity: current.relative_humidity_2m,
          windSpeed: current.wind_speed_10m ? Math.round(current.wind_speed_10m) : '--',
          location: city,
          bgPath: bgPath
        });
      } catch (err) {
        setWeatherData(prev => ({ ...prev, loading: false, condition: 'Weather unavailable', bgPath: null }));
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        position => fetchWeather(position.coords.latitude, position.coords.longitude),
        error => fetchWeather(10.3673, 77.9803)
      );
    } else {
      fetchWeather(10.3673, 77.9803);
    }
  }, []);

  if (!mounted) return null;

  return (
    <div className="bg-[#f7f9fc] min-h-screen font-sans p-1 lg:py-2 pb-20">
      <div className="max-w-[1400px] mx-auto space-y-3">

        {/* ROW 1: HEADER & WEATHER/QUOTE */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-2">

          {/* Main Banner (Greeting & Schedule) */}
          <div
            className="lg:col-span-8 rounded-[18px] p-6 md:p-8 shadow-sm flex flex-col justify-center relative overflow-hidden border border-gray-300 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/Emp-Header.png')" }}
          >
            {/* Greeting */}
            <div className="z-10 flex flex-col justify-center">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-medium font-Inter text-[#1a2b3c] mb-2 flex items-center flex-wrap gap-2">
                {greeting}, {firstName}! <span className="text-xl md:text-2xl">👋</span>
              </h1>
              <p className="text-[10px] md:text-[11px] font-bold text-gray-500 mb-4 md:mb-6 uppercase tracking-widest leading-relaxed">
                {designation} <span className="text-gray-300 mx-1 md:mx-2">•</span> {department}
              </p>
              <p className="text-[11px] md:text-[13px] font-medium text-gray-600 mb-6 md:mb-8 max-w-[250px] leading-relaxed">
                Driven by People, Defined by Results
              </p>
              <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-[11px] font-bold text-gray-700 bg-white/80 w-fit px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-white">
                <Calendar size={14} className="text-gray-500 shrink-0" />
                {formattedDate}
              </div>
            </div>
          </div>

          {/* Right Column: Weather & Quote */}
          <div className="lg:col-span-2 flex flex-col gap-2">
            {/* Weather */}
            <div className="rounded-[16px] p-4 shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-300 flex-1 relative overflow-hidden flex flex-col justify-between bg-[#f0f8ff]">

              {/* Zoomed background to hide baked-in borders from the exported PNGs.
                  Only shown once a real condition-specific image is known; while loading
                  or on fetch failure this stays empty and the neutral bg-[#f0f8ff] shows through. */}
              {weatherData.bgPath && (
                <div
                  className="absolute -inset-4 bg-cover bg-center z-0"
                  style={{ backgroundImage: `url('${weatherData.bgPath}')` }}
                />
              )}

              {/* Condition-specific animated effect, sandwiched between the background
                  image and the header/text content (both relative z-10) so it never
                  disturbs them. */}
              {weatherData.bgPath && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                  {renderWeatherEffect(weatherData.condition)}
                </div>
              )}

              <div className="flex items-center justify-between relative z-10 mb-4">
                <h3 className="text-[14px] font-bold font-inter text-[#004475]">Weather</h3>
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500 cursor-pointer hover:text-gray-700 transition-colors">
                  <MapPin size={12} className="shrink-0" />
                  <span className="truncate max-w-[120px]">{weatherData.location}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
              <div className="flex flex-col items-start relative z-10 flex-1 justify-center mb-4">
                <div className="flex flex-col justify-center">
                  <div className="text-[32px] leading-none font-bold text-[#1a2b3c] tracking-tight mb-2">{weatherData.temp}°C</div>
                  <div className="text-[13px] font-medium text-gray-500">{weatherData.condition}</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-medium text-gray-500 relative z-10 mt-auto">
                <span className="whitespace-nowrap">↑{weatherData.high}° ↓{weatherData.low}°</span>
                <span className="text-gray-400">•</span>
                <span className="whitespace-nowrap">Hum: {weatherData.humidity}%</span>
                <span className="text-gray-400">•</span>
                <span className="whitespace-nowrap">Wind: {weatherData.windSpeed} km/h</span>
              </div>
            </div>

            {/* Quote */}
            <div className="bg-white rounded-[18px] p-3 shadow-sm border border-gray-300 flex-1 flex flex-col justify-center relative overflow-hidden">
              <h3 className="text-[14px] font-bold fonter-inter text-[#004475] mb-3 relative z-10 flex items-center gap-2">
                <span className="text-2xl">❝ </span> Quote of the Day
              </h3>
              <p className="text-[13px] font-bold font-inter text-gray-600 relative z-10 mb-3 px-2">
                "{currentQuote.text}"
              </p>
              <div className="text-right text-[10px] font-black text-gray-400 uppercase tracking-widest relative z-10 pr-2">
                — {currentQuote.author}
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: STATUS CARDS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <StatCard
            icon={<CheckCircle size={20} className="text-green-500" />}
            title="Attendance"
            mainValue={employeeStats?.attendanceRate || "0%"}
            valueColor="text-green-500"
            subText={employeeStats?.attendanceChange ? `Trend: ${employeeStats.attendanceChange}` : 'Check-in data unavailable'}
            chartLines={['12px', '16px', '10px', '20px', '24px', '14px', '18px', '12px', '22px']}
          />
          <StatCard
            icon={<Calendar size={20} className="text-purple-500" />}
            title="Leave Balance"
            mainValue={employeeStats?.remainingLeaves?.toString() || "0"}
            valueColor="text-gray-800"
            subValue="Days"
            subText="Available"
          />
          <StatCard
            icon={<Banknote size={20} className="text-emerald-500" />}
            title="Payroll Status"
            mainValue={employeeStats?.lastPayslip?.status || 'Pending'}
            valueColor={employeeStats?.lastPayslip?.status === 'PAID' ? "text-emerald-500" : "text-orange-500"}
            subText={employeeStats?.lastPayslip ? `on ${new Date(employeeStats.lastPayslip.createdAt || Date.now()).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}` : "No recent payslip"}
          />
          <StatCard
            icon={<Plane size={20} className="text-blue-500" />}
            title="Upcoming Holidays"
            mainValue={nextHol ? String(holDaysLeft).padStart(2, '0') : '--'}
            valueColor="text-gray-800"
            subValue="Days"
            subText={nextHol ? `${nextHol.name} on ${holDateStr}` : 'No upcoming holidays'}
          />
        </div>

        {/* ROW 3: MIDDLE SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">

          {/* Quick Actions */}
          <div className="lg:col-span-3 bg-white rounded-[18px] p-4 shadow-sm border border-gray-300 flex flex-col">
            <h3 className="text-[15px] font-bold font-inter text-[#004475] mb-5 text-center">
              Quick Actions
            </h3>
            <div className="grid grid-cols-3 gap-y-6 gap-x-2 flex-1 place-content-center">
              {[
                { icon: <CalendarCheck size={18} className="text-green-500" />, bg: 'bg-green-50 border border-green-300  ', label: 'Apply Leave', path: '/dashboard/employee_portal?tab=leave' },
                { icon: <UserCheck size={18} className="text-orange-500" />, bg: 'bg-orange-50 border border-orange-300', label: 'Request Permission', path: '/dashboard/employee_portal?tab=leave' },
                { icon: <Download size={18} className="text-blue-500" />, bg: 'bg-blue-50 border border-blue-300', label: 'Download Payslip', path: '/dashboard/employee_portal?tab=payroll&subtab=payslips' },
                { icon: <Person size={18} className="text-purple-500" />, bg: 'bg-purple-50 border border-purple-300', label: 'My Profile', path: '/dashboard/employee_portal?tab=personal' },
                { icon: <FileOutput size={18} className="text-teal-500" />, bg: 'bg-teal-50 border border-teal-300', label: 'Upload Documents', path: '/dashboard/employee_portal?tab=personal' },
              ].map((action, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-3 group cursor-pointer"
                  onClick={() => router.push(action.path)}
                >
                  <div className={`w-12 h-12 rounded-[18px] ${action.bg} flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                    {action.icon}
                  </div>
                  <span className="text-[10px] font-bold text-center leading-tight text-gray-500 px-1">{action.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Birthdays & Anniversaries */}
          <div className="lg:col-span-6 bg-white rounded-[18px] p-4 shadow-sm border border-gray-300 flex flex-col">
            <div className="flex items-center justify-center mb-2">
              <h3 className="text-[15px] font-bold font-inter  text-[#004475] truncate mr-2">
                Birthdays & Work Anniversaries
              </h3>
            </div>
            <div className="flex flex-col justify-center items-center flex-1 opacity-80">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3 shadow-sm border border-blue-100">
                <span className="text-xl drop-shadow-sm">🎉</span>
              </div>
              <h4 className="text-[13px] font-bold font-inter text-[#004475] mb-1">No Celebrations Today</h4>
              <p className="text-[11px] font-bold font-inter text-gray-400 text-center">There are no birthdays or work anniversaries today.</p>
            </div>
          </div>

          {/* Pending Approvals */}
          <div className="lg:col-span-3 bg-white rounded-[18px] p-4 shadow-sm border border-gray-300 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[15px] font-bold font-inter text-[#004475] text-center">Approvals</h3>
              <button
                onClick={() => router.push('/dashboard/employee_portal?tab=leave')}
                className="text-[11px] font-bold font-inter text-blue-500 hover:underline flex-shrink-0"
              >
                View All
              </button>
            </div>
            <div className="space-y-6 flex-1 flex flex-col justify-center">
              {[
                { count: '00', label: 'Leave Requests', icon: <CalendarCheck size={14} className="text-green-500" />, bg: 'bg-green-50' },
                { count: '00', label: 'Permissions', icon: <UserCheck size={14} className="text-orange-500" />, bg: 'bg-orange-50' },
                { count: String(employeeStats?.pendingRequests || 0).padStart(2, '0'), label: 'Pending Requests', icon: <FileText size={14} className="text-blue-500" />, bg: 'bg-blue-50', path: '/dashboard/employee_portal?tab=leave&subtab=pending' },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 ${item.path ? 'cursor-pointer hover:bg-gray-50 p-1 -m-1 rounded-lg transition-colors' : ''}`}
                  onClick={() => item.path && router.push(item.path)}
                >
                  <div className={`w-8 h-8 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                    {item.icon}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-gray-800">{item.count}</span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{item.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ROW 4: BOTTOM SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">

          {/* Announcements */}
          <div className="lg:col-span-4 bg-white rounded-[18px] p-6 shadow-sm border border-gray-300 h-[360px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[15px] font-bold font-inter text-[#004475]">Announcements</h3>
              <button onClick={() => setIsAnnouncementsOpen(true)} className="text-[12px] font-bold font-inter text-blue-500 hover:underline">View All</button>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar pr-1 flex flex-col">
              {announcementsList.length > 0 ? (
                <div className="space-y-6">
                  {announcementsList.map((item, i) => (
                    <div key={i} className="flex gap-3 group cursor-pointer">
                      <div className={`w-8 h-8 rounded-xl ${item.bg} flex-shrink-0 flex items-center justify-center mt-0.5`}>
                        {item.icon}
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-[11px] font-black text-gray-800 leading-tight">{item.title}</h4>
                          {item.isNew && <span className="text-[8px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-full uppercase tracking-widest">New</span>}
                        </div>
                        <p className="text-[10px] font-medium text-gray-500 leading-relaxed mb-2 line-clamp-2">{item.desc}</p>
                        <span className="text-[9px] font-bold text-gray-400">{item.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 h-full opacity-70">
                  <div className="w-16 h-16 rounded-full bg-yellow-50 flex items-center justify-center mb-4">
                    <Megaphone size={28} className="text-yellow-500" />
                  </div>
                  <h4 className="text-[12px] font-bold text-gray-600 mb-1">No Announcements</h4>
                  <p className="text-[10px] font-medium text-gray-400 text-center max-w-[80%]">There are no new announcements at the moment. Check back later.</p>
                </div>
              )}
            </div>
          </div>

          {/* Calendar & Events (Custom replacement for AttendanceBarChart placeholder) */}
          <div className="lg:col-span-5 bg-white rounded-[32px] p-6 shadow-sm border border-gray-50 h-[360px] flex gap-6">
            <div className="w-1/2 flex flex-col">
              <div className="flex items-center justify-between mb-6 relative">
                <h3 className="text-[14px] font-bold font-inter text-gray-800 absolute left-1/2 -translate-x-1/2">
                  {calendarDate.toLocaleString('default', { month: 'long' })} {calendarDate.getFullYear()}
                </h3>
                <div className="flex gap-1 ml-auto">
                  <ChevronRight size={14} className="rotate-180 text-gray-500 cursor-pointer hover:text-gray-800 transition-colors" onClick={prevMonth} />
                  <ChevronRight size={14} className="text-gray-500 cursor-pointer hover:text-gray-800 transition-colors" onClick={nextMonth} />
                </div>
              </div>
              <div className="grid grid-cols-7 text-center font-inter font-bold gap-y-4 text-[11px]">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
                  <div key={i} className={`font-bold font-inter ${i === 0 ? 'text-red-500' : 'text-gray-400'}`}>{d}</div>
                ))}
                {Array.from({ length: new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1).getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate() }, (_, i) => {
                  const day = i + 1;
                  const curY = calendarDate.getFullYear();
                  const curM = calendarDate.getMonth();
                  const dateToCheck = new Date(curY, curM, day);

                  const now = new Date();
                  const isSelected = day === now.getDate() && curM === now.getMonth() && curY === now.getFullYear();
                  const isSunday = dateToCheck.getDay() === 0;

                  // Check if day is a holiday
                  const isHoliday = employeeStats?.calendarHolidays?.some(h => {
                    const hd = new Date(h.holidayDate);
                    return hd.getFullYear() === curY && hd.getMonth() === curM && hd.getDate() === day;
                  });

                  // Check if day has a leave or permission
                  let leaveStatus = null;
                  if (employeeStats?.calendarLeaves) {
                    for (const l of employeeStats.calendarLeaves) {
                      const sd = new Date(l.startDate || l.permissionDate || l.date);
                      const ed = new Date(l.endDate || l.permissionDate || l.date);
                      const sdStart = new Date(sd.getFullYear(), sd.getMonth(), sd.getDate());
                      const edStart = new Date(ed.getFullYear(), ed.getMonth(), ed.getDate());
                      if (dateToCheck >= sdStart && dateToCheck <= edStart) {
                        leaveStatus = l.status?.toUpperCase();
                        break;
                      }
                    }
                  }

                  let colorClass = isSunday ? 'text-red-500' : 'text-gray-700';
                  const dateStr = `${curY}-${(curM + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                  const isHalfDay = monthlyStats?.dailyAttendance?.[dateStr] === 'HD';

                  if (isHoliday) {
                    colorClass = 'text-red-500';
                  } else if (isHalfDay) {
                    colorClass = 'text-orange-500';
                  } else if (leaveStatus === 'APPROVED') {
                    colorClass = 'text-green-600';
                  } else if (leaveStatus === 'PENDING') {
                    colorClass = 'text-yellow-500';
                  }

                  return (
                    <div key={i} className={`flex items-center justify-center font-bold ${isSelected ? 'bg-[#1a2b3c] text-white w-6 h-6 rounded-full mx-auto shadow-md' : colorClass}`}>
                      {day}
                    </div>
                  );
                })}
              </div>

              <div className="mt-auto pt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold font-inter text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span>Company Holiday</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <span>Pending Request</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-600"></div>
                  <span>Leave Approved</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span>Half-Day Leave</span>
                </div>
              </div>
            </div>

            <div className="w-[1px] h-full bg-gray-100"></div>

            <div className="w-1/2 flex flex-col pl-4">
              <h3 className="text-[15px] font-bold font-inter text-[#004475]">Monthly Calender</h3>
              <div className="space-y-6 flex-1 flex flex-col mt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold font-inter text-gray-600">Total Working Days</span>
                  </div>
                  <span className="text-[14px] font-bold text-green-600">{monthlyStats.workingDays || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold font-inter text-gray-600">Days Present</span>
                  </div>
                  <span className="text-[14px] font-bold text-violet-600">{monthlyStats.presentDays || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold font-inter text-gray-600">Days Absent</span>
                  </div>
                  <span className="text-[14px] font-bold text-red-600">{monthlyStats.absentDays || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI HR Assistant */}
          {/* <div className="lg:col-span-3 bg-gradient-to-br from-[#f3f7fd] to-[#ebf1fc] rounded-[32px] p-6 shadow-sm border border-blue-50 h-[360px] flex flex-col relative overflow-hidden">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-[#004475] mb-4">AI HR Assistant</h3>

            <div className="flex-1 flex flex-col z-10 relative">
              <h4 className="text-lg font-black text-gray-800 mb-1">Hello John! 👋</h4>
              <p className="text-[11px] font-bold text-gray-500 mb-6">How can I help you today?</p>

              <div className="space-y-3 mb-6">
                <button className="w-fit px-5 py-3 bg-white rounded-full text-[10px] font-bold text-[#004475] shadow-sm border border-gray-100 hover:bg-blue-50 transition-colors text-left flex items-center justify-between gap-4">
                  How many leave days do I have left?
                </button>
                <button className="w-fit px-5 py-3 bg-white rounded-full text-[10px] font-bold text-[#004475] shadow-sm border border-gray-100 hover:bg-blue-50 transition-colors text-left flex items-center justify-between gap-4">
                  When is my next payroll date?
                  <ChevronRight size={12} className="text-gray-400" />
                </button>
              </div>

              <div className="mt-auto relative max-w-[85%]">
                <input
                  type="text"
                  placeholder="Ask anything..."
                  className="w-full bg-white rounded-full py-3 px-5 pr-12 text-[11px] font-medium text-gray-700 shadow-sm border border-gray-100 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 placeholder-gray-400"
                />
                <button className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 hover:bg-blue-100 transition-colors">
                  <Send size={12} className="ml-0.5" />
                </button>
              </div>
            </div>

            {/* Robot Image Placeholder */}
          {/* <div className="absolute -bottom-8 -right-8 opacity-90 pointer-events-none w-48 h-48 mix-blend-multiply flex items-end justify-end">
              <div className="text-[120px] leading-none text-right">🤖</div>
            </div>
          </div>  */}

        </div>

      </div>

      {/* Announcements Sidebar Container */}
      {mounted && createPortal(
        <div
          className={`fixed inset-0 z-50 overflow-hidden pointer-events-none transition-all duration-500 ${isAnnouncementsOpen ? 'visible' : 'invisible'}`}
        >
          {/* Overlay */}
          <div
            className={`absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto transition-opacity duration-500 ${isAnnouncementsOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setIsAnnouncementsOpen(false)}
          />

          {/* Right Sidebar */}
          <div
            className={`absolute top-0 right-0 h-full w-80 bg-white shadow-2xl pointer-events-auto transform transition-transform duration-500 ease-in-out ${isAnnouncementsOpen ? 'translate-x-0' : 'translate-x-full'}`}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold font-inter text-[#004475]">All Announcements</h2>
              <button
                onClick={() => setIsAnnouncementsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6 h-[calc(100vh-80px)] overflow-y-auto flex flex-col">
              {announcementsList.length > 0 ? (
                <div className="space-y-6">
                  {announcementsList.map((item, i) => (
                    <div key={i} className="flex gap-3 group">
                      <div className={`w-10 h-10 rounded-xl ${item.bg} flex-shrink-0 flex items-center justify-center`}>
                        {item.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-bold text-gray-800">{item.title}</h4>
                          {item.isNew && <span className="text-[9px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-full uppercase tracking-widest">New</span>}
                        </div>
                        <p className="text-xs font-medium text-gray-500 leading-relaxed mb-2">{item.desc}</p>
                        <span className="text-[10px] font-bold text-gray-400">{item.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 h-full opacity-70">
                  <div className="w-20 h-20 rounded-full bg-yellow-50 flex items-center justify-center mb-4">
                    <Megaphone size={32} className="text-yellow-500" />
                  </div>
                  <h4 className="text-[14px] font-bold text-gray-600 mb-2">No Announcements</h4>
                  <p className="text-[11px] font-medium text-gray-400 text-center max-w-[80%]">You're all caught up! There are no new announcements to display right now.</p>
                </div>
              )}
            </div>
          </div>
        </div>, document.body)}
    </div>
  );
}
