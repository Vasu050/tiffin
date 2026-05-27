import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, X, Trash2, ShieldAlert, Sparkles, CheckSquare } from 'lucide-react';

export default function NotificationCenter() {
  const { notifications, currentUser, clearNotifications } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  // Filter relevant notifications for current user (or global)
  const filtered = notifications.filter(
    n => !n.userId || (currentUser && n.userId === currentUser.id)
  );

  const unreadCount = filtered.filter(n => !n.read).length;

  return (
    <div className="relative">
      {/* Tiny Notification Trigger Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-[#FDF8F5] hover:bg-slate-205 transition text-gray-700 flex items-center justify-center cursor-pointer"
        title="View Live Alerts Log"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-mono font-bold text-[9px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Slide-out Menu Overlay */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden transform origin-top-right transition-all">
          <div className="bg-[#3B120B] p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <Sparkles className="text-orange-400 w-4 h-4 animate-spin-slow" />
              <h3 className="font-bold text-xs uppercase tracking-wider font-mono">Real-Time Alerts Log ({filtered.length})</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearNotifications}
                title="Clear Logs"
                className="text-orange-950/60 hover:text-rose-400 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-orange-950/60 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 p-2 space-y-1">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400 space-y-1">
                <CheckSquare className="w-8 h-8 text-gray-250 mx-auto opacity-50" />
                <p>Status Ledger Empty</p>
                <p className="text-[10px]">Interact with the dashboards to trigger live logs!</p>
              </div>
            ) : (
              filtered.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-3 text-xs space-y-1 rounded-lg transition hover:bg-[#FEF6EE] ${
                    !notif.read ? 'bg-indigo-50/20' : ''
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold text-[#4A261D] tracking-tight">{notif.title}</span>
                    <span className="text-[9px] text-gray-400 font-mono whitespace-nowrap">
                      {new Date(notif.timestamp).toLocaleTimeString() || 'Live'}
                    </span>
                  </div>
                  <p className="text-gray-600 text-[11px] leading-relaxed select-all">
                    {notif.message}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="bg-[#FEF6EE] p-2.5 text-center text-[10px] text-gray-400 font-mono border-t border-gray-150">
            📡 Simulated Active Session Connected
          </div>
        </div>
      )}
    </div>
  );
}
