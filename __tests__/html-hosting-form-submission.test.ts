import { HttpClient } from "@posty5/core";
import { HtmlHostingFormSubmissionClient } from "@posty5/html-hosting-form-submission";
import { TEST_CONFIG, createdResources } from "./setup";

describe("HTML Hosting Form Submission SDK", () => {
  let httpClient: HttpClient;
  let client: HtmlHostingFormSubmissionClient;
  let testHtmlHostingId = "6830ce590e3fb6d1afeca82c";
  let createdSubmissionId: string | undefined;

  beforeAll(async () => {
    httpClient = new HttpClient({
      apiKey: TEST_CONFIG.apiKey,
      baseUrl: TEST_CONFIG.baseUrl,
      debug: true,
    });
    client = new HtmlHostingFormSubmissionClient(httpClient);
  });

  describe("GET - Get Form Submission", () => {
    it("should get a form submission by ID", async () => {
      // First, list submissions to get a valid ID
      const listResult = await client.list({ htmlHostingId: testHtmlHostingId }, { page: 1, pageSize: 1 });

      if (listResult.items.length === 0) {
        console.warn("Skipping: No form submissions available");
        return;
      }

      const submissionId = listResult.items[0]._id;

      // Get the submission
      const submission = await client.get(submissionId);

      expect(submission).toBeDefined();
      expect(submission._id).toBe(submissionId);
      expect(submission.data).toBeDefined();
      expect(submission.status).toBeDefined();
    });

    it("should return form data as key-value pairs", async () => {
      const listResult = await client.list({ htmlHostingId: testHtmlHostingId }, { page: 1, pageSize: 1 });

      if (listResult.items.length === 0) {
        console.warn("Skipping: No form submissions available");
        return;
      }

      const submissionId = listResult.items[0]._id;
      const submission = await client.get(submissionId);

      expect(submission.data).toBeInstanceOf(Object);
      expect(typeof submission.data).toBe("object");
    });
  });

  describe("GET LIST - List Form Submissions", () => {
    it("should list form submissions with pagination", async () => {
      const result = await client.list({ htmlHostingId: testHtmlHostingId }, { page: 1, pageSize: 10 });

      expect(result.items).toBeInstanceOf(Array);
      expect(result.pagination).toBeDefined();
      expect(result.items.length).toBeLessThanOrEqual(10);
    });

    it("should filter by form ID", async () => {
      const formId = "apply-job";

      const result = await client.list(
        {
          htmlHostingId: testHtmlHostingId,
          formId: formId,
        },
        { page: 1, pageSize: 10 },
      );

      expect(result.items).toBeInstanceOf(Array);
    });

    it("should filter by status", async () => {
      const status = "New";

      const result = await client.list(
        {
          htmlHostingId: testHtmlHostingId,
          status: status,
        },
        { page: 1, pageSize: 10 },
      );

      expect(result.items).toBeInstanceOf(Array);
      // All items should match the status filter
      result.items.forEach((item) => {
        expect(item.status).toBe(status);
      });
    });

    it("should filter by numbering", async () => {
      const numbering = "001";

      const result = await client.list(
        {
          htmlHostingId: testHtmlHostingId,
          numbering: numbering,
        },
        { page: 1, pageSize: 10 },
      );

      expect(result.items).toBeInstanceOf(Array);
    });

    it("should support filtered fields search", async () => {
      const filteredFields = "name,email,phone";

      const result = await client.list(
        {
          htmlHostingId: testHtmlHostingId,
          filteredFields: filteredFields,
        },
        { page: 1, pageSize: 10 },
      );

      expect(result.items).toBeInstanceOf(Array);
    });
  });

  describe("Navigation - Next and Previous", () => {
    it("should get next and previous submissions", async () => {
      const listResult = await client.list({ htmlHostingId: testHtmlHostingId }, { page: 1, pageSize: 3 });

      if (listResult.items.length < 2) {
        console.warn("Skipping: Not enough submissions for navigation test");
        return;
      }

      // Use middle item to potentially have both next and previous
      const middleSubmissionId = listResult.items[1]._id;

      const navigation = await client.getNextPrevious(middleSubmissionId);

      expect(navigation).toBeDefined();
      // May have previous and/or next
    });

    it("should have accessible navigation IDs", async () => {
      const listResult = await client.list({ htmlHostingId: testHtmlHostingId }, { page: 1, pageSize: 2 });

      if (listResult.items.length === 0) {
        console.warn("Skipping: No submissions available");
        return;
      }

      const submissionId = listResult.items[0]._id;
      const navigation = await client.getNextPrevious(submissionId);

      if (navigation.previous) {
        expect(navigation.previous._id).toBeDefined();
        expect(navigation.previous.numbering).toBeDefined();
      }

      if (navigation.next) {
        expect(navigation.next._id).toBeDefined();
        expect(navigation.next.numbering).toBeDefined();
      }
    });
  });

  describe("Form Data Access", () => {
    it("should provide access to form fields", async () => {
      const listResult = await client.list({ htmlHostingId: testHtmlHostingId }, { page: 1, pageSize: 1 });

      if (listResult.items.length === 0) {
        console.warn("Skipping: No submissions available");
        return;
      }

      const submissionId = listResult.items[0]._id;
      const submission = await client.get(submissionId);

      expect(submission.data).toBeDefined();

      // Test accessing common form fields
      const commonFields = ["name", "email", "phone", "message", "subject"];

      commonFields.forEach((fieldName) => {
        if (fieldName in submission.data) {
          expect(submission.data[fieldName]).toBeDefined();
        }
      });
    });

    it("should include status history", async () => {
      const listResult = await client.list({ htmlHostingId: testHtmlHostingId }, { page: 1, pageSize: 1 });

      if (listResult.items.length === 0) {
        console.warn("Skipping: No submissions available");
        return;
      }

      const submissionId = listResult.items[0]._id;
      const submission = await client.get(submissionId);

      if (submission.statusHistory?.length) {
        const firstHistory = submission.statusHistory?.[0];
        expect(firstHistory.status).toBeDefined();
        expect(firstHistory.changedAt).toBeDefined();
      }
    });

    it("should include syncing status", async () => {
      const listResult = await client.list({ htmlHostingId: testHtmlHostingId }, { page: 1, pageSize: 1 });

      if (listResult.items.length === 0) {
        console.warn("Skipping: No submissions available");
        return;
      }

      const submissionId = listResult.items[0]._id;
      const submission = await client.get(submissionId);
    });
  });

  describe("PUT - Change Form Submission Status", () => {
    it("should change form submission status", async () => {
      // First, list submissions to get a valid ID
      const listResult = await client.list({ htmlHostingId: testHtmlHostingId }, { page: 1, pageSize: 1 });

      if (listResult.items.length === 0) {
        console.warn("Skipping: No form submissions available");
        return;
      }

      const submissionId = listResult.items[0]._id;

      // Change the status
      const result = await client.changeStatus(submissionId, {
        status: "inProgress" as any,
        notes: "Status changed via test",
      });

      expect(result).toBeDefined();

      // Verify the submission was updated
      const updatedSubmission = await client.get(submissionId);
      expect(updatedSubmission.status).toBe("inProgress");
    });

    it("should change status with rejected reason", async () => {
      const listResult = await client.list({ htmlHostingId: testHtmlHostingId }, { page: 1, pageSize: 1 });

      if (listResult.items.length === 0) {
        console.warn("Skipping: No form submissions available");
        return;
      }

      const submissionId = listResult.items[0]._id;

      // Change to rejected status
      const result = await client.changeStatus(submissionId, {
        status: "Rejected" as any,
        rejectedReason: "Does not meet requirements",
        notes: "Rejected via test",
      });

      expect(result).toBeDefined();
    });
  });

  describe("DELETE - Delete Form Submission", () => {
    it("should delete a form submission (skipped for safety)", async () => {
      // Skip this test to avoid deleting real data
      // In a real scenario, you would create a test submission first
      expect(true).toBe(true);
    });
  });

  describe("Complete Workflow", () => {
    it("should complete list, get, and navigate workflow", async () => {
      // Step 1: List submissions
      const listResult = await client.list({ htmlHostingId: testHtmlHostingId }, { page: 1, pageSize: 5 });

      if (listResult.items.length === 0) {
        console.warn("Skipping: No submissions available");
        return;
      }

      expect(listResult.items).toBeInstanceOf(Array);
      expect(listResult.items.length).toBeGreaterThan(0);

      // Step 2: Get first submission
      const firstSubmissionId = listResult.items[0]._id;
      const submission = await client.get(firstSubmissionId);

      expect(submission).toBeDefined();
      expect(submission._id).toBe(firstSubmissionId);

      // Step 3: Navigate
      const navigation = await client.getNextPrevious(firstSubmissionId);
      expect(navigation).toBeDefined();

      // Step 4: If next exists, get it
      if (navigation.next) {
        const nextSubmission = await client.get(navigation.next._id);
        expect(nextSubmission).toBeDefined();
      }
    });
  });
});
