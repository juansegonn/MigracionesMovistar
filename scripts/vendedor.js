import { getDocs, query, where, ventasCollection, updateDoc, doc, orderBy  } from "../firebase.js";

document.addEventListener("DOMContentLoaded", function() {
    const accesoVendedorForm = document.getElementById("acceso-vendedor-form");
    const ventasVendedor = document.getElementById("ventas-vendedor");
  
    accesoVendedorForm.addEventListener("submit", async function(event) {
        event.preventDefault();
        document.getElementById("loader").style.display = "block";

        const vendedorDNI = document.getElementById("vendedor-dni").value;

        // Consultar las ventas del vendedor desde Firestore
        const ventasDelVendedor = await consultarVentasPorVendedor(vendedorDNI);

        // Limpia el contenido anterior antes de mostrar las nuevas ventas
        ventasVendedor.innerHTML = "";

        if (ventasDelVendedor.length === 0) {
            ventasVendedor.textContent = "No se encontraron ventas para este vendedor.";
            document.getElementById("loader").style.display = "none";
        } else {
            ventasDelVendedor.forEach(venta => {
                const ventaInfoContainer = document.createElement("div");
                ventaInfoContainer.classList.add("venta-info-container");
                ventaInfoContainer.setAttribute("data-id", venta.id);
                document.getElementById("loader").style.display = "none";
                const ventaInfo = document.createElement("div");
                ventaInfo.classList.add("venta-info");
                ventaInfo.innerHTML = `
                    <h3>Línea: ${venta.linea.numero}</h3>
                    <p>Estado: ${venta.estado}</p>
                    <p>Cliente: ${venta.cliente.nombre}</p>
                    <div class="detalles-venta hidden" id="detalles-${venta.id}">
                    <!-- Aquí se mostrarán los detalles cuando se despliegue -->
                    </div>
                    <button class="ver-detalles-btn" data-id="${venta.id}">
                        <span class="rotatable-icon">▼</span>
                    </button>

                `;

                if (venta.estado === "" || venta.estado === "") {
                    const editarLineaBtn = document.createElement("button");
                    editarLineaBtn.classList.add("editar-linea-btn")
                    editarLineaBtn.textContent = "Editar Línea";
                    editarLineaBtn.addEventListener("click", function() {
                        toggleMenuEdicion(venta);
                    });
                    ventaInfo.appendChild(editarLineaBtn);
                }

                const verDetallesBtn = ventaInfo.querySelector(".ver-detalles-btn");
                verDetallesBtn.addEventListener("click", function() {
                    toggleDetallesVenta(venta);
                });

                ventaInfoContainer.appendChild(ventaInfo);


                ventasVendedor.appendChild(ventaInfoContainer);
            });
        }
    });

    // Función para consultar las ventas del vendedor desde Firestore
    async function consultarVentasPorVendedor(vendedorDNI) {
        const ventas = [];

        // Consultar ventas utilizando Firestore y ordenarlas por fecha en orden ascendente
        const q = query(ventasCollection, where("vendedor.dni", "==", vendedorDNI));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach(doc => {
            ventas.push(doc.data());
        });

        ventas.sort((ventaA, ventaB) => {
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
        })

        return ventas;
    }


    const menusEdicion = {}; // Guarda los menús de edición abiertos por venta

    async function toggleMenuEdicion(venta) {
    const ventaId = venta.id;

    if (menusEdicion[ventaId]) {
        // Si el menú de edición ya está abierto, ciérralo
        menusEdicion[ventaId].remove();
        delete menusEdicion[ventaId];
    } else {
        // Si el menú de edición no está abierto, créalo
        const menuEdicion = document.createElement("div");
        menuEdicion.classList.add("menu-edicion");

        const formularioEdicion = document.createElement("form");
        formularioEdicion.innerHTML = `
                <label for="nombre">Nombre:</label>
                <input type="text" id="nombre" value="${venta.cliente.nombre}"><br>
                <label for="dni">DNI:</label>
                <input type="text" id="dni" value="${venta.cliente.dni}"><br>
                <label for="mail">Email:</label>
                <input type="email" id="mail" value="${venta.cliente.mail}"><br>
                <label for="contacto">Linea Alternativa:</label>
                <input type="tel" id="contacto" value="${venta.cliente.contacto}"><br>
                <label for="linea-numero">Número de Línea:</label>
                <input type="text" id="linea-numero" value="${venta.linea.numero}"><br>
                <label for="linea-plan">Plan Adquirido:</label>
                <select id="linea-plan">
                    <option value="3GB">3 GB</option>
                    <option value="6GB">6 GB</option>
                    <option value="10GB">10 GB</option>
                    <option value="15GB">15 GB</option>
                    <option value="20GB">20 GB</option>
                </select><br>
                <button type="submit">Guardar Cambios</button>
            `;

        formularioEdicion.addEventListener("submit", async function(event) {
            event.preventDefault();
            const numeroLineaInput = document.getElementById("linea-numero");
            const nuevoNumeroLinea = numeroLineaInput.value;
    
            // Verificar si el nuevo número de línea ya existe en la base de datos
            const lineaExists = await verificaNumeroLineaExiste(nuevoNumeroLinea, venta.id);
    
            if (lineaExists) {
                alert("Este número de línea ya está registrado.");
            } else {
            // Actualiza los datos de la venta con la información modificada
            venta.cliente.nombre = document.getElementById("nombre").value;
            venta.cliente.dni = document.getElementById("dni").value;
            venta.cliente.mail = document.getElementById("mail").value;
            venta.cliente.contacto = document.getElementById("contacto").value;
            venta.linea.numero = document.getElementById("linea-numero").value;
            venta.linea.plan = document.getElementById("linea-plan").value;

            // Cambia el estado de la venta a "RETRABAJADA/ESPERANDO APROBACION BO"
            venta.estado = "RETRABAJADA/ESPERANDO APROBACION BO";

            // Actualiza la venta en Firestore
            const ventaDocRef = doc(ventasCollection, venta.id);
            await updateDoc(ventaDocRef, venta);

            // Limpia el menú de edición
            menuEdicion.remove();

            // Llama a mostrarVentas después de un breve retraso
            setTimeout(() => {
                mostrarVentas();
            }, 100); // Ajusta el tiempo según sea necesario
            }
        });

        menuEdicion.appendChild(formularioEdicion);

        // Busca el contenedor de la venta asociado y agrega el menú de edición
        const ventaInfoContainer = document.querySelector(`.venta-info-container[data-id="${ventaId}"]`);
        ventaInfoContainer.appendChild(menuEdicion);

        // Guarda el menú de edición en el objeto de menús abiertos
        menusEdicion[ventaId] = menuEdicion;
    }

    async function verificaNumeroLineaExiste(numeroLinea, ventaId) {
        // Realiza una consulta en Firestore para verificar si el número de línea ya existe
        const q = query(ventasCollection, where("linea.numero", "==", numeroLinea));
        const querySnapshot = await getDocs(q);
    
        if (querySnapshot.size === 0) {
            // No se encontraron ventas con el mismo número de línea, por lo que no está registrado
            return false;
        } else {
            // Se encontraron ventas con el mismo número de línea, pero verifica si alguna de ellas es la misma venta que se está editando
            const ventasMismaLinea = querySnapshot.docs.filter(doc => doc.id !== ventaId);
            return ventasMismaLinea.length > 0;
        }
    }
    
}

async function mostrarVentas() {
    ventasVendedor.innerHTML = "";
    const vendedorDNI = document.getElementById("vendedor-dni").value;
    
    // Consultar ventas utilizando Firestore
    const q = query(ventasCollection, where("vendedor.dni", "==", vendedorDNI));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach(doc => {
        const venta = doc.data();

        const ventaInfo = document.createElement("div");
        ventaInfo.classList.add("venta-info-container");
        ventaInfo.setAttribute("data-id", venta.id);
        ventaInfo.innerHTML =  `
        <h3>Línea: ${venta.linea.numero}</h3>
        <p>Cliente: ${venta.cliente.nombre}</p>
        <p>Estado: ${venta.estado}</p>
        <div class="detalles-venta hidden" id="detalles-${venta.id}">
        <!-- Aquí se mostrarán los detalles cuando se despliegue -->
        </div>
        <button class="ver-detalles-btn" data-id="${venta.id}">
            <span class="rotatable-icon">▼</span>
        </button>
    `;

        if (venta.estado === "" || venta.estado === "") {
            const editarLineaBtn = document.createElement("button");
            editarLineaBtn.textContent = "Editar Línea";
            editarLineaBtn.classList.add("editar-linea-btn")
            editarLineaBtn.addEventListener("click", function() {
                toggleMenuEdicion(venta);
            });
            ventaInfo.appendChild(editarLineaBtn);
        }

        const verDetallesBtn = ventaInfo.querySelector(".ver-detalles-btn");
        verDetallesBtn.addEventListener("click", function() {
            toggleDetallesVenta(venta);
        });

        ventasVendedor.appendChild(ventaInfo);
    });
}
    

    function toggleDetallesVenta(venta) {
        const detallesVenta = document.getElementById(`detalles-${venta.id}`);
        
        if (detallesVenta) { // Verificar si el elemento existe antes de continuar
            if (detallesVenta.classList.contains("hidden")) {
                detallesVenta.innerHTML += `
                    <div class="detalles-venta-vendedor">
                    <p>DNI: ${venta.cliente.dni}</p>
                    <p>Email: ${venta.cliente.mail}</p>
                    <p>Contacto: ${venta.cliente.contacto}</p>
                    <p>Linea de Llamada: ${venta.cliente.linea}</p>
                    <p>Plan: ${venta.linea.plan}</p>
                    <p>Fecha: ${venta.fecha}</p>
                    <p>Hora: ${venta.hora}</p>
                    </div>
                `;
                detallesVenta.classList.remove("hidden");
            } else {
                detallesVenta.innerHTML = "";
                detallesVenta.classList.add("hidden");
            }
        }
    }
});
