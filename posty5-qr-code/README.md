# @posty5/qr-code

Generate and manage customizable QR codes for multiple use cases including URLs, WiFi credentials, email, SMS, phone calls, geolocation, and free text. This package provides a complete TypeScript/JavaScript client for creating professional QR codes with template support, analytics tracking, and dynamic content management.

---

## 🌟 What is Posty5?

**Posty5** is a comprehensive suite of free online tools designed to enhance your digital marketing and social media presence. With over 4+ powerful tools and counting, Posty5 provides everything you need to:

- 🔗 **Shorten URLs** - Create memorable, trackable short links
- 📱 **Generate QR Codes** - Transform URLs, WiFi credentials, contact cards, and more into scannable codes
- 🌐 **Host HTML Pages** - Deploy static HTML pages with dynamic variables and form submission handling
- 📢 **Automate Social Media** - Schedule and manage social media posts across multiple platforms
- 📊 **Track Performance** - Monitor and analyze your digital marketing efforts

Posty5 empowers businesses, marketers, and developers to streamline their online workflows—all from a unified control panel.

**Learn more:** [https://posty5.com](https://posty5.com)

---

## 📦 About This Package

`@posty5/qr-code` is a **specialized tool package** for generating and managing QR codes on the Posty5 platform. It enables developers to build QR code solutions for marketing campaigns, contactless interactions, WiFi sharing, and more.

### Key Capabilities

- **📱 7 QR Code Types** - URL, Free Text, Email, WiFi, SMS, Phone Call, and Geolocation
- **🎨 Template Support** - Apply professional templates for branded QR codes
- **🔄 Dynamic QR Codes** - Update QR code content without changing the code itself
- **📊 Analytics Tracking** - Monitor scans, visitor counts, and last visitor dates
- **🏷️ Tag & Reference Support** - Organize QR codes with custom tags and reference IDs
- **🎯 Landing Pages** - Each QR code gets a custom landing page URL
- **🔗 Short Links** - Automatic short URL generation for easy sharing
- **🔍 Advanced Filtering** - Search and filter by name, status, tag, or reference ID
- **📝 CRUD Operations** - Complete create, read, update, delete operations
- **🔐 API Key Scoping** - Multi-tenant support with API key filtering
- **📈 Pagination Support** - Efficiently handle large QR code collections

### Role in the Posty5 Ecosystem

This package works seamlessly with other Posty5 SDK modules:

- Generate QR codes that link to `@posty5/short-link` shortened URLs
- Create QR codes pointing to `@posty5/html-hosting` hosted pages
- Build comprehensive marketing campaigns with tracking and analytics

Perfect for **businesses**, **event organizers**, **restaurants**, **retail stores**, **marketers**, and **developers** who need contactless solutions, marketing campaigns, product packaging, digital menus, WiFi sharing, contact sharing, and location-based services.

---

## 📥 Installation

Install the package along with the required core dependency:

```bash
npm install @posty5/qr-code @posty5/core
```

---

## 🚀 Quick Start

Here's a minimal example to get you started:

```typescript
import { HttpClient } from "@posty5/core";
import { QRCodeClient } from "@posty5/qr-code";

// Initialize the HTTP client with your API key
const httpClient = new HttpClient({
  apiKey: "your-api-key", // Get from https://studio.posty5.com/account/settings?tab=APIKeys
});

// Create the QR Code client
const qrCodes = new QRCodeClient(httpClient);

// Create a URL QR code
const qrCode = await qrCodes.createURL({
  name: "Website QR Code",
  templateId: "template-123", // Optional: Use a template for branding
  url: {
    url: "https://posty5.com",
  },
  tag: "marketing", // Optional: For organization
  refId: "CAMPAIGN-001", // Optional: External reference
});

console.log("QR Code Landing Page:", qrCode.qrCodeLandingPage);
console.log("Short Link:", qrCode.shorterLink);
console.log("QR Code ID:", qrCode._id);

// List all QR codes
const allQRCodes = await qrCodes.list(
  {},
  {
    page: 1,
    pageSize: 20,
  },
);

console.log(`Total QR codes: ${allQRCodes.pagination.totalCount}`);
allQRCodes.items.forEach((qr) => {
  console.log(`${qr.name}: ${qr.numberOfVisitors} scans`);
});
```

---

## 📚 API Reference & Examples

### Creating QR Codes

The SDK supports 7 different QR code types. Each type has its own creation method with type-specific parameters.

---

#### createURL()

Create a URL QR code that redirects users to a website when scanned.

**Parameters:**

- `data` (ICreateURLQRCodeRequest): QR code data
  - `name` (string, **required**): Human-readable name for the QR code
  - `templateId` (string, **required**): Template ID for styling
  - `url` (object, **required**): URL configuration
    - `url` (string): Target website URL
  - `tag` (string, optional): Custom tag for grouping/filtering
  - `refId` (string, optional): External reference ID from your system

**Returns:** `Promise<ICreateQRCodeResponse>` - Created QR code including:

- `_id` (string): QR code database ID
- `qrCodeId` (string): Unique QR code identifier
- `qrCodeLandingPage` (string): Landing page URL
- `shorterLink` (string): Short URL
- `numberOfVisitors` (number): Scan count
- `status` (string): QR code status

**Example:**

```typescript
// Basic URL QR code
const qrCode = await qrCodes.createURL({
  name: "Company Website",
  templateId: "template-123",
  url: {
    url: "https://example.com",
  },
});

console.log("Scan this:", qrCode.qrCodeLandingPage);
```

```typescript
// Marketing campaign QR code with tags
const campaignQR = await qrCodes.createURL({
  name: "Summer Sale 2026",
  templateId: "template-123",
  url: {
    url: "https://example.com/summer-sale",
  },
  tag: "summer-campaign",
  refId: "SUMMER-2026-001",
});

console.log("Campaign QR:", campaignQR.shorterLink);
```

---

#### createFreeText()

Create a free text QR code with any custom text content. Perfect for plain text messages, serial numbers, or identifiers.

**Parameters:**

- `data` (ICreateFreeTextQRCodeRequest): QR code data
  - `name` (string, **required**): QR code name
  - `templateId` (string, **required**): Template ID
  - `text` (string, **required**): Custom text to encode
  - `tag` (string, optional): Custom tag
  - `refId` (string, optional): External reference ID

**Returns:** `Promise<ICreateQRCodeResponse>`

**Example:**

```typescript
// Product serial number QR code
const serialQR = await qrCodes.createFreeText({
  name: "Product Serial #12345",
  templateId: "template-123",
  text: "SN:12345-ABCDE-67890",
  tag: "inventory",
  refId: "PROD-12345",
});
```

```typescript
// Event ticket QR code
const ticketQR = await qrCodes.createFreeText({
  name: "Concert Ticket",
  templateId: "template-123",
  text: "TICKET-ID:ABC123XYZ-EVENT:CONCERT2026-SEAT:A12",
});

console.log("Ticket QR:", ticketQR.qrCodeLandingPage);
```

---

#### createEmail()

Create an email QR code that opens the default email client with pre-filled recipient, subject, and body.

**Parameters:**

- `data` (ICreateEmailQRCodeRequest): QR code data
  - `name` (string, **required**): QR code name
  - `templateId` (string, **required**): Template ID
  - `email` (object, **required**): Email configuration
    - `email` (string): Recipient email address
    - `subject` (string): Email subject line
    - `body` (string): Email body text
  - `tag` (string, optional): Custom tag
  - `refId` (string, optional): External reference ID

**Returns:** `Promise<ICreateQRCodeResponse>`

**Example:**

```typescript
// Customer support email QR code
const supportQR = await qrCodes.createEmail({
  name: "Contact Support",
  templateId: "template-123",
  email: {
    email: "support@example.com",
    subject: "Support Request from QR Code",
    body: "Hello Support Team,\n\nI need assistance with...",
  },
  tag: "customer-support",
});
```

```typescript
// Feedback request QR code
const feedbackQR = await qrCodes.createEmail({
  name: "Customer Feedback",
  templateId: "template-123",
  email: {
    email: "feedback@restaurant.com",
    subject: "Dining Experience Feedback",
    body: "Thank you for dining with us! Please share your experience:",
  },
});

console.log("Feedback QR:", feedbackQR.qrCodeLandingPage);
```

---

#### createWifi()

Create a WiFi QR code that allows users to connect to a wireless network by scanning the code.

**Parameters:**

- `data` (ICreateWifiQRCodeRequest): QR code data
  - `name` (string, **required**): QR code name
  - `templateId` (string, **required**): Template ID
  - `wifi` (object, **required**): WiFi configuration
    - `name` (string): Network SSID
    - `authenticationType` (string): Authentication type ('WPA', 'WEP', 'nopass')
    - `password` (string): Network password
  - `tag` (string, optional): Custom tag
  - `refId` (string, optional): External reference ID

**Returns:** `Promise<ICreateQRCodeResponse>`

**Example:**

```typescript
// Office WiFi QR code
const officeWifi = await qrCodes.createWifi({
  name: "Office WiFi - Main Floor",
  templateId: "template-123",
  wifi: {
    name: "OfficeNetwork-5G",
    authenticationType: "WPA",
    password: "SecurePassword123!",
  },
  tag: "office-infrastructure",
});

console.log("Place this QR at reception:", officeWifi.qrCodeLandingPage);
```

```typescript
// Guest WiFi QR code
const guestWifi = await qrCodes.createWifi({
  name: "Guest WiFi",
  templateId: "template-123",
  wifi: {
    name: "CafeGuest",
    authenticationType: "WPA",
    password: "Welcome2024",
  },
  tag: "guest-services",
  refId: "CAFE-GUEST-WIFI",
});
```

```typescript
// Open network (no password)
const openWifi = await qrCodes.createWifi({
  name: "Public WiFi",
  templateId: "template-123",
  wifi: {
    name: "PublicNetwork",
    authenticationType: "nopass",
    password: "",
  },
});
```

---

#### createCall()

Create a phone call QR code that initiates a phone call when scanned.

**Parameters:**

- `data` (ICreateCallQRCodeRequest): QR code data
  - `name` (string, **required**): QR code name
  - `templateId` (string, **required**): Template ID
  - `call` (object, **required**): Call configuration
    - `phoneNumber` (string): Phone number to call (include country code)
  - `tag` (string, optional): Custom tag
  - `refId` (string, optional): External reference ID

**Returns:** `Promise<ICreateQRCodeResponse>`

**Example:**

```typescript
// Customer service hotline QR code
const hotlineQR = await qrCodes.createCall({
  name: "Customer Service Hotline",
  templateId: "template-123",
  call: {
    phoneNumber: "+1-800-123-4567",
  },
  tag: "customer-service",
});

console.log("Call us QR:", hotlineQR.qrCodeLandingPage);
```

```typescript
// Emergency contact QR code
const emergencyQR = await qrCodes.createCall({
  name: "Emergency Contact",
  templateId: "template-123",
  call: {
    phoneNumber: "+1-555-911-1234",
  },
  tag: "safety",
  refId: "EMERGENCY-001",
});
```

```typescript
// Business card phone QR code
const businessQR = await qrCodes.createCall({
  name: "John Doe - Direct Line",
  templateId: "template-123",
  call: {
    phoneNumber: "+1-415-555-0123",
  },
  tag: "business-card",
});
```

---

#### createSMS()

Create an SMS QR code that opens the messaging app with a pre-filled phone number and message.

**Parameters:**

- `data` (ICreateSMSQRCodeRequest): QR code data
  - `name` (string, **required**): QR code name
  - `templateId` (string, **required**): Template ID
  - `sms` (object, **required**): SMS configuration
    - `phoneNumber` (string): Recipient phone number
    - `message` (string): Pre-filled message text
  - `tag` (string, optional): Custom tag
  - `refId` (string, optional): External reference ID

**Returns:** `Promise<ICreateQRCodeResponse>`

**Example:**

```typescript
// Contest entry SMS QR code
const contestQR = await qrCodes.createSMS({
  name: "Contest Entry",
  templateId: "template-123",
  sms: {
    phoneNumber: "+1-555-CONTEST",
    message: "ENTER CONTEST2026",
  },
  tag: "marketing-contest",
  refId: "CONTEST-2026",
});

console.log("Contest SMS QR:", contestQR.qrCodeLandingPage);
```

```typescript
// Appointment reminder SMS
const appointmentQR = await qrCodes.createSMS({
  name: "Text for Appointment",
  templateId: "template-123",
  sms: {
    phoneNumber: "+1-555-DOCTOR",
    message: "I would like to schedule an appointment. My name is:",
  },
  tag: "healthcare",
});
```

```typescript
// Feedback SMS QR code
const feedbackSMS = await qrCodes.createSMS({
  name: "Quick Feedback",
  templateId: "template-123",
  sms: {
    phoneNumber: "+1-555-FEEDBACK",
    message: "Service Rating: [1-5 stars] -",
  },
  tag: "customer-feedback",
});
```

---

#### createGeolocation()

Create a geolocation QR code that opens a map application with specific coordinates.

**Parameters:**

- `data` (ICreateGeolocationQRCodeRequest): QR code data
  - `name` (string, **required**): QR code name
  - `templateId` (string, **required**): Template ID
  - `geolocation` (object, **required**): Location configuration
    - `latitude` (number | string): Latitude coordinate
    - `longitude` (number | string): Longitude coordinate
  - `tag` (string, optional): Custom tag
  - `refId` (string, optional): External reference ID

**Returns:** `Promise<ICreateQRCodeResponse>`

**Example:**

```typescript
// Office location QR code
const officeLocation = await qrCodes.createGeolocation({
  name: "Office Location",
  templateId: "template-123",
  geolocation: {
    latitude: 40.7128,
    longitude: -74.006,
  },
  tag: "office-locations",
  refId: "NYC-OFFICE",
});

console.log("Office map QR:", officeLocation.qrCodeLandingPage);
```

```typescript
// Event venue QR code
const venueQR = await qrCodes.createGeolocation({
  name: "Conference Venue",
  templateId: "template-123",
  geolocation: {
    latitude: "37.7749",
    longitude: "-122.4194",
  },
  tag: "event-2026",
  refId: "CONF-VENUE",
});
```

```typescript
// Restaurant location
const restaurantQR = await qrCodes.createGeolocation({
  name: "Find Our Restaurant",
  templateId: "template-123",
  geolocation: {
    latitude: 34.0522,
    longitude: -118.2437,
  },
  tag: "locations",
});

console.log("Visit us:", restaurantQR.shorterLink);
```

---

### Retrieving QR Codes

#### get()

Retrieve complete details of a specific QR code by ID.

**Parameters:**

- `id` (string): The unique QR code ID

**Returns:** `Promise<IGetQRCodeResponse>` - QR code details including:

- `_id` (string): Database ID
- `qrCodeId` (string): Unique identifier
- `name` (string): QR code name
- `templateId` (string): Template ID used
- `numberOfVisitors` (number): Total scan count
- `lastVisitorDate` (string): Last scan timestamp
- `qrCodeLandingPage` (string): Landing page URL
- `shorterLink` (string): Short URL
- `status` (string): Current status
- `qrCodeTarget` (object): Target configuration
- `createdAt` (string): Creation timestamp
- `updatedAt` (string): Last update timestamp

**Example:**

```typescript
const qrCode = await qrCodes.get("qr-code-id-123");

console.log("QR Code Details:");
console.log("  Name:", qrCode.name);
console.log("  Scans:", qrCode.numberOfVisitors);
console.log("  Landing Page:", qrCode.qrCodeLandingPage);
console.log("  Status:", qrCode.status);

if (qrCode.lastVisitorDate) {
  console.log("  Last Scan:", new Date(qrCode.lastVisitorDate).toLocaleString());
}
```

```typescript
// Check QR code performance
const campaignQR = await qrCodes.get("campaign-qr-id");

if (campaignQR.numberOfVisitors > 1000) {
  console.log("🎉 Campaign successful! Over 1000 scans!");
} else {
  console.log(`Current scans: ${campaignQR.numberOfVisitors}`);
}
```

---

#### list()

Search and filter QR codes with advanced pagination and filtering options.

**Parameters:**

- `params` (IListParams, optional): Filter criteria
  - `name` (string, optional): Filter by QR code name
  - `status` (string, optional): Filter by status
  - `tag` (string, optional): Filter by tag
  - `refId` (string, optional): Filter by reference ID
  - `apiKeyId` (string, optional): Filter by API key ID
- `pagination` (IPaginationParams, optional): Pagination options
  - `page` (number, optional): Page number (default: 1)
  - `pageSize` (number, optional): Items per page (default: 10)

**Returns:** `Promise<IPaginationResponse<IQRCode[]>>`

- `items` (array): Array of QR codes
- `pagination` (object): Pagination metadata
  - `page` (number): Current page
  - `pageSize` (number): Items per page
  - `totalCount` (number): Total items
  - `totalPages` (number): Total pages

**Example:**

```typescript
// Get all QR codes
const allQRCodes = await qrCodes.list(
  {},
  {
    page: 1,
    pageSize: 50,
  },
);

console.log(`Total: ${allQRCodes.pagination.totalCount}`);
allQRCodes.items.forEach((qr) => {
  console.log(`${qr.name}: ${qr.numberOfVisitors} scans`);
});
```

```typescript
// Filter by tag - get all marketing QR codes
const marketingQRs = await qrCodes.list({
  tag: "marketing",
});

console.log("Marketing QR Codes:");
marketingQRs.items.forEach((qr) => {
  console.log(`  ${qr.name} - ${qr.shorterLink}`);
});
```

```typescript
// Filter by status - get approved QR codes
const approvedQRs = await qrCodes.list({
  status: "approved",
});

console.log(`${approvedQRs.items.length} approved QR codes`);
```

```typescript
// Search by name
const wifiQRs = await qrCodes.list({
  name: "wifi", // Finds all QR codes with "wifi" in the name
});

console.log(
  "WiFi QR codes:",
  wifiQRs.items.map((qr) => qr.name),
);
```

```typescript
// Filter by reference ID - useful for campaign tracking
const campaignQRs = await qrCodes.list({
  refId: "SUMMER-2026",
});

let totalScans = 0;
campaignQRs.items.forEach((qr) => {
  totalScans += qr.numberOfVisitors || 0;
});

console.log(`Campaign total scans: ${totalScans}`);
```

```typescript
// Pagination example - get second page
const page2 = await qrCodes.list(
  {
    tag: "events",
  },
  {
    page: 2,
    pageSize: 25,
  },
);

console.log(`Page ${page2.pagination.page} of ${page2.pagination.totalPages}`);
```

---

### Updating QR Codes

The SDK provides separate update methods for each QR code type. Update methods allow you to modify QR code content while keeping the same landing page and short URL.

#### updateURL()

Update an existing URL QR code.

**Parameters:**

- `id` (string): QR code ID to update
- `data` (IUpdateURLQRCodeRequest): Updated data (same structure as create)

**Returns:** `Promise<IUpdateQRCodeResponse>`

**Example:**

```typescript
// Update campaign URL
await qrCodes.updateURL("qr-code-id-123", {
  name: "Summer Sale 2026 - Extended!",
  templateId: "template-123",
  url: {
    url: "https://example.com/extended-sale",
  },
  tag: "summer-campaign",
  refId: "SUMMER-2026-001",
});

console.log("QR code updated - same code, new destination!");
```

---

#### updateFreeText()

Update a free text QR code.

**Parameters:**

- `id` (string): QR code ID
- `data` (ICreateFreeTextQRCodeRequest): Updated data

**Returns:** `Promise<ICreateQRCodeResponse>`

**Example:**

```typescript
await qrCodes.updateFreeText("qr-id-123", {
  name: "Product Serial #12345 - Updated",
  templateId: "template-123",
  text: "SN:12345-ABCDE-67890-REV2",
});
```

---

#### updateEmail()

Update an email QR code.

**Parameters:**

- `id` (string): QR code ID
- `data` (IUpdateEmailQRCodeRequest): Updated data

**Returns:** `Promise<IUpdateQRCodeResponse>`

**Example:**

```typescript
await qrCodes.updateEmail("qr-id-123", {
  name: "Updated Support Email",
  templateId: "template-123",
  email: {
    email: "newsupport@example.com",
    subject: "Support Request",
    body: "Updated support message...",
  },
});
```

---

#### updateWifi()

Update a WiFi QR code.

**Parameters:**

- `id` (string): QR code ID
- `data` (IUpdateWifiQRCodeRequest): Updated data

**Returns:** `Promise<IUpdateQRCodeResponse>`

**Example:**

```typescript
// Update WiFi password
await qrCodes.updateWifi("wifi-qr-id", {
  name: "Office WiFi - Updated",
  templateId: "template-123",
  wifi: {
    name: "OfficeNetwork-5G",
    authenticationType: "WPA",
    password: "NewSecurePassword2026!",
  },
});
```

---

#### updateCall()

Update a phone call QR code.

**Parameters:**

- `id` (string): QR code ID
- `data` (IUpdateCallQRCodeRequest): Updated data

**Returns:** `Promise<IUpdateQRCodeResponse>`

**Example:**

```typescript
await qrCodes.updateCall("call-qr-id", {
  name: "Updated Hotline",
  templateId: "template-123",
  call: {
    phoneNumber: "+1-800-NEW-NUMBER",
  },
});
```

---

#### updateSMS()

Update an SMS QR code.

**Parameters:**

- `id` (string): QR code ID
- `data` (IUpdateSMSQRCodeRequest): Updated data

**Returns:** `Promise<IUpdateQRCodeResponse>`

**Example:**

```typescript
await qrCodes.updateSMS("sms-qr-id", {
  name: "Updated Contest",
  templateId: "template-123",
  sms: {
    phoneNumber: "+1-555-CONTEST",
    message: "ENTER NEWCONTEST2026",
  },
});
```

---

#### updateGeolocation()

Update a geolocation QR code.

**Parameters:**

- `id` (string): QR code ID
- `data` (IUpdateGeolocationQRCodeRequest): Updated data

**Returns:** `Promise<IUpdateQRCodeResponse>`

**Example:**

```typescript
// Update to new office location
await qrCodes.updateGeolocation("location-qr-id", {
  name: "New Office Location",
  templateId: "template-123",
  geolocation: {
    latitude: 37.7749,
    longitude: -122.4194,
  },
  refId: "SF-OFFICE",
});
```

---

### Managing QR Codes

#### delete()

Permanently delete a QR code.

**Parameters:**

- `id` (string): QR code ID to delete

**Returns:** `Promise<void>`

**Example:**

```typescript
// Delete a QR code
await qrCodes.delete("qr-code-id-123");
console.log("QR code deleted");
```

```typescript
// Delete with confirmation
async function deleteQRCode(id: string) {
  const qr = await qrCodes.get(id);

  console.log(`Are you sure you want to delete "${qr.name}"?`);
  console.log(`Scans: ${qr.numberOfVisitors}`);

  // After user confirmation
  await qrCodes.delete(id);
  console.log("✓ QR code deleted successfully");
}
```

```typescript
// Clean up old campaign QR codes
const oldCampaign = await qrCodes.list({
  tag: "campaign-2023",
});

for (const qr of oldCampaign.items) {
  await qrCodes.delete(qr._id);
  console.log(`Deleted: ${qr.name}`);
}
```

---

### Complete Workflow Example

Here's a complete example showing a typical QR code management workflow:

```typescript
import { HttpClient } from "@posty5/core";
import { QRCodeClient } from "@posty5/qr-code";

// Initialize
const httpClient = new HttpClient({
  apiKey: process.env.POSTY5_API_KEY!,
});
const qrCodes = new QRCodeClient(httpClient);

const TEMPLATE_ID = "your-template-id";

// 1. Create QR codes for a restaurant
console.log("🍽️ Creating restaurant QR codes...");

// Menu QR code
const menuQR = await qrCodes.createURL({
  name: "Digital Menu",
  templateId: TEMPLATE_ID,
  url: {
    url: "https://restaurant.com/menu",
  },
  tag: "restaurant",
  refId: "MENU-001",
});

console.log("Menu QR:", menuQR.shorterLink);

// WiFi QR code
const wifiQR = await qrCodes.createWifi({
  name: "Guest WiFi",
  templateId: TEMPLATE_ID,
  wifi: {
    name: "RestaurantGuest",
    authenticationType: "WPA",
    password: "Welcome2026",
  },
  tag: "restaurant",
  refId: "WIFI-GUEST",
});

console.log("WiFi QR:", wifiQR.qrCodeLandingPage);

// Feedback SMS QR code
const feedbackQR = await qrCodes.createSMS({
  name: "Quick Feedback",
  templateId: TEMPLATE_ID,
  sms: {
    phoneNumber: "+1-555-FEEDBACK",
    message: "Rate your dining experience (1-5):",
  },
  tag: "restaurant",
  refId: "FEEDBACK",
});

console.log("Feedback QR:", feedbackQR.qrCodeLandingPage);

// Location QR code
const locationQR = await qrCodes.createGeolocation({
  name: "Find Us",
  templateId: TEMPLATE_ID,
  geolocation: {
    latitude: 40.7128,
    longitude: -74.006,
  },
  tag: "restaurant",
  refId: "LOCATION",
});

console.log("Location QR:", locationQR.qrCodeLandingPage);

// 2. List all restaurant QR codes
console.log("\n📋 Restaurant QR Codes:");
const restaurantQRs = await qrCodes.list({
  tag: "restaurant",
});

let totalScans = 0;
restaurantQRs.items.forEach((qr) => {
  const scans = qr.numberOfVisitors || 0;
  totalScans += scans;
  console.log(`  ${qr.name}: ${scans} scans`);
});

console.log(`\nTotal scans across all QR codes: ${totalScans}`);

// 3. Update menu QR code for seasonal menu
console.log("\n🔄 Updating menu for winter season...");
await qrCodes.updateURL(menuQR._id, {
  name: "Winter Menu 2026",
  templateId: TEMPLATE_ID,
  url: {
    url: "https://restaurant.com/menu/winter",
  },
  tag: "restaurant",
  refId: "MENU-WINTER-2026",
});

console.log("✓ Menu QR updated - same code, new menu!");

// 4. Analytics report
console.log("\n📊 Performance Report:");
for (const qr of restaurantQRs.items) {
  const details = await qrCodes.get(qr._id);

  console.log(`\n${details.name}:`);
  console.log(`  Total Scans: ${details.numberOfVisitors || 0}`);

  if (details.lastVisitorDate) {
    console.log(`  Last Scan: ${new Date(details.lastVisitorDate).toLocaleString()}`);
  }

  console.log(`  Landing Page: ${details.qrCodeLandingPage}`);
  console.log(`  Short Link: ${details.shorterLink}`);
}

console.log("\n✓ QR code management complete!");
```

---

### Error Handling

All methods may throw errors from `@posty5/core`. Handle them appropriately:

```typescript
import { AuthenticationError, NotFoundError, ValidationError, RateLimitError } from "@posty5/core";

try {
  const qrCode = await qrCodes.createURL({
    name: "Test QR",
    templateId: "invalid-template",
    url: {
      url: "https://example.com",
    },
  });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error("Invalid API key");
  } else if (error instanceof NotFoundError) {
    console.error("Template not found");
  } else if (error instanceof ValidationError) {
    console.error("Invalid data:", error.errors);
  } else if (error instanceof RateLimitError) {
    console.error("Rate limit exceeded, retry after:", error.retryAfter);
  } else {
    console.error("Unexpected error:", error);
  }
}
```

---

## 📦 Packages

This SDK ecosystem contains the following tool packages:

| Package | Description | Version | GitHub | NPM |
| --- | --- | --- | --- | --- |
| @posty5/short-link | URL shortener client | 1.0.1 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-short-link) | [📦 NPM](https://www.npmjs.com/package/@posty5/short-link) |
| @posty5/qr-code | QR code generator client | 1.0.1 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-qr-code) | [📦 NPM](https://www.npmjs.com/package/@posty5/qr-code) |
| @posty5/html-hosting | HTML hosting client | 1.0.1 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-html-hosting) | [📦 NPM](https://www.npmjs.com/package/@posty5/html-hosting) |
| @posty5/html-hosting-variables | HTML hosting variables client | 1.0.1 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-html-hosting-variables) | [📦 NPM](https://www.npmjs.com/package/@posty5/html-hosting-variables) |
| @posty5/html-hosting-form-submission | Form submission client | 1.0.1 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-html-hosting-form-submission) | [📦 NPM](https://www.npmjs.com/package/@posty5/html-hosting-form-submission) |
| @posty5/social-publisher-workspace | Social publisher workspace client | 1.0.1 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-social-publisher-workspace) | [📦 NPM](https://www.npmjs.com/package/@posty5/social-publisher-workspace) |
| @posty5/social-publisher-task | Social publisher task client | 1.0.1 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-social-publisher-task) | [📦 NPM](https://www.npmjs.com/package/@posty5/social-publisher-task) |

---

## 💻 Node.js Compatibility

- **Node.js**: >= 16.0.0
- **Module Systems**: ESM and CommonJS
- **TypeScript**: Full type definitions included

---

## 🆘 Support

We're here to help you succeed with Posty5!

### Get Help

- **Documentation**: [https://guide.posty5.com](https://guide.posty5.com)
- **Contact Us**: [https://posty5.com/contact-us](https://posty5.com/contact-us)
- **GitHub Issues**: [Report bugs or request features](https://github.com/Posty5/npm-sdk/issues)
- **API Status**: Check API status and uptime at [https://status.posty5.com](https://status.posty5.com)

### Common Issues

1. **Authentication Errors**
   - Ensure your API key is valid and active
   - Get your API key from [studio.posty5.com/account/settings?tab=APIKeys](studio.posty5.com/account/settings?tab=APIKeys)

2. **Network Errors**
   - Check your internet connection
   - Verify firewall settings allow connections to `api.posty5.com`

3. **Rate Limiting**
   - The SDK includes automatic retry logic
   - Check your API plan limits in the dashboard

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

---

## 🔗 Useful Links

- **Website**: [https://posty5.com](https://posty5.com)
- **Dashboard**: [studio.posty5.com/account/settings?tab=APIKeys](studio.posty5.com/account/settings?tab=APIKeys)
- **API Documentation**: [https://docs.posty5.com](https://docs.posty5.com)
- **GitHub**: [https://github.com/Posty5/npm-sdk](https://github.com/Posty5/npm-sdk)

---

Made with ❤️ by the Posty5 team
