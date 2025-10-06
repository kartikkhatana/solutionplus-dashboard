import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('solutionplus');
    const collection = db.collection('invoice_validations');
    
    const validationData = await request.json();
    
    const result = await collection.insertOne({
      ...validationData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return NextResponse.json({ 
      success: true, 
      id: result.insertedId.toString()
    });
  } catch (error: any) {
    console.error('MongoDB Insert Validation Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to store validation data'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('solutionplus');
    const collection = db.collection('invoice_validations');
    
    const searchParams = request.nextUrl.searchParams;
    const actionStatus = searchParams.get('actionStatus');
    const vendorEmail = searchParams.get('vendorEmail');
    
    const query: any = {};
    if (actionStatus) query.actionStatus = actionStatus;
    if (vendorEmail) query.vendorEmail = vendorEmail;
    
    const validations = await collection.find(query).sort({ createdAt: -1 }).toArray();
    
    // Convert ObjectId to string for JSON serialization
    const validationsWithStringIds = validations.map(validation => ({
      ...validation,
      _id: validation._id.toString()
    }));
    
    return NextResponse.json({ 
      success: true, 
      validations: validationsWithStringIds
    });
  } catch (error: any) {
    console.error('MongoDB Query Validations Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch validation data'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('solutionplus');
    const collection = db.collection('invoice_validations');
    
    const { id, actionStatus, actionDate, actionBy, summary } = await request.json();
    
    if (!id) {
      return NextResponse.json({ 
        error: 'Missing validation ID' 
      }, { status: 400 });
    }
    
    const updateData: any = {
      updatedAt: new Date()
    };
    
    if (actionStatus) updateData.actionStatus = actionStatus;
    if (actionDate) updateData.actionDate = new Date(actionDate);
    if (actionBy) updateData.actionBy = actionBy;
    if (summary) updateData.summary = summary;
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    return NextResponse.json({ 
      success: true, 
      modified: result.modifiedCount 
    });
  } catch (error: any) {
    console.error('MongoDB Update Validation Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to update validation'
    }, { status: 500 });
  }
}
