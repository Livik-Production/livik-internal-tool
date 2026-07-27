'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectAuthUser } from '../../../store/slices/authSlice';
import { Calendar, MapPin } from 'lucide-react';

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

// Shared greeting + weather + quote banner (top row of EmployeeDashboard), reused
// by other role dashboards. `designation`/`department` let a page override the
// subtitle line; otherwise they fall back to the logged-in user's profile fields.
export default function GreetingWeatherBanner({ designation: designationProp, department: departmentProp }) {
  const authUser = useSelector(selectAuthUser);

  const firstName = authUser?.name?.split(' ')[0] || 'User';
  const designation = designationProp || authUser?.designation || 'Team Member';
  const department = departmentProp || authUser?.department || 'General';

  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const currentHour = now.getHours();
  let greeting = 'Good Evening';
  if (currentHour < 12) {
    greeting = 'Good Morning';
  } else if (currentHour < 17) {
    greeting = 'Good Afternoon';
  } else if (currentHour >= 21) {
    greeting = 'Good Night';
  }

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-2 pt-2 px-1">
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
              {/* <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg> */}
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
            "The only way to do great work is to love what you do."
          </p>
          <div className="text-right text-[10px] font-black text-gray-400 uppercase tracking-widest relative z-10 pr-2">
            — Steve Jobs
          </div>
        </div>
      </div>
    </div>
  );
}
