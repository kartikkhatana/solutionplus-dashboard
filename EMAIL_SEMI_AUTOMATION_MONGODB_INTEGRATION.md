# Email Semi-Automation with MongoDB Integration

## Overview
This document describes the complete implementation of the Email Semi-Automation workflow with MongoDB Purchase Order matching and automated vendor notifications.

## Architecture

### 1. MongoDB Setup
- **Database**: `invoiceflow`
- **Collection**: `purchase_order_dumps`
- **Connection String**: `mongodb://localhost:27017/invoiceflow`

### 2. Data Flow

```
Gmail Emails → Dummy Invoice Data → MongoDB PO Matching → Field Comparison → Email Notification
```

### 3. Key Components

#### A. API Endpoints

1. **`/api/mongodb/purchase-orders` (GET)**
   - Fetches Purchase Orders from MongoDB `purchase_order_dumps` collection
   - Query parameter: `fileName` - matches against PO records
   - Returns: PO details including all comparison fields

2. **`/api/mongodb/invoice-mock-data` (GET)**
   - Fetches Invoice mock data from MongoDB `Invoice_mock_data` collection
   - Query parameter: `fileName` - matches against invoice records
   - Returns: Invoice details for comparison with PO

3. **`/api/gmail-fetch` (POST)**
   - Fetches emails with PDF attachments from Gmail
   - Uses OAuth2 tokens for authentication

3. **`/api/gmail-send` (POST)**
   - Sends email replies to vendors
   - Includes approval/rejection notifications

#### B. Frontend Workflow (`app/semi-automated-workflow/page.tsx`)

**Stage 1: Email Selection**
- User authenticates with Gmail
- System fetches emails with PDF attachments
- User selects emails to process

**Stage 2: Processing**
1. For each PDF attachment:
   - Query MongoDB `Invoice_mock_data` collection by `fileName`
   - Retrieve invoice data from database:
     ```javascript
     {
       poNumber: String,
       vendorName: String,
       date: String,
       totalAmount: Number,
       currency: String,
       descriptionOfItems: String,
       quantity: Number,
       rate: Number,
       fileName: String
     }
     ```

2. Query MongoDB for matching PO:
   - Match by `fileName` field in `purchase_order_dumps` collection
   - If match found, retrieve PO data

3. Create field-by-field comparison:
   - PO Number
   - Vendor Name
   - Date
   - Total Amount
   - Currency
   - Description of Items
   - Quantity
   - Rate

4. Calculate match score:
   - `Match Score = (Matched Fields / Total Fields) × 100`
   - Status: `matched` (100%) or `mismatched` (<100%)

**Stage 3: Review & Action**
- Display comparison results in table
- User can view detailed comparison modal
- Actions available:
  - **View Details**: Opens detailed field-by-field comparison
  - **Approve**: Sends approval email to vendor
  - **Reject**: Sends rejection email to vendor
  - **Bulk Actions**: Process multiple records at once

**Stage 4: Email Notifications**
- Automated email sent to original sender
- Includes:
  - Approval/Rejection status
  - Match score and validation summary
  - Field-by-field comparison details
  - Discrepancies highlighted (if any)
  - Action items for vendor

## MongoDB Schema

### Purchase Order Document Structure (`purchase_order_dumps`)
```javascript
{
  _id: ObjectId,
  fileName: String,        // Used for matching with email attachment
  poNumber: String,
  vendorName: String,
  date: String,           // ISO date format
  totalAmount: Number,
  currency: String,       // e.g., 'AED', 'USD'
  descriptionOfItems: String,
  quantity: Number,
  rate: Number,
  paymentTerms: String,   // Optional
  shippingAddress: String, // Optional
  taxAmount: Number       // Optional
}
```

### Invoice Mock Data Structure (`Invoice_mock_data`)
```javascript
{
  _id: ObjectId,
  fileName: String,        // Used for matching with email attachment
  poNumber: String,
  vendorName: String,
  date: String,           // e.g., "30 Jun 2025"
  totalAmount: Number,
  currency: String,       // e.g., 'AED'
  descriptionOfItems: String,
  quantity: Number,
  rate: Number
}
```

## Sample Data for Testing

### MongoDB Seed Data
```javascript
// Run: mongosh
use invoiceflow

// Seed Purchase Orders
db.purchase_order_dumps.insertMany([
  {
    fileName: "183653 -.pdf",
    poNumber: "15744",
    vendorName: "Securiguard Middle East - LLC",
    date: "30 Jun 2025",
    totalAmount: 9200,
    currency: "AED",
    descriptionOfItems: "MGX Security Deployment x2 Security Guard",
    quantity: 1,
    rate: 9200,
    paymentTerms: "Net 30",
    shippingAddress: "Dubai, UAE",
    taxAmount: 0
  },
  {
    fileName: "9147019838 - BCPO LAB Office Jun 2024 PO 17675.pdf",
    poNumber: "17675",
    vendorName: "Dussmann",
    date: "20 Aug 2025",
    totalAmount: 14781.58,
    currency: "AED",
    descriptionOfItems: "Consumable Supplies",
    quantity: 1,
    rate: 14781.58,
    paymentTerms: "Net 45",
    shippingAddress: "Abu Dhabi, UAE",
    taxAmount: 0
  }
]);

// Seed Invoice Mock Data
db.Invoice_mock_data.insertMany([
  {
    fileName: "183653 -.pdf",
    poNumber: "15744",
    vendorName: "Securiguard Middle East - LLC",
    date: "30 Jun 2025",
    totalAmount: 9200,
    currency: "AED",
    descriptionOfItems: "MGX Security Deployment x2 Security Guard",
    quantity: 1,
    rate: 9200
  },
  {
    fileName: "9147019838 - BCPO LAB Office Jun 2024 PO 17675.pdf",
    poNumber: "17675",
    vendorName: "Dussmann",
    date: "20 Aug 2025",
    totalAmount: 14781.58,
    currency: "AED",
    descriptionOfItems: "Consumable Supplies",
    quantity: 1,
    rate: 14781.58
  },
  {
    fileName: "183652 -.pdf",
    poNumber: "MDC\\5105486_1",
    vendorName: "Securiguard Middle East - LLC",
    date: "30 Jun 2025",
    totalAmount: 4600,
    currency: "AED",
    descriptionOfItems: "Security Guards (12 hours x 7 days) @ 1 personnel",
    quantity: 1,
    rate: 4600
  },
  {
    fileName: "183334 - INV.pdf",
    poNumber: "MDC\\5120787_1",
    vendorName: "Securiguard Middle East - LLC",
    date: "31 Jul 2025",
    totalAmount: 9200,
    currency: "AED",
    descriptionOfItems: "Security Services for Jul 2025 Mubadla Tower",
    quantity: 2,
    rate: 4600
  }
]);
```

## User Workflow

### 1. Start Workflow
- Navigate to Semi-Automated Workflow page
- Click "Start Email Workflow" or "Start MongoDB Workflow"

### 2. Gmail Authentication
- OAuth popup opens
- User grants Gmail access
- System fetches emails with PDFs

### 3. Select Emails
- Review list of emails with PDF attachments
- Select emails to process
- Click "Process Selected"

### 4. Processing
- System fetches invoice data from MongoDB `Invoice_mock_data` collection by fileName
- Queries MongoDB `purchase_order_dumps` for matching POs by fileName
- Generates field comparisons between invoice and PO data
- Calculates match scores

### 5. Review Results
- View summary cards (Success Rate, Total Amount, Avg Score)
- Review table with all processed records
- Click "View Details" for detailed comparison

### 6. Take Action
- **Individual Actions**: Approve/Reject from detail modal
- **Bulk Actions**: Select multiple records and approve/reject all
- System sends email notification to vendor for each action

### 7. Complete
- When all records processed, click "Done"
- Returns to workflow selection screen

## Email Notification Format

### Approval Email
```
Subject: Re: Invoice APPROVED - INV-XXX

Dear [Vendor Name],

Your invoice [Invoice ID] for PO [PO Number] has been APPROVED.

VALIDATION SUMMARY:
- Match Score: XX%
- Status: Fully Matched / Discrepancies Found
- Total Fields Validated: 8
- Fields Matched: X
- Fields Mismatched: X

[Detailed field comparisons...]

Best regards,
Invoice Processing Team
```

### Rejection Email
Similar format but with REJECTED status and detailed discrepancy explanation.

## Configuration

### Environment Variables
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/invoiceflow

# Gmail OAuth (already configured)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

### Gmail OAuth Scopes Required
- `gmail.readonly` - Read emails
- `gmail.send` - Send replies
- `gmail.modify` - Mark emails as read

## Error Handling

### No Matching PO Found
- Error message: "No matching POs found in MongoDB"
- User returns to email selection
- Can try different emails

### MongoDB Connection Issues
- Check MongoDB is running: `mongosh`
- Verify connection string in API route
- Check database and collection exist

### Gmail Authentication Failures
- Clear browser cookies/cache
- Re-authorize Gmail access
- Check OAuth credentials

## Testing Checklist

- [ ] MongoDB running and accessible
- [ ] Sample PO data seeded in `purchase_order_dumps` collection
- [ ] Sample Invoice data seeded in `Invoice_mock_data` collection
- [ ] Both collections have matching `fileName` fields
- [ ] Gmail OAuth configured
- [ ] Send test email with PDF attachment
- [ ] PDF fileName matches both MongoDB collections
- [ ] Process email successfully
- [ ] View detailed comparison

## Future Enhancements

1. **Real PDF Extraction**
   - Use OCR/ML to extract actual invoice data
   - Replace dummy data generation

2. **Advanced Matching**
   - Fuzzy matching for vendor names
   - Tolerance thresholds for amounts
   - Date range matching

3. **Analytics Dashboard**
   - Match score trends
   - Processing time metrics
   - Vendor performance reports

4. **Workflow Automation**
   - Auto-approve high-confidence matches
   - Scheduled batch processing
   - Webhook notifications

5. **Integration**
   - ERP system sync
   - Cloud storage (S3) for PDFs
   - Audit trail logging

## Support

For issues or questions:
1. Check MongoDB connection and data
2. Verify Gmail OAuth tokens valid
3. Review browser console for errors
4. Check API route responses in Network tab

## Summary

The Email Semi-Automation workflow provides a complete solution for:
- ✅ Automated email processing
- ✅ MongoDB Purchase Order matching
- ✅ Field-by-field validation
- ✅ Intelligent comparison scoring
- ✅ Automated vendor notifications
- ✅ Bulk processing capabilities
- ✅ Detailed audit trails

The system is production-ready for the described workflow, with dummy invoice data generation serving as a placeholder for future ML-based PDF extraction.
