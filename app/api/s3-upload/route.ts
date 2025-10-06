import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function POST(request: NextRequest) {
  try {
    const { filename, fileBuffer, contentType } = await request.json();
    
    if (!filename || !fileBuffer) {
      return NextResponse.json({ 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }

    // Check if AWS credentials are configured
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET_NAME) {
      return NextResponse.json({ 
        error: 'AWS S3 not configured. Please add AWS credentials to .env file.' 
      }, { status: 500 });
    }
    
    const key = `invoices/${Date.now()}-${filename}`;
    
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: key,
      Body: Buffer.from(fileBuffer, 'base64'),
      ContentType: contentType || 'application/pdf',
    });
    
    await s3Client.send(command);
    
    const s3Url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
    
    return NextResponse.json({ 
      success: true, 
      s3Url,
      key 
    });
  } catch (error: any) {
    console.error('S3 Upload Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to upload to S3'
    }, { status: 500 });
  }
}
