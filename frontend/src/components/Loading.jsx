const Loading = () => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="relative">
        {/* Outer rotating ring */}
        <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        
        {/* Middle rotating ring - opposite direction */}
        <div className="absolute inset-2 w-16 h-16 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
        
        {/* Inner pulsing circle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full animate-pulse shadow-lg"></div>
        </div>
        
        {/* Glow effect */}
        <div className="absolute inset-0 blur-xl bg-blue-400 opacity-20 animate-pulse"></div>
      </div>
      
      {/* Loading text */}
      <div className="absolute mt-32">
        <p className="text-gray-600 font-semibold text-lg animate-pulse">Loading...</p>
      </div>
    </div>
  );
};

export default Loading;