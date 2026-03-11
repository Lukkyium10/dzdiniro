const fs = require('fs');

async function sendToDiscord() {
  const WEBHOOK_URL = 'https://discord.com/api/webhooks/1480604281403867336/UR5RBGKHD6waNs64KgvGO3FxmSx8zJ2lrZCebvgVoY0thmugwx_OkB9uOCJYcUMmh-r5';
  
  const order = {
    id: Math.floor(100000 + Math.random() * 900000).toString(),
    serviceType: 'games',
    selectedService: 'games',
    game: 'tiktok',
    serviceLabel: 'TikTok - عملات',
    playerId: '0555123456',
    packageLabel: '700 عملة TikTok',
    price: '210 ألف',
    paymentMethod: 'cash',
    referral: null
  };

  let methodLabel = 'نقداً (Cash)';
  let proofLabel = '📌 تنبيه: العميل اختار الدفع نقداً، يرجى التواصل معه.';

  let message = `🚀 **طلب جديد - DzDiniro (تجربة نظام التيكتوك نقداً)** 🚀\n━━━━━━━━━━━━━━━\n📋 **رقم الطلب:** #${order.id}\n🛒 **الخدمة:** ${order.serviceLabel}\n`;

  const idLabel = order.game === 'tiktok' ? 'رقم الهاتف' : 'معرّف اللعبة';
  message += `👤 **${idLabel}:** \`${order.playerId}\`\n📦 **الباقة:** ${order.packageLabel}\n`;

  message += `💰 **المبلغ/السعر:** ${order.price}\n💳 **طريقة الدفع:** ${methodLabel}\n📅 **التاريخ:** ${new Date().toLocaleString('ar-DZ')}\n━━━━━━━━━━━━━━━\n${proofLabel}`;

  const formData = new FormData();
  formData.append('content', message);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      body: formData
    });
    console.log("Webhook sent successfully", response.status);
  } catch (error) {
    console.error("Error sending webhook", error);
  }
}

sendToDiscord();
