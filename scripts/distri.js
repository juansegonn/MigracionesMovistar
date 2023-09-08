import { ventasCollection, getDocs, doc, updateDoc, database } from "../firebase.js"; // Ajusta la ruta de firebase.js según tu estructura de archivos

document.addEventListener("DOMContentLoaded", async function() {
    const filtroForm = document.getElementById("filtro-form");
    const ventasBO = document.getElementById("ventas-bo");

    const ventasSnapshot = await getDocs(ventasCollection);
    const ventasArray = ventasSnapshot.docs.map(doc => doc.data());
    ventasArray.sort((ventaA, ventaB) => {
        // Parsea las fechas en formato "YYYY-MM-DD" y compáralas
        const fechaA = new Date(ventaA.fecha);
        const fechaB = new Date(ventaB.fecha);

        // Si las fechas son iguales, compara por hora
        if (fechaA.getTime() === fechaB.getTime()) {
            const horaA = ventaA.hora.split(":");
            const horaB = ventaB.hora.split(":");
            
            // Compara las horas en formato "HH:MM:SS"
            if (horaA[0] !== horaB[0]) {
                return horaB[0] - horaA[0];
            } else if (horaA[1] !== horaB[1]) {
                return horaB[1] - horaA[1];
            } else {
                return horaB[2] - horaA[2];
            }
        }

        // Compara las fechas en orden cronológico descendente
        return fechaB - fechaA;
    });
    mostrarVentasBO(ventasArray);

    filtroForm.addEventListener("submit", function(event) {
        event.preventDefault();
    
        const filtroNombreVendedor = document.getElementById("filtro-nombre-vendedor").value.toLowerCase();
        const filtroDNIVendedor = document.getElementById("filtro-dni-vendedor").value.toLowerCase();
        const filtroLinea = document.getElementById("filtro-linea").value.toLowerCase();
        const filtroDNICliente = document.getElementById("filtro-dni-cliente").value.toLowerCase();
        const filtroFecha = document.getElementById("filtro-fecha").value; 
    
        const ventasFiltradas = ventasArray.filter(venta => {
            const cumpleFiltroNombreVendedor = venta.vendedor.nombre.toLowerCase().includes(filtroNombreVendedor);
            const cumpleFiltroDNIVendedor = venta.vendedor.dni.toLowerCase().includes(filtroDNIVendedor);
            const cumpleFiltroLinea = venta.linea.numero.toLowerCase().includes(filtroLinea);
            const cumpleFiltroDNICliente = venta.cliente.dni.toLowerCase().includes(filtroDNICliente);
            const cumpleFiltroFecha = venta.fecha.includes(filtroFecha); 
        
            console.log(filtroFecha)
            console.log(cumpleFiltroFecha)
            
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
                ventaInfo.classList.add("venta-info-container");
                ventaInfo.innerHTML = `
                    <h3>Línea: ${venta.linea.numero}</h3>
                    <p>Venta ID: ${venta.id}</p>
                    <p>Vendedor: ${venta.vendedor.nombre} (DNI: ${venta.vendedor.dni})</p> 
                    <p>DNI: ${venta.cliente.dni}</p>
                    <p>Estado: ${venta.estado}</p>
                    <div class="detalles-venta hidden" id="detalles-${venta.id}">
                    <!-- Aquí se mostrarán los detalles cuando se despliegue -->
                    </div>
                    <button class="ver-detalles-btn" data-id="${venta.id}">▼</button>
                `;

                const verDetallesBtn = ventaInfo.querySelector(".ver-detalles-btn");
                verDetallesBtn.addEventListener("click", function() {
                    toggleDetallesVenta(venta);
                });

                ventasBO.appendChild(ventaInfo);
            });
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
                    <p>Fecha: ${venta.fecha}</p>
                    <p>Hora: ${venta.hora}</p>
                    <p>Email: ${venta.cliente.mail}</p>
                    <p>Contacto: ${venta.cliente.contacto}</p>
                    <p>Linea de Llamada: ${venta.cliente.linea}</p>
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

