import { useEffect, useState } from 'react';
import { collection, doc, getDoc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase.js';
import { DEMO_PERLUMBAAN, DEMO_PESERTA, DEMO_REKOD, DEMO_RUMAH } from '../lib/demo.js';

// Preview mode: sample data when Firebase isn't configured and VITE_DEMO=true.
export const demoMode = !db && import.meta.env.VITE_DEMO === 'true';
const DEMO = { rumahSukan: DEMO_RUMAH, perlumbaan: DEMO_PERLUMBAAN, peserta: DEMO_PESERTA, rekod: DEMO_REKOD };

// Live list of a Firestore collection. Updates on screen as soon as an admin saves.
function useLiveCollection(name, order) {
  const [state, setState] = useState({ data: [], loading: true, error: null });

  useEffect(() => {
    if (!db) {
      setState({ data: demoMode ? DEMO[name] : [], loading: false, error: null });
      return undefined;
    }
    const ref = order ? query(collection(db, name), orderBy(order)) : collection(db, name);
    return onSnapshot(
      ref,
      (snap) => setState({ data: snap.docs.map((d) => ({ id: d.id, ...d.data() })), loading: false, error: null }),
      (error) => setState({ data: [], loading: false, error }),
    );
  }, [name, order]);

  return state;
}

export const useRumahSukan = () => useLiveCollection('rumahSukan', 'urutan');
export const usePerlumbaan = () => useLiveCollection('perlumbaan', 'no');
export const usePeserta = () => useLiveCollection('peserta');
export const useRekod = () => useLiveCollection('rekod');

// Signed-in user plus whether they are listed in /admins.
export function useAdmin() {
  const [state, setState] = useState({ user: null, isAdmin: false, loading: Boolean(auth) });

  useEffect(() => {
    if (!auth) return undefined;
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ user: null, isAdmin: false, loading: false });
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'admins', user.uid));
        setState({ user, isAdmin: snap.exists(), loading: false });
      } catch {
        setState({ user, isAdmin: false, loading: false });
      }
    });
  }, []);

  return state;
}
