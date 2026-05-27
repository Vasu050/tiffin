import { collection, doc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { Role, MealType } from '../types';

export const seedDatabase = async () => {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    
    // Explicit list of desired testing and default accounts
    const initialUsers = [
      {
        id: 'u_vasu',
        email: 'vasujain050@gmail.com',
        name: 'Vasu Jain',
        phone: '+91 98765 43210',
        role: Role.USER,
        organizationId: 'org1',
        credits: 15,
        addresses: [
          { id: 'a1', label: 'Home Address', addressLine: 'Flat 402, Sunshine Residency, Shanti Nagar, Delhi', phone: '+91 98765 43210' },
          { id: 'a2', label: 'Office Desk', addressLine: 'Tower B, Tech Mahindra, Sector 62, Noida, UP', phone: '+91 99999 88888' }
        ],
        lunchAddressId: 'a2',  // Lunch to office
        dinnerAddressId: 'a1', // Dinner to home
        subscription: {
          active: true,
          mealType: 'both' as MealType,
          startDate: '2026-05-01',
          endDate: '2026-06-01',
          totalCreditsAdded: 30
        },
        dailyMeals: {},
      },
      {
        id: 'u_test_user',
        email: 'user@tiffin.com',
        name: 'Demo Standard User',
        phone: '+91 99999 00001',
        role: Role.USER,
        organizationId: 'org1',
        credits: 10,
        addresses: [
          { id: 'a_user_1', label: 'Main Residence', addressLine: '123 Royal Palace Enclave, Sector 15, Gurgaon', phone: '+91 99999 00001' }
        ],
        lunchAddressId: 'a_user_1',
        dinnerAddressId: 'a_user_1',
        subscription: {
          active: true,
          mealType: 'both' as MealType,
          startDate: '2026-05-01',
          endDate: '2026-06-01',
          totalCreditsAdded: 30
        },
        dailyMeals: {}
      },
      {
        id: 'u2',
        email: 'priya@example.com',
        name: 'Priya Sharma',
        phone: '+91 91234 56789',
        role: Role.USER,
        organizationId: 'org1',
        credits: 5,
        addresses: [
          { id: 'a3', label: 'Home', addressLine: 'Sector 15, Huda Colony, Gurgaon', phone: '+91 91234 56789' }
        ],
        lunchAddressId: 'a3',
        dinnerAddressId: 'a3',
        subscription: {
          active: true,
          mealType: 'both' as MealType,
          startDate: '2026-05-01',
          endDate: '2026-06-01',
          totalCreditsAdded: 30
        },
        dailyMeals: {}
      },
      {
        id: 'd1',
        email: 'delivery@tiffin.com',
        name: 'Ramesh Kumar (Delivery Agent)',
        phone: '+91 90000 11111',
        role: Role.DELIVERY,
        credits: 0,
        addresses: [],
        dailyMeals: {}
      },
      {
        id: 'a1',
        email: 'admin@tiffin.com',
        name: 'Tiffin Admin',
        phone: '+91 88888 88888',
        role: Role.ADMIN,
        credits: 0,
        addresses: [],
        dailyMeals: {}
      }
    ];

    if (!usersSnap.empty) {
      console.log('Database already has records, ensuring core accounts are upserted...');
      for (const u of initialUsers) {
        await setDoc(doc(db, 'users', u.id), u, { merge: true });
      }
      console.log('Core testing profiles verified!');
      return;
    }

    console.log('Seeding initial database...');
    const batch = writeBatch(db);

    const initialOrgs = [
      { id: 'org1', name: 'Google Office Hub', address: 'Signature Towers, Sector 30, Gurugram' },
      { id: 'org2', name: 'Infosys Campus Noida', address: 'A-21, Sector 64, Noida, UP' },
      { id: 'org3', name: 'Deloitte Services', address: 'DLF CyberCity, Phase III, Gurugram' }
    ];

    const initialTxs = [
      {
        id: 'tx1',
        userId: 'u_vasu',
        userName: 'Vasu Jain',
        date: '2026-05-18T10:00:00Z',
        type: 'credit',
        amount: 20,
        description: 'Admin Initial Balance Reward'
      },
      {
        id: 'tx2',
        userId: 'u_vasu',
        userName: 'Vasu Jain',
        date: '2026-05-19T14:30:00Z',
        type: 'debit',
        amount: 2,
        description: 'Delivered: Lunch & Dinner for 19 May'
      }
    ];

    const initialUnserv = [
      { id: 'un1', date: '2026-05-24', reason: 'Heavy Rain Waterlogging Alert' }
    ];

    initialUsers.forEach(u => batch.set(doc(db, 'users', u.id), u));
    initialOrgs.forEach(o => batch.set(doc(db, 'organizations', o.id), o));
    initialTxs.forEach(t => batch.set(doc(db, 'transactions', t.id), t));
    initialUnserv.forEach(us => batch.set(doc(db, 'unserviceableDays', us.id), us));

    await batch.commit();
    console.log('Database fully seeded successfully with testing profiles!');
  } catch (error) {
    console.error('Error seeding database', error);
  }
};
