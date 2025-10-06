import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb://localhost:27017/invoiceflow';

const invoiceData = [
  {
    "poNumber": "15744",
    "vendorName": "Securiguard Middle East - LLC",
    "date": "30 Jun 2025",
    "totalAmount": 9200,
    "currency": "AED",
    "descriptionOfItems": "MGX Security Deployment x2 Security Guard",
    "quantity": 1,
    "fileName": "183653 -.pdf"
  },
  {
    "poNumber": "17675",
    "vendorName": "Dussmann",
    "date": "20 Aug 2025",
    "totalAmount": 14781.58,
    "currency": "AED",
    "descriptionOfItems": "Consumable Supplies",
    "quantity": 1,
    "fileName": "9147019838 - BCPO LAB Office Jun 2024 PO 17675.pdf"
  },
  {
    "poNumber": "MDC\\5105486_1",
    "vendorName": "Securiguard Middle East - LLC",
    "date": "30 Jun 2025",
    "totalAmount": 4600,
    "currency": "AED",
    "descriptionOfItems": "Security Guards (12 hours x 7 days) @ 1 personnel",
    "quantity": 1,
    "fileName": "183652 -.pdf"
  },
  {
    "poNumber": "MDC\\5105486_1",
    "vendorName": "Securiguard Middle East - LLC",
    "date": "30 Jun 2025",
    "totalAmount": 4600,
    "currency": "AED",
    "descriptionOfItems": "Security Guards (12 hours x 7 days) @ 1 personnel",
    "quantity": 1,
    "fileName": "185334 -INV.pdf"
  }
];

const purchaseOrderData = [
  {
    "poNumber": "15744",
    "vendorName": "Securiguard Middle East - LLC",
    "date": "30 Jun 2025",
    "totalAmount": 9200,
    "currency": "AED",
    "descriptionOfItems": "MGX Security Deployment x2 Security Guard",
    "quantity": 1,
    "fileName": "183653 -.pdf",
    "paymentTerms": "Net 30",
    "shippingAddress": "Dubai Marina, UAE",
    "taxAmount": 920,
    "rate": 9200
  },
  {
    "poNumber": "17675",
    "vendorName": "Dussmann",
    "date": "20 Aug 2025",
    "totalAmount": 14781.58,
    "currency": "AED",
    "descriptionOfItems": "Consumable Supplies",
    "quantity": 1,
    "fileName": "9147019838 - BCPO LAB Office Jun 2024 PO 17675.pdf",
    "paymentTerms": "Net 45",
    "shippingAddress": "Sheikh Zayed Road, Dubai",
    "taxAmount": 1478.16,
    "rate": 14781.58
  },
  {
    "poNumber": "MDC\\5105486_1",
    "vendorName": "Securiguard Middle East - LLC",
    "date": "30 Jun 2025",
    "totalAmount": 4600,
    "currency": "AED",
    "descriptionOfItems": "Security Guards (12 hours x 7 days) @ 1 personnel",
    "quantity": 1,
    "fileName": "183652 -.pdf",
    "paymentTerms": "Net 30",
    "shippingAddress": "Corniche Road, Abu Dhabi",
    "taxAmount": 460,
    "rate": 4600
  },
  {
    "poNumber": "MDC\\5105486_1",
    "vendorName": "Securiguard Middle East - LLC",
    "date": "30 Jun 2025",
    "totalAmount": 4600,
    "currency": "AED",
    "descriptionOfItems": "Security Guards (12 hours x 7 days) @ 1 personnel",
    "quantity": 1,
    "fileName": "185334 -INV.pdf",
    "paymentTerms": "Net 30",
    "shippingAddress": "Corniche Road, Abu Dhabi",
    "taxAmount": 460,
    "rate": 4600
  }
];

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db('invoiceflow');

    // Clear existing data
    console.log('Clearing existing data...');
    await db.collection('invoice_mock_data').deleteMany({});
    await db.collection('purchase_order_dumps').deleteMany({});

    // Insert invoice data
    console.log('Inserting invoice mock data...');
    const invoiceResult = await db.collection('invoice_mock_data').insertMany(invoiceData);
    console.log(`Inserted ${invoiceResult.insertedCount} invoice records`);

    // Insert purchase order data
    console.log('Inserting purchase order data...');
    const poResult = await db.collection('purchase_order_dumps').insertMany(purchaseOrderData);
    console.log(`Inserted ${poResult.insertedCount} purchase order records`);

    await client.close();
    console.log('Database seeded successfully!');
    
    // Log the data for verification
    console.log('\nInvoice Data:');
    invoiceData.forEach((invoice, index) => {
      console.log(`${index + 1}. ${invoice.fileName} - ${invoice.vendorName} - ${invoice.poNumber}`);
    });
    
    console.log('\nPurchase Order Data:');
    purchaseOrderData.forEach((po, index) => {
      console.log(`${index + 1}. ${po.fileName} - ${po.vendorName} - ${po.poNumber}`);
    });

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
