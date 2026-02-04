#!/usr/bin/env node
/**
 * check-spotless.js - 检测并执行 Maven Spotless 格式化
 * 此脚本在 git commit 前触发（PreToolUse hook）
 */

const { execSync } = require('child_process');
const fs = require('fs');

// 添加调试日志
console.error('[Spotless Hook] Script started');
console.error('[Spotless Hook] CWD:', process.cwd());
console.error('[Spotless Hook] CLAUDE_PLUGIN_ROOT:', process.env.CLAUDE_PLUGIN_ROOT);

try {
  // 检测 spotless 插件是否可用
  if (fs.existsSync('pom.xml')) {
    console.error('[Spotless Hook] Found pom.xml');
    const pomContent = fs.readFileSync('pom.xml', 'utf8');
    
    if (pomContent.includes('spotless-maven-plugin')) {
      console.error('[Spotless Hook] Found spotless-maven-plugin in pom.xml');
      
      // 检查 mvn 命令是否可用
      try {
        execSync('mvn --version', { stdio: 'pipe' });
        console.error('[Spotless Hook] mvn command is available');
      } catch (e) {
        console.error('[Spotless Hook] mvn command not available, skipping');
        process.exit(0);
      }
      
      console.error('🔧 检测到 Maven Spotless，正在格式化代码...');
      
      try {
        // 执行格式化
        execSync('mvn spotless:apply', { stdio: 'inherit' });
        console.error('✅ Spotless 格式化完成');
      } catch (e) {
        console.error('⚠️ Spotless 格式化失败，继续执行');
      }
    } else {
      console.error('[Spotless Hook] spotless-maven-plugin not found in pom.xml');
    }
  } else {
    console.error('[Spotless Hook] pom.xml not found');
  }
} catch (e) {
  console.error('[Spotless Hook] Error:', e.message);
}

console.error('[Spotless Hook] Script finished');
process.exit(0);
