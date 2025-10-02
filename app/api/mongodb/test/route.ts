import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function POST(request: Request) {
  let client: MongoClient | null = null;
  
  try {
    const { connectionString } = await request.json();
    
    // Use provided connection string or default to localhost
    const uri = connectionString || 'mongodb://localhost:27017';
    
    // Create a new client with the provided connection string
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      connectTimeoutMS: 5000
    });
    
    // Attempt to connect
    await client.connect();
    
    // Test the connection with a ping
    await client.db('admin').command({ ping: 1 });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Successfully connected to MongoDB' 
    });
  } catch (error) {
    let errorMessage = 'Failed to connect to MongoDB';
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message?.includes('ECONNREFUSED')) {
        errorMessage = 'Connection refused. Is MongoDB running?';
      } else if (error.message?.includes('authentication failed')) {
        errorMessage = 'Authentication failed. Check your credentials.';
      } else if (error.message?.includes('timed out')) {
        errorMessage = 'Connection timed out. Check your connection string and network.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  } finally {
    // Always close the connection
    if (client) {
      try {
        await client.close();
      } catch {
        // Ignore close errors
      }
    }
  }
}
