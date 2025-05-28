import React, { useRef, useEffect } from 'react';
import { useAuth } from '../firebase/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { LogOut } from 'lucide-react';

export default function Header({ onMenuClick }) {
  const { currentUser } = useAuth();
  const dropdownRef = useRef();
  const [open, setOpen] = React.useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => signOut(auth);

  return (
    <header className="flex justify-between items-center bg-[#f1fafa] px-4 py-4 border-b border-gray-200">
      {/* Mobile menu button */}
      <button onClick={onMenuClick} className="md:hidden text-teal-700">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* App Title */}
      <div className="text-teal-700 font-bold text-xl hidden md:block">TimeWise</div>

      {/* Profile Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className="w-10 h-10 rounded-full border-2 border-teal-600 flex items-center justify-center text-sm text-gray-500 hover:ring-2 ring-teal-300"
        >
          {currentUser?.email?.charAt(0).toUpperCase()}
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded shadow-lg border text-sm z-50">
            <div className="px-4 py-2 border-b text-gray-700">{currentUser?.email}</div>
            <button
              className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 text-red-600"
              onClick={handleLogout}
            >
              <LogOut size={16} /> Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
