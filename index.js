import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const mongoUri = process.env.MONGO_URI;
const client = new MongoClient(mongoUri);

const app = express();
const port = process.env.PORT || 3000; 

app.use(cors());
app.use(express.json());

client.connect().then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Failed to connect to MongoDB', err);
  process.exit(1);
});

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const database = client.db('alphaingen');
    const collection = database.collection('contacts');

    const result = await collection.insertOne({ name, email, message });

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'santhiya30032@gmail.com',
      subject: 'New Contact Form Submission',
      text: `You have a new contact form submission:\n\nName: ${name}\nEmail: ${email}\nMessage: ${message}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    res.status(201).json({ message: 'Form submitted successfully', data: result });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ error: 'An error occurred while submitting the form' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
