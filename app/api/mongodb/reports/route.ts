import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

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

  } catch (error) {
    console.error('Error saving report to MongoDB:', error);
    const message = error instanceof Error ? error.message : 'Failed to save report';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
