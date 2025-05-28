import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, ListChecks, Settings, Waves } from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  return (
    <div
      className={`fixed md:static top-0 left-0 z-40 h-full w-64 bg-[#0e3a38] text-white transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      <div className="flex items-center justify-between px-6 py-6 md:justify-start text-green-400 font-bold text-xl">
        <div className="flex items-center gap-2">
          <Waves className="w-6 h-6" />
          <span>TimeWise</span>
        </div>
        {/* Close button on mobile */}
        <button
          onClick={onClose}
          className="md:hidden text-white bg-teal-800 rounded-full px-2 py-1"
        >
          ✕
        </button>
      </div>

      <nav className="flex flex-col gap-2 px-2">
        {[
          { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/schedule', label: 'Schedule', icon: Calendar },
          { to: '/timesheets', label: 'Timesheets', icon: ListChecks },
        ].map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded ${
                isActive ? 'bg-teal-700 text-white' : 'hover:bg-teal-800 text-gray-100'
              }`
            }
          >
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </nav>

      {/* <div className="px-4 py-4 border-t border-teal-800 text-sm flex items-center gap-2 text-gray-300 hover:text-white cursor-pointer mt-auto">
        <Settings size={18} />
        <span>Settings</span>
      </div> */}
    </div>
  );
}
