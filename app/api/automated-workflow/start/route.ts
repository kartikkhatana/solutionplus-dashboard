import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { MongoClient } from 'mongodb';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// MongoDB connection
const mongoClient = new MongoClient(process.env.MONGODB_URI!);

interface WorkflowStep {
  step: number;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  message: string;
  progress: number;
  timestamp?: string;
  data?: any;
}

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const { tokens, senderEmail, step, emailsData, processedEmails, analysisResults } = requestBody;

    if (!tokens) {
      return NextResponse.json({ error: 'No authentication tokens provided' }, { status: 401 });
    }

    // If no step specified, start with step 1
    const currentStep = step || 1;

    // Initialize workflow steps
    const steps: WorkflowStep[] = [
      { step: 1, title: 'Connecting to G Suite', status: 'pending', message: 'Ready to connect...', progress: 0 },
      { step: 2, title: 'Fetching Emails', status: 'pending', message: 'Waiting...', progress: 0 },
      { step: 3, title: 'Uploading Attachments to S3', status: 'pending', message: 'Waiting...', progress: 0 },
      { step: 4, title: 'Storing Metadata in MongoDB', status: 'pending', message: 'Waiting...', progress: 0 },
      { step: 5, title: 'Analyzing Data', status: 'pending', message: 'Waiting...', progress: 0 },
      { step: 6, title: 'Workflow Complete', status: 'pending', message: 'Waiting...', progress: 0 },
    ];

    // Mark previous steps as completed
    for (let i = 0; i < currentStep - 1; i++) {
      steps[i].status = 'completed';
      steps[i].progress = 100;
      steps[i].timestamp = new Date().toISOString();
      steps[i].message = 'Completed';
    }

    // Set current step as processing
    if (currentStep <= 6) {
      steps[currentStep - 1].status = 'processing';
      steps[currentStep - 1].progress = 0;
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    switch (currentStep) {
      case 1:
        // Step 1: Connect to Gmail
        steps[0].message = 'Establishing connection...';
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate connection time
        
        try {
          await gmail.users.getProfile({ userId: 'me' });
          steps[0] = { ...steps[0], status: 'completed', message: 'Connected successfully', progress: 100, timestamp: new Date().toISOString() };
          
          return NextResponse.json({ 
            success: true,
            steps,
            nextStep: 2,
            message: 'Gmail connection established'
          });
        } catch (error) {
          steps[0] = { ...steps[0], status: 'error', message: 'Connection failed', progress: 0 };
          throw error;
        }

      case 2:
        // Step 2: Fetch Emails
        steps[1].message = 'Fetching emails with attachments...';
        steps[1].progress = 10;

        const query = senderEmail ? `from:${senderEmail} has:attachment` : 'has:attachment';
        const response = await gmail.users.messages.list({
          userId: 'me',
          q: query,
          maxResults: 10
        });

        const messages = response.data.messages || [];
        
        if (messages.length === 0) {
          steps[1] = { ...steps[1], status: 'completed', message: 'No emails found', progress: 100, timestamp: new Date().toISOString() };
          return NextResponse.json({ 
            success: true,
            steps, 
            nextStep: 3,
            emailsData: [],
            message: 'No emails found'
          });
        }

        // Fetch full message details
        const fetchedEmails = [];
        for (let i = 0; i < Math.min(messages.length, 5); i++) {
          const message = messages[i];
          const fullMessage = await gmail.users.messages.get({
            userId: 'me',
            id: message.id!,
            format: 'full'
          });

          const headers = fullMessage.data.payload?.headers || [];
          const subject = headers.find((h) => h.name === 'Subject')?.value || 'No Subject';
          const from = headers.find((h) => h.name === 'From')?.value || 'Unknown';
          const date = headers.find((h) => h.name === 'Date')?.value || '';

          // Extract attachments
          const attachments: any[] = [];
          const extractAttachments = (parts: any[]) => {
            for (const part of parts) {
              if (part.filename && part.body?.attachmentId) {
                attachments.push({
                  filename: part.filename,
                  mimeType: part.mimeType,
                  attachmentId: part.body.attachmentId,
                  size: part.body.size
                });
              }
              if (part.parts) {
                extractAttachments(part.parts);
              }
            }
          };

          if (fullMessage.data.payload?.parts) {
            extractAttachments(fullMessage.data.payload.parts);
          }

          fetchedEmails.push({
            id: message.id,
            subject,
            from,
            date,
            attachments
          });

          steps[1].progress = Math.round(((i + 1) / Math.min(messages.length, 5)) * 100);
        }

        steps[1] = { ...steps[1], status: 'completed', message: `Found ${fetchedEmails.length} emails with ${fetchedEmails.reduce((sum, e) => sum + e.attachments.length, 0)} attachments`, progress: 100, timestamp: new Date().toISOString() };

        return NextResponse.json({ 
          success: true,
          steps,
          nextStep: 3,
          emailsData: fetchedEmails,
          message: `Found ${fetchedEmails.length} emails`
        });

      case 3:
        // Step 3: Upload Attachments to S3
        if (!emailsData || emailsData.length === 0) {
          steps[2] = { ...steps[2], status: 'completed', message: 'No attachments to upload', progress: 100, timestamp: new Date().toISOString() };
          return NextResponse.json({ 
            success: true,
            steps,
            nextStep: 4,
            processedEmails: [],
            message: 'No attachments to process'
          });
        }

        steps[2].message = 'Streaming attachments to S3...';
        steps[2].progress = 0;

        const uploadedEmails = [];
        let totalAttachments = 0;
        let processedAttachments = 0;

        // Count total attachments
        for (const email of emailsData) {
          totalAttachments += email.attachments.length;
        }

        for (const email of emailsData) {
          const emailAttachments = [];

          for (const attachment of email.attachments) {
            try {
              // Get attachment data from Gmail
              const attachmentData = await gmail.users.messages.attachments.get({
                userId: 'me',
                messageId: email.id!,
                id: attachment.attachmentId!
              });

              if (attachmentData.data && attachmentData.data.data) {
                // Decode base64 data
                const buffer = Buffer.from(attachmentData.data.data, 'base64');
                
                // Generate S3 key
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const s3Key = `automated-workflow/${timestamp}/${attachment.filename}`;

                // Upload to S3
                const upload = new Upload({
                  client: s3Client,
                  params: {
                    Bucket: process.env.S3_BUCKET_NAME!,
                    Key: s3Key,
                    Body: buffer,
                    ContentType: attachment.mimeType,
                  },
                });

                await upload.done();
                const s3Url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

                emailAttachments.push({
                  filename: attachment.filename,
                  s3Url,
                  mimeType: attachment.mimeType,
                  size: attachment.size
                });

                processedAttachments++;
                steps[2].progress = Math.round((processedAttachments / totalAttachments) * 100);
              }
            } catch (error) {
              console.error(`Error uploading attachment ${attachment.filename}:`, error);
            }
          }

          uploadedEmails.push({
            emailId: email.id,
            sender: email.from,
            subject: email.subject,
            timestamp: email.date,
            attachments: emailAttachments,
            status: 'Fetched'
          });
        }

        steps[2] = { ...steps[2], status: 'completed', message: `Uploaded ${processedAttachments} attachments to S3`, progress: 100, timestamp: new Date().toISOString() };

        return NextResponse.json({ 
          success: true,
          steps,
          nextStep: 4,
          processedEmails: uploadedEmails,
          message: `Uploaded ${processedAttachments} attachments`
        });

      case 4:
        // Step 4: Store Metadata in MongoDB
        if (!processedEmails || processedEmails.length === 0) {
          steps[3] = { ...steps[3], status: 'completed', message: 'No data to store', progress: 100, timestamp: new Date().toISOString() };
          return NextResponse.json({ 
            success: true,
            steps,
            nextStep: 5,
            message: 'No data to store'
          });
        }

        steps[3].message = 'Storing email metadata...';
        steps[3].progress = 0;

        await mongoClient.connect();
        const db = mongoClient.db('solutionplus');
        const emailsCollection = db.collection('automated_emails');

        // Insert processed emails
        for (let i = 0; i < processedEmails.length; i++) {
          const email = processedEmails[i];
          await emailsCollection.insertOne({
            ...email,
            processedAt: new Date()
          });
          steps[3].progress = Math.round(((i + 1) / processedEmails.length) * 100);
        }

        steps[3] = { ...steps[3], status: 'completed', message: `Stored ${processedEmails.length} email records`, progress: 100, timestamp: new Date().toISOString() };

        await mongoClient.close();

        return NextResponse.json({ 
          success: true,
          steps,
          nextStep: 5,
          message: `Stored ${processedEmails.length} records`
        });

      case 5:
        // Step 5: Analyze Data (28-point validation)
        if (!processedEmails || processedEmails.length === 0) {
          steps[4] = { ...steps[4], status: 'completed', message: 'No data to analyze', progress: 100, timestamp: new Date().toISOString() };
          return NextResponse.json({ 
            success: true,
            steps,
            nextStep: 6,
            message: 'No data to analyze'
          });
        }

        steps[4].message = 'Running 28-point invoice analysis...';
        steps[4].progress = 0;

        await mongoClient.connect();
        const dbAnalysis = mongoClient.db('solutionplus');
        const analysisCollection = dbAnalysis.collection('automated_analysis');
        const completedAnalysis = [];

        for (let i = 0; i < processedEmails.length; i++) {
          const email = processedEmails[i];
          
          // Simulate analysis delay
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Generate dummy 28-point analysis
          const validationPoints = generateDummyValidation();
          const overallScore = calculateOverallScore(validationPoints);

          const analysisResult = {
            emailId: email.emailId, // This should work now since email comes from processedEmails
            analysisResult: {
              overallScore,
              status: overallScore >= 85 ? 'Validated' : 'Requires Review',
              validationPoints,
              processedAt: new Date().toISOString(),
              processingTime: `${(Math.random() * 5 + 2).toFixed(1)}s`
            }
          };

          await analysisCollection.insertOne(analysisResult);
          completedAnalysis.push(analysisResult);

          steps[4].progress = Math.round(((i + 1) / processedEmails.length) * 100);
        }

        steps[4] = { ...steps[4], status: 'completed', message: `Analyzed ${processedEmails.length} invoices`, progress: 100, timestamp: new Date().toISOString() };

        await mongoClient.close();

        return NextResponse.json({ 
          success: true,
          steps,
          nextStep: 6,
          analysisResults: completedAnalysis,
          message: `Analyzed ${processedEmails.length} invoices`
        });

      case 6:
        // Step 6: Workflow Complete + Send Report Email
        steps[5].message = 'Processing complete - Sending report email...';
        steps[5].progress = 50;

        const summary = {
          emailsFound: analysisResults?.length || 0,
          attachmentsProcessed: 0, // This would be calculated from previous steps
          averageScore: analysisResults?.length ? analysisResults.reduce((sum: number, r: any) => sum + r.analysisResult.overallScore, 0) / analysisResults.length : 0,
          validatedCount: analysisResults?.filter((r: any) => r.analysisResult.status === 'Validated').length || 0,
          reviewRequiredCount: analysisResults?.filter((r: any) => r.analysisResult.status === 'Requires Review').length || 0
        };

        // Send report email to original sender
        try {
          // First, let's try a simple test to see if we can send emails at all
          console.log('Testing Gmail send permissions...');
          
          // Get user profile to verify we have the right permissions
          const profile = await gmail.users.getProfile({ userId: 'me' });
          console.log(`Gmail profile: ${profile.data.emailAddress}`);
          
          await sendProcessingReport(gmail, analysisResults, summary);
          steps[5] = { ...steps[5], status: 'completed', message: 'Processing complete - Report sent successfully', progress: 100, timestamp: new Date().toISOString() };
        } catch (emailError: any) {
          console.error('Failed to send report email:', emailError);
          console.error('Error details:', {
            message: emailError.message,
            code: emailError.code,
            status: emailError.status,
            errors: emailError.errors
          });
          steps[5] = { ...steps[5], status: 'completed', message: `Processing complete - Email failed: ${emailError.message}`, progress: 100, timestamp: new Date().toISOString() };
        }

        return NextResponse.json({ 
          success: true,
          steps,
          summary,
          results: analysisResults || [],
          completed: true,
          message: 'Workflow completed successfully'
        });

      default:
        return NextResponse.json({ error: 'Invalid step' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Automated workflow error:', error);
    return NextResponse.json({ 
      error: 'Workflow failed',
      details: error.message 
    }, { status: 500 });
  }
}

// Generate dummy 28-point validation (based on the image provided)
function generateDummyValidation() {
  const validationPoints = [
    'duplicateCheck', 'supplierName', 'assetName', 'billingAddress', 'documentType',
    'taxInvoice', 'invoiceOrCreditNote', 'supplierTRN', 'customerTRN', 'bankAccountNumber',
    'ibanNumber', 'swiftCode', 'sortCode', 'abaRoutingNumber', 'invoiceNumber',
    'invoiceDate', 'invoiceCurrency', 'invoiceAmountBeforeTax', 'vatAmount', 'invoiceTotalAmount',
    'description', 'invoiceFTARequirements', 'poInvoice', 'purchaseOrderWorkOrder', 'supportingDocuments',
    'invoiceAttached', 'splitGrossAmountAndVAT', 'additionalValidation'
  ];

  const validation: any = {};
  
  validationPoints.forEach(point => {
    const passed = Math.random() > 0.15; // 85% pass rate
    validation[point] = {
      passed,
      score: passed ? 100 : 0,
      issue: passed ? null : `${point} validation failed`
    };
  });

  return validation;
}

function calculateOverallScore(validationPoints: any): number {
  const points = Object.values(validationPoints) as any[];
  const totalScore = points.reduce((sum, point) => sum + point.score, 0);
  return Math.round(totalScore / points.length);
}

// Send processing report email to original sender
async function sendProcessingReport(gmail: any, analysisResults: any[], summary: any) {
  try {
    console.log('Starting email report process...');
    
    if (!analysisResults || analysisResults.length === 0) {
      console.log('No analysis results to report');
      return;
    }

    // Get the first email's sender as the recipient
    const firstResult = analysisResults[0];
    if (!firstResult || !firstResult.emailId) {
      console.log('No email ID found for report');
      return;
    }

    console.log(`Getting original email details for ID: ${firstResult.emailId}`);

    // Get original email details to extract sender and thread
    const originalEmail = await gmail.users.messages.get({
      userId: 'me',
      id: firstResult.emailId,
      format: 'full'
    });

    const headers = originalEmail.data.payload?.headers || [];
    const originalSender = headers.find((h: any) => h.name === 'From')?.value;
    const originalSubject = headers.find((h: any) => h.name === 'Subject')?.value || 'Your Email';
    const threadId = originalEmail.data.threadId;
    const messageId = headers.find((h: any) => h.name === 'Message-ID')?.value;

    console.log(`Original sender: ${originalSender}`);
    console.log(`Original subject: ${originalSubject}`);
    console.log(`Thread ID: ${threadId}`);
    console.log(`Message ID: ${messageId}`);

    if (!originalSender) {
      console.log('No original sender found');
      return;
    }

    // Create detailed report content
    const reportContent = generateReportContent(analysisResults, summary, originalSubject);

    // Create email message with proper reply headers
    const emailHeaders = [
      `To: ${originalSender}`,
      `Subject: Re: ${originalSubject} - Automated Processing Complete`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: 7bit'
    ];

    // Add reply headers if we have the original message ID
    if (messageId) {
      emailHeaders.push(`In-Reply-To: ${messageId}`);
      emailHeaders.push(`References: ${messageId}`);
    }

    const emailMessage = [
      ...emailHeaders,
      '',
      reportContent
    ].join('\r\n');

    console.log('Email message created, encoding...');

    // Encode message in base64 (Gmail API format)
    const encodedMessage = Buffer.from(emailMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    console.log('Sending email via Gmail API...');

    // Send email as reply to the thread
    const sendRequest: any = {
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    };

    // Add thread ID to keep it in the same conversation
    if (threadId) {
      sendRequest.requestBody.threadId = threadId;
    }

    // Send email
    const sendResult = await gmail.users.messages.send(sendRequest);

    console.log(`Processing report sent successfully to: ${originalSender}`);
    console.log(`Email ID: ${sendResult.data.id}`);
    console.log(`Thread ID: ${sendResult.data.threadId}`);
    
  } catch (error) {
    console.error('Error sending processing report:', error);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    throw error; // Re-throw to be caught by the calling function
  }
}

// Generate HTML report content
function generateReportContent(analysisResults: any[], summary: any, originalSubject: string): string {
  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString();

  let detailedResults = '';
  analysisResults.forEach((result, index) => {
    const analysis = result.analysisResult;
    const statusIcon = analysis.status === 'Validated' ? '✅' : '⚠️';
    const statusColor = analysis.status === 'Validated' ? '#28a745' : '#ffc107';

    // Get failed validation points
    const failedPoints = Object.entries(analysis.validationPoints)
      .filter(([_, point]: [string, any]) => !point.passed)
      .map(([key, point]: [string, any]) => `• ${key}: ${point.issue}`)
      .join('<br>');

    detailedResults += `
      <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin: 10px 0; background-color: #f9f9f9;">
        <h4 style="margin: 0 0 10px 0; color: ${statusColor};">
          ${statusIcon} Invoice Analysis #${index + 1}
        </h4>
        <p><strong>Email ID:</strong> ${result.emailId}</p>
        <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${analysis.status}</span></p>
        <p><strong>Overall Score:</strong> ${analysis.overallScore}/100</p>
        <p><strong>Processing Time:</strong> ${analysis.processingTime}</p>
        ${failedPoints ? `<p><strong>Issues Found:</strong><br>${failedPoints}</p>` : '<p><strong>✅ All validation points passed</strong></p>'}
      </div>
    `;
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Automated Processing Report</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 28px;">📊 Automated Processing Complete</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">SolutionPlus Workflow System</p>
      </div>

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #495057; margin-top: 0;">📋 Processing Summary</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
          <div style="background: white; padding: 15px; border-radius: 6px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="font-size: 24px; font-weight: bold; color: #007bff;">${summary.emailsFound}</div>
            <div style="color: #6c757d;">Emails Processed</div>
          </div>
          <div style="background: white; padding: 15px; border-radius: 6px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="font-size: 24px; font-weight: bold; color: #28a745;">${summary.validatedCount}</div>
            <div style="color: #6c757d;">Validated</div>
          </div>
          <div style="background: white; padding: 15px; border-radius: 6px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="font-size: 24px; font-weight: bold; color: #ffc107;">${summary.reviewRequiredCount}</div>
            <div style="color: #6c757d;">Requires Review</div>
          </div>
          <div style="background: white; padding: 15px; border-radius: 6px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="font-size: 24px; font-weight: bold; color: #17a2b8;">${Math.round(summary.averageScore)}%</div>
            <div style="color: #6c757d;">Average Score</div>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 25px;">
        <h2 style="color: #495057;">📄 Detailed Analysis Results</h2>
        ${detailedResults}
      </div>

      <div style="background-color: #e9ecef; padding: 20px; border-radius: 8px; margin-top: 30px;">
        <h3 style="margin-top: 0; color: #495057;">📞 Next Steps</h3>
        <ul style="margin: 0; padding-left: 20px;">
          <li>All validated invoices have been automatically processed and stored</li>
          <li>Invoices requiring review have been flagged for manual inspection</li>
          <li>All processed files are securely stored in our cloud system</li>
          <li>You can access detailed reports through the SolutionPlus dashboard</li>
        </ul>
      </div>

      <div style="text-align: center; margin-top: 30px; padding: 20px; border-top: 2px solid #dee2e6;">
        <p style="margin: 0; color: #6c757d;">
          <strong>SolutionPlus Automated System</strong><br>
          Report generated on ${currentDate} at ${currentTime}
        </p>
      </div>
    </body>
    </html>
  `;
}
