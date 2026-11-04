const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const INTEGRATION_ID = process.env.INTEGRATION_ID || "6038035"; 

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
            items: [
                {
                    name: "Test Item",
                    amount_cents: amountCents.toString(),
                    description: "Payment for services",
                    quantity: "1"
                }
            ]
        });
        const orderId = orderResponse.data.id;

        const paymentKeyResponse = await axios.post('https://accept.paymob.com/api/acceptance/payment_keys', {
            auth_token: authToken,
            amount_cents: amountCents.toString(),
            expiration: 3600,
            order_id: orderId,
            billing_data: {
                first_name: firstName && firstName.trim() !== "" ? firstName : "Heba",
                last_name: lastName && lastName.trim() !== "" ? lastName : "Rostom",
                email: email && email.trim() !== "" ? email : "heba@example.com",
                phone_number: phone && phone.trim() !== "" ? phone : "+201006890773",
                apartment: "8", 
                floor: "4", 
                street: "Tahrir Street",
                building: "12", 
                shipping_method: "PKG",
                postal_code: "11511", 
                city: "Cairo", 
                country: "EG", 
                state: "Cairo"
            },
            currency: "EGP",
            integration_id: Number(INTEGRATION_ID) 
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