/* =========================================================
   DANU SPA
   PANEL DE ADMINISTRACIÓN
========================================================= */

const { createClient } =
    window.supabase;

const C =
    window.SERENITY_CONFIG || {};

let db = null;

let products = [];

let reservations = [];

let currentTab =
    "products";


/* =========================================================
   SELECTOR
========================================================= */

const $ =
    selector =>
        document.querySelector(
            selector
        );


/* =========================================================
   FORMATO MONEDA
========================================================= */

function money(value) {

    return new Intl.NumberFormat(
        "es-CO",
        {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0
        }
    ).format(
        Number(value) || 0
    );

}


/* =========================================================
   ESCAPAR HTML
========================================================= */

function esc(value) {

    return String(value ?? "").replace(
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
   CONEXIÓN
========================================================= */

function connect() {

    if (
        C.url &&
        C.key &&
        !C.url.includes(
            "TU-PROYECTO"
        ) &&
        !C.key.includes(
            "TU_CLAVE"
        )
    ) {

        db =
            createClient(
                C.url,
                C.key
            );

    }

}


/* =========================================================
   INICIO
========================================================= */

async function init() {

    connect();


    if (!db) {

        renderError(
            "Supabase no está configurado. Revisa config.js."
        );

        return;

    }


    const session =
        await db.auth.getSession();


    if (
        !session.data.session
    ) {

        renderLogin();

        return;

    }


    showLogout();

    await renderAdmin(
        "products"
    );

}


/* =========================================================
   MOSTRAR ERROR
========================================================= */

function renderError(message) {

    $("#adminApp").innerHTML = `

        <div class="login-wrapper">

            <div class="login-card">

                <h1>
                    Danu SPA
                </h1>

                <p>
                    ${esc(message)}
                </p>

                <a
                    href="index.html"
                    class="btn btn-primary"
                >
                    Volver al inicio
                </a>

            </div>

        </div>

    `;

}


/* =========================================================
   LOGIN
========================================================= */

function renderLogin() {

    $("#adminApp").innerHTML = `

        <div class="login-wrapper">

            <div class="login-card">

                <small>
                    ÁREA PRIVADA
                </small>

                <h1>
                    Administración
                </h1>

                <p>
                    Ingresa con tu cuenta de administrador.
                </p>

                <form id="loginForm">

                    <div class="form-group">

                        <label>
                            Correo
                        </label>

                        <input
                            type="email"
                            id="email"
                            autocomplete="email"
                            required
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            Contraseña
                        </label>

                        <input
                            type="password"
                            id="password"
                            autocomplete="current-password"
                            required
                        >

                    </div>


                    <button
                        class="btn btn-primary"
                        type="submit"
                        style="width:100%"
                    >
                        Entrar
                    </button>

                </form>

            </div>

        </div>

    `;


    $("#loginForm")
        .addEventListener(
            "submit",
            login
        );

}


/* =========================================================
   LOGIN SUPABASE
========================================================= */

async function login(event) {

    event.preventDefault();


    const email =
        $("#email")
            .value
            .trim();


    const password =
        $("#password")
            .value;


    const button =
        event.submitter;


    button.disabled =
        true;

    button.textContent =
        "Ingresando...";


    const response =
        await db.auth
            .signInWithPassword({
                email,
                password
            });


    if (response.error) {

        toast(
            "No se pudo iniciar sesión: " +
            response.error.message
        );

        button.disabled =
            false;

        button.textContent =
            "Entrar";

        return;

    }


    showLogout();

    await renderAdmin(
        "products"
    );

}


/* =========================================================
   LOGOUT
========================================================= */

function showLogout() {

    $("#logout")
        .classList
        .remove("hidden");


    $("#logout")
        .onclick =
        async () => {

            await db.auth.signOut();

            window.location.href =
                "admin.html";

        };

}


/* =========================================================
   PANEL
========================================================= */

async function renderAdmin(
    tab = "products"
) {

    currentTab =
        tab;


    if (
        tab ===
        "products"
    ) {

        await loadProducts();

    }


    if (
        tab ===
        "reservations"
    ) {

        await loadReservations();

    }


    $("#adminApp").innerHTML = `

        <div class="admin-container">

            <div class="admin-title">

                <div>

                    <small>
                        DANU SPA
                    </small>

                    <h1>
                        Administración
                    </h1>

                    <p>
                        Gestiona servicios y reservas.
                    </p>

                </div>

                ${
                    tab === "products"
                        ? `
                            <button
                                class="btn btn-primary"
                                id="newProduct"
                            >
                                + Nuevo servicio
                            </button>
                        `
                        : ""
                }

            </div>


            <div class="tabs">

                <button
                    class="tab ${
                        tab === "products"
                            ? "active"
                            : ""
                    }"
                    id="tabProducts"
                >
                    Servicios
                </button>

                <button
                    class="tab ${
                        tab === "reservations"
                            ? "active"
                            : ""
                    }"
                    id="tabReservations"
                >
                    Citas reservadas
                </button>

            </div>


            <div id="adminContent"></div>

        </div>

    `;


    $("#tabProducts")
        .onclick =
        () =>
            renderAdmin(
                "products"
            );


    $("#tabReservations")
        .onclick =
        () =>
            renderAdmin(
                "reservations"
            );


    if (
        tab === "products"
    ) {

        $("#newProduct")
            .onclick =
            () =>
                showProductEditor();

        renderProductsAdmin();

    } else {

        renderReservations();

    }

}


/* =========================================================
   CARGAR SERVICIOS
========================================================= */

async function loadProducts() {

    const response =
        await db
            .from("products")
            .select("*")
            .order(
                "created_at",
                {
                    ascending:
                        false
                }
            );


    if (response.error) {

        toast(
            response.error.message
        );

        products = [];

        return;

    }


    products =
        response.data || [];

}


/* =========================================================
   CARGAR RESERVAS
========================================================= */

async function loadReservations() {

    const response =
        await db
            .from("appointments")
            .select(`
                *,
                products (
                    name,
                    description,
                    duration,
                    price
                )
            `)
            .order(
                "date",
                {
                    ascending:
                        true
                }
            )
            .order(
                "time",
                {
                    ascending:
                        true
                }
            );


    if (response.error) {

        toast(
            response.error.message
        );

        reservations = [];

        return;

    }


    reservations =
        response.data || [];

}


/* =========================================================
   SERVICIOS
========================================================= */

function renderProductsAdmin() {

    if (!products.length) {

        $("#adminContent").innerHTML = `

            <div class="empty">

                <h3>
                    No hay servicios
                </h3>

                <p>
                    Crea el primer servicio de Danu SPA.
                </p>

            </div>

        `;

        return;

    }


    $("#adminContent").innerHTML = `

        <div class="products-list">

            ${
                products
                    .map(
                        product => `

                            <div class="product-row">

                                <div class="product-info">

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
                                        ${money(
                                            product.price
                                        )}
                                        ·
                                        ${
                                            product.duration
                                        }
                                        minutos
                                    </small>

                                </div>


                                <div class="product-actions">

                                    <button
                                        class="btn"
                                        data-edit-product="${product.id}"
                                    >
                                        ✎ Editar
                                    </button>

                                    <button
                                        class="btn btn-danger"
                                        data-delete-product="${product.id}"
                                    >
                                        🗑 Eliminar
                                    </button>

                                </div>

                            </div>

                        `
                    )
                    .join("")
            }

        </div>

    `;


    document
        .querySelectorAll(
            "[data-edit-product]"
        )
        .forEach(button => {

            button.onclick =
                () => {

                    const product =
                        products.find(
                            item =>
                                String(
                                    item.id
                                ) ===
                                String(
                                    button.dataset
                                        .editProduct
                                )
                        );


                    showProductEditor(
                        product
                    );

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
   EDITOR DE SERVICIO
========================================================= */

function showProductEditor(
    product = null
) {

    const isEditing =
        Boolean(product);


    const container =
        document.createElement(
            "div"
        );


    container.className =
        "editor";


    container.innerHTML = `

        <h2>
            ${
                isEditing
                    ? "Editar servicio"
                    : "Nuevo servicio"
            }
        </h2>


        <div class="form-grid">

            <label>

                Nombre del servicio

                <input
                    id="productName"
                    value="${
                        esc(
                            product?.name ||
                            ""
                        )
                    }"
                    required
                >

            </label>


            <label>

                Categoría

                <input
                    id="productCategory"
                    value="${
                        esc(
                            product?.category ||
                            "Masajes"
                        )
                    }"
                    required
                >

            </label>


            <label>

                Duración en minutos

                <input
                    id="productDuration"
                    type="number"
                    min="15"
                    step="15"
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

            Descripción del servicio

            <textarea
                id="productDescription"
                placeholder="Escribe la descripción completa del tratamiento..."
            >${
                esc(
                    product?.description ||
                    ""
                )
            }</textarea>

        </label>


        <label>

            URL de imagen

            <input
                id="productImage"
                value="${
                    esc(
                        product?.image_url ||
                        ""
                    )
                }"
                placeholder="https://..."
            >

        </label>


        <label>

            Subir nueva imagen

            <input
                id="productImageFile"
                type="file"
                accept="image/*"
            >

        </label>


        <div class="editor-actions">

            <button
                class="btn btn-primary"
                id="saveProduct"
                type="button"
            >
                Guardar servicio
            </button>

            <button
                class="btn"
                id="cancelEditor"
                type="button"
            >
                Cancelar
            </button>

        </div>

    `;


    $("#adminContent")
        .prepend(container);


    $("#cancelEditor")
        .onclick =
        () =>
            container.remove();


    $("#saveProduct")
        .onclick =
        () =>
            saveProduct(
                product,
                container
            );

}


/* =========================================================
   GUARDAR SERVICIO
========================================================= */

async function saveProduct(
    oldProduct,
    editor
) {

    const button =
        $("#saveProduct");


    button.disabled =
        true;

    button.textContent =
        "Guardando...";


    try {

        let imageUrl =
            $("#productImage")
                .value
                .trim();


        const file =
            $("#productImageFile")
                .files[0];


        if (file) {

            const path =
                `${crypto.randomUUID()}-${file.name.replace(
                    /[^a-zA-Z0-9._-]/g,
                    ""
                )}`;


            const upload =
                await db.storage
                    .from("spa-images")
                    .upload(
                        path,
                        file,
                        {
                            upsert:
                                false
                        }
                    );


            if (upload.error) {

                throw new Error(
                    "No se pudo subir la imagen. Verifica que exista el bucket público spa-images."
                );

            }


            imageUrl =
                db.storage
                    .from("spa-images")
                    .getPublicUrl(
                        path
                    )
                    .data
                    .publicUrl;

        }


        const data = {

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
                imageUrl,

            active:
                true

        };


        if (!data.name) {

            throw new Error(
                "El nombre del servicio es obligatorio."
            );

        }


        if (!data.description) {

            throw new Error(
                "La descripción del servicio es obligatoria."
            );

        }


        let response;


        if (oldProduct) {

            response =
                await db
                    .from("products")
                    .update(data)
                    .eq(
                        "id",
                        oldProduct.id
                    );

        } else {

            response =
                await db
                    .from("products")
                    .insert(data);

        }


        if (response.error) {

            throw new Error(
                response.error.message
            );

        }


        toast(
            oldProduct
                ? "Servicio actualizado correctamente."
                : "Servicio creado correctamente."
        );


        await renderAdmin(
            "products"
        );


    } catch (error) {

        console.error(error);

        toast(
            error.message
        );


        button.disabled =
            false;

        button.textContent =
            "Guardar servicio";

    }

}


/* =========================================================
   ELIMINAR SERVICIO
========================================================= */

async function deleteProduct(
    id
) {

    const confirmDelete =
        confirm(
            "¿Seguro que deseas eliminar este servicio?"
        );


    if (!confirmDelete) {
        return;
    }


    const response =
        await db
            .from("products")
            .delete()
            .eq(
                "id",
                id
            );


    if (response.error) {

        toast(
            "No se pudo eliminar: " +
            response.error.message
        );

        return;

    }


    toast(
        "Servicio eliminado."
    );


    await renderAdmin(
        "products"
    );

}


/* =========================================================
   RESERVAS
========================================================= */

function renderReservations() {

    if (!reservations.length) {

        $("#adminContent").innerHTML = `

            <div class="empty">

                <h3>
                    No hay citas reservadas
                </h3>

                <p>
                    Las nuevas reservas aparecerán aquí.
                </p>

            </div>

        `;

        return;

    }


    $("#adminContent").innerHTML = `

        <div class="reservations">

            ${
                reservations
                    .map(
                        reservation =>
                            reservationCard(
                                reservation
                            )
                    )
                    .join("")
            }

        </div>

    `;


    bindReservationButtons();

}


/* =========================================================
   TARJETA DE RESERVA
========================================================= */

function reservationCard(
    reservation
) {

    const product =
        reservation.products;


    const status =
        reservation.status ||
        "pendiente";


    const time =
        String(
            reservation.time ||
            ""
        ).slice(0, 5);


    const description =
        product?.description ||
        "Sin descripción";


    return `

        <article
            class="reservation-card"
        >

            <div
                class="reservation-top"
            >

                <div>

                    <h3>
                        ${esc(
                            reservation.name
                        )}
                    </h3>

                    <small>
                        Cliente
                    </small>

                </div>


                <span
                    class="status status-${esc(
                        status
                    )}"
                >
                    ${esc(status)}
                </span>

            </div>


            <div
                class="reservation-details"
            >

                <div class="detail">

                    <strong>
                        SERVICIO
                    </strong>

                    <span>
                        ${esc(
                            product?.name ||
                            "Servicio"
                        )}
                    </span>

                </div>


                <div class="detail">

                    <strong>
                        FECHA
                    </strong>

                    <span>
                        ${esc(
                            reservation.date
                        )}
                    </span>

                </div>


                <div class="detail">

                    <strong>
                        HORA
                    </strong>

                    <span>
                        ${esc(time)}
                    </span>

                </div>


                <div class="detail">

                    <strong>
                        TELÉFONO
                    </strong>

                    <span>
                        ${esc(
                            reservation.phone
                        )}
                    </span>

                </div>


                <div class="detail">

                    <strong>
                        DURACIÓN
                    </strong>

                    <span>
                        ${
                            product?.duration ||
                            "-"
                        }
                        minutos
                    </span>

                </div>


                <div class="detail">

                    <strong>
                        PRECIO
                    </strong>

                    <span>
                        ${money(
                            product?.price
                        )}
                    </span>

                </div>

            </div>


            <div
                class="reservation-description"
            >

                <strong>
                    Descripción:
                </strong>

                <br>

                ${esc(
                    description
                )}

                ${
                    reservation.notes
                        ? `
                            <br><br>

                            <strong>
                                Notas del cliente:
                            </strong>

                            <br>

                            ${esc(
                                reservation.notes
                            )}
                        `
                        : ""
                }

            </div>


            <div
                class="reservation-actions"
            >

                <button
                    class="btn btn-whatsapp"
                    data-whatsapp="${reservation.id}"
                    type="button"
                >
                    💬 WhatsApp
                </button>


                ${
                    status ===
                    "pendiente"
                        ? `

                            <button
                                class="btn btn-success"
                                data-confirm="${reservation.id}"
                                type="button"
                            >
                                ✓ Confirmar
                            </button>

                            <button
                                class="btn btn-danger"
                                data-cancel="${reservation.id}"
                                type="button"
                            >
                                × Cancelar
                            </button>

                        `
                        : ""
                }


                ${
                    status ===
                    "confirmada"
                        ? `

                            <button
                                class="btn btn-danger"
                                data-delete-reservation="${reservation.id}"
                                type="button"
                            >
                                🗑 Eliminar cita
                            </button>

                        `
                        : ""
                }


                ${
                    status ===
                    "cancelada"
                        ? `

                            <button
                                class="btn btn-danger"
                                data-delete-reservation="${reservation.id}"
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
   BOTONES DE RESERVAS
========================================================= */

function bindReservationButtons() {


    document
        .querySelectorAll(
            "[data-confirm]"
        )
        .forEach(button => {

            button.onclick =
                () =>
                    updateReservationStatus(
                        button.dataset
                            .confirm,
                        "confirmada"
                    );

        });


    document
        .querySelectorAll(
            "[data-cancel]"
        )
        .forEach(button => {

            button.onclick =
                () =>
                    updateReservationStatus(
                        button.dataset
                            .cancel,
                        "cancelada"
                    );

        });


    document
        .querySelectorAll(
            "[data-delete-reservation]"
        )
        .forEach(button => {

            button.onclick =
                () =>
                    deleteReservation(
                        button.dataset
                            .deleteReservation
                    );

        });


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

}


/* =========================================================
   CAMBIAR ESTADO
========================================================= */

async function updateReservationStatus(
    id,
    status
) {

    const response =
        await db
            .from("appointments")
            .update({
                status
            })
            .eq(
                "id",
                id
            );


    if (response.error) {

        toast(
            response.error.message
        );

        return;

    }


    toast(
        status === "confirmada"
            ? "Cita confirmada."
            : "Cita cancelada."
    );


    await renderAdmin(
        "reservations"
    );

}


/* =========================================================
   ELIMINAR CITA
========================================================= */

async function deleteReservation(
    id
) {

    const reservation =
        reservations.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!reservation) {
        return;
    }


    const confirmed =
        confirm(
            `¿Eliminar definitivamente la cita de ${reservation.name}?`
        );


    if (!confirmed) {
        return;
    }


    const response =
        await db
            .from("appointments")
            .delete()
            .eq(
                "id",
                id
            );


    if (response.error) {

        toast(
            "No se pudo eliminar la cita: " +
            response.error.message
        );

        return;

    }


    toast(
        "Cita eliminada correctamente."
    );


    await renderAdmin(
        "reservations"
    );

}


/* =========================================================
   WHATSAPP
========================================================= */

function sendWhatsApp(
    reservationId
) {

    const reservation =
        reservations.find(
            item =>
                String(item.id) ===
                String(reservationId)
        );


    if (!reservation) {

        toast(
            "No se encontró la reserva."
        );

        return;

    }


    let phone =
        String(
            reservation.phone ||
            ""
        )
        .replace(
            /\D/g,
            ""
        );


    /*
     * Convertir celulares colombianos
     * 3XXXXXXXXX
     * a 573XXXXXXXXX
     */

    if (
        phone.length === 10 &&
        phone.startsWith("3")
    ) {

        phone =
            `57${phone}`;

    }


    if (!phone) {

        toast(
            "La reserva no tiene un número de teléfono válido."
        );

        return;

    }


    const product =
        reservation.products;


    const time =
        String(
            reservation.time ||
            ""
        ).slice(0, 5);


    const message = `Hola ${reservation.name}, te contactamos de Danu SPA 🌿

Queremos confirmar tu reserva:

✨ Servicio: ${product?.name || "Servicio"}
📅 Fecha: ${reservation.date}
🕐 Hora: ${time}
⏱ Duración: ${product?.duration || "-"} minutos
💰 Valor: ${money(product?.price)}

Descripción:
${product?.description || "Sin descripción"}

${
    reservation.notes
        ? `Notas:
${reservation.notes}

`
        : ""
}
¿Podemos confirmar tu cita en este horario?

Si necesitas cambiar la fecha u hora, puedes informarnos por este medio.

¡Gracias por elegir Danu SPA! 💚`;


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
   TOAST
========================================================= */

function toast(
    message
) {

    const element =
        document.createElement(
            "div"
        );


    element.className =
        "toast";


    element.textContent =
        message;


    document.body.appendChild(
        element
    );


    setTimeout(
        () =>
            element.remove(),
        4000
    );

}


/* =========================================================
   INICIAR
========================================================= */

init();