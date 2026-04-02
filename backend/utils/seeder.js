const mongoose = require('mongoose');
const dotenv   = require('dotenv');
dotenv.config();

const connectDB = require('../config/db');
const User      = require('../models/User');
const Product   = require('../models/Product');

const seed = async () => {
  await connectDB();
  console.log('\n🌱  MedChain Seeder\n' + '─'.repeat(50));

  await User.deleteMany({});
  await Product.deleteMany({});
  console.log('🗑️   Cleared existing data\n');

  // Create users
  const users = [
    { name:'Super Admin',          email:'admin@medchain.com',        password:'admin123',  role:'admin',        isApproved:true,  isVerified:true,  company:{ name:'MedChain Platform', address:{ city:'Mumbai', state:'Maharashtra' } } },
    { name:'Ramesh Pharma Ltd',    email:'manufacturer@medchain.com', password:'test1234', role:'manufacturer', isApproved:true,  isVerified:true,  company:{ name:'Ramesh Pharmaceuticals Ltd', gstNumber:'27RAMPF001A1Z5', address:{ city:'Pune', state:'Maharashtra', pincode:'411001' }, phone:'9876543210' } },
    { name:'National Distributors',email:'distributor@medchain.com',  password:'test1234', role:'distributor',  isApproved:true,  isVerified:true,  company:{ name:'National Medical Distributors', gstNumber:'27NATMD002B2Z6', address:{ city:'Mumbai', state:'Maharashtra', pincode:'400001' }, phone:'9876543211' } },
    { name:'City Medical Pharmacy', email:'pharmacy@medchain.com',    password:'test1234', role:'pharmacy',     isApproved:true,  isVerified:true,  company:{ name:'City Medical Pharmacy', gstNumber:'27CITMP003C3Z7', address:{ city:'Nashik', state:'Maharashtra', pincode:'422001' }, phone:'9876543212' } },
    { name:'Apollo Hospital',       email:'hospital@medchain.com',    password:'test1234', role:'hospital',     isApproved:true,  isVerified:true,  company:{ name:'Apollo Multispecialty Hospital', gstNumber:'27APOHS004D4Z8', address:{ city:'Nagpur', state:'Maharashtra', pincode:'440001' }, phone:'9876543213' } },
    { name:'New Chemist',           email:'pending@medchain.com',     password:'test1234', role:'pharmacy',     isApproved:false, isVerified:false, company:{ name:'New Chemist Store', address:{ city:'Aurangabad', state:'Maharashtra' } } },
  ];

  const created = {};
  for (const u of users) {
    const doc = await User.create(u);
    created[u.role] = doc._id;
    const status = u.isApproved ? '✅' : '⏳';
    console.log(`${status}  ${u.role.padEnd(15)} ${u.email}`);
  }

  // Products
  const products = [
    { name:'Paracetamol 500mg Tablets',   genericName:'Paracetamol',           brand:'RAMCET',    category:'tablet',  strength:'500mg',  packSize:'10 tabs/strip',  hsn:'30049099', sku:'MC-PRD-001', batchNumber:'BT-2025-001', expiryDate:new Date('2027-06-30'), pricing:{ mrp:30,  ptr:22, pts:18, gstPercent:12 }, minOrderQty:100, stock:50000, status:'active', schedule:'OTC', manufacturer:created['manufacturer'], requiresPrescription:false, description:'For fever and mild to moderate pain relief.', storageConditions:'Store below 25°C, protect from moisture.' },
    { name:'Amoxicillin 500mg Capsules',  genericName:'Amoxicillin',           brand:'RAMOX',     category:'capsule', strength:'500mg',  packSize:'10 caps/strip',  hsn:'30041090', sku:'MC-PRD-002', batchNumber:'BT-2025-002', expiryDate:new Date('2026-08-31'), pricing:{ mrp:95,  ptr:70, pts:60, gstPercent:12 }, minOrderQty:50,  stock:25000, status:'active', schedule:'H',   manufacturer:created['manufacturer'], requiresPrescription:true,  description:'Broad-spectrum antibiotic.', storageConditions:'Store below 25°C, keep dry.' },
    { name:'Metformin 500mg Tablets',     genericName:'Metformin Hydrochloride',brand:'RAMFORMIN', category:'tablet',  strength:'500mg',  packSize:'10 tabs/strip',  hsn:'30049042', sku:'MC-PRD-003', batchNumber:'BT-2025-003', expiryDate:new Date('2027-03-31'), pricing:{ mrp:45,  ptr:32, pts:28, gstPercent:12 }, minOrderQty:100, stock:40000, status:'active', schedule:'H',   manufacturer:created['manufacturer'], requiresPrescription:true,  description:'Oral anti-diabetic for Type 2 diabetes.', storageConditions:'Store at room temperature.' },
    { name:'Cetirizine 10mg Tablets',     genericName:'Cetirizine HCl',        brand:'RAMCET10',  category:'tablet',  strength:'10mg',   packSize:'10 tabs/strip',  hsn:'30049099', sku:'MC-PRD-004', batchNumber:'BT-2025-004', expiryDate:new Date('2027-09-30'), pricing:{ mrp:42,  ptr:30, pts:25, gstPercent:12 }, minOrderQty:50,  stock:30000, status:'active', schedule:'OTC', manufacturer:created['manufacturer'], requiresPrescription:false, description:'Antihistamine for allergies and hay fever.', storageConditions:'Store below 30°C.' },
    { name:'Pantoprazole 40mg Tablets',   genericName:'Pantoprazole Sodium',   brand:'RAMPAN',    category:'tablet',  strength:'40mg',   packSize:'10 tabs/strip',  hsn:'30049099', sku:'MC-PRD-005', batchNumber:'BT-2025-005', expiryDate:new Date('2026-12-31'), pricing:{ mrp:110, ptr:82, pts:70, gstPercent:12 }, minOrderQty:50,  stock:20000, status:'active', schedule:'H',   manufacturer:created['manufacturer'], requiresPrescription:true,  description:'Proton pump inhibitor for acidity.', storageConditions:'Store below 25°C.' },
    { name:'Azithromycin 500mg Tablets',  genericName:'Azithromycin',          brand:'RAMAZITH',  category:'tablet',  strength:'500mg',  packSize:'3 tabs/strip',   hsn:'30041090', sku:'MC-PRD-006', batchNumber:'BT-2025-006', expiryDate:new Date('2026-06-30'), pricing:{ mrp:185, ptr:140,pts:120,gstPercent:12}, minOrderQty:30,  stock:15000, status:'active', schedule:'H',   manufacturer:created['manufacturer'], requiresPrescription:true,  description:'Macrolide antibiotic for respiratory infections.', storageConditions:'Store below 30°C.' },
    { name:'Vitamin D3 60000 IU Capsules',genericName:'Cholecalciferol',       brand:'RAMD3',     category:'capsule', strength:'60000IU',packSize:'4 caps/strip',   hsn:'30049099', sku:'MC-PRD-007', batchNumber:'BT-2025-007', expiryDate:new Date('2027-12-31'), pricing:{ mrp:65,  ptr:48, pts:40, gstPercent:12 }, minOrderQty:50,  stock:35000, status:'active', schedule:'OTC', manufacturer:created['manufacturer'], requiresPrescription:false, description:'Vitamin D3 supplement for bone health.', storageConditions:'Store below 25°C, protect from light.' },
    { name:'Ondansetron 4mg Syrup',       genericName:'Ondansetron HCl',       brand:'RAMNAU',    category:'syrup',   strength:'4mg/5ml',packSize:'30ml bottle',    hsn:'30049099', sku:'MC-PRD-008', batchNumber:'BT-2025-008', expiryDate:new Date('2026-09-30'), pricing:{ mrp:55,  ptr:40, pts:34, gstPercent:12 }, minOrderQty:24,  stock:12000, status:'active', schedule:'H',   manufacturer:created['manufacturer'], requiresPrescription:true,  description:'Antiemetic for nausea and vomiting.', storageConditions:'Store below 30°C, protect from light.' },
  ];

  for (const p of products) {
    await Product.create(p);
    console.log(`💊  ${p.name}`);
  }

  console.log('\n' + '─'.repeat(50));
  console.log('✨  Seeding complete!\n');
  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(e => { console.error('Seeder error:', e.message); process.exit(1); });
