/* =========================================================
   DANU SPA
   SISTEMA PÚBLICO DE RESERVAS
========================================================= */

const { createClient } = window.supabase;

const C = window.SERENITY_CONFIG || {};

let db = null;

let products = [];

let settings = {
    spa_name: "Danu SPA",
    whatsapp_number: "573116917528"
};

let cat = "Todos";

let monthDate = new Date();

let chosenDate = "";
let chosenTime = "";


/* =========================================================
   SELECTOR
========================================================= */

const $ = selector =>
    document.querySelector(selector);


/* =========================================================
   FORMATO DE DINERO
========================================================= */

function money(value) {

    return new Intl.NumberFormat(
        "es-CO",
        {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0
        }
    ).format(Number(value) || 0);

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
   FECHA LOCAL
========================================================= */

function iso(date) {

    const y = date.getFullYear();

    const m = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const d = String(
        date.getDate()
    ).padStart(2, "0");

    return `${y}-${m}-${d}`;

}


/* =========================================================
   INICIALIZAR SUPABASE
========================================================= */

function connectSupabase() {

    if (
        C.url &&
        C.key &&
        !C.url.includes("TU-PROYECTO") &&
        !C.key.includes("TU_CLAVE")
    ) {

        db = createClient(
            C.url,
            C.key
        );

    }

}


/* =========================================================
   DATOS DE DEMOSTRACIÓN
========================================================= */

const demo = [

    {
        id: "demo-1",
        name: "Masaje relajante",
        category: "Masajes",
        description:
            "Relajación profunda para liberar tensión.",
        duration: 60,
        price: 85000,
        active: true
    },

    {
        id: "demo-2",
        name: "Piedras calientes",
        category: "Masajes",
        description:
            "Terapia de calor y masaje.",
        duration: 75,
        price: 110000,
        active: true
    },

    {
        id: "demo-3",
        name: "Limpieza facial profunda",
        category: "Faciales",
        description:
            "Limpieza, exfoliación e hidratación.",
        duration: 60,
        price: 95000,
        active: true
    },

    {
        id: "demo-4",
        name: "Ritual corporal hidratante",
        category: "Corporales",
        description:
            "Exfoliación e hidratación corporal.",
        duration: 75,
        price: 120000,
        active: true
    },

    {
        id: "demo-5",
        name: "Spa de manos y pies",
        category: "Manos y pies",
        description:
            "Cuidado relajante con hidratación.",
        duration: 45,
        price: 70000,
        active: true
    },

    {
        id: "demo-6",
        name: "Ritual de pareja",
        category: "Experiencias",
        description:
            "Experiencia especial para dos.",
        duration: 90,
        price: 180000,
        active: true
    }

];


/* =========================================================
   INICIO
========================================================= */

async function init() {

    connectSupabase();

    await loadData();

    render();

    bindEvents();

}


/* =========================================================
   CARGAR DATOS
========================================================= */

async function loadData() {

    if (!db) {

        products = demo;

        settings = {
            spa_name: "Danu SPA",
            whatsapp_number:
                C.whatsapp || "573116917528"
        };

        return;

    }


    const productResponse =
        await db
            .from("products")
            .select("*")
            .eq("active", true)
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (
        productResponse.error ||
        !productResponse.data?.length
    ) {

        products = demo;

    } else {

        products =
            productResponse.data;

    }


    const settingsResponse =
        await db
            .from("spa_settings")
            .select("*")
            .eq("id", 1)
            .maybeSingle();


    if (settingsResponse.data) {

        settings =
            settingsResponse.data;

    }


    updateBrand();

}


/* =========================================================
   ACTUALIZAR NOMBRE
========================================================= */

function updateBrand() {

    const name =
        settings.spa_name ||
        "Danu SPA";


    const brand =
        $("#spaBrand");

    if (brand) {

        brand.innerHTML =
            `✦ ${esc(name)}`;

    }


    const footer =
        $("#footerText");

    if (footer) {

        footer.textContent =
            `© 2026 ${name} · Bienestar para cuerpo y mente`;

    }


    document.title =
        name;

}


/* =========================================================
   RENDERIZAR
========================================================= */

function render() {

    renderCategories();

    renderProducts();

    updateBrand();

}


/* =========================================================
   CATEGORÍAS
========================================================= */

function renderCategories() {

    const categories = [
        "Todos",
        ...new Set(
            products.map(
                product =>
                    product.category
            )
        )
    ];


    $("#cats").innerHTML =
        categories
            .map(category => `

                <button
                    type="button"
                    class="chip ${
                        category === cat
                            ? "active"
                            : ""
                    }"
                    data-cat="${esc(category)}"
                >
                    ${esc(category)}
                </button>

            `)
            .join("");

}


/* =========================================================
   SERVICIOS
========================================================= */

function renderProducts() {

    const list =
        cat === "Todos"
            ? products
            : products.filter(
                product =>
                    product.category === cat
            );


    if (!list.length) {

        $("#products").innerHTML = `
            <p class="empty-message">
                No hay servicios disponibles.
            </p>
        `;

        return;

    }


    $("#products").innerHTML =
        list
            .map(product => `

                <article class="card">

                    <div
                        class="pic"
                        ${
                            product.image_url
                                ? `style="background-image:url('${esc(
                                    product.image_url
                                )}')"`
                                : ""
                        }
                    ></div>

                    <div class="body">

                        <div class="title">

                            <h3>
                                ${esc(product.name)}
                            </h3>

                            <b>
                                ${money(product.price)}
                            </b>

                        </div>

                        <p>
                            ${esc(
                                product.description
                            )}
                        </p>

                        <div class="meta">

                            <span>
                                ◷ ${product.duration} min
                            </span>

                            <button
                                type="button"
                                data-res="${product.id}"
                            >
                                Reservar →
                            </button>

                        </div>

                    </div>

                </article>

            `)
            .join("");

}


/* =========================================================
   EVENTOS
========================================================= */

function bindEvents() {


    $("#cats").addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-cat]"
                );

            if (!button) return;

            cat =
                button.dataset.cat;

            render();

        }
    );


    $("#products").addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-res]"
                );

            if (!button) return;

            const product =
                products.find(
                    item =>
                        String(item.id) ===
                        String(
                            button.dataset.res
                        )
                );


            openBooking(product);

        }
    );


    $("#heroReserve").addEventListener(
        "click",
        () =>
            openBooking(null)
    );


    $("#contactReserve").addEventListener(
        "click",
        () =>
            openBooking(null)
    );


    $("#closeBooking").addEventListener(
        "click",
        closeBooking
    );


    $("#booking").addEventListener(
        "click",
        event => {

            if (
                event.target.id ===
                "booking"
            ) {

                closeBooking();

            }

        }
    );


    $("#bProduct").addEventListener(
        "change",
        () => {

            chosenDate = "";

            chosenTime = "";

            $("#bDate").value = "";

            $("#bTime").value = "";

            updateProductInfo();

            renderCalendar();

            renderTimes();

        }
    );


    $("#prev").addEventListener(
        "click",
        () => {

            monthDate.setMonth(
                monthDate.getMonth() - 1
            );

            renderCalendar();

            renderTimes();

        }
    );


    $("#next").addEventListener(
        "click",
        () => {

            monthDate.setMonth(
                monthDate.getMonth() + 1
            );

            renderCalendar();

            renderTimes();

        }
    );


    $("#bookingForm").addEventListener(
        "submit",
        book
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                !$("#booking")
                    .classList.contains("hidden")
            ) {

                closeBooking();

            }

        }
    );


}


/* =========================================================
   ABRIR RESERVA
========================================================= */

function openBooking(product = null) {

    $("#booking")
        .classList
        .remove("hidden");


    $("#bProduct").innerHTML = `

        <option value="">
            Selecciona un tratamiento
        </option>

        ${
            products
                .map(item => `

                    <option
                        value="${item.id}"
                        ${
                            product &&
                            String(product.id) ===
                            String(item.id)
                                ? "selected"
                                : ""
                        }
                    >
                        ${esc(item.name)}
                        —
                        ${money(item.price)}
                    </option>

                `)
                .join("")
        }

    `;


    monthDate =
        new Date();


    chosenDate = "";

    chosenTime = "";

    $("#bDate").value = "";

    $("#bTime").value = "";


    updateProductInfo();

    renderCalendar();

    renderTimes();

}


/* =========================================================
   CERRAR RESERVA
========================================================= */

function closeBooking() {

    $("#booking")
        .classList
        .add("hidden");

}


/* =========================================================
   INFORMACIÓN DEL SERVICIO
========================================================= */

function updateProductInfo() {

    const product =
        products.find(
            item =>
                String(item.id) ===
                String($("#bProduct").value)
        );


    if (!product) {

        $("#info").innerHTML = "";

        return;

    }


    $("#info").innerHTML = `

        <div class="info-card">

            <strong>
                ${esc(product.name)}
            </strong>

            <span>
                ${product.duration} minutos
            </span>

            <span>
                ${money(product.price)}
            </span>

            <p>
                ${esc(product.description)}
            </p>

        </div>

    `;

}


/* =========================================================
   CALENDARIO
========================================================= */

function renderCalendar() {

    const year =
        monthDate.getFullYear();

    const month =
        monthDate.getMonth();


    const firstDay =
        (
            new Date(
                year,
                month,
                1
            ).getDay() + 6
        ) % 7;


    const totalDays =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    let today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );


    $("#month").textContent =
        new Intl.DateTimeFormat(
            "es-CO",
            {
                month: "long",
                year: "numeric"
            }
        ).format(monthDate);


    let html = `

        <div class="weekdays">

            <b>L</b>
            <b>M</b>
            <b>X</b>
            <b>J</b>
            <b>V</b>
            <b>S</b>
            <b>D</b>

        </div>

        <div class="days">

    `;


    for (
        let i = 0;
        i < firstDay;
        i++
    ) {

        html += `<span></span>`;

    }


    for (
        let day = 1;
        day <= totalDays;
        day++
    ) {

        const date =
            new Date(
                year,
                month,
                day
            );


        date.setHours(
            0,
            0,
            0,
            0
        );


        const value =
            iso(date);


        const past =
            date < today;


        html += `

            <button
                type="button"
                class="day ${
                    past
                        ? "disabled"
                        : ""
                } ${
                    value === chosenDate
                        ? "selected"
                        : ""
                }"
                ${
                    past
                        ? "disabled"
                        : ""
                }
                data-date="${value}"
            >
                ${day}
            </button>

        `;

    }


    html += `
        </div>
    `;


    $("#calendar").innerHTML =
        html;


    document
        .querySelectorAll(
            "#calendar [data-date]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    chosenDate =
                        button.dataset.date;

                    chosenTime = "";

                    $("#bDate").value =
                        chosenDate;

                    $("#bTime").value =
                        "";

                    renderCalendar();

                    renderTimes();

                }
            );

        });

}


/* =========================================================
   OBTENER HORARIOS OCUPADOS
========================================================= */

async function busy(date) {

    if (!db) {

        const local =
            JSON.parse(
                localStorage.getItem(
                    "danu_spa_reservations"
                ) || "[]"
            );


        return local.filter(
            item =>
                item.date === date &&
                item.status !==
                    "cancelada"
        );

    }


    const response =
        await db
            .from("appointments")
            .select(
                "id,time,status"
            )
            .eq(
                "date",
                date
            )
            .neq(
                "status",
                "cancelada"
            );


    if (response.error) {

        console.error(
            "Error consultando citas:",
            response.error
        );

        return [];

    }


    return response.data || [];

}


/* =========================================================
   HORARIOS
========================================================= */

async function renderTimes() {

    const product =
        products.find(
            item =>
                String(item.id) ===
                String(
                    $("#bProduct").value
                )
        );


    if (!product) {

        $("#times").innerHTML = `
            <p class="empty-message">
                Primero selecciona un tratamiento.
            </p>
        `;

        return;

    }


    if (!chosenDate) {

        $("#times").innerHTML = `
            <p class="empty-message">
                Ahora selecciona el día de tu cita.
            </p>
        `;

        return;

    }


    $("#times").innerHTML = `
        <p class="loading">
            Consultando horarios...
        </p>
    `;


    const reservations =
        await busy(
            chosenDate
        );


    const taken =
        new Set(
            reservations.map(
                item =>
                    String(
                        item.time
                    ).slice(0, 5)
            )
        );


    let html = `

        <div class="times-title">
            Horarios disponibles
        </div>

        <div class="times">

    `;


    for (
        let hour = 9;
        hour <= 18;
        hour++
    ) {

        for (
            const minute of [0, 30]
        ) {

            if (
                hour === 18 &&
                minute === 30
            ) {

                continue;

            }


            const time =
                `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;


            const isTaken =
                taken.has(time);


            html += `

                <button
                    type="button"
                    class="time ${
                        isTaken
                            ? "busy"
                            : ""
                    } ${
                        time === chosenTime
                            ? "selected"
                            : ""
                    }"
                    ${
                        isTaken
                            ? "disabled"
                            : ""
                    }
                    data-time="${time}"
                >
                    ${time}
                </button>

            `;

        }

    }


    html += `
        </div>
    `;


    $("#times").innerHTML =
        html;


    document
        .querySelectorAll(
            "#times [data-time]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    chosenTime =
                        button.dataset.time;

                    $("#bTime").value =
                        chosenTime;

                    renderTimes();

                }
            );

        });

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


    if (
        value.startsWith("57")
    ) {

        return value;

    }


    if (
        value.length === 10 &&
        value.startsWith("3")
    ) {

        return `57${value}`;

    }


    return value;

}


/* =========================================================
   RESERVAR
========================================================= */

async function book(event) {

    event.preventDefault();


    const product =
        products.find(
            item =>
                String(item.id) ===
                String(
                    $("#bProduct").value
                )
        );


    if (!product) {

        toast(
            "Selecciona un tratamiento."
        );

        return;

    }


    if (!chosenDate) {

        toast(
            "Selecciona una fecha."
        );

        return;

    }


    if (!chosenTime) {

        toast(
            "Selecciona un horario."
        );

        return;

    }


    const name =
        $("#bName").value.trim();


    const phone =
        $("#bPhone").value.trim();


    if (!name || !phone) {

        toast(
            "Completa tu nombre y teléfono."
        );

        return;

    }


    const phoneNormalized =
        normalizePhone(phone);


    const reservation = {

        product_id:
            product.id,

        name,

        phone:

            phoneNormalized,

        date:
            chosenDate,

        time:
            chosenTime,

        notes:
            $("#bNotes").value.trim(),

        status:
            "pendiente"

    };


    const submit =
        $("#submitBooking");


    submit.disabled =
        true;

    submit.textContent =
        "Guardando reserva...";


    try {

        /*
         * Comprobar nuevamente
         * que el horario siga libre.
         */

        const existing =
            await busy(
                chosenDate
            );


        const occupied =
            existing.some(
                item =>
                    String(
                        item.time
                    ).slice(0, 5) ===
                    chosenTime
            );


        if (occupied) {

            toast(
                "Ese horario acaba de ser ocupado. Selecciona otro."
            );

            await renderTimes();

            return;

        }


        if (db) {

            const response =
                await db
                    .from("appointments")
                    .insert(
                        reservation
                    )
                    .select()
                    .single();


            if (response.error) {

                console.error(
                    response.error
                );

                toast(
                    "No se pudo registrar la reserva: " +
                    response.error.message
                );

                return;

            }

        } else {

            const local =
                JSON.parse(
                    localStorage.getItem(
                        "danu_spa_reservations"
                    ) || "[]"
                );


            local.push({

                ...reservation,

                id:
                    crypto.randomUUID(),

                created_at:
                    new Date()
                        .toISOString()

            });


            localStorage.setItem(
                "danu_spa_reservations",
                JSON.stringify(local)
            );

        }


        closeBooking();

        $("#bookingForm").reset();

        chosenDate = "";

        chosenTime = "";


        toast(
            "¡Reserva registrada correctamente!"
        );


    } catch (error) {

        console.error(error);

        toast(
            "Ocurrió un error al registrar la reserva."
        );

    } finally {

        submit.disabled =
            false;

        submit.textContent =
            "Solicitar reserva";

    }

}


/* =========================================================
   NOTIFICACIONES
========================================================= */

function toast(message) {

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
        3500
    );

}


/* =========================================================
   INICIAR
========================================================= */

init();