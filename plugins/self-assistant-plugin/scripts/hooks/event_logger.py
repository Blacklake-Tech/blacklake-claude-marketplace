#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# ///

import json
import sys
import os
from datetime import datetime
from pathlib import Path

def truncate(value, max_len=2000):
    """截断长字符串"""
    if isinstance(value, str) and len(value) > max_len:
        return f"{value[:max_len]}... ({len(value)} chars)"
    return value

def process(value, max_str=2000, max_list=50):
    """处理数据，避免日志过大"""
    if value is None or isinstance(value, bool):
        return value
    if isinstance(value, str):
        return truncate(value, max_str)
    if isinstance(value, (int, float)):
        return value
    if isinstance(value, list):
        items = [process(v) for v in value[:max_list]]
        if len(value) > max_list:
            items.append(f"... +{len(value) - max_list} more")
        return items
    if isinstance(value, dict):
        return {str(k): process(v) for k, v in value.items()}
    return str(value)

def main():
    stdin_data = sys.stdin.read()
    
    try:
        data = json.loads(stdin_data) if stdin_data else {}
    except json.JSONDecodeError:
        data = {"_raw": stdin_data}
    
    # 构建事件记录
    event = {
        "ts": datetime.now().isoformat(),
        "hook_event_name": data.get("hook_event_name", "unknown"),
        "tool_name": data.get("tool_name", ""),
        "cwd": os.getcwd(),
        "data": process(data),
    }
    
    # 保存到日志文件（按日期文件夹）
    today = datetime.now().strftime('%Y-%m-%d')
    log_dir = Path.cwd() / '.claude' / 'logs' / today
    log_dir.mkdir(parents=True, exist_ok=True)
    log_file = log_dir / 'events.jsonl'
    
    with open(log_file, 'a') as f:
        f.write(json.dumps(event, default=str, ensure_ascii=False) + '\n')

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f"[event-logger] Error: {e}", file=sys.stderr)
