#!/usr/bin/env node
/**
 * check-spotless.js - 检测并执行 Maven Spotless 格式化
 * 此脚本在 quick-commit skill 执行前触发（UserPromptSubmit hook）
 */

const { execSync } = require('child_process');
const fs = require('fs');

try {
  // 检测 spotless 插件是否可用
  if (fs.existsSync('pom.xml')) {
    const pomContent = fs.readFileSync('pom.xml', 'utf8');
    
    if (pomContent.includes('spotless-maven-plugin')) {
      // 检查 mvn 命令是否可用
      try {
        execSync('mvn --version', { stdio: 'pipe' });
      } catch (e) {
        // mvn 命令不可用，静默跳过
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
    }
  }
} catch (e) {
  // 任何错误都静默跳过，不阻止 skill 执行
}

process.exit(0);
