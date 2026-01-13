# @posty5/qr-code

QR Code management SDK for Posty5 API. Create, manage, and customize QR codes with various target types including URLs, WiFi credentials, emails, SMS, phone calls, and geolocation.

## Installation

```bash
npm install @posty5/qr-code @posty5/core
```

## Quick Start

```typescript
import { HttpClient } from '@posty5/core';
import { QRCodeClient } from '@posty5/qr-code';

// Initialize the HTTP client
const http = new HttpClient({
  baseUrl: 'https://api.posty5.com',
  apiKey: 'your-api-key'
});

// Create QR Code client
const qrCodeClient = new QRCodeClient(http);

// Create a simple URL QR code
const qrCode = await qrCodeClient.create({
  name: 'My Website',
  options: {
    text: 'https://example.com',
    width: 300,
    height: 300,
    colorDark: '#000000',
    colorLight: '#ffffff'
  },
  qrCodeTarget: {
    type: 'url',
    url: {
      url: 'https://example.com'
    }
  }
});

console.log('QR Code created:', qrCode.qrCodeLandingPage);
```

## Features

- ✅ Create QR codes with multiple target types
- ✅ Update existing QR codes
- ✅ List and search QR codes with filters
- ✅ Delete QR codes
- ✅ Lookup QR codes for dropdowns
- ✅ Full TypeScript support
- ✅ Comprehensive error handling
- ✅ Pagination support

## QR Code Target Types

The SDK supports the following QR code target types:

### 1. URL QR Code

```typescript
const urlQR = await qrCodeClient.create({
  name: 'Website Link',
  options: {
    width: 300,
    height: 300
  },
  qrCodeTarget: {
    type: 'url',
    url: {
      url: 'https://example.com'
    }
  }
});
```

### 2. WiFi QR Code

```typescript
const wifiQR = await qrCodeClient.create({
  name: 'Office WiFi',
  options: {
    width: 300,
    height: 300
  },
  qrCodeTarget: {
    type: 'wifi',
    wifi: {
      name: 'OfficeNetwork',
      authenticationType: 'WPA',
      password: 'secret123'
    }
  }
});
```

### 3. Email QR Code

```typescript
const emailQR = await qrCodeClient.create({
  name: 'Contact Email',
  options: {
    width: 300,
    height: 300
  },
  qrCodeTarget: {
    type: 'email',
    email: {
      email: 'contact@example.com',
      subject: 'Hello',
      body: 'I would like to get in touch'
    }
  }
});
```

### 4. SMS QR Code

```typescript
const smsQR = await qrCodeClient.create({
  name: 'Send SMS',
  options: {
    width: 300,
    height: 300
  },
  qrCodeTarget: {
    type: 'sms',
    sms: {
      phoneNumber: '+1234567890',
      message: 'Hello from QR code'
    }
  }
});
```

### 5. Phone Call QR Code

```typescript
const callQR = await qrCodeClient.create({
  name: 'Call Us',
  options: {
    width: 300,
    height: 300
  },
  qrCodeTarget: {
    type: 'call',
    call: {
      phoneNumber: '+1234567890'
    }
  }
});
```

### 6. Geolocation QR Code

```typescript
const locationQR = await qrCodeClient.create({
  name: 'Our Location',
  options: {
    width: 300,
    height: 300
  },
  qrCodeTarget: {
    type: 'geolocation',
    geolocation: {
      latitude: '40.7128',
      longitude: '-74.0060',
      mapURL: 'https://maps.google.com/?q=40.7128,-74.0060'
    }
  }
});
```

## Advanced Customization

### Custom QR Code Styling

```typescript
const styledQR = await qrCodeClient.create({
  name: 'Styled QR Code',
  options: {
    text: 'https://example.com',
    width: 400,
    height: 400,
    colorDark: '#FF6B6B',
    colorLight: '#F0F0F0',
    correctLevel: 3, // High error correction
    dotScale: 0.8,
    quietZone: 20,
    logo: 'https://example.com/logo.png',
    logoWidth: 80,
    logoHeight: 80,
    title: 'Scan Me!',
    titleFont: 'bold 20px Arial',
    titleColor: '#333333',
    titleHeight: 50
  },
  qrCodeTarget: {
    type: 'url',
    url: { url: 'https://example.com' }
  }
});
```

### Using Templates

```typescript
const templatedQR = await qrCodeClient.create({
  name: 'Template QR',
  templateId: 'template_123',
  templateType: 'business',
  options: {
    text: 'https://example.com'
  },
  qrCodeTarget: {
    type: 'url',
    url: { url: 'https://example.com' }
  }
});
```

### Landing Page & Monetization

```typescript
const landingQR = await qrCodeClient.create({
  name: 'QR with Landing Page',
  isEnableLandingPage: true,
  isEnableMonetization: true,
  pageInfo: {
    title: 'Welcome!',
    description: 'This is a custom landing page',
    descriptionIsHtmlFile: false
  },
  subCategory: 1,
  options: {
    width: 300,
    height: 300
  },
  qrCodeTarget: {
    type: 'url',
    url: { url: 'https://example.com' }
  }
});
```

### Custom Landing ID

```typescript
const customQR = await qrCodeClient.create({
  name: 'Custom Landing',
  customLandingId: 'my-custom-id',
  options: {
    width: 300,
    height: 300
  },
  qrCodeTarget: {
    type: 'url',
    url: { url: 'https://example.com' }
  }
});
// Access at: https://qr.posty5.com/my-custom-id
```

## API Methods

### create(data)

Create a new QR code.

**Parameters:**
- `data` (ICreateQRCodeRequest): QR code creation data

**Returns:** Promise<ICreateQRCodeResponse>

### update(id, data)

Update an existing QR code.

**Parameters:**
- `id` (string): QR code ID
- `data` (IUpdateQRCodeRequest): QR code update data

**Returns:** Promise<IUpdateQRCodeResponse>

### get(id)

Get a QR code by ID.

**Parameters:**
- `id` (string): QR code ID

**Returns:** Promise<IGetQRCodeResponse>

### delete(id)

Delete a QR code.

**Parameters:**
- `id` (string): QR code ID

**Returns:** Promise<void>

### list(params?, pagination?)

List QR codes with optional filters and pagination.

**Parameters:**
- `params` (IListParams, optional): Filter parameters
- `pagination` (IPaginationParams, optional): Pagination parameters

**Returns:** Promise<ISearchQRCodesResponse>

**Example:**
```typescript
const result = await qrCodeClient.list(
  {
    status: 'approved',
    tag: 'marketing',
    isEnableLandingPage: true
  },
  {
    page: 1,
    pageSize: 20,
    sortField: 'createdAt',
    sortType: 'desc'
  }
);

console.log(`Total: ${result.pagination.pageSize}`);
result.items.forEach(qr => {
  console.log(`${qr.name}: ${qr.qrCodeLandingPage}`);
});
```

### lookup(term?)

Get a simplified list of QR codes for dropdowns.

**Parameters:**
- `term` (string, optional): Search term

**Returns:** Promise<ILookupQRCodesResponse>

**Example:**
```typescript
const qrCodes = await qrCodeClient.lookup('office');
qrCodes.forEach(qr => {
  console.log(`${qr._id}: ${qr.name}`);
});
```

## Filtering & Searching

### Available Filter Parameters

```typescript
interface IListParams {
  name?: string;              // Filter by QR code name
  qrCodeId?: string;          // Filter by QR code ID
  userId?: string;            // Filter by user ID
  apiKeyId?: string;          // Filter by API key ID
  templateId?: string;        // Filter by template ID
  tag?: string;               // Filter by custom tag
  refId?: string;             // Filter by reference ID
  isEnableLandingPage?: boolean;
  isEnableMonetization?: boolean;
  status?: QrCodeStatusType;  // 'new' | 'pending' | 'approved' | 'rejected'
  createdFrom?: string;       // Filter by source (e.g., 'api', 'web')
}
```

### Example: Complex Filtering

```typescript
const filtered = await qrCodeClient.list(
  {
    status: 'approved',
    tag: 'campaign-2024',
    isEnableLandingPage: true,
    createdFrom: 'api'
  },
  {
    page: 1,
    pageSize: 50,
    sortField: 'numberOfVisitors',
    sortType: 'desc'
  }
);
```

## Using Tags and Reference IDs

Tags and reference IDs allow you to organize and filter QR codes using your own custom identifiers.

```typescript
// Create QR codes with tags and reference IDs
const qr1 = await qrCodeClient.create({
  name: 'Product QR',
  tag: 'product-launch',
  refId: 'PROD-12345',
  options: { width: 300, height: 300 },
  qrCodeTarget: {
    type: 'url',
    url: { url: 'https://example.com/product' }
  }
});

// Later, find all QR codes for this product
const productQRs = await qrCodeClient.list({
  refId: 'PROD-12345'
});

// Or find all QR codes for a campaign
const campaignQRs = await qrCodeClient.list({
  tag: 'product-launch'
});
```

## Error Handling

```typescript
import { 
  AuthenticationError, 
  ValidationError, 
  NotFoundError 
} from '@posty5/core';

try {
  const qrCode = await qrCodeClient.create({
    name: 'Test QR',
    options: { width: 300, height: 300 },
    qrCodeTarget: {
      type: 'url',
      url: { url: 'https://example.com' }
    }
  });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API key');
  } else if (error instanceof ValidationError) {
    console.error('Invalid data:', error.errors);
  } else if (error instanceof NotFoundError) {
    console.error('QR code not found');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## TypeScript Support

This package is written in TypeScript and includes full type definitions.

```typescript
import type {
  ICreateQRCodeRequest,
  IQRCodeResponse,
  QrCodeStatusType,
  QrCodeTargetType
} from '@posty5/qr-code';
```

## License

MIT

## Support

For issues and questions, please visit [Posty5 Support](https://posty5.com/support)
