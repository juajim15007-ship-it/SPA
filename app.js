/* =========================================================
   CONFIGURACIÓN INICIAL
========================================================= */

const { createClient } = window.supabase;
const C = window.SERENITY_CONFIG;


/* =========================================================
   VARIABLES GLOBALES
========================================================= */

let db = null;

let products = [];

let settings = {
    spa_name: "Danu Spa",
    whatsapp_number: "3116917528"
};

let cat = "Todos";

let monthDate = new Date();

let chosenDate = "";
let chosenTime = "";

let reservations = [];


/* =========================================================
   FUNCIONES AUXILIARES
========================================================= */

/**
 * Selector rápido de elementos
 */
const $ = s => document.querySelector(s);


/**
 * Formatear valores como pesos colombianos
 */
const money = v =>
    new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0
    }).format(v || 0);


/**
 * Escapar caracteres HTML para evitar problemas
 */
const esc = s =>
    String(s ?? "").replace(
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
   DATOS DE DEMOSTRACIÓN
   Se utilizan cuando Supabase no está conectado.
========================================================= */

const demo = [
    [
        "Masaje relajante",
        "Masajes",
        "Relajación profunda para liberar tensión.",
        60,
        85000
    ],
    [
        "Piedras calientes",
        "Masajes",
        "Terapia de calor y masaje.",
        75,
        110000
    ],
    [
        "Limpieza facial profunda",
        "Faciales",
        "Limpieza, exfoliación e hidratación.",
        60,
        95000
    ],
    [
        "Ritual corporal hidratante",
        "Corporales",
        "Exfoliación e hidratación corporal.",
        75,
        120000
    ],
    [
        "Spa de manos y pies",
        "Manos y pies",
        "Cuidado relajante con hidratación.",
        45,
        70000
    ],
    [
        "Ritual de pareja",
        "Experiencias",
        "Experiencia para dos.",
        90,
        180000
    ]
].map((x, i) => ({
    id: "demo" + i,
    name: x[0],
    category: x[1],
    description: x[2],
    duration: x[3],
    price: x[4],
    active: true
}));


/* =========================================================
   INICIALIZACIÓN DE LA APLICACIÓN
========================================================= */

async function init() {

    /*
     * Crear conexión con Supabase
     */
    if (
        C.url &&
        C.key &&
        !C.url.includes("TU-PROYECTO")
    ) {
        db = createClient(C.url, C.key);
    }


    /*
     * Cargar productos y configuración
     */
    if (db) {

        // Obtener servicios activos
        let p = await db
            .from("products")
            .select("*")
            .eq("active", true)
            .order("created_at", {
                ascending: false
            });

        products = p.data || demo;


        // Obtener configuración del spa
        let s = await db
            .from("spa_settings")
            .select("*")
            .eq("id", 1)
            .maybeSingle();

        if (s.data) {
            settings = s.data;
        }

    } else {

        /*
         * Si no hay Supabase,
         * utilizar servicios de demostración.
         */
        products = demo;
    }


    /*
     * Renderizar interfaz
     */
    render();

    /*
     * Activar eventos
     */
    bind();
}


/* =========================================================
   RENDERIZAR SERVICIOS
========================================================= */

function render() {

    /*
     * Crear lista de categorías
     */
    const cs = [
        "Todos",
        ...new Set(products.map(p => p.category))
    ];


    /*
     * Mostrar categorías
     */
    $("#cats").innerHTML = cs
        .map(x => `
            <button
                class="chip ${x === cat ? "active" : ""}"
                data-cat="${esc(x)}"
            >
                ${esc(x)}
            </button>
        `)
        .join("");


    /*
     * Filtrar productos
     */
    const list =
        cat === "Todos"
            ? products
            : products.filter(
                p => p.category === cat
            );


    /*
     * Mostrar tarjetas de servicios
     */
    $("#products").innerHTML = list
        .map(p => `
            <article class="card">

                <div
                    class="pic"
                    ${p.image_url
                        ? `style="background-image:url('${p.image_url}')"`
                        : ""
                    }
                ></div>

                <div class="body">

                    <div class="title">

                        <h3>
                            ${esc(p.name)}
                        </h3>

                        <b>
                            ${money(p.price)}
                        </b>

                    </div>

                    <p>
                        ${esc(p.description)}
                    </p>

                    <div class="meta">

                        <span>
                            ◷ ${p.duration} min
                        </span>

                        <button data-res="${p.id}">
                            Reservar →
                        </button>

                    </div>

                </div>

            </article>
        `)
        .join("");

    $("#footerText").textContent =
    `© 2026 ${settings.spa_name} · Bienestar para cuerpo y mente`;
}


/* =========================================================
   EVENTOS PRINCIPALES
========================================================= */

function bind() {

    /*
     * Categorías
     */
    $("#cats").onclick = e => {

        let b = e.target.closest("[data-cat]");

        if (b) {
            cat = b.dataset.cat;
            render();
        }
    };


    /*
     * Botones de reservar de los servicios
     */
    $("#products").onclick = e => {

        let b = e.target.closest("[data-res]");

        if (b) {
            openBooking(
                products.find(
                    p => p.id == b.dataset.res
                )
            );
        }
    };


    /*
     * Botón reservar del Hero
     */
    $("#heroReserve").onclick = () =>
        openBooking({});


    /*
     * Botón reservar de Contacto
     */
    $("#contactReserve").onclick = () =>
        openBooking({});


    /*
     * Abrir administrador
     */
    $("#adminOpen").onclick = () => {
        window.location.href = "admin.html";
    };


    /*
     * Cerrar ventanas
     */
    document.addEventListener("click", e => {

        const button =
            e.target.closest("[data-close]");

        if (!button) return;

        const target =
            document.getElementById(
                button.dataset.close
            );

        if (!target) return;

        target.classList.add("hidden");

        target.hidden = true;

    });

    /*
     * Cambio de tratamiento
     */
    $("#bProduct").onchange = () => {

        chosenDate = "";
        chosenTime = "";

        renderCalendar();
        renderTimes();
    };


    /*
     * Mes anterior
     */
    $("#prev").onclick = () => {

        monthDate.setMonth(
            monthDate.getMonth() - 1
        );

        renderCalendar();
    };


    /*
     * Mes siguiente
     */
    $("#next").onclick = () => {

        monthDate.setMonth(
            monthDate.getMonth() + 1
        );

        renderCalendar();
    };


    /*
     * Formulario de reserva
     */
    $("#bookingForm").onsubmit = book;
}


/* =========================================================
   ABRIR VENTANA DE RESERVA
========================================================= */

function openBooking(p) {

    const booking = $("#booking");

    booking.hidden = false;
    booking.classList.remove("hidden");

    $("#bProduct").innerHTML =
        '<option value="">Selecciona</option>' +

        products
            .map(x => `
                <option
                    value="${x.id}"
                    ${p.id === x.id ? "selected" : ""}
                >
                    ${esc(x.name)} — ${money(x.price)}
                </option>
            `)
            .join("");

    monthDate = new Date();

    chosenDate = "";
    chosenTime = "";

    $("#bDate").value = "";
    $("#bTime").value = "";

    renderCalendar();
    renderTimes();
}


/* =========================================================
   CONVERTIR FECHA A FORMATO ISO
========================================================= */

function iso(d) {
    return d.toISOString().slice(0, 10);
}


/* =========================================================
   RENDERIZAR CALENDARIO
========================================================= */

function renderCalendar() {

    let y = monthDate.getFullYear();

    let m = monthDate.getMonth();

    let first =
        (new Date(y, m, 1).getDay() + 6) % 7;

    let days =
        new Date(y, m + 1, 0).getDate();


    /*
     * Obtener fecha actual
     */
    let today = new Date();

    today.setHours(0, 0, 0, 0);


    /*
     * Mostrar nombre del mes
     */
    $("#month").textContent =
        new Intl.DateTimeFormat(
            "es-CO",
            {
                month: "long",
                year: "numeric"
            }
        ).format(monthDate);


    /*
     * Días de la semana
     */
    let h = [
        "L",
        "M",
        "X",
        "J",
        "V",
        "S",
        "D"
    ]
        .map(x =>
            `<b style="text-align:center;font-size:11px">${x}</b>`
        )
        .join("");


    /*
     * Espacios antes del primer día
     */
    for (let i = 0; i < first; i++) {
        h += "<span></span>";
    }


    /*
     * Crear días del mes
     */
    for (let d = 1; d <= days; d++) {

        let date = new Date(y, m, d);

        date.setHours(0, 0, 0, 0);

        let v = iso(date);

        let past = date < today;


        h += `
            <button
                type="button"
                class="day
                    ${past ? "disabled" : ""}
                    ${v === chosenDate ? "selected" : ""}
                "
                ${past ? "disabled" : ""}
                data-date="${v}"
            >
                ${d}
            </button>
        `;
    }


    /*
     * Insertar calendario
     */
    $("#calendar").innerHTML = h;


    /*
     * Eventos de los días
     */
    document
        .querySelectorAll("[data-date]")
        .forEach(b => {

            b.onclick = () => {

                chosenDate = b.dataset.date;

                $("#bDate").value = chosenDate;

                chosenTime = "";

                renderCalendar();
                renderTimes();
            };
        });
}


/* =========================================================
   OBTENER HORARIOS OCUPADOS
========================================================= */

async function busy(date) {

    if (!db) {
        return JSON.parse(
            localStorage.getItem("spa_res") || "[]"
        ).filter(
            x =>
                x.date === date &&
                x.status !== "cancelada"
        );
    }

    const r = await db
        .from("appointments")
        .select("id, time, status, product_id")
        .eq("date", date)
        .neq("status", "cancelada");

    if (r.error) {
        console.error("Error cargando citas:", r.error);
        toast("No se pudieron consultar las citas");
        return [];
    }

    return r.data || [];
}

/* =========================================================
   RENDERIZAR HORARIOS
========================================================= */

async function renderTimes() {

    const timesContainer = $("#times");

    const productId = $("#bProduct").value;

    const p = products.find(
        x => String(x.id) === String(productId)
    );


    /*
     * No hay servicio seleccionado
     */
    if (!p) {

        timesContainer.innerHTML = `
            <div class="time-message">
                Selecciona un tratamiento para
                consultar los horarios disponibles.
            </div>
        `;

        return;
    }


    /*
     * No hay fecha seleccionada
     */
    if (!chosenDate) {

        timesContainer.innerHTML = `
            <div class="time-message">
                Selecciona primero una fecha.
            </div>
        `;

        return;
    }


    /*
     * Duración del servicio
     */
    const duration =
        Number(p.duration) || 60;


    /*
     * Obtener citas existentes
     */
    const bs =
        await busy(chosenDate);


    /*
     * Horario del spa
     *
     * 09:00 - 18:00
     */
    const OPEN = 9 * 60;
    const CLOSE = 18 * 60;


    /*
     * Convertir HH:MM a minutos
     */
    function toMinutes(time) {

        const [h, m] =
            String(time)
                .slice(0, 5)
                .split(":")
                .map(Number);

        return h * 60 + m;
    }


    /*
     * Convertir minutos a HH:MM
     */
    function toTime(minutes) {

        const h =
            Math.floor(minutes / 60);

        const m =
            minutes % 60;

        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }


    /*
     * Convertir las reservas existentes
     * en intervalos de tiempo
     */
    const occupied =
        bs.map(reservation => {

            const start =
                toMinutes(reservation.time);


            /*
             * Buscar duración del servicio
             * reservado
             */
            const reservedProduct =
                products.find(
                    x =>
                        String(x.id) ===
                        String(reservation.product_id)
                );


            const reservedDuration =
                Number(
                    reservedProduct?.duration || 60
                );


            return {
                start,
                end:
                    start +
                    reservedDuration
            };

        });


    /*
     * Lista de horarios disponibles
     */
    const available = [];


    /*
     * Crear horarios cada 30 minutos
     */
    for (
        let start = OPEN;
        start + duration <= CLOSE;
        start += 30
    ) {

        const end =
            start + duration;


        /*
         * Comprobar si existe conflicto
         */
        const conflict =
            occupied.some(reservation =>

                start < reservation.end &&
                end > reservation.start

            );


        if (!conflict) {

            available.push(
                toTime(start)
            );

        }

    }


    /*
     * No hay horarios disponibles
     */
    if (!available.length) {

        timesContainer.innerHTML = `
            <div class="time-message">
                <strong>No hay horarios disponibles.</strong>
                <br>
                Intenta seleccionar otro día.
            </div>
        `;

        return;
    }


    /*
     * Construir interfaz
     */
    let html = `
        <div class="times-title">
            Horarios disponibles
        </div>

        <div class="times">
    `;


    available.forEach(time => {

        html += `
            <button
                type="button"
                class="time ${
                    time === chosenTime
                        ? "selected"
                        : ""
                }"
                data-time="${time}"
            >
                ${time}
            </button>
        `;

    });


    html += `
        </div>
    `;


    timesContainer.innerHTML = html;


    /*
     * Eventos de los horarios
     */
    timesContainer
        .querySelectorAll("[data-time]")
        .forEach(button => {

            button.onclick = () => {

                chosenTime =
                    button.dataset.time;

                $("#bTime").value =
                    chosenTime;

                renderTimes();

            };

        });

}


/* =========================================================
   CREAR RESERVA
========================================================= */

async function book(e) {

    e.preventDefault();

    console.log("=== INICIANDO RESERVA ===");


    /* =====================================================
       VALIDAR SERVICIO
    ===================================================== */

    const productId = $("#bProduct").value;

    const p = products.find(
        x => String(x.id) === String(productId)
    );

    if (!p) {
        toast("Selecciona un tratamiento");
        return;
    }


    /* =====================================================
       VALIDAR FECHA
    ===================================================== */

    if (!chosenDate) {
        toast("Selecciona una fecha");
        return;
    }


    /* =====================================================
       VALIDAR HORA
    ===================================================== */

    if (!chosenTime) {
        toast("Selecciona un horario");
        return;
    }


    /* =====================================================
       VALIDAR DATOS DEL CLIENTE
    ===================================================== */

    const name = $("#bName").value.trim();
    const phone = $("#bPhone").value.trim();
    const notes = $("#bNotes").value.trim();

    if (!name) {
        toast("Escribe tu nombre");
        return;
    }

    if (!phone) {
        toast("Escribe tu teléfono");
        return;
    }


    /* =====================================================
       OBJETO DE RESERVA
    ===================================================== */

    const reservation = {

        product_id: p.id,

        name: name,

        phone: phone,

        date: chosenDate,

        time: chosenTime,

        notes: notes,

        status: "pendiente"

    };


    console.log(
        "Reserva que se enviará:",
        reservation
    );


    /* =====================================================
       COMPROBAR SUPABASE
    ===================================================== */

    if (!db) {

        console.warn(
            "Supabase no está conectado. Guardando localmente."
        );

        const local =
            JSON.parse(
                localStorage.getItem("spa_res") || "[]"
            );

        local.push({
            id: crypto.randomUUID(),
            ...reservation
        });

        localStorage.setItem(
            "spa_res",
            JSON.stringify(local)
        );

        $("#bookingForm").reset();

        chosenDate = "";
        chosenTime = "";

        $("#bDate").value = "";
        $("#bTime").value = "";

        $("#booking").classList.add("hidden");
        $("#booking").hidden = true;

        toast("Reserva registrada correctamente");

        return;
    }


    /* =====================================================
       VERIFICAR SESIÓN / CONEXIÓN
    ===================================================== */

    const session =
        await db.auth.getSession();

    console.log(
        "Sesión:",
        session
    );


    /* =====================================================
       COMPROBAR DISPONIBILIDAD NUEVAMENTE
    ===================================================== */

    const existing =
        await busy(chosenDate);

    const alreadyTaken =
        existing.some(
            x =>
                String(x.time).slice(0, 5) ===
                chosenTime
        );

    if (alreadyTaken) {

        toast(
            "Ese horario acaba de ser ocupado. Selecciona otro."
        );

        renderTimes();

        return;
    }


    /* =====================================================
       INSERTAR EN SUPABASE
    ===================================================== */

    console.log(
        "Enviando reserva a Supabase..."
    );


    const result =
    await db
        .from("appointments")
        .insert([reservation]);

    /* =====================================================
       COMPROBAR ERROR
    ===================================================== */

    if (result.error) {

        console.error(
            "ERROR SUPABASE:",
            result.error
        );

        toast(
            "Error al guardar: " +
            result.error.message
        );

        return;
    }


    /* =====================================================
       RESERVA EXITOSA
    ===================================================== */

    console.log(
        "Reserva guardada:",
        result.data
    );


    $("#bookingForm").reset();

    chosenDate = "";
    chosenTime = "";

    $("#bDate").value = "";
    $("#bTime").value = "";


    const booking =
        $("#booking");

    booking.classList.add("hidden");
    booking.hidden = true;


    toast(
        "¡Reserva enviada correctamente!"
    );
}


/* =========================================================
   ADMINISTRADOR
========================================================= */

async function openAdmin() {

    const admin = $("#admin");

    admin.hidden = false;
    admin.classList.remove("hidden");

    if (!db) {

        $("#adminContent").innerHTML = `
            <h2>Conecta Supabase</h2>

            <p>
                Configura config.js con la URL
                y clave pública de Supabase.
            </p>
        `;

        return;
    }

    const s =
        await db.auth.getSession();

    if (!s.data.session) {
        return loginForm();
    }

    adminHome("products");
}


/* =========================================================
   FORMULARIO DE LOGIN
========================================================= */

function loginForm() {

    $("#adminContent").innerHTML = `
        <div class="login">

            <small>
                ÁREA PRIVADA
            </small>

            <h2>
                Administrador
            </h2>

            <form id="loginForm">

                <label>
                    Correo

                    <input
                        type="email"
                        id="email"
                        required
                    >
                </label>

                <label>
                    Contraseña

                    <input
                        type="password"
                        id="pass"
                        required
                    >
                </label>

                <button class="btn primary full">
                    Entrar
                </button>

            </form>

        </div>
    `;


    /*
     * Procesar login
     */
    $("#loginForm").onsubmit = async e => {

        e.preventDefault();


        let r =
            await db.auth.signInWithPassword({
                email: $("#email").value,
                password: $("#pass").value
            });


        if (r.error) {

            toast(r.error.message);

        } else {

            adminHome("products");
        }
    };
}


/* =========================================================
   PANEL PRINCIPAL DEL ADMINISTRADOR
========================================================= */

async function adminHome(tab) {

    /*
     * Cargar servicios
     */
    if (tab === "products") {

        let r = await db
            .from("products")
            .select("*")
            .order("created_at", {
                ascending: false
            });

        products = r.data || products;
    }


    /*
     * Cargar reservas
     */
    if (tab === "reservas") {

        let r = await db
            .from("appointments")
            .select("*,products(name)")
            .order("created_at", {
                ascending: false
            });

        reservations = r.data || [];
    }


    /*
     * Encabezado del administrador
     */
    let h = `
        <h2>
            Administración
        </h2>

        <div class="tabs">

            <button
                class="tab ${tab === "products" ? "active" : ""}"
                id="tabP"
            >
                Servicios
            </button>

            <button
                class="tab ${tab === "reservas" ? "active" : ""}"
                id="tabR"
            >
                Reservas
            </button>

            <button
                class="tab"
                id="logout"
            >
                Salir
            </button>

        </div>
    `;


    /* =====================================================
       PESTAÑA SERVICIOS
    ====================================================== */

    if (tab === "products") {

        h += `
            <button
                class="btn primary"
                id="new"
            >
                + Nuevo servicio
            </button>

            <div id="adminList">

                ${products
                    .map(p => `
                        <div class="row">

                            <span>

                                <b>
                                    ${esc(p.name)}
                                </b>

                                <small>
                                    ${esc(p.category)}
                                    ·
                                    ${money(p.price)}
                                    ·
                                    ${p.duration} min
                                </small>

                            </span>

                            <span>

                                <button
                                    class="icon"
                                    data-edit="${p.id}"
                                >
                                    ✎
                                </button>

                                <button
                                    class="icon"
                                    data-del="${p.id}"
                                >
                                    🗑
                                </button>

                            </span>

                        </div>
                    `)
                    .join("")}

            </div>
        `;
    }


    /* =====================================================
       PESTAÑA RESERVAS
    ====================================================== */

    else {

        h +=
            reservations
                .map(a => `
                    <div class="row">

                        <span>

                            <b>
                                ${esc(a.name)}
                            </b>

                            <small>
                                ${esc(
                                    a.products?.name ||
                                    "Servicio"
                                )}

                                · ${a.date}

                                · ${String(a.time).slice(0, 5)}

                                · ${esc(a.phone)}
                            </small>

                        </span>

                        <span>

                            ${
                                a.status === "pendiente"
                                    ? `
                                        <button
                                            class="icon"
                                            data-ok="${a.id}"
                                        >
                                            ✓
                                        </button>

                                        <button
                                            class="icon"
                                            data-no="${a.id}"
                                        >
                                            ×
                                        </button>
                                    `
                                    : `${a.status}`
                            }

                        </span>

                    </div>
                `)
                .join("") ||

            "<p>No hay reservas.</p>";
    }


    /*
     * Insertar contenido
     */
    $("#adminContent").innerHTML = h;


    /* =====================================================
       EVENTOS DEL ADMINISTRADOR
    ====================================================== */

    /*
     * Servicios
     */
    $("#tabP").onclick = () =>
        adminHome("products");


    /*
     * Reservas
     */
    $("#tabR").onclick = () =>
        adminHome("reservas");


    /*
     * Cerrar sesión
     */
    $("#logout").onclick = async () => {

        await db.auth.signOut();

        loginForm();
    };


    /* =====================================================
       EVENTOS DE SERVICIOS
    ====================================================== */

    if (tab === "products") {

        /*
         * Nuevo servicio
         */
        $("#new").onclick = () =>
            editor();


        /*
         * Editar servicios
         */
        document
            .querySelectorAll("[data-edit]")
            .forEach(b => {

                b.onclick = () =>
                    editor(
                        products.find(
                            p => p.id == b.dataset.edit
                        )
                    );
            });


        /*
         * Eliminar servicios
         */
        document
            .querySelectorAll("[data-del]")
            .forEach(b => {

                b.onclick = async () => {

                    if (
                        confirm("¿Eliminar?")
                    ) {

                        await db
                            .from("products")
                            .delete()
                            .eq(
                                "id",
                                b.dataset.del
                            );

                        adminHome("products");

                        render();
                    }
                };
            });
    }


    /* =====================================================
       EVENTOS DE RESERVAS
    ====================================================== */

    else {

        /*
         * Confirmar reserva
         */
        document
            .querySelectorAll("[data-ok]")
            .forEach(b => {

                b.onclick = () =>
                    status(
                        b.dataset.ok,
                        "confirmada"
                    );
            });


        /*
         * Cancelar reserva
         */
        document
            .querySelectorAll("[data-no]")
            .forEach(b => {

                b.onclick = () =>
                    status(
                        b.dataset.no,
                        "cancelada"
                    );
            });
    }
}


/* =========================================================
   EDITOR DE SERVICIOS
========================================================= */

function editor(
    p = {
        name: "",
        category: "Masajes",
        description: "",
        duration: 60,
        price: 0,
        image_url: ""
    }
) {

    /*
     * Crear contenedor
     */
    let x = document.createElement("div");

    x.className = "editor";


    /*
     * Formulario
     */
    x.innerHTML = `
        <div class="grid">

            <label>
                Nombre

                <input
                    id="en"
                    value="${esc(p.name)}"
                >
            </label>

            <label>
                Categoría

                <input
                    id="ec"
                    value="${esc(p.category)}"
                >
            </label>

            <label>
                Duración

                <input
                    id="ed"
                    type="number"
                    value="${p.duration}"
                >
            </label>

            <label>
                Precio

                <input
                    id="ep"
                    type="number"
                    value="${p.price}"
                >
            </label>

        </div>


        <label>
            Descripción

            <textarea id="ex">${esc(
                p.description
            )}</textarea>
        </label>


        <label>
            Imagen

            <input
                id="ei"
                type="file"
                accept="image/*"
            >
        </label>


        <label>
            URL imagen

            <input
                id="eu"
                value="${esc(
                    p.image_url || ""
                )}"
            >
        </label>


        <button
            class="btn primary"
            id="save"
        >
            Guardar
        </button>

        <button
            class="btn"
            id="cancel"
        >
            Cancelar
        </button>
    `;


    /*
     * Insertar editor
     */
    $("#adminList").prepend(x);


    /*
     * Cancelar
     */
    $("#cancel").onclick = () =>
        x.remove();


    /*
     * Guardar
     */
    $("#save").onclick = async () => {

        let url = $("#eu").value;

        let f = $("#ei").files[0];


        /* =================================================
           SUBIR IMAGEN A SUPABASE STORAGE
        ================================================== */

        if (f) {

            let path =
                crypto.randomUUID() +
                "-" +
                f.name.replace(
                    /[^a-zA-Z0-9._-]/g,
                    ""
                );


            let u =
                await db.storage
                    .from("spa-images")
                    .upload(path, f);


            if (u.error) {

                toast(
                    "Crea el bucket público spa-images en Supabase"
                );

                return;
            }


            url =
                db.storage
                    .from("spa-images")
                    .getPublicUrl(path)
                    .data.publicUrl;
        }


        /* =================================================
           DATOS DEL SERVICIO
        ================================================== */

        let body = {

            name: $("#en").value,

            category: $("#ec").value,

            description: $("#ex").value,

            duration: +$("#ed").value,

            price: +$("#ep").value,

            image_url: url,

            active: true
        };


        /* =================================================
           INSERTAR O ACTUALIZAR
        ================================================== */

        let r =
            p.id

                ? await db
                    .from("products")
                    .update(body)
                    .eq("id", p.id)

                : await db
                    .from("products")
                    .insert(body);


        /*
         * Resultado
         */
        if (r.error) {

            toast(r.error.message);

        } else {

            await adminHome("products");

            render();
        }
    };
}


/* =========================================================
   CAMBIAR ESTADO DE UNA RESERVA
========================================================= */

async function status(id, s) {

    let r =
        await db
            .from("appointments")
            .update({
                status: s
            })
            .eq("id", id);


    if (r.error) {

        toast(r.error.message);

    } else {

        adminHome("reservas");
    }
}


/* =========================================================
   SISTEMA DE NOTIFICACIONES
========================================================= */

function toast(t) {

    let x =
        document.createElement("div");

    x.className = "toast";

    x.textContent = t;

    document.body.appendChild(x);


    /*
     * Eliminar después de 3 segundos
     */
    setTimeout(
        () => x.remove(),
        3000
    );
}


/* =========================================================
   INICIAR APLICACIÓN
========================================================= */

init();