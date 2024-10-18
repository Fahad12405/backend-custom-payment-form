import mongoose from "mongoose";

// Define the schema for the payment link
const paymentLinkSchema = new mongoose.Schema({
  paymentLinkId: {
    type: String,
    required: true,
    unique: true, // Ensure uniqueness for each payment link ID
  },
  paymentIntentId: {
    type: String,
    required: true, // This is mandatory as it represents the payment intent
  },
  clientName: {
    type: String,
    required: true, // Ensure the client name is provided
  },
  clientEmail: {
    type: String,
    required: true, // Ensure the client email is provided
    match: /.+\@.+\..+/, // Basic email validation regex
  },
  amount: {
    type: Number,
    required: true, // Ensure the amount is provided
    min: 0,        // Payment amount should not be negative
  },
}, {
  timestamps: true, // Automatically add createdAt and updatedAt timestamps
});

// Create a model from the schema
const PaymentLink = mongoose.model('PaymentLink', paymentLinkSchema);

export default PaymentLink;