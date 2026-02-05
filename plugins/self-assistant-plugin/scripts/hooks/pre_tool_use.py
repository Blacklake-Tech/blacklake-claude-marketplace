#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# ///

import json
import sys
import re
from pathlib import Path

# 危险命令模式
DANGEROUS_PATTERNS = [
    r'\brm\s+.*-[a-z]*r[a-z]*f',  # rm -rf
    r'\brm\s+.*-[a-z]*f[a-z]*r',  # rm -fr
    r':\(\)\s*\{.*:\s*\|\s*:.*&',  # fork bomb
    r'\bdd\b.+of=\/dev\/',         # dd 写磁盘
]

# 危险路径
DANGEROUS_PATHS = [
    r'^/$', r'^/\*$',              # 根目录
    r'^~/?$', r'^\$HOME/?$',       # Home 目录
    r'^\.\.$', r'^\*$',            # 通配符
]

# 敏感文件模式
SENSITIVE_FILES = [
    r'\.env$',                     # .env 文件
    r'\.env\.[^.]+$',              # .env.xxx（非 .sample）
    r'credentials\.json$',         # credentials
    r'\.ssh/id_',                  # SSH keys
    r'\.aws/credentials$',         # AWS credentials
    r'\.pem$', r'\.key$',          # 密钥文件
    r'\.sss$',                     # 测试敏感文件
]

# 允许列表（模板文件）
ALLOWLIST = [
    r'\.env\.sample$',
    r'\.env\.example$',
    r'\.env\.template$',
]

def is_dangerous_command(command):
    """检测危险命令"""
    normalized = ' '.join(command.lower().split())
    
    # 检查危险模式
    for pattern in DANGEROUS_PATTERNS:
        if re.search(pattern, normalized):
            return True, f"危险命令模式: {pattern}"
    
    # 检查 rm 命令 + 危险路径
    if re.search(r'\brm\s+.*-[a-z]*r', normalized):
        for path in DANGEROUS_PATHS:
            if re.search(path, normalized):
                return True, f"rm 命令针对危险路径: {path}"
    
    return False, None

def is_sensitive_file(file_path):
    """检测敏感文件访问"""
    if not file_path:
        return False, None
    
    # 检查允许列表
    for allow in ALLOWLIST:
        if re.search(allow, file_path):
            return False, None
    
    # 检查敏感文件
    for pattern in SENSITIVE_FILES:
        if re.search(pattern, file_path):
            return True, f"敏感文件: {pattern}"
    
    return False, None

def main():
    try:
        input_data = json.load(sys.stdin)
        tool_name = input_data.get('tool_name', '')
        tool_input = input_data.get('tool_input', {})
        
        # 检查 Bash 命令
        if tool_name == 'Bash':
            command = tool_input.get('command', '')
            
            # 检查危险命令
            is_dangerous, reason = is_dangerous_command(command)
            if is_dangerous:
                print(f"🚨 BLOCKED: {reason}", file=sys.stderr)
                print(f"命令: {command[:100]}", file=sys.stderr)
                sys.exit(2)  # 阻止执行
            
            # 检查 Bash 命令中的敏感文件访问（cat, less, head, tail, vim, nano 等）
            # 提取命令中的文件路径
            for word in command.split():
                # 跳过命令本身和选项
                if word.startswith('-') or word in ['cat', 'less', 'head', 'tail', 'more', 'vim', 'nano', 'vi', 'emacs']:
                    continue
                # 检查是否是文件路径（包含 / 或 . 开头）
                if '/' in word or word.startswith('.'):
                    is_sensitive, reason = is_sensitive_file(word)
                    if is_sensitive:
                        print(f"🔐 BLOCKED: {reason}", file=sys.stderr)
                        print(f"命令尝试访问敏感文件: {word}", file=sys.stderr)
                        sys.exit(2)  # 阻止执行
        
        # 检查文件访问工具
        if tool_name in ['Read', 'Edit', 'Write']:
            file_path = tool_input.get('file_path', '')
            is_sensitive, reason = is_sensitive_file(file_path)
            if is_sensitive:
                print(f"🔐 BLOCKED: {reason}", file=sys.stderr)
                print(f"文件: {file_path}", file=sys.stderr)
                sys.exit(2)  # 阻止执行
        
        # 记录日志（按日期文件夹）
        from datetime import datetime
        today = datetime.now().strftime('%Y-%m-%d')
        log_dir = Path.cwd() / '.claude' / 'logs' / today
        log_dir.mkdir(parents=True, exist_ok=True)
        log_file = log_dir / 'pre_tool_use.json'
        
        log_data = []
        if log_file.exists():
            with open(log_file, 'r') as f:
                try:
                    log_data = json.load(f)
                except:
                    log_data = []
        
        log_data.append(input_data)
        
        with open(log_file, 'w') as f:
            json.dump(log_data, f, indent=2, ensure_ascii=False)
        
        sys.exit(0)
        
    except Exception as e:
        sys.exit(0)

if __name__ == '__main__':
    main()
