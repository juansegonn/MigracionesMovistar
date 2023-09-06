import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-firestore.js";
// Tu configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBA8hjXbjBwpIsFErj5EylXnSXhmmAk_3M",
    authDomain: "migracionesmovistar-6c8ff.firebaseapp.com",
    projectId: "migracionesmovistar-6c8ff",
    storageBucket: "migracionesmovistar-6c8ff.appspot.com",
    messagingSenderId: "918743184547",
    appId: "1:918743184547:web:46506455363d1a790dfb16"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Obtener una referencia a la base de datos de Firestore
const database = getFirestore(app);

// Crear una referencia a una colección en Firestore (por ejemplo, "ventas")
const ventasCollection = collection(database, "ventas");

export { database, ventasCollection, addDoc, getDocs, query, where, doc, updateDoc, getDoc  };

