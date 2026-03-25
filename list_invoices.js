
const PUBLIC_KEY = '40588|LWu0mVHnONnSsXHCCjCW1Wlnalw48fD1mOj6oSah';

async function listInvoices() {
    try {
        const res = await fetch(`https://prodapi.slick-pay.com/api/v2/merchants/invoices`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${PUBLIC_KEY}`
            }
        });
        const data = await res.json();
        console.log('Merchant Invoices:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.log('Error listing invoices:', err.message);
    }
}

listInvoices();
