const mongoose = require('mongoose');
const dotenv   = require('dotenv');
dotenv.config();

require('../config/db')().then(async () => {
  const User = require('../models/User');
  const r = await User.updateMany(
    { role: { $ne: 'admin' } },
    { $set: { isApproved:true, isVerified:true, isActive:true } }
  );
  console.log(`✅ Approved ${r.modifiedCount} users`);
  const users = await User.find({}, 'name email role isApproved');
  users.forEach(u => console.log(` ${u.isApproved?'✅':'⏳'} ${u.role.padEnd(14)} ${u.email}`));
  await mongoose.disconnect();
});
