import { getFirestore, collection, addDoc, query, where, doc, setDoc, getDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-firestore.js";
import { ventasCollection } from "./firebase.js";

// Eventos
const ventaForm = document.getElementById("venta-form");
const verificarNumeroBtn = document.querySelector("button[type='submit']:first-of-type");

verificarNumeroBtn.addEventListener("click", async function(event) {
    event.preventDefault();
    document.getElementById("loader").style.display = "block";

    // Obtener el número de línea
    const lineaNumeroInput = document.getElementById("linea-numero");
    const lineaNumero = lineaNumeroInput.value;

    // Verificar si tiene 10 dígitos
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

    // Verificar si el número está en la base CSV
    const numerosCSV = await cargarNumerosDesdeCSV();
    if (!numerosCSV.includes(lineaNumero)) {
        mostrarMensajeError("Número fuera de base.");
        document.getElementById("loader").style.display = "none";
        return;
    }

    // Si el número no existe en ventas y sí en CSV, mostrar los campos y ocultar el botón "Verificar Numero"
    mostrarCamposVenta();
    document.getElementById("loader").style.display = "none";
});

function mostrarCamposVenta() {
    // Mostrar los campos relacionados a la venta
    document.querySelector(".section:nth-child(2)").style.display = "block"; // Datos del Vendedor
    document.querySelector(".section:nth-child(3)").style.display = "block"; // Datos del Cliente
    document.querySelector("button[type='submit']:last-of-type").style.display = "block"; // Botón "Registrar Venta"
    document.querySelector("a.button").style.display = "block"; // Enlace "Acceder a tus Ventas"
    document.querySelector("select").style.display = "block"; // Enlace "Acceder a tus Ventas"
    document.getElementById("plan").style.display = "block"; // Enlace "Acceder a tus Ventas"
    
    // Ocultar el botón "Verificar Numero"
    document.querySelector("button[type='submit']:first-of-type").style.display = "none";
}

// Función para cargar los números desde el archivo CSV "numeros.csv"
async function cargarNumerosDesdeCSV() {
    return new Promise((resolve, reject) => {
        const archivoCSV = "numeros.csv"; // Nombre del archivo CSV en la raíz del proyecto

        const xhr = new XMLHttpRequest();
        xhr.open("GET", archivoCSV);

        xhr.onload = () => {
            if (xhr.status === 200) {
                const contenidoCSV = xhr.responseText;
                const lineasCSV = contenidoCSV.split('\n');
                const numeros = [];

                for (let i = 1; i < lineasCSV.length; i++) {
                    const linea = lineasCSV[i].trim();
                    if (linea) {
                        const numero = linea; // El número es la línea completa en este caso
                        numeros.push(numero);
                    }
                }

                resolve(numeros);
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
        gravity: "bottom", // Cambia la posición a la esquina superior derecha
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
        gravity: "bottom", // Cambia la posición a la esquina superior derecha
        style: {
            width: "300px", // Define un ancho máximo para la notificación
        },
    }).showToast();
}

function mostrarVenta(venta) {
    // Implementa la lógica para mostrar la venta en tu interfaz de usuario aquí
    // Puedes acceder a los campos de la venta como venta.id, venta.fechaHora, etc.
    console.log("Venta registrada:", venta);
    restablecerFormulario()
}

function restablecerFormulario() {
    // Ocultar los campos relacionados a la venta
    document.querySelector(".section:nth-child(2)").style.display = "none"; // Datos del Vendedor
    document.querySelector(".section:nth-child(3)").style.display = "none"; // Datos del Cliente
    document.querySelector("button[type='submit']:last-of-type").style.display = "none"; // Botón "Registrar Venta"
    document.querySelector("a.button").style.display = "none"; // Enlace "Acceder a tus Ventas"
    document.querySelector("select").style.display = "none"; // Enlace "Acceder a tus Ventas"
    document.getElementById("plan").style.display = "none"; // Enlace "Acceder a tus Ventas"

    // Mostrar el botón "Verificar Número"
    document.querySelector("button[type='submit']:first-of-type").style.display = "block";
}
