import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../firebase/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { User, LogOut } from 'lucide-react';

export default function Header() {
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <header className="flex justify-between items-center bg-[#f1fafa] px-6 py-4 border-b border-gray-200">
      {/* Logo */}
      <div className="flex items-center gap-2 text-teal-700 font-bold text-xl">
        <svg
          className="w-6 h-6 fill-teal-700"
          viewBox="0 0 24 24"
        >
          <path d="M2 6h20M2 12h20M2 18h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        TimeWise
      </div>

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
            <div className="px-4 py-2 border-b text-gray-700">
              <div className="text-xs font-semibold uppercase">User</div>
              <div>{currentUser?.email}</div>
            </div>
            <button
              className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 text-gray-700"
              onClick={() => alert('Profile - not implemented yet')}
            >
              <User size={16} /> Profile
            </button>
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
