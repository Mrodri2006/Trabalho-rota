import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";

// COLAR AQUI A STRING DE CONEXÃO
const firebaseConfig = {
  apiKey: "AIzaSyDwYKAPsHVqoNGhF2yErcK7Luw-bGfueso",
  authDomain: "app-monitoramento-56f27.firebaseapp.com",
  projectId: "app-monitoramento-56f27",
  storageBucket: "app-monitoramento-56f27.firebasestorage.app",
  messagingSenderId: "847472211063",
  appId: "1:847472211063:web:6caa421ff0e104c0b10272",
  measurementId: "G-RNSP0MDF9J"
};
  
  
// INICIALIZAR O FIREBASE
let app;
if (firebase.apps.length == 0) {
    app = firebase.initializeApp(firebaseConfig);
} else {
    app = firebase.app();
}

const auth = firebase.auth();
const firestore = firebase.firestore();
const storage = firebase.storage();
export { auth, firestore, storage };
