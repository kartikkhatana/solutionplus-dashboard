import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import pdf2pic from 'pdf2pic';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);
const readFile = promisify(fs.readFile);

export async function POST(request: NextRequest) {
  try {
    const { tokens, messageId, attachmentId, filename } = await request.json();

    if (!tokens || !messageId || !attachmentId || !filename) {
      return NextResponse.json({ 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }

    // Set up Gmail API
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Get the PDF attachment from Gmail
    const attachment = await gmail.users.messages.attachments.get({
      userId: 'me',
      messageId: messageId,
      id: attachmentId,
    });

    if (!attachment.data.data) {
      return NextResponse.json({ 
        error: 'No attachment data found' 
      }, { status: 404 });
    }

    // Decode the base64 PDF data
    const pdfBuffer = Buffer.from(attachment.data.data, 'base64');

    // Create temporary directory for processing
    const tempDir = path.join(process.cwd(), 'temp');
    try {
      await mkdir(tempDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Create temporary PDF file
    const tempPdfPath = path.join(tempDir, `${Date.now()}_${filename}`);
    await writeFile(tempPdfPath, pdfBuffer);

    try {
      // Configure pdf2pic with high-quality settings
      const convert = pdf2pic.fromPath(tempPdfPath, {
        density: 300,           // High DPI for better quality
        saveFilename: "page",   // Base filename for output
        savePath: tempDir,      // Output directory
        format: "png",          // PNG format for lossless quality
        width: 2550,            // High resolution width
        height: 3300,           // High resolution height
        quality: 100            // Maximum quality
      });

      // Convert all pages
      const results = await convert.bulk(-1, { responseType: "buffer" });
      
      const processedImages = [];
      
      // Process each converted page
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        
        if (result.buffer) {
          // Convert buffer to base64
          const base64Image = `data:image/png;base64,${result.buffer.toString('base64')}`;
          
          processedImages.push({
            base64: base64Image,
            pageNumber: i + 1,
            width: 2550,
            height: 3300
          });
        }
      }

      // Clean up temporary PDF file
      try {
        await unlink(tempPdfPath);
      } catch (cleanupError) {
        console.warn(`Failed to cleanup PDF file: ${tempPdfPath}`, cleanupError);
      }

      if (processedImages.length === 0) {
        return NextResponse.json({ 
          error: 'Failed to convert PDF to images' 
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        filename: filename,
        totalPages: processedImages.length,
        images: processedImages,
        message: `Successfully converted ${filename} to ${processedImages.length} high-quality images using pdf2pic`
      });

    } catch (conversionError) {
      console.error('PDF conversion error:', conversionError);
      
      // Clean up PDF file in case of error
      try {
        await unlink(tempPdfPath);
      } catch (cleanupError) {
        console.warn(`Failed to cleanup PDF file after error: ${tempPdfPath}`, cleanupError);
      }

      return NextResponse.json({ 
        error: 'Failed to convert PDF to images',
        details: conversionError instanceof Error ? conversionError.message : String(conversionError)
      }, { status: 500 });
    }

  } catch (error) {
    console.error('PDF to images API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
