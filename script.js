// ========== BACKGROUND SLIDESHOW (circular segments) ==========
const slides = [
    { images: ['c.jpg', 'e.jpg'] },
    { images: ['c.jpg', 'f.jpg'] },
    { images: ['b.jpg', 'f.jpg'] },
    { images: ['a.jpg', 'd.jpg'] },
    { images: ['d.jpg', 'c.jpg'] },
    { images: ['d.jpg', 'f.jpg'] },
    { images: ['c.jpg', 'e.jpg', 'f.jpg'] },
    { images: ['d.jpg', 'e.jpg', 'f.jpg'] },
    { images: ['a.jpg', 'e.jpg', 'f.jpg'] },
    { images: ['a.jpg', 'b.jpg', 'f.jpg'] },
    { images: ['a.jpg', 'b.jpg', 'e.jpg'] }
];
let currentSlide = 0, slideInterval;
function buildSlides() {
    const container = document.getElementById('bgSlideshow');
    if (!container) return;
    container.innerHTML = '';
    slides.forEach((s, idx) => {
        const slideDiv = document.createElement('div');
        slideDiv.className = 'bg-slide';
        if (idx === 0) slideDiv.classList.add('active');
        s.images.forEach(img => {
            const imgDiv = document.createElement('div');
            imgDiv.className = 'bg-image';
            imgDiv.style.backgroundImage = `url('${img}')`;
            slideDiv.appendChild(imgDiv);
        });
        container.appendChild(slideDiv);
    });
}
function startSlideshow() {
    if(slideInterval) clearInterval(slideInterval);
    slideInterval = setInterval(() => {
        const slidesDivs = document.querySelectorAll('.bg-slide');
        if (slidesDivs.length === 0) return;
        slidesDivs[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slidesDivs.length;
        slidesDivs[currentSlide].classList.add('active');
    }, 5000);
}
window.addEventListener('DOMContentLoaded', () => {
    buildSlides();
    startSlideshow();
});

// ========== SIDEBAR & PREVIEW ==========
let previousHomeContent = null;
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }
function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); }

const pagesContent = {
    policy: `<h2>📜 System Policy</h2><p><strong>Contract Purchase</strong><br>Students must buy a meal contract before placing orders. Contracts are available as 2 weeks, monthly, or semester.</p><p><strong>Meal Plans</strong><br>Full contract: breakfast, lunch, dinner (3 meals/day). Half contract: lunch & dinner only (2 meals/day).</p><p><strong>Order Rules</strong><br>You can only order meals included in your active contract. Each order consumes meals equal to quantity. Pending orders can be cancelled.</p><p><strong>Contract Approval</strong><br>All contract requests must be approved by a manager. While pending, you cannot order but may cancel.</p><p><strong>Refund & Cancellation</strong><br>Cancelling a pending contract removes it completely. No refunds for active contracts.</p><p><strong>Security</strong><br>Keep your ID and password safe. Use security question to reset password.</p><p><strong>Fair Use</strong><br>Abusive behaviour may lead to contract suspension.</p>`,
    howitworks: `<h2>⚙️ How It Works</h2><p><strong>1. Create Account</strong> → Student tab → Sign Up → receive Student ID.</p><p><strong>2. Buy Contract</strong> → select type/plan/payment → request sent to manager.</p><p><strong>3. Approval</strong> → manager approves → contract active, meals & days shown.</p><p><strong>4. Place Order</strong> → choose meal type, item, quantity → order pending.</p><p><strong>5. Order Status</strong> → Pending → Served / Can't Serve (meal deducted only when Served).</p><p><strong>6. Manage Account</strong> → view info, balance, cancel pending orders/contracts.</p>`,
    features: `<h2>🌟 Student Features</h2><ul><li>Secure Registration & Login</li><li>Flexible Contract Options</li><li>Real‑Time Balance</li><li>Easy Ordering</li><li>Order Tracking</li><li>Contract Request Management</li><li>Forgot Password</li><li>Personal Dashboard</li><li>Transparent Consumption</li></ul>`,
    contact: `<h2>📞 Contact the Owner</h2><p><strong>Email:</strong> <span id="adminEmail">loading...</span><br><strong>Phone/WhatsApp:</strong> <span id="adminPhone">loading...</span></p><p><strong>Hours:</strong> Mon‑Fri 9‑17, Sat 10‑14, Sun closed</p>`
};

function showFullInfoPage(page, isTemporary = false) {
    const homeDiv = document.getElementById('home');
    const permanentInfo = document.getElementById('infoContent');
    const tempDiv = document.getElementById('previewTemp');
    if (!isTemporary) {
        if (tempDiv && !tempDiv.classList.contains('hidden')) tempDiv.classList.add('hidden');
        permanentInfo.innerHTML = pagesContent[page];
        permanentInfo.classList.remove('hidden');
        if (page === 'contact') {
            fetch('http://127.0.0.1:5000/admin/contact')
                .then(r=>r.json())
                .then(d=>{ document.getElementById('adminEmail').innerText = d.email; document.getElementById('adminPhone').innerText = d.phone; })
                .catch(()=>{ document.getElementById('adminEmail').innerText = 'owner@cafesystem.com'; document.getElementById('adminPhone').innerText = '+251 9XX XXX XXX'; });
        }
    } else {
        if (!previousHomeContent) previousHomeContent = homeDiv.innerHTML;
        if (tempDiv) {
            tempDiv.innerHTML = pagesContent[page];
            tempDiv.classList.remove('hidden');
            if (permanentInfo) permanentInfo.classList.add('hidden');
            if (page === 'contact') {
                fetch('http://127.0.0.1:5000/admin/contact')
                    .then(r=>r.json())
                    .then(d=>{
                        const emailSpan = tempDiv.querySelector('#adminEmail');
                        const phoneSpan = tempDiv.querySelector('#adminPhone');
                        if(emailSpan) emailSpan.innerText = d.email;
                        if(phoneSpan) phoneSpan.innerText = d.phone;
                    });
            }
        }
    }
}
function revertToHome() {
    const homeDiv = document.getElementById('home');
    const tempDiv = document.getElementById('previewTemp');
    const permInfo = document.getElementById('infoContent');
    if (tempDiv && !tempDiv.classList.contains('hidden')) {
        tempDiv.classList.add('hidden');
        if (permInfo) permInfo.classList.add('hidden');
        if (previousHomeContent) {
            homeDiv.innerHTML = previousHomeContent;
            previousHomeContent = null;
            const advCard = homeDiv.querySelector('.card');
            if (advCard) advCard.addEventListener('click', () => show('register'));
        }
    }
}
const menuItems = document.querySelectorAll('.sidebar li');
menuItems.forEach(item => {
    item.addEventListener('mouseenter', () => {
        const page = item.getAttribute('data-page');
        if (page === 'home') revertToHome();
        else showFullInfoPage(page, true);
    });
    item.addEventListener('mouseleave', () => { revertToHome(); });
    item.addEventListener('click', () => {
        const page = item.getAttribute('data-page');
        if (page === 'home') show('home');
        else showFullInfoPage(page, false);
        closeSidebar();
    });
});
document.addEventListener('DOMContentLoaded', () => {
    const advCard = document.querySelector('#home .card');
    if (advCard) advCard.addEventListener('click', () => show('register'));
});

// ========== GLOBALS ==========
let currentStudent = null, currentManager = null, forgotStudentId = null, forgotManagerUsername = null;
let studentInfoVisible = false, studentBalanceVisible = false, managerInfoVisible = false, dailySummaryVisible = false, auditVisible = false, pendingContractId = null;
let orderPollingInterval = null, lastShownStatus = {};

function escapeHtml(str) { if(!str) return ''; return str.replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m])); }
function showModal(msg) {
    let modal = document.getElementById('customModal');
    if(!modal){ modal = document.createElement('div'); modal.id = 'customModal'; modal.className = 'modal'; modal.innerHTML = '<div class="modal-content"><p id="modalMsg"></p><button onclick="closeModal()">OK</button></div>'; document.body.appendChild(modal); }
    document.getElementById('modalMsg').innerText = msg; modal.style.display = 'flex';
}
function closeModal() { document.getElementById('customModal').style.display = 'none'; }
function stopOrderPolling() { if(orderPollingInterval) clearInterval(orderPollingInterval); orderPollingInterval = null; }
function startOrderPolling(orderId) {
    stopOrderPolling(); if(!orderId) return; delete lastShownStatus[orderId];
    orderPollingInterval = setInterval(() => {
        if(!currentStudent || !orderId) { stopOrderPolling(); return; }
        fetch(`http://127.0.0.1:5000/student/orders/${currentStudent.student_id}`).then(r=>r.ok?r.json():null).then(orders=>{
            let myOrder = orders?.find(o=>o.order_id==orderId);
            if(myOrder) {
                let s = myOrder.status;
                if(lastShownStatus[orderId] !== s) {
                    lastShownStatus[orderId]=s;
                    if(s==='served') { showModal("Order is served! Have a nice meal!"); stopOrderPolling(); document.getElementById("cancelOrderBtn").style.display="none"; if(window.currentOrderId===orderId) window.currentOrderId=null; }
                    else if(s==='cant_serve') { showModal("Sorry can't serve the meal"); stopOrderPolling(); document.getElementById("cancelOrderBtn").style.display="none"; if(window.currentOrderId===orderId) window.currentOrderId=null; }
                }
            } else stopOrderPolling();
        }).catch(()=>stopOrderPolling());
    }, 3000);
}
function hideNav() { document.getElementById('navLinks').style.display = 'none'; }
function showNav() { document.getElementById('navLinks').style.display = 'flex'; }
function show(id) {
    if(id!=='student') stopOrderPolling();
    document.querySelectorAll('.container > div, #adminPage, #managerSignup').forEach(d=>d.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    if(id==='home') { showNav(); revertToHome(); }
}

// ========== STUDENT FUNCTIONS ==========
async function register(){
    const name=document.getElementById("reg_name").value, email=document.getElementById("reg_email").value, phone=document.getElementById("reg_phone").value, pass=document.getElementById("reg_pass").value, cpass=document.getElementById("reg_cpass").value, q=document.getElementById("reg_q").value, ans=document.getElementById("reg_ans").value;
    if(!name||!email||!phone||!pass||!cpass||!q||!ans) return showModal("Please fill all fields");
    if(pass!==cpass) return showModal("Passwords do not match");
    const r=await fetch("http://127.0.0.1:5000/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,email,phone,password:pass,confirm_password:cpass,security_question:q,security_answer:ans})});
    const d=await r.json(); showModal(d.message); if(d.student_id) showModal("Account created! ID:"+d.student_id);
}
async function login(){
    const id=document.getElementById("log_id").value, pass=document.getElementById("log_pass").value;
    if(!id||!pass) return showModal("Enter ID and Password");
    const r=await fetch("http://127.0.0.1:5000/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,password:pass})});
    const d=await r.json();
    if(d.user){ currentStudent=d.user; document.getElementById("welcomeMsg").innerHTML=`Welcome ${escapeHtml(d.user.full_name)}`; hideNav(); show("student"); loadStudentDashboard(); }
    else showModal(d.message);
}
function loadStudentDashboard(){
    fetch(`http://127.0.0.1:5000/student/active_contract/${currentStudent.student_id}`).then(r=>r.json()).then(data=>{
        let area=document.getElementById("studentMainArea");
        if(data.has_active){ area.innerHTML=`<button onclick="showOrderForm()">Order Meal</button>`; currentStudent.contract_id=data.contract_id; }
        else fetch(`http://127.0.0.1:5000/student/has_pending_request/${currentStudent.student_id}`).then(r=>r.json()).then(pending=>{
            if(pending.has_pending){ pendingContractId=pending.contract_id; area.innerHTML=`<p>You have a pending contract request.</p><button onclick="cancelPendingContract()">Cancel Contract Request</button>`; }
            else area.innerHTML=`<p>You don't have an active contract. <button onclick="showBuyContract()">Buy Contract</button></p>`;
        });
    });
}
function cancelPendingContract(){ if(!pendingContractId) return; fetch(`http://127.0.0.1:5000/student/cancel_pending_contract/${pendingContractId}`,{method:"DELETE"}).then(r=>r.json()).then(d=>{ showModal(d.message); pendingContractId=null; loadStudentDashboard(); }); }
function toggleStudentInfo(){
    if(studentInfoVisible){ document.getElementById("studentInfoArea").innerHTML=""; studentInfoVisible=false; }
    else fetch(`http://127.0.0.1:5000/student/info/${currentStudent.student_id}`).then(r=>r.json()).then(info=>{ let html=`<div class="card"><h3>Your Info</h3><p>Name: ${escapeHtml(info.full_name)}</p><p>Email: ${escapeHtml(info.email)}</p><p>Phone: ${escapeHtml(info.phone)}</p><p>Registration: ${info.registration_date}</p><p>Contract Status: ${info.contract_status}</p></div>`; document.getElementById("studentInfoArea").innerHTML=html; studentInfoVisible=true; });
}
function toggleStudentBalance(){
    if(studentBalanceVisible){ document.getElementById("studentBalanceArea").innerHTML=""; studentBalanceVisible=false; }
    else fetch(`http://127.0.0.1:5000/student/balance/${currentStudent.student_id}`).then(r=>r.json()).then(bal=>{ let html=`<div class="card"><h3>Balance</h3><p>Meals Left: ${bal.meals_left}</p><p>Days Left: ${bal.days_left}</p></div>`; document.getElementById("studentBalanceArea").innerHTML=html; studentBalanceVisible=true; });
}
function showOrderForm(){
    fetch(`http://127.0.0.1:5000/student/balance/${currentStudent.student_id}`).then(r=>r.json()).then(bal=>{
        let html=`<div class="card"><h3>Place Order</h3><p>Meals left: ${bal.meals_left}</p><select id="mealType"><option value="">Select Meal Type</option><option>breakfast</option><option>lunch</option><option>dinner</option></select><br><input id="orderDetail" placeholder="Order detail (e.g., rice, chicken)" required><br><input id="specialReq" placeholder="Special request (optional)"><br><input id="quantity" type="number" placeholder="Quantity" min="1"><br><div class="button-group"><button onclick="submitOrder()">Order Meal</button><button id="cancelOrderBtn" style="display:none" onclick="cancelCurrentOrder()">Cancel Order</button></div><p id="orderMsg"></p></div>`;
        document.getElementById("studentMainArea").innerHTML=html; window.currentOrderId=null;
    });
}
let currentOrderId=null; window.currentOrderId=null;
async function submitOrder(){
    let mealType=document.getElementById("mealType").value, orderDetail=document.getElementById("orderDetail").value, quantity=document.getElementById("quantity").value, specialReq=document.getElementById("specialReq").value;
    if(!mealType||!orderDetail||!quantity){ showModal("Fill mandatory fields"); return; }
    const r=await fetch("http://127.0.0.1:5000/student/order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({student_id:currentStudent.student_id,contract_id:currentStudent.contract_id,meal_type:mealType,order_detail:orderDetail,special_request:specialReq,quantity:parseInt(quantity)})});
    const d=await r.json();
    if(d.order_id){ showModal("Order submitted"); currentOrderId=d.order_id; window.currentOrderId=d.order_id; document.getElementById("cancelOrderBtn").style.display="inline-block"; startOrderPolling(currentOrderId); }
    else showModal(d.error);
}
function cancelCurrentOrder(){ if(!currentOrderId) return; fetch(`http://127.0.0.1:5000/student/cancel_order/${currentOrderId}`,{method:"POST"}).then(()=>{ showModal("Order cancelled"); document.getElementById("cancelOrderBtn").style.display="none"; stopOrderPolling(); currentOrderId=null; window.currentOrderId=null; }); }
function showBuyContract(){ let html=`<div class="card"><h3>Buy Contract</h3><select id="contractType"><option value="">Choose contract type</option><option>2 weeks</option><option>monthly</option><option>semester</option></select><br><select id="mealPlan"><option value="">Choose meal plan</option><option>full contract</option><option>half contract</option></select><br><select id="paymentMethod"><option value="">Payment method</option><option>cash</option><option>card</option></select><br><div class="button-group"><button onclick="buyContract()">Buy</button><button id="cancelContractBtn" style="display:none" onclick="cancelPendingContract()">Cancel Contract Request</button></div></div>`; document.getElementById("studentMainArea").innerHTML=html; }
async function buyContract(){
    let contractType=document.getElementById("contractType").value, mealPlan=document.getElementById("mealPlan").value, paymentMethod=document.getElementById("paymentMethod").value;
    if(!contractType||!mealPlan||!paymentMethod){ showModal("Please fill all"); return; }
    const r=await fetch("http://127.0.0.1:5000/student/buy_contract",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({student_id:currentStudent.student_id,contract_type:contractType,meal_plan:mealPlan,payment_method:paymentMethod})});
    const d=await r.json();
    if(d.contract_id){ showModal("Request sent to manager."); pendingContractId=d.contract_id; document.getElementById("cancelContractBtn").style.display="inline-block"; document.getElementById("studentMainArea").innerHTML="<p>Request pending. <button onclick='cancelPendingContract()'>Cancel</button></p>"; }
    else showModal(d.error);
}

// ========== MANAGER FUNCTIONS ==========
function showManagerSignup(){ show("managerSignup"); }
function showManagerLogin(){ show("managerLogin"); }
async function managerLogin(){
    let username=document.getElementById("m_username").value, password=document.getElementById("m_password").value;
    if(!username||!password) return showModal("Enter username and password");
    const r=await fetch("http://127.0.0.1:5000/manager/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username,password})});
    const d=await r.json();
    if(d.manager){ currentManager=d.manager; hideNav(); show("manager"); document.getElementById("managerInfoArea").innerHTML=""; loadManagerTables(); if(currentManager.username==="admin"){ document.getElementById("adminPageBtn").classList.remove("hidden"); document.getElementById("contractAuditBtn").classList.remove("hidden"); } else{ document.getElementById("adminPageBtn").classList.add("hidden"); document.getElementById("contractAuditBtn").classList.add("hidden"); } }
    else showModal(d.message);
}
async function createManagerAccount(){
    let full_name=document.getElementById("m_fullname").value, username=document.getElementById("m_su_username").value, password=document.getElementById("m_su_password").value, phone=document.getElementById("m_phone").value, q=document.getElementById("m_q").value, ans=document.getElementById("m_ans").value, adminPass=document.getElementById("admin_pass").value;
    if(!full_name||!username||!password||!phone||!q||!ans||!adminPass) return showModal("Fill all fields");
    const r=await fetch("http://127.0.0.1:5000/manager/create",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({full_name,username,password,phone,security_question:q,security_answer:ans,admin_password:adminPass})});
    const d=await r.json(); showModal(d.message); if(d.message.includes("success")) showManagerLogin();
}
function loadManagerTables(){
    fetch("http://127.0.0.1:5000/manager/contract_requests").then(r=>r.json()).then(requests=>{
        let html="<table><thead><tr><th>Student Name</th><th>ID</th><th>Contract Type</th><th>Meal Plan</th><th>Payment</th><th>Action</th></tr></thead><tbody>";
        if(requests.length===0) html+="<tr><td colspan='6'>No pending requests</td></tr>";
        else requests.forEach(req=>{ html+=`<tr><td>${escapeHtml(req.full_name)}</td><td>${req.student_id}</td><td>${escapeHtml(req.contract_type)}</td><td>${escapeHtml(req.meal_plan)}</td><td>${escapeHtml(req.payment_method)}</td><td><div class="button-group"><button onclick="approveContract(${req.contract_id})">Accept</button><button onclick="declineContractPrompt(${req.contract_id})">Reject</button></div></td></tr>`; });
        html+="</tbody></table>"; document.getElementById("contractRequestsTable").innerHTML=html;
    });
    fetch("http://127.0.0.1:5000/manager/orders").then(r=>r.json()).then(orders=>{
        let html="<table><thead><tr><th>Student</th><th>ID</th><th>Meal</th><th>Food</th><th>Special</th><th>Status</th><th>Action</th></tr></thead><tbody>";
        if(orders.length===0) html+="<tr><td colspan='7'>No orders</td></tr>";
        else orders.forEach(o=>{
            let btns='';
            if(o.status==='pending') btns=`<button onclick="updateOrderStatus(${o.order_id},'served')">Served</button><button onclick="updateOrderStatus(${o.order_id},'cant_serve')">Can't Serve</button>`;
            else btns='-';
            html+=`<tr><td>${escapeHtml(o.full_name)}</td><td>${o.student_id}</td><td>${escapeHtml(o.meal_name)}</td><td>${escapeHtml(o.item_name)} (x${o.quantity})</td><td>${escapeHtml(o.special_request||'-')}</td><td>${o.status}</td><td><div class="button-group">${btns}</div></td></tr>`;
        });
        html+="</tbody></table>"; document.getElementById("ordersTable").innerHTML=html;
    });
}
function toggleManagerInfo(){
    if(managerInfoVisible){ document.getElementById("managerInfoArea").innerHTML=""; managerInfoVisible=false; }
    else fetch(`http://127.0.0.1:5000/manager/info/${currentManager.managerid}`).then(r=>r.json()).then(info=>{ let html=`<div class="card"><h3>Your Info</h3><p>Name: ${escapeHtml(info.full_name)}</p><p>Username: ${escapeHtml(info.username)}</p><p>Phone: ${escapeHtml(info.phone)}</p></div>`; document.getElementById("managerInfoArea").innerHTML=html; managerInfoVisible=true; });
}
function showDailySummary(){
    if(dailySummaryVisible){ document.getElementById("dailySummaryArea").classList.add("hidden"); dailySummaryVisible=false; }
    else fetch("http://127.0.0.1:5000/manager/daily_summary").then(r=>r.json()).then(data=>{ let html=`<div class="card"><h3>Daily Summary for ${data.date}</h3><p>Total Meals Served: ${data.total_meals}</p><p>Total Students Served: ${data.total_students}</p><table><thead><tr><th>Hour</th><th>Meals Served</th></tr></thead><tbody>`; data.hourly.forEach(h=>{ html+=`<tr><td>${h.hour}:00</td><td>${h.meals_served}</td></tr>`; }); html+=`</tbody></table></div>`; document.getElementById("dailySummaryArea").innerHTML=html; document.getElementById("dailySummaryArea").classList.remove("hidden"); dailySummaryVisible=true; });
}
function showContractAudit(){
    if(auditVisible){ document.getElementById("auditArea").classList.add("hidden"); auditVisible=false; }
    else fetch("http://127.0.0.1:5000/manager/contract_audit").then(r=>r.json()).then(audits=>{ let html=`<div class="card"><h3>Contract Audit Log</h3><table><thead><tr><th>Date</th><th>What Changed</th><th>Old Value</th><th>New Value</th><th>Reason</th><th>Who</th></tr></thead><tbody>`; if(audits.length===0) html+="<tr><td colspan='6'>No records</td></tr>"; else audits.forEach(a=>{ html+=`<tr><td>${a.changed_date}</td><td>${escapeHtml(a.changed_field)}</td><td>${escapeHtml(a.oldvalue)}</td><td>${escapeHtml(a.newvalue)}</td><td>${escapeHtml(a.reason||'')}</td><td>${escapeHtml(a.who||'')}</td></tr>`; }); html+=`</tbody></table></div>`; document.getElementById("auditArea").innerHTML=html; document.getElementById("auditArea").classList.remove("hidden"); auditVisible=true; });
}
async function approveContract(contractId){
    const r=await fetch(`http://127.0.0.1:5000/manager/approve_contract/${contractId}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({manager_id:currentManager.managerid})});
    const d=await r.json(); showModal(d.message); loadManagerTables();
}
function declineContractPrompt(contractId){ let reason=prompt("Enter reason for declining:"); if(reason) fetch(`http://127.0.0.1:5000/manager/decline_contract/${contractId}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({reason})}).then(()=>{ showModal("Contract declined"); loadManagerTables(); }); }
async function updateOrderStatus(orderId,status){ const r=await fetch("http://127.0.0.1:5000/manager/update_order_status",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({order_id:orderId,status})}); const d=await r.json(); showModal(d.message); loadManagerTables(); }

// ========== FORGOT PASSWORD (STUDENT) ==========
function forgotUI(){
    let id = document.getElementById("log_id").value;
    if(!id) { showModal("Enter ID first"); return; }
    forgotStudentId = id;
    fetch("http://127.0.0.1:5000/forgot_check_id", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({id: id})
    }).then(r=>r.json()).then(d=>{
        if(d.question){
            document.getElementById("qtext").innerText = d.question;
            document.getElementById("forgotBox").classList.remove("hidden");
            document.getElementById("resetBox").classList.add("hidden");
        } else {
            showModal(d.message);
        }
    });
}
function verifySecurityAnswer(){
    let answer = document.getElementById("ans_input").value;
    if(!answer) { showModal("Please enter your answer"); return; }
    if(!forgotStudentId) { showModal("Please enter your student ID first"); return; }
    fetch("http://127.0.0.1:5000/verify_security", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({id: forgotStudentId, answer: answer})
    }).then(r=>r.json()).then(d=>{
        if(d.valid){
            document.getElementById("resetBox").classList.remove("hidden");
            document.getElementById("ans_input").style.display = "none";
            document.getElementById("qtext").style.display = "none";
            document.querySelector("#forgotBox button").style.display = "none";
        } else {
            showModal(d.message);
        }
    });
}
function checkPasswordMatch(){
    let np = document.getElementById("new_pass").value;
    let rp = document.getElementById("re_pass").value;
    let btn = document.getElementById("setPassBtn");
    if(np && rp && np === rp) btn.disabled = false;
    else btn.disabled = true;
}
function saveNewPass(){
    let np = document.getElementById("new_pass").value;
    let rp = document.getElementById("re_pass").value;
    if(np !== rp){ showModal("Passwords do not match"); return; }
    if(!forgotStudentId){ showModal("Missing student ID"); return; }
    fetch("http://127.0.0.1:5000/reset_password_with_question", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({id: forgotStudentId, new_password: np})
    }).then(r=>r.json()).then(d=>{
        showModal("Password updated!");
        document.getElementById("forgotBox").classList.add("hidden");
        document.getElementById("ans_input").style.display = "";
        document.getElementById("qtext").style.display = "";
        document.querySelector("#forgotBox button").style.display = "";
        document.getElementById("resetBox").classList.add("hidden");
        forgotStudentId = null;
    });
}

// ========== MANAGER FORGOT PASSWORD ==========
function managerForgotUI(){
    let username = document.getElementById("m_username").value;
    if(!username){ showModal("Enter username first"); return; }
    forgotManagerUsername = username;
    fetch("http://127.0.0.1:5000/manager/forgot_check_id", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({id: username})
    }).then(r=>r.json()).then(d=>{
        if(d.question){
            document.getElementById("m_qtext").innerText = d.question;
            document.getElementById("managerForgotBox").classList.remove("hidden");
            document.getElementById("m_resetBox").classList.add("hidden");
        } else showModal(d.message);
    });
}
function verifyManagerSecurity(){
    let answer = document.getElementById("m_ans_input").value;
    if(!answer){ showModal("Please enter your answer"); return; }
    if(!forgotManagerUsername){ showModal("Please enter your username first"); return; }
    fetch("http://127.0.0.1:5000/manager/verify_security", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username: forgotManagerUsername, answer: answer})
    }).then(r=>r.json()).then(d=>{
        if(d.valid){
            document.getElementById("m_resetBox").classList.remove("hidden");
            document.getElementById("m_ans_input").style.display = "none";
            document.getElementById("m_qtext").style.display = "none";
            document.querySelector("#managerForgotBox button").style.display = "none";
        } else showModal(d.message);
    });
}
function checkManagerPasswordMatch(){
    let np = document.getElementById("m_new_pass").value;
    let rp = document.getElementById("m_re_pass").value;
    let btn = document.getElementById("m_setPassBtn");
    if(np && rp && np === rp) btn.disabled = false;
    else btn.disabled = true;
}
function saveManagerNewPass(){
    let np = document.getElementById("m_new_pass").value;
    let rp = document.getElementById("m_re_pass").value;
    if(np !== rp){ showModal("Passwords do not match"); return; }
    if(!forgotManagerUsername){ showModal("Missing manager username"); return; }
    fetch("http://127.0.0.1:5000/manager/reset_password", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username: forgotManagerUsername, new_password: np})
    }).then(r=>r.json()).then(d=>{
        showModal("Password updated!");
        document.getElementById("managerForgotBox").classList.add("hidden");
        document.getElementById("m_ans_input").style.display = "";
        document.getElementById("m_qtext").style.display = "";
        document.querySelector("#managerForgotBox button").style.display = "";
        document.getElementById("m_resetBox").classList.add("hidden");
        forgotManagerUsername = null;
    });
}

// ========== ADMIN PANEL ==========
function showAdminLogin(){ let html=`<div class="card"><h3>Administrator Authentication</h3><input id="adminUser" placeholder="Administrator Username" value="admin"><br><input id="adminPass" type="password" placeholder="Administrator Password"><br><button onclick="verifyAdminLogin()">Enter</button></div>`; document.getElementById("adminContent").innerHTML=html; show("adminPage"); }
async function verifyAdminLogin(){ let user=document.getElementById("adminUser").value, pass=document.getElementById("adminPass").value; if(!user||!pass) showModal("Both fields required"); const r=await fetch("http://127.0.0.1:5000/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:user,password:pass,manager_id:currentManager.managerid})}); const d=await r.json(); if(d.success) loadAdminDashboard(); else showModal("Username or password is wrong"); }
function loadAdminDashboard(){
    fetch("http://127.0.0.1:5000/admin/recent_logins").then(r=>r.json()).then(logs=>{
        let logHtml="<h3>5 Recent Login Attempts</h3><table><thead><tr><th>Time</th><th>Manager</th><th>Success</th></tr></thead><tbody>";
        logs.forEach(l=>{ logHtml+=`<tr><td>${l.login_time}</td><td>${escapeHtml(l.full_name)} (${escapeHtml(l.username)})</td><td>${l.success?"Yes":"No"}</td></tr>`; }); logHtml+="</tbody></table>";
        fetch("http://127.0.0.1:5000/admin/all_managers").then(r=>r.json()).then(managers=>{
            let mgrHtml="<h3>All Managers</h3><table><thead><tr><th>ID</th><th>Name</th><th>Username</th><th>Phone</th><th>Password</th><th>Action</th></tr></thead><tbody>";
            managers.forEach(m=>{
                if(m.username!==currentManager.username) mgrHtml+=`<tr id="manager-row-${m.managerid}"><td class="edit-id">${m.managerid}</td><td class="edit-name">${escapeHtml(m.full_name)}</td><td class="edit-username">${escapeHtml(m.username)}</td><td class="edit-phone">${escapeHtml(m.phone)}</td><td class="edit-password">${escapeHtml(m.password)}</td><td><div class="button-group"><button onclick="enableManagerEdit(${m.managerid})">Update</button><button onclick="fireManager(${m.managerid})">Delete</button></div></td></tr>`;
                else mgrHtml+=`<tr><td>${m.managerid}</td><td colspan="5">${escapeHtml(m.full_name)} (You - cannot delete yourself)</td></tr>`;
            });
            mgrHtml+="</tbody></table>";
            fetch("http://127.0.0.1:5000/admin/student_contracts").then(r=>r.json()).then(contracts=>{
                let contractHtml="<h3>Student Contracts</h3><table><thead><tr><th>Student ID</th><th>Name</th><th>Phone</th><th>Contract Type</th><th>Meal Plan</th><th>Payment</th><th>Reason</th><th>Actions</th></tr></thead><tbody>";
                contracts.forEach(c=>{
                    let contractTypeOptions = `<option value="2 weeks" ${c.contract_type === '2 weeks' ? 'selected' : ''}>2 weeks</option><option value="monthly" ${c.contract_type === 'monthly' ? 'selected' : ''}>monthly</option><option value="semester" ${c.contract_type === 'semester' ? 'selected' : ''}>semester</option>`;
                    let mealPlanOptions = `<option value="full contract" ${c.meal_plan === 'full contract' ? 'selected' : ''}>full contract</option><option value="half contract" ${c.meal_plan === 'half contract' ? 'selected' : ''}>half contract</option>`;
                    let paymentOptions = `<option value="cash" ${c.payment_method === 'cash' ? 'selected' : ''}>cash</option><option value="card" ${c.payment_method === 'card' ? 'selected' : ''}>card</option>`;
                    contractHtml+=`<tr><td>${c.student_id}</td><td>${escapeHtml(c.full_name)}</td><td>${escapeHtml(c.phone)}</td><td><select id="ct_${c.contract_id}">${contractTypeOptions}</select></td><td><select id="mp_${c.contract_id}">${mealPlanOptions}</select></td><td><select id="pm_${c.contract_id}">${paymentOptions}</select></td><td><input type="text" id="reason_${c.contract_id}" placeholder="Reason for update"></td><td><div class="button-group"><button onclick="updateContract(${c.contract_id})">Update Contract</button><button onclick="openEditStudentModal(${c.student_id}, '${escapeHtml(c.full_name)}', '${escapeHtml(c.phone)}')">Edit Student</button></div></td></tr>`;
                });
                contractHtml+="</tbody></table>";
                document.getElementById("adminContent").innerHTML = logHtml + mgrHtml + contractHtml;
            });
        });
    });
}
function openEditStudentModal(studentId, name, phone) {
    document.getElementById('edit_student_id').value = studentId;
    document.getElementById('edit_student_name').value = name;
    document.getElementById('edit_student_phone').value = phone;
    document.getElementById('editStudentModal').style.display = 'flex';
}
function closeEditStudentModal() { document.getElementById('editStudentModal').style.display = 'none'; }
async function saveStudentEdit() {
    let studentId = document.getElementById('edit_student_id').value;
    let name = document.getElementById('edit_student_name').value;
    let phone = document.getElementById('edit_student_phone').value;
    if (!name || !phone) { showModal("Name and phone are required"); return; }
    const r = await fetch(`http://127.0.0.1:5000/admin/update_student/${studentId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ full_name: name, phone: phone, manager_id: currentManager.managerid }) });
    const d = await r.json(); showModal(d.message); closeEditStudentModal(); loadAdminDashboard();
}
function enableManagerEdit(managerId){
    let row=document.getElementById(`manager-row-${managerId}`);
    let nameCell=row.querySelector('.edit-name'), userCell=row.querySelector('.edit-username'), phoneCell=row.querySelector('.edit-phone'), passCell=row.querySelector('.edit-password');
    let oldName=nameCell.innerText, oldUser=userCell.innerText, oldPhone=phoneCell.innerText, oldPass=passCell.innerText;
    nameCell.innerHTML=`<input class="inline-input" id="edit_name_${managerId}" value="${escapeHtml(oldName)}">`;
    userCell.innerHTML=`<input class="inline-input" id="edit_username_${managerId}" value="${escapeHtml(oldUser)}">`;
    phoneCell.innerHTML=`<input class="inline-input" id="edit_phone_${managerId}" value="${escapeHtml(oldPhone)}">`;
    passCell.innerHTML=`<input class="inline-input" id="edit_pass_${managerId}" value="${escapeHtml(oldPass)}">`;
    let actionCell=row.querySelector('td:last-child');
    actionCell.innerHTML=`<div class="button-group"><button onclick="saveManagerEdit(${managerId})">Save</button><button onclick="cancelManagerEdit(${managerId},'${escapeHtml(oldName)}','${escapeHtml(oldUser)}','${escapeHtml(oldPhone)}','${escapeHtml(oldPass)}')">Cancel</button></div>`;
}
function cancelManagerEdit(managerId,name,user,phone,pass){
    let row=document.getElementById(`manager-row-${managerId}`);
    row.querySelector('.edit-name').innerHTML=name; row.querySelector('.edit-username').innerHTML=user; row.querySelector('.edit-phone').innerHTML=phone; row.querySelector('.edit-password').innerHTML=pass;
    let actionCell=row.querySelector('td:last-child');
    actionCell.innerHTML=`<div class="button-group"><button onclick="enableManagerEdit(${managerId})">Update</button><button onclick="fireManager(${managerId})">Delete</button></div>`;
}
async function saveManagerEdit(managerId){
    let newName=document.getElementById(`edit_name_${managerId}`).value, newUser=document.getElementById(`edit_username_${managerId}`).value, newPhone=document.getElementById(`edit_phone_${managerId}`).value, newPass=document.getElementById(`edit_pass_${managerId}`).value;
    const r=await fetch(`http://127.0.0.1:5000/admin/update_manager/${managerId}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({full_name:newName,username:newUser,phone:newPhone,password:newPass})});
    const d=await r.json(); showModal(d.message); loadAdminDashboard();
}
function fireManager(mid){ if(confirm("Fire this manager?")) fetch(`http://127.0.0.1:5000/admin/fire_manager/${mid}`,{method:"DELETE"}).then(()=>{ showModal("Manager fired"); loadAdminDashboard(); }); }
async function updateContract(contractId){
    let contractType=document.getElementById(`ct_${contractId}`).value, mealPlan=document.getElementById(`mp_${contractId}`).value, paymentMethod=document.getElementById(`pm_${contractId}`).value, reason=document.getElementById(`reason_${contractId}`).value;
    const r=await fetch(`http://127.0.0.1:5000/admin/update_contract/${contractId}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({contract_type:contractType,meal_plan:mealPlan,payment_method:paymentMethod,reason:reason,manager_id:currentManager.managerid})});
    const d=await r.json(); showModal(d.message); loadAdminDashboard();
}
function backToManagerDashboard(){ show("manager"); loadManagerTables(); }
function logout(){ stopOrderPolling(); location.reload(); }