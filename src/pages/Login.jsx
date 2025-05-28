import React, { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/firebase';
import { useNavigate } from 'react-router-dom';
import { ArrowRightCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/');
    } catch (error) {
      alert('Google Sign-In failed: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f8f8] px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-teal-700 p-3 rounded-full text-white">
            <ArrowRightCircle size={32} />
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-gray-800 mb-1">Welcome to TimeWise</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in to manage your time and schedule.</p>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-teal-700 text-white rounded-md hover:bg-teal-800 transition font-medium"
          >
            {isRegister ? 'Sign Up' : 'Sign In'}
          </button>
          <div className="mt-6">
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full py-2 border border-gray-300 rounded-md hover:bg-gray-100 text-gray-800 flex items-center justify-center gap-2"
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                className="h-5 w-5"
              />
              Continue with Google
            </button>
          </div>

        </form>

        <p className="mt-4 text-sm text-gray-600">
          Don't have an account?{' '}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-teal-700 hover:underline font-medium"
          >
            {isRegister ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}
