        const API_BASE = "/api";
let products = [];
let cart = [];
let currentCategory = "All";
let orderType = "Dine In";
let currentPayMethod = "Cash";

async function init() {
    if (window.lucide) {
        lucide.createIcons();
    }
    await loadProducts();
}

async function loadProducts() {
    try {
        const res = await fetch(`${API_BASE}/products`);
        products = await res.json();
        renderCatalog();
        renderAdminProducts();
    } catch (e) {
        console.error("Gagal load produk", e);
    }
}

function filterCategory(cat) {
    currentCategory = cat;
    document.querySelectorAll(".cat-pill").forEach(btn => {
        btn.className = "cat-pill pill-btn px-6 py-2.5 text-xs font-semibold bg-white border border-rvBorder text-rvDark hover:bg-rvSurface whitespace-nowrap";
    });
    event.target.className = "cat-pill pill-btn px-6 py-2.5 text-xs font-bold bg-rvDark text-white whitespace-nowrap";
    renderCatalog();
}

function renderCatalog() {
    const grid = document.getElementById("product-grid");
    if (!grid) return;
    grid.innerHTML = "";
    const filtered = currentCategory === "All" ? products : products.filter(p => p.category === currentCategory);

    filtered.forEach(p => {
        const img = p.image_url || "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300";
        grid.innerHTML += `
            <div onclick="addToCart(${p.id})" class="bg-white rounded-3xl p-4 border border-rvBorder hover:border-rvDark/30 cursor-pointer transition flex flex-col justify-between group">
                <div class="h-36 w-full rounded-2xl overflow-hidden mb-3 bg-rvSurface relative">
                    <img src="${img}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                    <span class="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-sm text-rvDark px-2.5 py-1 rounded-full text-[10px] font-bold">${p.category}</span>
                </div>
                <div>
                    <h4 class="font-bold text-sm text-rvDark tracking-tight line-clamp-1">${p.name}</h4>
                    <div class="flex justify-between items-center mt-2">
                        <span class="text-sm font-extrabold text-rvDark">Rp ${p.price.toLocaleString('id-ID')}</span>
                        <span class="text-[11px] font-medium text-rvGray">Stok ${p.stock}</span>
                    </div>
                </div>
            </div>
        `;
    });
}

function addToCart(prodId) {
    const item = products.find(p => p.id === prodId);
    if (!item || item.stock <= 0) return alert("Stok habis!");
    
    const exist = cart.find(c => c.product_id === prodId);
    if (exist) {
        if (exist.quantity < item.stock) exist.quantity += 1;
        else alert("Maksimum stok tercapai");
    } else {
        cart.push({
            product_id: item.id,
            product_name: item.name,
            price: item.price,
            quantity: 1,
            notes: ""
        });
    }
    renderCart();
}

function changeQty(index, delta) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    renderCart();
}

function renderCart() {
    const list = document.getElementById("cart-list");
    if (!list) return;
    if (cart.length === 0) {
        list.innerHTML = `<div class="text-center py-20 text-rvGray text-xs font-medium">Belum ada item dipilih</div>`;
        updateSummary(0);
        return;
    }

    list.innerHTML = "";
    let subtotal = 0;

    cart.forEach((c, idx) => {
        subtotal += c.price * c.quantity;
        list.innerHTML += `
            <div class="bg-rvSurface p-3.5 rounded-2xl border border-rvBorder flex items-center justify-between">
                <div class="flex-1 pr-3">
                    <p class="font-bold text-xs text-rvDark tracking-tight">${c.product_name}</p>
                    <p class="text-[11px] text-rvGray font-semibold mt-0.5">Rp ${(c.price * c.quantity).toLocaleString('id-ID')}</p>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="changeQty(${idx}, -1)" class="w-7 h-7 rounded-full bg-white border border-rvBorder font-bold text-xs flex items-center justify-center text-rvDark hover:bg-rvSurface">-</button>
                    <span class="text-xs font-bold w-4 text-center text-rvDark">${c.quantity}</span>
                    <button onclick="changeQty(${idx}, 1)" class="w-7 h-7 rounded-full bg-rvDark text-white font-bold text-xs flex items-center justify-center hover:bg-black">+</button>
                </div>
            </div>
        `;
    });

    updateSummary(subtotal);
}

function updateSummary(subtotal) {
    const tax = Math.round(subtotal * 0.1);
    const total = subtotal + tax;
    document.getElementById("txt-subtotal").innerText = `Rp ${subtotal.toLocaleString('id-ID')}`;
    document.getElementById("txt-tax").innerText = `Rp ${tax.toLocaleString('id-ID')}`;
    document.getElementById("txt-total").innerText = `Rp ${total.toLocaleString('id-ID')}`;
}

function setOrderType(type) {
    orderType = type;
    document.getElementById("type-dinein").className = type === 'Dine In' ? "pill-btn flex-1 py-2 text-xs font-bold bg-white text-rvDark" : "pill-btn flex-1 py-2 text-xs font-semibold text-rvGray hover:text-rvDark";
    document.getElementById("type-takeaway").className = type === 'Take Away' ? "pill-btn flex-1 py-2 text-xs font-bold bg-white text-rvDark" : "pill-btn flex-1 py-2 text-xs font-semibold text-rvGray hover:text-rvDark";
}

function openPaymentModal(method) {
    if (cart.length === 0) return alert("Pilih menu terlebih dahulu!");
    currentPayMethod = method;
    
    const subtotal = cart.reduce((acc, c) => acc + (c.price * c.quantity), 0);
    const total = subtotal + Math.round(subtotal * 0.1);

    document.getElementById("modal-title").innerText = `Bayar: ${method}`;
    document.getElementById("modal-total-amt").innerText = `Rp ${total.toLocaleString('id-ID')}`;
    
    if (method === "Cash") {
        document.getElementById("modal-cash-sec").classList.remove("hidden");
        document.getElementById("modal-edc-sec").classList.add("hidden");
        document.getElementById("input-cash-amt").value = "";
        document.getElementById("modal-change-amt").innerText = "Rp 0";
    } else {
        document.getElementById("modal-cash-sec").classList.add("hidden");
        document.getElementById("modal-edc-sec").classList.remove("hidden");
    }

    document.getElementById("payment-modal").classList.remove("hidden");
    document.getElementById("payment-modal").classList.add("flex");
}

function closePaymentModal() {
    document.getElementById("payment-modal").classList.add("hidden");
    document.getElementById("payment-modal").classList.remove("flex");
}

function calcChange() {
    const subtotal = cart.reduce((acc, c) => acc + (c.price * c.quantity), 0);
    const total = subtotal + Math.round(subtotal * 0.1);
    const cash = parseFloat(document.getElementById("input-cash-amt").value) || 0;
    const change = Math.max(0, cash - total);
    document.getElementById("modal-change-amt").innerText = `Rp ${change.toLocaleString('id-ID')}`;
}

function setExactCash() {
    const subtotal = cart.reduce((acc, c) => acc + (c.price * c.quantity), 0);
    const total = subtotal + Math.round(subtotal * 0.1);
    document.getElementById("input-cash-amt").value = total;
    calcChange();
}

function addCashPreset(amt) {
    document.getElementById("input-cash-amt").value = amt;
    calcChange();
}

async function executePayment() {
    const subtotal = cart.reduce((acc, c) => acc + (c.price * c.quantity), 0);
    const tax = Math.round(subtotal * 0.1);
    const total = subtotal + tax;
    const tableNo = document.getElementById("order-table").value || "-";

    if (currentPayMethod === "Cash") {
        const cash = parseFloat(document.getElementById("input-cash-amt").value) || 0;
        if (cash < total) return alert("Uang tunai kurang!");
    }

    const payload = {
        order_type: orderType,
        table_number: tableNo,
        items: cart,
        tax: tax,
        discount: 0,
        payment_method: currentPayMethod,
        payment_status: "PAID",
        notes: ""
    };

    try {
        const res = await fetch(`${API_BASE}/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        alert(`Pembayaran Berhasil!\nOrder ID: ${result.order_number}\nTotal: Rp ${result.total_amount.toLocaleString('id-ID')}\nTiket Bar & Struk telah dikirim ke printer.`);
        
        cart = [];
        renderCart();
        closePaymentModal();
        await loadProducts();
    } catch (e) {
        alert("Gagal memproses transaksi!");
    }
}

function switchView(v) {
    document.getElementById("view-pos").classList.add("hidden");
    document.getElementById("view-orders").classList.add("hidden");
    document.getElementById("view-admin").classList.add("hidden");
    
    document.getElementById("tab-pos").className = "pill-btn px-5 py-2 text-xs font-semibold bg-rvSurface text-rvDark hover:bg-slate-200";
    document.getElementById("tab-orders").className = "pill-btn px-5 py-2 text-xs font-semibold bg-rvSurface text-rvDark hover:bg-slate-200";
    document.getElementById("tab-admin").className = "pill-btn px-5 py-2 text-xs font-semibold bg-rvSurface text-rvDark hover:bg-slate-200";

    if (v === 'pos') {
        document.getElementById("view-pos").classList.remove("hidden");
        document.getElementById("tab-pos").className = "pill-btn px-5 py-2 text-xs font-semibold bg-rvDark text-white";
    } else if (v === 'orders') {
        document.getElementById("view-orders").classList.remove("hidden");
        document.getElementById("tab-orders").className = "pill-btn px-5 py-2 text-xs font-semibold bg-rvDark text-white";
        loadOrderHistory();
    } else if (v === 'admin') {
        document.getElementById("view-admin").classList.remove("hidden");
        document.getElementById("tab-admin").className = "pill-btn px-5 py-2 text-xs font-semibold bg-rvDark text-white";
        renderAdminProducts();
    }
    if (window.lucide) {
        lucide.createIcons();
    }
}

async function loadOrderHistory() {
    const res = await fetch(`${API_BASE}/orders`);
    const data = await res.json();
    const tbody = document.getElementById("orders-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    data.forEach(o => {
        const itemsStr = o.items.map(i => `${i.product_name} (${i.quantity})`).join(", ");
        tbody.innerHTML += `
            <tr class="hover:bg-rvSurface/60">
                <td class="p-4 font-bold text-rvDark">${o.order_number}</td>
                <td class="p-4 text-rvGray">${o.created_at}</td>
                <td class="p-4 font-medium">${o.order_type} (${o.table_number})</td>
                <td class="p-4 text-rvGray max-w-xs truncate">${itemsStr}</td>
                <td class="p-4 font-bold text-rvDark">Rp ${o.total_amount.toLocaleString('id-ID')}</td>
                <td class="p-4 font-medium">${o.payment_method}</td>
                <td class="p-4"><span class="pill-btn px-3 py-1 bg-emerald-50 text-rvTeal text-[10px] font-bold border border-emerald-100">${o.payment_status}</span></td>
            </tr>
        `;
    });
}

function renderAdminProducts() {
    const tbody = document.getElementById("admin-product-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    products.forEach(p => {
        const img = p.image_url || "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300";
        tbody.innerHTML += `
            <tr class="hover:bg-rvSurface/60">
                <td class="p-3"><img src="${img}" class="w-10 h-10 rounded-xl object-cover"></td>
                <td class="p-3 font-bold text-rvDark">${p.name}</td>
                <td class="p-3 text-rvGray">${p.category}</td>
                <td class="p-3 font-semibold">Rp ${p.price.toLocaleString('id-ID')}</td>
                <td class="p-3 font-medium">${p.stock}</td>
                <td class="p-3 text-center">
                    <button onclick="deleteProduct(${p.id})" class="pill-btn px-3 py-1 bg-rose-50 text-rvDanger hover:bg-rose-100 text-[11px] font-bold">Hapus</button>
                </td>
            </tr>
        `;
    });
}

async function submitNewProduct() {
    const name = document.getElementById("p-name").value;
    const category = document.getElementById("p-cat").value;
    const price = parseFloat(document.getElementById("p-price").value);
    const stock = parseInt(document.getElementById("p-stock").value) || 50;
    const fileInput = document.getElementById("p-file");

    if (!name || isNaN(price)) return alert("Isi nama dan harga menu!");

    let imageUrl = "";
    if (fileInput.files.length > 0) {
        const formData = new FormData();
        formData.append("file", fileInput.files[0]);
        const upRes = await fetch(`${API_BASE}/upload`, { method: "POST", body: formData });
        const upData = await upRes.json();
        imageUrl = upData.url;
    }

    await fetch(`${API_BASE}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, price, stock, image_url: imageUrl })
    });

    alert("Produk berhasil ditambahkan!");
    document.getElementById("p-name").value = "";
    document.getElementById("p-price").value = "";
    fileInput.value = "";
    await loadProducts();
}

async function deleteProduct(id) {
    if (!confirm("Yakin ingin menghapus menu ini?")) return;
    await fetch(`${API_BASE}/products/${id}`, { method: "DELETE" });
    await loadProducts();
}

window.onload = init;
