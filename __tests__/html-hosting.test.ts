import { HttpClient } from "@posty5/core";
import { HtmlHostingClient } from "@posty5/html-hosting";
import { TEST_CONFIG, createdResources } from "./setup";
import * as fs from "fs";
import * as path from "path";

function getFile() {
  // Load HTML file from assets
  const htmlPath = path.join(__dirname, "assets", "contact_form.html");
  const htmlContent = fs.readFileSync(htmlPath, "utf-8");

  // Create a File object from HTML content
  const blob = new Blob([htmlContent], { type: "text/html" });
  //const file = new File([blob], "contact_form.html", { type: "text/html" });
  return blob;
}
describe("HTML Hosting SDK", () => {
  let httpClient: HttpClient;
  let client: HtmlHostingClient;
  let createdIdWithFile: string;
  let createdIdWithGithub: string;

  beforeAll(() => {
    httpClient = new HttpClient({
      apiKey: TEST_CONFIG.apiKey,
      baseUrl: TEST_CONFIG.baseUrl,
      debug: true,
    });
    client = new HtmlHostingClient(httpClient);
    console.log("🚀 Starting HTML Hosting SDK Tests", httpClient);
  });

  describe("CREATE - With File Upload", () => {
    it("should create an HTML hosting page with file", async () => {
      const file = getFile();

      const result = await client.createWithFile(
        {
          name: "Test Contact Form - " + Date.now(),
          fileName: "contact_form.html",
        },
        file
      );

      expect(result._id).toBeDefined();
      expect(result.shorterLink).toBeDefined();
      expect(result.fileUrl).toBeDefined();

      createdIdWithFile = result._id;
      createdResources.htmlHostings.push(createdIdWithFile);
    });

    it("should create HTML page with custom landing ID", async () => {
      const file = getFile();

      const customId = "custom-" + Date.now();
      const result = await client.createWithFile(
        {
          name: "Custom Landing ID Page",
          fileName: "custom.html",
          customLandingId: customId,
        },
        file
      );

      expect(result._id).toBeDefined();
      expect(result.shorterLink).toContain(customId);
      createdResources.htmlHostings.push(result._id);
    });

    it("should create HTML page with monetization enabled", async () => {
      const file = getFile();

      const result = await client.createWithFile(
        {
          name: "Monetized Page",
          fileName: "monetized.html",
          isEnableMonetization: true,
        },
        file
      );

      expect(result._id).toBeDefined();
      createdResources.htmlHostings.push(result._id);
    });

    it("should create HTML page with Google Sheet auto-save", async () => {
      const file = getFile();

      const result = await client.createWithFile(
        {
          name: "Auto-Save Page",
          fileName: "autosave.html",
          autoSaveInGoogleSheet: true,
        },
        file
      );

      expect(result._id).toBeDefined();
      createdResources.htmlHostings.push(result._id);
    });

    it("should create HTML page with tag and refId", async () => {
      const file = getFile();

      const result = await client.createWithFile(
        {
          name: "Tagged Page",
          fileName: "tagged.html",
          tag: "test-tag",
          refId: "REF-" + Date.now(),
        },
        file
      );

      expect(result._id).toBeDefined();
      createdResources.htmlHostings.push(result._id);
    });
  });

  describe("CREATE - With GitHub File", () => {
    it("should create HTML page from GitHub", async () => {
      const result = await client.createWithGithubFile({
        name: "Test GitHub HTML Page - " + Date.now(),
        githubInfo: {
          fileURL: "https://github.com/Netflix/netflix.github.com/blob/master/index.html",
        },
      });

      expect(result._id).toBeDefined();
      expect(result.shorterLink).toBeDefined();
      expect(result.githubInfo).toBeDefined();
      expect(result.githubInfo.fileURL).toBe("https://github.com/Netflix/netflix.github.com/blob/master/index.html");

      createdIdWithGithub = result._id;
      createdResources.htmlHostings.push(createdIdWithGithub);
    });

    it("should create GitHub HTML page with all options", async () => {
      const result = await client.createWithGithubFile({
        name: "Full Options GitHub Page",
        githubInfo: {
          fileURL: "https://github.com/Netflix/netflix.github.com/blob/master/index.html",
        },
        customLandingId: "github-" + Date.now(),
        isEnableMonetization: true,
        autoSaveInGoogleSheet: false,
        tag: "github-tag",
        refId: "GITHUB-REF-" + Date.now(),
      });

      expect(result._id).toBeDefined();
      expect(result.githubInfo).toBeDefined();
      createdResources.htmlHostings.push(result._id);
    });
  });

  describe("GET BY ID", () => {
    it("should get HTML hosting page by ID", async () => {
      const result = await client.get(createdIdWithFile);

      expect(result._id).toBe(createdIdWithFile);
      expect(result.shorterLink).toBeDefined();
      expect(result.name).toBeDefined();
    });

    it("should get GitHub-based HTML page by ID", async () => {
      const result = await client.get(createdIdWithGithub);

      expect(result._id).toBe(createdIdWithGithub);
      expect(result.githubInfo).toBeDefined();
    });

    it("should fail with invalid ID", async () => {
      await expect(client.get("invalid-id-123")).rejects.toThrow();
    });
  });

  describe("LIST & SEARCH", () => {
    it("should get list of hosted pages with pagination", async () => {
      const result = await client.list(
        {},
        {
          page: 1,
          pageSize: 10,
        }
      );

      expect(result.items).toBeInstanceOf(Array);

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.pageSize).toBe(10);
    });

    it("should search by name", async () => {
      const result = await client.list(
        {
          name: "Test",
        },
        {
          page: 1,
          pageSize: 10,
        }
      );

      expect(result.items).toBeInstanceOf(Array);
    });

    it("should filter by source type", async () => {
      const result = await client.list(
        {
          sourceType: "file",
        },
        {
          page: 1,
          pageSize: 10,
        }
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
        }
      );

      expect(result.items).toBeInstanceOf(Array);
    });

    it("should filter by refId", async () => {
      const result = await client.list(
        {
          refId: "REF-123",
        },
        {
          page: 1,
          pageSize: 10,
        }
      );

      expect(result.items).toBeInstanceOf(Array);
    });

    it("should filter by monetization status", async () => {
      const result = await client.list(
        {
          isEnableMonetization: true,
        },
        {
          page: 1,
          pageSize: 10,
        }
      );

      expect(result.items).toBeInstanceOf(Array);
    });

    it("should filter by Google Sheet auto-save", async () => {
      const result = await client.list(
        {
          autoSaveInGoogleSheet: true,
        },
        {
          page: 1,
          pageSize: 10,
        }
      );

      expect(result.items).toBeInstanceOf(Array);
    });

    it("should filter temporary pages", async () => {
      const result = await client.list(
        {
          isTemp: false,
        },
        {
          page: 1,
          pageSize: 10,
        }
      );

      expect(result.items).toBeInstanceOf(Array);
    });
  });

  describe("LOOKUP", () => {
    it("should get lookup list of HTML pages", async () => {
      const result = await client.lookup();

      expect(result).toBeInstanceOf(Array);
      if (result.length > 0) {
        expect(result[0]._id).toBeDefined();
        expect(result[0].name).toBeDefined();
      }
    });
  });

  describe("LOOKUP FORMS", () => {
    it("should get form IDs for an HTML page", async () => {
      const result = await client.lookupForms(createdIdWithFile);

      expect(result).toBeInstanceOf(Array);
      // Forms may or may not exist depending on the HTML content
    });

    it("should fail with invalid page ID", async () => {
      await expect(client.lookupForms("invalid-id-123")).rejects.toThrow();
    });
  });

  describe("UPDATE - With New File", () => {
    it("should update HTML hosting page with new file", async () => {
      const file = getFile();

      const result = await client.updateWithNewFile(
        createdIdWithFile,
        {
          name: "Updated HTML Page - " + Date.now(),
          fileName: "updated.html",
        },
        file
      );

      expect(result._id).toBe(createdIdWithFile);
      expect(result.shorterLink).toBeDefined();
    });

    it("should update with new file and toggle monetization", async () => {
      const file = getFile();

      const result = await client.updateWithNewFile(
        createdIdWithFile,
        {
          name: "Monetization Updated",
          fileName: "monetization.html",
          isEnableMonetization: false,
        },
        file
      );

      expect(result._id).toBe(createdIdWithFile);
    });
  });

  describe("UPDATE - With GitHub File", () => {
    it("should update HTML page with new GitHub file", async () => {
      const result = await client.updateWithGithubFile(createdIdWithGithub, {
        name: "Updated GitHub Page - " + Date.now(),
        githubInfo: {
          fileURL: "https://github.com/Netflix/netflix.github.com/blob/master/index.html",
        },
      });

      expect(result._id).toBe(createdIdWithGithub);
      expect(result.githubInfo).toBeDefined();
    });

    it("should update GitHub page with all options", async () => {
      const result = await client.updateWithGithubFile(createdIdWithGithub, {
        name: "Fully Updated GitHub Page",
        githubInfo: {
          fileURL: "https://github.com/Netflix/netflix.github.com/blob/master/index.html",
        },
        customLandingId: "updated-github-" + Date.now(),
        isEnableMonetization: false,
        autoSaveInGoogleSheet: true,
      });

      expect(result._id).toBe(createdIdWithGithub);
    });
  });

  describe("CLEAN CACHE", () => {
    it("should clean cache for an HTML page", async () => {
      await expect(client.cleanCache(createdIdWithFile)).resolves.not.toThrow();
    });

    it("should fail to clean cache with invalid ID", async () => {
      await expect(client.cleanCache("invalid-id-123")).rejects.toThrow();
    });
  });

  describe("DELETE", () => {
    it("should delete HTML hosting page created with file", async () => {
      await client.delete(createdIdWithFile);

      // Verify deletion
      await expect(client.get(createdIdWithFile)).rejects.toThrow();
    });

    it("should delete HTML hosting page created with GitHub", async () => {
      await client.delete(createdIdWithGithub);

      // Verify deletion
      await expect(client.get(createdIdWithGithub)).rejects.toThrow();
    });

    it("should fail to delete with invalid ID", async () => {
      await expect(client.delete("invalid-id-123")).rejects.toThrow();
    });
  });
});
