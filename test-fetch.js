// 直接测试 fetch 功能
import fetch from 'node-fetch';

console.log('='.repeat(60));
console.log('测试 1: 简单的 GET 请求');
console.log('='.repeat(60));

try {
  const response1 = await fetch('https://httpbin.org/get', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  const data1 = await response1.text();
  console.log('✅ 状态码:', response1.status);
  console.log('✅ 响应头:', Object.fromEntries(response1.headers.entries()));
  console.log('✅ 响应体预览:', data1.substring(0, 200) + '...');
  console.log('');
} catch (error) {
  console.log('❌ 测试 1 失败:', error.message);
}

console.log('='.repeat(60));
console.log('测试 2: POST 请求带自定义头');
console.log('='.repeat(60));

try {
  const response2 = await fetch('https://httpbin.org/post', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    body: JSON.stringify({ test: 'data', message: 'Hello from MCP!' })
  });

  const data2 = await response2.text();
  console.log('✅ 状态码:', response2.status);
  console.log('✅ 响应体预览:', data2.substring(0, 200) + '...');
  console.log('');
} catch (error) {
  console.log('❌ 测试 2 失败:', error.message);
}

console.log('='.repeat(60));
console.log('测试 3: 测试重定向');
console.log('='.repeat(60));

try {
  const response3 = await fetch('https://httpbin.org/redirect/2', {
    redirect: 'follow',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  console.log('✅ 状态码:', response3.status);
  console.log('✅ 最终 URL:', response3.url);
  console.log('');
} catch (error) {
  console.log('❌ 测试 3 失败:', error.message);
}

console.log('='.repeat(60));
console.log('测试 4: 抓取真实网页（不遵循 robots.txt）');
console.log('='.repeat(60));

try {
  const response4 = await fetch('https://example.com', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  const data4 = await response4.text();
  console.log('✅ 状态码:', response4.status);
  console.log('✅ 内容长度:', data4.length, '字符');
  console.log('✅ 网页标题:', data4.match(/<title>(.*?)<\/title>/)?.[1] || '未找到');
  console.log('');
} catch (error) {
  console.log('❌ 测试 4 失败:', error.message);
}

console.log('='.repeat(60));
console.log('测试 5: 超时测试（设置短超时）');
console.log('='.repeat(60));

try {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1000);

  const response5 = await fetch('https://httpbin.org/delay/3', {
    signal: controller.signal,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  clearTimeout(timeout);
  console.log('✅ 状态码:', response5.status);
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('✅ 超时功能正常工作');
  } else {
    console.log('❌ 测试 5 失败:', error.message);
  }
}

console.log('\n' + '='.repeat(60));
console.log('所有核心功能测试完成！');
console.log('='.repeat(60));
