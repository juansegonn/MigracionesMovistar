import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, doc, setDoc, getDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-firestore.js";

// Tu configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBA8hjXbjBwpIsFErj5EylXnSXhmmAk_3M",
    authDomain: "migracionesmovistar-6c8ff.firebaseapp.com",
    databaseURL: "https://migracionesmovistar-6c8ff-default-rtdb.firebaseio.com",
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
    document.getElementById("loader").style.display = "block";

    // Datos del Cliente
    const clienteNombre = document.getElementById("cliente-nombre").value;
    const clienteDNI = document.getElementById("cliente-dni").value;
    const clienteMail = document.getElementById("cliente-mail").value;
    const clienteContacto = document.getElementById("cliente-contacto").value;
    const clienteLlamado = document.getElementById("cliente-linea").value;

    // Datos de la Línea
    const lineaNumeroInput = document.getElementById("linea-numero");
    const lineaNumero = lineaNumeroInput.value;
    const lineaPlan = document.getElementById("linea-plan").value;
    
    // Verificar si tiene 10 digitos
    if (lineaNumero.length !== 10) {
        mensajeError.textContent = "El número de línea debe tener exactamente 10 dígitos.";
        mensajeError.style.display = "block";
        document.getElementById("loader").style.display = "none";
        return;
    }

    // Verificar si ya existe una venta con el mismo número de línea
    const q = query(ventasCollection, where("linea.numero", "==", lineaNumero));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        // Ya existe al menos una venta con el mismo número de línea
        mensajeError.textContent = "Ya existe una venta con este número de línea.";
        mensajeError.style.display = "block";
        document.getElementById("loader").style.display = "none";
        return;
    }


    // Datos del Vendedor
    const vendedorDNI = document.getElementById("vendedor-dni").value;
    // Cargamos los vendedores desde el archivo CSV
    const vendedores = await cargarVendedoresDesdeCSV();

    // Buscamos el vendedor por DNI en la lista de vendedores cargados desde el CSV
    const vendedorEncontrado = vendedores.find(v => v.dni === vendedorDNI);
    
    if (!vendedorEncontrado) {
        mensajeError.textContent = "El DNI del vendedor no es válido.";
        mensajeError.style.display = "block";
        document.getElementById("loader").style.display = "none";
        return;
    }
    

    // Agregar fecha y hora actual
    const fechaHoraActual = new Date();
    const anio = fechaHoraActual.getFullYear(); // Obtener el año (YYYY)
    const mes = (fechaHoraActual.getMonth() + 1).toString().padStart(2, '0'); // Obtener el mes (MM)
    const dia = fechaHoraActual.getDate().toString().padStart(2, '0'); // Obtener el día (DD)

    // Formatear la fecha en el formato "YYYY-MM-DD"
    const fechaFormateada = `${anio}-${mes}-${dia}`;

    // Agregar el campo id
    const id = await doc(ventasCollection).id;
        const nuevaVenta = {
            id,
            fecha: fechaFormateada,
            hora: fechaHoraActual.toLocaleTimeString(),
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
            estado: "APROBADA OK" // Estado por defecto
        };

    // Guardar la venta en la base de datos
    const docRef = doc(ventasCollection, id); // Obtener una referencia al documento recién creado
    await setDoc(docRef, nuevaVenta); // Utilizamos setDoc en lugar de addDoc

    mensajeError.textContent = "Venta registrada con éxito.";
    document.getElementById("loader").style.display = "none";
    mensajeError.style.display = "block";
    setTimeout(function() {
        mensajeError.style.display = "none";
      }, 5000);

    // Obtener la venta del documento
    const ventaSnapshot = await getDoc(docRef);

    // Mostrar la venta
    const venta = ventaSnapshot.data();
    mostrarVenta(venta);

    ventaForm.reset();
});

// Función para cargar vendedores desde un archivo CSV ubicado en la raíz del proyecto
async function cargarVendedoresDesdeCSV() {
    return new Promise((resolve, reject) => {
        const archivoCSV = "dotacion.csv"; // Nombre del archivo CSV en la raíz del proyecto

        const xhr = new XMLHttpRequest();
        xhr.open("GET", archivoCSV);

        xhr.onload = () => {
            if (xhr.status === 200) {
                const contenidoCSV = xhr.responseText;
                const lineasCSV = contenidoCSV.split('\n');
                const vendedores = [];

                for (let i = 1; i < lineasCSV.length; i++) {
                    const linea = lineasCSV[i].trim();
                    if (linea) {
                        const [nombre, dni, idAzo] = linea.split(",");
                        vendedores.push({ nombre, dni, idAzo });
                    }
                }

                resolve(vendedores);
            } else {
                reject(new Error(`Error al cargar el archivo CSV: ${xhr.statusText}`));
            }
        };

        xhr.onerror = () => {
            reject(new Error("Error de red al cargar el archivo CSV"));
        };

        xhr.send();
    });
}

function mostrarVenta(venta) {
    // Implementa la lógica para mostrar la venta en tu interfaz de usuario aquí
    // Puedes acceder a los campos de la venta como venta.id, venta.fechaHora, etc.
    console.log("Venta registrada:", venta);
}
