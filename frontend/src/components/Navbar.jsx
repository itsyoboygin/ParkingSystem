import { Link, useLocation } from 'react-router-dom';
import { Home, Users, CreditCard, UserCheck, CarFront, Building2 } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/residents', label: 'Residents', icon: Users },
    { path: '/subscriptions', label: 'Subscriptions', icon: CreditCard },
    { path: '/visitors', label: 'Visitors', icon: CarFront },
    { path: '/supervisors', label: 'Supervisors', icon: UserCheck },
  ];

  return (
    <nav className="gradient-primary shadow-xl sticky top-0 z-50 border-b-4 border-white/10">
      <div className="max-w-[1400px] mx-auto px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo Section - More Prominent */}
          <Link to="/" className="flex items-center space-x-4 group">
            <div className="relative">
              <div className="absolute inset-0 bg-white/30 blur-xl rounded-full group-hover:bg-white/40 transition-all"></div>
              <div className="relative bg-white p-3.5 rounded-2xl shadow-2xl group-hover:scale-110 transition-transform duration-300">
                <Building2 className="w-9 h-9 text-blue-700" strokeWidth={2.5} />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-white text-2xl font-bold tracking-tight leading-tight">
                Parking System
              </span>
              <span className="text-white/70 text-sm font-medium">
                Smart Management Dashboard
              </span>
            </div>
          </Link>

          {/* Navigation Links - Modern Pills Design */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-2xl p-2 shadow-lg">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    group relative flex items-center gap-3 px-5 py-2.5 rounded-xl 
                    font-medium text-sm transition-all duration-300
                    ${isActive 
                      ? 'bg-white text-blue-700 shadow-lg scale-105' 
                      : 'text-white/90 hover:bg-white/20 hover:text-white'
                    }
                  `}
                >
                  <Icon 
                    className={`w-5 h-5 transition-transform duration-300 ${
                      isActive ? '' : 'group-hover:scale-110'
                    }`} 
                    strokeWidth={2.5} 
                  />
                  <span className="font-semibold">{item.label}</span>
                  
                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-blue-700 rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-lg">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-2.5 h-2.5 bg-green-400 rounded-full animate-ping"></div>
              </div>
              <span className="text-white text-sm font-semibold">System Online</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;