# @posty5/html-hosting-form-submission

> HTML hosting form submission management SDK for Posty5 API

This package provides a TypeScript SDK for managing HTML page form submissions in the Posty5 platform. Track, manage, and process form submissions from your hosted HTML pages.

## Installation

```bash
npm install @posty5/html-hosting-form-submission @posty5/core
```

## Quick Start

```typescript
import { Posty5Client } from '@posty5/core';
import { HtmlHostingFormSubmissionClient } from '@posty5/html-hosting-form-submission';

// Initialize the core client
const posty5 = new Posty5Client({
  apiKey: 'your-api-key',
  baseURL: 'https://api.posty5.com'
});

// Create the form submission client
const submissionClient = new HtmlHostingFormSubmissionClient(posty5.http);

// Get a submission
const submission = await submissionClient.get('submission_id');
console.log(submission.data); // Form data
console.log(submission.status); // Current status

// List submissions
const submissions = await submissionClient.list({
  page: 1,
  limit: 10,
  status: 'New'
});

// Change status
await submissionClient.changeStatus('submission_id', {
  status: 'Approved',
  notes: 'Looks good!'
});
```

## API Reference

### `HtmlHostingFormSubmissionClient`

The main client class for managing form submissions.

#### Constructor

```typescript
new HtmlHostingFormSubmissionClient(http: HttpClient)
```

**Parameters:**
- `http` - HTTP client instance from `@posty5/core`

---

#### `get(id)`

Get a form submission by ID.

```typescript
async get(id: string): Promise<IGetFormSubmissionResponse>
```

**Parameters:**
- `id` (string) - Submission ID

**Returns:**
- `IGetFormSubmissionResponse` - Form submission details with populated HTML hosting info

**Example:**
```typescript
const submission = await submissionClient.get('submission_id_123');
console.log(submission.data); // Form data
console.log(submission.status); // Current status
console.log(submission.numbering); // Submission number
console.log(submission.statusHistory); // Status change history
```

---

#### `getNextPrevious(id)`

Get next and previous form submissions for navigation.

```typescript
async getNextPrevious(id: string): Promise<INextPreviousSubmissionsResponse>
```

**Parameters:**
- `id` (string) - Current submission ID

**Returns:**
- `INextPreviousSubmissionsResponse` - Next and previous submission references

**Example:**
```typescript
const navigation = await submissionClient.getNextPrevious('submission_id_123');

if (navigation.previous) {
  console.log('Previous:', navigation.previous._id);
  console.log('Previous numbering:', navigation.previous.numbering);
}

if (navigation.next) {
  console.log('Next:', navigation.next._id);
  console.log('Next numbering:', navigation.next.numbering);
}
```

---

#### `list(params?)`

List form submissions with pagination and optional filters.

```typescript
async list(params?: IPaginationParams & {
  htmlHostingId?: string;
  formId?: string;
  status?: string;
  search?: string;
}): Promise<ISearchFormSubmissionsResponse>
```

**Parameters:**
- `params.page` (number, optional) - Page number (default: 1)
- `params.limit` (number, optional) - Items per page (default: 10)
- `params.htmlHostingId` (string, optional) - Filter by HTML hosting ID
- `params.formId` (string, optional) - Filter by form ID
- `params.status` (string, optional) - Filter by status
- `params.search` (string, optional) - Search query

**Returns:**
- `ISearchFormSubmissionsResponse` - Paginated list of submissions

**Example:**
```typescript
// Get all new submissions
const newSubmissions = await submissionClient.list({
  page: 1,
  limit: 20,
  status: 'New'
});

// Get submissions for a specific HTML page
const pageSubmissions = await submissionClient.list({
  htmlHostingId: 'html_hosting_id',
  page: 1,
  limit: 50
});

// Get submissions for a specific form
const formSubmissions = await submissionClient.list({
  formId: 'contact_form',
  page: 1
});

console.log(newSubmissions.data); // Array of submissions
console.log(newSubmissions.total); // Total count
console.log(newSubmissions.page); // Current page
```

---

#### `changeStatus(id, data)`

Change the status of a form submission.

```typescript
async changeStatus(id: string, data: IChangeStatusRequest): Promise<IChangeStatusResponse>
```

**Parameters:**
- `id` (string) - Submission ID
- `data.status` (IFormStatusType, required) - New status
- `data.rejectedReason` (string, optional) - Rejection reason (if rejecting)
- `data.notes` (string, optional) - Additional notes

**Returns:**
- `IChangeStatusResponse` - Updated status history

**Example:**
```typescript
// Approve a submission
await submissionClient.changeStatus('submission_id_123', {
  status: 'Approved',
  notes: 'All requirements met'
});

// Reject with reason
await submissionClient.changeStatus('submission_id_123', {
  status: 'Rejected',
  rejectedReason: 'Missing required documents',
  notes: 'Please provide ID and proof of address'
});

// Move to in progress
await submissionClient.changeStatus('submission_id_123', {
  status: 'In Progress',
  notes: 'Started processing'
});
```

---

#### `delete(id)`

Delete a form submission.

```typescript
async delete(id: string): Promise<void>
```

**Parameters:**
- `id` (string) - Submission ID to delete

**Example:**
```typescript
await submissionClient.delete('submission_id_123');
```

---

## TypeScript Interfaces

### Request Interfaces

#### `IChangeStatusRequest`

```typescript
interface IChangeStatusRequest {
  status: IFormStatusType;      // New status (required)
  rejectedReason?: string | null; // Rejection reason (optional)
  notes?: string | null;          // Additional notes (optional)
}
```

#### `IFormStatusType`

```typescript
type IFormStatusType =
  | 'New'
  | 'Pending Review'
  | 'In Progress'
  | 'On Hold'
  | 'Need More Info'
  | 'Approved'
  | 'Partially Approved'
  | 'Rejected'
  | 'Completed'
  | 'Archived'
  | 'Cancelled';
```

### Response Interfaces

#### `IHtmlHostingFormSubmissionResponse`

```typescript
interface IHtmlHostingFormSubmissionResponse {
  _id: string;                      // Submission ID
  htmlHostingId: string;            // HTML hosting ID (reference)
  formId: string;                   // Form ID (reference)
  visitorId: string;                // Visitor ID (reference)
  numbering: number;                // Submission numbering
  data: Record<string, any>;        // Form data (key-value pairs)
  fields?: string[];                // Form fields list
  ownerUserId: string;              // Owner user ID
  status: IFormStatusType;          // Current status
  statusHistory: IStatusHistoryEntry[]; // Status history
  syncing: ISyncingStatus;          // Google Sheets syncing status
  createdAt: string;                // Created date (ISO 8601)
  updatedAt?: string;               // Updated date (ISO 8601)
  deletedAt?: string;               // Deleted date (soft delete)
}
```

#### `INextPreviousSubmissionsResponse`

```typescript
interface INextPreviousSubmissionsResponse {
  previous?: {
    _id: string;       // Previous submission ID
    numbering: string; // Padded numbering (e.g., "0042")
  };
  next?: {
    _id: string;       // Next submission ID
    numbering: string; // Padded numbering (e.g., "0044")
  };
}
```

#### `ISearchFormSubmissionsResponse`

```typescript
type ISearchFormSubmissionsResponse = IPaginationResponse<IHtmlHostingFormSubmissionResponse>;

// IPaginationResponse structure:
interface IPaginationResponse<T> {
  data: T[];          // Array of items
  total: number;      // Total count
  page: number;       // Current page
  limit: number;      // Items per page
  totalPages: number; // Total pages
}
```

---

## Use Cases

### 1. Form Submission Management Dashboard

```typescript
// Get all pending submissions
const pending = await submissionClient.list({
  status: 'Pending Review',
  limit: 50
});

// Process each submission
for (const submission of pending.data) {
  console.log(`Processing submission #${submission.numbering}`);
  console.log('Data:', submission.data);
  
  // Approve or reject based on criteria
  if (isValid(submission.data)) {
    await submissionClient.changeStatus(submission._id, {
      status: 'Approved'
    });
  }
}
```

### 2. Submission Navigation

```typescript
// Get current submission
const current = await submissionClient.get('current_id');

// Get navigation
const nav = await submissionClient.getNextPrevious('current_id');

// Navigate to previous
if (nav.previous) {
  const previous = await submissionClient.get(nav.previous._id);
  console.log('Previous submission:', previous);
}

// Navigate to next
if (nav.next) {
  const next = await submissionClient.get(nav.next._id);
  console.log('Next submission:', next);
}
```

### 3. Status Workflow

```typescript
// New submission workflow
const submissionId = 'submission_id_123';

// Step 1: Move to review
await submissionClient.changeStatus(submissionId, {
  status: 'Pending Review',
  notes: 'Assigned to reviewer'
});

// Step 2: Start processing
await submissionClient.changeStatus(submissionId, {
  status: 'In Progress',
  notes: 'Verification in progress'
});

// Step 3: Request more info
await submissionClient.changeStatus(submissionId, {
  status: 'Need More Info',
  notes: 'Please provide additional documents'
});

// Step 4: Final approval
await submissionClient.changeStatus(submissionId, {
  status: 'Approved',
  notes: 'All requirements met'
});
```

### 4. Filtering and Search

```typescript
// Get submissions for a specific page and form
const submissions = await submissionClient.list({
  htmlHostingId: 'page_123',
  formId: 'contact_form',
  page: 1,
  limit: 100
});

// Get all rejected submissions
const rejected = await submissionClient.list({
  status: 'Rejected',
  page: 1
});

// Paginate through all submissions
for (let page = 1; page <= 10; page++) {
  const result = await submissionClient.list({ page, limit: 50 });
  console.log(`Page ${page}:`, result.items.length);
}
```

---

## Error Handling

All methods throw exceptions on API errors. Always wrap calls in try-catch blocks:

```typescript
try {
  await submissionClient.changeStatus('submission_id', {
    status: 'Approved'
  });
} catch (error) {
  console.error('Failed to change status:', error.message);
}
```

Common errors:
- **"The Html Hosting Form Submission Is Not Found"** - Submission doesn't exist
- **"You have not permission to do that"** - Attempting to access another user's submission
- **"You Can Not Change Status to Current Status"** - Trying to set the same status
- **"Please enter full information"** - Invalid request data

---

## Notes

- Each submission has a unique numbering within its form
- Status changes are tracked in the `statusHistory` array
- Submissions can be synced to Google Sheets if enabled
- Soft delete is supported (submissions are marked as deleted, not removed)
- Only the owner or admin can access/modify submissions

---

## License

MIT

---

## Support

For issues and questions, please visit [Posty5 Support](https://posty5.com/support)
