/* =========================================================
   SERENITY SPA
   PANEL DE ADMINISTRACIÓN
========================================================= */


const { createClient } = window.supabase;

const C = window.SERENITY_CONFIG;

let db = null;

let products = [];

let reservations = [];


/* =========================================================
   SELECTOR
========================================================= */

const $ = selector =>
    document.querySelector(selector);


/* =========================================================
   FORMATO DINERO
========================================================= */

function money(value) {

    return new Intl.NumberFormat(
        "es-CO",
        {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0
        }
    ).format(value || 0);

}


/* =========================================================
   ESCAPAR HTML
========================================================= */

function esc(value) {

    return String(value ?? "")
        .replace(
            /[&<>"']/g,
            character => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            }[character])
        );

}


/* =========================================================
   INICIALIZACIÓN
========================================================= */

async function initAdmin() {

    if (
        !C?.url ||
        !C?.key ||
        C.url.includes("TU-PROYECTO")
    ) {

        showLoginError(
            "Supabase no está configurado."
        );

        return;
    }


    db = createClient(
        C.url,
        C.key
    );


    bindEvents();


    const session =
        await db.auth.getSession();


    if (
        session.data.session
    ) {

        showDashboard();

    } else {

        showLogin();

    }

}


/* =========================================================
   EVENTOS
========================================================= */

function bindEvents() {

    $("#loginForm").onsubmit =
        login;


    $("#logout").onclick =
        logout;


    $("#refreshReservations").onclick =
        loadReservations;


    $("#newService").onclick =
        () => openServiceEditor();


    document
        .querySelectorAll(".admin-tab")
        .forEach(button => {

            button.onclick = () => {

                switchTab(
                    button.dataset.tab
                );

            };

        });

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

        showLoginError(
            result.error.message
        );

        return;
    }


    showDashboard();

}


/* =========================================================
   CERRAR SESIÓN
========================================================= */

async function logout() {

    await db.auth.signOut();

    showLogin();

}


/* =========================================================
   MOSTRAR LOGIN
========================================================= */

function showLogin() {

    $("#loginSection")
        .classList.remove("hidden");

    $("#dashboard")
        .classList.add("hidden");

}


/* =========================================================
   MOSTRAR PANEL
========================================================= */

async function showDashboard() {

    $("#loginSection")
        .classList.add("hidden");

    $("#dashboard")
        .classList.remove("hidden");


    await loadProducts();

    await loadReservations();

    renderStats();

}


/* =========================================================
   CARGAR SERVICIOS
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


    renderServices();

    renderStats();

}


/* =========================================================
   CARGAR RESERVAS
========================================================= */

async function loadReservations() {

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

        console.error(
            result.error
        );

        toast(
            result.error.message
        );

        return;
    }


    reservations =
        result.data || [];


    renderReservations();

    renderStats();

}


/* =========================================================
   ESTADÍSTICAS
========================================================= */

function renderStats() {

    const pending =
        reservations.filter(
            r =>
                r.status ===
                "pendiente"
        ).length;


    const confirmed =
        reservations.filter(
            r =>
                r.status ===
                "confirmada"
        ).length;


    const cancelled =
        reservations.filter(
            r =>
                r.status ===
                "cancelada"
        ).length;


    $("#stats").innerHTML = `

        <div class="stat-card">

            <span>
                📅
            </span>

            <b>
                ${reservations.length}
            </b>

            <small>
                Total citas
            </small>

        </div>


        <div class="stat-card">

            <span>
                ⏳
            </span>

            <b>
                ${pending}
            </b>

            <small>
                Pendientes
            </small>

        </div>


        <div class="stat-card">

            <span>
                ✓
            </span>

            <b>
                ${confirmed}
            </b>

            <small>
                Confirmadas
            </small>

        </div>


        <div class="stat-card">

            <span>
                ×
            </span>

            <b>
                ${cancelled}
            </b>

            <small>
                Canceladas
            </small>

        </div>

    `;

}


/* =========================================================
   MOSTRAR RESERVAS
========================================================= */

function renderReservations() {

    const container =
        $("#reservationsList");


    if (!reservations.length) {

        container.innerHTML = `
            <div class="empty-state">

                <div>
                    📅
                </div>

                <h3>
                    No hay citas todavía
                </h3>

                <p>
                    Las nuevas reservas aparecerán aquí.
                </p>

            </div>
        `;

        return;
    }


    container.innerHTML =
        reservations
            .map(renderReservation)
            .join("");


    /*
     * Confirmar
     */
    container
        .querySelectorAll("[data-confirm]")
        .forEach(button => {

            button.onclick = () =>
                updateStatus(
                    button.dataset.confirm,
                    "confirmada"
                );

        });


    /*
     * Cancelar
     */
    container
        .querySelectorAll("[data-cancel]")
        .forEach(button => {

            button.onclick = () =>
                updateStatus(
                    button.dataset.cancel,
                    "cancelada"
                );

        });


    /*
     * Eliminar confirmada
     */
    container
        .querySelectorAll(
            "[data-delete-confirmed]"
        )
        .forEach(button => {

            button.onclick = () =>
                deleteConfirmed(
                    button.dataset.deleteConfirmed
                );

        });


    /*
     * WhatsApp
     */
    container
        .querySelectorAll("[data-whatsapp]")
        .forEach(button => {

            button.onclick = () =>
                openWhatsApp(
                    button.dataset.whatsapp
                );

        });


    /*
     * WhatsApp para reprogramar
     */
    container
        .querySelectorAll("[data-reschedule]")
        .forEach(button => {

            button.onclick = () =>
                openWhatsApp(
                    button.dataset.reschedule
                );

        });

}


/* =========================================================
   TARJETA DE RESERVA
========================================================= */

function renderReservation(reservation) {

    const product =
        reservation.products;


    const status =
        reservation.status ||
        "pendiente";


    const whatsappMessage =
        createWhatsAppMessage(
            reservation,
            "confirmar"
        );


    const rescheduleMessage =
        createWhatsAppMessage(
            reservation,
            "reprogramar"
        );


    const statusClass =
        status
            .toLowerCase()
            .replace(
                "ó",
                "o"
            );


    return `

        <article
            class="reservation-card"
        >

            <div
                class="reservation-main"
            >

                <div
                    class="reservation-date"
                >

                    <strong>
                        ${formatDay(
                            reservation.date
                        )}
                    </strong>

                    <span>
                        ${formatDate(
                            reservation.date
                        )}
                    </span>

                </div>


                <div
                    class="reservation-info"
                >

                    <div
                        class="reservation-title"
                    >

                        <h3>
                            ${esc(
                                reservation.name
                            )}
                        </h3>

                        <span
                            class="status ${statusClass}"
                        >
                            ${esc(status)}
                        </span>

                    </div>


                    <p>
                        <strong>
                            ${esc(
                                product?.name ||
                                "Servicio"
                            )}
                        </strong>
                    </p>


                    <p class="reservation-details">

                        🕐
                        ${formatTime(
                            reservation.time
                        )}

                        ·

                        ⏱️
                        ${product?.duration || 60}
                        min

                        ·

                        💰
                        ${money(
                            product?.price
                        )}

                    </p>


                    <p>
                        📱
                        ${esc(
                            reservation.phone
                        )}
                    </p>


                    ${
                        product?.description
                            ? `
                                <div
                                    class="reservation-description"
                                >
                                    ${esc(
                                        product.description
                                    )}
                                </div>
                              `
                            : ""
                    }


                    ${
                        reservation.notes
                            ? `
                                <div
                                    class="reservation-notes"
                                >
                                    <strong>
                                        Notas:
                                    </strong>

                                    ${esc(
                                        reservation.notes
                                    )}
                                </div>
                              `
                            : ""
                    }

                </div>

            </div>


            <div
                class="reservation-actions"
            >

                <button
                    class="btn whatsapp"
                    data-whatsapp="${esc(
                        reservation.id
                    )}"
                    type="button"
                >
                    💬 WhatsApp
                </button>


                <button
                    class="btn reschedule"
                    data-reschedule="${esc(
                        reservation.id
                    )}"
                    type="button"
                >
                    🔄 Reprogramar
                </button>


                ${
                    status === "pendiente"
                        ? `
                            <button
                                class="btn primary"
                                data-confirm="${esc(
                                    reservation.id
                                )}"
                                type="button"
                            >
                                ✓ Confirmar
                            </button>

                            <button
                                class="btn danger"
                                data-cancel="${esc(
                                    reservation.id
                                )}"
                                type="button"
                            >
                                Cancelar
                            </button>
                          `
                        : ""
                }


                ${
                    status === "confirmada"
                        ? `
                            <button
                                class="btn danger"
                                data-delete-confirmed="${esc(
                                    reservation.id
                                )}"
                                type="button"
                            >
                                🗑 Eliminar
                            </button>
                          `
                        : ""
                }

            </div>

        </article>

    `;

}


/* =========================================================
   CAMBIAR ESTADO
========================================================= */

async function updateStatus(
    id,
    status
) {

    const confirmation =
        status === "confirmada"
            ? "¿Confirmar esta cita?"
            : "¿Cancelar esta cita?";


    if (!confirm(confirmation)) {
        return;
    }


    const result =
        await db
            .from("appointments")
            .update({
                status
            })
            .eq(
                "id",
                id
            );


    if (result.error) {

        toast(
            result.error.message
        );

        return;
    }


    toast(
        status === "confirmada"
            ? "Cita confirmada"
            : "Cita cancelada"
    );


    await loadReservations();

}


/* =========================================================
   ELIMINAR CITA CONFIRMADA
========================================================= */

async function deleteConfirmed(id) {

    const reservation =
        reservations.find(
            r =>
                String(r.id) ===
                String(id)
        );


    if (
        !reservation ||
        reservation.status !==
        "confirmada"
    ) {

        toast(
            "Solo se pueden eliminar citas confirmadas."
        );

        return;
    }


    if (
        !confirm(
            "¿Seguro que deseas eliminar esta cita confirmada? Esta acción no se puede deshacer."
        )
    ) {

        return;
    }


    const result =
        await db
            .from("appointments")
            .delete()
            .eq(
                "id",
                id
            )
            .eq(
                "status",
                "confirmada"
            );


    if (result.error) {

        toast(
            result.error.message
        );

        return;
    }


    toast(
        "Cita eliminada correctamente."
    );


    await loadReservations();

}


/* =========================================================
   MENSAJE WHATSAPP
========================================================= */

function createWhatsAppMessage(
    reservation,
    type
) {

    const product =
        reservation.products;


    const client =
        reservation.name;


    const date =
        formatDate(
            reservation.date
        );


    const time =
        formatTime(
            reservation.time
        );


    if (
        type ===
        "reprogramar"
    ) {

        return `Hola ${client}, te escribimos de Serenity Spa 🌿

Tenemos registrada tu reserva:

✨ Servicio: ${product?.name || "Servicio"}
📝 Descripción: ${product?.description || "No disponible"}
📅 Fecha: ${date}
🕐 Hora: ${time}
⏱️ Duración: ${product?.duration || 60} minutos

Por motivos de disponibilidad, necesitamos revisar contigo la posibilidad de reprogramar tu cita.

Por favor indícanos qué otro horario te funciona mejor.

Gracias por confiar en Serenity Spa 💚`;

    }


    return `Hola ${client}, te escribimos de Serenity Spa 🌿

Queremos confirmar tu cita:

✨ Servicio: ${product?.name || "Servicio"}
📝 Descripción: ${product?.description || "No disponible"}
📅 Fecha: ${date}
🕐 Hora: ${time}
⏱️ Duración: ${product?.duration || 60} minutos
💰 Valor: ${money(product?.price)}

Por favor respóndenos confirmando si puedes asistir en la fecha y hora indicadas.

Si necesitas cambiar el horario, también puedes indicárnoslo por este medio.

¡Gracias por elegir Serenity Spa! 🌿`;

}


/* =========================================================
   ABRIR WHATSAPP
========================================================= */

function openWhatsApp(id) {

    const reservation =
        reservations.find(
            r =>
                String(r.id) ===
                String(id)
        );


    if (!reservation) {

        toast(
            "No se encontró la reserva."
        );

        return;
    }


    const phone =
        normalizePhone(
            reservation.phone
        );


    if (!phone) {

        toast(
            "El teléfono del cliente no es válido."
        );

        return;
    }


    const message =
        createWhatsAppMessage(
            reservation,
            "confirmar"
        );


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
   NORMALIZAR TELÉFONO
========================================================= */

function normalizePhone(phone) {

    let value =
        String(phone || "")
            .replace(
                /\D/g,
                ""
            );


    /*
     * Colombia:
     * 3XXXXXXXXX
     */
    if (
        value.length === 10 &&
        value.startsWith("3")
    ) {

        value =
            "57" +
            value;

    }


    /*
     * Si ya tiene 57
     */
    if (
        value.startsWith("57") &&
        value.length === 12
    ) {

        return value;

    }


    return value;
}


/* =========================================================
   FORMATO FECHA
========================================================= */

function formatDate(date) {

    if (!date) return "";


    const parts =
        String(date)
            .split("-");


    if (parts.length !== 3) {
        return date;
    }


    const [
        year,
        month,
        day
    ] = parts;


    const d =
        new Date(
            Number(year),
            Number(month) - 1,
            Number(day)
        );


    return new Intl.DateTimeFormat(
        "es-CO",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    ).format(d);

}


/* =========================================================
   DÍA
========================================================= */

function formatDay(date) {

    if (!date) return "";


    return String(date)
        .split("-")[2];

}


/* =========================================================
   HORA
========================================================= */

function formatTime(time) {

    return String(time || "")
        .slice(0, 5);

}


/* =========================================================
   SERVICIOS
========================================================= */

function renderServices() {

    const container =
        $("#servicesList");


    if (!products.length) {

        container.innerHTML = `
            <div class="empty-state">

                <h3>
                    No hay servicios
                </h3>

            </div>
        `;

        return;
    }


    container.innerHTML =
        products
            .map(
                product => `

                    <div
                        class="service-admin-row"
                    >

                        <div>

                            <strong>
                                ${esc(
                                    product.name
                                )}
                            </strong>

                            <small>

                                ${esc(
                                    product.category
                                )}

                                ·

                                ${product.duration}
                                min

                                ·

                                ${money(
                                    product.price
                                )}

                            </small>

                        </div>


                        <div>

                            <button
                                class="btn"
                                data-edit-service="${esc(
                                    product.id
                                )}"
                                type="button"
                            >
                                ✎ Editar
                            </button>


                            <button
                                class="btn danger"
                                data-delete-service="${esc(
                                    product.id
                                )}"
                                type="button"
                            >
                                🗑 Eliminar
                            </button>

                        </div>

                    </div>

                `
            )
            .join("");


    container
        .querySelectorAll(
            "[data-edit-service]"
        )
        .forEach(button => {

            button.onclick = () =>
                openServiceEditor(
                    button.dataset.editService
                );

        });


    container
        .querySelectorAll(
            "[data-delete-service]"
        )
        .forEach(button => {

            button.onclick = () =>
                deleteService(
                    button.dataset.deleteService
                );

        });

}


/* =========================================================
   EDITOR DE SERVICIO
========================================================= */

function openServiceEditor(
    id = null
) {

    const product =
        products.find(
            p =>
                String(p.id) ===
                String(id)
        );


    const name =
        prompt(
            "Nombre del servicio:",
            product?.name || ""
        );


    if (name === null) return;


    const category =
        prompt(
            "Categoría:",
            product?.category ||
            "Masajes"
        );


    if (category === null) return;


    const duration =
        prompt(
            "Duración en minutos:",
            product?.duration ||
            60
        );


    if (duration === null) return;


    const price =
        prompt(
            "Precio:",
            product?.price ||
            0
        );


    if (price === null) return;


    saveService({
        id: product?.id,
        name,
        category,
        duration: Number(duration),
        price: Number(price),
        description:
            product?.description || "",
        image_url:
            product?.image_url || ""
    });

}


/* =========================================================
   GUARDAR SERVICIO
========================================================= */

async function saveService(data) {

    const body = {

        name:
            data.name.trim(),

        category:
            data.category.trim(),

        description:
            data.description,

        duration:
            data.duration,

        price:
            data.price,

        image_url:
            data.image_url,

        active: true

    };


    let result;


    if (data.id) {

        result =
            await db
                .from("products")
                .update(body)
                .eq(
                    "id",
                    data.id
                );

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
        "Servicio guardado."
    );


    await loadProducts();

}


/* =========================================================
   ELIMINAR SERVICIO
========================================================= */

async function deleteService(id) {

    if (
        !confirm(
            "¿Eliminar este servicio?"
        )
    ) {

        return;
    }


    const result =
        await db
            .from("products")
            .delete()
            .eq(
                "id",
                id
            );


    if (result.error) {

        toast(
            result.error.message
        );

        return;
    }


    toast(
        "Servicio eliminado."
    );


    await loadProducts();

}


/* =========================================================
   CAMBIAR PESTAÑA
========================================================= */

function switchTab(tab) {

    document
        .querySelectorAll(".admin-tab")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.tab === tab
            );

        });


    $("#reservasPanel")
        .classList.toggle(
            "hidden",
            tab !== "reservas"
        );


    $("#serviciosPanel")
        .classList.toggle(
            "hidden",
            tab !== "servicios"
        );

}


/* =========================================================
   TOAST
========================================================= */

function toast(message) {

    const element =
        document.createElement("div");


    element.className =
        "toast";


    element.textContent =
        message;


    $("#toastContainer")
        .appendChild(element);


    setTimeout(
        () => element.remove(),
        3500
    );

}


/* =========================================================
   ERROR LOGIN
========================================================= */

function showLoginError(message) {

    let element =
        $("#loginError");


    if (!element) {

        element =
            document.createElement("div");

        element.id =
            "loginError";

        element.className =
            "login-error";

        $("#loginForm")
            .prepend(element);

    }


    element.textContent =
        message;

}


/* =========================================================
   INICIAR
========================================================= */

initAdmin();