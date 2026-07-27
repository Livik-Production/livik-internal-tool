'use client';

export default function Loader({
  label = 'Loading…',
  size = 'md', 
  fullScreen = false,
}) {
  const sizeMap = {
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-4',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${
        fullScreen
          ? 'fixed inset-0 z-[9999] bg-white/80 backdrop-blur-sm h-screen w-screen'
          : 'py-10 h-full w-full'
      }`}
    >
      <div className="relative">
        <div
          className={`rounded-full border-blue-100 border-t-blue-600 animate-spin ${
            sizeMap[size] || sizeMap.md
          }`}
        />
        {fullScreen && (
          <div className="absolute inset-0 rounded-full border border-blue-600/10 animate-ping" />
        )}
      </div>
      {label && (
        <div className="text-sm text-[#004475] font-bold uppercase tracking-[0.2em] animate-pulse">
          {label}
        </div>
      )}
    </div>
  );
}
