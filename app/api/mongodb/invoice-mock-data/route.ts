import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb://localhost:27017/invoiceflow';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');

     const dummy_invoices = [
        {
          poNumber: "15744",
          vendorName: "Securiguard Middle East - LLC",
          date: "30 Jun 2025",
          totalAmount: 9200,
          currency: "AED",
          descriptionOfItems: "MGX Security Deployment x2 Security Guard",
          quantity: 1,
          fileName: "183653 -.pdf"
        },
        {
          poNumber: "17675",
          vendorName: "Dussmann",
          date: "20 Aug 2025",
          totalAmount: 14781.58,
          currency: "AED",
          descriptionOfItems: "Consumable Supplies",
          quantity: 1,
          fileName: "9147019838 - BCPO LAB Office Jun 2024 PO 17675.pdf"
        },
        {
          poNumber: "MDC\\5105486_1",
          vendorName: "Securiguard Middle East - LLC",
          date: "30 Jun 2025",
          totalAmount: 4600,
          currency: "AED",
          descriptionOfItems: "Security Guards (12 hours x 7 days) @ 1 personnel",
          quantity: 1,
          fileName: "183652 -.pdf"
        },
        {
          poNumber: "MDC\\5105486_1",
          vendorName: "Securiguard Middle East - LLC",
          date: "31 Jul 2025",
          totalAmount: 9200,
          currency: "AED",
          descriptionOfItems: "Security Services for Jul 2025 Mubadla Tower",
          quantity: 2,
          fileName: "185334 -INV.pdf"
        }
    ]

    const filteredInvoice = dummy_invoices.filter(invoice => invoice.fileName === fileName)

    return NextResponse.json({
      success: true,
      invoices: filteredInvoice
    });
  } catch (error) {
    console.error('Error fetching invoice mock data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoice mock data' },
      { status: 500 }
    );
  }
}
