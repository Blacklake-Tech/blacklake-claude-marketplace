#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# ///

import json
import sys
import subprocess
import argparse
from pathlib import Path

# 导入日志工具
sys.path.insert(0, str(Path(__file__).parent.parent))
from utils.log_utils import get_hook_log_file_path, append_log_entry

def send_mac_notification(title, message):
    """发送 macOS 通知（使用 osascript + Purr 音效）"""
    try:
        script = f'''
        display notification "{message}" with title "{title}" sound name "Purr"
        '''
        result = subprocess.run(
            ['osascript', '-e', script],
            capture_output=True,
            timeout=5,
            text=True
        )
        if result.returncode == 0:
            return True
        if result.stderr:
            print(f"[notification] osascript error: {result.stderr}", file=sys.stderr)
    except Exception as e:
        print(f"[notification] osascript exception: {e}", file=sys.stderr)
    
    return False

def play_ai_sound():
    """播放 AI 统一提示音（Purr）"""
    try:
        subprocess.run(
            ['afplay', '/System/Library/Sounds/Purr.aiff'],
            capture_output=True,
            timeout=2
        )
    except Exception:
        pass

def main():
    try:
        parser = argparse.ArgumentParser()
        parser.add_argument('--notify', action='store_true', help='启用通知')
        parser.add_argument('--tts', action='store_true', help='启用音效')
        args = parser.parse_args()
        
        input_data = json.load(sys.stdin)
        message = input_data.get('message', '')
        
        # 只对特定消息发送通知
        should_notify = (
            'permission' in message.lower() or
            'input' in message.lower() or
            'waiting' in message.lower()
        )
        
        if should_notify and args.notify:
            send_mac_notification("Claude Code 需要你的输入", "请检查终端并提供所需信息")
        
        if should_notify and args.tts:
            play_ai_sound()
        
        # 记录日志到全局目录（已禁用）
        # transcript_path = input_data.get('transcript_path', '')
        # if transcript_path:
        #     log_file = get_hook_log_file_path(transcript_path, 'notification')
        #     append_log_entry(log_file, input_data)
        
        sys.exit(0)
        
    except Exception:
        sys.exit(0)

if __name__ == '__main__':
    main()
