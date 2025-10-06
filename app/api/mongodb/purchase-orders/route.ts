import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb://localhost:27017/invoiceflow';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');

    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db('invoiceflow');
    const collection = db.collection('purchase_order_dumps');

    let query = {};
    if (fileName) {
      query = { fileName: fileName };
    }

    const purchaseOrders = await collection.find(query).toArray();
    await client.close();

    return NextResponse.json({
      success: true,
      purchaseOrders: purchaseOrders.map(po => ({
        _id: po._id.toString(),
        fileName: po.fileName,
        poNumber: po.poNumber,
        vendorName: po.vendorName,
        date: po.date,
        totalAmount: po.totalAmount,
        currency: po.currency || 'AED',
        descriptionOfItems: po.descriptionOfItems,
        quantity: po.quantity,
        rate: po.rate,
        paymentTerms: po.paymentTerms,
        shippingAddress: po.shippingAddress,
        taxAmount: po.taxAmount
      }))
    });
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch purchase orders' },
      { status: 500 }
    );
  }
}
