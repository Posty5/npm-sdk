# Posty5 SDK - API Reference

Complete API reference for all Posty5 SDK packages.

## Table of Contents

- [Core Package](#core-package)
- [Short Link Package](#short-link-package)
- [QR Code Package](#qr-code-package)
- [HTML Hosting Package](#html-hosting-package)
- [HTML Hosting Variables Package](#html-hosting-variables-package)
- [HTML Hosting Form Submission Package](#html-hosting-form-submission-package)
- [Social Publisher Workspace Package](#social-publisher-workspace-package)
- [Social Publisher Task Package](#social-publisher-task-package)
- [Common Fields](#common-fields)
- [Filtering](#filtering)

---

## Core Package

### Posty5Client

The main client for interacting with the Posty5 API.

#### Constructor

```typescript
new Posty5Client(config: IPosty5Config)
```

**Parameters:**
- `config.apiKey` (string, required) - Your Posty5 API key
- `config.baseURL` (string, optional) - API base URL (default: https://api.posty5.com)

**Example:**
```typescript
const client = new Posty5Client({
  apiKey: 'your-api-key',
  baseURL: 'https://api.posty5.com',
});
```

---

## Short Link Package

### ShortLinkClient

Manage URL shortening.

#### Methods

##### `create(data: ICreateShortLinkRequest): Promise<IApiResponse<IShortLink>>`

Create a new short link.

**Parameters:**
- `targetUrl` (string, required) - The destination URL
- `title` (string, optional) - Link title
- `description` (string, optional) - Link description
- `tag` (string, optional) - Tag for categorization
- `refId` (string, optional) - Your custom reference ID
- `customShortId` (string, optional) - Custom short ID (paid plans only)

**Example:**
```typescript
const result = await shortLinkClient.create({
  targetUrl: 'https://example.com/product/123',
  title: 'Product 123',
  description: 'Amazing product',
  tag: 'products',
  refId: 'product-123',
});
```

##### `getAll(params: IGetAllShortLinksRequest): Promise<IApiResponse<IPaginatedResponse<IShortLink>>>`

Get all short links with pagination and filtering.

**Parameters:**
- `page` (number, required) - Page number (starts at 1)
- `take` (number, required) - Items per page
- `search` (string, optional) - Search in title/description
- `tag` (string, optional) - Filter by tag
- `refId` (string, optional) - Filter by reference ID
- `apiKeyId` (string, optional) - Filter by API key

**Example:**
```typescript
const result = await shortLinkClient.getAll({
  page: 1,
  take: 20,
  tag: 'products',
  search: 'amazing',
});
```

##### `getById(id: string): Promise<IApiResponse<IShortLink>>`

Get a specific short link by ID.

**Example:**
```typescript
const result = await shortLinkClient.getById('link-id-123');
```

##### `update(id: string, data: IUpdateShortLinkRequest): Promise<IApiResponse<IShortLink>>`

Update a short link.

**Parameters:**
- `title` (string, optional) - New title
- `description` (string, optional) - New description
- `tag` (string, optional) - New tag
- `refId` (string, optional) - New reference ID

**Example:**
```typescript
const result = await shortLinkClient.update('link-id-123', {
  title: 'Updated Title',
  tag: 'updated-products',
});
```

##### `delete(id: string): Promise<IApiResponse<void>>`

Delete a short link.

**Example:**
```typescript
await shortLinkClient.delete('link-id-123');
```

---

## QR Code Package

### QRCodeClient

Generate and manage QR codes.

#### Methods

##### `createUrl(data: ICreateQRCodeUrlRequest): Promise<IApiResponse<IQRCode>>`

Create a QR code for a URL.

**Parameters:**
- `url` (string, required) - Target URL
- `title` (string, optional) - QR code title
- `tag` (string, optional) - Tag for categorization
- `refId` (string, optional) - Your custom reference ID

**Example:**
```typescript
const result = await qrCodeClient.createUrl({
  url: 'https://example.com',
  title: 'My Website',
  tag: 'website',
  refId: 'site-qr-001',
});
```

##### `createEmail(data: ICreateQRCodeEmailRequest): Promise<IApiResponse<IQRCode>>`

Create a QR code for email.

**Parameters:**
- `email` (string, required) - Email address
- `subject` (string, optional) - Email subject
- `body` (string, optional) - Email body
- `tag` (string, optional) - Tag for categorization
- `refId` (string, optional) - Your custom reference ID

**Example:**
```typescript
const result = await qrCodeClient.createEmail({
  email: 'support@example.com',
  subject: 'Contact Us',
  tag: 'contact',
  refId: 'contact-qr',
});
```

##### `createWifi(data: ICreateQRCodeWifiRequest): Promise<IApiResponse<IQRCode>>`

Create a QR code for WiFi network.

**Parameters:**
- `ssid` (string, required) - Network name
- `password` (string, required) - Network password
- `encryption` (string, required) - Encryption type ('WPA', 'WEP', 'nopass')
- `tag` (string, optional) - Tag for categorization
- `refId` (string, optional) - Your custom reference ID

**Example:**
```typescript
const result = await qrCodeClient.createWifi({
  ssid: 'Office WiFi',
  password: 'secure123',
  encryption: 'WPA',
  tag: 'office',
  refId: 'office-wifi-qr',
});
```

##### `createPhone(data: ICreateQRCodePhoneRequest): Promise<IApiResponse<IQRCode>>`

Create a QR code for phone number.

**Example:**
```typescript
const result = await qrCodeClient.createPhone({
  phone: '+1234567890',
  tag: 'contact',
  refId: 'phone-qr',
});
```

##### `createSms(data: ICreateQRCodeSmsRequest): Promise<IApiResponse<IQRCode>>`

Create a QR code for SMS.

**Example:**
```typescript
const result = await qrCodeClient.createSms({
  phone: '+1234567890',
  message: 'Hello!',
  tag: 'sms',
  refId: 'sms-qr',
});
```

##### `createVCard(data: ICreateQRCodeVCardRequest): Promise<IApiResponse<IQRCode>>`

Create a QR code for contact card (vCard).

**Example:**
```typescript
const result = await qrCodeClient.createVCard({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  tag: 'contacts',
  refId: 'john-doe-vcard',
});
```

##### `getAll(params: IGetAllQRCodesRequest): Promise<IApiResponse<IPaginatedResponse<IQRCode>>>`

Get all QR codes with filtering.

**Parameters:**
- `page` (number, required) - Page number
- `take` (number, required) - Items per page
- `targetType` (string, optional) - Filter by type ('url', 'email', 'wifi', etc.)
- `tag` (string, optional) - Filter by tag
- `refId` (string, optional) - Filter by reference ID
- `apiKeyId` (string, optional) - Filter by API key

**Example:**
```typescript
const result = await qrCodeClient.getAll({
  page: 1,
  take: 10,
  targetType: 'url',
  tag: 'website',
});
```

##### `getById(id: string): Promise<IApiResponse<IQRCode>>`

Get a specific QR code.

##### `update(id: string, data: IUpdateQRCodeRequest): Promise<IApiResponse<IQRCode>>`

Update a QR code.

##### `delete(id: string): Promise<IApiResponse<void>>`

Delete a QR code.

---

## HTML Hosting Package

### HtmlHostingClient

Deploy and manage static HTML pages.

#### Methods

##### `create(data: ICreateHtmlPageRequest): Promise<IApiResponse<IHtmlPage>>`

Create a new hosted HTML page.

**Parameters:**
- `title` (string, required) - Page title
- `htmlContent` (string, required) - HTML content
- `customLandingId` (string, optional) - Custom URL slug
- `isEnableMonetization` (boolean, optional) - Enable monetization
- `autoSaveInGoogleSheet` (boolean, optional) - Auto-save form submissions
- `tag` (string, optional) - Tag for categorization
- `refId` (string, optional) - Your custom reference ID

**Example:**
```typescript
const result = await htmlHostingClient.create({
  title: 'Landing Page',
  htmlContent: '<h1>Welcome!</h1>',
  tag: 'landing-pages',
  refId: 'landing-v1',
});
```

##### `getAll(params: IGetAllHtmlPagesRequest): Promise<IApiResponse<IPaginatedResponse<IHtmlPage>>>`

Get all hosted pages with filtering.

**Parameters:**
- `page` (number, required) - Page number
- `take` (number, required) - Items per page
- `name` (string, optional) - Filter by name
- `tag` (string, optional) - Filter by tag
- `refId` (string, optional) - Filter by reference ID
- `apiKeyId` (string, optional) - Filter by API key
- `status` (string, optional) - Filter by status
- `isEnableMonetization` (boolean, optional) - Filter by monetization
- `isTemp` (boolean, optional) - Filter temporary pages

**Example:**
```typescript
const result = await htmlHostingClient.getAll({
  page: 1,
  take: 10,
  tag: 'landing-pages',
  isEnableMonetization: true,
});
```

##### `getById(id: string): Promise<IApiResponse<IHtmlPage>>`

Get a specific page.

##### `update(id: string, data: IUpdateHtmlPageRequest): Promise<IApiResponse<IHtmlPage>>`

Update a page.

##### `delete(id: string): Promise<IApiResponse<void>>`

Delete a page.

---

## HTML Hosting Variables Package

### HtmlHostingVariablesClient

Manage dynamic variables for HTML pages.

#### Methods

##### `create(data: ICreateVariableRequest): Promise<IApiResponse<IVariable>>`

Create a new variable.

**Parameters:**
- `name` (string, required) - Variable name
- `key` (string, required) - Variable key
- `value` (string, required) - Variable value
- `tag` (string, optional) - Tag for categorization
- `refId` (string, optional) - Your custom reference ID

**Example:**
```typescript
const result = await variablesClient.create({
  name: 'API URL',
  key: 'api_url',
  value: 'https://api.example.com',
  tag: 'production',
  refId: 'env-prod',
});
```

##### `getAll(params: IGetAllVariablesRequest): Promise<IApiResponse<IPaginatedResponse<IVariable>>>`

Get all variables with filtering.

**Parameters:**
- `page` (number, required) - Page number
- `take` (number, required) - Items per page
- `tag` (string, optional) - Filter by tag
- `refId` (string, optional) - Filter by reference ID
- `apiKeyId` (string, optional) - Filter by API key

##### `getById(id: string): Promise<IApiResponse<IVariable>>`

Get a specific variable.

##### `update(id: string, data: IUpdateVariableRequest): Promise<IApiResponse<IVariable>>`

Update a variable.

##### `delete(id: string): Promise<IApiResponse<void>>`

Delete a variable.

---

## Social Publisher Workspace Package

### SocialPublisherWorkspaceClient

Manage social media publishing workspaces.

#### Methods

##### `create(data: ICreateWorkspaceRequest): Promise<IApiResponse<IWorkspace>>`

Create a new workspace.

**Parameters:**
- `name` (string, required) - Workspace name
- `description` (string, optional) - Workspace description
- `tag` (string, optional) - Tag for categorization
- `refId` (string, optional) - Your custom reference ID

**Example:**
```typescript
const result = await workspaceClient.create({
  name: 'Client ABC Workspace',
  description: 'Social media for Client ABC',
  tag: 'client-abc',
  refId: 'client-abc-001',
});
```

##### `getAll(params: IGetAllWorkspacesRequest): Promise<IApiResponse<IPaginatedResponse<IWorkspace>>>`

Get all workspaces with filtering.

**Parameters:**
- `page` (number, required) - Page number
- `take` (number, required) - Items per page
- `search` (string, optional) - Search in name/description
- `tag` (string, optional) - Filter by tag
- `refId` (string, optional) - Filter by reference ID
- `apiKeyId` (string, optional) - Filter by API key

##### `getById(id: string): Promise<IApiResponse<IWorkspace>>`

Get a specific workspace.

##### `update(id: string, data: IUpdateWorkspaceRequest): Promise<IApiResponse<IWorkspace>>`

Update a workspace.

##### `delete(id: string): Promise<IApiResponse<void>>`

Delete a workspace.

---

## Social Publisher Task Package

### SocialPublisherTaskClient

Create and manage social media publishing tasks.

#### Methods

##### `create(data: ICreateTaskRequest): Promise<IApiResponse<ITask>>`

Create a new task.

**Parameters:**
- `workspaceId` (string, required) - Workspace ID
- `title` (string, required) - Task title
- `description` (string, optional) - Task description
- `scheduledAt` (Date, optional) - Scheduled publish time
- `tag` (string, optional) - Tag for categorization
- `refId` (string, optional) - Your custom reference ID

**Example:**
```typescript
const result = await taskClient.create({
  workspaceId: 'workspace-123',
  title: 'Black Friday Post',
  description: 'Promotional post',
  scheduledAt: new Date('2024-11-29T10:00:00'),
  tag: 'black-friday-2024',
  refId: 'promo-bf-001',
});
```

##### `getAll(params: IGetAllTasksRequest): Promise<IApiResponse<IPaginatedResponse<ITask>>>`

Get all tasks with filtering.

**Parameters:**
- `page` (number, required) - Page number
- `take` (number, required) - Items per page
- `workspaceId` (string, optional) - Filter by workspace
- `status` (string, optional) - Filter by status ('pending', 'done', etc.)
- `tag` (string, optional) - Filter by tag
- `refId` (string, optional) - Filter by reference ID
- `apiKeyId` (string, optional) - Filter by API key

**Example:**
```typescript
const result = await taskClient.getAll({
  page: 1,
  take: 10,
  tag: 'black-friday-2024',
  status: 'pending',
});
```

##### `getById(id: string): Promise<IApiResponse<ITask>>`

Get a specific task.

##### `update(id: string, data: IUpdateTaskRequest): Promise<IApiResponse<ITask>>`

Update a task.

##### `delete(id: string): Promise<IApiResponse<void>>`

Delete a task.

---

## Common Fields

All resources support these common fields:

### tag (string, optional)
Use for categorization and grouping.

**Examples:**
- `marketing`
- `client-abc`
- `product-launch`
- `black-friday-2024`

**Best Practices:**
- Use lowercase with hyphens
- Be consistent across your application
- Use hierarchical tags: `client-abc-campaign-1`

### refId (string, optional)
Your custom reference ID to link with external systems.

**Examples:**
- `order-12345`
- `user-abc-123`
- `campaign-2024-q1`
- `product-sku-xyz`

**Best Practices:**
- Use your system's primary keys
- Include prefixes for clarity
- Make it unique within your system

### apiKeyId (string, optional - filter only)
Filter resources by the API key that created them.

**Use Cases:**
- Multi-tenant applications
- Environment separation (dev/staging/prod)
- Resource usage tracking

---

## Filtering

All `getAll()` methods support comprehensive filtering:

### Pagination
```typescript
{
  page: 1,        // Page number (starts at 1)
  take: 20,       // Items per page
}
```

### Search
```typescript
{
  search: 'keyword',  // Search in title/description/name
}
```

### Tag Filtering
```typescript
{
  tag: 'marketing',  // Exact match
}
```

### RefId Filtering
```typescript
{
  refId: 'order-123',  // Exact match
}
```

### API Key Filtering
```typescript
{
  apiKeyId: 'key-id',  // Filter by API key
}
```

### Combined Filtering
```typescript
const results = await client.getAll({
  page: 1,
  take: 20,
  search: 'product',
  tag: 'marketing',
  refId: 'campaign-123',
  apiKeyId: 'prod-key',
  // ... other package-specific filters
});
```

---

## Response Format

All API responses follow this format:

```typescript
interface IApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}
```

### Paginated Response
```typescript
interface IPaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  take: number;
  totalPages: number;
}
```

---

## Error Handling

```typescript
try {
  const result = await shortLinkClient.create({
    targetUrl: 'https://example.com',
  });
  
  if (result.success) {
    console.log('Created:', result.items);
  } else {
    console.error('Error:', result.error?.message);
  }
} catch (error) {
  console.error('Request failed:', error);
}
```

---

For more information, visit [https://docs.posty5.com](https://docs.posty5.com)
