#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";

// 创建服务器实例
const server = new Server(
  {
    name: "mcp-local-fetch",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 定义 fetch 工具
const FETCH_TOOL: Tool = {
  name: "fetch",
  description: "Fetch content from a URL without following robots.txt restrictions. Returns the response body as text.",
  inputSchema: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description: "The URL to fetch",
      },
      method: {
        type: "string",
        description: "HTTP method (GET, POST, PUT, DELETE, etc.)",
        enum: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
        default: "GET",
      },
      headers: {
        type: "object",
        description: "Optional HTTP headers to include in the request",
        additionalProperties: {
          type: "string",
        },
      },
      body: {
        type: "string",
        description: "Optional request body (for POST, PUT, PATCH requests)",
      },
      follow_redirects: {
        type: "boolean",
        description: "Whether to follow redirects (default: true)",
        default: true,
      },
      max_redirects: {
        type: "number",
        description: "Maximum number of redirects to follow (default: 20)",
        default: 20,
      },
      timeout: {
        type: "number",
        description: "Request timeout in milliseconds (default: 30000)",
        default: 30000,
      },
    },
    required: ["url"],
  },
};

// 实现 fetch 功能
async function performFetch(args: {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  follow_redirects?: boolean;
  max_redirects?: number;
  timeout?: number;
}): Promise<{
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  url: string;
}> {
  const {
    url,
    method = "GET",
    headers = {},
    body,
    follow_redirects = true,
    max_redirects = 20,
    timeout = 30000,
  } = args;

  // 设置默认的 User-Agent，模拟浏览器行为
  const defaultHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    ...headers,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method,
      headers: defaultHeaders,
      body: body,
      redirect: follow_redirects ? "follow" : "manual",
      signal: controller.signal,
      // @ts-ignore - node-fetch specific option
      follow: max_redirects,
    });

    clearTimeout(timeoutId);

    // 获取响应头
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // 获取响应体
    const responseBody = await response.text();

    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      url: response.url,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Fetch failed: ${error.message}`);
    }
    throw new Error("Fetch failed: Unknown error");
  }
}

// 处理工具列表请求
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [FETCH_TOOL],
  };
});

// 处理工具调用请求
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "fetch") {
    try {
      const args = request.params.arguments as {
        url: string;
        method?: string;
        headers?: Record<string, string>;
        body?: string;
        follow_redirects?: boolean;
        max_redirects?: number;
        timeout?: number;
      };

      // 验证 URL
      if (!args.url) {
        throw new Error("URL is required");
      }

      // 验证 URL 格式
      try {
        new URL(args.url);
      } catch {
        throw new Error("Invalid URL format");
      }

      const result = await performFetch(args);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
      return {
        content: [
          {
            type: "text",
            text: "Error: Unknown error occurred",
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Local Fetch Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
