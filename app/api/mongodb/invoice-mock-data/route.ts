import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb://localhost:27017/invoiceflow';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');

    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db('invoiceflow');
    const collection = db.collection('invoice_mock_data');

    let query = {};
    if (fileName) {
      query = { fileName: fileName };
    }

    const invoices = await collection.find(query).toArray();
    await client.close();

    return NextResponse.json({
      success: true,
      invoices: invoices.map(invoice => ({
        _id: invoice._id.toString(),
        fileName: invoice.fileName,
        poNumber: invoice.poNumber,
        vendorName: invoice.vendorName,
        date: invoice.date,
        totalAmount: invoice.totalAmount,
        currency: invoice.currency || 'AED',
        descriptionOfItems: invoice.descriptionOfItems,
        quantity: invoice.quantity
      }))
    });
  } catch (error) {
    console.error('Error fetching invoice mock data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoice mock data' },
      { status: 500 }
    );
  }
}
