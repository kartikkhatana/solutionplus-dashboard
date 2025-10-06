import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('solutionplus');
    const collection = db.collection('email_invoices');
    
    const emailData = await request.json();
    
    const result = await collection.insertOne({
      ...emailData,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return NextResponse.json({ 
      success: true, 
      id: result.insertedId.toString()
    });
  } catch (error: any) {
    console.error('MongoDB Insert Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to store email data'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('solutionplus');
    const collection = db.collection('email_invoices');
    
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    
    const query = status ? { status } : {};
    const emails = await collection.find(query).sort({ createdAt: -1 }).toArray();
    
    // Convert ObjectId to string for JSON serialization
    const emailsWithStringIds = emails.map(email => ({
      ...email,
      _id: email._id.toString()
    }));
    
    return NextResponse.json({ 
      success: true, 
      emails: emailsWithStringIds
    });
  } catch (error: any) {
    console.error('MongoDB Query Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch email data'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('solutionplus');
    const collection = db.collection('email_invoices');
    
    const { id, status } = await request.json();
    
    if (!id || !status) {
      return NextResponse.json({ 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }
    
    const result = await collection.updateOne(
      { _id: id },
      { 
        $set: { 
          status, 
          updatedAt: new Date() 
        } 
      }
    );
    
    return NextResponse.json({ 
      success: true, 
      modified: result.modifiedCount 
    });
  } catch (error: any) {
    console.error('MongoDB Update Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to update email status'
    }, { status: 500 });
  }
}
