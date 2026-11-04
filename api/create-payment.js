const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// استبدلي دي بالبيانات الحقيقية أو التجريبية بتاعتك من لوحة تحكم Paymob
const PAYMOB_API_KEY = "YOUR_PAYMOB_API_KEY_HERE";
const INTEGRATION_ID = YOUR_CARD_INTEGRATION_ID_HERE; // رقم صحيح (مثلاً 123456)

// الـ Endpoint اللي الفلاتر هيبعت لها الطلب
app.post('/api/create-payment', async (req, res) => {
    try {
        const { amount, firstName, lastName, email, phone } = req.body;
        const amountCents = Math.round(amount * 100); // تحويل المبلغ لقروش

        // 1. طلب الـ Auth Token من Paymob
        const authResponse = await axios.post('https://accept.paymob.com/api/auth/tokens', {
            api_key: PAYMOB_API_KEY
        });
        const authToken = authResponse.data.token;

        // 2. طلب تسجيل الـ Order
        const orderResponse = await axios.post('https://accept.paymob.com/api/ecommerce/orders', {
            auth_token: authToken,
            delivery_needed: "false",
            amount_cents: amountCents.toString(),
            currency: "EGP",
            items: []
        });
        const orderId = orderResponse.data.id;

        // 3. طلب الـ Payment Key النهائي
        const paymentKeyResponse = await axios.post('https://accept.paymob.com/api/acceptance/payment_keys', {
            auth_token: authToken,
            amount_cents: amountCents.toString(),
            expiration: 3600,
            order_id: orderId,
            billing_data: {
                first_name: firstName || "Test",
                last_name: lastName || "User",
                email: email || "test@example.com",
                phone_number: phone || "+201012345678",
                apartment: "NA", floor: "NA", street: "NA",
                building: "NA", shipping_method: "NA",
                postal_code: "NA", city: "NA", country: "EG", state: "NA"
            },
            currency: "EGP",
            integration_id: INTEGRATION_ID
        });

        const paymentKey = paymentKeyResponse.data.token;

        // إرجاع الـ Payment Key لتطبيق الفلاتر
        res.status(200).json({
            success: true,
            payment_key: paymentKey
        });

    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: "Payment initialization failed",
            error: error.response?.data || error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});