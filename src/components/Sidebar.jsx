import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, ListChecks, Settings, Waves } from 'lucide-react';

export default function Sidebar() {
  return (
    <div className="w-64 min-h-screen bg-[#0e3a38] flex flex-col justify-between text-white">
      {/* Logo/Header */}
      <div>
        <div className="flex items-center px-6 py-6 text-green-400 font-bold text-xl space-x-2">
          <Waves className="w-6 h-6" />
          <span>TimeWise</span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2 px-2">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded ${
                isActive ? 'bg-teal-700 text-white' : 'hover:bg-teal-800 text-gray-100'
              }`
            }
          >
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>
          <NavLink
            to="/schedule"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded ${
                isActive ? 'bg-teal-700 text-white' : 'hover:bg-teal-800 text-gray-100'
              }`
            }
          >
            <Calendar size={18} /> Schedule
          </NavLink>
          <NavLink
            to="/timesheets"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded ${
                isActive ? 'bg-teal-700 text-white' : 'hover:bg-teal-800 text-gray-100'
              }`
            }
          >
            <ListChecks size={18} /> Timesheets
          </NavLink>
        </nav>
      </div>

      {/* Footer Settings */}
      <div className="px-4 py-4 border-t border-teal-800 text-sm flex items-center gap-2 text-gray-300 hover:text-white cursor-pointer">
        <Settings size={18} />
        <span>Settings</span>
      </div>
    </div>
  );
}
