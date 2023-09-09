import { getFirestore, collection, addDoc, query, where, doc, setDoc, getDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-firestore.js";
import { ventasCollection } from "./firebase.js";

// Eventos
const ventaForm = document.getElementById("venta-form");

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
        mostrarMensajeError("El número de línea debe tener exactamente 10 dígitos.");
        document.getElementById("loader").style.display = "none";
        return;
    }

    // Verificar si ya existe una venta con el mismo número de línea
    const q = query(ventasCollection, where("linea.numero", "==", lineaNumero));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        mostrarMensajeError("Ya existe una venta con este número de línea.");
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
        mostrarMensajeError("El DNI del vendedor no es válido.");
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
                llamado: clienteLlamado
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

    mostrarMensajeExito("Venta registrada con éxito.");
    document.getElementById("loader").style.display = "none";

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

function mostrarMensajeError(mensaje) {
    Toastify({
        text: mensaje,
        duration: 5000,
        close: true,
        gravity: "top-left", // Cambia la posición a la esquina superior derecha
        style: {
            width: "300px", // Define un ancho máximo para la notificación
        },
    }).showToast();
}

function mostrarMensajeExito(mensaje) {
    Toastify({
        text: mensaje,
        duration: 5000,
        close: true,
        gravity: "top-left", // Cambia la posición a la esquina superior derecha
        style: {
            width: "300px", // Define un ancho máximo para la notificación
        },
    }).showToast();
}

function mostrarVenta(venta) {
    // Implementa la lógica para mostrar la venta en tu interfaz de usuario aquí
    // Puedes acceder a los campos de la venta como venta.id, venta.fechaHora, etc.
    console.log("Venta registrada:", venta);
}
