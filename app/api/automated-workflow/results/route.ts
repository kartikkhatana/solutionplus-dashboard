import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const mongoClient = new MongoClient(process.env.MONGODB_URI!);

export async function GET(request: NextRequest) {
  try {
    await mongoClient.connect();
    const db = mongoClient.db('solutionplus');
    
    // Get recent automated emails
    const emailsCollection = db.collection('automated_emails');
    const analysisCollection = db.collection('automated_analysis');
    
    const recentEmails = await emailsCollection
      .find({})
      .sort({ processedAt: -1 })
      .limit(20)
      .toArray();
    
    const recentAnalysis = await analysisCollection
      .find({})
      .sort({ 'analysisResult.processedAt': -1 })
      .limit(20)
      .toArray();
    
    await mongoClient.close();
    
    return NextResponse.json({
      success: true,
      emails: recentEmails,
      analysis: recentAnalysis,
      count: {
        emails: recentEmails.length,
        analysis: recentAnalysis.length
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching results:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch results',
      details: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await mongoClient.connect();
    const db = mongoClient.db('solutionplus');
    
    // Clear all automated workflow data
    const emailsCollection = db.collection('automated_emails');
    const analysisCollection = db.collection('automated_analysis');
    
    await emailsCollection.deleteMany({});
    await analysisCollection.deleteMany({});
    
    await mongoClient.close();
    
    return NextResponse.json({
      success: true,
      message: 'All automated workflow data cleared'
    });
    
  } catch (error: any) {
    console.error('Error clearing data:', error);
    return NextResponse.json({ 
      error: 'Failed to clear data',
      details: error.message 
    }, { status: 500 });
  }
}
