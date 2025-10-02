import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// Sample data for auto-seeding
const samplePurchaseOrders = [
  {
    poNumber: 'PO-2024-156',
    vendorName: 'Sea Shell',
    date: '2024-01-15',
    totalAmount: 15750.00,
    currency: 'AED',
    paymentTerms: 'Net 30',
    shippingAddress: 'Dubai Marina, Dubai, UAE',
    taxAmount: 1575.00
  },
  {
    poNumber: 'PO-2024-157',
    vendorName: 'Etisalat',
    date: '2024-01-18',
    totalAmount: 8450.00,
    currency: 'AED',
    paymentTerms: 'Net 45',
    shippingAddress: 'Sheikh Zayed Road, Dubai, UAE',
    taxAmount: 845.00
  },
  {
    poNumber: 'PO-2024-158',
    vendorName: 'ADNOC',
    date: '2024-01-20',
    totalAmount: 23200.00,
    currency: 'AED',
    paymentTerms: 'Net 60',
    shippingAddress: 'Corniche Road, Abu Dhabi, UAE',
    taxAmount: 2320.00
  },
  {
    poNumber: 'PO-2024-159',
    vendorName: 'MDC Business Management (ADNOC)',
    date: '2024-01-22',
    totalAmount: 12890.00,
    currency: 'AED',
    paymentTerms: 'Net 30',
    shippingAddress: 'Muroor Road, Abu Dhabi, UAE',
    taxAmount: 1289.00
  },
  {
    poNumber: 'PO-2024-160',
    vendorName: 'CFCE Integrated Facilities Management (ADNOC)',
    date: '2024-01-28',
    totalAmount: 45600.00,
    currency: 'AED',
    paymentTerms: 'Net 30',
    shippingAddress: 'Al Bateen, Abu Dhabi, UAE',
    taxAmount: 4560.00
  },
  {
    poNumber: 'PO-2024-161',
    vendorName: 'Sea Shell',
    date: '2024-02-01',
    totalAmount: 32100.00,
    currency: 'AED',
    paymentTerms: 'Net 60',
    shippingAddress: 'Dubai Marina, Dubai, UAE',
    taxAmount: 3210.00
  },
  {
    poNumber: 'PO-2024-162',
    vendorName: 'Etisalat',
    date: '2024-02-05',
    totalAmount: 18750.00,
    currency: 'AED',
    paymentTerms: 'Net 45',
    shippingAddress: 'Business Bay, Dubai, UAE',
    taxAmount: 1875.00
  },
  {
    poNumber: 'PO-2024-163',
    vendorName: 'ADNOC',
    date: '2024-02-08',
    totalAmount: 9800.00,
    currency: 'AED',
    paymentTerms: 'Net 30',
    shippingAddress: 'Yas Island, Abu Dhabi, UAE',
    taxAmount: 980.00
  },
  {
    poNumber: 'PO-2024-164',
    vendorName: 'MDC Business Management (ADNOC)',
    date: '2024-02-12',
    totalAmount: 5600.00,
    currency: 'AED',
    paymentTerms: 'Net 15',
    shippingAddress: 'Khalifa City, Abu Dhabi, UAE',
    taxAmount: 560.00
  },
  {
    poNumber: 'PO-2024-165',
    vendorName: 'CFCE Integrated Facilities Management (ADNOC)',
    date: '2024-02-15',
    totalAmount: 28900.00,
    currency: 'AED',
    paymentTerms: 'Net 30',
    shippingAddress: 'Ruwais, Abu Dhabi, UAE',
    taxAmount: 2890.00
  },
  {
    poNumber: 'PO-2024-166',
    vendorName: 'Sea Shell',
    date: '2024-02-18',
    totalAmount: 41200.00,
    currency: 'AED',
    paymentTerms: 'Net 45',
    shippingAddress: 'Jumeirah, Dubai, UAE',
    taxAmount: 4120.00
  },
  {
    poNumber: 'PO-2024-167',
    vendorName: 'Etisalat',
    date: '2024-02-20',
    totalAmount: 16500.00,
    currency: 'AED',
    paymentTerms: 'Net 30',
    shippingAddress: 'Dubai Silicon Oasis, Dubai, UAE',
    taxAmount: 1650.00
  }
];

const sampleInvoices = [
  // Perfect match
  {
    invoiceNumber: 'INV-2024-001',
    poNumber: 'PO-2024-156',
    vendorName: 'Sea Shell',
    invoiceDate: '2024-01-15',
    totalAmount: 15750.00,
    currency: 'AED',
    paymentTerms: 'Net 30',
    shippingAddress: 'Dubai Marina, Dubai, UAE',
    taxAmount: 1575.00,
    status: 'pending'
  },
  // Mismatch: payment terms
  {
    invoiceNumber: 'INV-2024-002',
    poNumber: 'PO-2024-157',
    vendorName: 'Etisalat',
    invoiceDate: '2024-01-18',
    totalAmount: 8450.00,
    currency: 'AED',
    paymentTerms: 'Net 30',
    shippingAddress: 'Sheikh Zayed Road, Dubai, UAE',
    taxAmount: 845.00,
    status: 'pending'
  },
  // Perfect match
  {
    invoiceNumber: 'INV-2024-003',
    poNumber: 'PO-2024-158',
    vendorName: 'ADNOC',
    invoiceDate: '2024-01-20',
    totalAmount: 23200.00,
    currency: 'AED',
    paymentTerms: 'Net 60',
    shippingAddress: 'Corniche Road, Abu Dhabi, UAE',
    taxAmount: 2320.00,
    status: 'pending'
  },
  // Multiple mismatches
  {
    invoiceNumber: 'INV-2024-004',
    poNumber: 'PO-2024-159',
    vendorName: 'MDC Business Management',
    invoiceDate: '2024-01-25',
    totalAmount: 12990.00,
    currency: 'AED',
    paymentTerms: 'Net 45',
    shippingAddress: 'Muroor Road, Abu Dhabi',
    taxAmount: 1299.00,
    status: 'pending'
  },
  // Perfect match
  {
    invoiceNumber: 'INV-2024-005',
    poNumber: 'PO-2024-160',
    vendorName: 'CFCE Integrated Facilities Management (ADNOC)',
    invoiceDate: '2024-01-28',
    totalAmount: 45600.00,
    currency: 'AED',
    paymentTerms: 'Net 30',
    shippingAddress: 'Al Bateen, Abu Dhabi, UAE',
    taxAmount: 4560.00,
    status: 'pending'
  },
  // Mismatch: amount and tax
  {
    invoiceNumber: 'INV-2024-006',
    poNumber: 'PO-2024-161',
    vendorName: 'Sea Shell',
    invoiceDate: '2024-02-01',
    totalAmount: 32500.00,
    currency: 'AED',
    paymentTerms: 'Net 60',
    shippingAddress: 'Dubai Marina, Dubai, UAE',
    taxAmount: 3250.00,
    status: 'pending'
  },
  // Perfect match
  {
    invoiceNumber: 'INV-2024-007',
    poNumber: 'PO-2024-162',
    vendorName: 'Etisalat',
    invoiceDate: '2024-02-05',
    totalAmount: 18750.00,
    currency: 'AED',
    paymentTerms: 'Net 45',
    shippingAddress: 'Business Bay, Dubai, UAE',
    taxAmount: 1875.00,
    status: 'pending'
  },
  // Mismatch: date and payment terms
  {
    invoiceNumber: 'INV-2024-008',
    poNumber: 'PO-2024-163',
    vendorName: 'ADNOC',
    invoiceDate: '2024-02-10',
    totalAmount: 9800.00,
    currency: 'AED',
    paymentTerms: 'Net 45',
    shippingAddress: 'Yas Island, Abu Dhabi, UAE',
    taxAmount: 980.00,
    status: 'pending'
  },
  // Severe mismatch: vendor name, amount, address
  {
    invoiceNumber: 'INV-2024-009',
    poNumber: 'PO-2024-164',
    vendorName: 'MDC Business Management',
    invoiceDate: '2024-02-12',
    totalAmount: 6200.00,
    currency: 'AED',
    paymentTerms: 'Net 15',
    shippingAddress: 'Khalifa City, Abu Dhabi',
    taxAmount: 620.00,
    status: 'pending'
  },
  // Perfect match
  {
    invoiceNumber: 'INV-2024-010',
    poNumber: 'PO-2024-165',
    vendorName: 'CFCE Integrated Facilities Management (ADNOC)',
    invoiceDate: '2024-02-15',
    totalAmount: 28900.00,
    currency: 'AED',
    paymentTerms: 'Net 30',
    shippingAddress: 'Ruwais, Abu Dhabi, UAE',
    taxAmount: 2890.00,
    status: 'pending'
  },
  // Mismatch: date, payment terms, and amount
  {
    invoiceNumber: 'INV-2024-011',
    poNumber: 'PO-2024-166',
    vendorName: 'Sea Shell',
    invoiceDate: '2024-02-20',
    totalAmount: 41800.00,
    currency: 'AED',
    paymentTerms: 'Net 30',
    shippingAddress: 'Jumeirah, Dubai, UAE',
    taxAmount: 4180.00,
    status: 'pending'
  },
  // Perfect match
  {
    invoiceNumber: 'INV-2024-012',
    poNumber: 'PO-2024-167',
    vendorName: 'Etisalat',
    invoiceDate: '2024-02-20',
    totalAmount: 16500.00,
    currency: 'AED',
    paymentTerms: 'Net 30',
    shippingAddress: 'Dubai Silicon Oasis, Dubai, UAE',
    taxAmount: 1650.00,
    status: 'pending'
  }
];

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('invoiceflow');
    
    // Check if data exists
    const invoiceCount = await db.collection('invoices').countDocuments();
    const poCount = await db.collection('purchase_orders').countDocuments();
    
    // Auto-seed if collections are empty
    if (invoiceCount === 0 || poCount === 0) {
      console.log('Collections are empty. Auto-seeding sample data...');
      
      // Clear any existing data
      await db.collection('invoices').deleteMany({});
      await db.collection('purchase_orders').deleteMany({});
      
      // Insert sample data
      await db.collection('purchase_orders').insertMany(samplePurchaseOrders);
      await db.collection('invoices').insertMany(sampleInvoices);
      
      console.log('Sample data seeded successfully!');
    }
    
    // Fetch invoices and purchase orders
    const invoices = await db.collection('invoices').find({}).toArray();
    const purchaseOrders = await db.collection('purchase_orders').find({}).toArray();
    
    return NextResponse.json({ 
      success: true, 
      data: {
        invoices,
        purchaseOrders
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch data from MongoDB';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
