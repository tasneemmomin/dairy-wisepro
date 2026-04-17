/**
 * WhatsApp Notification Utility
 * 
 * In a real production environment with a paid API (e.g., Twilio, Wati), 
 * this module would send HTTP requests to the third-party provider to deliver automated SMS/WhatsApp.
 * 
 * Currently, it provides functionality to generate WhatsApp Action URLs
 * and mock the API sending for logs.
 */

// Format phone number to E.164 (removing '+' for wa.me links)
const formatPhoneForWA = (phone) => {
    if (!phone) return null;
    const digitsOnly = String(phone).replace(/\D/g, '');
    // If it's 10 digits, assume India (+91)
    if (digitsOnly.length === 10) return `91${digitsOnly}`;
    return digitsOnly;
};

// Owner's Default Number (Should ideally come from .env or DB)
const OWNER_WHATSAPP = process.env.OWNER_WHATSAPP || '918766997752';

const WhatsAppService = {
    /**
     * Generates a link to open WhatsApp and send a pre-filled message.
     * Useful for redirecting the customer to pay the owner.
     */
    generatePaymentLink: (orderId, amount, customerName) => {
        const message = `Hello Vasantdada Agency! 👋\n\nI want to pay for my order.\n*Order ID:* ${orderId}\n*Amount:* ₹${amount}\n*Customer:* ${customerName}\n\nPlease share your UPI or confirm payment.`;
        const encodedMessage = encodeURIComponent(message);
        return `https://wa.me/${OWNER_WHATSAPP}?text=${encodedMessage}`;
    },

    /**
     * Mocks sending a notification to a customer or owner.
     * Replace the console.log with an actual Axios call to Twilio/Interakt in production.
     */
    sendNotification: async (toPhone, templateContext) => {
        const formattedPhone = formatPhoneForWA(toPhone);
        if (!formattedPhone) return;

        // Build a readable message for the mock log
        let messageText = `Notification to ${formattedPhone}: `;
        if (templateContext.type === 'ORDER_CREATED') {
            messageText += `Order ${templateContext.orderId} for ₹${templateContext.amount} has been created.`;
        } else if (templateContext.type === 'PAYMENT_APPROVED') {
            messageText += `Your payment for Order ${templateContext.orderId} was approved!`;
        } else if (templateContext.type === 'NEW_PAYMENT_ALERT_OWNER') {
            messageText += `New payment received for Order ${templateContext.orderId}. Customer: ${templateContext.customerName}. Verify in dashboard.`;
        }

        console.log(`\n🟢 [WHATSAPP API MOCK] Sending message -> ${formattedPhone}`);
        console.log(`💬 Message: ${messageText}\n`);

        // Real integration example (pseudo-code):
        // await axios.post('https://api.interakt.ai/v1/public/message/', {
        //     countryCode: "+91",
        //     phoneNumber: formattedPhone.slice(2),
        //     type: "Template",
        //     template: { name: templateContext.templateName, languageCode: "en" }
        // }, { headers: { Authorization: `Basic ${API_KEY}` } });

        return true;
    }
};

module.exports = WhatsAppService;
