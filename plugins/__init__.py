"""blacklake-claude-marketplace - Claude Code plugins"""
from pathlib import Path

__version__ = "0.1.0"


def get_plugins_dir() -> Path:
    """获取 plugins 目录路径"""
    return Path(__file__).parent

