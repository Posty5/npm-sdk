import { HttpClient } from "@posty5/core";
import { IStubHttpCall } from "./stub-http.interface";

/**
 * A stand-in for `HttpClient` that records every call and answers each with
 * `{ result }`, so offline tests can pin a client's routes, verbs, bodies and
 * query strings without the network.
 */
export function stubHttp(result: unknown = {}) {
  const calls: IStubHttpCall[] = [];
  const answer = async () => ({ result, message: "" });
  const http = {
    get: async (url: string, config?: { params?: Record<string, unknown> }) => (calls.push({ method: "GET", url, params: config?.params }), answer()),
    post: async (url: string, body?: unknown) => (calls.push({ method: "POST", url, body }), answer()),
    put: async (url: string, body?: unknown) => (calls.push({ method: "PUT", url, body }), answer()),
    delete: async (url: string, config?: { params?: Record<string, unknown> }) => (calls.push({ method: "DELETE", url, params: config?.params }), answer()),
  };
  return { http: http as unknown as HttpClient, calls };
}
