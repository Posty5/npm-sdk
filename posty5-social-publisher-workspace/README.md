# @posty5/social-publisher-workspace

Values Social Publisher Organization management SDK for Posty5 API.

## Installation

```bash
npm install @posty5/core @posty5/social-publisher-workspace
```

## Usage

### Basic Setup

```typescript
import { HttpClient } from '@posty5/core';
import { SocialPublisherWorkspaceClient } from '@posty5/social-publisher-workspace';

// Create HTTP client
const http = new HttpClient({
  baseUrl: 'https://api.posty5.com',
  apiKey: 'your-api-key',
});

// Create client
const orgClient = new SocialPublisherWorkspaceClient(http);
```

### Create Organization

```typescript
const orgId = await orgClient.create({
  name: 'My Organization',
  description: 'Marketing Team'
});
console.log('Created Organization ID:', orgId);
```

### Get Organization

```typescript
const org = await orgClient.get('org-id');
console.log('Organization:', org.name);
```

### Update Organization

```typescript
await orgClient.update('org-id', {
  name: 'Updated Name',
  description: 'Updated Description'
});
```

### Delete Organization

```typescript
await orgClient.delete('org-id');
```

### Search Organizations

```typescript
const results = await orgClient.search({
  name: 'Marketing'
});

console.log('Found:', results.pagination.totalItems);
```

## License

MIT
