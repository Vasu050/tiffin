import React, { useState, useEffect } from 'react';
import { useApp, isSunday } from '../context/AppContext';
import { Role, MealType } from '../types';
import { 
  Shield, Users, Building, Plus, Calendar, AlertTriangle, 
  Sparkles, CheckCircle2, RefreshCw, Layers
} from 'lucide-react';

export default function DashboardAdmin() {
  const { 
    users, organizations, unserviceableDays, transactions, simulatedDate,
    addOrganization, addUserToOrganization, activateSubscription, toggleUnserviceableDay, logout, addCredits, updateUserRole
  } = useApp();

  // Role Management State
  const [selectedUserRoleId, setSelectedUserRoleId] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>(Role.USER);
  const [roleChangeSuccessMsg, setRoleChangeSuccessMsg] = useState('');
  const [selectedUserSubId, setSelectedUserSubId] = useState('');
  const [subStartDate, setSubStartDate] = useState(simulatedDate);
  const [subMealType, setSubMealType] = useState<MealType>('both');
  const [subSuccessMsg, setSubSuccessMsg] = useState('');

  // Ad-hoc funding states
  const [selectedUserManualId, setSelectedUserManualId] = useState('');
  const [manualCreditAmount, setManualCreditAmount] = useState<number | ''>('');
  const [manualCreditReason, setManualCreditReason] = useState('');
  const [manualSuccessMsg, setManualSuccessMsg] = useState('');

  // Organization states
  const [selectedUserOrgId, setSelectedUserOrgId] = useState('');
  const [selectedAssignOrgId, setSelectedAssignOrgId] = useState('');
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgAddress, setNewOrgAddress] = useState('');

  // Serviceability calendar states
  const [newUnservDate, setNewUnservDate] = useState('');
  const [newUnservReason, setNewUnservReason] = useState('');

  // Live Subscription math preview states
  const [mathPreview, setMathPreview] = useState({
    totalDays: 0,
    sundaysCount: 0,
    customUnservCount: 0,
    serviceableCount: 0,
    computedCredits: 0,
    endDate: ''
  });

  const customers = users.filter(u => u.role === Role.USER);

  // Auto-run math preview for the admin form
  useEffect(() => {
    if (!subStartDate) return;

    // Start date calculation
    const startObj = new Date(subStartDate);
    const endObj = new Date(startObj);
    endObj.setMonth(startObj.getMonth() + 1);
    endObj.setDate(endObj.getDate() - 1); // 1 month window inclusive

    const y = endObj.getFullYear();
    const m = String(endObj.getMonth() + 1).padStart(2, '0');
    const d = String(endObj.getDate()).padStart(2, '0');
    const formattedEnd = `${y}-${m}-${d}`;

    // Loop dates to count
    let totalDays = 0;
    let sundaysCount = 0;
    let customUnservCount = 0;
    let serviceableCount = 0;

    const current = new Date(startObj);
    const customUnservStrList = unserviceableDays.map(ud => ud.date);

    while (current <= endObj) {
      totalDays++;
      const yStr = current.getFullYear();
      const mStr = String(current.getMonth() + 1).padStart(2, '0');
      const dStr = String(current.getDate()).padStart(2, '0');
      const dateStr = `${yStr}-${mStr}-${dStr}`;

      const isSun = isSunday(dateStr);
      const isCustomUnserv = customUnservStrList.includes(dateStr);

      if (isSun) {
        sundaysCount++;
      } else if (isCustomUnserv) {
        customUnservCount++;
      } else {
        serviceableCount++;
      }

      current.setDate(current.getDate() + 1);
    }

    const multiplier = subMealType === 'both' ? 2 : 1;
    const computedCredits = serviceableCount * multiplier;

    setMathPreview({
      totalDays,
      sundaysCount,
      customUnservCount,
      serviceableCount,
      computedCredits,
      endDate: formattedEnd
    });
  }, [subStartDate, subMealType, unserviceableDays]);

  // Handle Form Submissions
  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName || !newOrgAddress) return;
    addOrganization(newOrgName, newOrgAddress);
    setNewOrgName('');
    setNewOrgAddress('');
  };

  const handleAssignUserOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserOrgId || !selectedAssignOrgId) return;
    addUserToOrganization(selectedUserOrgId, selectedAssignOrgId);
    setSelectedUserOrgId('');
  };

  const handleActivateSubscriptionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserSubId || !subStartDate) return;
    
    activateSubscription(selectedUserSubId, subStartDate, subMealType);
    
    const userObj = users.find(u => u.id === selectedUserSubId);
    setSubSuccessMsg(`Successfully activated 1-Month Subscription for ${userObj?.name}! Added ${mathPreview.computedCredits} credits.`);
    setTimeout(() => setSubSuccessMsg(''), 6000);
  };

  const handleManualCreditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserManualId || !manualCreditAmount || manualCreditAmount <= 0) return;
    
    addCredits(selectedUserManualId, Number(manualCreditAmount), manualCreditReason);
    
    const userObj = users.find(u => u.id === selectedUserManualId);
    setManualSuccessMsg(`Funded ${manualCreditAmount} credits to ${userObj?.name}.`);
    
    // reset
    setManualCreditAmount('');
    setManualCreditReason('');
    
    setTimeout(() => setManualSuccessMsg(''), 6000);
  };

  const handleToggleUnserviceableDay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnservDate || !newUnservReason) return;
    toggleUnserviceableDay(newUnservDate, newUnservReason);
    setNewUnservDate('');
    setNewUnservReason('');
  };

  const handleUpdateUserRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserRoleId || !selectedRole) return;
    updateUserRole(selectedUserRoleId, selectedRole);
    const userObj = users.find(u => u.id === selectedUserRoleId);
    setRoleChangeSuccessMsg(`Successfully changed ${userObj?.name}'s role to ${selectedRole}.`);
    setSelectedUserRoleId('');
    setTimeout(() => setRoleChangeSuccessMsg(''), 6000);
  };

  // System Stats calculations
  const totalSubscribersCount = customers.filter(u => u.subscription?.active).length;
  const totalLunchOrders = transactions.filter(t => t.type === 'debit' && (t.description.toLowerCase().includes('delivered lunch') || t.description.toLowerCase().includes('order single lunch'))).length;
  const totalDinnerOrders = transactions.filter(t => t.type === 'debit' && (t.description.toLowerCase().includes('delivered dinner') || t.description.toLowerCase().includes('order single dinner'))).length;
  const totalTiffinOrders = transactions.filter(t => t.type === 'debit' && t.description.toLowerCase().includes('deliver')).length;

  // Check if today is unserviceable
  const todayIsSunday = new Date(simulatedDate).getDay() === 0;
  const customUnservDayObj = unserviceableDays.find(d => d.date === simulatedDate);
  const isTodayUnserviceable = todayIsSunday || !!customUnservDayObj;

  // Meal types count scheduled for today
  let todayLunchCount = 0;
  let todayDinnerCount = 0;

  customers.forEach(u => {
    const hasActiveSubscription = !!u.subscription?.active;
    const defaultMealStatus = isTodayUnserviceable ? 'cancelled' : (hasActiveSubscription ? 'ordered' : 'cancelled');

    const dailyEntry = u.dailyMeals[simulatedDate] || {
      date: simulatedDate,
      lunchStatus: defaultMealStatus,
      dinnerStatus: defaultMealStatus,
      lunchQty: 3,
      dinnerQty: 3
    };

    const lQty = dailyEntry.lunchQty ?? 3;
    const dQty = dailyEntry.dinnerQty ?? 3;

    if (dailyEntry.lunchStatus === 'ordered' || dailyEntry.lunchStatus === 'scheduled' || dailyEntry.lunchStatus === 'delivered') {
      todayLunchCount += lQty;
    }

    if (dailyEntry.dinnerStatus === 'ordered' || dailyEntry.dinnerStatus === 'scheduled' || dailyEntry.dinnerStatus === 'delivered') {
      todayDinnerCount += dQty;
    }
  });

  return (
    <div id="admin-dashboard-root" className="w-full max-w-4xl mx-auto py-4 px-3 sm:px-6 space-y-8">
      
      {/* Upper Admin Header Badge */}
      <div className="bg-gradient-to-r from-orange-950 to-[#3B120B] border border-[#4A1C14] text-white p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-orange-500 text-slate-950 rounded-2xl shadow-lg shadow-orange-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-orange-400/20 text-orange-300 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                System Administrator Authority
              </span>
              <span className="text-xs text-orange-950/60 font-mono">Simulated date: {simulatedDate}</span>
            </div>
            <h2 className="text-lg font-black text-white tracking-tight">Tiffin Operational Console</h2>
            <p className="text-xs text-orange-950/60">Configure global service rosters, setup corporate locations, and fund customer accounts.</p>
          </div>
        </div>

        <button 
          onClick={logout}
          className="text-xs font-bold text-orange-100/90 hover:text-white bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg transition"
        >
          Sign Out
        </button>
      </div>

      {/* Grid of System Metrics Gauges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
          <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider block">All Customers</span>
          <p className="text-2xl font-black text-[#3B1910] mt-1">{customers.length}</p>
          <span className="text-[10px] text-orange-600 font-medium">Registered Users</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center font-sans">
          <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider block">Active Licenses</span>
          <p className="text-2xl font-black text-indigo-700 mt-1">{totalSubscribersCount}</p>
          <span className="text-[10px] text-indigo-600 font-medium">1-Month Contracts</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
          <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider block">Total Tiffin Orders</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{totalTiffinOrders}</p>
          <span className="text-[10px] text-emerald-600 font-medium">L: {totalLunchOrders} · D: {totalDinnerOrders}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
          <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider block text-center">Roster Pack Today</span>
          <div className="flex justify-around items-center mt-1 text-xs">
            <div>
              <p className="font-extrabold text-orange-600 text-center">{todayLunchCount}</p>
              <span className="text-[9px] text-orange-950/60 block text-center font-semibold">Lunch</span>
            </div>
            <div className="h-4 w-px bg-gray-200" />
            <div>
              <p className="font-extrabold text-indigo-600 text-center">{todayDinnerCount}</p>
              <span className="text-[9px] text-orange-950/60 block text-center font-semibold">Dinner</span>
            </div>
          </div>
        </div>
      </div>

      {/* Core Admin Control segments split row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* SECTION A: 1-MONTH SUBSCRIPTION PROVISIONER */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider font-mono text-orange-950/60 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-orange-950/60" />
              1-Month Subscription Provisioner
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Activate a standard 1-Month subscription for a user. The algorithm computes exact serviceable delivery days, excluding Sundays and any custom non-serviceable windows, then deposits computed credits instantly.
            </p>
          </div>

          <form onSubmit={handleActivateSubscriptionSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">
                Select Customer Target
              </label>
              <select
                required
                value={selectedUserSubId}
                onChange={(e) => setSelectedUserSubId(e.target.value)}
                className="w-full text-xs bg-[#FEF6EE] border border-gray-200 px-3 py-2 rounded-xl text-gray-800"
              >
                <option value="">-- Choose User --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} • {c.email} (Balance: {c.credits} cr)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">
                  Contract Start Date
                </label>
                <input
                  type="date"
                  required
                  value={subStartDate}
                  onChange={(e) => setSubStartDate(e.target.value)}
                  className="w-full text-xs bg-[#FEF6EE] border border-gray-200 px-3 py-1.5 rounded-xl text-gray-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">
                  Rations Category
                </label>
                <select
                  value={subMealType}
                  onChange={(e) => setSubMealType(e.target.value as MealType)}
                  className="w-full text-xs bg-[#FEF6EE] border border-gray-200 px-3 py-1.5 rounded-xl text-gray-800"
                >
                  <option value="both">Both (Lunch & Dinner)</option>
                  <option value="lunch">Lunch Only</option>
                  <option value="dinner">Dinner Only</option>
                </select>
              </div>
            </div>

            {/* Live Algorithm Math Breakdowns Panel */}
            <div className="bg-[#FEF6EE] border border-slate-100 rounded-xl p-4 text-xs space-y-2">
              <span className="text-[9px] uppercase font-bold text-gray-400 font-mono tracking-widest block">
                🧮 Automatic Credits Computation Math Preview
              </span>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-gray-800">
                <div className="bg-white p-2 rounded border border-gray-100">
                  <p className="font-mono text-xs font-semibold">{mathPreview.totalDays}</p>
                  <span className="text-[9px] text-gray-400 block font-medium">Total Days</span>
                </div>
                <div className="bg-white p-2 rounded border border-gray-100">
                  <p className="font-mono text-xs font-semibold text-rose-600">-{mathPreview.sundaysCount}</p>
                  <span className="text-[9px] text-gray-400 block font-medium">Sundays</span>
                </div>
                <div className="bg-white p-2 rounded border border-gray-100">
                  <p className="font-mono text-xs font-semibold text-rose-600">-{mathPreview.customUnservCount}</p>
                  <span className="text-[9px] text-gray-400 block font-medium">Non-Serv</span>
                </div>
                <div className="bg-white p-2 rounded border border-gray-100 bg-emerald-50">
                  <p className="font-mono text-xs font-black text-emerald-800">{mathPreview.serviceableCount}</p>
                  <span className="text-[9px] text-emerald-800 block font-medium">Working</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E4D6CD]/60 flex justify-between items-center bg-gray-10 block gap-2 text-[11px]">
                <p className="text-gray-500">
                  End Date calculated: <b className="font-mono text-gray-950 font-bold">{mathPreview.endDate}</b>
                </p>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Credited Balance Award</p>
                  <p className="font-extrabold text-orange-700 text-sm">{mathPreview.computedCredits} Meals</p>
                </div>
              </div>
            </div>

            {subSuccessMsg && (
              <p className="p-3 bg-orange-50 border border-orange-200 text-orange-800 text-xs rounded-xl font-medium">
                ✅ {subSuccessMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={!selectedUserSubId}
              className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-sm transition capitalize ${
                selectedUserSubId
                  ? 'bg-[#3B120B] border border-[#3B120B] text-white hover:bg-[#4A1C14] cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Activate & Fund Account Balance
            </button>
          </form>
        </div>

        {/* SECTION B: CORPORATE ORGANIZATIONS DISPATCH */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider font-mono text-orange-950/60 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-orange-950/60" />
              Corporate Dispatch & Organizations
            </h3>
            <p className="text-xs text-gray-400">
              Create central organizations representing offices, business centers, or residential towers. Drag/associate individuals into their matching campuses.
            </p>
          </div>

          <div className="space-y-4">
            
            {/* 1. Add Org Form */}
            <form onSubmit={handleCreateOrg} className="p-3 bg-gray-50 rounded-xl border border-gray-200/50 space-y-2">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block">Assemble Workspace</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Org Name (e.g., Salesforce Devs)"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  className="text-xs px-2.5 py-1.5 border border-gray-200 bg-white rounded-lg focus:outline-none"
                />
                <input
                  type="text"
                  required
                  placeholder="HQ Address (Noida Sector 40)"
                  value={newOrgAddress}
                  onChange={(e) => setNewOrgAddress(e.target.value)}
                  className="text-xs px-2.5 py-1.5 border border-gray-200 bg-white rounded-lg focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-1.5 text-xs font-bold bg-white border rounded hover:bg-[#FDF8F5] transition duration-150 cursor-pointer text-[#4A261D]"
              >
                Create Hub Location
              </button>
            </form>

            {/* 2. Assign User Form */}
            <form onSubmit={handleAssignUserOrg} className="p-3 bg-gray-50 rounded-xl border border-gray-200/50 space-y-2">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block">Add Users to Organization</span>
              
              <div className="grid grid-cols-2 gap-2">
                <select
                  required
                  value={selectedUserOrgId}
                  onChange={(e) => setSelectedUserOrgId(e.target.value)}
                  className="text-xs bg-white border border-gray-200 px-2 py-1.5 rounded-lg text-gray-800"
                >
                  <option value="">-- Customer --</option>
                  {customers.map(c => {
                    const matchedOrg = organizations.find(o => o.id === c.organizationId);
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} {matchedOrg ? `(${matchedOrg.name})` : ''}
                      </option>
                    );
                  })}
                </select>

                <select
                  required
                  value={selectedAssignOrgId}
                  onChange={(e) => setSelectedAssignOrgId(e.target.value)}
                  className="text-xs bg-white border border-gray-200 px-2 py-1.5 rounded-lg text-gray-800"
                >
                  <option value="">-- Select Org --</option>
                  {organizations.map(o => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-1.5 text-xs font-bold bg-[#3B120B] hover:bg-[#4A1C14] text-white rounded transition"
              >
                Assign Customer Location
              </button>
            </form>

          </div>
        </div>

      </div>

      {/* SECTION B.5: MANUAL AD-HOC WALLET FUNDING */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
        <div>
          <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider font-mono text-orange-950/60 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-orange-950/60" />
            Ad-Hoc / Custom Credit Addition
          </h3>
          <p className="text-xs text-gray-400">
            Manually add tiffin credits for customized 4-day, 8-day, or one-time orders beyond standard subscriptions.
          </p>
        </div>

        <form onSubmit={handleManualCreditSubmit} className="space-y-3.5 flex flex-col md:flex-row items-start md:items-end gap-3">
          <div className="flex-1 w-full">
            <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">
              Select Customer
            </label>
            <select
              required
              value={selectedUserManualId}
              onChange={(e) => setSelectedUserManualId(e.target.value)}
              className="w-full text-xs bg-[#FEF6EE] border border-gray-200 px-3 py-2 rounded-xl text-gray-800"
            >
              <option value="">-- Choose User --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} (Balance: {c.credits} cr)
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-28">
            <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">
              Credits
            </label>
            <input
              type="number"
              min="1"
              required
              value={manualCreditAmount}
              onChange={(e) => setManualCreditAmount(e.target.value ? Number(e.target.value) : '')}
              className="w-full text-xs bg-[#FEF6EE] border border-gray-200 px-3 py-2 rounded-xl text-gray-800"
              placeholder="e.g. 4"
            />
          </div>

          <div className="flex-1 w-full">
            <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              value={manualCreditReason}
              onChange={(e) => setManualCreditReason(e.target.value)}
              className="w-full text-xs bg-[#FEF6EE] border border-gray-200 px-3 py-2 rounded-xl text-gray-800"
              placeholder="e.g. Paid for 4 days extra"
            />
          </div>

          <button
            type="submit"
            disabled={!selectedUserManualId}
            className={`w-full md:w-auto py-2 px-6 rounded-xl font-bold text-xs shadow-sm transition whitespace-nowrap ${
              selectedUserManualId
                ? 'bg-[#8B2A2A] border border-[#8B2A2A] text-white hover:bg-[#A33636]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Add Credits
          </button>
        </form>
        {manualSuccessMsg && (
          <p className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium">
            ✅ {manualSuccessMsg}
          </p>
        )}
      </div>

      {/* SECTION C: SERVICEABILITY CALENDAR MARKER */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
        <div>
          <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider font-mono text-orange-950/60 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-orange-950/60" />
            Roster & Non-Serviceability Calendar
          </h3>
          <p className="text-xs text-gray-400">
            Every Sunday is unserviceable by default. You can configure custom dates as non-serviceable (e.g., Holidays, Extreme Weather, Monsoon Strikes).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Form to Toggle Date */}
          <form onSubmit={handleToggleUnserviceableDay} className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 space-y-3">
            <h4 className="text-xs font-bold text-rose-950 uppercase tracking-widest font-mono">Flag Day as Unserviceable</h4>
            
            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-gray-500 mb-0.5">Choose Calendar Date</label>
                <input
                  type="date"
                  required
                  value={newUnservDate}
                  onChange={(e) => setNewUnservDate(e.target.value)}
                  className="w-full text-xs p-2 bg-white border rounded focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-500 mb-0.5">Specify Log Cause</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Heavy Rain Warning or Holiday"
                  value={newUnservReason}
                  onChange={(e) => setNewUnservReason(e.target.value)}
                  className="w-full text-xs p-2 bg-white border rounded focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full text-xs font-bold py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition"
            >
              Toggle Serviceability
            </button>
          </form>

          {/* List of unserviceable dates */}
          <div className="md:col-span-2 space-y-2">
            <h4 className="text-xs font-extrabold text-gray-400 font-mono uppercase tracking-wider">Unserviceable Registry</h4>
            
            <div className="max-h-[180px] overflow-y-auto space-y-1.5 pr-1 text-xs">
              <div className="p-2.5 bg-gray-50 rounded border border-gray-200 text-[11px] text-gray-500">
                ℹ️ Standard Sunday Filter: Active (Excludes delivery calculations recursively).
              </div>

              {unserviceableDays.map((uDay) => (
                <div 
                  key={uDay.date}
                  className="p-3 bg-rose-50 border border-rose-100 text-rose-950 rounded-xl flex justify-between items-center text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-rose-900 block font-mono">{uDay.date}</span>
                    <span className="text-[11px] block italic text-rose-800">Reason: "{uDay.reason}"</span>
                  </div>

                  <button
                    onClick={() => toggleUnserviceableDay(uDay.date, 'restored')}
                    className="text-[10px] font-bold bg-white text-rose-800 hover:bg-rose-100 font-sans px-2.5 py-1 rounded border border-rose-200 transition cursor-pointer"
                  >
                    Restore Service
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* --- ADD NEW SECTION: Role Management --- */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mt-8 space-y-6">
        <div>
          <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider font-mono text-indigo-950/60 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-950/60" />
            System Role Management
          </h3>
          <p className="text-xs text-gray-400">
            Promote or demote users to different permission tiers (User, Delivery, Admin).
          </p>
        </div>

        <form onSubmit={handleUpdateUserRole} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Target User Profile
              </label>
              <select
                required
                value={selectedUserRoleId}
                onChange={(e) => setSelectedUserRoleId(e.target.value)}
                className="w-full text-xs p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="" disabled>Search profiles by name/email...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email}) - Current: {u.role}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                New System Role
              </label>
              <select
                required
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as Role)}
                className="w-full text-xs p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={Role.USER}>Standard Customer</option>
                <option value={Role.DELIVERY}>Delivery Agent</option>
                <option value={Role.ADMIN}>System Administrator</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full text-xs font-bold py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
          >
            Update Profile Role Permisions
          </button>
          
          {roleChangeSuccessMsg && (
            <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 p-2 rounded-lg text-center border border-emerald-100">
              {roleChangeSuccessMsg}
            </p>
          )}
        </form>
      </div>

    </div>
  );
}
