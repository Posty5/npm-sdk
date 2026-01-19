# @posty5/html-hosting-variables

> HTML hosting variables management SDK for Posty5 API

This package provides a TypeScript SDK for managing HTML hosting variables in the Posty5 platform. Variables allow you to define dynamic key-value pairs that can be used across your HTML pages.

## Installation

```bash
npm install @posty5/html-hosting-variables @posty5/core
```

## Quick Start

```typescript
import { Posty5Client } from "@posty5/core";
import { HtmlHostingVariablesClient } from "@posty5/html-hosting-variables";

// Initialize the core client
const posty5 = new Posty5Client({
  apiKey: "your-api-key",
  baseURL: "https://api.posty5.com",
});

// Create the HTML hosting variables client
const variablesClient = new HtmlHostingVariablesClient(posty5.http);

// Create a variable
await variablesClient.create({
  name: "API Key",
  key: "api_key",
  value: "sk_test_123456",
});

// List all variables
const variables = await variablesClient.list({
  page: 1,
  limit: 10,
});

console.log(variables.data);
```

## API Reference

### `HtmlHostingVariablesClient`

The main client class for managing HTML hosting variables.

#### Constructor

```typescript
new HtmlHostingVariablesClient(http: HttpClient)
```

**Parameters:**

- `http` - HTTP client instance from `@posty5/core`

---

#### `create(data)`

Create a new HTML hosting variable.

```typescript
async create(data: ICreateHtmlHostingVariableRequest): Promise<void>
```

**Parameters:**

- `data.name` (string, required) - Variable name
- `data.key` (string, required) - Variable key (will be trimmed)
- `data.value` (string, required) - Variable value

**Example:**

```typescript
await variablesClient.create({
  name: "API Key",
  key: "api_key",
  value: "sk_test_123456",
});
```

---

#### `get(id)`

Get an HTML hosting variable by ID.

```typescript
async get(id: string): Promise<IGetHtmlHostingVariableResponse>
```

**Parameters:**

- `id` (string) - Variable ID

**Returns:**

- `IGetHtmlHostingVariableResponse` - Variable details

**Example:**

```typescript
const variable = await variablesClient.get("variable_id_123");
console.log(variable.key, variable.value);
```

---

#### `update(id, data)`

Update an existing HTML hosting variable.

```typescript
async update(id: string, data: ICreateHtmlHostingVariableRequest): Promise<void>
```

**Parameters:**

- `id` (string) - Variable ID to update
- `data.name` (string, required) - Updated variable name
- `data.key` (string, required) - Updated variable key
- `data.value` (string, required) - Updated variable value

**Example:**

```typescript
await variablesClient.update("variable_id_123", {
  name: "Updated API Key",
  key: "api_key",
  value: "sk_live_789012",
});
```

---

#### `delete(id)`

Delete an HTML hosting variable.

```typescript
async delete(id: string): Promise<void>
```

**Parameters:**

- `id` (string) - Variable ID to delete

**Example:**

```typescript
await variablesClient.delete("variable_id_123");
```

---

#### `list(params?)`

List HTML hosting variables with pagination and optional search.

```typescript
async list(params?: IPaginationParams & { search?: string; userId?: string }): Promise<ISearchHtmlHostingVariablesResponse>
```

**Parameters:**

- `params.page` (number, optional) - Page number (default: 1)
- `params.limit` (number, optional) - Items per page (default: 10)
- `params.search` (string, optional) - Search query (searches in name, key, and value)
- `params.userId` (string, optional) - Filter by user ID (admin only)

**Returns:**

- `ISearchHtmlHostingVariablesResponse` - Paginated list of variables

**Example:**

```typescript
const result = await variablesClient.list({
  page: 1,
  limit: 10,
  search: "api",
});

console.log(result.items); // Array of variables
console.log(result.total); // Total count
console.log(result.page); // Current page
console.log(result.limit); // Items per page
```

---

## TypeScript Interfaces

### Request Interfaces

#### `ICreateHtmlHostingVariableRequest`

```typescript
interface ICreateHtmlHostingVariableRequest {
  name: string; // Variable name
  key: string; // Variable key (will be trimmed)
  value: string; // Variable value
}
```

### Response Interfaces

#### `IHtmlHostingVariableResponse`

```typescript
interface IHtmlHostingVariableResponse {
  _id: string; // Variable ID
  name: string; // Variable name
  key: string; // Variable key
  value: string; // Variable value
  userId: string; // Owner user ID
  createdAt: string; // Created date (ISO 8601)
  updatedAt?: string; // Updated date (ISO 8601)
}
```

#### `ISearchHtmlHostingVariablesResponse`

```typescript
type ISearchHtmlHostingVariablesResponse = IPaginationResponse<IHtmlHostingVariableResponse>;

// IPaginationResponse structure:
interface IPaginationResponse<T> {
  data: T[]; // Array of items
  total: number; // Total count
  page: number; // Current page
  limit: number; // Items per page
  totalPages: number; // Total pages
}
```

---

## Use Cases

### 1. Store Configuration Values

```typescript
// Store API keys, tokens, or configuration values
await variablesClient.create({
  name: "Stripe API Key",
  key: "stripe_api_key",
  value: "sk_test_...",
});

await variablesClient.create({
  name: "Google Analytics ID",
  key: "ga_id",
  value: "UA-123456-1",
});
```

### 2. Dynamic Content Replacement

```typescript
// Create variables that can be used in your HTML pages
await variablesClient.create({
  name: "Company Name",
  key: "company_name",
  value: "Acme Corporation",
});

await variablesClient.create({
  name: "Support Email",
  key: "support_email",
  value: "support@acme.com",
});
```

### 3. Search and Filter Variables

```typescript
// Search for variables containing "api"
const apiVariables = await variablesClient.list({
  search: "api",
  limit: 20,
});

// Paginate through all variables
for (let page = 1; page <= 5; page++) {
  const result = await variablesClient.list({ page, limit: 10 });
  console.log(`Page ${page}:`, result.items);
}
```

### 4. Update Variables

```typescript
// Get a variable
const variable = await variablesClient.get("variable_id_123");

// Update it
await variablesClient.update(variable._id, {
  name: variable.name,
  key: variable.key,
  value: "new_value",
});
```

---

## Error Handling

All methods throw exceptions on API errors. Always wrap calls in try-catch blocks:

```typescript
try {
  await variablesClient.create({
    name: "Test Variable",
    key: "test_key",
    value: "test_value",
  });
} catch (error) {
  console.error("Failed to create variable:", error.message);
}
```

Common errors:

- **"Key Is Already Added Before"** - The key already exists for this user
- **"Enter Valid Values"** - Invalid request data (missing required fields)
- **"Item Is Not Found"** - Variable with the given ID doesn't exist
- **"You have not permission to do that"** - Attempting to access another user's variable

---

## Notes

- Variable keys are automatically trimmed of whitespace
- Each user can only access their own variables (unless admin)
- Duplicate keys are not allowed per user
- When a variable is created, updated, or deleted, the cache is automatically cleared and all user HTML pages are purged

---

## License

MIT

---

## Support

For issues and questions, please visit [Posty5 Support](https://posty5.com/en/contact-us)
