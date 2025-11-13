import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Car, CreditCard, UserCheck, FileText } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/residents', label: 'Residents & Vehicles', icon: Users },
    { path: '/subscriptions', label: 'Subscriptions', icon: CreditCard },
    { path: '/visitors', label: 'Visitors', icon: Car },
    { path: '/supervisors', label: 'Supervisors', icon: UserCheck },
  ];
  
  const isActive = (path) => location.pathname === path;
  
  return (
    <nav className="bg-primary text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold">🚗 Parking System</h1>
            </div>
          </div>
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    isActive(item.path)
                      ? 'bg-accent text-white'
                      : 'text-white hover:bg-primary-light'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;