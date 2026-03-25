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

    // ── STEP 1: Login ──────────────────────────────────────────
    console.log('  📄 [1/5] Opening Shop2Game login page...');
    await page.goto('https://shop2game.com/login', { waitUntil: 'networkidle2', timeout: 60000 });

    // Fill email
    await page.waitForSelector('input[type="email"], input[name="email"], #email', { timeout: 15000 });
    await page.type('input[type="email"], input[name="email"], #email', CONFIG.FREEFIRE_SHOP2GAME_EMAIL, { delay: 50 });

    // Fill password
    await page.type('input[type="password"], input[name="password"], #password', CONFIG.FREEFIRE_SHOP2GAME_PASSWORD, { delay: 50 });

    // Submit login
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.click('button[type="submit"], .btn-login, .login-btn'),
    ]);
    console.log('  ✅ [1/5] Logged in to Shop2Game');

    // ── STEP 2: Go to Free Fire top-up page ────────────────────
    console.log('  📄 [2/5] Navigating to Free Fire top-up...');
    await page.goto('https://shop2game.com/app/100067/topup', { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 2000));

    // ── STEP 3: Enter Player ID ────────────────────────────────
    console.log(`  📄 [3/5] Entering player ID: ${playerId}...`);
    // Shop2Game usually has a UID input field
    await page.waitForSelector('input[placeholder*="ID"], input[placeholder*="UID"], input[name*="uid"], input[name*="id"], #uid', { timeout: 15000 });
    const uidInput = await page.$('input[placeholder*="ID"], input[placeholder*="UID"], input[name*="uid"], input[name*="id"], #uid');
    await uidInput.click({ clickCount: 3 });
    await uidInput.type(playerId, { delay: 50 });

    // Click verify/check button if it exists
    const verifyBtn = await page.$('button:not([type="submit"]):not(.pay), .verify-btn, .check-btn');
    if (verifyBtn) {
      await verifyBtn.click();
      await new Promise(r => setTimeout(r, 2000));
    }
    console.log('  ✅ [3/5] Player ID entered');

    // ── STEP 4: Select the correct package ─────────────────────
    console.log(`  📄 [4/5] Selecting package with ${amount} diamonds...`);
    // Find packages by text content matching the amount
    const packages = await page.$$('.product-item, .package-item, .topup-item, [class*="product"], [class*="package"]');
    let selected = false;
    for (const pkg of packages) {
      const text = await page.evaluate(el => el.textContent, pkg);
      if (text.includes(String(amount)) || text.includes(amount)) {
        await pkg.click();
        selected = true;
        console.log(`  ✅ [4/5] Selected package: ${amount} diamonds`);
        break;
      }
    }
    if (!selected) {
      console.error(`  ❌ [4/5] Could not find package for ${amount} diamonds`);
      return false;
    }
    await new Promise(r => setTimeout(r, 1000));

    // ── STEP 5: Pay ────────────────────────────────────────────
    console.log('  📄 [5/5] Initiating payment...');
    // Click the main Buy/Pay button
    await page.waitForSelector('button[type="submit"], .btn-buy, .buy-btn, .pay-btn', { timeout: 10000 });

    if (CONFIG.DRY_RUN) {
      console.log('  🧪 [DRY RUN] Would click Pay button here — skipping real payment.');
      console.log('  🧪 [DRY RUN] Set DRY_RUN=false in Railway Variables to enable real payments.');
      return false; // return false so order goes back to pending
    }

    await page.click('button[type="submit"], .btn-buy, .buy-btn, .pay-btn');
    await new Promise(r => setTimeout(r, 3000));

    // Select saved card if a payment method page appears
    const cardOption = await page.$('.saved-card, .card-item, [class*="credit-card"], [class*="saved"]');
    if (cardOption) {
      await cardOption.click();
      await new Promise(r => setTimeout(r, 1000));
    }

    // Fill card details if a card form appears (Shop2Game has no saved card feature)
    const cardNumberInput = await page.$('input[name*="card"], input[placeholder*="card number"], input[placeholder*="Card Number"], #cardNumber, [class*="cardNumber"]');
    if (cardNumberInput) {
      console.log('  💳 Filling card details...');
      await cardNumberInput.click({ clickCount: 3 });
      await cardNumberInput.type(CONFIG.CARD_NUMBER, { delay: 60 });

      // Expiry month
      const expiryMonth = await page.$('input[name*="month"], input[placeholder*="MM"], select[name*="month"]');
      if (expiryMonth) {
        const tagName = await page.evaluate(el => el.tagName.toLowerCase(), expiryMonth);
        if (tagName === 'select') {
          await page.select('select[name*="month"]', CONFIG.CARD_EXPIRY_MONTH);
        } else {
          await expiryMonth.click({ clickCount: 3 });
          await expiryMonth.type(CONFIG.CARD_EXPIRY_MONTH, { delay: 40 });
        }
      }

      // Expiry year
      const expiryYear = await page.$('input[name*="year"], input[placeholder*="YY"], select[name*="year"]');
      if (expiryYear) {
        const tagName = await page.evaluate(el => el.tagName.toLowerCase(), expiryYear);
        if (tagName === 'select') {
          await page.select('select[name*="year"]', CONFIG.CARD_EXPIRY_YEAR);
        } else {
          await expiryYear.click({ clickCount: 3 });
          await expiryYear.type(CONFIG.CARD_EXPIRY_YEAR, { delay: 40 });
        }
      }

      // Combined expiry (MM/YY format)
      const expiryCombo = await page.$('input[name*="expir"], input[placeholder*="MM/YY"], input[placeholder*="MM/YYYY"]');
      if (expiryCombo) {
        await expiryCombo.click({ clickCount: 3 });
        await expiryCombo.type(`${CONFIG.CARD_EXPIRY_MONTH}/${CONFIG.CARD_EXPIRY_YEAR}`, { delay: 40 });
      }

      // CVV
      const cvvInput = await page.$('input[name*="cvv"], input[name*="cvc"], input[placeholder*="CVV"], input[placeholder*="CVC"], #cvv, #cvc');
      if (cvvInput) {
        await cvvInput.click({ clickCount: 3 });
        await cvvInput.type(CONFIG.CARD_CVV, { delay: 50 });
      }
      console.log('  ✅ Card details filled');
    }

    // Click confirm/pay button
    const confirmBtn = await page.$('.confirm-payment, .btn-confirm, .pay-now, button[type="submit"]');
    if (confirmBtn) await confirmBtn.click();

    console.log('  ⏳ [5/5] Payment initiated! Waiting for OTP confirmation from your phone (up to 3 minutes)...');
    await updateOrderStatus(orderCode, 'awaiting_otp');

    // Wait for success page (up to 3 minutes for user to confirm OTP)
    try {
      await page.waitForSelector('.success, .order-success, [class*="success"], .thank-you', { timeout: 180000 });
      console.log('  ✅ [5/5] Payment confirmed! Free Fire charge successful.');
      return true;
    } catch {
      console.error('  ❌ [5/5] Timed out waiting for payment confirmation.');
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
    await new Promise(r => setTimeout(r, 3000));

    // Click the "تسجيل الدخول" button in the top nav to open dropdown
    console.log('  🔐 [1/5] Clicking login button...');
    await page.waitForSelector('.DropNavBox_btn_wrap__ZJEku', { timeout: 15000 });
    await page.click('.DropNavBox_btn_wrap__ZJEku');
    await new Promise(r => setTimeout(r, 2000));

    // Click "تسجيل الدخول/الاشتراك بوسائل أخرى" (Other sign-in methods)
    console.log('  🔐 [1/5] Clicking "other sign-in methods"...');
    await page.waitForSelector('.to-other-login', { timeout: 10000 });
    await page.click('.to-other-login');
    await new Promise(r => setTimeout(r, 2000));

    // Fill email in the modal
    console.log('  📧 [1/5] Entering email...');
    await page.waitForSelector('p.inp input[type="email"]', { timeout: 15000 });
    await page.click('p.inp input[type="email"]', { clickCount: 3 });
    await page.type('p.inp input[type="email"]', CONFIG.PUBG_MIDASBUY_EMAIL, { delay: 60 });

    // Click "يكمل" (Continue) button
    console.log('  ➡️ [1/5] Clicking Continue...');
    await page.waitForSelector('.comfirm-btn', { timeout: 10000 });
    await page.click('.comfirm-btn');
    await new Promise(r => setTimeout(r, 2000));

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
