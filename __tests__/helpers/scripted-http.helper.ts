import { HttpClient, IBinaryResponse } from "@posty5/core";
import { IScriptedHttpCall } from "./scripted-http.interface";

/**
 * A stand-in for `HttpClient` whose answers come from `respond`, which may
 * return a `result` or throw (an error from `@posty5/core`) per call. Records
 * method, url, body, params and headers of every call.
 */
export function scriptedHttp(respond: (call: IScriptedHttpCall, index: number) => unknown, createdFrom = "npmPackage") {
  const calls: IScriptedHttpCall[] = [];
  const run = async (call: IScriptedHttpCall) => {
    calls.push(call);
    return { result: await respond(call, calls.length - 1), message: "" };
  };
  const http = {
    createdFrom,
    get: (url: string, config?: { params?: Record<string, unknown> }) => run({ method: "GET", url, params: config?.params }),
    post: (url: string, body?: unknown, config?: { headers?: Record<string, string> }) =>
      run({ method: "POST", url, body, headers: config?.headers }),
    put: (url: string, body?: unknown) => run({ method: "PUT", url, body }),
    delete: (url: string) => run({ method: "DELETE", url }),
    getBinary: async (url: string, config?: { params?: Record<string, unknown> }): Promise<IBinaryResponse> => {
      const call: IScriptedHttpCall = { method: "GET", url, params: config?.params };
      calls.push(call);
      return (await respond(call, calls.length - 1)) as IBinaryResponse;
    },
  };
  return { http: http as unknown as HttpClient, calls };
}
