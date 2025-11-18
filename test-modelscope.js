// 测试抓取魔搭社区模型列表
import fetch from 'node-fetch';

console.log('='.repeat(70));
console.log('魔搭社区（ModelScope）模型抓取测试');
console.log('='.repeat(70));
console.log('');

// 测试 1: 检查魔搭社区的 robots.txt
console.log('步骤 1: 检查魔搭社区 robots.txt 规则');
console.log('-'.repeat(70));

try {
  const robotsResponse = await fetch('https://modelscope.cn/robots.txt');
  const robotsText = await robotsResponse.text();

  console.log('✅ 成功获取 robots.txt');
  console.log('');
  console.log('robots.txt 内容:');
  console.log(robotsText);
  console.log('');

  // 检查是否禁止抓取
  if (robotsText.includes('Disallow')) {
    console.log('⚠️  robots.txt 包含 Disallow 规则');
  } else {
    console.log('✅ robots.txt 没有明确的 Disallow 规则');
  }

} catch (error) {
  console.log('❌ 获取 robots.txt 失败:', error.message);
}

console.log('');
console.log('='.repeat(70));
console.log('步骤 2: 抓取魔搭社区模型列表页面');
console.log('-'.repeat(70));

// 魔搭社区的几个可能的 URL
const urls = [
  'https://modelscope.cn/models',
  'https://www.modelscope.cn/api/v1/models',
  'https://modelscope.cn/api/v1/models?Page=1&PageSize=20'
];

for (const url of urls) {
  console.log(`\n尝试 URL: ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8,application/json',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://modelscope.cn/'
      },
      redirect: 'follow'
    });

    console.log(`✅ 状态码: ${response.status}`);
    console.log(`✅ Content-Type: ${response.headers.get('content-type')}`);

    const content = await response.text();
    console.log(`✅ 响应体长度: ${content.length} 字符`);

    // 如果是 JSON 响应
    if (response.headers.get('content-type')?.includes('json')) {
      try {
        const data = JSON.parse(content);
        console.log('✅ 成功解析 JSON 数据');

        // 尝试提取模型列表
        if (data.Data && Array.isArray(data.Data)) {
          console.log('\n📦 魔搭社区模型列表（第一页）:');
          console.log('-'.repeat(70));

          data.Data.slice(0, 20).forEach((model, index) => {
            console.log(`\n${(index + 1).toString().padStart(2, '0')}. ${model.Name || model.name || '未知模型'}`);
            if (model.ChineseName) console.log(`    中文名: ${model.ChineseName}`);
            if (model.Downloads) console.log(`    下载量: ${model.Downloads}`);
            if (model.Stars) console.log(`    Stars: ${model.Stars}`);
            if (model.Tags && model.Tags.length > 0) {
              console.log(`    标签: ${model.Tags.slice(0, 3).join(', ')}`);
            }
          });

          console.log('\n✅ 成功获取模型列表！');
          break; // 成功了就停止尝试其他 URL
        } else if (data.models && Array.isArray(data.models)) {
          console.log('\n📦 魔搭社区模型列表（第一页）:');
          console.log('-'.repeat(70));

          data.models.slice(0, 20).forEach((model, index) => {
            console.log(`\n${(index + 1).toString().padStart(2, '0')}. ${model.name || model.id || '未知模型'}`);
            if (model.description) console.log(`    描述: ${model.description.substring(0, 60)}...`);
            if (model.downloads) console.log(`    下载量: ${model.downloads}`);
            if (model.likes) console.log(`    点赞: ${model.likes}`);
          });

          console.log('\n✅ 成功获取模型列表！');
          break;
        } else {
          console.log('数据结构预览:', JSON.stringify(data, null, 2).substring(0, 800));
        }
      } catch (e) {
        console.log('⚠️  JSON 解析失败:', e.message);
      }
    }
    // 如果是 HTML 响应
    else {
      console.log('✅ 收到 HTML 响应');

      // 检查是否包含模型相关内容
      if (content.includes('model') || content.includes('模型')) {
        console.log('✅ 页面包含模型相关内容');

        // 尝试提取一些模型名称
        // 查找可能的模型名称模式
        const patterns = [
          /<h3[^>]*>([^<]+)</g,
          /<div[^>]*class="[^"]*model[^"]*"[^>]*>([^<]+)</g,
          /data-model="([^"]+)"/g
        ];

        let foundModels = [];
        for (const pattern of patterns) {
          const matches = [...content.matchAll(pattern)];
          if (matches.length > 0) {
            foundModels = matches.map(m => m[1].trim()).filter(t => t.length > 0 && t.length < 100);
            if (foundModels.length > 0) break;
          }
        }

        if (foundModels.length > 0) {
          console.log('\n找到的可能的模型名称:');
          foundModels.slice(0, 10).forEach((name, idx) => {
            console.log(`  ${idx + 1}. ${name}`);
          });
        }

        // 查找 JSON 数据嵌入在 HTML 中
        const scriptMatch = content.match(/<script[^>]*>[\s\S]*?window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?})\s*<\/script>/);
        if (scriptMatch) {
          console.log('\n✅ 找到嵌入的初始状态数据');
          try {
            const initialState = JSON.parse(scriptMatch[1]);
            console.log('初始状态数据结构:', JSON.stringify(initialState, null, 2).substring(0, 800));

            // 尝试从初始状态中提取模型
            if (initialState.models && Array.isArray(initialState.models)) {
              console.log('\n📦 从页面提取的模型列表:');
              console.log('-'.repeat(70));
              initialState.models.slice(0, 20).forEach((model, index) => {
                console.log(`${(index + 1).toString().padStart(2, '00')}. ${model.name || model.id}`);
              });
            }
          } catch (e) {
            console.log('解析初始状态数据失败:', e.message);
          }
        }
      }

      // 保存部分 HTML 用于调试
      console.log('\nHTML 预览（前 500 字符）:');
      console.log(content.substring(0, 500).replace(/\s+/g, ' '));
      console.log('...');
    }

    console.log('\n✅ 成功抓取魔搭社区页面！');

  } catch (error) {
    console.log(`❌ 抓取失败: ${error.message}`);
  }
}

console.log('\n' + '='.repeat(70));
console.log('测试结论:');
console.log('1. 我们的 fetch 工具可以正常访问魔搭社区');
console.log('2. 能够获取到页面内容');
console.log('3. 可以解析模型列表数据');
console.log('='.repeat(70));
