// 详细分析魔搭社区页面并找到 API
import fetch from 'node-fetch';

console.log('='.repeat(70));
console.log('魔搭社区详细分析 - 查找 API 端点');
console.log('='.repeat(70));
console.log('');

// 首先获取主页面，分析其中的 JavaScript
console.log('步骤 1: 获取主页面并分析');
console.log('-'.repeat(70));

try {
  const response = await fetch('https://modelscope.cn/models', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9',
    }
  });

  const html = await response.text();
  console.log(`✅ 页面长度: ${html.length} 字符`);

  // 查找可能的 API 端点
  const apiPatterns = [
    /api[\/\w\-]*/gi,
    /https?:\/\/[^"'\s]*api[^"'\s]*/gi,
    /"url"\s*:\s*"([^"]+)"/gi,
    /fetch\(['"]([^'"]+)['"]/gi
  ];

  console.log('\n查找可能的 API 端点:');
  const foundApis = new Set();

  for (const pattern of apiPatterns) {
    const matches = [...html.matchAll(pattern)];
    matches.forEach(match => {
      const api = match[0] || match[1];
      if (api && api.length > 3 && api.length < 200) {
        foundApis.add(api);
      }
    });
  }

  if (foundApis.size > 0) {
    console.log('找到的 API 端点:');
    [...foundApis].slice(0, 15).forEach(api => console.log(`  - ${api}`));
  }

} catch (error) {
  console.log('❌ 获取页面失败:', error.message);
}

console.log('\n' + '='.repeat(70));
console.log('步骤 2: 尝试常见的 API 端点格式');
console.log('-'.repeat(70));

const possibleEndpoints = [
  'https://modelscope.cn/api/v1/models?PageNumber=1&PageSize=20',
  'https://modelscope.cn/api/v1/models/list?page=1&pageSize=20',
  'https://api.modelscope.cn/api/v1/models',
  'https://modelscope.cn/api/models',
  'https://modelscope.cn/api/v1/models/search',
  'https://www.modelscope.cn/api/v1/studios',
];

for (const endpoint of possibleEndpoints) {
  console.log(`\n尝试: ${endpoint}`);

  try {
    const response = await fetch(endpoint, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Referer': 'https://modelscope.cn/models',
        'Origin': 'https://modelscope.cn'
      }
    });

    console.log(`  状态码: ${response.status}`);

    if (response.status === 200) {
      const contentType = response.headers.get('content-type');
      console.log(`  Content-Type: ${contentType}`);

      const text = await response.text();
      console.log(`  响应长度: ${text.length} 字符`);

      if (contentType?.includes('json')) {
        try {
          const data = JSON.parse(text);
          console.log('  ✅ JSON 解析成功！');
          console.log('  数据结构:', JSON.stringify(data, null, 2).substring(0, 600));

          // 检查是否有模型数据
          if (data.Data || data.data || data.models || data.Data?.Models) {
            console.log('\n  🎉 找到模型数据！');
            break;
          }
        } catch (e) {
          console.log('  JSON 解析失败');
        }
      }
    }
  } catch (error) {
    console.log(`  ❌ 请求失败: ${error.message}`);
  }
}

console.log('\n' + '='.repeat(70));
console.log('步骤 3: 尝试直接搜索 API');
console.log('-'.repeat(70));

const searchEndpoints = [
  {
    url: 'https://modelscope.cn/api/v1/models',
    method: 'POST',
    body: JSON.stringify({
      PageNumber: 1,
      PageSize: 20,
      SortBy: 'GmtCreate'
    })
  },
  {
    url: 'https://modelscope.cn/api/v1/models/search',
    method: 'POST',
    body: JSON.stringify({
      page: 1,
      pageSize: 20
    })
  }
];

for (const config of searchEndpoints) {
  console.log(`\n尝试 POST: ${config.url}`);

  try {
    const response = await fetch(config.url, {
      method: config.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Referer': 'https://modelscope.cn/models',
        'Origin': 'https://modelscope.cn'
      },
      body: config.body
    });

    console.log(`  状态码: ${response.status}`);

    if (response.status === 200) {
      const text = await response.text();
      console.log(`  响应长度: ${text.length} 字符`);

      try {
        const data = JSON.parse(text);
        console.log('  ✅ JSON 解析成功！');

        // 显示完整的数据结构
        console.log('\n  📦 完整响应数据:');
        console.log(JSON.stringify(data, null, 2).substring(0, 1500));

        // 尝试找到模型列表
        const findModels = (obj, path = '') => {
          if (Array.isArray(obj) && obj.length > 0 && obj[0].Name) {
            return { path, data: obj };
          }
          if (typeof obj === 'object' && obj !== null) {
            for (const key of Object.keys(obj)) {
              const result = findModels(obj[key], path ? `${path}.${key}` : key);
              if (result) return result;
            }
          }
          return null;
        };

        const modelsLocation = findModels(data);
        if (modelsLocation) {
          console.log(`\n  🎉 找到模型列表！位置: ${modelsLocation.path}`);
          console.log('\n  📋 模型列表（前20个）:');
          console.log('-'.repeat(70));

          modelsLocation.data.slice(0, 20).forEach((model, index) => {
            console.log(`\n  ${(index + 1).toString().padStart(2, '0')}. ${model.Name || model.name || '未知'}`);
            if (model.ChineseName) console.log(`      中文名: ${model.ChineseName}`);
            if (model.Path) console.log(`      路径: ${model.Path}`);
            if (model.Downloads !== undefined) console.log(`      下载: ${model.Downloads}`);
            if (model.Stars !== undefined) console.log(`      Stars: ${model.Stars}`);
            if (model.Tags && model.Tags.length > 0) {
              console.log(`      标签: ${model.Tags.slice(0, 5).join(', ')}`);
            }
          });

          console.log('\n  ✅ 成功抓取魔搭社区模型列表！');
          break;
        }
      } catch (e) {
        console.log('  JSON 解析失败:', e.message);
        console.log('  原始响应:', text.substring(0, 200));
      }
    }
  } catch (error) {
    console.log(`  ❌ 请求失败: ${error.message}`);
  }
}

console.log('\n' + '='.repeat(70));
console.log('测试完成');
console.log('='.repeat(70));
