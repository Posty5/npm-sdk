# @posty5/html-hosting-variables

Manage dynamic variables for your Posty5-hosted HTML pages. This package provides a complete TypeScript/JavaScript client for creating, updating, and managing key-value variables that can be used across all your hosted HTML content for dynamic content injection and configuration management.

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

`@posty5/html-hosting-variables` is a **specialized tool package** for managing dynamic variables that can be injected into HTML pages hosted on the Posty5 platform. It enables developers to build content management systems with centralized configuration and dynamic content replacement.

### Key Capabilities

- **🔑 Key-Value Storage** - Store dynamic values (API keys, configuration, content) as reusable variables
- **🔄 Real-Time Updates** - Modify variables instantly via API; changes reflect immediately on hosted pages
- **🎯 Variable Injection** - Use variables in HTML pages via `{{variable_key}}` syntax for dynamic content
- **🏷️ Tag & Reference Support** - Organize variables with custom tags and reference IDs
- **🔍 Advanced Filtering** - Search and filter variables by name, key, value, tag, or reference ID
- **⚡ Prefix Validation** - Automatic enforcement of `pst5_` prefix for namespace consistency
- **📝 CRUD Operations** - Complete create, read, update, delete operations for variable management
- **🔐 API Key Filtering** - Scope variables by API key for multi-tenant applications
- **📊 Pagination Support** - Efficiently handle large variable collections
- **🎨 Use Cases** - Perfect for configuration management, A/B testing, feature flags, multi-language content

### Role in the Posty5 Ecosystem

This package works seamlessly with other Posty5 SDK modules:

- Use `@posty5/html-hosting` to create HTML pages that reference variables
- Combine with configuration management systems for centralized settings
- Build dynamic landing pages, promotional banners, or multi-tenant applications

Perfect for **developers**, **marketers**, **product managers**, and **DevOps teams** who need to manage dynamic content, configuration values, API keys, feature flags, announcements, promotions, and other variable data across hosted HTML pages without manual file editing.

---

## 📥 Installation

Install the package along with the required core dependency:

```bash
npm install @posty5/html-hosting-variables @posty5/core
```

---

## 🚀 Quick Start

Here's a minimal example to get you started:

```typescript
import { HttpClient } from "@posty5/core";
import { HtmlHostingVariablesClient } from "@posty5/html-hosting-variables";

// Initialize the HTTP client with your API key
const httpClient = new HttpClient({
  apiKey: "your-api-key", // Get from https://studio.posty5.com/account/settings?tab=APIKeys
});

// Create the Variables client
const variables = new HtmlHostingVariablesClient(httpClient);

// Create a new variable
await variables.create({
  name: "Company Name", // Human-readable name
  key: "pst5_company_name", // Key used in HTML (must start with pst5_)
  value: "Acme Corporation", // The actual value
});

// List all variables
const allVariables = await variables.list(
  {},
  {
    page: 1,
    pageSize: 10,
  },
);

console.log(`Total variables: ${allVariables.pagination.totalItems}`);
allVariables.items.forEach((variable) => {
  console.log(`${variable.key} = ${variable.value}`);
});

// Get a specific variable
const companyName = await variables.get("variable-id-123");
console.log("Company:", companyName.value);

// Update variable value
await variables.update("variable-id-123", {
  name: "Company Name",
  key: "pst5_company_name",
  value: "Acme Corp (Updated)",
});

// Use in HTML page: {{pst5_company_name}} will be replaced with "Acme Corp (Updated)"
```

---

## 📚 API Reference & Examples

### Creating Variables

#### create()

Create a new HTML hosting variable with a name, key, and value. The key must start with `pst5_` prefix for namespace consistency.

**Parameters:**

- `data` (ICreateHtmlHostingVariableRequest): Variable data
  - `name` (string, **required**): Human-readable variable name
  - `key` (string, **required**): Variable key for HTML injection (must start with `pst5_`)
  - `value` (string, **required**): Variable value
  - `tag` (string, optional): Custom tag for grouping/filtering
  - `refId` (string, optional): External reference ID from your system

**Returns:** `Promise<void>`

**Example:**

```typescript
// Basic variable creation
await variables.create({
  name: "Support Email",
  key: "pst5_support_email",
  value: "support@acme.com",
});
```

```typescript
// Variable with tag and reference ID
await variables.create({
  name: "Production API URL",
  key: "pst5_api_url",
  value: "https://api.acme.com",
  tag: "production", // Group by environment
  refId: "env-prod-001", // Your system's identifier
});
```

```typescript
// Multiple related variables
await variables.create({
  name: "Feature Flag - Dark Mode",
  key: "pst5_feature_dark_mode",
  value: "enabled",
  tag: "feature-flags",
});

await variables.create({
  name: "Feature Flag - Beta Features",
  key: "pst5_feature_beta",
  value: "disabled",
  tag: "feature-flags",
});
```

```typescript
// API keys and secrets
await variables.create({
  name: "Stripe Public Key",
  key: "pst5_stripe_public_key",
  value: "pk_test_123456",
  tag: "api-keys",
});
```

**Important:** Keys must start with `pst5_`. If you provide a key without this prefix, an error will be thrown:

```typescript
// ❌ This will throw an error
await variables.create({
  name: "Email",
  key: "email",
  value: "test@example.com",
});
// Error: Key must start with 'pst5_', change to pst5_email

// ✅ Correct format
await variables.create({
  name: "Email",
  key: "pst5_email",
  value: "test@example.com",
});
```

---

### Retrieving Variables

#### get()

Retrieve complete details of a specific variable by ID.

**Parameters:**

- `id` (string): The unique variable ID

**Returns:** `Promise<IGetHtmlHostingVariableResponse>` - Variable details including:

- `_id` (string): Variable ID
- `name` (string): Variable name
- `key` (string): Variable key
- `value` (string): Variable value
- `userId` (string): Owner user ID
- `createdAt` (string): Creation timestamp
- `updatedAt` (string, optional): Last update timestamp

**Example:**

```typescript
const variable = await variables.get("variable-id-123");

console.log("Variable Details:");
console.log("  Name:", variable.name);
console.log("  Key:", variable.key);
console.log("  Value:", variable.value);
console.log("  Created:", new Date(variable.createdAt).toLocaleString());
```

---

#### list()

Search and filter variables with advanced pagination and filtering options. This method returns a paginated list of variables with optional filtering by name, key, value, tag, reference ID, or API key.

**Parameters:**

- `params` (IListParams, optional): Filter criteria
  - `name` (string, optional): Filter by variable name
  - `key` (string, optional): Filter by variable key
  - `value` (string, optional): Filter by variable value
  - `tag` (string, optional): Filter by tag
  - `refId` (string, optional): Filter by reference ID
  - `apiKeyId` (string, optional): Filter by API key ID
- `pagination` (IPaginationParams, optional): Pagination options
  - `page` (number, optional): Page number (default: 1)
  - `pageSize` (number, optional): Items per page (default: 10)

**Returns:** `Promise<ISearchHtmlHostingVariablesResponse>`

- `items` (array): Array of variables
- `pagination` (object): Pagination metadata
  - `page` (number): Current page
  - `pageSize` (number): Items per page
  - `totalItems` (number): Total count
  - `totalPages` (number): Total pages

**Example:**

```typescript
// Get all variables
const allVariables = await variables.list(
  {},
  {
    page: 1,
    pageSize: 50,
  },
);

console.log(`Total: ${allVariables.pagination.totalItems}`);
allVariables.items.forEach((variable) => {
  console.log(`${variable.name} (${variable.key}) = ${variable.value}`);
});
```

```typescript
// Filter by tag - get all production environment variables
const prodVars = await variables.list({
  tag: "production",
});

console.log("Production Variables:");
prodVars.items.forEach((v) => {
  console.log(`  ${v.key}: ${v.value}`);
});
```

```typescript
// Search by key pattern
const apiKeys = await variables.list({
  key: "pst5_api", // Finds all keys containing 'pst5_api'
});

console.log(`Found ${apiKeys.items.length} API-related variables`);
```

```typescript
// Filter by reference ID - useful for multi-tenant apps
const customerVars = await variables.list({
  refId: "customer-12345",
});

console.log(`Variables for customer 12345:`);
customerVars.items.forEach((v) => {
  console.log(`  ${v.name}: ${v.value}`);
});
```

```typescript
// Search by value
const enabledFeatures = await variables.list({
  value: "enabled",
  tag: "feature-flags",
});

console.log("Enabled features:");
enabledFeatures.items.forEach((v) => {
  console.log(`  ${v.name}`);
});
```

```typescript
// Pagination example - get second page
const page2 = await variables.list(
  {
    tag: "configuration",
  },
  {
    page: 2,
    pageSize: 25,
  },
);

console.log(`Page ${page2.pagination.page} of ${page2.pagination.totalPages}`);
```

```typescript
// Filter by API key (for multi-tenant scenarios)
const apiKeyVariables = await variables.list({
  apiKeyId: "api-key-123",
});
```

---

### Managing Variables

#### update()

Update an existing variable's name, key, or value. The key must still start with `pst5_` prefix.

**Parameters:**

- `id` (string): Variable ID to update
- `data` (ICreateHtmlHostingVariableRequest): Updated variable data
  - `name` (string, **required**): Updated variable name
  - `key` (string, **required**): Updated variable key (must start with `pst5_`)
  - `value` (string, **required**): Updated variable value
  - `tag` (string, optional): Updated tag
  - `refId` (string, optional): Updated reference ID

**Returns:** `Promise<void>`

**Example:**

```typescript
// Update variable value
await variables.update("variable-id-123", {
  name: "Support Email",
  key: "pst5_support_email",
  value: "help@acme.com", // Changed from support@acme.com
});
```

```typescript
// Update variable name and tag
await variables.update("variable-id-456", {
  name: "Production API URL (Updated)",
  key: "pst5_api_url",
  value: "https://api-v2.acme.com",
  tag: "production-v2",
  refId: "env-prod-002",
});
```

```typescript
// Toggle feature flag
const featureVar = await variables.get("feature-flag-id");
await variables.update("feature-flag-id", {
  name: featureVar.name,
  key: featureVar.key,
  value: featureVar.value === "enabled" ? "disabled" : "enabled",
  tag: "feature-flags",
});
```

```typescript
// Update multiple variables programmatically
const variableUpdates = [
  { id: "var-1", value: "new-value-1" },
  { id: "var-2", value: "new-value-2" },
  { id: "var-3", value: "new-value-3" },
];

for (const update of variableUpdates) {
  const current = await variables.get(update.id);
  await variables.update(update.id, {
    name: current.name,
    key: current.key,
    value: update.value,
  });
}
```

**Note:** All fields are required. You must provide the current values for fields you don't want to change.

---

#### delete()

Permanently delete a variable. Once deleted, the variable key will no longer be replaced in HTML pages.

**Parameters:**

- `id` (string): Variable ID to delete

**Returns:** `Promise<void>`

**Example:**

```typescript
// Delete a variable
await variables.delete("variable-id-123");
console.log("Variable deleted");
```

```typescript
// Delete with confirmation
async function deleteVariable(id: string) {
  const variable = await variables.get(id);

  console.log(`Are you sure you want to delete "${variable.name}"?`);
  console.log(`Key: ${variable.key}`);
  console.log(`Value: ${variable.value}`);

  // After user confirmation
  await variables.delete(id);
  console.log("✓ Variable deleted successfully");
}
```

```typescript
// Delete all variables with a specific tag
const deprecatedVars = await variables.list({
  tag: "deprecated",
});

for (const variable of deprecatedVars.items) {
  await variables.delete(variable._id);
  console.log(`Deleted: ${variable.key}`);
}
```

---

### Understanding Variable Usage in HTML

Once you create variables, you can use them in your hosted HTML pages by referencing the key with double curly braces:

**HTML Example:**

```html
<!DOCTYPE html>
<html>
  <head>
    <title>{{pst5_company_name}} - Welcome</title>
  </head>
  <body>
    <h1>Welcome to {{pst5_company_name}}</h1>
    <p>Contact us at: {{pst5_support_email}}</p>
    <p>API Endpoint: {{pst5_api_url}}</p>

    <!-- Feature flag example -->
    <div class="{{pst5_feature_dark_mode}}">
      <p>Dark mode is: {{pst5_feature_dark_mode}}</p>
    </div>
  </body>
</html>
```

When this HTML is rendered by Posty5:

- `{{pst5_company_name}}` becomes "Acme Corporation"
- `{{pst5_support_email}}` becomes "support@acme.com"
- `{{pst5_api_url}}` becomes "https://api.acme.com"
- `{{pst5_feature_dark_mode}}` becomes "enabled"

**Key Benefits:**

- ✅ Update once, apply everywhere
- ✅ No HTML file editing required
- ✅ Instant changes across all pages
- ✅ Perfect for A/B testing, feature flags, configuration management

---

### Complete Workflow Example

Here's a complete example showing a typical variable management workflow:

```typescript
import { HttpClient } from "@posty5/core";
import { HtmlHostingVariablesClient } from "@posty5/html-hosting-variables";

// Initialize
const httpClient = new HttpClient({
  apiKey: process.env.POSTY5_API_KEY!,
});
const variables = new HtmlHostingVariablesClient(httpClient);

// 1. Create variables for a new environment
console.log("🔧 Setting up production environment variables...");

await variables.create({
  name: "API Base URL",
  key: "pst5_api_base_url",
  value: "https://api.production.com",
  tag: "production",
  refId: "env-prod",
});

await variables.create({
  name: "Google Analytics ID",
  key: "pst5_ga_tracking_id",
  value: "UA-123456-1",
  tag: "production",
  refId: "env-prod",
});

await variables.create({
  name: "Feature - Beta Access",
  key: "pst5_feature_beta_access",
  value: "disabled",
  tag: "feature-flags",
});

console.log("✓ Environment variables created");

// 2. List all production variables
console.log("\n📋 Production Variables:");
const prodVars = await variables.list({
  tag: "production",
});

prodVars.items.forEach((v) => {
  console.log(`  ${v.name} (${v.key}): ${v.value}`);
});

// 3. Update a feature flag
console.log("\n🚀 Enabling beta access...");
const betaFlag = prodVars.items.find((v) => v.key === "pst5_feature_beta_access");
if (betaFlag) {
  await variables.update(betaFlag._id, {
    name: "Feature - Beta Access",
    key: "pst5_feature_beta_access",
    value: "enabled",
    tag: "feature-flags",
  });
  console.log("✓ Beta access enabled");
}

// 4. Search for specific variables
console.log("\n🔍 Searching for API-related variables...");
const apiVars = await variables.list({
  key: "api",
});

console.log(`Found ${apiVars.items.length} API variables`);
apiVars.items.forEach((v) => {
  console.log(`  ${v.key}: ${v.value}`);
});

// 5. Clean up deprecated variables
console.log("\n🗑️ Cleaning up deprecated variables...");
const deprecated = await variables.list({
  tag: "deprecated",
});

for (const variable of deprecated.items) {
  await variables.delete(variable._id);
  console.log(`  Deleted: ${variable.key}`);
}

console.log("\n✓ Variable management complete!");
```

---

### Error Handling

All methods may throw errors from `@posty5/core`. Handle them appropriately:

```typescript
import { AuthenticationError, NotFoundError, ValidationError, RateLimitError } from "@posty5/core";

try {
  await variables.create({
    name: "Test Variable",
    key: "invalid_key", // Missing pst5_ prefix
    value: "test",
  });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error("Invalid API key");
  } else if (error instanceof NotFoundError) {
    console.error("Variable not found");
  } else if (error instanceof ValidationError) {
    console.error("Invalid data:", error.errors);
  } else if (error instanceof RateLimitError) {
    console.error("Rate limit exceeded, retry after:", error.retryAfter);
  } else if (error.message.includes("pst5_")) {
    console.error("Key validation failed:", error.message);
    // Error: Key must start with 'pst5_', change to pst5_invalid_key
  } else {
    console.error("Unexpected error:", error);
  }
}
```

---

### Use Cases & Patterns

#### Configuration Management

```typescript
// Store application configuration
const config = {};

for (const [name, value] of Object.entries(config)) {
  const key = `pst5_config_${name.toLowerCase().replace(/\s+/g, "_")}`;
  await variables.create({
    name: `Config - ${name}`,
    key,
    value,
    tag: "configuration",
  });
}
```

#### A/B Testing

```typescript
// Create A/B test variants
await variables.create({
  name: "CTA Button Color - Variant A",
  key: "pst5_cta_button_color",
  value: "#ff0000", // Red
  tag: "ab-test-001",
  refId: "variant-a",
});

// Switch to variant B
await variables.update(variantId, {
  name: "CTA Button Color - Variant B",
  key: "pst5_cta_button_color",
  value: "#00ff00", // Green
  tag: "ab-test-001",
  refId: "variant-b",
});
```

#### Multi-Tenant Configuration

```typescript
// Create customer-specific variables
async function setupCustomer(customerId: string, customerName: string) {
  await variables.create({
    name: `${customerName} - Logo URL`,
    key: "pst5_customer_logo",
    value: `https://cdn.example.com/logos/${customerId}.png`,
    tag: "customer",
    refId: customerId,
  });

  await variables.create({
    name: `${customerName} - Primary Color`,
    key: "pst5_customer_primary_color",
    value: "#3498db",
    tag: "customer",
    refId: customerId,
  });
}
```

#### Feature Flags

```typescript
// Manage feature rollout
const features = {
  dark_mode: "enabled",
  new_dashboard: "beta",
  ai_assistant: "disabled",
};

for (const [feature, status] of Object.entries(features)) {
  await variables.create({
    name: `Feature - ${feature.replace("_", " ")}`,
    key: `pst5_feature_${feature}`,
    value: status,
    tag: "feature-flags",
  });
}

// Check feature status
const features = await variables.list({ tag: "feature-flags" });
const enabledFeatures = features.items.filter((f) => f.value === "enabled");
console.log(
  "Enabled features:",
  enabledFeatures.map((f) => f.name),
);
```

---

## 📦 Packages

This SDK ecosystem contains the following tool packages:

| Package | Description | Version | GitHub | NPM |
| --- | --- | --- | --- | --- |
| @posty5/short-link | URL shortener client | 1.0.2 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-short-link) | [📦 NPM](https://www.npmjs.com/package/@posty5/short-link) |
| @posty5/qr-code | QR code generator client | 1.0.2 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-qr-code) | [📦 NPM](https://www.npmjs.com/package/@posty5/qr-code) |
| @posty5/html-hosting | HTML hosting client | 1.0.2 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-html-hosting) | [📦 NPM](https://www.npmjs.com/package/@posty5/html-hosting) |
| @posty5/html-hosting-variables | HTML hosting variables client | 1.0.2 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-html-hosting-variables) | [📦 NPM](https://www.npmjs.com/package/@posty5/html-hosting-variables) |
| @posty5/html-hosting-form-submission | Form submission client | 1.0.2 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-html-hosting-form-submission) | [📦 NPM](https://www.npmjs.com/package/@posty5/html-hosting-form-submission) |
| @posty5/social-publisher-workspace | Social publisher workspace client | 1.0.2 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-social-publisher-workspace) | [📦 NPM](https://www.npmjs.com/package/@posty5/social-publisher-workspace) |
| @posty5/social-publisher-task | Social publisher task client | 1.0.2 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-social-publisher-task) | [📦 NPM](https://www.npmjs.com/package/@posty5/social-publisher-task) |

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
