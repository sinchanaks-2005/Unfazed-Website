const Razorpay = require("razorpay");

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

let razorpayInstance = null;

if (keyId && keySecret) {
  razorpayInstance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
} else {
  console.warn(
    "Razorpay credentials are not configured. Payment features will remain unavailable until RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are added to backend/.env."
  );

  // Safe development placeholder.
  // Payment controllers must NOT treat this as a real payment gateway.
  razorpayInstance = {
    orders: {
      create: async () => {
        throw new Error(
          "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env."
        );
      },
    },
    payments: {
      fetch: async () => {
        throw new Error(
          "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env."
        );
      },
    },
  };
}

module.exports = razorpayInstance;