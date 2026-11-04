const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const INTEGRATION_ID = process.env.INTEGRATION_ID; 

app.post('/api/create-payment', async (req, res) => {
    try {
        const { amount, firstName, lastName, email, phone } = req.body;
        const amountCents = Math.round(amount * 100); 

        const authResponse = await axios.post('https://accept.paymob.com/api/auth/tokens', {
            api_key: PAYMOB_API_KEY
        });
        const authToken = authResponse.data.token;

        const orderResponse = await axios.post('https://accept.paymob.com/api/ecommerce/orders', {
            auth_token: authToken,
            delivery_needed: "false",
            amount_cents: amountCents.toString(),
            currency: "EGP",
            items: []
        });
        const orderId = orderResponse.data.id;

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

        return res.status(200).json({
            success: true,
            payment_key: paymentKey
        });

    } catch (error) {
        console.error("Paymob Error:", error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: "Payment initialization failed",
            error: error.response?.data || error.message
        });
    }
});

module.exports = app;