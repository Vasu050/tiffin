import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Role, User, Organization, Transaction, Notification, UnserviceableDay, DailyMealStatus, OrderStatus, MealType, Address } from '../types';
import { collection, doc, onSnapshot, updateDoc, setDoc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AppContextType {
  users: User[];
  usersLoaded: boolean;
  organizations: Organization[];
  unserviceableDays: UnserviceableDay[];
  transactions: Transaction[];
  notifications: Notification[];
  currentUser: User | null;
  simulatedDate: string;
  setSimulatedDate: (date: string) => void;
  login: (email: string) => Promise<boolean>;
  register: (name: string, email: string, phone: string) => Promise<boolean>;
  logout: () => void;
  updateUserRole: (userId: string, role: Role) => void;
  addOrganization: (name: string, address: string) => void;
  addUserToOrganization: (userId: string, orgId: string) => void;
  activateSubscription: (userId: string, startDateStr: string, mealType: MealType) => void;
  togglePauseMeal: (userId: string, date: string, meal: 'lunch' | 'dinner', shouldPause: boolean) => void;
  adjustMealQuantity: (userId: string, date: string, meal: 'lunch' | 'dinner', qty: number) => void;
  markMealDelivery: (userId: string, date: string, meal: 'lunch' | 'dinner', status: OrderStatus) => Promise<void>;
  deliverOrganizationMeals: (orgId: string, date: string, meal: 'lunch' | 'dinner') => void;
  toggleUnserviceableDay: (date: string, reason: string) => void;
  addAddress: (userId: string, label: string, addressLine: string, phone: string) => void;
  updateUserAddresses: (userId: string, lunchAddrId: string, dinnerAddrId: string) => void;
  addNotification: (title: string, message: string, userId?: string | null) => void;
  clearNotifications: () => void;
  addCredits: (userId: string, amount: number, description: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const isSunday = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  return date.getDay() === 0;
};

export const calculateDateRange = (startDateStr: string): { start: string; end: string; dates: string[] } => {
  const dates: string[] = [];
  const start = new Date(startDateStr);
  
  const end = new Date(start);
  end.setMonth(start.getMonth() + 1);
  end.setDate(end.getDate() - 1);

  const current = new Date(start);
  while (current <= end) {
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
    current.setDate(current.getDate() + 1);
  }

  const y1 = start.getFullYear();
  const m1 = String(start.getMonth() + 1).padStart(2, '0');
  const d1 = String(start.getDate()).padStart(2, '0');

  const y2 = end.getFullYear();
  const m2 = String(end.getMonth() + 1).padStart(2, '0');
  const d2 = String(end.getDate()).padStart(2, '0');

  return {
    start: `${y1}-${m1}-${d1}`,
    end: `${y2}-${m2}-${d2}`,
    dates
  };
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [unserviceableDays, setUnserviceableDays] = useState<UnserviceableDay[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [simulatedDate, setSimulatedDateState] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  // DB Syncer
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), snap => {
      const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as User));
      setUsers(data);
      setUsersLoaded(true);
      if (currentUser) {
        const updatedSelf = data.find(u => u.id === currentUser.id);
        if (updatedSelf && JSON.stringify(updatedSelf) !== JSON.stringify(currentUser)) {
          setCurrentUser(updatedSelf);
        }
      }
    });

    const unsubOrgs = onSnapshot(collection(db, 'organizations'), snap => {
      setOrganizations(snap.docs.map(d => ({ ...d.data(), id: d.id } as Organization)));
    });

    const unsubTx = onSnapshot(collection(db, 'transactions'), snap => {
      setTransactions(snap.docs.map(d => ({ ...d.data(), id: d.id } as Transaction)).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });

    const unsubNotif = onSnapshot(collection(db, 'notifications'), snap => {
      setNotifications(snap.docs.map(d => ({ ...d.data(), id: d.id } as Notification)).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    });

    const unsubDays = onSnapshot(collection(db, 'unserviceableDays'), snap => {
      setUnserviceableDays(snap.docs.map(d => ({ ...d.data(), id: d.id } as unknown as UnserviceableDay)));
    });

    return () => {
      unsubUsers(); unsubOrgs(); unsubTx(); unsubNotif(); unsubDays();
    };
  }, [currentUser]);

  // Handle local persistence of current session + simulated clock
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('tiffin_current_user_id', currentUser.id);
    } else {
      localStorage.removeItem('tiffin_current_user_id');
    }
  }, [currentUser]);

  useEffect(() => {
    const savedId = localStorage.getItem('tiffin_current_user_id');
    if (savedId && !currentUser && users.length > 0) {
      const match = users.find(u => u.id === savedId);
      if (match) setCurrentUser(match);
    }
  }, [users, currentUser]);


  const setSimulatedDate = (date: string) => {
    setSimulatedDateState(date);
    // localStorage.setItem('tiffin_simulated_date', date);
  };

  const addNotification = async (title: string, message: string, userId?: string | null) => {
    const newNotif = {
      userId: userId || null,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false
    };
    await setDoc(doc(collection(db, 'notifications')), newNotif);
  };

  const clearNotifications = async () => {
    const batch = writeBatch(db);
    notifications.forEach(n => batch.delete(doc(db, 'notifications', n.id)));
    await batch.commit();
  };

  const login = async (email: string): Promise<boolean> => {
    const formattedEmail = email.toLowerCase().trim();
    const userToLogin = users.find(u => u.email.toLowerCase() === formattedEmail);
    if (userToLogin) {
      setCurrentUser(userToLogin);
      return true;
    }

    if (formattedEmail === 'admin@tiffin.com') {
      if (!usersLoaded) {
        console.info(`Account data still syncing, using built-in profile for ${formattedEmail}.`);
      }

      const newUser: User = {
        id: 'u_admin',
        email: formattedEmail,
        name: 'System Administrator',
        phone: '+91 88888 88888',
        role: Role.ADMIN,
        credits: 0,
        addresses: [],
        dailyMeals: {}
      };

      await setDoc(doc(db, 'users', newUser.id), newUser);
      setCurrentUser(newUser);
      return true;
    }

    return false;
  };

  const register = async (name: string, email: string, phone: string): Promise<boolean> => {
    const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) return false;

    const newRef = doc(collection(db, 'users'));
    const newUser: User = {
      id: newRef.id,
      email,
      name,
      phone,
      role: Role.USER, // default role
      credits: 0,
      addresses: [
        { id: 'addr_' + Date.now(), label: 'Home Base', addressLine: 'Enter Your Primary Delivery Address', phone }
      ],
      dailyMeals: {},
    };

    await setDoc(newRef, newUser);
    setCurrentUser(newUser);
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const addOrganization = async (name: string, address: string) => {
    await setDoc(doc(collection(db, 'organizations')), { name, address });
  };

  const updateUserRole = async (userId: string, role: Role) => {
    await updateDoc(doc(db, 'users', userId), { role });
  };

  const addUserToOrganization = async (userId: string, orgId: string) => {
    await updateDoc(doc(db, 'users', userId), { organizationId: orgId });
  };

  const activateSubscription = async (userId: string, startDateStr: string, mealType: MealType) => {
    const targetUser = users.find(u => u.id === userId);
    if(!targetUser) return;

    const startDate = new Date(startDateStr);
    const endDate = new Date(startDate);
    endDate.setMonth(startDate.getMonth() + 1);
    endDate.setDate(endDate.getDate() - 1); 

    const yStart = startDate.getFullYear();
    const mStart = String(startDate.getMonth() + 1).padStart(2, '0');
    const dStart = String(startDate.getDate()).padStart(2, '0');
    const formattedStart = `${yStart}-${mStart}-${dStart}`;

    const yEnd = endDate.getFullYear();
    const mEnd = String(endDate.getMonth() + 1).padStart(2, '0');
    const dEnd = String(endDate.getDate()).padStart(2, '0');
    const formattedEnd = `${yEnd}-${mEnd}-${dEnd}`;

    const dates: string[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      const yStr = current.getFullYear();
      const mStr = String(current.getMonth() + 1).padStart(2, '0');
      const dStr = String(current.getDate()).padStart(2, '0');
      dates.push(`${yStr}-${mStr}-${dStr}`);
      current.setDate(current.getDate() + 1);
    }

    let serviceableCount = 0;
    const filterUnserv = unserviceableDays.map(d => d.date);

    dates.forEach(dateStr => {
      const isSun = isSunday(dateStr);
      const isCustomUnserv = filterUnserv.includes(dateStr);
      if (!isSun && !isCustomUnserv) {
        serviceableCount++;
      }
    });

    const multiplier = mealType === 'both' ? 2 : 1;
    const computedCredits = serviceableCount * multiplier;

    const newDailyMeals = { ...targetUser.dailyMeals };

    dates.forEach(dStr => {
      const isSun = isSunday(dStr);
      const isCustomUnserv = filterUnserv.includes(dStr);
      
      const isDayUnserviceable = isSun || isCustomUnserv;
      const statusVal: OrderStatus = isDayUnserviceable ? 'cancelled' : 'ordered';

      if (!newDailyMeals[dStr]) {
        newDailyMeals[dStr] = {
          date: dStr,
          lunchStatus: mealType === 'both' || mealType === 'lunch' ? statusVal : 'cancelled',
          dinnerStatus: mealType === 'both' || mealType === 'dinner' ? statusVal : 'cancelled',
        };
      } else {
        const dayEntry = newDailyMeals[dStr];
        if (mealType === 'both' || mealType === 'lunch') {
          if (dayEntry.lunchStatus !== 'paused') {
            dayEntry.lunchStatus = statusVal;
          }
        }
        if (mealType === 'both' || mealType === 'dinner') {
          if (dayEntry.dinnerStatus !== 'paused') {
            dayEntry.dinnerStatus = statusVal;
          }
        }
      }
    });

    const batch = writeBatch(db);
    batch.update(doc(db, 'users', userId), {
      credits: targetUser.credits + computedCredits,
      subscription: {
        active: true,
        mealType,
        startDate: formattedStart,
        endDate: formattedEnd,
        totalCreditsAdded: computedCredits
      },
      dailyMeals: newDailyMeals
    });

    const newTx = {
      userId: targetUser.id,
      userName: targetUser.name,
      date: new Date().toISOString(),
      type: 'credit',
      amount: computedCredits,
      description: `Activated 1 month ${mealType} subscription (${formattedStart} to ${formattedEnd}). ${serviceableCount} serviceable days.`
    };
    batch.set(doc(collection(db, 'transactions')), newTx);

    await batch.commit();
    addNotification('Subscription Activated', `Added ${computedCredits} credits!`, userId);
  };

  const togglePauseMeal = async (userId: string, date: string, meal: 'lunch' | 'dinner', shouldPause: boolean) => {
    const targetUser = users.find(u => u.id === userId);
    if(!targetUser) return;

    const isSun = isSunday(date);
    const isUnserv = unserviceableDays.some(d => d.date === date);
    const isDayUnserviceable = isSun || isUnserv;

    const currentDayEntry: DailyMealStatus = targetUser.dailyMeals[date] || {
      date,
      lunchStatus: 'ordered',
      dinnerStatus: 'ordered'
    };

    if (meal === 'lunch') {
      currentDayEntry.lunchStatus = shouldPause ? 'paused' : (isDayUnserviceable ? 'cancelled' : 'ordered');
    } else {
      currentDayEntry.dinnerStatus = shouldPause ? 'paused' : (isDayUnserviceable ? 'cancelled' : 'ordered');
    }

    await updateDoc(doc(db, 'users', userId), {
      [`dailyMeals.${date}`]: currentDayEntry
    });
  };

  const adjustMealQuantity = async (userId: string, date: string, meal: 'lunch' | 'dinner', qty: number) => {
    const targetUser = users.find(u => u.id === userId);
    if(!targetUser) return;

    const dayEntry = { ...(targetUser.dailyMeals[date] || {
      date, lunchStatus: 'ordered', dinnerStatus: 'ordered'
    }) };

    if (meal === 'lunch') {
      dayEntry.lunchQty = qty;
    } else {
      dayEntry.dinnerQty = qty;
    }

    await updateDoc(doc(db, 'users', userId), {
      [`dailyMeals.${date}`]: dayEntry
    });
  };

  const markMealDelivery = async (userId: string, date: string, meal: 'lunch' | 'dinner', status: OrderStatus) => {
    const targetUser = users.find(u => u.id === userId);
    if(!targetUser) return;

    const isSun = isSunday(date);
    const isUnserv = unserviceableDays.some(d => d.date === date);
    const isDayUnserviceable = isSun || isUnserv;

    const hasSubscriptionForLunch = targetUser.subscription?.active && ['both', 'lunch'].includes(targetUser.subscription.mealType);
    const hasSubscriptionForDinner = targetUser.subscription?.active && ['both', 'dinner'].includes(targetUser.subscription.mealType);

    const dayEntry = targetUser.dailyMeals[date] || {
      date,
      lunchStatus: isDayUnserviceable ? 'cancelled' : (hasSubscriptionForLunch ? 'ordered' : 'cancelled'),
      dinnerStatus: isDayUnserviceable ? 'cancelled' : (hasSubscriptionForDinner ? 'ordered' : 'cancelled')
    };
    const oldStatus = meal === 'lunch' ? dayEntry.lunchStatus : dayEntry.dinnerStatus;
    
    if (oldStatus === 'paused' || oldStatus === 'cancelled') return;

    let finalStatus = status;
    if (isDayUnserviceable) finalStatus = 'not_delivered';

    let creditsToChange = 0;
    let isDeliveredNow = finalStatus === 'delivered' && oldStatus !== 'delivered';
    let isUndoDelivery = finalStatus !== 'delivered' && oldStatus === 'delivered';

    if (isDeliveredNow && !isDayUnserviceable) creditsToChange = -1;
    else if (isUndoDelivery && !isDayUnserviceable) creditsToChange = 1;

    if (meal === 'lunch') {
      dayEntry.lunchStatus = finalStatus;
      if (finalStatus === 'delivered') dayEntry.lunchDeliveredAt = new Date().toLocaleTimeString();
    } else {
      dayEntry.dinnerStatus = finalStatus;
      if (finalStatus === 'delivered') dayEntry.dinnerDeliveredAt = new Date().toLocaleTimeString();
    }

    const batch = writeBatch(db);
    batch.update(doc(db, 'users', userId), {
      credits: targetUser.credits + creditsToChange,
      [`dailyMeals.${date}`]: dayEntry
    });

    if (creditsToChange !== 0) {
      batch.set(doc(collection(db, 'transactions')), {
        userId,
        userName: targetUser.name,
        date: new Date().toISOString(),
        type: creditsToChange < 0 ? 'debit' : 'credit',
        amount: Math.abs(creditsToChange),
        description: creditsToChange < 0
          ? `Delivered ${meal} on ${date} (Deducted 1 Credit)`
          : `Undone delivery of ${meal} on ${date} (Returned 1 Credit)`
      });
    }

    await batch.commit();
  };

  const deliverOrganizationMeals = async (orgId: string, date: string, meal: 'lunch' | 'dinner') => {
    const isSun = isSunday(date);
    const isUnserv = unserviceableDays.some(d => d.date === date);
    const isDayUnserviceable = isSun || isUnserv;
    if(isDayUnserviceable) return;

    const batch = writeBatch(db);
    
    for(const u of users) {
      if(u.organizationId === orgId) {
        const hasSubscriptionForLunch = u.subscription?.active && ['both', 'lunch'].includes(u.subscription.mealType);
        const hasSubscriptionForDinner = u.subscription?.active && ['both', 'dinner'].includes(u.subscription.mealType);

        const dayEntry = u.dailyMeals[date] ? { ...u.dailyMeals[date] } : {
          date,
          lunchStatus: isDayUnserviceable ? 'cancelled' as OrderStatus : (hasSubscriptionForLunch ? 'ordered' as OrderStatus : 'cancelled' as OrderStatus),
          dinnerStatus: isDayUnserviceable ? 'cancelled' as OrderStatus : (hasSubscriptionForDinner ? 'ordered' as OrderStatus : 'cancelled' as OrderStatus)
        };
        const oldStatus = meal === 'lunch' ? dayEntry.lunchStatus : dayEntry.dinnerStatus;

        if (oldStatus !== 'ordered' && oldStatus !== 'scheduled') continue;

        if (meal === 'lunch') {
          dayEntry.lunchStatus = 'delivered';
          dayEntry.lunchDeliveredAt = new Date().toLocaleTimeString();
        } else {
          dayEntry.dinnerStatus = 'delivered';
          dayEntry.dinnerDeliveredAt = new Date().toLocaleTimeString();
        }

        batch.update(doc(db, 'users', u.id), {
          credits: u.credits - 1,
          [`dailyMeals.${date}`]: dayEntry
        });

        batch.set(doc(collection(db, 'transactions')), {
          userId: u.id,
          userName: u.name,
          date: new Date().toISOString(),
          type: 'debit',
          amount: 1,
          description: `Delivered ${meal} bulk delivery (Deducted 1 Credit)`
        });
      }
    }
    
    await batch.commit();
  };

  const toggleUnserviceableDay = async (date: string, reason: string) => {
    const exists = unserviceableDays.find(d => d.date === date);
    const batch = writeBatch(db);
    
    if (exists) {
      batch.delete(doc(db, 'unserviceableDays', exists.id));

      users.forEach(u => {
        if (u.dailyMeals[date]) {
          const dayEntry = { ...u.dailyMeals[date] };
          let changed = false;
          if (dayEntry.lunchStatus === 'cancelled') { dayEntry.lunchStatus = 'ordered'; changed = true; }
          if (dayEntry.dinnerStatus === 'cancelled') { dayEntry.dinnerStatus = 'ordered'; changed = true; }
          
          if(changed) {
            batch.update(doc(db, 'users', u.id), { [`dailyMeals.${date}`]: dayEntry });
          }
        }
      });
    } else {
      batch.set(doc(collection(db, 'unserviceableDays')), { date, reason });

      users.forEach(u => {
        if (u.dailyMeals[date]) {
          const dayEntry = { ...u.dailyMeals[date] };
          let changed = false;
          if (dayEntry.lunchStatus === 'scheduled' || dayEntry.lunchStatus === 'ordered') {
            dayEntry.lunchStatus = 'cancelled';
            changed = true;
          }
          if (dayEntry.dinnerStatus === 'scheduled' || dayEntry.dinnerStatus === 'ordered') {
            dayEntry.dinnerStatus = 'cancelled';
            changed = true;
          }
          if(changed) {
            batch.update(doc(db, 'users', u.id), { [`dailyMeals.${date}`]: dayEntry });
          }
        }
      });
    }

    await batch.commit();
  };

  const addCredits = async (userId: string, amount: number, description: string) => {
    if (amount <= 0) return;
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const batch = writeBatch(db);
    batch.update(doc(db, 'users', userId), { credits: user.credits + amount });
    batch.set(doc(collection(db, 'transactions')), {
      userId,
      userName: user.name,
      amount,
      type: 'credit',
      date: new Date().toISOString(),
      description: description || `Admin added ${amount} credits`
    });

    await batch.commit();
  };

  const addAddress = async (userId: string, label: string, addressLine: string, phone: string) => {
    const targetUser = users.find(u => u.id === userId);
    if(!targetUser) return;

    const newAddress: Address = {
      id: 'addr_' + Date.now() + Math.random().toString(36).substr(2, 4),
      label, addressLine, phone
    };

    await updateDoc(doc(db, 'users', userId), {
      addresses: [...targetUser.addresses, newAddress]
    });
  };

  const updateUserAddresses = async (userId: string, lunchAddrId: string, dinnerAddrId: string) => {
    await updateDoc(doc(db, 'users', userId), {
      lunchAddressId: lunchAddrId,
      dinnerAddressId: dinnerAddrId
    });
  };

  return (
    <AppContext.Provider
      value={{
        users, usersLoaded, organizations, unserviceableDays, transactions, notifications, currentUser,
        simulatedDate, setSimulatedDate, login, register, logout, updateUserRole, addOrganization, addUserToOrganization,
        activateSubscription, togglePauseMeal, adjustMealQuantity, markMealDelivery, deliverOrganizationMeals,
        toggleUnserviceableDay, addAddress, updateUserAddresses, addNotification, clearNotifications, addCredits
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
