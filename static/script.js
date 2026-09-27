// ======================================================
// ORDER MANAGEMENT SYSTEM - COMPLETE SCRIPT
// ======================================================

const $ = (id) => document.getElementById(id);


// ======================================================
// MAIN ELEMENTS
// ======================================================

const orderType = $("orderType");
const nameInput = $("name");
const phoneInput = $("phone");
const addressInput = $("address");
const tableNumber = $("tableNumber");
const itemsBox = $("items");


// ======================================================
// PAGE LOAD
// ======================================================

window.addEventListener("load", function () {

    // Always start page from the top after login
    window.scrollTo(0, 0);

});


// ======================================================
// ORDER TYPE
// ======================================================

if (orderType) {

    orderType.addEventListener("change", function () {

        const type = orderType.value;


        // -------------------------------
        // DINE-IN
        // -------------------------------

        if ($("tableBox")) {

            $("tableBox").classList.toggle(
                "hidden",
                type !== "Dine-In"
            );

        }


        // -------------------------------
        // DELIVERY
        // -------------------------------

        if ($("addressBox")) {

            $("addressBox").classList.toggle(
                "hidden",
                type !== "Delivery"
            );

        }


        // Clear validation error
        if ($("orderTypeError")) {

            $("orderTypeError").textContent = "";

        }

        orderType.classList.remove("invalid");

    });

}


// ======================================================
// PHONE INPUT
// OWNER ONLY
// ======================================================

if (
    CURRENT_ROLE === "owner" &&
    phoneInput
) {

    phoneInput.addEventListener("input", function () {

        // Allow digits only
        phoneInput.value =
            phoneInput.value
                .replace(/\D/g, "")
                .slice(0, 10);


        if (phoneInput.value.length > 0) {

            if (
                /^\d{10}$/.test(
                    phoneInput.value
                )
            ) {

                phoneInput.classList.remove(
                    "invalid"
                );

                if ($("phoneError")) {
                    $("phoneError").textContent = "";
                }

            } else {

                phoneInput.classList.add(
                    "invalid"
                );

                if ($("phoneError")) {
                    $("phoneError").textContent =
                        "⚠ Phone number must contain exactly 10 digits.";
                }
            }
        }

    });

}


// ======================================================
// ADD ITEM
// ======================================================

function addItem() {

    if (!itemsBox) {
        return;
    }


    const row =
        document.createElement("div");

    row.className = "item-row";


    row.innerHTML = `

        <div>
            <label>Item Name</label>

            <input
                type="text"
                class="item-name"
                maxlength="100"
                placeholder="Enter item name"
            >
        </div>


        <div>
            <label>Quantity</label>

            <input
                type="number"
                class="item-qty"
                min="1"
                step="1"
                value="1"
            >
        </div>


        <div>
            <label>Price</label>

            <input
                type="number"
                class="item-price"
                min="0"
                step="0.01"
                placeholder="0.00"
            >
        </div>


        <div>
            <label>Subtotal</label>

            <input
                type="text"
                class="item-subtotal"
                value="0.00"
                readonly
            >
        </div>


        <button
            type="button"
            class="danger remove-item"
        >
            ✕
        </button>


        <small class="error item-error"></small>

    `;


    itemsBox.appendChild(row);


    // Quantity changed
    row.querySelector(
        ".item-qty"
    ).addEventListener(
        "input",
        updateTotal
    );


    // Price changed
    row.querySelector(
        ".item-price"
    ).addEventListener(
        "input",
        updateTotal
    );


    // Remove item
    row.querySelector(
        ".remove-item"
    ).addEventListener(
        "click",
        function () {

            row.remove();

            updateTotal();

        }
    );


    updateTotal();
}


// ======================================================
// UPDATE TOTAL
// ======================================================

function updateTotal() {

    let total = 0;


    document
        .querySelectorAll(".item-row")
        .forEach(function (row) {

            const qty =
                Number(
                    row.querySelector(
                        ".item-qty"
                    ).value
                ) || 0;


            const price =
                Number(
                    row.querySelector(
                        ".item-price"
                    ).value
                ) || 0;


            const subtotal =
                qty * price;


            row.querySelector(
                ".item-subtotal"
            ).value =
                subtotal.toFixed(2);


            total += subtotal;

        });


    if ($("total")) {

        $("total").textContent =
            total.toFixed(2);

    }

}


// ======================================================
// VALIDATE ORDER
// ======================================================

function validateOrder() {

    let valid = true;


    // --------------------------------------
    // ORDER TYPE
    // --------------------------------------

    if (!orderType || !orderType.value) {

        if (orderType) {
            orderType.classList.add("invalid");
        }

        if ($("orderTypeError")) {

            $("orderTypeError").textContent =
                "⚠ Please select an order type.";

        }

        valid = false;

    } else {

        orderType.classList.remove(
            "invalid"
        );

        if ($("orderTypeError")) {

            $("orderTypeError").textContent =
                "";

        }

    }


    // --------------------------------------
    // CUSTOMER NAME
    // --------------------------------------

    if (
        !nameInput ||
        !nameInput.value.trim()
    ) {

        if (nameInput) {
            nameInput.classList.add(
                "invalid"
            );
        }

        if ($("nameError")) {

            $("nameError").textContent =
                "⚠ Customer name is required.";

        }

        valid = false;

    } else {

        nameInput.classList.remove(
            "invalid"
        );

        if ($("nameError")) {

            $("nameError").textContent =
                "";

        }

    }


    // --------------------------------------
    // OWNER PHONE
    // --------------------------------------

    if (
        CURRENT_ROLE === "owner" &&
        phoneInput
    ) {

        const phone =
            phoneInput.value.trim();


        if (!/^\d{10}$/.test(phone)) {

            phoneInput.classList.add(
                "invalid"
            );

            if ($("phoneError")) {

                $("phoneError").textContent =
                    "⚠ Enter exactly 10 digits.";

            }

            valid = false;

        } else {

            phoneInput.classList.remove(
                "invalid"
            );

            if ($("phoneError")) {

                $("phoneError").textContent =
                    "";

            }

        }

    }


    // --------------------------------------
    // DELIVERY ADDRESS
    // --------------------------------------

    if (
        orderType &&
        orderType.value === "Delivery"
    ) {

        // Owner must provide address
        if (
            CURRENT_ROLE === "owner" &&
            addressInput
        ) {

            if (!addressInput.value.trim()) {

                addressInput.classList.add(
                    "invalid"
                );

                if ($("addressError")) {

                    $("addressError").textContent =
                        "⚠ Delivery address is required.";

                }

                valid = false;

            } else {

                addressInput.classList.remove(
                    "invalid"
                );

                if ($("addressError")) {

                    $("addressError").textContent =
                        "";

                }

            }

        }

    }


    // --------------------------------------
    // DINE-IN TABLE
    // --------------------------------------

    if (
        orderType &&
        orderType.value === "Dine-In"
    ) {

        const table =
            tableNumber
                ? tableNumber.value.trim()
                : "";


        if (!table) {

            if (tableNumber) {

                tableNumber.classList.add(
                    "invalid"
                );

            }

            if ($("tableError")) {

                $("tableError").textContent =
                    "⚠ Table number is required.";

            }

            valid = false;

        } else {

            if (tableNumber) {

                tableNumber.classList.remove(
                    "invalid"
                );

            }

            if ($("tableError")) {

                $("tableError").textContent =
                    "";

            }

        }

    }


    // --------------------------------------
    // ITEMS
    // --------------------------------------

    const rows =
        document.querySelectorAll(
            ".item-row"
        );


    if (rows.length === 0) {

        valid = false;

        if ($("orderMessage")) {

            $("orderMessage").innerHTML =
                `<div class="error-box">
                    ⚠ Please add at least one item.
                </div>`;

        }

    }


    rows.forEach(function (row) {

        const itemName =
            row.querySelector(
                ".item-name"
            );

        const qtyInput =
            row.querySelector(
                ".item-qty"
            );

        const priceInput =
            row.querySelector(
                ".item-price"
            );

        const error =
            row.querySelector(
                ".item-error"
            );


        const itemNameValue =
            itemName.value.trim();

        const qty =
            Number(
                qtyInput.value
            );

        const priceText =
            priceInput.value.trim();

        const price =
            Number(priceText);


        // Item name
        if (!itemNameValue) {

            itemName.classList.add(
                "invalid"
            );

            error.textContent =
                "⚠ Item name is required.";

            valid = false;

            return;
        }


        // Quantity
        if (
            !Number.isInteger(qty) ||
            qty <= 0
        ) {

            qtyInput.classList.add(
                "invalid"
            );

            error.textContent =
                "⚠ Quantity must be greater than 0.";

            valid = false;

            return;
        }


        // Price
        if (
            priceText === "" ||
            !Number.isFinite(price) ||
            price < 0
        ) {

            priceInput.classList.add(
                "invalid"
            );

            error.textContent =
                "⚠ Enter a valid price.";

            valid = false;

            return;
        }


        // Valid
        itemName.classList.remove(
            "invalid"
        );

        qtyInput.classList.remove(
            "invalid"
        );

        priceInput.classList.remove(
            "invalid"
        );

        error.textContent = "";

    });


    return valid;
}


// ======================================================
// ADD ITEM BUTTON
// ======================================================

if ($("addItem")) {

    $("addItem").addEventListener(
        "click",
        function () {

            addItem();

        }
    );

}


// ======================================================
// COMPLETE ORDER
// ======================================================

if ($("completeOrder")) {

    $("completeOrder").addEventListener(
        "click",
        async function () {

            if ($("orderMessage")) {

                $("orderMessage").innerHTML =
                    "";

            }


            // Validate
            if (!validateOrder()) {

                if ($("orderMessage")) {

                    $("orderMessage").innerHTML =
                        `<div class="error-box">
                            ⚠ Please correct the red-marked fields.
                        </div>`;

                }

                return;
            }


            // --------------------------------------
            // COLLECT ITEMS
            // --------------------------------------

            const items = [];


            document
                .querySelectorAll(".item-row")
                .forEach(function (row) {

                    items.push({

                        item_name:
                            row.querySelector(
                                ".item-name"
                            ).value.trim(),

                        quantity:
                            Number(
                                row.querySelector(
                                    ".item-qty"
                                ).value
                            ),

                        price:
                            Number(
                                row.querySelector(
                                    ".item-price"
                                ).value
                            )

                    });

                });


            // --------------------------------------
            // CREATE PAYLOAD
            // --------------------------------------

            const payload = {

                order_type:
                    orderType.value,

                name:
                    nameInput.value.trim(),

                phone:
                    CURRENT_ROLE === "owner"
                        ? phoneInput.value.trim()
                        : null,

                address:
                    CURRENT_ROLE === "owner"
                        ? (
                            addressInput
                                ? addressInput.value.trim()
                                : null
                        )
                        : null,

                table_number:
                    orderType.value === "Dine-In"
                        ? (
                            tableNumber
                                ? tableNumber.value.trim()
                                : null
                        )
                        : null,

                items:
                    items

            };


            try {

                const response =
                    await fetch(
                        "/api/orders",
                        {

                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    payload
                                )

                        }
                    );


                const result =
                    await response.json();


                if (
                    !response.ok ||
                    !result.success
                ) {

                    if ($("orderMessage")) {

                        $("orderMessage").innerHTML =
                            `<div class="error-box">
                                ⚠ ${
                                    result.message ||
                                    "Could not create order."
                                }
                            </div>`;

                    }

                    return;
                }


                // --------------------------------------
                // SUCCESS
                // --------------------------------------

                if ($("orderMessage")) {

                    $("orderMessage").innerHTML =
                        `<div class="success-box">

                            ✓ Order completed successfully.

                            <br>

                            Order ID:
                            <strong>
                                #${result.order_id}
                            </strong>

                            <br>

                            Total:
                            <strong>
                                ₹${Number(
                                    result.total
                                ).toFixed(2)}
                            </strong>

                        </div>`;

                }


            } catch (error) {

                console.error(error);


                if ($("orderMessage")) {

                    $("orderMessage").innerHTML =
                        `<div class="error-box">
                            ⚠ Server connection error.
                        </div>`;

                }

            }

        }
    );

}


// ======================================================
// OWNER — DATE-WISE PURCHASE HISTORY
// ======================================================

if (CURRENT_ROLE === "owner") {

    const searchDate =
        $("searchDate");

    const searchByDate =
        $("searchByDate");


    // IMPORTANT:
    // We DO NOT automatically fill the date.
    // We DO NOT focus the date input.
    // We DO NOT open the date picker.


    if (searchByDate && searchDate) {

        searchByDate.addEventListener(
            "click",
            async function () {

                const selectedDate =
                    searchDate.value;


                if ($("searchError")) {

                    $("searchError").textContent =
                        "";

                }

                if ($("customerResult")) {

                    $("customerResult").innerHTML =
                        "";

                }


                // --------------------------------------
                // NO DATE
                // --------------------------------------

                if (!selectedDate) {

                    searchDate.classList.add(
                        "invalid"
                    );

                    if ($("searchError")) {

                        $("searchError").textContent =
                            "⚠ Please select a date.";

                    }

                    return;
                }


                searchDate.classList.remove(
                    "invalid"
                );


                try {

                    const response =
                        await fetch(
                            `/api/orders-by-date/${selectedDate}`
                        );


                    const result =
                        await response.json();


                    if (
                        !response.ok ||
                        !result.success
                    ) {

                        if ($("customerResult")) {

                            $("customerResult").innerHTML =
                                `<div class="error-box">
                                    ⚠ ${
                                        result.message ||
                                        "Could not load purchase history."
                                    }
                                </div>`;

                        }

                        return;
                    }


                    // --------------------------------------
                    // NO ORDERS
                    // --------------------------------------

                    if (
                        !result.orders ||
                        result.orders.length === 0
                    ) {

                        if ($("customerResult")) {

                            $("customerResult").innerHTML =
                                `<div class="error-box">
                                    ⚠ No orders found for
                                    ${escapeHtml(
                                        selectedDate
                                    )}.
                                </div>`;

                        }

                        return;
                    }


                    // --------------------------------------
                    // HISTORY
                    // --------------------------------------

                    let html = `

                        <div class="customer-box">

                            <h3>
                                Purchase History —
                                ${escapeHtml(
                                    selectedDate
                                )}
                            </h3>

                            <p>
                                <strong>
                                    Total Orders:
                                </strong>

                                ${
                                    result.orders.length
                                }
                            </p>

                            <div class="purchase-history">

                    `;


                    result.orders.forEach(
                        function (order) {

                            let itemsHTML = "";


                            // --------------------------------
                            // PURCHASED ITEMS
                            // --------------------------------

                            if (
                                order.items &&
                                order.items.length > 0
                            ) {

                                order.items.forEach(
                                    function (item) {

                                        itemsHTML += `

                                            <div class="purchase-item">

                                                <strong>
                                                    ${escapeHtml(
                                                        item.item_name
                                                    )}
                                                </strong>

                                                ×
                                                ${escapeHtml(
                                                    item.quantity
                                                )}

                                                — ₹${Number(
                                                    item.price
                                                ).toFixed(2)}

                                                =

                                                <strong>
                                                    ₹${Number(
                                                        item.subtotal
                                                    ).toFixed(2)}
                                                </strong>

                                            </div>

                                        `;

                                    }
                                );

                            } else {

                                itemsHTML = `
                                    <div class="purchase-item">
                                        No purchased item information available.
                                    </div>
                                `;

                            }


                            // --------------------------------
                            // DATE / TIME
                            // --------------------------------

                            let dateTime =
                                order.created_at || "";


                            try {

                                dateTime =
                                    new Date(
                                        order.created_at
                                    ).toLocaleString(
                                        "en-IN"
                                    );

                            } catch (e) {

                                // Keep original value

                            }


                            // --------------------------------
                            // ORDER CARD
                            // --------------------------------

                            html += `

                                <div class="order-history-card">

                                    <h3>
                                        🧾 Order
                                        #${escapeHtml(
                                            order.order_id
                                        )}
                                    </h3>


                                    <p>
                                        <strong>
                                            Date & Time:
                                        </strong>

                                        ${escapeHtml(
                                            dateTime
                                        )}
                                    </p>


                                    <p>
                                        <strong>
                                            Customer:
                                        </strong>

                                        ${escapeHtml(
                                            order.name ||
                                            "Unknown"
                                        )}
                                    </p>


                                    <p>
                                        <strong>
                                            Phone:
                                        </strong>

                                        ${escapeHtml(
                                            order.phone ||
                                            "N/A"
                                        )}
                                    </p>


                                    <p>
                                        <strong>
                                            Address:
                                        </strong>

                                        ${escapeHtml(
                                            order.address ||
                                            "N/A"
                                        )}
                                    </p>


                                    <p>
                                        <strong>
                                            Order Type:
                                        </strong>

                                        ${escapeHtml(
                                            order.order_type ||
                                            "N/A"
                                        )}
                                    </p>


                                    ${
                                        order.table_number
                                            ? `

                                                <p>
                                                    <strong>
                                                        Table:
                                                    </strong>

                                                    ${escapeHtml(
                                                        order.table_number
                                                    )}
                                                </p>

                                            `
                                            : ""
                                    }


                                    <p>
                                        <strong>
                                            Status:
                                        </strong>

                                        ${escapeHtml(
                                            order.status ||
                                            "N/A"
                                        )}
                                    </p>


                                    <hr>


                                    <h4>
                                        🛒 Purchased Items
                                    </h4>


                                    <div class="items-history">

                                        ${itemsHTML}

                                    </div>


                                    <hr>


                                    <h3>

                                        Total:
                                        ₹${Number(
                                            order.total_amount ||
                                            0
                                        ).toFixed(2)}

                                    </h3>

                                </div>

                            `;

                        }
                    );


                    html += `

                            </div>

                        </div>

                    `;


                    if ($("customerResult")) {

                        $("customerResult").innerHTML =
                            html;

                    }


                } catch (error) {

                    console.error(error);


                    if ($("customerResult")) {

                        $("customerResult").innerHTML =
                            `<div class="error-box">
                                ⚠ Server connection error.
                            </div>`;

                    }

                }

            }
        );

    }

}


// ======================================================
// LOGOUT
// ======================================================

if ($("logout")) {

    $("logout").addEventListener(
        "click",
        async function () {

            try {

                await fetch(
                    "/logout",
                    {
                        method: "POST"
                    }
                );

            } catch (error) {

                console.error(error);

            }


            window.location.href =
                "/login";

        }
    );

}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ======================================================
// INITIAL ITEM
// ======================================================

if (itemsBox) {

    // Only add an item if there isn't already one
    // in the HTML.
    if (
        document.querySelectorAll(
            ".item-row"
        ).length === 0
    ) {

        addItem();

    }

}


// ======================================================
// INITIAL TOTAL
// ======================================================

updateTotal();