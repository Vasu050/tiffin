import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Role } from '../types';
import { Shield, Truck, User as UserIcon, Lock, Sparkles, LogIn } from 'lucide-react';

export default function Auth() {
  const { login, register, usersLoaded } = useApp();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setError('');

    if (!usersLoaded) {
      setError('Loading account data, please try again in a moment.');
      return;
    }

    try {
      const { googleSignIn } = await import('../lib/firebase');
      const result = await googleSignIn();

      if (!result) {
        setError('Google sign-in did not return a user session.');
        return;
      }

      if (!result.user.email) {
        setError('Google sign-in succeeded, but no email address was returned.');
        return;
      }

      const googleEmail = result.user.email.trim();
      const linked = await login(googleEmail);

      if (linked) {
        alert('Successfully signed in with Google.');
        return;
      }

      const created = await register(
        result.user.displayName?.trim() || googleEmail.split('@')[0] || 'Google User',
        googleEmail,
        result.user.phoneNumber?.trim() || 'N/A'
      );

      if (created) {
        alert('Google account connected and a new profile was created.');
        return;
      }

      setError(`Google sign-in worked, but no app profile exists for ${googleEmail}.`);
    } catch (err: any) {
      const message = err?.code || err?.message || 'Unknown Google sign-in error';
      setError(`Error signing in with Google: ${message}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please provide an email address.');
      return;
    }

    if (isRegister) {
      if (!name || !phone) {
        setError('Please fill in name and phone number.');
        return;
      }
      register(name, email, phone).then((success: boolean) => {
        if (!success) {
          setError('An account with this email already exists.');
        }
      });
    } else {
      if (!usersLoaded) {
        setError('Loading account data, please try again in a moment.');
        return;
      }

      login(email).then((success: boolean) => {
        if (!success) {
          setError(`No account found with email "${email}".`);
        }
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        
        {/* Banner with style */}
        <div className="bg-[#A42C12] text-white p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500 rounded-full opacity-20 blur-xl transform translate-x-8 -translate-y-8"></div>
          <p className="text-xs uppercase tracking-widest text-orange-200 font-semibold mb-1 font-mono">Authentic & Homemade</p>
          <h1 className="text-2xl font-bold font-sans tracking-tight">Rajasthani Tiffins</h1>
          <p className="text-orange-100 text-xs mt-2">Pure Veg • Traditional Spices • Daily Fresh</p>
        </div>

        <div className="p-8">
          {/* Quick Prefill Tabs */}
          <div className="mb-6">
            <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 text-center">
              Connect Gmail (Required for Email Alerts)
            </span>
            <div className="flex justify-center mb-4">
              <button type="button" onClick={handleGoogleSignIn} className="gsi-material-button w-full justify-center">
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper flex items-center justify-center py-2 px-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition cursor-pointer gap-3">
                  <div className="gsi-material-button-icon">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents text-sm font-medium text-gray-700">Sign in with Google</span>
                </div>
              </button>
            </div>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="flex-shrink mx-4 text-xs font-mono text-gray-400">OR ENTER DETAILS</span>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Vasu Jain"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-sm px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 99999 99999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-sm px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="vasujain050@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Password
                </label>
                <span className="text-[10px] text-gray-400 font-mono">Preplaced for tester</span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  disabled
                  value="••••••••••••"
                  className="w-full text-sm px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-gray-400 cursor-not-allowed"
                />
                <Lock className="w-4 h-4 text-gray-300 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100 font-medium">
                ⚠️ {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!usersLoaded}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#A42C12] text-white font-semibold text-sm hover:bg-[#8B230B] shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <LogIn className="w-4 h-4" />
              {isRegister ? 'Create Account & Access' : 'Sign In Now'}
            </button>
          </form>

          {/* Toggle Button */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-gray-500 hover:text-orange-600 underline font-medium"
            >
              {isRegister ? 'Already have an account? Sign In' : 'Need a new customer profile? Register here'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
