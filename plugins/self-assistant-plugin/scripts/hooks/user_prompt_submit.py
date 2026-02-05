#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# ///

import json
import sys
from pathlib import Path
from datetime import datetime

def main():
    try:
        input_data = json.load(sys.stdin)
        
        # 添加时间戳
        input_data['timestamp'] = datetime.now().isoformat()
        
        # 记录日志（按日期文件夹）
        today = datetime.now().strftime('%Y-%m-%d')
        log_dir = Path.cwd() / '.claude' / 'logs' / today
        log_dir.mkdir(parents=True, exist_ok=True)
        log_file = log_dir / 'user_prompt_submit.json'
        
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
        
    except Exception:
        sys.exit(0)

if __name__ == '__main__':
    main()
