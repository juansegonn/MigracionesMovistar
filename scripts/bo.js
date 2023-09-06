import { ventasCollection, database, getDocs, doc, updateDoc, getDoc } from "../firebase.js"; // Ajusta la ruta de firebase.js según tu estructura de archivos

document.addEventListener("DOMContentLoaded", async function() {
    const validPassword = "Azo2023";
    
    let enteredPassword = ""
    
    while (enteredPassword !== validPassword) {
        enteredPassword = window.prompt("Por favor, ingresa la contraseña:");
    
        if (enteredPassword === null) {
            // El usuario canceló la ventana emergente
            break;
        } else if (enteredPassword !== validPassword) {
            alert("Contraseña incorrecta. Inténtalo nuevamente.");
        }
    }
    
    if (enteredPassword === validPassword) {
        // Contraseña válida, mostrar contenido del Back Office
        // Aquí puedes agregar tu lógica para mostrar el contenido del Back Office
        alert("Contraseña correcta. Acceso permitido.");
    } else {
        // Contraseña incorrecta o cancelada, mostrar mensaje de acceso denegado
        alert("Acceso denegado.");
    }
    
    const filtroForm = document.getElementById("filtro-form");
    const ventasBO = document.getElementById("ventas-bo");

    const ventasSnapshot = await getDocs(ventasCollection);
    const ventasArray = ventasSnapshot.docs.map(doc => doc.data());

    mostrarVentasBO(ventasArray);

  // Función para convertir una cadena de fecha "6/9/2023, 10:08:26" en un objeto Date
function parseFechaString(fechaString) {
    const [fechaPart, horaPart] = fechaString.split(", ");
    const [dia, mes, anio] = fechaPart.split("/");
    const [hora, minuto, segundo] = horaPart.split(":");
    return new Date(anio, mes - 1, dia, hora, minuto, segundo);
}

filtroForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const filtroNombreVendedor = document.getElementById("filtro-nombre-vendedor").value.toLowerCase();
    const filtroDNIVendedor = document.getElementById("filtro-dni-vendedor").value.toLowerCase();
    const filtroLinea = document.getElementById("filtro-linea").value.toLowerCase();
    const filtroDNICliente = document.getElementById("filtro-dni-cliente").value.toLowerCase();
    const filtroFecha = document.getElementById("filtro-fecha").value; // Este valor es en formato "YYYY-MM-DD"

    // Convertir la fecha de filtro a un objeto Date
    const filtroFechaDate = new Date(filtroFecha);

    const ventasFiltradas = ventasArray.filter(venta => {
        const cumpleFiltroNombreVendedor = venta.vendedor.nombre.toLowerCase().includes(filtroNombreVendedor);
        const cumpleFiltroDNIVendedor = venta.vendedor.dni.toLowerCase().includes(filtroDNIVendedor);
        const cumpleFiltroLinea = venta.linea.numero.toLowerCase().includes(filtroLinea);
        const cumpleFiltroDNICliente = venta.cliente.dni.toLowerCase().includes(filtroDNICliente);

        // Convertir la fecha de la venta a un objeto Date
        const fechaVenta = parseFechaString(venta.fechaHora);

        // Verificar si la fecha de la venta coincide con la fecha de filtro
        const cumpleFiltroFecha = filtroFechaDate ? fechaVenta.toISOString().split("T")[0] === filtroFechaDate.toISOString().split("T")[0] : true;

        return cumpleFiltroNombreVendedor && cumpleFiltroDNIVendedor && cumpleFiltroLinea && cumpleFiltroDNICliente && cumpleFiltroFecha;
    });

    mostrarVentasBO(ventasFiltradas);
});

    function mostrarVentasBO(ventas) {
        ventasBO.innerHTML = "";

        if (ventas.length === 0) {
            ventasBO.textContent = "No se encontraron ventas que coincidan con los filtros.";
        } else {
            ventas.forEach(venta => {
                const ventaInfo = document.createElement("div");
                ventaInfo.classList.add("venta-info");
                ventaInfo.innerHTML = `
                    <h3>Venta ID: ${venta.id}</h3>
                    <p>Vendedor: ${venta.vendedor.nombre} (DNI: ${venta.vendedor.dni})</p> 
                    <p>DNI: ${venta.cliente.dni}</p>
                    <p>Línea: ${venta.linea.numero}</p>
                    <p>Estado: ${venta.estado}</p>
                    <div class="detalles-venta hidden" id="detalles-${venta.id}">
                    <!-- Aquí se mostrarán los detalles cuando se despliegue -->
                    </div>
                    <button class="ver-detalles-btn" data-id="${venta.id}">▼</button>
                    <label for="estado-${venta.id}">Cambiar Estado:</label>
                    <select id="estado-${venta.id}">
                    <option value="ESPERANDO APROBACION BO">ESPERANDO APROBACION BO</option>
                    <option value="CARGADO EN T3">CARGADO EN T3</option>
                    <option value="APROBADA">APROBADA</option>
                    <option value="ERROR DE LINEA">ERROR DE LINEA</option>
                    <option value="RETRABAJAR">RETRABAJAR</option>
                    <option value="ANULADA GESTION MAL CARGADA">ANULADA GESTION MAL CARGADA</option>
                    <option value="ANULADA CLIENTE DECISTE">ANULADA CLIENTE DECISTE</option>
                    </select>
                    <button class="cambiar-estado-btn" data-id="${venta.id}">Cambiar</button>
                `;

                const cambiarEstadoBtn = ventaInfo.querySelector(".cambiar-estado-btn");
                cambiarEstadoBtn.addEventListener("click", function() {
                    const nuevoEstado = document.getElementById(`estado-${venta.id}`).value;
                    cambiarEstadoVenta(venta.id, nuevoEstado); // Utiliza venta.id en lugar de venta.id_
                });

                const verDetallesBtn = ventaInfo.querySelector(".ver-detalles-btn");
                verDetallesBtn.addEventListener("click", function() {
                    toggleDetallesVenta(venta);
                });

                ventasBO.appendChild(ventaInfo);
                const ventaID = venta.id; // Accede al ID de la venta

                console.log("ID de la venta:", ventaID);
            });
        }
        
    }
    
    async function cambiarEstadoVenta(id, nuevoEstado) {
        const ventaRef = doc(database, "ventas", id);
        try {
            await updateDoc(ventaRef, { estado: nuevoEstado });
            console.log("Estado de venta actualizado correctamente.");
    
            // Después de actualizar, volvemos a obtener los datos de Firestore y actualizar la página
            const ventasSnapshot = await getDocs(ventasCollection);
            const ventasArray = ventasSnapshot.docs.map(doc => doc.data());
            mostrarVentasBO(ventasArray);
        } catch (error) {
            console.error("Error al actualizar el estado de la venta:", error);
        }
    }
    
});

function toggleDetallesVenta(venta) {
    const detallesVenta = document.getElementById(`detalles-${venta.id}`);
    
    if (detallesVenta) { // Verificar si el elemento existe antes de continuar
        if (detallesVenta.classList.contains("hidden")) {
            detallesVenta.innerHTML += `
                <div class="detalles-venta">
                    <p>Cliente: ${venta.cliente.nombre}</p>
                    <p>Fecha y Hora: ${venta.fechaHora}</p>
                    <p>Email: ${venta.cliente.mail}</p>
                    <p>Contacto: ${venta.cliente.contacto}</p>
                    <p>Linea de Llamada: ${venta.cliente.lineaLlamado}</p>
                    <p>Plan: ${venta.linea.plan}</p>
                </div>
            `;
            detallesVenta.classList.remove("hidden");
        } else {
            detallesVenta.innerHTML = "";
            detallesVenta.classList.add("hidden");
        }
    }
}
