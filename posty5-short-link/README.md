# @posty5/short-link

Short Link management SDK for Posty5 API.

## Installation

```bash
npm install @posty5/core @posty5/short-link
```

## Usage

### Basic Setup

```typescript
import { HttpClient } from '@posty5/core';
import { ShortLinkClient } from '@posty5/short-link';

// Create HTTP client with your API credentials
const http = new HttpClient({
  baseUrl: 'https://api.posty5.com',
  apiKey: 'your-api-key',
});

// Create ShortLink client
const shortLinkClient = new ShortLinkClient(http);
```

### Create a Short Link

```typescript
const newLink = await shortLinkClient.create({
  baseUrl: 'https://google.com',
  name: 'My Google Link',
});

console.log('Short Link created:', newLink.shorterLink);
```

### Get a Short Link

```typescript
const link = await shortLinkClient.get('link-id');
console.log('Link:', link.shorterLink);
```

### Update a Short Link

```typescript
const updated = await shortLinkClient.update('link-id', {
  name: 'Updated Name',
  isEnableMonetization: true
});
```

### Delete a Short Link

```typescript
await shortLinkClient.delete('link-id');
```

### Search Short Links

```typescript
const results = await shortLinkClient.search({
  name: 'My Link',
});

console.log('Found:', results.pagination.totalItems);
```

### Lookup Short Links

```typescript
const lookup = await shortLinkClient.lookup();
lookup.forEach((item) => {
  console.log(`${item.name}`);
});
```

## License

MIT
