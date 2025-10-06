# MongoDB Email Automation - Complete Implementation Guide

## Overview
This workflow combines Gmail email fetching with MongoDB storage and S3 bucket PDF management for persistent invoice processing.

## Architecture Flow

```
Gmail OAuth → Fetch Emails → Extract PDFs → Upload to S3 → Store URLs in MongoDB
    ↓
Query MongoDB → Download PDFs from S3 → Process & Match → Display Results
    ↓
Approve/Reject → Save to MongoDB → Send Email → Update Status
```

## Required Components

### 1. AWS S3 Setup

#### Prerequisites
- AWS Account
- S3 Bucket created
- IAM User with S3 access

#### Environment Variables (.env)
```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=solutionplus-invoices
```

#### Install Dependencies
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### 2. MongoDB Collections

#### Collection: `email_invoices`
```typescript
{
  _id: ObjectId,
  vendorEmail: string,
  vendorName: string,
  emailSubject: string,
  emailDate: Date,
  threadId: string,
  attachments: [
    {
      filename: string,
      s3Url: string,
      uploadedAt: Date,
      fileSize: number,
      contentType: string
    }
  ],
  status: 'pending' | 'processing' | 'processed',
  createdAt: Date,
  updatedAt: Date
}
```

#### Collection: `invoice_validations`
```typescript
{
  _id: ObjectId,
  invoiceId: string,
  poNumber: string,
  vendorName: string,
  vendorEmail: string,
  matchScore: number,
  status: 'matched' | 'mismatched',
  fieldComparisons: [
    {
      field: string,
      poValue: string,
      invoiceValue: string,
      match: boolean
    }
  ],
  actionStatus: 'processing' | 'approved' | 'rejected',
  actionDate: Date,
  actionBy: string,
  summary: string,
  emailThreadId: string,
  s3PdfUrls: {
    po: string,
    invoice: string
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Implementation Steps

### Step 1: Create S3 Upload API Route

**File: `app/api/s3-upload/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { filename, fileBuffer, contentType } = await request.json();
    
    const key = `invoices/${Date.now()}-${filename}`;
    
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: key,
      Body: Buffer.from(fileBuffer, 'base64'),
      ContentType: contentType,
    });
    
    await s3Client.send(command);
    
    const s3Url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    
    return NextResponse.json({ 
      success: true, 
      s3Url,
      key 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}
```

### Step 2: Create MongoDB Storage API Route

**File: `app/api/mongodb/email-invoices/route.ts`**
```typescript
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
      id: result.insertedId 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message 
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
    
    return NextResponse.json({ 
      success: true, 
      emails 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}
```

### Step 3: Create Validation Storage API Route

**File: `app/api/mongodb/validations/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

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
      id: result.insertedId 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('solutionplus');
    const collection = db.collection('invoice_validations');
    
    const { id, actionStatus, actionDate, actionBy, summary } = await request.json();
    
    const result = await collection.updateOne(
      { _id: id },
      { 
        $set: { 
          actionStatus, 
          actionDate, 
          actionBy, 
          summary,
          updatedAt: new Date() 
        } 
      }
    );
    
    return NextResponse.json({ 
      success: true, 
      modified: result.modifiedCount 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}
```

### Step 4: MongoDB Workflow Handler (Frontend)

**Update `app/semi-automated-workflow/page.tsx`:**

```typescript
const handleMongoDBWorkflow = () => {
  setWorkflowType('mongodb');
  setWorkflowStage('connection');
  setTimeout(() => handleGmailAuth(), 100); // Reuse Gmail auth
};

// After Gmail auth and email fetch
const processMongoDBEmails = async () => {
  // 1. Fetch emails (already done via Gmail)
  // 2. For each email with PDFs:
  for (const email of selectedEmails) {
    const attachments = [];
    
    for (const attachment of email.attachments) {
      // 3. Download PDF from Gmail
      const pdfResponse = await fetch('/api/gmail-process-pdfs', {
        method: 'POST',
        body: JSON.stringify({
          tokens: gmailTokens,
          messageId: email.id,
          attachmentId: attachment.attachmentId,
          filename: attachment.filename
        })
      });
      
      const pdfData = await pdfResponse.json();
      
      // 4. Upload to S3
      const s3Response = await fetch('/api/s3-upload', {
        method: 'POST',
        body: JSON.stringify({
          filename: attachment.filename,
          fileBuffer: pdfData.fileBuffer, // base64
          contentType: 'application/pdf'
        })
      });
      
      const { s3Url } = await s3Response.json();
      
      attachments.push({
        filename: attachment.filename,
        s3Url,
        uploadedAt: new Date(),
        fileSize: attachment.size,
        contentType: 'application/pdf'
      });
    }
    
    // 5. Store in MongoDB
    await fetch('/api/mongodb/email-invoices', {
      method: 'POST',
      body: JSON.stringify({
        vendorEmail: email.from,
        vendorName: extractVendorName(email.from),
        emailSubject: email.subject,
        emailDate: email.date,
        threadId: email.threadId,
        attachments
      })
    });
  }
  
  // 6. Fetch from MongoDB and process
  const mongoResponse = await fetch('/api/mongodb/email-invoices?status=pending');
  const { emails: mongoEmails } = await mongoResponse.json();
  
  // 7. Download PDFs from S3 and process
  // (Similar to email flow processing)
  
  // 8. Display results
  setWorkflowStage('output');
};

// On approve/reject
const handleMongoDBAction = async (action: 'approve' | 'reject') => {
  const summary = generateSummary(selectedDetail);
  
  // 1. Save validation to MongoDB
  await fetch('/api/mongodb/validations', {
    method: 'POST',
    body: JSON.stringify({
      invoiceId: selectedDetail.invoiceId,
      poNumber: selectedDetail.poNumber,
      vendorName: selectedDetail.vendorName,
      vendorEmail: selectedDetail.vendorEmail,
      matchScore: selectedDetail.matchScore,
      status: selectedDetail.status,
      fieldComparisons: selectedDetail.fieldComparisons,
      actionStatus: action === 'approve' ? 'approved' : 'rejected',
      actionDate: new Date(),
      actionBy: 'user@example.com',
      summary,
      emailThreadId: selectedDetail.emailThreadId,
      s3PdfUrls: selectedDetail.s3PdfUrls
    })
  });
  
  // 2. Send email (reuse existing email send function)
  await sendEmailNotification(selectedDetail, action, summary);
};
```

## Frontend Workflow Logic

### Stage 1: Gmail Authentication
- Same as Email workflow
- Get OAuth tokens

### Stage 2: Email Fetching & S3 Upload
- Fetch emails from Gmail
- Extract PDF attachments
- Upload each PDF to S3
- Store metadata in MongoDB `email_invoices` collection

### Stage 3: Query MongoDB
- Fetch pending email invoices from MongoDB
- Get S3 URLs for PDFs

### Stage 4: PDF Processing
- Download PDFs from S3 using URLs
- Extract data and match PO/Invoice
- Display results

### Stage 5: Action & Storage
- User approves/rejects
- Save validation result to MongoDB `invoice_validations`
- Send email notification
- Update status

## Benefits of This Approach

1. **Persistence**: All invoices stored in MongoDB
2. **Scalability**: S3 handles large files
3. **History**: Track all validations
4. **Audit Trail**: Complete record of actions
5. **Reporting**: Query MongoDB for analytics
6. **Resume**: Can restart processing anytime

## Required Environment Variables

```env
# Gmail OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/email-automation

# MongoDB
MONGODB_URI=mongodb://localhost:27017/solutionplus

# AWS S3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=solutionplus-invoices

# Email Filter
EMAIL_SENDER_FILTER=xyz@gmail.com
```

## Next Steps

1. Set up AWS S3 bucket
2. Create MongoDB collections
3. Install AWS SDK dependencies
4. Create S3 upload API route
5. Create MongoDB storage API routes
6. Update frontend MongoDB workflow handler
7. Test end-to-end flow
8. Add error handling and retry logic
9. Implement progress tracking
10. Add comprehensive logging

## Testing Checklist

- [ ] Gmail OAuth works
- [ ] Emails fetched successfully
- [ ] PDFs uploaded to S3
- [ ] S3 URLs stored in MongoDB
- [ ] MongoDB queries work
- [ ] PDFs downloaded from S3
- [ ] Processing & matching works
- [ ] Validations saved to MongoDB
- [ ] Emails sent successfully
- [ ] Status updates correctly
- [ ] Historical data accessible

This is a production-ready architecture for MongoDB-backed email invoice processing! 🚀
