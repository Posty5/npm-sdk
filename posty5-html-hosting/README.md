# @posty5/html-hosting

HTML page hosting and management SDK for Posty5 API.

## Installation

```bash
npm install @posty5/core @posty5/html-hosting
```

## Usage

### Basic Setup

```typescript
import { HttpClient } from '@posty5/core';
import { HtmlHostingClient } from '@posty5/html-hosting';

// Create HTTP client with your API credentials
const http = new HttpClient({
  baseUrl: 'https://api.posty5.com',
  apiKey: 'your-api-key',
});

// Create HTML Hosting client
const htmlHosting = new HtmlHostingClient(http);
```

### Create an HTML Page

```typescript
const newPage = await htmlHosting.create({
  title: 'My Landing Page',
  description: 'A beautiful landing page',
  content: '<html><body><h1>Hello World!</h1></body></html>',
  seo: {
    title: 'My Landing Page - SEO Title',
    description: 'SEO description for my page',
    keywords: ['landing', 'page', 'html'],
  },
  tags: ['marketing', 'landing-page'],
});

console.log('Page created:', newPage.url);
```

### Get an HTML Page

```typescript
const page = await htmlHosting.get('page-id');
console.log('Page:', page.title);
```

### Update an HTML Page

```typescript
const updated = await htmlHosting.update('page-id', {
  title: 'Updated Title',
  content: '<html><body><h1>Updated Content</h1></body></html>',
});
```

### Publish an HTML Page

```typescript
const published = await htmlHosting.publish('page-id');
console.log(published.message);
```

### Search HTML Pages

```typescript
const results = await htmlHosting.search({
  page: 1,
  limit: 20,
  search: 'landing',
  sortBy: 'createdAt',
  sortOrder: 'desc',
});

console.log('Found:', results.pagination.totalItems);
results.data.forEach((page) => {
  console.log(`- ${page.title}: ${page.url}`);
});
```

### Get Pages Lookup

```typescript
const lookup = await htmlHosting.lookup();
lookup.forEach((item) => {
  console.log(`${item.title}: ${item.url}`);
});
```

### Get Form IDs from a Page

```typescript
const forms = await htmlHosting.lookupForms('page-id');
forms.forEach((form) => {
  console.log(`Form: ${form.name} (${form.id})`);
});
```

### Clean Page Cache

```typescript
const result = await htmlHosting.cleanCache('page-id');
console.log(result.message);
```

### Get File Content

```typescript
const file = await htmlHosting.getFile('page-id');
console.log('Content:', file.content);
```

### Get GitHub File via Proxy

```typescript
const githubFile = await htmlHosting.getGithubFileProxy({
  url: 'https://raw.githubusercontent.com/user/repo/main/file.html',
});
console.log('Content:', githubFile.content);
```

### Delete an HTML Page

```typescript
const result = await htmlHosting.delete('page-id');
console.log(result.message);
```

## API Reference

### HtmlHostingClient

#### Methods

##### `create(data: CreateHtmlPageRequest): Promise<HtmlPageResponse>`
Create a new HTML page.

##### `get(id: string): Promise<HtmlPageResponse>`
Get an HTML page by ID.

##### `update(id: string, data: UpdateHtmlPageRequest): Promise<HtmlPageResponse>`
Update an existing HTML page.

##### `delete(id: string): Promise<DeleteHtmlPageResponse>`
Delete an HTML page.

##### `search(params?: PaginationParams & SearchParams): Promise<SearchHtmlPagesResponse>`
Search HTML pages with pagination and filters.

##### `lookup(): Promise<LookupHtmlPagesResponse>`
Get a simplified list of HTML pages for lookups.

##### `lookupForms(id: string): Promise<LookupFormsResponse>`
Get form IDs from an HTML page.

##### `publish(id: string): Promise<PublishHtmlPageResponse>`
Publish an HTML page.

##### `cleanCache(id: string): Promise<CleanCacheResponse>`
Clean cache for an HTML page.

##### `getFile(id: string): Promise<FileContentResponse>`
Get file content from storage.

##### `getGithubFileProxy(params: GithubProxyParams): Promise<GithubFileProxyResponse>`
Get GitHub file content via proxy.

##### `list(params?: PaginationParams): Promise<SearchHtmlPagesResponse>`
Alias for `search()`.

### Types

#### CreateHtmlPageRequest
```typescript
interface CreateHtmlPageRequest {
  title: string;
  description?: string;
  content: string;
  customDomain?: string;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  tags?: string[];
}
```

#### UpdateHtmlPageRequest
```typescript
interface UpdateHtmlPageRequest {
  title?: string;
  description?: string;
  content?: string;
  customDomain?: string;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  tags?: string[];
}
```

#### HtmlPageResponse
```typescript
interface HtmlPageResponse {
  _id: string;
  title: string;
  description?: string;
  content: string;
  url: string;
  customDomain?: string;
  status: 'draft' | 'published' | 'pending' | 'rejected';
  userId: string;
  viewCount: number;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}
```

## Error Handling

```typescript
import { 
  AuthenticationError, 
  ValidationError,
  NotFoundError 
} from '@posty5/core';

try {
  const page = await htmlHosting.create({ /* ... */ });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Authentication failed');
  } else if (error instanceof ValidationError) {
    console.error('Validation errors:', error.errors);
  } else if (error instanceof NotFoundError) {
    console.error('Page not found');
  }
}
```

## License

MIT

## Related Packages

- [@posty5/core](https://www.npmjs.com/package/@posty5/core) - Core HTTP client (required)
- [@posty5/qr-code](https://www.npmjs.com/package/@posty5/qr-code) - QR code generation
- [@posty5/short-link](https://www.npmjs.com/package/@posty5/short-link) - URL shortening
- [@posty5/sdk](https://www.npmjs.com/package/@posty5/sdk) - Complete SDK
