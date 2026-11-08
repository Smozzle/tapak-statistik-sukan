import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
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

// Signed-in user, live: isAdmin (listed in /admins) and menunggu (has a pending request in /permohonanAdmin).
export function useAdmin() {
  const [state, setState] = useState({ user: null, isAdmin: false, menunggu: false, loading: Boolean(auth) });

  useEffect(() => {
    if (!auth) return undefined;
    let batalDoc = () => {};
    const batalAuth = onAuthStateChanged(auth, (user) => {
      batalDoc();
      batalDoc = () => {};
      if (!user) {
        setState({ user: null, isAdmin: false, menunggu: false, loading: false });
        return;
      }
      // Wait for both documents' first answer before leaving the loading state.
      const tunggu = { admin: undefined, menunggu: undefined };
      const kemaskini = () => {
        const siap = tunggu.admin !== undefined && tunggu.menunggu !== undefined;
        setState({ user, isAdmin: Boolean(tunggu.admin), menunggu: Boolean(tunggu.menunggu), loading: !siap });
      };
      const sambut = (kunci) => [
        (snap) => { tunggu[kunci] = snap.exists(); kemaskini(); },
        () => { tunggu[kunci] = false; kemaskini(); },
      ];
      const a = onSnapshot(doc(db, 'admins', user.uid), ...sambut('admin'));
      const m = onSnapshot(doc(db, 'permohonanAdmin', user.uid), ...sambut('menunggu'));
      batalDoc = () => { a(); m(); };
    });
    return () => { batalAuth(); batalDoc(); };
  }, []);

  return state;
}

/** Saves the "Mohon akses admin" request for a signed-in user. */
export function hantarPermohonanAdmin(user, nama) {
  return setDoc(doc(db, 'permohonanAdmin', user.uid), {
    nama: nama.trim(),
    email: user.email,
    dibuat: serverTimestamp(),
  });
}

export const usePermohonanAdmin = () => useLiveCollection('permohonanAdmin');
export const useSenaraiAdmin = () => useLiveCollection('admins');
