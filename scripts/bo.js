import { ventasCollection, database, getDocs, doc, updateDoc, query, where, deleteDoc } from "../firebase.js"; // Ajusta la ruta de firebase.js según tu estructura de archivos

document.addEventListener("DOMContentLoaded", async function() {
    const validPassword = "Azo2023";
    
    let enteredPassword = ""
    
    while (enteredPassword !== validPassword) {
        enteredPassword = window.prompt("Por favor, ingresa la contraseña:");
    
        if (enteredPassword === null) {
            // El usuario canceló la ventana emergente
            window.location.href = "pagina-de-acceso-denegado.html"; // Redirigir a la página de acceso denegado
            return;
        } else if (enteredPassword !== validPassword) {
            alert("Contraseña incorrecta. Inténtalo nuevamente.");
        }
    }
    
    // Contraseña válida, mostrar contenido del Back Office
    // Aquí puedes agregar tu lógica para mostrar el contenido del Back Office
    alert("Contraseña correcta. Acceso permitido.");
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
        const filtroFechaDesde = document.getElementById("filtro-fecha-desde").value;
        const filtroFechaHasta = document.getElementById("filtro-fecha-hasta").value; 
    
        const fechaDesde = new Date(filtroFechaDesde);
        const fechaHasta = new Date(filtroFechaHasta);
    
        const ventasFiltradas = ventasArray.filter(venta => {
            const cumpleFiltroNombreVendedor = venta.vendedor.nombre.toLowerCase().includes(filtroNombreVendedor);
            const cumpleFiltroDNIVendedor = venta.vendedor.dni.toLowerCase().includes(filtroDNIVendedor);
            const cumpleFiltroLinea = venta.linea.numero.toLowerCase().includes(filtroLinea);
            const cumpleFiltroDNICliente = venta.cliente.dni.toLowerCase().includes(filtroDNICliente);
            
            const fechaVenta = new Date(venta.fecha);
    
            // Aplica el filtro de fecha solo si ambas fechas son válidas y están definidas
            if (!isNaN(fechaDesde.getTime()) && !isNaN(fechaHasta.getTime())) {
                return cumpleFiltroNombreVendedor && cumpleFiltroDNIVendedor && cumpleFiltroLinea && cumpleFiltroDNICliente &&
                    fechaVenta >= fechaDesde && fechaVenta <= fechaHasta;
            } else {
                // Si no se ingresaron fechas válidas, aplica el filtro sin considerar la fecha
                return cumpleFiltroNombreVendedor && cumpleFiltroDNIVendedor && cumpleFiltroLinea && cumpleFiltroDNICliente;
            }
        });
    
        mostrarVentasBO(ventasFiltradas);
    });



    function mostrarVentasBO(ventas) {
        ventasBO.innerHTML = "";

        if (ventas.length === 0) {
            ventasBO.textContent = "No se encontraron ventas que coincidan con los filtros.";
        } else {
            ventas.sort((ventaA, ventaB) => {
                const fechaA = new Date(ventaA.fecha);
                const fechaB = new Date(ventaB.fecha);
    
                if (fechaA.getTime() === fechaB.getTime()) {
                    const horaA = ventaA.hora.split(":");
                    const horaB = ventaB.hora.split(":");
                    
                    if (horaA[0] !== horaB[0]) {
                        return horaB[0] - horaA[0];
                    } else if (horaA[1] !== horaB[1]) {
                        return horaB[1] - horaA[1];
                    } else {
                        return horaB[2] - horaA[2];
                    }
                }
    
                return fechaB - fechaA;
            });
    
            ventas.forEach(venta => {
                const ventaInfo = document.createElement("div");
                ventaInfo.classList.add("venta-info-container");
                ventaInfo.setAttribute("data-id", venta.id);
                ventaInfo.innerHTML = `
                    <h3>Línea: ${venta.linea.numero}</h3>
                    <p>Venta ID: ${venta.id}</p>
                    <p>Vendedor: ${venta.vendedor.nombre} (DNI: ${venta.vendedor.dni})</p> 
                    <p>Estado: ${venta.estado}</p>
                    <div class="detalles-venta-top hidden" id="detalles-${venta.id}">
                    <!-- Aquí se mostrarán los detalles cuando se despliegue -->
                    </div>
                    <button class="ver-detalles-btn" data-id="${venta.id}">▼</button>
                    <div class="venta-pluggins">
                    <div class="detalles-venta hidden">
                    <label for="estado-${venta.id}">Cambiar Estado:</label>
                    <select id="estado-${venta.id}">
                    </div>
                    <option value="APROBADA OK">APROBADA OK</option>
                    <option value="CARGADO EN T3">CARGADO EN T3</option>
                    <option value="ERROR DE LINEA">ERROR DE LINEA</option>
                    <option value="RETRABAJAR">RETRABAJAR</option>
                    <option value="ANULADA GESTION MAL CARGADA">ANULADA GESTION MAL CARGADA</option>
                    <option value="ANULADA CLIENTE DECISTE">ANULADA CLIENTE DECISTE</option>
                    </select>
                    <div class="botonera">
                    <button class="editar-estado" data-id="${venta.id}">Cambiar Estado</button>
                    <button class="editar-linea-btn" data-id="${venta.id}">Editar Linea</button>
                    <button class="anular-venta" data-id="${venta.id}">Anular Venta</button>
                    <div id="loader-vendedor-${venta.id}" class="loader"></div>
                    </div>
                    </div>
                `;

                const cambiarEstadoBtn = ventaInfo.querySelector(".editar-estado");
                cambiarEstadoBtn.addEventListener("click", function() {
                    const nuevoEstado = document.getElementById(`estado-${venta.id}`).value;
                    const loaderId = `loader-vendedor-${venta.id}`;
                    const loader = document.getElementById(loaderId);
                    if (loader) {
                        loader.style.display = "block";
                    }    
                    cambiarEstadoVenta(venta.id, nuevoEstado); // Utiliza venta.id en lugar de venta.id_
                });

                const editarLineaBtn = ventaInfo.querySelector(".editar-linea-btn");
                editarLineaBtn.addEventListener("click", function() {
                    toggleMenuEdicion(venta);
                });

                const verDetallesBtn = ventaInfo.querySelector(".ver-detalles-btn");
                verDetallesBtn.addEventListener("click", function() {
                    toggleDetallesVenta(venta);
                });

                const anularVenta = ventaInfo.querySelector(".anular-venta");
                anularVenta.addEventListener("click", function(){
                    toggleAnularVenta(venta);
                });

                ventasBO.appendChild(ventaInfo);
                const ventaID = venta.id; // Accede al ID de la venta

                console.log("ID de la venta:", ventaID);
            });
        }
        
    }

    function toggleAnularVenta(venta) {
        const ventaId = venta.id;
    
        // Mostrar un cuadro de diálogo para ingresar la contraseña
        const enteredPassword = window.prompt("Por favor, ingresa la contraseña para anular la venta:");
    
        if (enteredPassword === "Azo2023") {
            // La contraseña es correcta, procede a anular la venta
            anularVenta(ventaId);
        } else {
            // Contraseña incorrecta, muestra un mensaje de error
            mostrarMensajeError("Contraseña incorrecta. No se anuló la venta.")
        }
    }
    
    async function anularVenta(ventaId) {
        const ventaRef = doc(database, "ventas", ventaId);
        const loaderId = `loader-vendedor-${ventaId}`;
        const loader = document.getElementById(loaderId);
        if (loader) {
            loader.style.display = "block";
        }  
    
        try {
            await deleteDoc(ventaRef);
            console.log("Venta anulada correctamente.");
            mostrarMensajeExito("Venta anulada correctamente.")
            // Obtén nuevamente las ventas actualizadas después de eliminar una venta
            const ventasSnapshot = await getDocs(ventasCollection);
            const ventasArray = ventasSnapshot.docs.map(doc => doc.data());
    
            mostrarVentasBO(ventasArray); // Llama a mostrarVentasBO con las ventas actualizadas
        } catch (error) {
            console.error("Error al anular la venta:", error);
            mostrarMensajeError("Error al anular la venta. Por favor, inténtalo nuevamente.")
        }
    }
    
    
    async function cambiarEstadoVenta(id, nuevoEstado) {
        const ventaRef = doc(database, "ventas", id);
        try {
            await updateDoc(ventaRef, { estado: nuevoEstado });
            console.log("Estado de venta actualizado correctamente.");
            mostrarMensajeExito("Estado de venta actualizado correctamente.")
            // Después de actualizar, volvemos a obtener los datos de Firestore y actualizar la página
            const ventasSnapshot = await getDocs(ventasCollection);
            const ventasArray = ventasSnapshot.docs.map(doc => doc.data());
            mostrarVentasBO(ventasArray);
        } catch (error) {
            console.error("Error al actualizar el estado de la venta:", error);
            mostrarMensajeError("Error al actualizar el estado de la venta")
        }
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
                    <label for="cliente-linea">Línea de Contacto (como figura en mitrol):</label>
                    <input type="text" id="cliente-linea" value="${venta.cliente.llamado}"><br>
                    <label for="nombre">Nombre:</label>
                    <input type="text" id="nombre" value="${venta.cliente.nombre}"><br>
                    <label for="dni">DNI:</label>
                    <input type="text" id="dni" value="${venta.cliente.dni}"><br>
                    <label for="mail">Email:</label>
                    <input type="email" id="mail" value="${venta.cliente.mail}"><br>
                    <label for="contacto">Linea Alternativa:</label>
                    <input type="tel" id="contacto" value="${venta.cliente.contacto}"><br>
                    <label for="linea-numero">Número de Línea a Migrar:</label>
                    <input type="text" id="linea-numero" value="${venta.linea.numero}"><br>
                    <label for="linea-plan">Plan Adquirido:</label>
                    <select id="linea-plan">
                        <option value="1-5GB">1,5 GB (Bono Desc -$2750)</option>
                        <option value="3GB">3 GB (Bono Desc -$3650)</option>
                        <option value="6GB">6 GB (Bono Desc -$5100)</option>
                    </select><br>
                    <button type="submit">Guardar Cambios</button>
                `;

            formularioEdicion.addEventListener("submit", async function(event) {
                event.preventDefault();
                const loaderId = `loader-vendedor-${venta.id}`;
                const loader = document.getElementById(loaderId);
                if (loader) {
                    loader.style.display = "block";
                }  
                const numeroLineaInput = document.getElementById("linea-numero");
                const nuevoNumeroLinea = numeroLineaInput.value;
            
                // Verificar si el nuevo número de línea ya existe en la base de datos
                const lineaExists = await verificaNumeroLineaExiste(nuevoNumeroLinea, venta.id);
            
                if (lineaExists) {
                    mostrarMensajeError("Este número de línea ya está registrado.")
                } else {
                // Actualiza los datos de la venta con la información modificada
                venta.cliente.nombre = document.getElementById("nombre").value;
                venta.cliente.llamado = document.getElementById("cliente-linea").value;
                venta.cliente.dni = document.getElementById("dni").value;
                venta.cliente.mail = document.getElementById("mail").value;
                venta.cliente.contacto = document.getElementById("contacto").value;
                venta.linea.numero = document.getElementById("linea-numero").value;
                venta.linea.plan = document.getElementById("linea-plan").value;

                // Actualiza la venta en Firestore
                const ventaDocRef = doc(ventasCollection, venta.id);
                await updateDoc(ventaDocRef, venta);

                // Limpia el menú de edición
                menuEdicion.remove();
                mostrarMensajeExito("La línea se edito exitosamente")

                // Llama a mostrarVentas después de un breve retraso
                setTimeout(() => {
                   mostrarVentasBO(ventasArray);
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
    
});

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

function toggleDetallesVenta(venta) {
    const detallesVenta = document.getElementById(`detalles-${venta.id}`);
    
    if (detallesVenta) { // Verificar si el elemento existe antes de continuar
        if (detallesVenta.classList.contains("hidden")) {
            detallesVenta.innerHTML += `
                <div class="detalles-venta">
                <div class="detalles-venta">
                    <p>Cliente: ${venta.cliente.nombre}</p>
                    <p>DNI: ${venta.cliente.dni}</p>
                    <p>Email: ${venta.cliente.mail}</p>
                    <p>Linea Alternativa: ${venta.cliente.contacto}</p>
                    <p>Linea de Llamada: ${venta.cliente.llamado}</p>
                    <p>Plan: ${venta.linea.plan}</p>
                    <p>Fecha: ${venta.fecha}</p>
                    <p>Hora: ${venta.hora}</p>
                </div>
                </div>
            `;
            detallesVenta.classList.remove("hidden");
        } else {
            detallesVenta.innerHTML = "";
            detallesVenta.classList.add("hidden");
        }
    }
}
