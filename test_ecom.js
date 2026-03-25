
const PUBLIC_KEY = '40588|LWu0mVHnONnSsXHCCjCW1Wlnalw48fD1mOj6oSah';

const endpoints = [
    'merchants/invoices/links',
    'merchants/invoices-links',
    'merchants/links',
    'merchants/ecom-links',
    'merchants/ecoms',
    'merchants/products',
    'merchants/store',
    'users/links',
    'users/invoice-links'
];

async function testEndpoints() {
    for (const ep of endpoints) {
        console.log(`Testing: ${ep}...`);
        try {
            const res = await fetch(`https://prodapi.slick-pay.com/api/v2/${ep}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${PUBLIC_KEY}`
                }
            });
            const data = await res.json();
            console.log(`✅ Success on ${ep}:`, res.status, JSON.stringify(data).substring(0, 200));
        } catch (err) {
            console.log(`❌ Fail on ${ep}:`, err.message);
        }
    }
}

testEndpoints();
