import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, doc, setDoc, getDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-firestore.js";

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

// Eventos
const ventaForm = document.getElementById("venta-form");
const mensajeError = document.getElementById("mensaje-error");

ventaForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    // Datos del Cliente
    const clienteNombre = document.getElementById("cliente-nombre").value;
    const clienteDNI = document.getElementById("cliente-dni").value;
    const clienteMail = document.getElementById("cliente-mail").value;
    const clienteContacto = document.getElementById("cliente-contacto").value;
    const clienteLlamado = document.getElementById("cliente-linea").value;

    // Datos de la Línea
    const lineaNumero = document.getElementById("linea-numero").value;
    const lineaPlan = document.getElementById("linea-plan").value;

    // Verificar si ya existe una venta con el mismo número de línea
    const q = query(ventasCollection, where("linea.numero", "==", lineaNumero));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        // Ya existe al menos una venta con el mismo número de línea
        mensajeError.textContent = "Ya existe una venta con este número de línea.";
        return;
    }

    const vendedoresBase = [
        { dni: "12345678", nombre: "Vendedor1" },
        { dni: "87654321", nombre: "Vendedor2" }
    ];

    // Datos del Vendedor
    const vendedorDNI = document.getElementById("vendedor-dni").value;
    const vendedorEncontrado = await vendedoresBase.find(v => v.dni === vendedorDNI);

    if (!vendedorEncontrado) {
        mensajeError.textContent = "El DNI del vendedor no es válido.";
        return;
    }

    // Agregar fecha y hora actual
    const fechaHoraActual = new Date().toLocaleString();

    // Agregar el campo id
    const id = await doc(ventasCollection).id;

    const nuevaVenta = {
        id,
        fechaHora: fechaHoraActual,
        cliente: {
            nombre: clienteNombre,
            dni: clienteDNI,
            mail: clienteMail,
            contacto: clienteContacto,
            linea: clienteLlamado
        },
        linea: {
            numero: lineaNumero,
            plan: lineaPlan
        },
        vendedor: {
            dni: vendedorDNI,
            nombre: vendedorEncontrado.nombre // Agregamos el nombre del vendedor
        },
        estado: "ESPERANDO APROBACION BO" // Estado por defecto
    };

    // Guardar la venta en la base de datos
    const docRef = doc(ventasCollection, id); // Obtener una referencia al documento recién creado
    await setDoc(docRef, nuevaVenta); // Utilizamos setDoc en lugar de addDoc

    mensajeError.textContent = "Venta registrada con éxito.";

    // Obtener la venta del documento
    const ventaSnapshot = await getDoc(docRef);

    // Mostrar la venta
    const venta = ventaSnapshot.data();
    mostrarVenta(venta);

    ventaForm.reset();
});

function mostrarVenta(venta) {
    // Implementa la lógica para mostrar la venta en tu interfaz de usuario aquí
    // Puedes acceder a los campos de la venta como venta.id, venta.fechaHora, etc.
    console.log("Venta registrada:", venta);
}
