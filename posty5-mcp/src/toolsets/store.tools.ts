import { z } from "zod";
import { MAX_PAGE_SIZE } from "../config/limits.config";
import { defineTool } from "../core/define-tool.helper";
import type { IToolDefinition } from "../interfaces/tool.interface";

export const STORE_TOOLS: IToolDefinition[] = [
  defineTool({
    name: "store_list",
    toolset: "store",
    access: "read",
    title: "List my stores",
    description:
      'The online stores this connection can manage — owned or staffed — each as { _id, name } where name is "<slug> - <name>". The _id is the storeId every other store tool takes: call this first. Filter by part of the name or slug. One page, no cursor.',
    input: z.object({
      term: z.string().optional().describe("Part of the store's name or slug."),
      pageSize: z.number().int().min(1).max(MAX_PAGE_SIZE).optional().describe(`Most stores to return, at most ${MAX_PAGE_SIZE}. Default 10.`),
    }),
    run: ({ term, pageSize }, { clients }) => clients.store.listStores(term, pageSize),
  }),
];
