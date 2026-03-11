// ===== SUPABASE SETUP =====
const supabaseUrl = 'https://hltanvgprlgmyqfwybzb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsdGFudmdwcmxnbXlxZnd5YnpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNTY2MTgsImV4cCI6MjA4ODgzMjYxOH0.7pYE9FXmU5AOpBCdZRuGCmWPqIHPxd25YWoqt93MpnM';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// ===== DOM REFERENCES =====
const ordersBody = document.getElementById('ordersBody');
const emptyState = document.getElementById('emptyState');
const statTotal = document.getElementById('statTotal');
const statPending = document.getElementById('statPending');
const statCompleted = document.getElementById('statCompleted');
const statCancelled = document.getElementById('statCancelled');
const filterBtns = document.querySelectorAll('.filter-btn');
const btnClearAll = document.getElementById('btnClearAll');
const toastContainer = document.getElementById('toastContainer');

let currentFilter = 'all';
let serverOrders = [];

// ===== LOAD ORDERS =====
async function getOrders() {
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
  return data || [];
}

// ===== RENDER =====
async function render() {
  serverOrders = await getOrders();
  updateStats(serverOrders);
  renderOrders(serverOrders);
}

function updateStats(orders) {
  statTotal.textContent = orders.length;
  statPending.textContent = orders.filter(o => o.status === 'pending').length;
  statCompleted.textContent = orders.filter(o => o.status === 'completed').length;
  statCancelled.textContent = orders.filter(o => o.status === 'cancelled').length;
}

function renderOrders(orders) {
  const filtered = currentFilter === 'all'
    ? orders
    : orders.filter(o => o.status === currentFilter);

  if (filtered.length === 0) {
    ordersBody.innerHTML = '';
    emptyState.style.display = 'block';
    document.querySelector('.orders-table').style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';
  document.querySelector('.orders-table').style.display = 'table';

  ordersBody.innerHTML = filtered.map(order => {
    const date = new Date(order.created_at);
    const dateStr = date.toLocaleDateString('ar-DZ', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const gameIcon = order.game === 'freefire' ? '🔥' : '🎮';
    const statusLabels = {
      pending: '⏳ قيد الانتظار',
      completed: '✅ مكتملة',
      cancelled: '❌ ملغاة',
    };

    let actions = '';
    if (order.status === 'pending') {
      actions = `
        <button class="action-btn complete" onclick="updateStatus('${order.id}', 'completed')">✅ إتمام</button>
        <button class="action-btn cancel" onclick="updateStatus('${order.id}', 'cancelled')">❌ إلغاء</button>
      `;
    } else {
      actions = `
        <button class="action-btn delete" onclick="deleteOrder('${order.id}')">🗑️ حذف</button>
      `;
    }

    const proofBtn = '<span style="color:var(--text-muted);font-size:0.8rem;">في الديسكورد</span>';

    // Map new fields
    let serviceIcon = gameIcon;
    if (order.service_type === 'money') serviceIcon = '💸';
    if (order.service_type === 'dollar') serviceIcon = '💵';
    if (order.service_type === 'promo') serviceIcon = '📢';
    if (order.service_type === 'website') serviceIcon = '🌐';
    if (order.service_type === 'igfollowers') serviceIcon = '📸';

    let detailsStr = `<div><strong>${order.game === 'tiktok' ? 'رقم الهاتف' : 'المعرّف/الرقم'}:</strong> <span class="badge copy-target" onclick="copyText('${order.player_id}')">${order.player_id || '—'}</span></div>`;
    let packageStr = order.package_label || '—';
    let serviceLabel = order.service_label || order.game || order.service_type || '—';
    let priceStr = order.price_num + ' دج';

    return `
      <tr>
        <td><strong>#${order.id}</strong></td>
        <td>${serviceIcon} ${serviceLabel}</td>
        <td style="direction:ltr; text-align:right;">${detailsStr}</td>
        <td style="direction:ltr; text-align:right;">${packageStr}</td>
        <td>${priceStr}</td>
        <td>${proofBtn}</td>
        <td><span class="status-badge ${order.status}">${statusLabels[order.status]}</span></td>
        <td style="font-size:0.8rem;color:var(--text-muted);">${dateStr}</td>
        <td>${actions}</td>
      </tr>
    `;
  }).join('');
}

// ===== ACTIONS =====
async function updateStatus(orderId, newStatus) {
  const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);

  if (error) {
    showToast('خطأ: ' + error.message, 'error');
    return;
  }

  showToast(
    newStatus === 'completed' ? 'تم إتمام الطلب بنجاح. سيحصل المُحيل على 2% لو وجد!' : 'تم إلغاء الطلب',
    newStatus === 'completed' ? 'success' : 'error'
  );
  
  render();
}

async function deleteOrder(orderId) {
  const { error } = await supabase.from('orders').delete().eq('id', orderId);
  if (error) {
    showToast('خطأ في الحذف', 'error');
    return;
  }
  showToast('تم حذف الطلب', 'error');
  render();
}

// ===== FILTERS =====
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    render();
  });
});

// ===== CLEAR ALL =====
btnClearAll.addEventListener('click', async () => {
  if (confirm('هل أنت متأكد من حذف جميع الطلبات؟ (هذا سيحذفها من قاعدة البيانات)')) {
    const { error } = await supabase.from('orders').delete().neq('id', '0'); // Hack to delete all
    if (error) console.error(error);
    render();
    showToast('تم حذف جميع الطلبات', 'error');
  }
});

// ===== VIEW PROOF =====
function viewProof(orderId) {
  showToast('يمكنك التحقق من ملف الإثبات في رسالة Discord الخاصة بهذا الطلب', 'info');
}

// ===== TOAST =====
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ===== INIT =====
render();
