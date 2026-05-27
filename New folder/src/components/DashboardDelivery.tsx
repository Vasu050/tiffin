import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Role, OrderStatus, MealType, DailyMealStatus } from '../types';
import { motion } from 'motion/react';
import { 
  Truck, CheckCircle, XCircle, Building, Search, User as UserIcon, 
  MapPin, Clock, AlertCircle, ShoppingBag, BellRing
} from 'lucide-react';

export default function DashboardDelivery() {
  const { 
    users, organizations, simulatedDate, unserviceableDays, 
    markMealDelivery, deliverOrganizationMeals, logout 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>('all');
  const [deliveryNotification, setDeliveryNotification] = useState<string | null>(null);

  // Filter users who are active customers
  const customers = users.filter(u => u.role === Role.USER);

  // Check if today is unserviceable
  const todayIsSunday = new Date(simulatedDate).getDay() === 0;
  const customUnservDayObj = unserviceableDays.find(d => d.date === simulatedDate);
  const isTodayUnserviceable = todayIsSunday || !!customUnservDayObj;

  // Meal locking / lockouts lookup helper modeled on user logic
  const isMealLocked = (dateStr: string, meal: 'lunch' | 'dinner') => {
    const simulatedDateObj = new Date(simulatedDate);
    simulatedDateObj.setHours(0, 0, 0, 0);

    const targetDateObj = new Date(dateStr);
    targetDateObj.setHours(0, 0, 0, 0);

    if (targetDateObj < simulatedDateObj) return true;
    if (targetDateObj > simulatedDateObj) return false;

    // Checks cutoff hours based on simulated current local hour
    const currentHour = new Date().getHours();
    if (meal === 'lunch') {
      return currentHour >= 10;
    } else {
      return currentHour >= 15;
    }
  };

  const isLunchLocked = isMealLocked(simulatedDate, 'lunch');
  const isDinnerLocked = isMealLocked(simulatedDate, 'dinner');

  // Active metrics count for today (Only counting if meal is locked-in / confirmed)
  let totalLunchScheduled = 0;
  let totalDinnerScheduled = 0;
  let totalLunchDelivered = 0;
  let totalDinnerDelivered = 0;

  customers.forEach(u => {
    const hasActiveSubscription = !!u.subscription?.active;
    const defaultMealStatus = isTodayUnserviceable ? 'cancelled' : (hasActiveSubscription ? 'ordered' : 'cancelled');

    const dayEntry = u.dailyMeals[simulatedDate] || {
      date: simulatedDate,
      lunchStatus: defaultMealStatus,
      dinnerStatus: defaultMealStatus,
      lunchQty: 3,
      dinnerQty: 3
    };

    const lQty = dayEntry.lunchQty ?? 3;
    const dQty = dayEntry.dinnerQty ?? 3;

    if (isLunchLocked) {
      if (dayEntry.lunchStatus === 'ordered' || dayEntry.lunchStatus === 'scheduled') {
        totalLunchScheduled += lQty;
      }
      if (dayEntry.lunchStatus === 'delivered') {
        totalLunchScheduled += lQty;
        totalLunchDelivered += lQty;
      }
    }

    if (isDinnerLocked) {
      if (dayEntry.dinnerStatus === 'ordered' || dayEntry.dinnerStatus === 'scheduled') {
        totalDinnerScheduled += dQty;
      }
      if (dayEntry.dinnerStatus === 'delivered') {
        totalDinnerScheduled += dQty;
        totalDinnerDelivered += dQty;
      }
    }
  });

  const showNotification = (msg: string) => {
    setDeliveryNotification(msg);
    setTimeout(() => {
      setDeliveryNotification(null);
    }, 4000);
  };

  const handleBulkDeliver = async (orgId: string, meal: 'lunch' | 'dinner', orgName: string) => {
    try {
      await deliverOrganizationMeals(orgId, simulatedDate, meal);
      showNotification(`Bulk delivered ${meal} for ${orgName}! Switched matching users to Delivered and deducted 1 Credit.`);
    } catch (error) {
      console.error('Bulk delivery update failed:', error);
      showNotification(`Could not update ${meal} deliveries for ${orgName}. Please try again.`);
    }
  };

  const handleIndividualDeliver = async (userId: string, meal: 'lunch' | 'dinner', name: string) => {
    try {
      await markMealDelivery(userId, simulatedDate, meal, 'delivered');
      showNotification(`${meal} marked Delivered for ${name}! Deducted 1 Credit.`);
    } catch (error) {
      console.error('Delivery update failed:', error);
      showNotification(`Could not mark ${meal} delivered for ${name}. Please try again.`);
    }
  };

  const handleIndividualFail = async (userId: string, meal: 'lunch' | 'dinner', name: string) => {
    try {
      await markMealDelivery(userId, simulatedDate, meal, 'not_delivered');
      showNotification(`Marked ${meal} Not-Delivered for ${name}. No credits deducted.`);
    } catch (error) {
      console.error('Failed delivery update failed:', error);
      showNotification(`Could not mark ${meal} failed for ${name}. Please try again.`);
    }
  };

  // Filtered customer list
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.phone.includes(searchQuery);
    const matchesOrg = selectedOrgFilter === 'all' || c.organizationId === selectedOrgFilter;
    return matchesSearch && matchesOrg;
  });

  return (
    <div id="delivery-dashboard-root" className="w-full max-w-4xl mx-auto py-4 px-3 sm:px-6">
      
      {/* Top Banner */}
      <div className="bg-amber-900/10 border border-amber-600/20 rounded-2xl p-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-amber-600 text-white rounded-2xl shadow-md shadow-amber-600/20">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                Logistics Controller
              </span>
              <span className="text-xs text-gray-400 font-mono">Date: {simulatedDate}</span>
            </div>
            <h2 className="text-lg font-black text-amber-950 font-sans tracking-tight">Delivery Agent Console</h2>
            <p className="text-xs text-amber-900/60 font-medium">Verify orders, map routes, and trigger organization bulk deliveries.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={logout} 
            className="text-xs font-bold text-gray-500 hover:text-amber-900 bg-white border px-3 py-1.5 rounded-lg shadow-sm transition cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Real-time Toast Alerts within view */}
      {deliveryNotification && (
        <div className="bg-indigo-900 text-white text-xs px-4 py-3 rounded-xl mb-4 font-mono flex items-center gap-2 animate-bounce shadow-md">
          <BellRing className="w-4 h-4 text-orange-300 animate-pulse" />
          <span><b>REAL-TIME SYSTEM NOTIFY:</b> {deliveryNotification}</span>
        </div>
      )}

      {/* Non-serviceable lock screen logic */}
      {isTodayUnserviceable ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-950 p-6 rounded-2xl space-y-3 shadow-sm mb-6">
          <div className="flex items-center gap-2 text-rose-800 font-black">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <h3>Today IS UNSERVICEABLE! Deliveries Locked.</h3>
          </div>
          <p className="text-xs leading-relaxed text-rose-900/80">
            No regular deliveries can be marked or debited because the simulated date (<b>{simulatedDate}</b>) falls on a Sunday or a custom Admin-suspended window.
            In case of non-serviceable days, credits cannot be deducted since tiffins couldn't be delivered.
          </p>
          {customUnservDayObj && (
            <p className="bg-white px-3 py-2 rounded border border-rose-200 text-xs text-rose-900">
              <b>Admin Reason:</b> "{customUnservDayObj.reason}"
            </p>
          )}
        </div>
      ) : null}

      {/* OVERALL DELIVERY ROADMAP STATISTICS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-[#FEF6EE] to-orange-50 p-4 border border-orange-100 rounded-2xl shadow-xs">
          <span className="text-[10px] uppercase font-mono text-amber-800 font-bold block mb-1">🍱 Lunch Scheduled</span>
          {isLunchLocked ? (
            <>
              <p className="text-2xl font-black text-[#5C1B1B]">{totalLunchScheduled} <span className="text-xs font-semibold text-gray-500">Packs</span></p>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-orange-500 h-full rounded-full" style={{ width: `${totalLunchScheduled > 0 ? (totalLunchDelivered / totalLunchScheduled) * 100 : 0}%` }} />
              </div>
              <span className="text-[10px] text-gray-450 font-semibold block mt-1">{totalLunchDelivered} delivered</span>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-amber-600 mt-2">Cutoff Pending</p>
              <p className="text-[10px] text-gray-400 font-mono mt-1">Locks today at 10:00 AM</p>
            </>
          )}
        </div>

        <div className="bg-gradient-to-br from-[#FEF6EE] to-orange-50 p-4 border border-orange-100 rounded-2xl shadow-xs">
          <span className="text-[10px] uppercase font-mono text-indigo-800 font-bold block mb-1">🍛 Dinner Scheduled</span>
          {isDinnerLocked ? (
            <>
              <p className="text-2xl font-black text-[#5C1B1B]">{totalDinnerScheduled} <span className="text-xs font-semibold text-gray-500">Packs</span></p>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${totalDinnerScheduled > 0 ? (totalDinnerDelivered / totalDinnerScheduled) * 100 : 0}%` }} />
              </div>
              <span className="text-[10px] text-gray-450 font-semibold block mt-1">{totalDinnerDelivered} delivered</span>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-indigo-600 mt-2">Cutoff Pending</p>
              <p className="text-[10px] text-gray-400 font-mono mt-1">Locks today at 3:00 PM</p>
            </>
          )}
        </div>

        <div className="bg-gradient-to-br from-[#FEF6EE] to-orange-50 p-4 border border-orange-100 rounded-2xl shadow-xs">
          <span className="text-[10px] uppercase font-mono text-amber-800 font-bold block mb-1">✅ Delivered Lunch</span>
          {isLunchLocked ? (
            <>
              <p className="text-2xl font-black text-emerald-600">{totalLunchDelivered} <span className="text-xs font-semibold text-gray-400">Packs</span></p>
              <span className="text-[10px] text-gray-450 font-semibold block mt-3">Target complete</span>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-gray-400 mt-2">Unavailable</p>
              <span className="text-[10px] text-gray-400 font-mono block mt-1">Pending locks</span>
            </>
          )}
        </div>

        <div className="bg-gradient-to-br from-[#FEF6EE] to-orange-50 p-4 border border-orange-100 rounded-2xl shadow-xs">
          <span className="text-[10px] uppercase font-mono text-indigo-800 font-bold block mb-1">✅ Delivered Dinner</span>
          {isDinnerLocked ? (
            <>
              <p className="text-2xl font-black text-emerald-600">{totalDinnerDelivered} <span className="text-xs font-semibold text-gray-400">Packs</span></p>
              <span className="text-[10px] text-gray-450 font-semibold block mt-3">Target complete</span>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-gray-400 mt-2">Unavailable</p>
              <span className="text-[10px] text-gray-400 font-mono block mt-1">Pending locks</span>
            </>
          )}
        </div>
      </div>

      {/* Core Grid */}
      <div className="space-y-6">

        {/* 1. Bulk Organization Actions Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-950 flex items-center gap-1.5 text-sm uppercase tracking-wider text-orange-950/60">
              <Building className="w-4 h-4 text-orange-950/60" />
              Bulk Organization Multi-User Deliveries
            </h3>
            <p className="text-xs text-gray-400">
              Marking an Organization as delivered automatically shifts all its active scheduled users list to "Delivered" and deducts credits in one shot, safely skipping paused/cancelled users!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {organizations.map((org) => {
              // Calculate remaining scheduled counts at this org today
              const orgUsersList = customers.filter(u => u.organizationId === org.id);
              
              let scheduledLunchCount = 0;
              let scheduledDinnerCount = 0;

              orgUsersList.forEach(u => {
                const meals = u.dailyMeals[simulatedDate] || {
                  date: simulatedDate,
                  lunchStatus: isTodayUnserviceable ? 'cancelled' : 'ordered',
                  dinnerStatus: isTodayUnserviceable ? 'cancelled' : 'ordered',
                  lunchQty: 3,
                  dinnerQty: 3
                };
                const lQty = meals.lunchQty ?? 3;
                const dQty = meals.dinnerQty ?? 3;

                if (isLunchLocked && (meals.lunchStatus === 'ordered' || meals.lunchStatus === 'scheduled')) {
                  scheduledLunchCount += lQty;
                }
                if (isDinnerLocked && (meals.dinnerStatus === 'ordered' || meals.dinnerStatus === 'scheduled')) {
                  scheduledDinnerCount += dQty;
                }
              });

              return (
                <div 
                  key={org.id} 
                  className="bg-gray-50 rounded-xl p-4 border border-gray-200/50 space-y-3 hover:border-amber-300 transition"
                >
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold uppercase font-mono bg-gray-200/60 px-2 py-0.5 rounded text-gray-600 block w-max">
                      Ready Bulk Action
                    </span>
                    <h4 className="font-bold text-gray-900 text-xs truncate" title={org.name}>
                      {org.name}
                    </h4>
                    <p className="text-[11px] text-gray-400 truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" /> {org.address}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="bg-white p-2 rounded-lg border border-gray-100">
                      <span className="text-[9px] uppercase font-mono text-gray-400">Meals Ready</span>
                      <p className="font-black text-amber-700">{scheduledLunchCount} Lunch</p>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-gray-100">
                      <span className="text-[9px] uppercase font-mono text-gray-400">Meals Ready</span>
                      <p className="font-black text-amber-700">{scheduledDinnerCount} Dinner</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <button
                      type="button"
                      disabled={scheduledLunchCount === 0 || isTodayUnserviceable}
                      onClick={() => handleBulkDeliver(org.id, 'lunch', org.name)}
                      className={`w-full text-[11px] font-bold py-1.5 rounded-lg transition text-center ${
                        scheduledLunchCount === 0 || isTodayUnserviceable
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-orange-600 text-white hover:bg-orange-700 cursor-pointer'
                      }`}
                    >
                      🚀 Bulk Deliver LUNCH
                    </button>

                    <button
                      type="button"
                      disabled={scheduledDinnerCount === 0 || isTodayUnserviceable}
                      onClick={() => handleBulkDeliver(org.id, 'dinner', org.name)}
                      className={`w-full text-[11px] font-bold py-1.5 rounded-lg transition text-center ${
                        scheduledDinnerCount === 0 || isTodayUnserviceable
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-orange-600 text-white hover:bg-orange-700 cursor-pointer'
                      }`}
                    >
                      🌙 Bulk Deliver DINNER
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Individual Checklist section */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider text-orange-950/60 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-orange-950/60" />
                Individual Customer Meal Checklist
              </h3>
              <p className="text-xs text-gray-400">
                Mark success status manually for customers who ordered.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex gap-2">
              <select
                value={selectedOrgFilter}
                onChange={(e) => setSelectedOrgFilter(e.target.value)}
                className="text-xs bg-[#FEF6EE] border border-gray-200 px-2 py-1 rounded"
              >
                <option value="all">All Organizations</option>
                {organizations.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search customers by name, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs px-9 py-2 bg-[#FEF6EE] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Checklist Loop */}
          <div className="space-y-3">
            {filteredCustomers.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No matching customers found for this day view.</p>
            ) : (
              filteredCustomers.map((user) => {
                const hasActiveSubscription = !!user.subscription?.active;
                const defaultMealStatus = isTodayUnserviceable ? 'cancelled' : (hasActiveSubscription ? 'ordered' : 'cancelled');

                const dayEntry: DailyMealStatus = user.dailyMeals[simulatedDate] || {
                  date: simulatedDate,
                  lunchStatus: defaultMealStatus,
                  dinnerStatus: defaultMealStatus,
                  lunchQty: 3,
                  dinnerQty: 3
                };

                const orgObj = organizations.find(o => o.id === user.organizationId);

                // Fetch physical targets
                const lunchAddressObj = user.addresses.find(a => a.id === user.lunchAddressId);
                const dinnerAddressObj = user.addresses.find(a => a.id === user.dinnerAddressId);

                // Check if user has active meals configured and they are currently locked-in (confirmed)
                const hasLunchActivity = isLunchLocked && dayEntry.lunchStatus !== 'cancelled';
                const hasDinnerActivity = isDinnerLocked && dayEntry.dinnerStatus !== 'cancelled';

                if (!hasLunchActivity && !hasDinnerActivity) {
                  return (
                    <div key={user.id} className="p-3 bg-gray-50/50 rounded-xl border border-gray-100 opacity-60 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-gray-700">{user.name}</p>
                        <p className="text-[10px] text-gray-400">No active meal subscription configurations scheduled today ({simulatedDate}).</p>
                      </div>
                      <span className="text-[10px] bg-gray-100 text-gray-400 font-bold px-2 py-0.5 rounded font-mono uppercase">Unscheduled</span>
                    </div>
                  );
                }

                return (
                  <div 
                    key={user.id}
                    className="p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition space-y-3"
                  >
                    {/* User identifier row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-gray-100 pb-2">
                      <div>
                        <span className="text-xs font-black text-gray-900 block sm:inline-block mr-2">{user.name}</span>
                        <span className="text-[10px] bg-[#FDF8F5] text-[#5C1B1B] font-semibold px-2 py-0.5 rounded">
                          🏡 Credits left: {user.credits}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 flex flex-wrap items-center gap-2">
                        {orgObj && (
                          <span className="flex items-center gap-1 bg-amber-50 text-amber-900 px-2 py-0.2 rounded font-medium">
                            🏢 {orgObj.name}
                          </span>
                        )}
                        <span>☎️ {user.phone}</span>
                      </div>
                    </div>

                    {/* Meal checklist sub-cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      
                      {/* Lunch segment */}
                      {hasLunchActivity && (
                        <div className="bg-[#FEF6EE] p-2.5 rounded-lg border border-[#E4D6CD]/60 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-[10px] uppercase text-orange-700 tracking-wider font-mono">
                              🍱 LUNCH PACK ({dayEntry.lunchQty ?? 3} Packs)
                            </span>
                            
                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                              dayEntry.lunchStatus === 'delivered' 
                                ? 'bg-orange-100 text-orange-800' 
                                : dayEntry.lunchStatus === 'paused' 
                                ? 'bg-orange-100 text-orange-900' 
                                : 'bg-indigo-100 text-indigo-900'
                            }`}>
                              {dayEntry.lunchStatus}
                            </span>
                          </div>

                          <div className="text-[11px] text-gray-500">
                            <b>Location:</b> {lunchAddressObj ? `${lunchAddressObj.label}: ${lunchAddressObj.addressLine}` : 'Unassigned address - Contact system.'}
                          </div>

                          {/* Control actions */}
                          <div className="pt-2 border-t border-[#E4D6CD]/40 flex justify-between gap-2.5">
                            {dayEntry.lunchStatus === 'paused' ? (
                              <span className="text-[10px] text-orange-600 font-bold block bg-orange-50 px-2 py-1 rounded w-full text-center">
                                ⏸️ Paused (Skipped / Disabled)
                              </span>
                            ) : (
                              <div className="flex w-full gap-1">
                                <button
                                  type="button"
                                  disabled={dayEntry.lunchStatus === 'delivered' || isTodayUnserviceable}
                                  onClick={() => handleIndividualDeliver(user.id, 'lunch', user.name)}
                                  className={`flex-1 text-[10px] font-bold py-1 rounded ${
                                    dayEntry.lunchStatus === 'delivered' || isTodayUnserviceable
                                      ? 'bg-slate-200 text-orange-950/60'
                                      : 'bg-orange-600 text-white hover:bg-orange-700 cursor-pointer'
                                  }`}
                                >
                                  Mark Delivered
                                </button>
                                <button
                                  type="button"
                                  disabled={dayEntry.lunchStatus === 'not_delivered' || isTodayUnserviceable}
                                  onClick={() => handleIndividualFail(user.id, 'lunch', user.name)}
                                  className={`flex-1 text-[10px] font-bold py-1 rounded ${
                                    dayEntry.lunchStatus === 'not_delivered' || isTodayUnserviceable
                                      ? 'bg-slate-200 text-orange-950/60'
                                      : 'bg-rose-600 text-white hover:bg-rose-700 cursor-pointer'
                                  }`}
                                >
                                  Failed
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Dinner segment */}
                      {hasDinnerActivity && (
                        <div className="bg-[#FEF6EE] p-2.5 rounded-lg border border-[#E4D6CD]/60 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-[10px] uppercase text-indigo-700 tracking-wider font-mono">
                              🌙 DINNER PACK ({dayEntry.dinnerQty ?? 3} Packs)
                            </span>

                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                              dayEntry.dinnerStatus === 'delivered' 
                                ? 'bg-orange-100 text-orange-800' 
                                : dayEntry.dinnerStatus === 'paused' 
                                ? 'bg-orange-100 text-orange-900'
                                : 'bg-indigo-100 text-indigo-900'
                            }`}>
                              {dayEntry.dinnerStatus}
                            </span>
                          </div>

                          <div className="text-[11px] text-gray-500">
                            <b>Location:</b> {dinnerAddressObj ? `${dinnerAddressObj.label}: ${dinnerAddressObj.addressLine}` : 'Unassigned address - Contact system.'}
                          </div>

                          {/* Control actions */}
                          <div className="pt-2 border-t border-[#E4D6CD]/40 flex justify-between gap-2.5">
                            {dayEntry.dinnerStatus === 'paused' ? (
                              <span className="text-[10px] text-orange-600 font-bold block bg-orange-50 px-2 py-1 rounded w-full text-center">
                                ⏸️ Paused (Skipped / Disabled)
                              </span>
                            ) : (
                              <div className="flex w-full gap-1">
                                <button
                                  type="button"
                                  disabled={dayEntry.dinnerStatus === 'delivered' || isTodayUnserviceable}
                                  onClick={() => handleIndividualDeliver(user.id, 'dinner', user.name)}
                                  className={`flex-1 text-[10px] font-bold py-1 rounded ${
                                    dayEntry.dinnerStatus === 'delivered' || isTodayUnserviceable
                                      ? 'bg-slate-200 text-orange-950/60'
                                      : 'bg-orange-600 text-white hover:bg-orange-700 cursor-pointer'
                                  }`}
                                >
                                  Mark Delivered
                                </button>
                                <button
                                  type="button"
                                  disabled={dayEntry.dinnerStatus === 'not_delivered' || isTodayUnserviceable}
                                  onClick={() => handleIndividualFail(user.id, 'dinner', user.name)}
                                  className={`flex-1 text-[10px] font-bold py-1 rounded ${
                                    dayEntry.dinnerStatus === 'not_delivered' || isTodayUnserviceable
                                      ? 'bg-slate-200 text-orange-950/60'
                                      : 'bg-rose-600 text-white hover:bg-rose-700 cursor-pointer'
                                  }`}
                                >
                                  Failed
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
