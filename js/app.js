// ===== SUPABASE SETUP =====
const supabaseUrl = 'https://hltanvgprlgmyqfwybzb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsdGFudmdwcmxnbXlxZnd5YnpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNTY2MTgsImV4cCI6MjA4ODgzMjYxOH0.7pYE9FXmU5AOpBCdZRuGCmWPqIHPxd25YWoqt93MpnM';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let currentUser = null;
let userProfile = null;

// ===== URL ANALYTICS / REFERRALS =====
const urlParams = new URLSearchParams(window.location.search);
const referralCode = urlParams.get('ref');
if (referralCode) {
  localStorage.setItem('dzdiniro_ref', referralCode);
}
const savedReferral = localStorage.getItem('dzdiniro_ref') || null;

// ===== PACKAGES DATA =====
const PACKAGES = {
  freefire: [
    { id: 'ff1', amount: 100, label: '100 Diamonds', price: '28 ألف', priceNum: 28, icon: '💎' },
    { id: 'ff2', amount: 210, label: '210 Diamonds', price: '54 ألف', priceNum: 54, icon: '💎' },
    { id: 'ff3', amount: 530, label: '530 Diamonds', price: '140 ألف', priceNum: 140, icon: '💎' },
    { id: 'ff4', amount: 1060, label: '1060 Diamonds', price: '280 ألف', priceNum: 280, icon: '💎', popular: true },
    { id: 'ff5', amount: 2180, label: '2180 Diamonds', price: '560 ألف', priceNum: 560, icon: '💎' },
    { id: 'ff6', amount: 5600, label: '5600 Diamonds', price: '1400 ألف', priceNum: 1400, icon: '💎' },
  ],
  pubg: [
    { id: 'pb1', amount: '60', label: '60 UC', price: '28 ألف', priceNum: 28, icon: '<img src="images/dd.jpg" style="width:24px; height:24px; vertical-align:middle;">' },
    { id: 'pb2', amount: '325', label: '325 UC', price: '140 ألف', priceNum: 140, icon: '<img src="images/dd.jpg" style="width:24px; height:24px; vertical-align:middle;">' },
    { id: 'pb3', amount: '660', label: '660 UC', price: '270 ألف', priceNum: 270, icon: '<img src="images/dd.jpg" style="width:24px; height:24px; vertical-align:middle;">', popular: true },
    { id: 'pb4', amount: '1800', label: '1800 UC', price: '650 ألف', priceNum: 650, icon: '<img src="images/dd.jpg" style="width:24px; height:24px; vertical-align:middle;">' }
  ],
  promo: [
    { id: 'pr1', amount: 'باقة البداية', label: 'باقة البداية (7 أيام)', price: '2,800 دج', priceNum: 2800, icon: '🥉' },
    { id: 'pr2', amount: 'الباقة المتوسطة', label: 'الباقة المتوسطة (7 أيام)', price: '5,000 دج', priceNum: 5000, icon: '🥈', popular: true },
    { id: 'pr3', amount: 'باقة الانطلاق', label: 'باقة الانطلاق (7 أيام)', price: '11,900 دج', priceNum: 11900, icon: '🥇' },
  ],
  tiktok: [
    { id: 'tk1', amount: '30', label: '30 عملة TikTok', price: '105 ألف', priceNum: 105, icon: '<img src="images/tiktok_coin.png" style="width:24px; height:24px; vertical-align:middle;">' },
    { id: 'tk2', amount: '700', label: '700 عملة TikTok', price: '210 ألف', priceNum: 210, icon: '<img src="images/tiktok_coin.png" style="width:24px; height:24px; vertical-align:middle;">', popular: true },
    { id: 'tk3', amount: '1000', label: '1000 عملة TikTok', price: '300 ألف', priceNum: 300, icon: '<img src="images/tiktok_coin.png" style="width:24px; height:24px; vertical-align:middle;">' },
    { id: 'tk4', amount: '3500', label: '3500 عملة TikTok', price: 'مليون و 50 ألف', priceNum: 1050, icon: '<img src="images/tiktok_coin.png" style="width:24px; height:24px; vertical-align:middle;">' },
  ],
  igfollowers: [
    { id: 'igf1', amount: '1000', label: '1000 متابع', price: '60 ألف', priceNum: 60, icon: '👥' },
    { id: 'igf2', amount: '2000', label: '2000 متابع', price: '110 ألف', priceNum: 110, icon: '👥', popular: true },
    { id: 'igf3', amount: '5000', label: '5000 متابع', price: '250 ألف', priceNum: 250, icon: '👥' },
  ]
};

const GAME_LABELS = {
  freefire: 'فري فاير - Diamonds',
  pubg: 'ببجي موبايل - UC',
  tiktok: 'TikTok - عملات',
  facebook: 'ترويج - Facebook',
  instagram: 'ترويج - Instagram',
  igfollowers: 'Instagram - زيادة متابعين'
};

// ===== DOLLAR PRICING =====
const DOLLAR_BUY_TIERS = [
  { min: 500, rate: 255 },
  { min: 100, rate: 260 },
  { min: 1, rate: 270 },
];
const DOLLAR_SELL_RATE = 240;

function getDollarBuyRate(amount) {
  for (const tier of DOLLAR_BUY_TIERS) {
    if (amount >= tier.min) return tier.rate;
  }
  return 270;
}

// ===== MONEY TRANSFER FEE CALCULATION =====
const MONEY_FEE_TIERS = [
  { min: 1000, max: 3000, fee: 50 },
  { min: 3000, max: 10000, fee: 100 },
  { min: 10000, max: 20000, fee: 150 },
  { min: 20000, max: 30000, fee: 200 },
  { min: 30000, max: 50000, fee: 250 },
  { min: 50000, max: Infinity, fee: 300 },
];

function getMoneyFee(amount) {
  for (const tier of MONEY_FEE_TIERS) {
    if (amount >= tier.min && amount < tier.max) return tier.fee;
  }
  if (amount < 1000) return 50; // minimum fee
  return 300; // cap
}

// ===== STATE =====
let state = {
  selectedService: 'games', // 'games', 'money', 'dollar'
  selectedGame: null,
  playerId: '',
  selectedPackage: null,
  // Money transfer
  moneyAction: 'send', // 'send' or 'withdraw'
  moneySendAccount: '',
  moneySendAmount: '',
  moneyWithdrawAmount: '',
  moneyFee: 0,
  moneyTotal: 0,
  // Dollar
  dollarAction: 'buy', // 'buy' or 'sell'
  dollarAmount: '',
  dollarDZD: 0,
  dollarRate: 0,
  // Promotion
  promoPlatform: 'facebook',
  promoLink: '',
  promoPhone: '',
  promoTargeting: '',
  // Website
  websiteFullName: '',
  websitePhone: '',
  websiteNotes: '',
  // Instagram Followers
  igFollowersUsername: '',
  // Payment
  paymentMethod: 'baridimob',
  paymentProof: null,
};

// ===== DOM REFERENCES =====
const serviceTabs = document.querySelectorAll('.service-section .game-tab[data-service]');
const gameFlowContainer = document.getElementById('gameFlowContainer');
const moneyFlowContainer = document.getElementById('moneyFlowContainer');
const dollarFlowContainer = document.getElementById('dollarFlowContainer');
const promoFlowContainer = document.getElementById('promoFlowContainer');
const websiteFlowContainer = document.getElementById('websiteFlowContainer');
const igFollowersFlowContainer = document.getElementById('igFollowersFlowContainer');

const gameTabs = document.querySelectorAll('#gameSelection .game-tab');
const playerIdInput = document.getElementById('playerIdInput');
const playerIdTitle = document.getElementById('playerIdTitle');
const playerIdIcon = document.getElementById('playerIdIcon');
const tiktokInstructions = document.getElementById('tiktokInstructions');
const packagesGrid = document.getElementById('packagesGrid');

const btnSubmit = document.getElementById('btnSubmit');
const summaryGame = document.getElementById('summaryGame');
const summaryPlayerId = document.getElementById('summaryPlayerId');
const summaryPackage = document.getElementById('summaryPackage');
const summaryPrice = document.getElementById('summaryPrice');
const successModal = document.getElementById('successModal');
const modalOrderId = document.getElementById('modalOrderId');
const btnCloseModal = document.getElementById('btnCloseModal');
const toastContainer = document.getElementById('toastContainer');

const uploadArea = document.getElementById('uploadArea');
const proofInput = document.getElementById('proofInput');
const uploadPlaceholder = document.getElementById('uploadPlaceholder');
const uploadPreview = document.getElementById('uploadPreview');
const proofImage = document.getElementById('proofImage');
const btnRemoveProof = document.getElementById('btnRemoveProof');

// Auth & Dashboard DOM
const btnOpenAuth = document.getElementById('btnOpenAuth');
const authModal = document.getElementById('authModal');
const btnCloseAuth = document.getElementById('btnCloseAuth');
const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const btnRealLogin = document.getElementById('btnRealLogin');

const regName = document.getElementById('regName');
const regPhone = document.getElementById('regPhone');
const regEmail = document.getElementById('regEmail');
const regPassword = document.getElementById('regPassword');
const btnRealRegister = document.getElementById('btnRealRegister');

const dashboardModal = document.getElementById('dashboardModal');
const btnCloseDashboard = document.getElementById('btnCloseDashboard');
const btnLogout = document.getElementById('btnLogout');
const dashName = document.getElementById('dashName');
const dashEmail = document.getElementById('dashEmail');
const dashBalance = document.getElementById('dashBalance');
const dashRefLink = document.getElementById('dashRefLink');
const btnCopyDashRef = document.getElementById('btnCopyDashRef');
const dashOrdersList = document.getElementById('dashOrdersList');

const paymentCards = document.querySelectorAll('.payment-method-card');
const baridiMobInfo = document.getElementById('baridiMobInfo');
const cashInfo = document.getElementById('cashInfo');
const proofSection = document.getElementById('proofSection');

// Dollar-specific DOM
const dollarActionTabs = document.querySelectorAll('[data-dollar-action]');
const dollarBuySection = document.getElementById('dollarBuySection');
const dollarSellSection = document.getElementById('dollarSellSection');
const dollarBuyAmountInput = document.getElementById('dollarBuyAmountInput');
const dollarSellAmountInput = document.getElementById('dollarSellAmountInput');
const buyCalcResult = document.getElementById('buyCalcResult');
const sellCalcResult = document.getElementById('sellCalcResult');
const buyCalcQty = document.getElementById('buyCalcQty');
const buyCalcRate = document.getElementById('buyCalcRate');
const buyCalcTotal = document.getElementById('buyCalcTotal');
const sellCalcQty = document.getElementById('sellCalcQty');
const sellCalcTotal = document.getElementById('sellCalcTotal');
const btnCopyAddress = document.getElementById('btnCopyAddress');
const bep20Address = document.getElementById('bep20Address');

// Money-specific DOM
const moneyActionTabs = document.querySelectorAll('[data-money-action]');
const moneySendSection = document.getElementById('moneySendSection');
const moneyWithdrawSection = document.getElementById('moneyWithdrawSection');
const moneySendAccountInput = document.getElementById('moneySendAccountInput');
const moneySendAmountInput = document.getElementById('moneySendAmountInput');
const moneyWithdrawAmountInput = document.getElementById('moneyWithdrawAmountInput');
const sendCalcResult = document.getElementById('sendCalcResult');
const withdrawCalcResult = document.getElementById('withdrawCalcResult');
const sendCalcAmount = document.getElementById('sendCalcAmount');
const sendCalcFee = document.getElementById('sendCalcFee');
const sendCalcTotal = document.getElementById('sendCalcTotal');
const withdrawCalcAmount = document.getElementById('withdrawCalcAmount');
const withdrawCalcFee = document.getElementById('withdrawCalcFee');
const withdrawCalcTotal = document.getElementById('withdrawCalcTotal');

// Promo-specific DOM
const promoPlatformTabs = document.querySelectorAll('[data-promo-platform]');
const promoLinkInput = document.getElementById('promoLinkInput');
const promoPhoneInput = document.getElementById('promoPhoneInput');
const promoTargetingInput = document.getElementById('promoTargetingInput');
const packagesStepNum = document.getElementById('packagesStepNum');
const packagesTitle = document.getElementById('packagesTitle');

// ===== SERVICE SELECTION =====
serviceTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const service = tab.dataset.service;
    if (state.selectedService === service) return;

    state.selectedService = service;

    // Reset all secondary states
    state.selectedGame = null;
    state.playerId = '';
    state.selectedPackage = null;
    state.moneyAction = 'send';
    state.moneySendAccount = '';
    state.moneySendAmount = '';
    state.moneyWithdrawAmount = '';
    state.moneyFee = 0;
    state.moneyTotal = 0;
    state.dollarAction = 'buy';
    state.dollarAmount = '';
    state.dollarDZD = 0;
    state.dollarRate = 0;
    state.promoPlatform = 'facebook';
    state.promoLink = '';
    state.promoPhone = '';
    state.promoTargeting = '';

    // Clear inputs
    if (playerIdInput) {
      playerIdInput.value = '';
      if (playerIdTitle) playerIdTitle.textContent = 'أدخل معرّف اللاعب';
      if (playerIdIcon) playerIdIcon.textContent = '👤';
      if (playerIdInput) playerIdInput.placeholder = 'أدخل معرّف اللاعب (Player ID)';
      if (tiktokInstructions) tiktokInstructions.style.display = 'none';
    }
    if (dollarBuyAmountInput) dollarBuyAmountInput.value = '';
    if (dollarSellAmountInput) dollarSellAmountInput.value = '';
    if (moneySendAccountInput) moneySendAccountInput.value = '';
    if (moneySendAmountInput) moneySendAmountInput.value = '';
    if (moneyWithdrawAmountInput) moneyWithdrawAmountInput.value = '';
    if (promoLinkInput) promoLinkInput.value = '';
    if (promoPhoneInput) promoPhoneInput.value = '';
    if (promoTargetingInput) promoTargetingInput.value = '';
    const wfn = document.getElementById('websiteFullNameInput'); if(wfn) wfn.value='';
    const wph = document.getElementById('websitePhoneInput'); if(wph) wph.value='';
    const wno = document.getElementById('websiteNotesInput'); if(wno) wno.value='';
    buyCalcResult.style.display = 'none';
    sellCalcResult.style.display = 'none';
    sendCalcResult.style.display = 'none';
    withdrawCalcResult.style.display = 'none';
    gameTabs.forEach(t => t.classList.remove('active'));
    renderPackages();

    // Update tabs UI
    serviceTabs.forEach(t => {
      t.classList.remove('active');
      const badge = t.querySelector('.check-badge');
      if (badge) badge.style.opacity = '0';
    });
    tab.classList.add('active');
    const activeBadge = tab.querySelector('.check-badge');
    if (activeBadge) activeBadge.style.opacity = '1';

    // Show/hide containers
    gameFlowContainer.style.display = 'none';
    moneyFlowContainer.style.display = 'none';
    dollarFlowContainer.style.display = 'none';
    promoFlowContainer.style.display = 'none';
    websiteFlowContainer.style.display = 'none';
    igFollowersFlowContainer.style.display = 'none';
    document.getElementById('packages').style.display = 'none';

    if (service === 'games') {
      gameFlowContainer.style.display = 'block';
      document.getElementById('packages').style.display = 'block';
      document.getElementById('paymentSection').style.display = 'block';
      proofSection.style.display = 'block';

      summaryGame.previousElementSibling.textContent = 'اللعبة';
      summaryPlayerId.previousElementSibling.textContent = 'معرّف اللعبة';
      summaryPackage.parentElement.style.display = 'flex';
    } else if (service === 'money') {
      moneyFlowContainer.style.display = 'block';
      document.getElementById('paymentSection').style.display = 'block';
      proofSection.style.display = 'block';

      // Reset money tabs
      moneyActionTabs.forEach(t => t.classList.remove('active'));
      document.getElementById('tab-money-send').classList.add('active');
      moneySendSection.style.display = 'block';
      moneyWithdrawSection.style.display = 'none';

      summaryGame.previousElementSibling.textContent = 'الخدمة';
      summaryPlayerId.previousElementSibling.textContent = 'النوع';
      summaryPackage.parentElement.style.display = 'none';
    } else if (service === 'dollar') {
      dollarFlowContainer.style.display = 'block';
      document.getElementById('paymentSection').style.display = 'block';
      proofSection.style.display = 'block';

      // Reset dollar tabs
      dollarActionTabs.forEach(t => t.classList.remove('active'));
      document.getElementById('tab-dollar-buy').classList.add('active');
      dollarBuySection.style.display = 'block';
      dollarSellSection.style.display = 'none';

      summaryGame.previousElementSibling.textContent = 'الخدمة';
      summaryPlayerId.previousElementSibling.textContent = 'النوع';
      summaryPackage.parentElement.style.display = 'none';
    } else if (service === 'promo') {
      promoFlowContainer.style.display = 'block';
      document.getElementById('packages').style.display = 'block';
      document.getElementById('paymentSection').style.display = 'block';
      proofSection.style.display = 'block';

      // Reset promo tabs
      promoPlatformTabs.forEach(t => t.classList.remove('active'));
      document.getElementById('tab-promo-fb').classList.add('active');
      state.selectedGame = 'facebook'; 

      packagesStepNum.textContent = '4';
      packagesTitle.textContent = 'اختر الباقة الإعلانية';

      summaryGame.previousElementSibling.textContent = 'المنصة';
      summaryPlayerId.previousElementSibling.textContent = 'الرابط';
      summaryPackage.parentElement.style.display = 'flex';
      
      renderPackages('promo');
    } else if (service === 'website') {
      websiteFlowContainer.style.display = 'block';
      document.getElementById('paymentSection').style.display = 'block';
      // Show proof section based on current payment method
      if (state.paymentMethod === 'baridimob') {
        proofSection.style.display = 'block';
      } else {
        proofSection.style.display = 'none';
      }

      summaryGame.previousElementSibling.textContent = 'الخدمة';
      summaryPlayerId.previousElementSibling.textContent = 'الاسم الكامل';
      summaryPackage.parentElement.style.display = 'none';
      summaryPrice.textContent = '400,000 دج';
    } else if (service === 'igfollowers') {
      igFollowersFlowContainer.style.display = 'block';
      document.getElementById('packages').style.display = 'block';
      document.getElementById('paymentSection').style.display = 'block';
      proofSection.style.display = 'block';

      state.selectedGame = 'igfollowers';

      packagesStepNum.textContent = '3';
      packagesTitle.textContent = 'اختر باقة المتابعين';

      summaryGame.previousElementSibling.textContent = 'الخدمة';
      summaryPlayerId.previousElementSibling.textContent = 'حساب Instagram';
      summaryPackage.parentElement.style.display = 'flex';

      renderPackages('igfollowers');
    }

    updateSummary();
  });
});

// ===== MONEY SEND/WITHDRAW TOGGLE =====
moneyActionTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const action = tab.dataset.moneyAction;
    if (state.moneyAction === action) return;

    state.moneyAction = action;
    state.moneySendAccount = '';
    state.moneySendAmount = '';
    state.moneyWithdrawAmount = '';
    state.moneyFee = 0;
    state.moneyTotal = 0;

    moneySendAccountInput.value = '';
    moneySendAmountInput.value = '';
    moneyWithdrawAmountInput.value = '';
    sendCalcResult.style.display = 'none';
    withdrawCalcResult.style.display = 'none';

    moneyActionTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    if (action === 'send') {
      moneySendSection.style.display = 'block';
      moneyWithdrawSection.style.display = 'none';
    } else {
      moneySendSection.style.display = 'none';
      moneyWithdrawSection.style.display = 'block';
    }

    updateSummary();
  });
});

// ===== MONEY SEND INPUTS =====
moneySendAccountInput.addEventListener('input', (e) => {
  state.moneySendAccount = e.target.value.trim();
  updateSummary();
});

moneySendAmountInput.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  if (!val || val <= 0) {
    state.moneySendAmount = '';
    state.moneyFee = 0;
    state.moneyTotal = 0;
    sendCalcResult.style.display = 'none';
    updateSummary();
    return;
  }

  state.moneySendAmount = val;
  state.moneyFee = getMoneyFee(val);
  state.moneyTotal = val + state.moneyFee;

  sendCalcAmount.textContent = val.toLocaleString() + ' دج';
  sendCalcFee.textContent = '+ ' + state.moneyFee.toLocaleString() + ' دج';
  sendCalcTotal.textContent = state.moneyTotal.toLocaleString() + ' دج';
  sendCalcResult.style.display = 'block';

  updateSummary();
});

// ===== MONEY WITHDRAW INPUT =====
moneyWithdrawAmountInput.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  if (!val || val <= 0) {
    state.moneyWithdrawAmount = '';
    state.moneyFee = 0;
    state.moneyTotal = 0;
    withdrawCalcResult.style.display = 'none';
    updateSummary();
    return;
  }

  state.moneyWithdrawAmount = val;
  state.moneyFee = getMoneyFee(val);
  state.moneyTotal = val - state.moneyFee;
  if (state.moneyTotal < 0) state.moneyTotal = 0;

  withdrawCalcAmount.textContent = val.toLocaleString() + ' دج';
  withdrawCalcFee.textContent = '- ' + state.moneyFee.toLocaleString() + ' دج';
  withdrawCalcTotal.textContent = state.moneyTotal.toLocaleString() + ' دج';
  withdrawCalcResult.style.display = 'block';

  updateSummary();
});

// ===== DOLLAR BUY/SELL TOGGLE =====
dollarActionTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const action = tab.dataset.dollarAction;
    if (state.dollarAction === action) return;

    state.dollarAction = action;
    state.dollarAmount = '';
    state.dollarDZD = 0;
    state.dollarRate = 0;

    dollarBuyAmountInput.value = '';
    dollarSellAmountInput.value = '';
    buyCalcResult.style.display = 'none';
    sellCalcResult.style.display = 'none';

    dollarActionTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    if (action === 'buy') {
      dollarBuySection.style.display = 'block';
      dollarSellSection.style.display = 'none';
    } else {
      dollarBuySection.style.display = 'none';
      dollarSellSection.style.display = 'block';
    }

    updateSummary();
  });
});

// ===== DOLLAR BUY AMOUNT INPUT =====
dollarBuyAmountInput.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  if (!val || val <= 0) {
    state.dollarAmount = '';
    state.dollarDZD = 0;
    state.dollarRate = 0;
    buyCalcResult.style.display = 'none';
    updateSummary();
    return;
  }

  state.dollarAmount = val;
  state.dollarRate = getDollarBuyRate(val);
  state.dollarDZD = val * state.dollarRate;

  buyCalcQty.textContent = val + ' USDT';
  buyCalcRate.textContent = state.dollarRate + ' دج / USDT';
  buyCalcTotal.textContent = state.dollarDZD.toLocaleString() + ' دج';
  buyCalcResult.style.display = 'block';

  updateSummary();
});

// ===== DOLLAR SELL AMOUNT INPUT =====
dollarSellAmountInput.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  if (!val || val <= 0) {
    state.dollarAmount = '';
    state.dollarDZD = 0;
    state.dollarRate = DOLLAR_SELL_RATE;
    sellCalcResult.style.display = 'none';
    updateSummary();
    return;
  }

  state.dollarAmount = val;
  state.dollarRate = DOLLAR_SELL_RATE;
  state.dollarDZD = val * DOLLAR_SELL_RATE;

  sellCalcQty.textContent = val + ' USDT';
  sellCalcTotal.textContent = state.dollarDZD.toLocaleString() + ' دج';
  sellCalcResult.style.display = 'block';

  updateSummary();
});

// ===== COPY BEP20 ADDRESS =====
btnCopyAddress.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  const address = bep20Address.textContent;
  navigator.clipboard.writeText(address).then(() => {
    showToast('تم نسخ العنوان بنجاح ✅', 'success');
    btnCopyAddress.textContent = '✅ تم النسخ!';
    setTimeout(() => { btnCopyAddress.textContent = '📋 نسخ العنوان'; }, 2000);
  }).catch(() => {
    const textArea = document.createElement('textarea');
    textArea.value = address;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    showToast('تم نسخ العنوان بنجاح ✅', 'success');
  });
});

// ===== GAME SELECTION =====
gameTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const game = tab.dataset.game;
    if (state.selectedGame === game) return;

    state.selectedGame = game;
    state.selectedPackage = null;

    gameTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    // UI Updates for TikTok vs Others
    if (game === 'tiktok') {
      if (playerIdTitle) playerIdTitle.textContent = 'أدخل رقم الهاتف';
      if (playerIdIcon) playerIdIcon.textContent = '📱';
      if (playerIdInput) playerIdInput.placeholder = 'مثال: 0555...';
      if (tiktokInstructions) tiktokInstructions.style.display = 'block';
    } else {
      if (playerIdTitle) playerIdTitle.textContent = 'أدخل معرّف اللاعب';
      if (playerIdIcon) playerIdIcon.textContent = '👤';
      if (playerIdInput) playerIdInput.placeholder = 'أدخل معرّف اللاعب (Player ID)';
      if (tiktokInstructions) tiktokInstructions.style.display = 'none';
    }

    renderPackages(game);
    updateSummary();
  });
});

// ===== PLAYER ID & PROMO DETAILS =====
playerIdInput.addEventListener('input', (e) => {
  state.playerId = e.target.value.trim();
  updateSummary();
});

promoLinkInput.addEventListener('input', (e) => {
  state.promoLink = e.target.value.trim();
  updateSummary();
});

promoPhoneInput.addEventListener('input', (e) => {
  state.promoPhone = e.target.value.trim();
  updateSummary();
});

promoTargetingInput.addEventListener('input', (e) => {
  state.promoTargeting = e.target.value.trim();
});

// ===== WEBSITE INPUTS =====
document.getElementById('websiteFullNameInput').addEventListener('input', (e) => {
  state.websiteFullName = e.target.value.trim();
  updateSummary();
});
document.getElementById('websitePhoneInput').addEventListener('input', (e) => {
  state.websitePhone = e.target.value.trim();
  updateSummary();
});
document.getElementById('websiteNotesInput').addEventListener('input', (e) => {
  state.websiteNotes = e.target.value.trim();
});

// ===== INSTAGRAM FOLLOWERS INPUT =====
document.getElementById('igFollowersUsernameInput').addEventListener('input', (e) => {
  state.igFollowersUsername = e.target.value.trim();
  updateSummary();
});

// ===== PROMO PLATFORM SELECTION =====
promoPlatformTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const platform = tab.dataset.promoPlatform;
    if (state.selectedGame === platform) return;

    state.selectedGame = platform;
    promoPlatformTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    updateSummary();
  });
});

// ===== RENDER PACKAGES =====
function renderPackages(game) {
  const packages = PACKAGES[game];
  packagesGrid.innerHTML = '';

  if (!packages) {
    packagesGrid.innerHTML = '<p style="color:var(--text-muted);text-align:center;grid-column:1/-1;padding:2rem;">اختر لعبة أولاً لعرض الباقات المتاحة ⬆️</p>';
    return;
  }

  packages.forEach((pkg, i) => {
    const card = document.createElement('div');
    card.className = 'package-card fade-in';
    card.dataset.game = game;
    card.style.animationDelay = `${i * 0.08}s`;

    const currencyName = game === 'freefire' ? 'Diamonds' : game === 'promo' ? 'المدة: 7 أيام' : game === 'tiktok' ? 'عملات TikTok' : game === 'igfollowers' ? 'متابع Instagram' : 'UC';
    card.innerHTML = `
      <span class="select-check">✓</span>
      ${pkg.popular ? '<span class="popular-badge">🔥 الأكثر طلباً</span>' : ''}
      <span class="diamond-icon">${pkg.icon}</span>
      <div class="amount">${game === 'promo' ? pkg.amount : Number(pkg.amount).toLocaleString()}</div>
      <div class="currency-name">${currencyName}</div>
      <div class="price">${pkg.price}</div>
    `;

    card.addEventListener('click', () => {
      document.querySelectorAll('.package-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      state.selectedPackage = pkg;
      updateSummary();
    });

    packagesGrid.appendChild(card);
  });
}

// ===== PAYMENT METHOD SELECTION =====
paymentCards.forEach(card => {
  card.addEventListener('click', () => {
    const method = card.dataset.method;
    if (state.paymentMethod === method) return;

    state.paymentMethod = method;

      paymentCards.forEach(c => {
        c.classList.remove('active');
        c.style.borderColor = 'var(--border-glass)';
        c.style.boxShadow = 'none';
        c.querySelector('.check-badge').style.opacity = '0';
      });

      card.classList.add('active');
      card.style.borderColor = 'var(--accent-blue)';
      card.style.boxShadow = 'var(--shadow-glow-blue)';
      card.querySelector('.check-badge').style.opacity = '1';

      const cashInfoDesc = document.getElementById('cashInfoDesc');
      if (cashInfoDesc) {
        if (state.selectedGame === 'tiktok' && method === 'cash') {
          cashInfoDesc.innerHTML = 'لقد اخترت الدفع نقداً لمشتريات تيكتوك. <strong>يرجى الضغط على زر "تأكيد الطلب و إرسال" بالأسفل</strong> لتسجيل طلبك، وسنتواصل معك فوراً عبر الواتسآب لتأكيد الدفع وإرسال QR كود الشحن.';
        } else {
          cashInfoDesc.innerHTML = 'لقد اخترت الدفع يداً بـ يد. يرجى الاتصال بنا عبر الهاتف أو الواتسآب لتحديد مكان اللقاء وتسليم المبلغ ليتم شحن حسابك.';
        }
      }

    if (method === 'baridimob') {
      baridiMobInfo.style.display = 'block';
      cashInfo.style.display = 'none';
      proofSection.style.display = 'block';
    } else {
      baridiMobInfo.style.display = 'none';
      cashInfo.style.display = 'block';
      proofSection.style.display = 'none';
      state.paymentProof = null;
      proofInput.value = '';
      proofImage.src = '';
      uploadPlaceholder.style.display = 'block';
      uploadPreview.style.display = 'none';
      uploadArea.classList.remove('has-file');
    }

    updateSummary();
  });
});

// ===== UPLOAD PAYMENT PROOF =====
uploadArea.addEventListener('click', (e) => {
  if (e.target === btnRemoveProof || e.target.closest('#btnRemoveProof')) return;
  if (!state.paymentProof) {
    proofInput.click();
  }
});

proofInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('يرجى رفع صورة فقط (PNG, JPG)', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    state.paymentProof = event.target.result;
    proofImage.src = state.paymentProof;
    uploadPlaceholder.style.display = 'none';
    uploadPreview.style.display = 'flex';
    uploadArea.classList.add('has-file');
    updateSummary();
    showToast('تم رفع إثبات الدفع بنجاح ✅', 'success');
  };
  reader.readAsDataURL(file);
});

btnRemoveProof.addEventListener('click', (e) => {
  e.stopPropagation();
  state.paymentProof = null;
  proofInput.value = '';
  proofImage.src = '';
  uploadPlaceholder.style.display = 'block';
  uploadPreview.style.display = 'none';
  uploadArea.classList.remove('has-file');
  updateSummary();
});

// ===== UPDATE SUMMARY =====
function updateSummary() {
  if (state.selectedService === 'games') {
    summaryGame.textContent = state.selectedGame ? GAME_LABELS[state.selectedGame] : '—';
    summaryPlayerId.previousElementSibling.textContent = state.selectedGame === 'tiktok' ? 'رقم الهاتف' : 'معرّف اللعبة';
    summaryPlayerId.textContent = state.playerId || '—';
    summaryPackage.textContent = state.selectedPackage ? state.selectedPackage.label : '—';
    summaryPackage.parentElement.style.display = 'flex';
    summaryPrice.textContent = state.selectedPackage ? state.selectedPackage.price : '—';
  } else if (state.selectedService === 'promo') {
    summaryGame.textContent = state.selectedGame ? GAME_LABELS[state.selectedGame] : '—';
    summaryPlayerId.textContent = state.promoLink || '—';
    summaryPackage.textContent = state.selectedPackage ? state.selectedPackage.label : '—';
    summaryPackage.parentElement.style.display = 'flex';
    summaryPrice.textContent = state.selectedPackage ? state.selectedPackage.price : '—';
  } else if (state.selectedService === 'money') {
    summaryGame.textContent = state.moneyAction === 'send' ? '📤 إرسال المال' : '📥 سحب المال';
    summaryPlayerId.textContent = state.moneyAction === 'send' ? (state.moneySendAccount || '—') : 'سحب';
    summaryPackage.parentElement.style.display = 'none';
    if (state.moneyAction === 'send' && state.moneySendAmount) {
      summaryPrice.textContent = state.moneyTotal.toLocaleString() + ' دج (شامل ' + state.moneyFee + ' دج رسوم)';
    } else if (state.moneyAction === 'withdraw' && state.moneyWithdrawAmount) {
      summaryPrice.textContent = state.moneyTotal.toLocaleString() + ' دج صافي (خصم ' + state.moneyFee + ' دج)';
    } else {
      summaryPrice.textContent = '—';
    }
  } else if (state.selectedService === 'dollar') {
    summaryGame.textContent = state.dollarAction === 'buy' ? '💵 شراء USDT' : '💰 بيع USDT';
    summaryPlayerId.textContent = state.dollarAction === 'buy' ? 'شراء' : 'بيع';
    summaryPackage.parentElement.style.display = 'none';
    if (state.dollarAmount && state.dollarDZD) {
      summaryPrice.textContent = state.dollarAmount + ' USDT = ' + state.dollarDZD.toLocaleString() + ' دج';
    } else {
      summaryPrice.textContent = '—';
    }
  } else if (state.selectedService === 'website') {
    summaryGame.textContent = '🌐 موقع / متجر إلكتروني';
    summaryPlayerId.textContent = state.websiteFullName || '—';
    summaryPackage.parentElement.style.display = 'none';
    summaryPrice.textContent = '400,000 دج';
  } else if (state.selectedService === 'igfollowers') {
    summaryGame.textContent = GAME_LABELS['igfollowers'];
    summaryPlayerId.textContent = state.igFollowersUsername || '—';
    summaryPackage.textContent = state.selectedPackage ? state.selectedPackage.label : '—';
    summaryPackage.parentElement.style.display = 'flex';
    summaryPrice.textContent = state.selectedPackage ? state.selectedPackage.price : '—';
  }

  // Validation
  let isBaseValid = false;
  if (state.selectedService === 'games') {
    isBaseValid = state.selectedGame && state.playerId && state.selectedPackage;
  } else if (state.selectedService === 'promo') {
    isBaseValid = state.selectedGame && state.promoLink && state.promoPhone && state.selectedPackage;
  } else if (state.selectedService === 'money') {
    if (state.moneyAction === 'send') {
      isBaseValid = state.moneySendAccount && state.moneySendAmount > 0;
    } else {
      isBaseValid = state.moneyWithdrawAmount > 0;
    }
  } else if (state.selectedService === 'dollar') {
    isBaseValid = state.dollarAmount && state.dollarDZD > 0;
  } else if (state.selectedService === 'website') {
    isBaseValid = state.websiteFullName && state.websitePhone;
  } else if (state.selectedService === 'igfollowers') {
    isBaseValid = state.igFollowersUsername && state.selectedPackage;
  }

  // Hide submit button for cash payments on all services except TikTok
  const isCashNonTiktok = state.paymentMethod === 'cash' && state.selectedGame !== 'tiktok';
  const submitSection = btnSubmit.closest('section');
  if (isCashNonTiktok) {
    if (submitSection) submitSection.style.display = 'none';
  } else {
    if (submitSection) submitSection.style.display = 'block';
  }

  const isPaymentValid =
    state.paymentMethod === 'cash' || (state.paymentMethod === 'baridimob' && state.paymentProof);

  btnSubmit.disabled = !(isBaseValid && isPaymentValid);
}

// ===== AUTH & DASHBOARD LOGIC =====

// Modals toggle
if (btnOpenAuth) {
  btnOpenAuth.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Auth button clicked', currentUser);
    if (currentUser) {
      openDashboard();
    } else {
      authModal.classList.add('active');
    }
  });
}

if (btnCloseAuth) btnCloseAuth.addEventListener('click', () => authModal.classList.remove('active'));
if (btnCloseDashboard) btnCloseDashboard.addEventListener('click', () => dashboardModal.classList.remove('active'));

if (tabLogin && tabRegister) {
  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabLogin.style.color = 'white';
    tabRegister.classList.remove('active');
    tabRegister.style.color = 'var(--text-muted)';
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
  });
  tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('active');
    tabRegister.style.color = 'white';
    tabLogin.classList.remove('active');
    tabLogin.style.color = 'var(--text-muted)';
    registerForm.style.display = 'block';
    loginForm.style.display = 'none';
  });
}

// Register
if (btnRealRegister) {
  btnRealRegister.addEventListener('click', async () => {
    const name = regName.value.trim();
    const phone = regPhone.value.trim();
    const email = regEmail.value.trim();
    const password = regPassword.value.trim();

    if (!name || !phone || !email || !password) {
      showToast('يرجى ملء جميع الحقول', 'error');
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      showToast('خطأ في التسجيل: ' + authError.message, 'error');
      return;
    }

    // Generate unique referral code
    const newRefCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Create profile
    if (authData.user) {
      const { error: profileError } = await supabase.from('profiles').insert([
        { 
          id: authData.user.id, 
          full_name: name,
          phone: phone,
          referral_code: newRefCode,
          referred_by: savedReferral // Save who referred them
        }
      ]);
      
      if (profileError) {
        console.error('Profile creation error:', profileError);
      }
    }

    showToast('تم إنشاء الحساب بنجاح!', 'success');
    authModal.classList.remove('active');
    checkAuthState();
  });
}

// Login
if (btnRealLogin) {
  btnRealLogin.addEventListener('click', async () => {
    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();

    if (!email || !password) {
      showToast('يرجى إدخال البريد وكلمة المرور', 'error');
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      showToast('خطأ في تسجيل الدخول: ' + error.message, 'error');
      return;
    }

    showToast('تم تسجيل الدخول بنجاح!', 'success');
    authModal.classList.remove('active');
    checkAuthState();
  });
}

// Logout
if (btnLogout) {
  btnLogout.addEventListener('click', async () => {
    await supabase.auth.signOut();
    showToast('تم تسجيل الخروج', 'info');
    dashboardModal.classList.remove('active');
    checkAuthState();
  });
}

// Check Auth State on load
async function checkAuthState() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session && session.user) {
    currentUser = session.user;
    btnOpenAuth.innerHTML = '👤 حسابي';
    btnOpenAuth.style.background = 'var(--accent-green)';
    fetchUserProfile();
  } else {
    currentUser = null;
    userProfile = null;
    btnOpenAuth.innerHTML = '👤 تسجيل الدخول';
    btnOpenAuth.style.background = 'var(--gradient-main)';
  }
}

async function fetchUserProfile() {
  if (!currentUser) return;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
  if (!error && data) {
    userProfile = data;
  }
}

async function openDashboard() {
  dashboardModal.classList.add('active');
  dashEmail.textContent = currentUser.email;
  
  if (userProfile) {
    dashName.textContent = userProfile.full_name;
    dashBalance.textContent = (userProfile.balance || 0).toLocaleString() + ' دج';
    
    // Set referral link
    const baseUrl = window.location.origin + window.location.pathname;
    dashRefLink.value = baseUrl + '?ref=' + userProfile.referral_code;
  } else {
    dashName.textContent = 'مستخدم';
    dashBalance.textContent = '0 دج';
  }

  // Fetch Orders
  dashOrdersList.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 1rem;">جاري التحميل...</div>';
  const { data: orders, error } = await supabase.from('orders').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
  
  if (error || !orders || orders.length === 0) {
    dashOrdersList.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 1rem;">لا توجد طلبات سابقة.</div>';
    return;
  }

  dashOrdersList.innerHTML = '';
  orders.forEach(order => {
    const isCompleted = order.status === 'completed';
    const isPending = order.status === 'pending';
    const statusColor = isCompleted ? 'var(--accent-green)' : (isPending ? 'var(--accent-gold)' : 'var(--accent-red)');
    const statusText = isCompleted ? 'مكتمل' : (isPending ? 'قيد الانتظار' : 'مرفوض');
    
    const div = document.createElement('div');
    div.style.background = 'rgba(0,0,0,0.2)';
    div.style.padding = '1rem';
    div.style.borderRadius = 'var(--radius-sm)';
    div.style.border = '1px solid var(--border-glass)';
    div.style.display = 'flex';
    div.style.justifyContent = 'space-between';
    div.style.alignItems = 'center';
    
    div.innerHTML = `
      <div>
        <div style="font-weight: bold; margin-bottom: 0.3rem;">#${order.id} - ${order.service_label}</div>
        <div style="font-size: 0.85rem; color: var(--text-muted);">${order.package_label || order.price_num + ' دج'}</div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">${new Date(order.created_at).toLocaleDateString('ar-DZ')}</div>
      </div>
      <div>
        <span style="background: ${statusColor}22; color: ${statusColor}; padding: 0.3rem 0.6rem; border-radius: 20px; font-size: 0.8rem; font-weight: bold; border: 1px solid ${statusColor}44;">${statusText}</span>
      </div>
    `;
    dashOrdersList.appendChild(div);
  });
}

if (btnCopyDashRef) {
  btnCopyDashRef.addEventListener('click', () => {
    dashRefLink.select();
    document.execCommand('copy');
    showToast('تم نسخ رابط الإحالة! 🚀', 'success');
  });
}

// ===== SUBMIT ORDER =====
btnSubmit.addEventListener('click', async () => {
  if (btnSubmit.disabled) return;

  let isBaseValid = false;
  let serviceLabel = '';

  if (state.selectedService === 'games') {
    isBaseValid = state.selectedGame && state.playerId && state.selectedPackage;
    serviceLabel = GAME_LABELS[state.selectedGame] || state.selectedGame;
  } else if (state.selectedService === 'promo') {
    isBaseValid = state.selectedGame && state.promoLink && state.promoPhone && state.selectedPackage;
    serviceLabel = GAME_LABELS[state.selectedGame] || state.selectedGame;
  } else if (state.selectedService === 'money') {
    if (state.moneyAction === 'send') {
      isBaseValid = state.moneySendAccount && state.moneySendAmount > 0;
    } else {
      isBaseValid = state.moneyWithdrawAmount > 0;
    }
    serviceLabel = state.moneyAction === 'send' ? 'إرسال المال' : 'سحب المال';
  } else if (state.selectedService === 'dollar') {
    isBaseValid = state.dollarAmount && state.dollarDZD > 0;
    serviceLabel = state.dollarAction === 'buy' ? 'شراء USDT' : 'بيع USDT';
  } else if (state.selectedService === 'website') {
    isBaseValid = state.websiteFullName && state.websitePhone;
    serviceLabel = 'موقع / متجر إلكتروني';
  } else if (state.selectedService === 'igfollowers') {
    isBaseValid = state.igFollowersUsername && state.selectedPackage;
    serviceLabel = 'Instagram - زيادة متابعين';
  }

  const isPaymentValid =
    state.paymentMethod === 'cash' || (state.paymentMethod === 'baridimob' && state.paymentProof);

  if (!isBaseValid || !isPaymentValid) {
    showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
    return;
  }

  const order = {
    id: generateOrderId(),
    serviceType: state.selectedService,
    serviceLabel: serviceLabel,

    // Game/Promo fields
    game: state.selectedGame,
    playerId: state.selectedService === 'promo' ? state.promoLink : state.playerId,
    promoPhone: state.promoPhone,
    promoTargeting: state.promoTargeting,
    packageLabel: state.selectedPackage ? state.selectedPackage.label : null,
    packageAmount: state.selectedPackage ? state.selectedPackage.amount : null,

    // Money fields
    moneyAction: state.selectedService === 'money' ? state.moneyAction : null,
    moneySendAccount: state.selectedService === 'money' && state.moneyAction === 'send' ? state.moneySendAccount : null,
    moneyAmount: state.selectedService === 'money' ? (state.moneyAction === 'send' ? state.moneySendAmount : state.moneyWithdrawAmount) : null,
    moneyFee: state.selectedService === 'money' ? state.moneyFee : null,
    moneyTotal: state.selectedService === 'money' ? state.moneyTotal : null,

    // Dollar fields
    dollarAction: state.selectedService === 'dollar' ? state.dollarAction : null,
    dollarAmount: state.selectedService === 'dollar' ? state.dollarAmount : null,
    dollarRate: state.selectedService === 'dollar' ? state.dollarRate : null,
    dollarDZD: state.selectedService === 'dollar' ? state.dollarDZD : null,

    // Website fields
    websiteFullName: state.selectedService === 'website' ? state.websiteFullName : null,
    websitePhone: state.selectedService === 'website' ? state.websitePhone : null,
    websiteNotes: state.selectedService === 'website' ? state.websiteNotes : null,

    // Instagram Followers fields
    igFollowersUsername: state.selectedService === 'igfollowers' ? state.igFollowersUsername : null,

    // Common fields
    price: state.selectedService === 'website'
      ? '400,000 دج'
      : (state.selectedService === 'games' || state.selectedService === 'promo' || state.selectedService === 'igfollowers')
        ? state.selectedPackage.price
        : state.selectedService === 'dollar'
          ? state.dollarDZD.toLocaleString() + ' دج'
          : state.moneyTotal.toLocaleString() + ' دج',
    priceNum: state.selectedService === 'website'
      ? 400000
      : (state.selectedService === 'games' || state.selectedService === 'promo' || state.selectedService === 'igfollowers')
        ? state.selectedPackage.priceNum
        : state.selectedService === 'dollar'
          ? state.dollarDZD
          : state.moneyTotal,
    paymentMethod: state.paymentMethod,
    paymentProof: state.paymentProof,
    referral: savedReferral, // Added tracking field
    status: 'pending',
    timestamp: new Date().toISOString(),
  };

  const isCompleted = false; // Initial status

  // Create minimal order object for Supabase
  const dbOrder = {
    id: order.id,
    user_id: currentUser ? currentUser.id : null,
    service_type: order.serviceType,
    service_label: order.serviceLabel,
    game: order.game,
    player_id: order.playerId,
    package_label: order.packageLabel,
    price_num: order.priceNum,
    status: 'pending'
  };

  btnSubmit.disabled = true;
  btnSubmit.innerHTML = '<span class="btn-shimmer"></span>جاري المعالجة... ⏳';

  try {
    // 1. Save to Supabase
    const { error: dbError } = await supabase.from('orders').insert([dbOrder]);
    if (dbError) {
      console.error('Failed to save order to Supabase:', dbError);
    }
  } catch(e) {
    console.error('Supabase error', e);
  }

  // 2. Save locally (legacy)
  const orders = JSON.parse(localStorage.getItem('gamezone_orders') || '[]');
  orders.unshift(order);
  localStorage.setItem('gamezone_orders', JSON.stringify(orders));

  // 3. Send Discord Webhook
  await sendToDiscord(order);

  btnSubmit.innerHTML = '<span class="btn-shimmer"></span>تأكيد الطلب و إرسال ✨';
  btnSubmit.disabled = false;

  modalOrderId.textContent = '#' + order.id;

  // Update success modal message based on service type
  const successMsg = document.querySelector('#successModal p');
  if (successMsg) {
    if (order.serviceType === 'website') {
      successMsg.innerHTML = 'تم استلام طلبك! سنتواصل معك خلال <strong>24 ساعة</strong> لمناقشة تفاصيل مشروعك. شكراً على ثقتك بنا! 🌐';
    } else if (order.game === 'tiktok') {
      successMsg.innerHTML = 'تم إرسال طلبك! <strong>سنتواصل معك عبر الواتسآب</strong> لإرسال QR كود وإتمام عملية شحن العملات بنجاح. 🪙📱';
    } else {
      successMsg.innerHTML = 'سيتم معالجة طلبك في أقرب وقت ممكن. شكراً على صبرك و ثقتك بنا! 💙';
    }
  }

  successModal.classList.add('active');

  resetForm();
});

// ===== DISCORD NOTIFICATION =====
async function sendToDiscord(order) {
  const WEBHOOK_URL = 'https://discord.com/api/webhooks/1480604281403867336/UR5RBGKHD6waNs64KgvGO3FxmSx8zJ2lrZCebvgVoY0thmugwx_OkB9uOCJYcUMmh-r5';

  let methodLabel = 'نقداً (Cash)';
  if (order.paymentMethod === 'baridimob') methodLabel = '💳 بريدي موب (Baridi Mob)';

  let proofLabel = '📌 تنبيه: العميل اختار الدفع نقداً، يرجى التواصل معه.';
  if (order.paymentProof) proofLabel = '✅ إثبات الدفع عبر التحويل البنكي مرفق بالصور:';

  let message = `🚀 **طلب جديد - DzDiniro** 🚀\n━━━━━━━━━━━━━━━\n📋 **رقم الطلب:** #${order.id}\n🛒 **الخدمة:** ${order.serviceLabel}\n`;

  if (order.serviceType === 'games') {
    const idLabel = order.game === 'tiktok' ? 'رقم الهاتف' : 'معرّف اللعبة';
    message += `👤 **${idLabel}:** \`${order.playerId}\`\n📦 **الباقة:** ${order.packageLabel}\n`;
  } else if (order.serviceType === 'promo') {
    message += `🔗 **الرابط:** \`${order.playerId}\`\n`;
    message += `📞 **الهاتف:** \`${order.promoPhone}\`\n`;
    message += `📦 **الباقة:** ${order.packageLabel}\n`;
    if (order.promoTargeting) {
      message += `🎯 **الاستهداف:** ${order.promoTargeting}\n`;
    }
  } else if (order.serviceType === 'money') {
    const actionLabel = order.moneyAction === 'send' ? '📤 إرسال' : '📥 سحب';
    message += `💱 **نوع العملية:** ${actionLabel}\n`;
    if (order.moneyAction === 'send') {
      message += `👤 **حساب المستلم:** \`${order.moneySendAccount}\`\n`;
    }
    message += `💵 **المبلغ:** ${order.moneyAmount.toLocaleString()} دج\n`;
    message += `📊 **الرسوم:** ${order.moneyFee.toLocaleString()} دج\n`;
    message += `💰 **الإجمالي:** ${order.moneyTotal.toLocaleString()} دج\n`;
  } else if (order.serviceType === 'dollar') {
    const actionLabel = order.dollarAction === 'buy' ? '🛒 شراء' : '💰 بيع';
    message += `💱 **نوع العملية:** ${actionLabel}\n`;
    message += `💵 **الكمية:** ${order.dollarAmount} USDT\n`;
    message += `📊 **السعر المطبّق:** ${order.dollarRate} دج/USDT\n`;
    message += `💰 **المبلغ الإجمالي:** ${order.dollarDZD.toLocaleString()} دج\n`;
  } else if (order.serviceType === 'website') {
    message += `👤 **الاسم الكامل:** ${order.websiteFullName}\n`;
    message += `📱 **الهاتف:** \`${order.websitePhone}\`\n`;
    if (order.websiteNotes) message += `📝 **وصف المشروع:** ${order.websiteNotes}\n`;
    message += `💰 **السعر:** 400,000 دج\n`;
  } else if (order.serviceType === 'igfollowers') {
    message += `📸 **حساب Instagram:** \`${order.igFollowersUsername}\`\n`;
    message += `📦 **الباقة:** ${order.packageLabel}\n`;
  }

  if (order.referral) {
    message += `🤝 **رابط الإحالة (من طرف):** \`${order.referral}\`\n`;
  }
  
  message += `💰 **المبلغ/السعر:** ${order.price}\n💳 **طريقة الدفع:** ${methodLabel}\n📅 **التاريخ:** ${new Date().toLocaleString('ar-DZ')}\n━━━━━━━━━━━━━━━\n${proofLabel}`;

  try {
    const formData = new FormData();
    formData.append('content', message);

    if (order.paymentProof) {
      const base64Data = order.paymentProof.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteArrays = [];
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArrays.push(byteCharacters.charCodeAt(i));
      }
      const blob = new Blob([new Uint8Array(byteArrays)], { type: 'image/jpeg' });
      formData.append('file', blob, `proof_${order.id}.jpg`);
    }

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      console.error('Failed to send to Discord:', await response.text());
    } else {
      console.log('Successfully sent notification to Discord');
    }
  } catch (err) {
    console.error('Error sending Discord message:', err);
  }
}

// ===== CLOSE MODAL =====
btnCloseModal.addEventListener('click', () => {
  successModal.classList.remove('active');
});

successModal.addEventListener('click', (e) => {
  if (e.target === successModal) {
    successModal.classList.remove('active');
  }
});

// ===== HELPERS =====
function generateOrderId() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function resetForm() {
  state = {
    selectedService: state.selectedService,
    selectedGame: null,
    playerId: '',
    selectedPackage: null,
    moneyAction: 'send',
    moneySendAccount: '',
    moneySendAmount: '',
    moneyWithdrawAmount: '',
    moneyFee: 0,
    moneyTotal: 0,
    dollarAction: 'buy',
    dollarAmount: '',
    dollarDZD: 0,
    dollarRate: 0,
    promoPlatform: 'facebook',
    promoLink: '',
    promoPhone: '',
    promoTargeting: '',
    websiteFullName: '',
    websitePhone: '',
    websiteNotes: '',
    igFollowersUsername: '',
    paymentMethod: 'baridimob',
    paymentProof: null,
  };

  gameTabs.forEach(t => t.classList.remove('active'));
  promoPlatformTabs.forEach(t => t.classList.remove('active'));
  playerIdInput.value = '';
  promoLinkInput.value = '';
  promoPhoneInput.value = '';
  promoTargetingInput.value = '';
  dollarBuyAmountInput.value = '';
  dollarSellAmountInput.value = '';
  moneySendAccountInput.value = '';
  moneySendAmountInput.value = '';
  moneyWithdrawAmountInput.value = '';
  const igInput = document.getElementById('igFollowersUsernameInput'); if(igInput) igInput.value = '';
  buyCalcResult.style.display = 'none';
  sellCalcResult.style.display = 'none';
  sendCalcResult.style.display = 'none';
  withdrawCalcResult.style.display = 'none';
  proofInput.value = '';
  proofImage.src = '';
  uploadPlaceholder.style.display = 'block';
  uploadPreview.style.display = 'none';
  uploadArea.classList.remove('has-file');
  packagesGrid.innerHTML = '<p style="color:var(--text-muted);text-align:center;grid-column:1/-1;padding:2rem;">اختر لعبة أولاً لعرض الباقات المتاحة</p>';
  updateSummary();
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ===== INIT =====
function init() {
  packagesGrid.innerHTML = '<p style="color:var(--text-muted);text-align:center;grid-column:1/-1;padding:2rem;">اختر لعبة أولاً لعرض الباقات المتاحة ⬆️</p>';

  window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    const scrollY = window.scrollY;
    if (scrollY > 50) {
      navbar.style.boxShadow = '0 4px 30px rgba(0,0,0,0.3)';
    } else {
      navbar.style.boxShadow = 'none';
    }
  });

  checkAuthState();
}

init();
