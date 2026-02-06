#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# ///

import json
import sys
from pathlib import Path
from datetime import datetime

# 导入日志工具
sys.path.insert(0, str(Path(__file__).parent.parent))
from utils.log_utils import get_hook_log_file_path, append_log_entry

def main():
    try:
        input_data = json.load(sys.stdin)
        
        # 添加时间戳
        input_data['timestamp'] = datetime.now().isoformat()
        
        # 记录日志到全局目录（已禁用）
        # transcript_path = input_data.get('transcript_path', '')
        # if transcript_path:
        #     log_file = get_hook_log_file_path(transcript_path, 'user_prompt_submit')
        #     append_log_entry(log_file, input_data)
        
        sys.exit(0)
        
    except Exception:
        sys.exit(0)

if __name__ == '__main__':
    main()
