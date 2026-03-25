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
import puppeteer from 'puppeteer';

// ============================================================
// CONFIG — Edit these values before running
// ============================================================
const CONFIG = {
  // Supabase credentials (use Service Role Key for full DB access)
  SUPABASE_URL: 'https://dixrpmlkbxbopoebsslk.supabase.co',
  SUPABASE_SERVICE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpeHJwbWxrYnhib3BvZWJzc2xrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzMwMDEzNSwiZXhwIjoyMDg4ODc2MTM1fQ.KI2DfOjwdgd8E7BMGhFK7VdMTs-9qmdhyZsK_ST3yu0', // ← Replace with your Service Role Key from Supabase > Settings > API

  // Allowed emails for automation (security check)
  AUTOMATED_EMAILS: ['atia7475@gmail.com', 'd.i.d.i.n.e.lke@gmail.com'],

  // Free Fire — Shop2Game credentials
  FREEFIRE_SHOP2GAME_EMAIL: 'd.i.d.i.n.e.lke@gmail.com', // ← Replace
  FREEFIRE_SHOP2GAME_PASSWORD: 'newway00K*', // ← Replace

  // PUBG — Midasbuy credentials
  PUBG_MIDASBUY_EMAIL: 'd.i.d.i.n.e.lke@gmail.com', // ← Replace
  PUBG_MIDASBUY_PASSWORD: 'SECRET17k', // ← Replace

  // Polling interval in milliseconds (30 seconds)
  POLL_INTERVAL_MS: 30000,

  // Run browser in headless mode (true = no window, false = show browser)
  HEADLESS: true,
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
  console.log(`  🔥 Starting Free Fire charge for player ${playerId}...`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: CONFIG.HEADLESS,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Step 1: Go to Shop2Game
    await page.goto('https://shop2game.com/app/100067', { waitUntil: 'networkidle2', timeout: 60000 });
    console.log('  📄 Navigated to Shop2Game Free Fire page');

    // Step 2: Click Login / Account
    // NOTE: You may need to adjust selectors here based on the actual site
    // If already logged in via cookies, skip to step 4

    // Step 3: Enter Player ID and zone (if needed)
    // Shop2Game usually asks for UID and Zone ID
    // Example (adjust selectors as needed):
    // await page.waitForSelector('#uid_input');
    // await page.type('#uid_input', playerId);

    // >>> IMPORTANT: The exact automation steps depend on the current Shop2Game UI.
    // >>> You need to inspect the site manually on first run and update the selectors below.
    // >>> The logic is:
    // >>>   1. Enter UID (player ID)
    // >>>   2. Select the correct diamond package matching `amount`
    // >>>   3. Choose payment method (use pre-loaded wallet/balance)
    // >>>   4. Confirm purchase
    // >>>   5. Return success or failure

    console.log(`  ⚠️ STUB: Free Fire automation not fully configured yet.`);
    console.log(`  Please complete the Puppeteer selectors in the chargeFreeFire() function in worker.js`);

    // For now, return false so the order goes back to 'pending' for manual review
    return false;

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
  console.log(`  🎮 Starting PUBG charge for player ${playerId}...`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: CONFIG.HEADLESS,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Step 1: Go to Midasbuy PUBG Mobile
    await page.goto('https://www.midasbuy.com/midasbuy/uc/buy/pubgm', { waitUntil: 'networkidle2', timeout: 60000 });
    console.log('  📄 Navigated to Midasbuy PUBG page');

    // >>> IMPORTANT: The exact automation steps depend on the current Midasbuy UI.
    // >>> You need to inspect the site manually on first run and update the selectors below.
    // >>> The logic is:
    // >>>   1. Enter Player ID
    // >>>   2. Select UC package matching `amount`
    // >>>   3. Choose payment method (pre-loaded credits or voucher)
    // >>>   4. Confirm purchase
    // >>>   5. Return success or failure

    console.log(`  ⚠️ STUB: PUBG automation not fully configured yet.`);
    console.log(`  Please complete the Puppeteer selectors in the chargePUBG() function in worker.js`);

    // For now, return false so the order goes back to 'pending' for manual review
    return false;

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
