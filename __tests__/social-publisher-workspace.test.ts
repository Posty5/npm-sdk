import { HttpClient } from "@posty5/core";
import { SocialPublisherWorkspaceClient } from "@posty5/social-publisher-workspace";
import { TEST_CONFIG, createdResources } from "./setup";
import * as fs from "fs";
import * as path from "path";
function getFile() {
  const filePath = path.join(__dirname, "assets", "logo.png");
  const fileContent = fs.readFileSync(filePath);
  const blob = new Blob([fileContent], { type: "image/png" });
  const file = new File([blob], "logo.png", { type: "image/png" });
  return file;
}
describe("Social Publisher Workspace SDK", () => {
  let httpClient: HttpClient;
  let client!: SocialPublisherWorkspaceClient;
  let createdId: string;
  let workSpaceId = "";

  beforeAll(() => {
    httpClient = new HttpClient({
      apiKey: TEST_CONFIG.apiKey,
      baseUrl: TEST_CONFIG.baseUrl,
      debug: true,
    });
    client = new SocialPublisherWorkspaceClient(httpClient);
  });

  describe("CREATE", () => {
    it("should create a workspace", async () => {
      const result = await client.create(
        {
          name: "Test Workspace - " + Date.now(),
          description: "Workspace created during SDK tests",
        },
        getFile(),
      );

      expect(result).toBeDefined();

      createdId = result;
      createdResources.workspaces.push(createdId);
    });

    it("should create workspace with tag and refId", async () => {
      const result = await client.create({
        name: "Tagged Workspace" + Date.now(),
        tag: "test-tag",
        refId: "WS-" + Date.now(),
        description: "Workspace with tag created during SDK tests",
      });

      expect(result).toBeDefined();
      createdResources.workspaces.push(result);
    });
  });

  describe("GET BY ID", () => {
    it("should get workspace by ID", async () => {
      const result = await client.get(createdId);

      expect(result._id).toBe(createdId);
      expect(result.name).toBeDefined();
    });

    it("should fail with invalid ID", async () => {
      await expect(client.get("invalid-id-123")).rejects.toThrow();
    });
  });

  describe("GET FOR NEW TASK", () => {
    it("should get workspace details for new task", async () => {
      const result = await client.getForNewTask(createdId);

      expect(result._id).toBe(createdId);
      expect(result.name).toBeDefined();
      expect(result.description).toBeDefined();
      expect(result.account).toBeDefined();
    });

    it("should return populated account details", async () => {
      const searchResult = await client.list(
        {},
        {
          page: 1,
          pageSize: 1,
        },
      );

      const result = await client.getForNewTask(searchResult.items[0]._id);

      // Account object should exist
      expect(result.account).toBeDefined();

      //   // Account properties should be defined (even if null/undefined for individual platforms)
      //   expect(result.account).toHaveProperty("youtube");
      //   expect(result.account).toHaveProperty("facebook");
      //   expect(result.account).toHaveProperty("instagram");
      //   expect(result.account).toHaveProperty("tiktok");
    });

    it("should fail with invalid ID", async () => {
      await expect(client.getForNewTask("invalid-id-123")).rejects.toThrow();
    });
  });

  describe("GET LIST", () => {
    it("should get list of workspaces", async () => {
      const result = await client.list(
        {},
        {
          page: 1,
          pageSize: 10,
        },
      );

      expect(result.items).toBeInstanceOf(Array);
      expect(result.pagination.totalCount).toBeGreaterThanOrEqual(0);
    });

    it("should support search", async () => {
      const result = await client.list(
        {
          name: "test",
        },
        {
          page: 1,
          pageSize: 10,
        },
      );

      expect(result.items).toBeInstanceOf(Array);
    });

    it("should filter by tag", async () => {
      const result = await client.list(
        {
          tag: "test-tag",
        },
        {
          page: 1,
          pageSize: 10,
        },
      );

      expect(result.items).toBeInstanceOf(Array);
    });
  });

  describe("UPDATE", () => {
    it("should update workspace", async () => {
      const newName = "Updated Workspace - " + Date.now();
      const result = await client.update(createdResources.workspaces[0], {
        name: newName,
        description: "Updated description",
      });
    });
  });

  describe("DELETE", () => {
    it("should delete workspace", async () => {
      await client.delete(createdId);

      // Verify deletion
      await expect(client.get(createdId)).rejects.toThrow();
    });
  });
});
