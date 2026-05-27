import React, { useState, useRef, useEffect } from 'react';
import { useApp, isSunday } from '../context/AppContext';
import { DailyMealStatus, OrderStatus, Address, MealType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, MapPin, Plus, User as UserIcon, LogOut, CheckCircle, 
  XCircle, Pause, Play, AlertCircle, Sparkles, Receipt, HelpCircle, Building,
  ArrowLeft, ShoppingBag, MoreHorizontal, Home, Check, Clock, Eye, Sliders, ChevronLeft, ChevronRight, Package, ArrowRight
} from 'lucide-react';

export default function DashboardUser() {
  const { 
    currentUser, logout, simulatedDate, unserviceableDays, 
    transactions, togglePauseMeal, adjustMealQuantity, addAddress, updateUserAddresses, organizations
  } = useApp();

  // Active Bottom Nav Tab: 'home' | 'ledger' | 'manage' | 'more'
  // Default to 'manage' to show the exact replica matching the user's screenshot
  const [activeBottomTab, setActiveBottomTab] = useState<'home' | 'ledger' | 'manage' | 'more'>('manage');
  
  // Track if we have already scrolled the calendar ribbon to Today's date
  const hasScrolledRef = useRef(false);

  useEffect(() => {
    if (activeBottomTab !== 'manage') {
      hasScrolledRef.current = false;
    }
  }, [activeBottomTab]);
  
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'credits' | 'debits'>('all');
  
  // Selected date in the ribbon
  const [selectedDate, setSelectedDate] = useState<string>(simulatedDate);

  // Address and ledger states
  const [newLabel, setNewLabel] = useState('');
  const [newAddressLine, setNewAddressLine] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Show dynamic detail overlay/modal when "View details" is clicked
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  if (!currentUser) return null;

  // Generate a wider range of days so it can be horizontally scrolled
  const generateDaysList = (centerDateStr: string) => {
    const dates = [];
    const center = new Date(centerDateStr);
    
    // We display 7 days in the past and 14 days in the future for scrolling
    for (let i = -30; i <= 30; i++) {
      const next = new Date(center);
      next.setDate(center.getDate() + i);
      const yyyy = next.getFullYear();
      const mm = String(next.getMonth() + 1).padStart(2, '0');
      const dd = String(next.getDate()).padStart(2, '0');
      dates.push(`${yyyy}-${mm}-${dd}`);
    }
    return dates;
  };

  const calendarDays = generateDaysList(simulatedDate);

  // Helper to format short date string for calendar headers
  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  const getDayNumber = (dateStr: string) => {
    return new Date(dateStr).getDate();
  };

  // Helper inside calendar ribbon to check current order status visual
  const getDayVisualStatus = (dateStr: string): 'empty' | 'paused' | 'delivered' | 'scheduled' | 'unserviceable' => {
    const isSun = isSunday(dateStr);
    const isUnserv = unserviceableDays.some(d => d.date === dateStr);
    if (isSun || isUnserv) return 'unserviceable';

    const dayEntry = currentUser.dailyMeals[dateStr];
    if (!dayEntry) return 'scheduled'; // default to active/ordered

    const lPause = dayEntry.lunchStatus === 'paused';
    const dPause = dayEntry.dinnerStatus === 'paused';
    
    const lCancelled = dayEntry.lunchStatus === 'cancelled';
    const dCancelled = dayEntry.dinnerStatus === 'cancelled';

    // If both are paused/cancelled, show paused/cancelled
    if ((lPause || lCancelled) && (dPause || dCancelled)) {
      return 'paused';
    }

    if (dayEntry.lunchStatus === 'delivered' || dayEntry.dinnerStatus === 'delivered') {
      return 'delivered';
    }

    if (
      dayEntry.lunchStatus === 'ordered' || 
      dayEntry.lunchStatus === 'scheduled' || 
      dayEntry.dinnerStatus === 'ordered' || 
      dayEntry.dinnerStatus === 'scheduled'
    ) {
      return 'scheduled';
    }

    return 'empty';
  };

  // Handle address updates
  const handleAssignAddresses = (e: React.FormEvent) => {
    e.preventDefault();
    const lAddr = (e.target as any).lunchAddr.value;
    const dAddr = (e.target as any).dinnerAddr.value;
    updateUserAddresses(currentUser.id, lAddr, dAddr);
  };

  // Create new address
  const handleAddAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel || !newAddressLine) return;
    addAddress(currentUser.id, newLabel, newAddressLine, newPhone || currentUser.phone);
    setNewLabel('');
    setNewAddressLine('');
    setNewPhone('');
    setShowAddressForm(false);
  };

  const isSelectedSunday = isSunday(selectedDate);
  const selectedUnserviceableObj = unserviceableDays.find(d => d.date === selectedDate);
  const isSelectedUnserviceable = isSelectedSunday || !!selectedUnserviceableObj;

  const hasActiveSub = !!currentUser.subscription?.active;
  const shouldDefaultMealsOn = hasActiveSub;
  const defaultMealStatus = shouldDefaultMealsOn ? 'ordered' : 'paused';
  const defaultLunchStatus = isSelectedUnserviceable ? 'cancelled' : defaultMealStatus;
  const defaultDinnerStatus = isSelectedUnserviceable ? 'cancelled' : defaultMealStatus;

  // Current selected day's database status
  const selectedDayEntry = currentUser.dailyMeals[selectedDate] || {
    date: selectedDate,
    lunchStatus: defaultLunchStatus as OrderStatus,
    dinnerStatus: defaultDinnerStatus as OrderStatus,
    lunchQty: 3,  // default to 3 to match user's screenshot
    dinnerQty: 3
  };

  const lunchQty = selectedDayEntry.lunchQty ?? 3;
  const dinnerQty = selectedDayEntry.dinnerQty ?? 3;

  const lunchAddr = currentUser.addresses.find(a => a.id === currentUser.lunchAddressId);
  const dinnerAddr = currentUser.addresses.find(a => a.id === currentUser.dinnerAddressId);

  // Address helpers
  const userOrg = organizations.find(o => o.id === currentUser.organizationId);

  const isMealLocked = (dateStr: string, meal: 'lunch' | 'dinner') => {
    const simulatedDateObj = new Date(simulatedDate);
    simulatedDateObj.setHours(0, 0, 0, 0);

    const targetDateObj = new Date(dateStr);
    targetDateObj.setHours(0, 0, 0, 0);

    if (targetDateObj < simulatedDateObj) return true;
    if (targetDateObj > simulatedDateObj) return false;

    // Same day checking actual time
    const currentHour = new Date().getHours();
    if (meal === 'lunch') {
      return currentHour >= 10;
    } else {
      return currentHour >= 15;
    }
  };

  // Pause all meals on this date
  const handlePauseAll = () => {
    if (isSelectedUnserviceable) return;
    if (!isMealLocked(selectedDate, 'lunch')) {
      togglePauseMeal(currentUser.id, selectedDate, 'lunch', true);
    }
    if (!isMealLocked(selectedDate, 'dinner')) {
      togglePauseMeal(currentUser.id, selectedDate, 'dinner', true);
    }
  };

  // Calculate pricing
  const isLunchActive = selectedDayEntry.lunchStatus === 'ordered' || selectedDayEntry.lunchStatus === 'scheduled' || selectedDayEntry.lunchStatus === 'delivered';
  const isDinnerActive = selectedDayEntry.dinnerStatus === 'ordered' || selectedDayEntry.dinnerStatus === 'scheduled' || selectedDayEntry.dinnerStatus === 'delivered';
  const isLunchToggleOn = selectedDayEntry.lunchStatus !== 'paused';
  const isDinnerToggleOn = selectedDayEntry.dinnerStatus !== 'paused';

  const selectedDayTotalCredits = (isLunchActive ? lunchQty : 0) + (isDinnerActive ? dinnerQty : 0);
  // Scale each credit to ₹38 to perfectly match ₹114 for 3 items
  const mealUnitPrice = 38;
  const amountToPay = selectedDayTotalCredits * mealUnitPrice;

  return (
    <div id="user-dashboard-root" className="w-full max-w-5xl mx-auto py-2 px-2 sm:px-6">
      
      {/* Horizontal Companion Desk Bar */}
      <div className="bg-[#3B120B] text-white rounded-2xl p-4 sm:p-5 shadow-sm mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-[#4A1C14]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-400/20 text-emerald-400 text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full font-bold">
              Customer Account
            </span>
            {userOrg && (
              <span className="bg-indigo-400/20 text-indigo-300 text-[10px] font-mono px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <Building className="w-3.5 h-3.5" /> 
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">{currentUser.name}</h2>
          <p className="text-xs text-slate-350">
            ✉️ {currentUser.email} • 📞 {currentUser.phone}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-[#4A1C14]/80 border border-[#4A1C14] p-3.5 rounded-xl">
          <div className="text-right">
            <p className="text-[10px] uppercase font-mono text-slate-450 tracking-wider">Remaining Wallet</p>
            <p className="text-xl font-black text-emerald-400">{currentUser.credits} Meals</p>
          </div>
          <div className="h-8 w-px bg-[#4A1C14]" />
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition text-xs font-bold shadow-sm"
            title="Log Out Profile"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Container - Desktop / Tablet Responsive Center Layout */}
      <div className="flex justify-center py-2">
        <div className="w-full max-w-2xl bg-white md:rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative flex flex-col min-h-[780px]">
          
          {/* Active Container Screen Body (Scrollable viewport) */}
          <div className="flex-1 px-4 md:px-6 pb-24 pt-4 bg-[#FEF6EE]/50">
            <AnimatePresence mode="wait">
              
              {/* TAB CONTENT 1: HOME */}
              {activeBottomTab === 'home' && (
                <motion.div
                  key="home-screen"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4 pt-1"
                >

                  {/* Operational details card */}
                  <div className="bg-[#FFFDF9] border border-amber-100 p-4 rounded-xl text-xs text-[#5C1B1B] space-y-1.5">
                    <p className="font-bold text-amber-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Smart Tiffin Management
                    </p>
                    <p className="text-[11px] leading-relaxed text-[#7A4C40]">
                      Our kitchen is powered by automated status locking. Switch to the <button onClick={() => setActiveBottomTab('manage')} className="text-[#8B2A2A] font-bold underline">Manage</button> tab below to adjust quantities, review cutoffs, or suspend/pause food dispatch.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* TAB CONTENT 2: LEDGER */}
              {activeBottomTab === 'ledger' && (
                <motion.div
                  key="ledger-screen"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4 pt-1"
                >
                  <div className="pb-1 border-b border-gray-100 flex justify-between items-end">
                    <div>
                      <h3 className="font-extrabold text-[#3B1910] text-base">Account Summary (Ledger)</h3>
                      <p className="text-xs text-gray-400">View your tiffin credit updates and deductions</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => setTransactionFilter('all')}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition ${transactionFilter === 'all' ? 'bg-[#4A1C14] text-white' : 'bg-[#FDF8F5] text-[#7A4C40] hover:bg-slate-200'}`}
                    >
                      All
                    </button>
                    <button 
                      onClick={() => setTransactionFilter('credits')}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition ${transactionFilter === 'credits' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                    >
                      Credits
                    </button>
                    <button 
                      onClick={() => setTransactionFilter('debits')}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition ${transactionFilter === 'debits' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}`}
                    >
                      Debits
                    </button>
                  </div>

                  <div className="space-y-3">
                    {transactions
                      .filter(t => t.userId === currentUser.id)
                      .filter(t => {
                        if (transactionFilter === 'credits') return t.amount > 0;
                        if (transactionFilter === 'debits') return t.amount < 0;
                        return true;
                      })
                      .reverse()
                      .map((t, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-2xl border border-gray-150 shadow-xs flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            t.amount > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                          }`}>
                            <Receipt className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-[13px] text-[#3B1910]">{t.description}</p>
                            <p className="text-[10px] text-gray-500">{new Date(t.date).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className={`font-black text-sm ${t.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {t.amount > 0 ? '+' : ''}{t.amount}
                        </div>
                      </div>
                    ))}
                    {transactions.filter(t => t.userId === currentUser.id).length === 0 && (
                      <p className="text-orange-950/60 text-center py-4 text-xs font-medium">No transactions found</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* TAB CONTENT 3: MANAGE CALENDAR & REPLICA SUBSCRIBERS CALENDAR */}
              {activeBottomTab === 'manage' && (
                <motion.div
                  key="manage-screen"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4 pt-1"
                >
                  {/* Top Arrow Header */}
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                    <button 
                      onClick={() => setActiveBottomTab('home')}
                      className="p-1 hover:bg-[#FDF8F5] rounded-full transition"
                      title="Back to Home"
                    >
                      <ArrowLeft className="w-4 h-4 text-gray-500" />
                    </button>
                    <p className="text-[11.5px] leading-tight text-slate-750 font-extrabold text-[#3B1910]">
                      My Active Plan Schedules
                    </p>
                  </div>

                  {/* Horizontal calendar slider ribbon */}
                  <div className="flex gap-2 overflow-x-auto pb-4 pt-2 -mx-2 px-2 hide-scrollbar">
                    {calendarDays.map((dateStr) => {
                      const isSelected = selectedDate === dateStr;
                      const isTodayDate = dateStr === simulatedDate;
                      const dayLabel = getDayLabel(dateStr);
                      const dayNum = getDayNumber(dateStr);
                      const status = getDayVisualStatus(dateStr);

                      let containerClass = "flex-shrink-0 min-w-[60px] border border-transparent bg-transparent rounded-xl text-center p-1 cursor-pointer transition flex flex-col items-center justify-between min-h-[76px]";
                      if (isSelected) {
                        // Thursdays (Thu 21) or any user selection highlighted
                        containerClass = "flex-shrink-0 min-w-[60px] border border-[#FFDEC2] bg-white rounded-xl text-center p-1 cursor-pointer transition shadow-[0_4px_10px_-4px_rgba(240,125,85,0.2)] flex flex-col items-center justify-between min-h-[76px] relative after:absolute after:inset-0 after:rounded-xl after:border-t-2 after:border-[#F07D55]";
                      }

                      return (
                        <div
                          key={dateStr}
                          ref={(el) => {
                            if (el && isTodayDate && !hasScrolledRef.current) {
                              hasScrolledRef.current = true;
                              setTimeout(() => {
                                el.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
                              }, 100);
                            }
                          }}
                          onClick={() => setSelectedDate(dateStr)}
                          className={containerClass}
                        >
                          {/* Selected / Today pill */}
                          {isTodayDate ? (
                            <span className="bg-[#8B2A2A] text-[7.5px] font-sans font-black text-white px-1.5 py-0.5 rounded-sm uppercase scale-90 -mt-1 shadow-xs">
                              Today
                            </span>
                          ) : (
                            <span className="text-[8.5px] uppercase font-bold text-gray-400">
                              {dayLabel}
                            </span>
                          )}

                          {/* Day Number */}
                          <span className={`text-[15px] font-black mt-0.5 ${isSelected ? 'text-[#3B1910]' : 'text-[#5C1B1B]'}`}>
                            {dayNum}
                          </span>

                          {/* Status symbol indicator matching screenshot */}
                          <div className="h-5 flex items-center justify-center">
                            {status === 'unserviceable' ? (
                              <span className="text-[9px] text-[#A5B2C0] font-sans">🚫</span>
                            ) : status === 'paused' ? (
                              <span className="text-[9px] font-sans text-rose-500 font-bold">⏸️</span>
                            ) : status === 'delivered' ? (
                              // Wed 20 has green tick bullet below it
                              <div className="w-[15px] h-[15px] bg-[#22C55E] rounded-full flex items-center justify-center text-white text-[8px] font-black">
                                ✓
                              </div>
                            ) : (
                              // Future dates Thu 21 + have stopwatch timer indicators
                              <Clock className="w-3.5 h-3.5 text-[#053e54] font-black stroke-[3.5px]" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>



                  {/* Screen Section inside Slider pivots */}
                  <div className="space-y-3">
                    
                    {/* You're not available? Pause all banner */}
                    <div className="bg-[#FFFBF7] border border-[#FFEADA] p-3 rounded-2xl flex items-center gap-3 shadow-xs">
                      <div className="bg-[#FFF2E0] p-2.5 rounded-xl flex items-center justify-center">
                        <Package className="w-6 h-6 text-[#D76735]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[11.5px] font-bold text-[#4A261D]">You're not available on this date?</p>
                        <button
                          onClick={handlePauseAll}
                          className="text-[#D04B28] text-[11px] font-black uppercase tracking-wider block mt-0.5 hover:underline"
                        >
                          Pause all
                        </button>
                      </div>
                    </div>

                    {/* SERVICEABLE vs NON-SERVICEABLE BLOCKS */}
                    {isSelectedUnserviceable ? (
                      <div className="bg-red-50/50 border border-red-100 p-4 rounded-2xl text-xs space-y-1.5 text-red-900">
                        <p className="font-bold">⚠️ Subscriptions Suspended on this Date</p>
                        <p className="text-[11px] text-red-700 leading-relaxed">
                          No tiffins will be prepared or delivered on this day ({selectedDate}). Remaining credits are preserved safely in your wallet.
                        </p>
                        {selectedUnserviceableObj && (
                          <p className="font-medium bg-white/70 p-2 rounded-lg border border-red-100 italic">
                            Reason: "{selectedUnserviceableObj.reason}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        
                        {/* LUNCH TIFFIN PRODUCT CARD (Exact Replica of milk card style) */}
                        <div className="bg-white p-4 rounded-[22px] border border-[#F1E1D6] shadow-[0_8px_18px_-14px_rgba(0,0,0,0.14)] space-y-3">
                          <div className="flex justify-between items-start gap-3">
                            <div className="w-11 h-11 bg-[#FFF4EE] rounded-xl flex items-center justify-center text-2xl font-black shadow-xs">
                              🍱
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-[13.5px] text-[#3B1910] leading-tight">Royal Lunch Veg</h4>
                              <p className="text-[#7A4C40] font-medium text-[11px] leading-tight">Special Cooked Thali Plan</p>
                              <span className="text-[10px] text-gray-400 font-mono tracking-tight block mt-0.5">
                                📍 To: {lunchAddr ? lunchAddr.label : 'Default Home (Office)'}
                              </span>
                            </div>

                            {/* Toggle switch */}
                            <div className="flex flex-col items-end gap-1 pt-0.5">
                              <button
                                onClick={() => togglePauseMeal(
                                  currentUser.id,
                                  selectedDate,
                                  'lunch',
                                  selectedDayEntry.lunchStatus !== 'paused'
                                )}
                                disabled={isMealLocked(selectedDate, 'lunch')}
                                className={`w-11 h-6 rounded-full p-0.5 transition duration-200 outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                                  isLunchToggleOn ? 'bg-[#C98F8B]' : 'bg-[#E7DDD9]'
                                }`}
                              >
                                <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition duration-200 ${
                                  isLunchToggleOn ? 'translate-x-5' : 'translate-x-0'
                                }`} />
                              </button>
                              {isMealLocked(selectedDate, 'lunch') && (
                                <span className="text-[9px] text-rose-500 font-bold whitespace-nowrap">Cutoff Passed (10 AM)</span>
                              )}
                            </div>
                          </div>

                          <hr className="border-t border-dashed border-[#E7DDD7] my-1.5" />

                          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 pt-0.5">
                            <span className="text-xs text-gray-500 font-semibold">Quantity</span>
                            
                            {/* Capsule quantity adjuster */}
                            <div className="border border-[#E4D6CD] rounded-full px-3 py-1 bg-white shadow-[0_3px_10px_-7px_rgba(0,0,0,0.3)] flex items-center justify-between gap-4 text-sm min-w-[88px]">
                              <button 
                                onClick={() => adjustMealQuantity(currentUser.id, selectedDate, 'lunch', Math.max(1, lunchQty - 1))}
                                disabled={selectedDayEntry.lunchStatus === 'paused' || isMealLocked(selectedDate, 'lunch')}
                                className="text-gray-400 font-black hover:text-[#4A261D] transition disabled:opacity-40"
                              >
                                -
                              </button>
                              <span className="font-extrabold text-[#3B1910] text-xs min-w-[10px] text-center">
                                {lunchQty}
                              </span>
                              <button 
                                onClick={() => adjustMealQuantity(currentUser.id, selectedDate, 'lunch', Math.min(5, lunchQty + 1))}
                                disabled={selectedDayEntry.lunchStatus === 'paused' || isMealLocked(selectedDate, 'lunch')}
                                className="text-gray-400 font-black hover:text-[#4A261D] transition disabled:opacity-40"
                              >
                                +
                              </button>
                            </div>

                            {/* Single item line quantity status */}
                            <span className="text-[11px] font-semibold text-[#4A261D] justify-self-end">
                              {isLunchActive ? `${lunchQty} Pack(s) Active` : 'Paused'}
                            </span>
                          </div>
                        </div>

                        {/* DINNER TIFFIN PRODUCT CARD (Duplicate style to fit evening requirements) */}
                        <div className="bg-white p-4 rounded-[22px] border border-[#F1E1D6] shadow-[0_8px_18px_-14px_rgba(0,0,0,0.14)] space-y-3">
                          <div className="flex justify-between items-start gap-3">
                            <div className="w-11 h-11 bg-[#F3F0FF] rounded-xl flex items-center justify-center text-2xl font-black shadow-xs">
                              🍛
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-[13.5px] text-[#3B1910] leading-tight">Royal Dinner Spl</h4>
                              <p className="text-[#7A4C40] font-medium text-[11px] leading-tight">Evening Soft Meal Plan</p>
                              <span className="text-[10px] text-gray-400 font-mono tracking-tight block mt-0.5">
                                📍 To: {dinnerAddr ? dinnerAddr.label : 'Default Home Address'}
                              </span>
                            </div>

                            {/* Toggle switch */}
                            <div className="flex flex-col items-end gap-1 pt-0.5">
                              <button
                                onClick={() => togglePauseMeal(
                                  currentUser.id,
                                  selectedDate,
                                  'dinner',
                                  selectedDayEntry.dinnerStatus !== 'paused'
                                )}
                                disabled={isMealLocked(selectedDate, 'dinner')}
                                className={`w-11 h-6 rounded-full p-0.5 transition duration-200 outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                                  isDinnerToggleOn ? 'bg-[#C98F8B]' : 'bg-[#E7DDD9]'
                                }`}
                              >
                                <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition duration-200 ${
                                  isDinnerToggleOn ? 'translate-x-5' : 'translate-x-0'
                                }`} />
                              </button>
                              {isMealLocked(selectedDate, 'dinner') && (
                                <span className="text-[9px] text-rose-500 font-bold whitespace-nowrap">Cutoff Passed (3 PM)</span>
                              )}
                            </div>
                          </div>

                          <hr className="border-t border-dashed border-[#E7DDD7] my-1.5" />

                          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 pt-0.5">
                            <span className="text-xs text-gray-500 font-semibold">Quantity</span>
                            
                            {/* Capsule quantity adjuster */}
                            <div className="border border-[#E4D6CD] rounded-full px-3 py-1 bg-white shadow-[0_3px_10px_-7px_rgba(0,0,0,0.3)] flex items-center justify-between gap-4 text-sm min-w-[88px]">
                              <button 
                                onClick={() => adjustMealQuantity(currentUser.id, selectedDate, 'dinner', Math.max(1, dinnerQty - 1))}
                                disabled={selectedDayEntry.dinnerStatus === 'paused' || isMealLocked(selectedDate, 'dinner')}
                                className="text-gray-400 font-black hover:text-[#4A261D] transition disabled:opacity-40"
                              >
                                -
                              </button>
                              <span className="font-extrabold text-[#3B1910] text-xs min-w-[10px] text-center">
                                {dinnerQty}
                              </span>
                              <button 
                                onClick={() => adjustMealQuantity(currentUser.id, selectedDate, 'dinner', Math.min(5, dinnerQty + 1))}
                                disabled={selectedDayEntry.dinnerStatus === 'paused' || isMealLocked(selectedDate, 'dinner')}
                                className="text-gray-400 font-black hover:text-[#4A261D] transition disabled:opacity-40"
                              >
                                +
                              </button>
                            </div>

                            {/* Single item line quantity status */}
                            <span className="text-[11px] font-semibold text-[#4A261D] justify-self-end">
                              {isDinnerActive ? `${dinnerQty} Pack(s) Active` : 'Paused'}
                            </span>
                          </div>
                        </div>

                      </div>
                    )}

                  </div>

                </motion.div>
              )}

              {/* TAB CONTENT 4: MORE & SETTINGS SECTION */}
              {activeBottomTab === 'more' && (
                <motion.div
                  key="more-screen"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4 pt-1"
                >
                  {/* Option List Buttons Group block */}
                  <div className="space-y-3">
                    
                    {/* DUAL DESTINATION MAPPING SETUP */}
                    <div className="bg-white rounded-2xl border border-gray-150/70 p-4 shadow-xs space-y-4">
                      <div>
                        <h4 className="font-extrabold text-[#8B2A2A] text-sm flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-[#D04B28]" />
                          Dual Routing Address Map
                        </h4>
                        <p className="text-[10.5px] text-gray-400 mt-1">
                          Map distinct drop targets! Deliver office lunch to your desk workspace and dinner directly to home.
                        </p>
                      </div>

                      <form onSubmit={handleAssignAddresses} className="space-y-3 bg-[#FEF6EE]/80 p-3 rounded-xl border border-gray-100 text-xs">
                        <div className="space-y-2.5">
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">🍱 Lunch Address Target</label>
                            <select 
                              name="lunchAddr" 
                              defaultValue={currentUser.lunchAddressId || ''}
                              className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs text-gray-750 focus:ring-1 focus:ring-slate-805"
                            >
                              <option value="">Default Account Home</option>
                              {currentUser.addresses.map(a => (
                                <option key={a.id} value={a.id}>{a.label}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">🌙 Dinner Address Target</label>
                            <select 
                              name="dinnerAddr" 
                              defaultValue={currentUser.dinnerAddressId || ''}
                              className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs text-gray-750 focus:ring-1 focus:ring-slate-805"
                            >
                              <option value="">Default Account Home</option>
                              {currentUser.addresses.map(a => (
                                <option key={a.id} value={a.id}>{a.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-[#8B2A2A] text-white text-[11px] font-bold py-2 rounded-lg hover:bg-[#4A1C14] transition"
                        >
                          Save Dual Address Preferences
                        </button>
                      </form>

                      {/* Display Addresses List */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                          <span>My Locations ({currentUser.addresses.length})</span>
                          <button
                            onClick={() => setShowAddressForm(!showAddressForm)}
                            className="text-[#D04B28] hover:underline"
                          >
                            + Add New
                          </button>
                        </div>

                        {showAddressForm && (
                          <form onSubmit={handleAddAddressSubmit} className="bg-orange-50/20 border border-orange-100/40 p-3 rounded-xl text-xs space-y-2">
                            <input
                              type="text"
                              required
                              placeholder="Label (e.g. Desk B Noida)"
                              value={newLabel}
                              onChange={(e) => setNewLabel(e.target.value)}
                              className="w-full bg-white border rounded p-2 text-xs focus:outline-none"
                            />
                            <input
                              type="text"
                              required
                              placeholder="Full delivery address"
                              value={newAddressLine}
                              onChange={(e) => setNewAddressLine(e.target.value)}
                              className="w-full bg-white border rounded p-2 text-xs focus:outline-none"
                            />
                            <div className="flex justify-end gap-2 pt-1.5">
                              <button type="button" onClick={() => setShowAddressForm(false)} className="text-gray-400 text-[10px] px-2 py-1">Cancel</button>
                              <button type="submit" className="bg-[#D04B28] text-white text-[10px] px-3 py-1 rounded">Save Address</button>
                            </div>
                          </form>
                        )}

                        <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                          {currentUser.addresses.map(a => {
                            const isLunch = a.id === currentUser.lunchAddressId;
                            const isDinner = a.id === currentUser.dinnerAddressId;
                            return (
                              <div key={a.id} className="p-2.5 bg-[#FEF6EE] border rounded-lg text-[10.5px] space-y-0.5">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-[#4A261D]">{a.label}</span>
                                  <div className="flex gap-1">
                                    {isLunch && <span className="bg-orange-100 text-orange-850 px-1 rounded-sm text-[8px] font-bold font-mono">LUNCH</span>}
                                    {isDinner && <span className="bg-indigo-100 text-indigo-850 px-1 rounded-sm text-[8px] font-bold font-mono">DINNER</span>}
                                  </div>
                                </div>
                                <p className="text-gray-550 truncate">{a.addressLine}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* ACTIVE STATEMENT AUDIT LEDGER */}
                    <div className="bg-white rounded-2xl border border-gray-150/70 p-4 shadow-xs space-y-3">
                      <h4 className="font-extrabold text-[#8B2A2A] text-sm flex items-center gap-1.5">
                        <Receipt className="w-4 h-4 text-emerald-500" />
                        Wallet statement history
                      </h4>
                      <p className="text-[10.5px] text-gray-400 leading-snug">
                        Every delivery debits 1 Credit from your wallet balance. Review the official ledgers audit trial below.
                      </p>

                      <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                        {transactions
                          .filter(t => t.userId === currentUser.id)
                          .map(tx => (
                            <div key={tx.id} className="p-2.5 bg-[#FEF6EE] border rounded-xl flex justify-between items-center text-[10.5px]">
                              <div>
                                <span className="font-bold text-[#4A261D] block leading-tight">{tx.description}</span>
                                <span className="text-[8.5px] text-gray-400">{new Date(tx.date).toLocaleDateString()}</span>
                              </div>
                              <span className={`font-mono text-[11px] font-black whitespace-nowrap p-1 rounded ${
                                tx.type === 'credit' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                              }`}>
                                {tx.type === 'credit' ? '+' : '-'}{tx.amount} Meals
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* RED VISUAL LOGOUT FOOTER CARD */}
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 shadow-xs space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase font-mono tracking-widest text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                          <LogOut className="w-3.5 h-3.5" /> Security Session
                        </span>
                      </div>
                      <p className="text-xs text-rose-950 font-medium">
                        Are you finished testing on this machine? You can terminate the active profile session below.
                      </p>
                      <button
                        onClick={logout}
                        className="w-full text-xs font-bold py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <LogOut className="w-4 h-4" />
                        Log Out of My Account Now
                      </button>
                    </div>

                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* REAL PRESETS DEVICE OVERLAY BOTTOM NAVIGATION BAR (Exact Replica of Smartphone visual mockup) */}
          <div className="absolute bottom-0 inset-x-0 bg-white border-t border-[#E4D6CD] px-6 py-2 pb-5 flex justify-between items-center z-40 shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
            
            {/* Home button */}
            <button
              onClick={() => setActiveBottomTab('home')}
              className={`flex flex-col items-center gap-0.5 focus:outline-none transition ${
                activeBottomTab === 'home' ? 'text-[#5C1B1B]' : 'text-[#A79B97] hover:text-[#5C1B1B]'
              }`}
            >
              <Home className={`w-5 h-5 ${activeBottomTab === 'home' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
              <span className="text-[9.5px] font-semibold">Home</span>
            </button>

            {/* Ledger button */}
            <button
              onClick={() => setActiveBottomTab('ledger')}
              className={`flex flex-col items-center gap-0.5 focus:outline-none transition ${
                activeBottomTab === 'ledger' ? 'text-[#5C1B1B]' : 'text-[#A79B97] hover:text-[#5C1B1B]'
              }`}
            >
              <Receipt className={`w-5 h-5 ${activeBottomTab === 'ledger' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
              <span className="text-[9.5px] font-semibold">Ledger</span>
            </button>

            {/* Manage button (Selected is colored with checked icon) */}
            <button
              onClick={() => setActiveBottomTab('manage')}
              className={`flex flex-col items-center gap-0.5 focus:outline-none transition ${
                activeBottomTab === 'manage' ? 'text-[#5C1B1B]' : 'text-[#A79B97] hover:text-[#5C1B1B]'
              }`}
            >
              <Calendar className={`w-5 h-5 ${activeBottomTab === 'manage' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
              <span className="text-[9.5px] font-semibold">Manage</span>
            </button>

            {/* More details button */}
            <button
              onClick={() => setActiveBottomTab('more')}
              className={`flex flex-col items-center gap-0.5 focus:outline-none transition ${
                activeBottomTab === 'more' ? 'text-[#5C1B1B]' : 'text-[#A79B97] hover:text-[#5C1B1B]'
              }`}
            >
              <MoreHorizontal className={`w-5 h-5 ${activeBottomTab === 'more' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
              <span className="text-[9.5px] font-semibold">More</span>
            </button>

          </div>

        </div>
      </div>

      {/* View Details Overlay Modal popup */}
      <AnimatePresence>
        {showDetailsModal && (
          <div className="fixed inset-0 bg-[#3B120B]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="font-extrabold text-[#8B2A2A] text-[15px]">Subscription Billing Breakdown</h3>
                  <button 
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-700 font-bold"
                  >
                    X
                  </button>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Selected Date:</span>
                    <span className="font-mono font-bold text-[#4A261D]">{selectedDate}</span>
                  </div>
                  
                  {isLunchActive && (
                    <div className="flex justify-between bg-[#FEF6EE] p-2 rounded-lg">
                      <span>🍱 Lunch Tiffin ({lunchQty} Packs)</span>
                      <span className="font-bold">₹{lunchQty * mealUnitPrice}</span>
                    </div>
                  )}

                  {isDinnerActive && (
                    <div className="flex justify-between bg-[#FEF6EE] p-2 rounded-lg">
                      <span>🍛 Dinner Tiffin ({dinnerQty} Packs)</span>
                      <span className="font-bold">₹{dinnerQty * mealUnitPrice}</span>
                    </div>
                  )}

                  {!isLunchActive && !isDinnerActive && (
                    <p className="text-gray-400 text-center italic">No meals active for this date.</p>
                  )}

                  <div className="border-t pt-3 flex justify-between font-extrabold text-sm text-[#3B1910]">
                    <span>Total Amount Charged:</span>
                    <span>₹{amountToPay}</span>
                  </div>

                  <p className="text-[10px] text-gray-400 leading-normal">
                    * Each meal consumes 1 credit worth ₹38. Paused or unserviceable days are not charged.
                  </p>
                </div>

                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="w-full mt-2 bg-[#8B2A2A] text-white py-2 rounded-xl text-xs font-bold hover:bg-[#A33636]"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
