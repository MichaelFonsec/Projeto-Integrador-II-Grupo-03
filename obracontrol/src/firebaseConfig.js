import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDSKghNH3AatUvy-_yOvAhQxqD8t0Iz2hM",
  authDomain: "obracontrol-b5abd.firebaseapp.com",
  projectId: "obracontrol-b5abd",
  storageBucket: "obracontrol-b5abd.firebasestorage.app",
  messagingSenderId: "882814095579",
  appId: "1:882814095579:web:7328e439fec855f2fdfcfe",
  measurementId: "G-V5S0WQXZWS"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta a Autenticação e o Banco de Dados para serem usados nas outras telas
export const auth = getAuth(app);
export const db = getFirestore(app);