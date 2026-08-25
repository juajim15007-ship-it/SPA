/* =========================================================
   SERENITY SPA - ADMINISTRADOR
========================================================= */

const { createClient } = window.supabase;

const C = window.SERENITY_CONFIG;

let db = null;

let products = [];

let appointments = [];


/* =========================================================
   SELECTOR
========================================================= */

const $ = selector =>
    document.querySelector(selector);


/* =========================================================
   ESCAPAR HTML
========================================================= */

const esc = value =>
    String(value ?? "").replace(
        /[&<>"']/g,
        m => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[m])
    );


/* =========================================================
   DINERO
========================================================= */

const money = value =>
    new Intl.NumberFormat(
        "es-CO",
        {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0
        }
    ).format(value || 0);


/* =========================================================
   INICIO
========================================================= */

async function init() {

    if (
        C.url &&
        C.key &&
        !C.url.includes("TU-PROYECTO")
    ) {

        db = createClient(
            C.url,
            C.key
        );

    }


    if (!db) {

        toast(
            "Supabase no está configurado"
        );

        return;
    }


    bind();

    await checkSession();

}


/* =========================================================
   EVENTOS
========================================================= */

function bind() {

    $("#loginForm").onsubmit =
        login;


    $("#logout").onclick =
        logout;


    $("#productsTab").onclick =
        () => showTab("products");


    $("#appointmentsTab").onclick =
        () => showTab("appointments");


    $("#newProduct").onclick =
        () => openEditor();


    $("#refreshAppointments").onclick =
        loadAppointments;

}


/* =========================================================
   SESIÓN
========================================================= */

async function checkSession() {

    const result =
        await db.auth.getSession();


    if (
        result.data &&
        result.data.session
    ) {

        $("#loginSection")
            .classList.add("hidden");

        $("#panel")
            .classList.remove("hidden");

        await loadAll();

    } else {

        $("#loginSection")
            .classList.remove("hidden");

        $("#panel")
            .classList.add("hidden");

    }

}


/* =========================================================
   LOGIN
========================================================= */

async function login(e) {

    e.preventDefault();


    const email =
        $("#email").value.trim();

    const password =
        $("#password").value;


    const result =
        await db.auth.signInWithPassword({
            email,
            password
        });


    if (result.error) {

        toast(
            result.error.message
        );

        return;
    }


    $("#loginSection")
        .classList.add("hidden");

    $("#panel")
        .classList.remove("hidden");


    await loadAll();

}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

    await db.auth.signOut();

    window.location.href =
        "index.html";

}


/* =========================================================
   CARGAR TODO
========================================================= */

async function loadAll() {

    await loadProducts();

    await loadAppointments();

    updateStats();

}


/* =========================================================
   SERVICIOS
========================================================= */

async function loadProducts() {

    const result =
        await db
            .from("products")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (result.error) {

        toast(
            result.error.message
        );

        return;
    }


    products =
        result.data || [];


    renderProducts();

    updateStats();

}


/* =========================================================
   RENDER SERVICIOS
========================================================= */

function renderProducts() {

    const container =
        $("#productsList");


    if (!products.length) {

        container.innerHTML = `
            <div class="empty">
                No hay servicios registrados.
            </div>
        `;

        return;
    }


    container.innerHTML =
        products
            .map(product => `

                <article class="productRow">

                    <div class="productImage">

                        ${
                            product.image_url
                                ? `
                                    <img
                                        src="${esc(product.image_url)}"
                                        alt="${esc(product.name)}"
                                    >
                                `
                                : "✦"
                        }

                    </div>


                    <div class="productInfo">

                        <h3>
                            ${esc(product.name)}
                        </h3>

                        <p>
                            ${esc(
                                product.description ||
                                "Sin descripción"
                            )}
                        </p>

                        <div class="productMeta">

                            <span>
                                ${esc(product.category)}
                            </span>

                            <span>
                                ${product.duration} min
                            </span>

                            <strong>
                                ${money(product.price)}
                            </strong>

                        </div>

                    </div>


                    <div class="productActions">

                        <button
                            class="secondaryBtn"
                            data-edit-product="${product.id}"
                        >
                            ✎ Editar
                        </button>

                        <button
                            class="dangerBtn"
                            data-delete-product="${product.id}"
                        >
                            🗑 Eliminar
                        </button>

                    </div>

                </article>

            `)
            .join("");


    document
        .querySelectorAll(
            "[data-edit-product]"
        )
        .forEach(button => {

            button.onclick = () => {

                const product =
                    products.find(
                        p =>
                            String(p.id) ===
                            String(
                                button.dataset
                                    .editProduct
                            )
                    );

                openEditor(product);

            };

        });


    document
        .querySelectorAll(
            "[data-delete-product]"
        )
        .forEach(button => {

            button.onclick =
                () =>
                    deleteProduct(
                        button.dataset
                            .deleteProduct
                    );

        });

}


/* =========================================================
   EDITOR
========================================================= */

function openEditor(product = null) {

    const editor =
        $("#productEditor");


    editor.innerHTML = `

        <div class="editorCard">

            <div class="editorHeader">

                <h3>
                    ${
                        product
                            ? "Editar servicio"
                            : "Nuevo servicio"
                    }
                </h3>

                <button
                    id="closeEditor"
                    class="closeEditor"
                >
                    ×
                </button>

            </div>


            <div class="formGrid">

                <label>
                    Nombre

                    <input
                        id="productName"
                        value="${esc(
                            product?.name || ""
                        )}"
                        required
                    >
                </label>


                <label>
                    Categoría

                    <input
                        id="productCategory"
                        value="${esc(
                            product?.category ||
                            "Masajes"
                        )}"
                        required
                    >
                </label>


                <label>
                    Duración en minutos

                    <input
                        id="productDuration"
                        type="number"
                        min="1"
                        value="${
                            product?.duration ||
                            60
                        }"
                        required
                    >
                </label>


                <label>
                    Precio

                    <input
                        id="productPrice"
                        type="number"
                        min="0"
                        value="${
                            product?.price ||
                            0
                        }"
                        required
                    >
                </label>

            </div>


            <label>
                Descripción

                <textarea
                    id="productDescription"
                    rows="5"
                    placeholder="Describe el tratamiento..."
                >${esc(
                    product?.description || ""
                )}</textarea>

            </label>


            <label>
                URL de imagen

                <input
                    id="productImage"
                    value="${esc(
                        product?.image_url || ""
                    )}"
                    placeholder="https://..."
                >

            </label>


            <div class="editorButtons">

                <button
                    id="saveProduct"
                    class="primaryBtn"
                >
                    ${
                        product
                            ? "Guardar cambios"
                            : "Crear servicio"
                    }
                </button>

                <button
                    id="cancelEditor"
                    class="secondaryBtn"
                >
                    Cancelar
                </button>

            </div>

        </div>

    `;


    $("#closeEditor").onclick =
        closeEditor;


    $("#cancelEditor").onclick =
        closeEditor;


    $("#saveProduct").onclick =
        () => saveProduct(product);

}


/* =========================================================
   CERRAR EDITOR
========================================================= */

function closeEditor() {

    $("#productEditor")
        .innerHTML = "";

}


/* =========================================================
   GUARDAR SERVICIO
========================================================= */

async function saveProduct(product) {

    const body = {

        name:
            $("#productName")
                .value
                .trim(),

        category:
            $("#productCategory")
                .value
                .trim(),

        duration:
            Number(
                $("#productDuration")
                    .value
            ),

        price:
            Number(
                $("#productPrice")
                    .value
            ),

        description:
            $("#productDescription")
                .value
                .trim(),

        image_url:
            $("#productImage")
                .value
                .trim(),

        active: true

    };


    if (!body.name) {

        toast(
            "Escribe el nombre del servicio"
        );

        return;
    }


    let result;


    if (product) {

        result =
            await db
                .from("products")
                .update(body)
                .eq("id", product.id);

    } else {

        result =
            await db
                .from("products")
                .insert(body);

    }


    if (result.error) {

        toast(
            result.error.message
        );

        return;
    }


    toast(
        product
            ? "Servicio actualizado"
            : "Servicio creado"
    );


    closeEditor();

    await loadProducts();

}


/* =========================================================
   ELIMINAR SERVICIO
========================================================= */

async function deleteProduct(id) {

    const product =
        products.find(
            p =>
                String(p.id) ===
                String(id)
        );


    if (!product) return;


    const confirmDelete =
        confirm(
            `¿Eliminar "${product.name}"?`
        );


    if (!confirmDelete)
        return;


    const result =
        await db
            .from("products")
            .delete()
            .eq("id", id);


    if (result.error) {

        toast(
            result.error.message
        );

        return;
    }


    toast(
        "Servicio eliminado"
    );


    await loadProducts();

}


/* =========================================================
   CITAS
========================================================= */

async function loadAppointments() {

    const result =
        await db
            .from("appointments")
            .select(`
                *,
                products (
                    id,
                    name,
                    description,
                    duration,
                    price
                )
            `)
            .order(
                "date",
                {
                    ascending: true
                }
            )
            .order(
                "time",
                {
                    ascending: true
                }
            );


    if (result.error) {

        toast(
            result.error.message
        );

        return;
    }


    appointments =
        result.data || [];


    renderAppointments();

    updateStats();

}


/* =========================================================
   RENDER CITAS
========================================================= */

function renderAppointments() {

    const container =
        $("#appointmentsList");


    if (!appointments.length) {

        container.innerHTML = `
            <div class="empty">
                No hay citas reservadas.
            </div>
        `;

        return;
    }


    container.innerHTML =
        appointments
            .map(a => {

                const product =
                    a.products || {};


                return `

                    <article class="appointmentCard">

                        <div class="appointmentMain">

                            <div class="appointmentDate">

                                <strong>
                                    ${formatDate(a.date)}
                                </strong>

                                <span>
                                    ${formatTime(a.time)}
                                </span>

                            </div>


                            <div class="appointmentInfo">

                                <h3>
                                    ${esc(a.name)}
                                </h3>

                                <p class="serviceName">
                                    ${esc(
                                        product.name ||
                                        "Servicio eliminado"
                                    )}
                                </p>

                                <p>
                                    ${esc(
                                        product.description ||
                                        "Sin descripción"
                                    )}
                                </p>


                                <div class="appointmentMeta">

                                    <span>
                                        📱 ${esc(a.phone)}
                                    </span>

                                    <span>
                                        ⏱ ${
                                            product.duration ||
                                            "-"
                                        } min
                                    </span>

                                    <span>
                                        ${
                                            product.price
                                                ? money(
                                                    product.price
                                                )
                                                : ""
                                        }
                                    </span>

                                </div>

                            </div>


                            <div class="statusArea">

                                <span
                                    class="status ${statusClass(
                                        a.status
                                    )}"
                                >
                                    ${esc(
                                        a.status ||
                                        "pendiente"
                                    )}
                                </span>

                            </div>

                        </div>


                        <div class="appointmentActions">

                            <button
                                class="whatsappBtn"
                                data-whatsapp="${a.id}"
                            >
                                💬 WhatsApp
                            </button>


                            ${
                                a.status ===
                                "pendiente"
                                    ? `
                                        <button
                                            class="confirmBtn"
                                            data-confirm="${a.id}"
                                        >
                                            ✓ Confirmar
                                        </button>

                                        <button
                                            class="cancelBtn"
                                            data-cancel="${a.id}"
                                        >
                                            × Cancelar
                                        </button>
                                    `
                                    : ""
                            }


                            ${
                                a.status ===
                                "confirmada"
                                    ? `
                                        <button
                                            class="dangerBtn"
                                            data-delete-appointment="${a.id}"
                                        >
                                            🗑 Eliminar cita
                                        </button>
                                    `
                                    : ""
                            }

                        </div>

                    </article>

                `;

            })
            .join("");


    /*
     * WhatsApp
     */

    document
        .querySelectorAll(
            "[data-whatsapp]"
        )
        .forEach(button => {

            button.onclick =
                () =>
                    sendWhatsApp(
                        button.dataset
                            .whatsapp
                    );

        });


    /*
     * Confirmar
     */

    document
        .querySelectorAll(
            "[data-confirm]"
        )
        .forEach(button => {

            button.onclick =
                () =>
                    updateAppointment(
                        button.dataset
                            .confirm,
                        "confirmada"
                    );

        });


    /*
     * Cancelar
     */

    document
        .querySelectorAll(
            "[data-cancel]"
        )
        .forEach(button => {

            button.onclick =
                () =>
                    updateAppointment(
                        button.dataset
                            .cancel,
                        "cancelada"
                    );

        });


    /*
     * Eliminar confirmada
     */

    document
        .querySelectorAll(
            "[data-delete-appointment]"
        )
        .forEach(button => {

            button.onclick =
                () =>
                    deleteAppointment(
                        button.dataset
                            .deleteAppointment
                    );

        });

}


/* =========================================================
   ACTUALIZAR CITA
========================================================= */

async function updateAppointment(
    id,
    newStatus
) {

    const result =
        await db
            .from("appointments")
            .update({
                status: newStatus
            })
            .eq("id", id);


    if (result.error) {

        toast(
            result.error.message
        );

        return;
    }


    toast(
        newStatus === "confirmada"
            ? "Cita confirmada"
            : "Cita cancelada"
    );


    await loadAppointments();

}


/* =========================================================
   ELIMINAR CITA
========================================================= */

async function deleteAppointment(id) {

    const appointment =
        appointments.find(
            a =>
                String(a.id) ===
                String(id)
        );


    if (!appointment)
        return;


    if (
        appointment.status !==
        "confirmada"
    ) {

        toast(
            "Solo se pueden eliminar citas confirmadas"
        );

        return;
    }


    const accepted =
        confirm(
            `¿Eliminar definitivamente la cita de ${appointment.name}?`
        );


    if (!accepted)
        return;


    const result =
        await db
            .from("appointments")
            .delete()
            .eq("id", id);


    if (result.error) {

        toast(
            result.error.message
        );

        return;
    }


    toast(
        "Cita eliminada"
    );


    await loadAppointments();

}


/* =========================================================
   WHATSAPP
========================================================= */

function sendWhatsApp(id) {

    const appointment =
        appointments.find(
            a =>
                String(a.id) ===
                String(id)
        );


    if (!appointment) {

        toast(
            "No se encontró la cita"
        );

        return;
    }


    const product =
        appointment.products || {};


    /*
     * Normalizar teléfono
     *
     * Si el cliente escribe:
     * 3111234567
     *
     * se convierte en:
     * 573111234567
     */

    let phone =
        String(
            appointment.phone || ""
        )
        .replace(/\D/g, "");


    if (
        phone.length === 10 &&
        phone.startsWith("3")
    ) {

        phone =
            "57" + phone;

    }


    if (!phone) {

        toast(
            "La cita no tiene teléfono"
        );

        return;
    }


    const message = `Hola ${appointment.name}, te escribimos de Serenity Spa 🌿

Queremos confirmar tu cita:

✨ Servicio: ${product.name || "Servicio"}
📝 Descripción: ${product.description || "Sin descripción"}
📅 Fecha: ${formatDate(appointment.date)}
🕐 Hora: ${formatTime(appointment.time)}
⏱ Duración: ${product.duration || "-"} minutos
💰 Valor: ${product.price ? money(product.price) : "-"}

Por favor confírmanos si puedes asistir en este horario.

Si necesitas cambiar la fecha o la hora, escríbenos para buscarte otro espacio disponible.

¡Gracias por elegir Serenity Spa! 🌿`;


    const url =
        `https://wa.me/${phone}?text=${encodeURIComponent(
            message
        )}`;


    window.open(
        url,
        "_blank"
    );

}


/* =========================================================
   FORMATO FECHA
========================================================= */

function formatDate(date) {

    if (!date)
        return "-";


    const parts =
        String(date)
            .split("-");


    if (parts.length !== 3)
        return date;


    return `${parts[2]}/${parts[1]}/${parts[0]}`;

}


/* =========================================================
   FORMATO HORA
========================================================= */

function formatTime(time) {

    return String(
        time || ""
    ).slice(0, 5);

}


/* =========================================================
   ESTADO
========================================================= */

function statusClass(status) {

    if (
        status ===
        "confirmada"
    )
        return "confirmed";


    if (
        status ===
        "cancelada"
    )
        return "cancelled";


    return "pending";

}


/* =========================================================
   ESTADÍSTICAS
========================================================= */

function updateStats() {

    if ($("#statProducts"))
        $("#statProducts")
            .textContent =
            products.length;


    if ($("#statPending"))
        $("#statPending")
            .textContent =
            appointments.filter(
                a =>
                    a.status ===
                    "pendiente"
            ).length;


    if ($("#statConfirmed"))
        $("#statConfirmed")
            .textContent =
            appointments.filter(
                a =>
                    a.status ===
                    "confirmada"
            ).length;

}


/* =========================================================
   CAMBIAR PESTAÑA
========================================================= */

function showTab(tab) {

    if (
        tab ===
        "products"
    ) {

        $("#productsSection")
            .classList.remove(
                "hidden"
            );

        $("#appointmentsSection")
            .classList.add(
                "hidden"
            );

        $("#productsTab")
            .classList.add(
                "active"
            );

        $("#appointmentsTab")
            .classList.remove(
                "active"
            );

    } else {

        $("#productsSection")
            .classList.add(
                "hidden"
            );

        $("#appointmentsSection")
            .classList.remove(
                "hidden"
            );

        $("#productsTab")
            .classList.remove(
                "active"
            );

        $("#appointmentsTab")
            .classList.add(
                "active"
            );

        loadAppointments();

    }

}


/* =========================================================
   TOAST
========================================================= */

function toast(message) {

    const element =
        $("#toast");


    element.textContent =
        message;


    element.classList.remove(
        "hidden"
    );


    clearTimeout(
        window.toastTimer
    );


    window.toastTimer =
        setTimeout(
            () =>
                element.classList.add(
                    "hidden"
                ),
            3500
        );

}


/* =========================================================
   INICIAR
========================================================= */

init();