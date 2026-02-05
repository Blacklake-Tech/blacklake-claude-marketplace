#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# ///

import json
import sys
import subprocess
import argparse
from pathlib import Path

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
        
        # 记录日志
        from datetime import datetime
        today = datetime.now().strftime('%Y-%m-%d')
        log_dir = Path.cwd() / '.claude' / 'logs' / today
        log_dir.mkdir(parents=True, exist_ok=True)
        log_file = log_dir / 'notification.json'
        
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
