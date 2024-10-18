
import mongoose from "mongoose";
import express from "express";
import chalk from "chalk";
import dotenv from "dotenv";
import cors from "cors";
import nodemailer from 'nodemailer'
import PaymentLink from "./model.js";
import bodyParser from "body-parser";
import Stripe from 'stripe'
import { ReasonPhrases, StatusCodes } from "http-status-codes";

// .env configuration
dotenv.config();

// CORS Policy defined
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  credentials: false,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

const app = express();
app.use(cors(corsOptions));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

const domainEmail = process.env.EMAIL_USER || ''
const passwordEmail = process.env.EMAIL_PASS || ''
const secretKey = process.env.STRIPE_SECRET_KEY || ''
const signKey = process.env.STRIPE_SIGN || ''
const port = process.env.PORT || 3000

const mongoURI = `mongodb+srv://fahadalam12405:W5LKAuHZx8KtEyWm@cluster0.mtooe.mongodb.net/`;

mongoose
  .connect(mongoURI)
  .then(() =>
    console.log(chalk.white.bgGreen("---- Connected to MongoDB ----"))
  )
  .catch((err) =>
    console.log(chalk.white.bgRed("---- Error Connected MongoDB ----", err))
  );
// connection mongodb





app.get('/', async (req, res) => {
  res.send(`API is running on this ${port}`)
})




const stripe = Stripe(secretKey);



app.post('/create-payment-link', async (req, res) => {
  const { amount, currency, clientName, clientEmail } = req.body;
if (!amount || !currency || !clientName || !clientEmail) {
    console.log(req.body);
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, 
      currency,
    });

    const paymentLinkId = `payment-${Math.random().toString(36).substring(2, 11)}`;

    const newPaymentLink = new PaymentLink({
      paymentLinkId,
      paymentIntentId: paymentIntent.id,
      clientName,
      clientEmail,
      amount, 
    });

    await newPaymentLink.save();

    res.status(201).json({
      message: 'Payment link created successfully',
      paymentLinkId,
      paymentIntentId: paymentIntent.id,
      clientName,
      clientEmail,
      amount,
    });

  } catch (error) {
    // console.error('Error creating payment link:', error);
    res.status(500).json({ message: 'Failed to create payment link', error: error.message });
  }
});




app.get('/pay/:paymentLinkId', async (req, res) => {
  const paymentLinkId = req.params.paymentLinkId;

  try {
    // Fetch payment link from MongoDB
    const paymentLink = await PaymentLink.findOne({ paymentLinkId });

    if (!paymentLink) {
      return res.status(404).send('Payment link not found');
    }

    const { paymentIntentId, amount, clientName } = paymentLink;

    // Send back a page for payment (you can render HTML or use a frontend framework)
    res.send(`
      <h1>Complete Payment for ${clientName}</h1>
      <p>Amount: $${amount}</p>
      <form action="/process-payment/${paymentLinkId}" method="POST">
        <input type="text" name="cardNumber" placeholder="Card Number" required />
        <input type="text" name="expiryDate" placeholder="Expiry Date" required />
        <input type="text" name="cvv" placeholder="CVV" required />
        <button type="submit">Pay Now</button>
      </form>
    `);
  } catch (error) {
    console.error('Error fetching payment link:', error);
    res.status(500).send('Server error');
  }
});








app.post('/process-payment/:paymentLinkId', async (req, res) => {
  const paymentLinkId = req.params.paymentLinkId;
  const { cardNumber, expiryDate, cvv } = req.body;

  try {
    // Fetch payment link from MongoDB
    const paymentLink = await PaymentLink.findOne({ paymentLinkId });

    if (!paymentLink) {
      return res.status(404).send('Payment link not found');
    }

    const { paymentIntentId } = paymentLink;

    // Confirm payment intent
    await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method_data: {
        type: 'card',
        card: {
          number: cardNumber,
          exp_month: parseInt(expiryDate.split('/')[0]),
          exp_year: parseInt(expiryDate.split('/')[1]),
          cvc: cvv,
        },
      },
    });

    res.send('Payment successful!');
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).send({ error: error.message });
  }
});






app.get("*", (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({ message: ReasonPhrases.NOT_FOUND });
});

// listening port
app.listen(port, () =>
  console.log(chalk.white.bgBlue("Server started on port " + port))
);