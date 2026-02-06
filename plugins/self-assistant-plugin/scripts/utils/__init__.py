"""
通用工具模块

提供跨脚本复用的工具函数。
"""

from .log_utils import get_hook_log_file_path, append_log_entry

__all__ = ['get_hook_log_file_path', 'append_log_entry']
