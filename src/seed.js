require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const connectDB = require('./config/database');

const accounts = [
  { name: 'Admin',     email: 'admin@gmail.com',    phone: '01000000001', role: 'admin' },
  { name: 'Courier 1', email: 'courier1@gmail.com', phone: '01000000002', role: 'courier' },
  { name: 'Courier 2', email: 'courier2@gmail.com', phone: '01000000003', role: 'courier' }
];

const seed = async () => {
  await connectDB();
  const hashed = await bcrypt.hash('Test@1234', 10);

  for (const acc of accounts) {
    const exists = await User.findOne({ email: acc.email });
    if (exists) {
      console.log(`Skipped (already exists): ${acc.email}`);
      continue;
    }
    await User.create({ ...acc, password: hashed });
    console.log(`Created: ${acc.email} (${acc.role})`);
  }

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});