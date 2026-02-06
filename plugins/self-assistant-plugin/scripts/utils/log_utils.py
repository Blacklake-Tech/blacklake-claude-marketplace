#!/usr/bin/env python3
"""
Hook 日志工具模块

提供统一的日志路径计算函数，将 hook 日志写入全局项目目录。
"""

from pathlib import Path
from datetime import datetime
import json


def get_hook_log_file_path(transcript_path: str, hook_name: str) -> Path:
    """
    获取 Hook 日志文件路径（全局目录）
    
    Args:
        transcript_path: Hook 输入中的 transcript_path，由 Claude Code 自动提供
        hook_name: Hook 名称（如 'notification', 'pre_tool_use'）
    
    Returns:
        完整的日志文件路径（格式：hook-{hook_name}.json）
        
    Raises:
        ValueError: 如果 transcript_path 为空或无效
        
    Examples:
        >>> transcript_path = "/Users/user/.claude/projects/-project/session.jsonl"
        >>> get_hook_log_file_path(transcript_path, 'notification')
        PosixPath('/Users/user/.claude/projects/-project/hook-logs/2026-02-05/hook-notification.json')
    """
    if not transcript_path:
        raise ValueError("transcript_path is required but was empty")
    
    # 从 transcript_path 提取项目目录
    project_dir = Path(transcript_path).parent
    
    # 按日期组织日志
    today = datetime.now().strftime('%Y-%m-%d')
    log_dir = project_dir / 'hook-logs' / today
    
    # 确保目录存在
    log_dir.mkdir(parents=True, exist_ok=True)
    
    # 返回日志文件路径（带 hook- 前缀）
    return log_dir / f'hook-{hook_name}.json'


def append_log_entry(log_file: Path, entry: dict) -> None:
    """
    追加日志条目到 JSON 数组文件
    
    Args:
        log_file: 日志文件路径
        entry: 要追加的日志条目（字典）
    """
    log_data = []
    
    # 读取现有日志
    if log_file.exists():
        try:
            with open(log_file, 'r', encoding='utf-8') as f:
                log_data = json.load(f)
        except (json.JSONDecodeError, IOError):
            # 文件损坏或为空，重新开始
            log_data = []
    
    # 追加新条目
    log_data.append(entry)
    
    # 写回文件
    with open(log_file, 'w', encoding='utf-8') as f:
        json.dump(log_data, f, indent=2, ensure_ascii=False)
