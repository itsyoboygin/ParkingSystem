import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, CreditCard, UserCheck, CarFront, Menu, X, ChevronLeft } from 'lucide-react';

const Navbar = ({ collapsed = false, onToggleCollapse = () => {} }) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/residents', label: 'Residents', icon: Users },
    { path: '/subscriptions', label: 'Subscriptions', icon: CreditCard },
    { path: '/visitors', label: 'Visitors', icon: CarFront },
    { path: '/supervisors', label: 'Supervisors', icon: UserCheck },
  ];

  return (
    <>

      <aside
        className={`fixed top-0 left-0 h-full bg-gradient-primary text-white transition-all duration-300
          ${collapsed ? 'w-20' : 'w-64'}`}
      >
        
        <nav className={`sidebar-nav ${collapsed ? 'collapsed' : 'expanded'}`}>
          <div className="nav-header">
            {!collapsed && <span>System Online</span>}
            <button onClick={onToggleCollapse}><ChevronLeft /></button>
          </div>


          {/* Navigation */}
          <div className="flex flex-col h-full">
            <nav className={`flex flex-col ${collapsed ? 'items-center' : ''} gap-2`}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg transition-colors duration-150 ${
                      isActive
                        ? 'bg-white/10 text-white font-semibold'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon size={20} />
                    {!collapsed && item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Navbar;