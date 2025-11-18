# MCP Local Fetch

一个功能强大的 MCP (Model Context Protocol) 服务器，提供不受 robots.txt 限制的网页抓取功能。

## 功能特性

- 支持所有标准 HTTP 方法（GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS）
- 自定义请求头
- 请求体支持
- 重定向控制
- 超时设置
- 不遵循 robots.txt 限制
- 返回完整的响应信息（状态码、响应头、响应体）

## 快速开始

### 方式一：使用 npx（推荐）

无需安装，直接在 Claude Desktop 配置文件中使用：

**Windows** - 编辑 `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "local-fetch": {
      "command": "npx",
      "args": ["-y", "mcp-local-fetch"]
    }
  }
}
```

**macOS** - 编辑 `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "local-fetch": {
      "command": "npx",
      "args": ["-y", "mcp-local-fetch"]
    }
  }
}
```

**Linux** - 编辑 `~/.config/claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "local-fetch": {
      "command": "npx",
      "args": ["-y", "mcp-local-fetch"]
    }
  }
}
```

### 方式二：本地开发

如果你想修改源码或本地开发：

```bash
git clone https://github.com/yuandeshoulian/mcp-local-fetch.git
cd mcp-local-fetch
npm install
npm run build
```

然后在配置文件中指向本地路径：

```json
{
  "mcpServers": {
    "local-fetch": {
      "command": "node",
      "args": ["path/to/mcp-local-fetch/dist/index.js"]
    }
  }
}
```

## 使用方法

服务器提供一个 `fetch` 工具，支持以下参数：

### 参数

- `url` (必需): 要抓取的 URL
- `method` (可选): HTTP 方法，默认 "GET"
  - 可选值: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
- `headers` (可选): 自定义请求头对象
- `body` (可选): 请求体（字符串格式）
- `follow_redirects` (可选): 是否跟随重定向，默认 true
- `max_redirects` (可选): 最大重定向次数，默认 20
- `timeout` (可选): 请求超时时间（毫秒），默认 30000

### 示例

#### 简单 GET 请求

```json
{
  "url": "https://example.com"
}
```

#### POST 请求带自定义头和请求体

```json
{
  "url": "https://api.example.com/data",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer token123"
  },
  "body": "{\"key\": \"value\"}"
}
```

#### 禁用重定向

```json
{
  "url": "https://example.com",
  "follow_redirects": false
}
```

#### 设置超时

```json
{
  "url": "https://example.com",
  "timeout": 5000
}
```

### 响应格式

工具返回 JSON 格式的响应：

```json
{
  "status": 200,
  "statusText": "OK",
  "headers": {
    "content-type": "text/html",
    "content-length": "1234"
  },
  "body": "响应内容...",
  "url": "https://example.com"
}
```

## 开发

### 构建

```bash
npm run build
```

### 开发模式（自动重新编译）

```bash
npm run dev
```

## 安全说明

此工具不遵循 robots.txt 限制，请负责任地使用：

- 遵守目标网站的服务条款
- 避免过于频繁的请求
- 尊重网站的隐私政策
- 仅用于合法目的

## 许可证

MIT

## 配合其他 MCP 使用

### 处理需要 JavaScript 渲染的网站

此 MCP 专注于简单快速的 HTTP 请求。对于需要 JavaScript 渲染的网站（如客户端渲染的 SPA），建议配合使用 **Playwright MCP**：

```json
{
  "mcpServers": {
    "local-fetch": {
      "command": "node",
      "args": ["E:\\workspace\\jasion\\jq-mcp\\mcp-local-fetch\\dist\\index.js"]
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-playwright"]
    }
  }
}
```

**使用场景：**
- **mcp-local-fetch**: 快速抓取静态 HTML、API 接口、简单网页
- **Playwright MCP**: 抓取需要 JavaScript 渲染的网站（如魔搭社区、现代 SPA 应用）

## 注意事项

- 默认使用浏览器 User-Agent 以提高兼容性
- 自动处理超时和错误
- 支持 HTTPS
- 响应体始终以文本形式返回
- 轻量级设计，启动快速，资源占用少
