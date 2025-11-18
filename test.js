// 简单的测试脚本来验证 MCP 服务器功能
import { spawn } from 'child_process';

console.log('启动 MCP 服务器测试...\n');

// 启动 MCP 服务器
const server = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let responseData = '';

server.stdout.on('data', (data) => {
  responseData += data.toString();
  console.log('服务器输出:', data.toString());
});

server.stderr.on('data', (data) => {
  console.log('服务器日志:', data.toString());
});

// 等待服务器启动
setTimeout(() => {
  console.log('\n发送 initialize 请求...');

  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };

  server.stdin.write(JSON.stringify(initRequest) + '\n');

  setTimeout(() => {
    console.log('\n发送 tools/list 请求...');

    const listToolsRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    };

    server.stdin.write(JSON.stringify(listToolsRequest) + '\n');

    setTimeout(() => {
      console.log('\n发送 tools/call 请求测试 fetch...');

      const callToolRequest = {
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
      };

      server.stdin.write(JSON.stringify(callToolRequest) + '\n');

      // 等待响应后关闭
      setTimeout(() => {
        console.log('\n测试完成！');
        server.kill();
        process.exit(0);
      }, 3000);
    }, 1000);
  }, 1000);
}, 1000);

server.on('error', (error) => {
  console.error('服务器错误:', error);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`\n服务器进程退出，退出码: ${code}`);
});
