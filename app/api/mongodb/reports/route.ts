import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionString, database, collection, report } = body;

    if (!connectionString || !database || !collection || !report) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(connectionString);
    
    await client.connect();
    const db = client.db(database);
    const reportCollection = db.collection(collection);

    // Insert the report
    const result = await reportCollection.insertOne(report);

    await client.close();

    return NextResponse.json({
      success: true,
      message: 'Report saved successfully',
      insertedId: result.insertedId
    });

  } catch (error: any) {
    console.error('Error saving report to MongoDB:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to save report' },
      { status: 500 }
    );
  }
}
