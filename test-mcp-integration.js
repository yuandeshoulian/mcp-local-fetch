// 完整的 MCP 协议集成测试
import { spawn } from 'child_process';
import { createInterface } from 'readline';

console.log('='.repeat(60));
console.log('MCP 集成测试 - 完整流程');
console.log('='.repeat(60));
console.log('');

// 启动 MCP 服务器
const server = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

const readline = createInterface({
  input: server.stdout,
  crlfDelay: Infinity
});

let testsPassed = 0;
let testsFailed = 0;

// 监听服务器输出
readline.on('line', (line) => {
  try {
    const response = JSON.parse(line);

    if (response.id === 1) {
      // Initialize 响应
      console.log('✅ 测试 1: 服务器初始化成功');
      console.log(`   协议版本: ${response.result.protocolVersion}`);
      console.log(`   服务器: ${response.result.serverInfo.name} v${response.result.serverInfo.version}`);
      console.log('');
      testsPassed++;
    } else if (response.id === 2) {
      // List tools 响应
      console.log('✅ 测试 2: 获取工具列表成功');
      console.log(`   工具数量: ${response.result.tools.length}`);
      const fetchTool = response.result.tools[0];
      console.log(`   工具名称: ${fetchTool.name}`);
      console.log(`   工具描述: ${fetchTool.description}`);
      console.log('');
      testsPassed++;
    } else if (response.id === 3) {
      // Fetch 调用响应
      if (response.error) {
        console.log('❌ 测试 3: Fetch 调用失败');
        console.log(`   错误: ${response.error.message}`);
        testsFailed++;
      } else {
        const result = JSON.parse(response.result.content[0].text);
        console.log('✅ 测试 3: Fetch GET 请求成功');
        console.log(`   状态码: ${result.status}`);
        console.log(`   状态文本: ${result.statusText}`);
        console.log(`   URL: ${result.url}`);
        console.log(`   响应体长度: ${result.body.length} 字符`);
        console.log('');
        testsPassed++;
      }
    } else if (response.id === 4) {
      // POST 请求测试
      if (response.error) {
        console.log('❌ 测试 4: POST 请求失败');
        console.log(`   错误: ${response.error.message}`);
        testsFailed++;
      } else {
        const result = JSON.parse(response.result.content[0].text);
        console.log('✅ 测试 4: Fetch POST 请求成功');
        console.log(`   状态码: ${result.status}`);
        const bodyData = JSON.parse(result.body);
        console.log(`   接收到的数据: ${bodyData.data}`);
        console.log('');
        testsPassed++;
      }
    } else if (response.id === 5) {
      // 真实网页抓取测试
      if (response.error) {
        console.log('❌ 测试 5: 真实网页抓取失败');
        console.log(`   错误: ${response.error.message}`);
        testsFailed++;
      } else {
        const result = JSON.parse(response.result.content[0].text);
        console.log('✅ 测试 5: 抓取真实网页成功（无 robots.txt 限制）');
        console.log(`   状态码: ${result.status}`);
        console.log(`   内容包含标题: ${result.body.includes('<title>') ? '是' : '否'}`);
        console.log('');
        testsPassed++;
      }

      // 所有测试完成
      console.log('='.repeat(60));
      console.log(`测试总结: ${testsPassed} 通过, ${testsFailed} 失败`);
      console.log('='.repeat(60));
      server.kill();
      process.exit(testsFailed > 0 ? 1 : 0);
    }
  } catch (e) {
    // 忽略非 JSON 输出
  }
});

server.stderr.on('data', (data) => {
  console.log('[服务器启动]', data.toString().trim());
  console.log('');
});

// 等待服务器启动
setTimeout(() => {
  // 测试 1: Initialize
  server.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' }
    }
  }) + '\n');

  setTimeout(() => {
    // 测试 2: List tools
    server.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    }) + '\n');

    setTimeout(() => {
      // 测试 3: GET 请求
      server.stdin.write(JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'fetch',
          arguments: {
            url: 'https://httpbin.org/get',
            method: 'GET'
          }
        }
      }) + '\n');

      setTimeout(() => {
        // 测试 4: POST 请求
        server.stdin.write(JSON.stringify({
          jsonrpc: '2.0',
          id: 4,
          method: 'tools/call',
          params: {
            name: 'fetch',
            arguments: {
              url: 'https://httpbin.org/post',
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ test: 'MCP Integration Test' })
            }
          }
        }) + '\n');

        setTimeout(() => {
          // 测试 5: 真实网页抓取
          server.stdin.write(JSON.stringify({
            jsonrpc: '2.0',
            id: 5,
            method: 'tools/call',
            params: {
              name: 'fetch',
              arguments: {
                url: 'https://example.com',
                method: 'GET'
              }
            }
          }) + '\n');
        }, 1500);
      }, 1500);
    }, 500);
  }, 500);
}, 500);

server.on('error', (error) => {
  console.error('❌ 服务器错误:', error);
  process.exit(1);
});
