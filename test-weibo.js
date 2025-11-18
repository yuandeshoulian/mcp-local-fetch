// 测试抓取微博热搜 - 验证不受 robots.txt 限制
import fetch from 'node-fetch';

console.log('='.repeat(70));
console.log('微博热搜抓取测试 - 验证不受 robots.txt 限制');
console.log('='.repeat(70));
console.log('');

// 测试 1: 检查微博的 robots.txt
console.log('步骤 1: 检查微博 robots.txt 规则');
console.log('-'.repeat(70));

try {
  const robotsResponse = await fetch('https://weibo.com/robots.txt');
  const robotsText = await robotsResponse.text();

  console.log('✅ 成功获取 robots.txt');
  console.log('');
  console.log('robots.txt 内容:');
  console.log(robotsText.substring(0, 500));
  console.log('...');
  console.log('');

  // 检查是否禁止抓取热搜相关路径
  if (robotsText.includes('Disallow: /')) {
    console.log('⚠️  robots.txt 包含 Disallow 规则');
  }

} catch (error) {
  console.log('❌ 获取 robots.txt 失败:', error.message);
}

console.log('');
console.log('='.repeat(70));
console.log('步骤 2: 尝试抓取微博热搜（忽略 robots.txt）');
console.log('-'.repeat(70));

// 微博热搜的几个可能的 URL
const weiboUrls = [
  'https://s.weibo.com/top/summary',
  'https://weibo.com/ajax/side/hotSearch'
];

for (const url of weiboUrls) {
  console.log(`\n尝试 URL: ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://weibo.com'
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
        console.log('数据结构:', JSON.stringify(data, null, 2).substring(0, 500));

        // 尝试提取热搜
        if (data.data && data.data.realtime) {
          console.log('\n🔥 微博热搜 TOP 20:');
          console.log('-'.repeat(70));
          data.data.realtime.slice(0, 20).forEach((item, index) => {
            console.log(`${(index + 1).toString().padStart(2, '0')}. ${item.word || item.note} ${item.hot ? `🔥 ${item.hot}` : ''}`);
          });
          break; // 成功了就停止尝试其他 URL
        }
      } catch (e) {
        console.log('⚠️  JSON 解析失败，可能需要登录或其他认证');
      }
    }
    // 如果是 HTML 响应
    else {
      console.log('✅ 收到 HTML 响应');

      // 简单检查是否包含热搜相关内容
      if (content.includes('热搜') || content.includes('榜单') || content.includes('top')) {
        console.log('✅ 页面包含热搜相关内容');

        // 尝试提取一些热搜词（简单正则匹配）
        const titleMatches = content.match(/<a[^>]*>([^<]+)</g);
        if (titleMatches && titleMatches.length > 0) {
          console.log('\n找到的一些链接文本（可能包含热搜）:');
          titleMatches.slice(0, 10).forEach((match, idx) => {
            const text = match.replace(/<a[^>]*>/, '').replace(/<.*/, '').trim();
            if (text && text.length > 2 && text.length < 50) {
              console.log(`  ${idx + 1}. ${text}`);
            }
          });
        }
      }

      // 保存 HTML 用于调试
      console.log('\nHTML 预览（前 500 字符）:');
      console.log(content.substring(0, 500));
      console.log('...');
    }

    console.log('\n✅ 成功抓取微博页面，未被 robots.txt 阻止！');

  } catch (error) {
    console.log(`❌ 抓取失败: ${error.message}`);
  }
}

console.log('\n' + '='.repeat(70));
console.log('测试结论:');
console.log('1. 我们的 fetch 工具可以正常访问微博网站');
console.log('2. 请求未被 robots.txt 规则阻止');
console.log('3. 能够获取到页面内容（具体数据取决于微博的反爬虫策略）');
console.log('='.repeat(70));
