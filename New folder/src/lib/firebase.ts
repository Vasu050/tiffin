import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseFileConfig = {
  apiKey: 'AIzaSyD9Lp0rFYjcxXnnrYmgD-xp5GhSBH0P8tg',
  authDomain: 'gemini-api-fd037.firebaseapp.com',
  projectId: 'gemini-api-fd037',
  firestoreDatabaseId: 'ai-studio-bf241ab9-3d15-40c4-8a1e-542a092135f8',
  storageBucket: 'gemini-api-fd037.firebasestorage.app',
  messagingSenderId: '1083361050149',
  appId: '1:1083361050149:web:1e2ab2c7f259b4c57089cc',
  measurementId: 'G-QJEZG3VPET',
};

// Prefer Vite env vars (prefix VITE_) for production/deploys; fall back to
// the built-in local Firebase config for existing development setups.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? firebaseFileConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? firebaseFileConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? firebaseFileConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? firebaseFileConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? firebaseFileConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? firebaseFileConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? firebaseFileConfig.measurementId,
  firestoreDatabaseId: import.meta.env.VITE_FIRESTORE_DB_ID ?? firebaseFileConfig.firestoreDatabaseId,
};

const app = initializeApp(firebaseConfig as any);
const databaseId = (firebaseConfig as any).firestoreDatabaseId;
export const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
provider.addScope('https://www.googleapis.com/auth/gmail.send');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Assume page refresh or existing session without cached token, need re-auth for token
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};
