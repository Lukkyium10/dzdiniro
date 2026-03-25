// ============================================================
// DzDiniro — Automated Order Worker
// ============================================================
// This script polls Supabase every 30 seconds for orders with
// status = 'processing_auto' and fulfills them automatically
// using Puppeteer for Free Fire and PUBG charging.
//
// HOW TO RUN:
//   1. npm install @supabase/supabase-js puppeteer
//   2. Edit the CONFIG section below with your credentials
//   3. node worker.js
// ============================================================

import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer-core';

// ============================================================
// CONFIG — Edit these values before running
// ============================================================
const CONFIG = {
  // Supabase credentials (use Service Role Key for full DB access)
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://dixrpmlkbxbopoebsslk.supabase.co',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || '',

  // Allowed emails for automation (security check)
  AUTOMATED_EMAILS: ['atia7475@gmail.com', 'd.i.d.i.n.e.lke@gmail.com'],

  // Free Fire — Shop2Game credentials
  FREEFIRE_SHOP2GAME_EMAIL: process.env.FREEFIRE_SHOP2GAME_EMAIL || '',
  FREEFIRE_SHOP2GAME_PASSWORD: process.env.FREEFIRE_SHOP2GAME_PASSWORD || '',

  // Credit Card (for Shop2Game — read from Railway Variables only, NEVER hardcode!)
  CARD_NUMBER: process.env.CARD_NUMBER || '',
  CARD_EXPIRY_MONTH: process.env.CARD_EXPIRY_MONTH || '',
  CARD_EXPIRY_YEAR: process.env.CARD_EXPIRY_YEAR || '',
  CARD_CVV: process.env.CARD_CVV || '',

  // PUBG — Midasbuy credentials
  PUBG_MIDASBUY_EMAIL: process.env.PUBG_MIDASBUY_EMAIL || '',
  PUBG_MIDASBUY_PASSWORD: process.env.PUBG_MIDASBUY_PASSWORD || '',

  // Polling interval in milliseconds (30 seconds)
  POLL_INTERVAL_MS: 30000,

  // Run browser in headless mode (true = no window, false = show browser)
  HEADLESS: true,

  // DRY RUN mode: goes through all steps but does NOT click Pay (no real charge)
  // Set to 'false' in Railway Variables when ready for real payments
  DRY_RUN: process.env.DRY_RUN !== 'false',
};
// ============================================================

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY);

console.log('🤖 DzDiniro Automation Worker started...');
console.log(`📧 Authorized emails: ${CONFIG.AUTOMATED_EMAILS.join(', ')}`);
console.log(`⏰ Polling every ${CONFIG.POLL_INTERVAL_MS / 1000} seconds\n`);

// ============================================================
// MAIN POLL LOOP
// ============================================================
async function pollOrders() {
  try {
    console.log(`[${new Date().toLocaleTimeString()}] 🔍 Checking for new automated orders...`);

    // Fetch pending automated orders with their user profile
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, profiles!inner(id, full_name)')
      .eq('status', 'processing_auto')
      .in('game', ['freefire', 'pubg'])
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Supabase error:', error.message);
      return;
    }

    if (!orders || orders.length === 0) {
      console.log('   ✅ No pending automated orders.\n');
      return;
    }

    console.log(`   📦 Found ${orders.length} order(s) to process.`);

    for (const order of orders) {
      await processOrder(order);
    }

  } catch (err) {
    console.error('❌ Unexpected error in pollOrders:', err.message);
  }
}

// ============================================================
// PROCESS A SINGLE ORDER
// ============================================================
async function processOrder(order) {
  const orderCode = order.order_code;
  const game = order.game;
  const playerId = order.player_id;
  const packageAmount = order.package_amount;
  const packageLabel = order.package_label;

  console.log(`\n▶ Processing Order #${orderCode}`);
  console.log(`  Game: ${game}`);
  console.log(`  Player ID: ${playerId}`);
  console.log(`  Package: ${packageLabel} (${packageAmount})`);

  // Mark as 'processing' to prevent duplicate processing
  await updateOrderStatus(orderCode, 'processing');

  try {
    let success = false;

    if (game === 'freefire') {
      success = await chargeFreeFire(playerId, packageAmount, orderCode);
    } else if (game === 'pubg') {
      success = await chargePUBG(playerId, packageAmount, orderCode);
    } else {
      console.warn(`  ⚠️ Unknown game: ${game}. Skipping.`);
      await updateOrderStatus(orderCode, 'pending'); // Return to pending for manual review
      return;
    }

    if (success) {
      await updateOrderStatus(orderCode, 'completed');
      console.log(`  ✅ Order #${orderCode} completed successfully!`);
    } else {
      await updateOrderStatus(orderCode, 'pending'); // Return to pending for manual review
      console.error(`  ❌ Order #${orderCode} failed. Reverted to 'pending' for manual review.`);
    }

  } catch (err) {
    console.error(`  ❌ Error processing order #${orderCode}:`, err.message);
    await updateOrderStatus(orderCode, 'pending');
  }
}

// ============================================================
// UPDATE ORDER STATUS IN SUPABASE
// ============================================================
async function updateOrderStatus(orderCode, status) {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('order_code', orderCode);

  if (error) {
    console.error(`  ⚠️ Failed to update status for #${orderCode}:`, error.message);
  } else {
    console.log(`  🔄 Order #${orderCode} status → '${status}'`);
  }
}

// ============================================================
// FREE FIRE CHARGING (via Shop2Game)
// ============================================================
async function chargeFreeFire(playerId, amount, orderCode) {
  console.log(`  🔥 Starting Free Fire charge for player ${playerId} | ${amount} diamonds...`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: CONFIG.HEADLESS,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');

    // ── STEP 1: Go directly to Free Fire top-up page ───────────
    console.log('  📄 [1/5] Opening Shop2Game Free Fire top-up page...');
    await page.goto('https://shop2game.com/?channel=230199&item=26781', { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));

    // ── STEP 2: Enter Player ID ────────────────────────────────
    console.log(`  📄 [2/5] Entering player ID: ${playerId}...`);
    await page.waitForSelector('input[id=":rs:"], input[placeholder*="معرف اللاعب"], input[placeholder*="ID"]', { timeout: 15000 });
    const uidInput = await page.$('input[id=":rs:"], input[placeholder*="معرف اللاعب"], input[placeholder*="ID"]');

    // Clear and type ID
    await uidInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await uidInput.type(playerId, { delay: 60 });
    await new Promise(r => setTimeout(r, 1000));

    // Click "تسجيل الدخول" (Submit ID) button
    console.log('  ➡️ [2/5] Clicking submit ID button...');
    await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"]') ||
        Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes("تسجيل الدخول"));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 3000)); // wait for packages to load

    console.log('  ✅ [2/5] Player ID entered and submitted');

    // ── STEP 3: Select the correct package ─────────────────────
    console.log(`  📄 [3/5] Selecting package: ${amount} diamonds...`);
    const packages = await page.$$('[role="radio"]');
    let selected = false;
    for (const pkg of packages) {
      const text = await page.evaluate(el => el.textContent, pkg);
      if (text.includes(String(amount))) {
        await pkg.click();
        selected = true;
        console.log(`  ✅ [3/5] Selected package: ${amount} diamonds`);
        break;
      }
    }
    if (!selected) {
      console.error(`  ❌ [3/5] Could not find package for ${amount} diamonds`);
      return false;
    }
    await new Promise(r => setTimeout(r, 2000));


    // ── STEP 4: Click Buy Now ──────────────────────────────────
    console.log('  📄 [4/5] Clicking Buy Now...');
    const buyBtn = await page.$('button.bg-primary-red, button:has-text("شراء الآن"), button:has-text("Buy Now")');
    if (buyBtn) {
      await buyBtn.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
      console.log('  ✅ [4/5] Proceeded to checkout page');
    } else {
      console.error('  ❌ [4/5] Buy Now button not found.');
      return false;
    }

    // ── STEP 5: Fill Credit Card Validation (Adyen iFrame) ─────
    console.log('  💳 [5/5] Filling credit card details...');
    await new Promise(r => setTimeout(r, 5000)); // wait for iframes to load

    // Adyen uses 3 separate iframes for card number, expiry, and CVV
    const frames = page.frames();

    // 1. Fill Card Number Iframe
    const cardFrame = frames.find(f => f.url().includes('securedFields.html?type=card'));
    if (cardFrame) {
      await cardFrame.waitForSelector('input', { timeout: 10000 });
      const numInput = await cardFrame.$('input');
      await numInput.type(CONFIG.CARD_NUMBER, { delay: 60 });
    }

    // 2. Fill Expiry Date Iframe
    const expFrame = frames.find(f => f.url().includes('securedFields.html?type=gsf') && f.name().includes('encryptedExpiryDate'));
    // Sometimes Adyen groups expiry or uses just one generic GSF. We try multiple approaches:
    if (expFrame) {
      await expFrame.waitForSelector('input', { timeout: 5000 });
      const expInput = await expFrame.$('input');
      await expInput.type(`${CONFIG.CARD_EXPIRY_MONTH}${CONFIG.CARD_EXPIRY_YEAR}`, { delay: 60 });
    } else {
      // Alternative handling for Adyen split fields if named differently
      const allFrames = frames.filter(f => f.url().includes('securedFields'));
      for (const f of allFrames) {
        const input = await f.$('input#encryptedExpiryDate');
        if (input) await input.type(`${CONFIG.CARD_EXPIRY_MONTH}${CONFIG.CARD_EXPIRY_YEAR}`, { delay: 60 });
      }
    }

    // 3. Fill CVV Iframe
    const cvvFrame = frames.find(f => f.url().includes('securedFields.html?type=gsf') && f.name().includes('encryptedSecurityCode'));
    if (cvvFrame) {
      await cvvFrame.waitForSelector('input', { timeout: 5000 });
      const cvvInput = await cvvFrame.$('input');
      await cvvInput.type(CONFIG.CARD_CVV, { delay: 60 });
    } else {
      const allFrames = frames.filter(f => f.url().includes('securedFields'));
      for (const f of allFrames) {
        const input = await f.$('input#encryptedSecurityCode');
        if (input) await input.type(CONFIG.CARD_CVV, { delay: 60 });
      }
    }

    console.log('  ✅ Card details filled');

    // ── STEP 6: Final Pay Button ───────────────────────────────
    // Click the main Buy/Pay button
    await page.waitForSelector('button.bg-primary-red, button:has-text("المتابعة الى شاشة الدفع")', { timeout: 10000 });

    if (CONFIG.DRY_RUN) {
      console.log('  🧪 [DRY RUN] Would click Final Pay button here — skipping real payment.');
      console.log('  🧪 [DRY RUN] Set DRY_RUN=false in Railway Variables to enable real payments.');
      return false; // return false so order goes back to pending
    }

    await page.click('button.bg-primary-red, button:has-text("المتابعة الى شاشة الدفع")');
    await new Promise(r => setTimeout(r, 3000));

    console.log('  ⏳ [6/6] Payment initiated! Waiting for OTP confirmation from your phone (up to 3 minutes)...');
    await updateOrderStatus(orderCode, 'awaiting_otp');

    // Wait for success page (up to 3 minutes for user to confirm OTP)
    try {
      await page.waitForSelector('.success, .order-success, [class*="success"], .thank-you, .status-success', { timeout: 180000 });
      console.log('  ✅ [6/6] Payment confirmed! Free Fire charge successful.');
      return true;
    } catch {
      console.error('  ❌ [6/6] Timed out waiting for payment confirmation.');
      return false;
    }

  } catch (err) {
    console.error('  ❌ Free Fire charge error:', err.message);
    return false;
  } finally {
    if (browser) await browser.close();
  }
}

// ============================================================
// PUBG CHARGING (via Midasbuy)
// ============================================================
async function chargePUBG(playerId, amount, orderCode) {
  console.log(`  🎮 Starting PUBG charge for player ${playerId} | ${amount} UC...`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: CONFIG.HEADLESS,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');

    // ── STEP 1: Login to Midasbuy ──────────────────────────────
    console.log('  📄 [1/5] Opening Midasbuy PUBG page...');
    await page.goto('https://www.midasbuy.com/midasbuy/dz/buy/pubgm', { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 5000)); // Wait longer for the page to fully render

    // Handle any cookie or privacy popups that might block clicks
    try {
      const cookieBtn = await page.$('.cookie-accept, .agree-btn, [class*="agree"]');
      if (cookieBtn) await cookieBtn.click();
    } catch (e) { }

    // Click the "تسجيل الدخول" button in the top nav to open dropdown
    console.log('  🔐 [1/5] Clicking login button...');
    await page.waitForSelector('.DropNavBox_btn_wrap__ZJEku, .login-btn, [class*="DropNavBox"]', { timeout: 15000 });
    // Use evaluate for the click to bypass potential overlays
    await page.evaluate(() => {
      const btn = document.querySelector('.DropNavBox_btn_wrap__ZJEku') || document.querySelector('[class*="DropNavBox"]');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 3000));

    // Click "تسجيل الدخول/الاشتراك بوسائل أخرى" (Other sign-in methods)
    console.log('  🔐 [1/5] Clicking "other sign-in methods"...');
    await page.waitForSelector('.to-other-login, .other-login-btn', { timeout: 10000 });
    await page.evaluate(() => {
      const otherBtn = document.querySelector('.to-other-login');
      if (otherBtn) otherBtn.click();
    });
    await new Promise(r => setTimeout(r, 3000));

    // Fill email in the modal
    console.log('  📧 [1/5] Entering email...');
    await page.waitForSelector('p.inp input[type="email"], input[type="email"]', { timeout: 15000 });
    await page.click('input[type="email"]', { clickCount: 3 });
    await page.type('input[type="email"]', CONFIG.PUBG_MIDASBUY_EMAIL, { delay: 60 });

    // Click "يكمل" (Continue) button
    console.log('  ➡️ [1/5] Clicking Continue...');
    await page.waitForSelector('.comfirm-btn, .confirm-btn', { timeout: 10000 });
    await page.evaluate(() => {
      const contBtn = document.querySelector('.comfirm-btn') || document.querySelector('.confirm-btn');
      if (contBtn) contBtn.click();
    });
    await new Promise(r => setTimeout(r, 3000));

    // Fill password
    console.log('  🔑 [1/5] Entering password...');
    await page.waitForSelector('.input-box input[type="password"]', { timeout: 15000 });
    await page.click('.input-box input[type="password"]', { clickCount: 3 });
    await page.type('.input-box input[type="password"]', CONFIG.PUBG_MIDASBUY_PASSWORD, { delay: 60 });

    // Click "يكمل" again to confirm login
    await new Promise(r => setTimeout(r, 500));
    await page.click('.comfirm-btn');
    await new Promise(r => setTimeout(r, 4000));
    console.log('  ✅ [1/5] Logged in to Midasbuy');

    // ── STEP 2: Go to PUBG Mobile top-up page ─────────────────
    console.log('  📄 [2/5] Navigating to PUBG top-up page...');
    await page.goto('https://www.midasbuy.com/midasbuy/dz/buy/pubgm', { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));

    // ── STEP 3: Enter Player ID ────────────────────────────────
    console.log(`  📄 [3/5] Entering Player ID: ${playerId}...`);
    await page.waitForSelector('input[placeholder*="ID"], input[placeholder*="Player"], input[class*="userId"], #playerId', { timeout: 15000 });
    const playerIdInput = await page.$('input[placeholder*="ID"], input[placeholder*="Player"], input[class*="userId"], #playerId');
    await playerIdInput.click({ clickCount: 3 });
    await playerIdInput.type(playerId, { delay: 60 });

    // Click "Check" or verify player ID
    const checkBtn = await page.$('.check-btn, .verify-btn, button:not([type="submit"])');
    if (checkBtn) {
      await checkBtn.click();
      await new Promise(r => setTimeout(r, 3000));
    }
    console.log('  ✅ [3/5] Player ID entered and verified');

    // ── STEP 4: Select UC package ──────────────────────────────
    console.log(`  📄 [4/5] Selecting ${amount} UC package...`);
    const items = await page.$$('.product-item, .pack-item, .uc-item, [class*="product"], [class*="pack"]');
    let selected = false;
    for (const item of items) {
      const text = await page.evaluate(el => el.textContent, item);
      if (text.includes(String(amount))) {
        await item.click();
        selected = true;
        console.log(`  ✅ [4/5] Selected ${amount} UC package`);
        break;
      }
    }
    if (!selected) {
      console.error(`  ❌ [4/5] Could not find ${amount} UC package`);
      return false;
    }
    await new Promise(r => setTimeout(r, 1500));

    // ── STEP 5: Pay with saved card ────────────────────────────
    console.log('  📄 [5/5] Initiating payment with saved card...');

    // Click Buy Now (Pay button in the modal)
    const payBtnSelector = '.PayPriceDetailPc_payButtonContainer__AIedU button, .buy-btn, [class*="payButton"]';
    await page.waitForSelector(payBtnSelector, { timeout: 10000 });

    if (CONFIG.DRY_RUN) {
      console.log('  🧪 [DRY RUN] Would click Pay button here — skipping real payment.');
      console.log('  🧪 [DRY RUN] Set DRY_RUN=false in Railway Variables to enable real payments.');
      return false; // Safely return false and stop here
    }

    // This section only runs if DRY_RUN = false
    await page.click(payBtnSelector);
    await new Promise(r => setTimeout(r, 3000));

    // Select saved card payment method (if needed)
    const savedCard = await page.$('.saved-card, .my-card, [class*="savedCard"], [class*="credit"]');
    if (savedCard) {
      await savedCard.click();
      await new Promise(r => setTimeout(r, 1000));
    }

    // Click Final Confirm if another popup appears
    const finalConfirmBtn = await page.$('.pay-now, .confirm-pay, .checkout-btn, button[type="submit"]');
    if (finalConfirmBtn) await finalConfirmBtn.click();

    console.log('  ⏳ [5/5] Payment initiated! Waiting for OTP confirmation (up to 3 minutes)...');
    await updateOrderStatus(orderCode, 'awaiting_otp');

    // Wait for success indicator (up to 3 minutes for OTP)
    try {
      await page.waitForSelector('.success, .order-complete, [class*="success"], .purchase-success', { timeout: 180000 });
      console.log('  ✅ [5/5] Payment confirmed! PUBG UC charged successfully.');
      return true;
    } catch {
      console.error('  ❌ [5/5] Timed out waiting for OTP confirmation.');
      return false;
    }

  } catch (err) {
    console.error('  ❌ PUBG charge error:', err.message);
    return false;
  } finally {
    if (browser) await browser.close();
  }
}

// ============================================================
// START POLLING
// ============================================================
pollOrders(); // Run immediately on start
setInterval(pollOrders, CONFIG.POLL_INTERVAL_MS);
