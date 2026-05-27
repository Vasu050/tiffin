import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Role } from './types';
import Auth from './components/Auth';
import DashboardUser from './components/DashboardUser';
import DashboardDelivery from './components/DashboardDelivery';
import DashboardAdmin from './components/DashboardAdmin';
import NotificationCenter from './components/NotificationCenter';
import { 
  Calendar, Shield, Truck, User as UserIcon, Sparkles, 
  ChevronLeft, ChevronRight, HelpCircle
} from 'lucide-react';

function AppContent() {
  const { currentUser, simulatedDate, setSimulatedDate, login, users } = useApp();

  // Helper to shift simulated date by days
  const shiftDays = (offset: number) => {
    const current = new Date(simulatedDate);
    current.setDate(current.getDate() + offset);
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    setSimulatedDate(`${yyyy}-${mm}-${dd}`);
  };

  return (
    <div className="min-h-screen bg-[#FDF8F5] text-[#3B1910] font-sans selection:bg-orange-500 selection:text-white">
      
      {/* Upper Global Sandbox Toolbar (Sticky) */}
      <div className="bg-[#4A1C14] border-b border-[#3B120B] text-white py-2 px-4 text-xs sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse" />
            <span className="font-semibold text-orange-200">System Time Simulator:</span>
            <div className="flex items-center gap-1.5 bg-[#3B120B] rounded-lg px-2 py-0.5 border border-[#4A1C14]">
              <button
                onClick={() => shiftDays(-1)}
                className="hover:text-amber-400 font-bold transition px-1 cursor-pointer"
                title="Simulate Yesterday"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              
              <span className="font-mono text-amber-300 font-bold tracking-tight">
                {simulatedDate} ({new Date(simulatedDate).toLocaleDateString('en-US', { weekday: 'short' })})
              </span>
              
              <button
                onClick={() => shiftDays(1)}
                className="hover:text-amber-400 font-bold transition px-1 cursor-pointer"
                title="Simulate Tomorrow"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Main Branding Header */}
      <header className="bg-white border-b border-[#F3E8E0] py-4 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#8B2A2A] rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md shadow-[#8B2A2A]/10">
              🍱
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-[#3B1910] flex items-center gap-1.5">
                Rajasthani Tiffins
                <span className="text-[10px] bg-[#A42C12] text-white px-2 py-0.2 rounded-full uppercase font-mono font-bold">
                  Pride of Rajasthan
                </span>
              </h1>
              <p className="text-xs text-[#7A4C40]">Authentic Thalis • Daily Tiffin Delivery</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Real-time Alerts log */}
            <NotificationCenter />
          </div>
        </div>
      </header>

      {/* Primary Layout Engine */}
      <main className="max-w-7xl mx-auto py-6 px-4">
        {!currentUser ? (
          <Auth />
        ) : (
          <div className="space-y-6">
            
            {/* Current Active viewport heading and details */}
            <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-white to-slate-50/50">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-orange-950/60 font-semibold block">Viewing Mode</span>
                <div className="flex items-center gap-2 mt-0.5">
                  {currentUser.role === Role.USER && <UserIcon className="w-4 h-4 text-orange-600" />}
                  {currentUser.role === Role.DELIVERY && <Truck className="w-4 h-4 text-amber-600" />}
                  {currentUser.role === Role.ADMIN && <Shield className="w-4 h-4 text-rose-600" />}
                  
                  <span className="font-extrabold text-sm capitalize text-[#4A261D]">
                    {currentUser.role === Role.USER ? 'Customer Dashboard' : `${currentUser.role} Control Panel`}
                  </span>
                </div>
              </div>

              <div className="text-xs text-orange-950/70 max-w-md">
                {currentUser.role === Role.USER && "Toggle daily schedules below, modify your double address preferences or review credit debits history."}
                {currentUser.role === Role.DELIVERY && "Select organizations or individual customers to log successful deliveries. Pauses are automatically skipped!"}
                {currentUser.role === Role.ADMIN && "Add workspace campuses, activate standard 1-month plans, configure unserviceable weather flags, or audit transactions."}
              </div>
            </div>

            {/* Dashboards View Routing */}
            {currentUser.role === Role.USER && <DashboardUser />}
            {currentUser.role === Role.DELIVERY && <DashboardDelivery />}
            {currentUser.role === Role.ADMIN && <DashboardAdmin />}

          </div>
        )}
      </main>

      {/* Footer Details */}
      <footer className="border-t border-gray-200 mt-12 py-8 px-4 text-center text-xs text-gray-400 space-y-1 bg-white">
        <p className="font-bold text-[#7A4C40]">🍱 Tiffin Delivery and Management System</p>
        <p>Supports multi-address routes, calendar pause switches, live credit algorithms, and bulk distribution logs.</p>
        <p className="text-[10px] text-gray-400 font-mono">Current Simulator Clock: {simulatedDate} | User Session: {currentUser?.email || 'Guest'}</p>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
