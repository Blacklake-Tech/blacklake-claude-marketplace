#!/usr/bin/env python3
"""
Instinct CLI - Manage instincts for Continuous Learning v2

Commands:
  status     - Show all instincts and their status
  import     - Import instincts from file or URL
  export     - Export instincts to file
  evolve     - Cluster instincts into skills/commands/agents
  claude-md  - Manage project-level CLAUDE.md conventions
"""

import argparse
import json
import os
import sys
import re
import urllib.request
from pathlib import Path
from datetime import datetime
from collections import defaultdict
from typing import Optional

# ─────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────

HOMUNCULUS_DIR = Path.home() / ".claude" / "homunculus"
INSTINCTS_DIR = HOMUNCULUS_DIR / "instincts"
PERSONAL_DIR = INSTINCTS_DIR / "personal"
INHERITED_DIR = INSTINCTS_DIR / "inherited"
EVOLVED_DIR = HOMUNCULUS_DIR / "evolved"
OBSERVATIONS_FILE = HOMUNCULUS_DIR / "observations.jsonl"

# Ensure directories exist
for d in [PERSONAL_DIR, INHERITED_DIR, EVOLVED_DIR / "skills", EVOLVED_DIR / "commands", EVOLVED_DIR / "agents"]:
    d.mkdir(parents=True, exist_ok=True)


# ─────────────────────────────────────────────
# Instinct Parser
# ─────────────────────────────────────────────

def parse_instinct_file(content: str) -> list[dict]:
    """Parse YAML-like instinct file format."""
    instincts = []
    current = {}
    in_frontmatter = False
    content_lines = []

    for line in content.split('\n'):
        if line.strip() == '---':
            if in_frontmatter:
                # End of frontmatter
                in_frontmatter = False
                if current:
                    current['content'] = '\n'.join(content_lines).strip()
                    instincts.append(current)
                    current = {}
                    content_lines = []
            else:
                # Start of frontmatter
                in_frontmatter = True
                if current:
                    current['content'] = '\n'.join(content_lines).strip()
                    instincts.append(current)
                current = {}
                content_lines = []
        elif in_frontmatter:
            # Parse YAML-like frontmatter
            if ':' in line:
                key, value = line.split(':', 1)
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                if key == 'confidence':
                    current[key] = float(value)
                else:
                    current[key] = value
        else:
            content_lines.append(line)

    # Don't forget the last instinct
    if current:
        current['content'] = '\n'.join(content_lines).strip()
        instincts.append(current)

    return [i for i in instincts if i.get('id')]


def load_all_instincts() -> list[dict]:
    """Load all instincts from personal and inherited directories."""
    instincts = []

    for directory in [PERSONAL_DIR, INHERITED_DIR]:
        if not directory.exists():
            continue
        for file in directory.glob("*.yaml"):
            try:
                content = file.read_text()
                parsed = parse_instinct_file(content)
                for inst in parsed:
                    inst['_source_file'] = str(file)
                    inst['_source_type'] = directory.name
                instincts.extend(parsed)
            except Exception as e:
                print(f"Warning: Failed to parse {file}: {e}", file=sys.stderr)

    return instincts


# ─────────────────────────────────────────────
# Status Command
# ─────────────────────────────────────────────

def cmd_status(args):
    """Show status of all instincts."""
    instincts = load_all_instincts()

    if not instincts:
        print("No instincts found.")
        print(f"\nInstinct directories:")
        print(f"  Personal:  {PERSONAL_DIR}")
        print(f"  Inherited: {INHERITED_DIR}")
        return

    # Group by domain
    by_domain = defaultdict(list)
    for inst in instincts:
        domain = inst.get('domain', 'general')
        by_domain[domain].append(inst)

    # Print header
    print(f"\n{'='*60}")
    print(f"  INSTINCT STATUS - {len(instincts)} total")
    print(f"{'='*60}\n")

    # Summary by source
    personal = [i for i in instincts if i.get('_source_type') == 'personal']
    inherited = [i for i in instincts if i.get('_source_type') == 'inherited']
    print(f"  Personal:  {len(personal)}")
    print(f"  Inherited: {len(inherited)}")
    print()

    # Print by domain
    for domain in sorted(by_domain.keys()):
        domain_instincts = by_domain[domain]
        print(f"## {domain.upper()} ({len(domain_instincts)})")
        print()

        for inst in sorted(domain_instincts, key=lambda x: -x.get('confidence', 0.5)):
            conf = inst.get('confidence', 0.5)
            conf_bar = '█' * int(conf * 10) + '░' * (10 - int(conf * 10))
            trigger = inst.get('trigger', 'unknown trigger')
            source = inst.get('source', 'unknown')

            print(f"  {conf_bar} {int(conf*100):3d}%  {inst.get('id', 'unnamed')}")
            print(f"            trigger: {trigger}")

            # Extract action from content
            content = inst.get('content', '')
            action_match = re.search(r'## Action\s*\n\s*(.+?)(?:\n\n|\n##|$)', content, re.DOTALL)
            if action_match:
                action = action_match.group(1).strip().split('\n')[0]
                print(f"            action: {action[:60]}{'...' if len(action) > 60 else ''}")

            print()

    # Observations stats
    if OBSERVATIONS_FILE.exists():
        obs_count = sum(1 for _ in open(OBSERVATIONS_FILE))
        print(f"─────────────────────────────────────────────────────────")
        print(f"  Observations: {obs_count} events logged")
        print(f"  File: {OBSERVATIONS_FILE}")

    print(f"\n{'='*60}\n")


# ─────────────────────────────────────────────
# Import Command
# ─────────────────────────────────────────────

def cmd_import(args):
    """Import instincts from file or URL."""
    source = args.source

    # Fetch content
    if source.startswith('http://') or source.startswith('https://'):
        print(f"Fetching from URL: {source}")
        try:
            with urllib.request.urlopen(source) as response:
                content = response.read().decode('utf-8')
        except Exception as e:
            print(f"Error fetching URL: {e}", file=sys.stderr)
            return 1
    else:
        path = Path(source).expanduser()
        if not path.exists():
            print(f"File not found: {path}", file=sys.stderr)
            return 1
        content = path.read_text()

    # Parse instincts
    new_instincts = parse_instinct_file(content)
    if not new_instincts:
        print("No valid instincts found in source.")
        return 1

    print(f"\nFound {len(new_instincts)} instincts to import.\n")

    # Load existing
    existing = load_all_instincts()
    existing_ids = {i.get('id') for i in existing}

    # Categorize
    to_add = []
    duplicates = []
    to_update = []

    for inst in new_instincts:
        inst_id = inst.get('id')
        if inst_id in existing_ids:
            # Check if we should update
            existing_inst = next((e for e in existing if e.get('id') == inst_id), None)
            if existing_inst:
                if inst.get('confidence', 0) > existing_inst.get('confidence', 0):
                    to_update.append(inst)
                else:
                    duplicates.append(inst)
        else:
            to_add.append(inst)

    # Filter by minimum confidence
    min_conf = args.min_confidence or 0.0
    to_add = [i for i in to_add if i.get('confidence', 0.5) >= min_conf]
    to_update = [i for i in to_update if i.get('confidence', 0.5) >= min_conf]

    # Display summary
    if to_add:
        print(f"NEW ({len(to_add)}):")
        for inst in to_add:
            print(f"  + {inst.get('id')} (confidence: {inst.get('confidence', 0.5):.2f})")

    if to_update:
        print(f"\nUPDATE ({len(to_update)}):")
        for inst in to_update:
            print(f"  ~ {inst.get('id')} (confidence: {inst.get('confidence', 0.5):.2f})")

    if duplicates:
        print(f"\nSKIP ({len(duplicates)} - already exists with equal/higher confidence):")
        for inst in duplicates[:5]:
            print(f"  - {inst.get('id')}")
        if len(duplicates) > 5:
            print(f"  ... and {len(duplicates) - 5} more")

    if args.dry_run:
        print("\n[DRY RUN] No changes made.")
        return 0

    if not to_add and not to_update:
        print("\nNothing to import.")
        return 0

    # Confirm
    if not args.force:
        response = input(f"\nImport {len(to_add)} new, update {len(to_update)}? [y/N] ")
        if response.lower() != 'y':
            print("Cancelled.")
            return 0

    # Write to inherited directory
    timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
    source_name = Path(source).stem if not source.startswith('http') else 'web-import'
    output_file = INHERITED_DIR / f"{source_name}-{timestamp}.yaml"

    all_to_write = to_add + to_update
    output_content = f"# Imported from {source}\n# Date: {datetime.now().isoformat()}\n\n"

    for inst in all_to_write:
        output_content += "---\n"
        output_content += f"id: {inst.get('id')}\n"
        output_content += f"trigger: \"{inst.get('trigger', 'unknown')}\"\n"
        output_content += f"confidence: {inst.get('confidence', 0.5)}\n"
        output_content += f"domain: {inst.get('domain', 'general')}\n"
        output_content += f"source: inherited\n"
        output_content += f"imported_from: \"{source}\"\n"
        if inst.get('source_repo'):
            output_content += f"source_repo: {inst.get('source_repo')}\n"
        output_content += "---\n\n"
        output_content += inst.get('content', '') + "\n\n"

    output_file.write_text(output_content)

    print(f"\n✅ Import complete!")
    print(f"   Added: {len(to_add)}")
    print(f"   Updated: {len(to_update)}")
    print(f"   Saved to: {output_file}")

    return 0


# ─────────────────────────────────────────────
# Export Command
# ─────────────────────────────────────────────

def cmd_export(args):
    """Export instincts to file."""
    instincts = load_all_instincts()

    if not instincts:
        print("No instincts to export.")
        return 1

    # Filter by domain if specified
    if args.domain:
        instincts = [i for i in instincts if i.get('domain') == args.domain]

    # Filter by minimum confidence
    if args.min_confidence:
        instincts = [i for i in instincts if i.get('confidence', 0.5) >= args.min_confidence]

    if not instincts:
        print("No instincts match the criteria.")
        return 1

    # Generate output
    output = f"# Instincts export\n# Date: {datetime.now().isoformat()}\n# Total: {len(instincts)}\n\n"

    for inst in instincts:
        output += "---\n"
        for key in ['id', 'trigger', 'confidence', 'domain', 'source', 'source_repo']:
            if inst.get(key):
                value = inst[key]
                if key == 'trigger':
                    output += f'{key}: "{value}"\n'
                else:
                    output += f"{key}: {value}\n"
        output += "---\n\n"
        output += inst.get('content', '') + "\n\n"

    # Write to file or stdout
    if args.output:
        Path(args.output).write_text(output)
        print(f"Exported {len(instincts)} instincts to {args.output}")
    else:
        print(output)

    return 0


# ─────────────────────────────────────────────
# Evolve Command
# ─────────────────────────────────────────────

def cmd_evolve(args):
    """Analyze instincts and suggest evolutions to skills/commands/agents."""
    instincts = load_all_instincts()

    if len(instincts) < 3:
        print("Need at least 3 instincts to analyze patterns.")
        print(f"Currently have: {len(instincts)}")
        return 1

    print(f"\n{'='*60}")
    print(f"  EVOLVE ANALYSIS - {len(instincts)} instincts")
    print(f"{'='*60}\n")

    # Group by domain
    by_domain = defaultdict(list)
    for inst in instincts:
        domain = inst.get('domain', 'general')
        by_domain[domain].append(inst)

    # High-confidence instincts by domain (candidates for skills)
    high_conf = [i for i in instincts if i.get('confidence', 0) >= 0.8]
    print(f"High confidence instincts (>=80%): {len(high_conf)}")

    # Find clusters (instincts with similar triggers)
    trigger_clusters = defaultdict(list)
    for inst in instincts:
        trigger = inst.get('trigger', '')
        # Normalize trigger
        trigger_key = trigger.lower()
        for keyword in ['when', 'creating', 'writing', 'adding', 'implementing', 'testing']:
            trigger_key = trigger_key.replace(keyword, '').strip()
        trigger_clusters[trigger_key].append(inst)

    # Find clusters with 3+ instincts (good skill candidates)
    skill_candidates = []
    for trigger, cluster in trigger_clusters.items():
        if len(cluster) >= 2:
            avg_conf = sum(i.get('confidence', 0.5) for i in cluster) / len(cluster)
            skill_candidates.append({
                'trigger': trigger,
                'instincts': cluster,
                'avg_confidence': avg_conf,
                'domains': list(set(i.get('domain', 'general') for i in cluster))
            })

    # Sort by cluster size and confidence
    skill_candidates.sort(key=lambda x: (-len(x['instincts']), -x['avg_confidence']))

    print(f"\nPotential skill clusters found: {len(skill_candidates)}")

    if skill_candidates:
        print(f"\n## SKILL CANDIDATES\n")
        for i, cand in enumerate(skill_candidates[:5], 1):
            print(f"{i}. Cluster: \"{cand['trigger']}\"")
            print(f"   Instincts: {len(cand['instincts'])}")
            print(f"   Avg confidence: {cand['avg_confidence']:.0%}")
            print(f"   Domains: {', '.join(cand['domains'])}")
            print(f"   Instincts:")
            for inst in cand['instincts'][:3]:
                print(f"     - {inst.get('id')}")
            print()

    # Command candidates (workflow instincts with high confidence)
    workflow_instincts = [i for i in instincts if i.get('domain') == 'workflow' and i.get('confidence', 0) >= 0.7]
    if workflow_instincts:
        print(f"\n## COMMAND CANDIDATES ({len(workflow_instincts)})\n")
        for inst in workflow_instincts[:5]:
            trigger = inst.get('trigger', 'unknown')
            # Suggest command name
            cmd_name = trigger.replace('when ', '').replace('implementing ', '').replace('a ', '')
            cmd_name = cmd_name.replace(' ', '-')[:20]
            print(f"  /{cmd_name}")
            print(f"    From: {inst.get('id')}")
            print(f"    Confidence: {inst.get('confidence', 0.5):.0%}")
            print()

    # Agent candidates (complex multi-step patterns)
    agent_candidates = [c for c in skill_candidates if len(c['instincts']) >= 3 and c['avg_confidence'] >= 0.75]
    if agent_candidates:
        print(f"\n## AGENT CANDIDATES ({len(agent_candidates)})\n")
        for cand in agent_candidates[:3]:
            agent_name = cand['trigger'].replace(' ', '-')[:20] + '-agent'
            print(f"  {agent_name}")
            print(f"    Covers {len(cand['instincts'])} instincts")
            print(f"    Avg confidence: {cand['avg_confidence']:.0%}")
            print()

    if args.generate:
        print("\n[Would generate evolved structures here]")
        print("  Skills would be saved to:", EVOLVED_DIR / "skills")
        print("  Commands would be saved to:", EVOLVED_DIR / "commands")
        print("  Agents would be saved to:", EVOLVED_DIR / "agents")

    print(f"\n{'='*60}\n")
    return 0


# ─────────────────────────────────────────────
# CLAUDE.md Commands
# ─────────────────────────────────────────────

# 默认 sections 配置
DEFAULT_SECTIONS = [
    "项目约定",
    "代码风格",
    "API 规范",
    "Git 工作流",
    "测试策略",
    "特殊注意事项"
]

def get_claude_md_path() -> Path:
    """获取当前项目的 CLAUDE.md 路径（项目根目录）"""
    return Path.cwd() / "CLAUDE.md"


def load_claude_md() -> dict:
    """加载并解析 CLAUDE.md 文件，返回 sections 字典"""
    claude_md_path = get_claude_md_path()
    sections = {}
    
    if not claude_md_path.exists():
        return sections
    
    content = claude_md_path.read_text(encoding='utf-8')
    current_section = None
    current_content = []
    
    for line in content.split('\n'):
        # 检测 section 标题（## 开头）
        if line.startswith('## '):
            # 保存上一个 section
            if current_section:
                sections[current_section] = '\n'.join(current_content).strip()
            current_section = line[3:].strip()
            current_content = []
        elif current_section:
            current_content.append(line)
    
    # 保存最后一个 section
    if current_section:
        sections[current_section] = '\n'.join(current_content).strip()
    
    return sections


def save_claude_md(sections: dict, project_name: str = None):
    """保存 sections 到 CLAUDE.md 文件"""
    claude_md_path = get_claude_md_path()
    
    # 获取项目名称
    if not project_name:
        project_name = Path.cwd().name
    
    # 生成内容
    timestamp = datetime.now().strftime('%Y-%m-%d')
    content = f"""# {project_name} - Claude 项目指南

**自动生成**: 此文件由 continuous-learning-v2 维护
**最后更新**: {timestamp}

---

"""
    
    # 按照默认顺序排列 sections
    ordered_sections = []
    for s in DEFAULT_SECTIONS:
        if s in sections:
            ordered_sections.append(s)
    
    # 添加其他不在默认列表中的 sections
    for s in sections:
        if s not in ordered_sections:
            ordered_sections.append(s)
    
    # 生成各 section
    for section in ordered_sections:
        content += f"## {section}\n\n"
        section_content = sections.get(section, '')
        if section_content:
            content += section_content + "\n"
        content += "\n"
    
    # 写入文件
    claude_md_path.write_text(content, encoding='utf-8')
    return claude_md_path


def cmd_claude_md_add(args):
    """添加规范到 CLAUDE.md"""
    section = args.section
    content = args.content
    
    # 加载现有内容
    sections = load_claude_md()
    
    # 添加或追加内容
    if section in sections:
        # 追加到现有 section
        existing = sections[section]
        if existing:
            sections[section] = existing + "\n- " + content
        else:
            sections[section] = "- " + content
    else:
        # 创建新 section
        sections[section] = "- " + content
    
    # 保存
    output_path = save_claude_md(sections)
    
    print(f"✅ 已添加到 CLAUDE.md")
    print(f"   Section: {section}")
    print(f"   Content: {content}")
    print(f"   File: {output_path}")
    
    return 0


def cmd_claude_md_list(args):
    """列出 CLAUDE.md 中的所有规范"""
    sections = load_claude_md()
    claude_md_path = get_claude_md_path()
    
    if not sections:
        print(f"当前项目没有 CLAUDE.md 或文件为空。")
        print(f"路径: {claude_md_path}")
        print(f"\n使用 'claude-md add' 添加第一条规范。")
        return 0
    
    print(f"\n{'='*60}")
    print(f"  CLAUDE.md - {Path.cwd().name}")
    print(f"{'='*60}\n")
    
    for section, content in sections.items():
        if content.strip():
            print(f"## {section}")
            print()
            for line in content.split('\n'):
                if line.strip():
                    print(f"  {line}")
            print()
    
    print(f"─────────────────────────────────────────────────────────")
    print(f"  File: {claude_md_path}")
    print(f"\n{'='*60}\n")
    
    return 0


def cmd_claude_md_show(args):
    """显示 CLAUDE.md 文件内容"""
    claude_md_path = get_claude_md_path()
    
    if not claude_md_path.exists():
        print(f"当前项目没有 CLAUDE.md 文件。")
        print(f"路径: {claude_md_path}")
        return 1
    
    content = claude_md_path.read_text(encoding='utf-8')
    print(content)
    
    return 0


def cmd_claude_md_init(args):
    """初始化 CLAUDE.md 文件"""
    claude_md_path = get_claude_md_path()
    
    if claude_md_path.exists() and not args.force:
        print(f"CLAUDE.md 已存在: {claude_md_path}")
        print(f"使用 --force 覆盖现有文件。")
        return 1
    
    # 创建默认 sections
    sections = {}
    for s in DEFAULT_SECTIONS:
        sections[s] = ""
    
    # 保存
    output_path = save_claude_md(sections)
    
    print(f"✅ 已创建 CLAUDE.md")
    print(f"   File: {output_path}")
    print(f"\n使用 'claude-md add' 添加规范。")
    
    return 0


def cmd_claude_md(args):
    """CLAUDE.md 子命令分发"""
    if args.claude_md_command == 'add':
        return cmd_claude_md_add(args)
    elif args.claude_md_command == 'list':
        return cmd_claude_md_list(args)
    elif args.claude_md_command == 'show':
        return cmd_claude_md_show(args)
    elif args.claude_md_command == 'init':
        return cmd_claude_md_init(args)
    else:
        print("Available claude-md commands: add, list, show, init")
        return 1


# ─────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='Instinct CLI for Continuous Learning v2')
    subparsers = parser.add_subparsers(dest='command', help='Available commands')

    # Status
    status_parser = subparsers.add_parser('status', help='Show instinct status')

    # Import
    import_parser = subparsers.add_parser('import', help='Import instincts')
    import_parser.add_argument('source', help='File path or URL')
    import_parser.add_argument('--dry-run', action='store_true', help='Preview without importing')
    import_parser.add_argument('--force', action='store_true', help='Skip confirmation')
    import_parser.add_argument('--min-confidence', type=float, help='Minimum confidence threshold')

    # Export
    export_parser = subparsers.add_parser('export', help='Export instincts')
    export_parser.add_argument('--output', '-o', help='Output file')
    export_parser.add_argument('--domain', help='Filter by domain')
    export_parser.add_argument('--min-confidence', type=float, help='Minimum confidence')

    # Evolve
    evolve_parser = subparsers.add_parser('evolve', help='Analyze and evolve instincts')
    evolve_parser.add_argument('--generate', action='store_true', help='Generate evolved structures')

    # Claude-md (项目级规范管理)
    claude_md_parser = subparsers.add_parser('claude-md', help='Manage project-level CLAUDE.md conventions')
    claude_md_subparsers = claude_md_parser.add_subparsers(dest='claude_md_command', help='claude-md commands')
    
    # claude-md add
    claude_md_add = claude_md_subparsers.add_parser('add', help='Add a convention to CLAUDE.md')
    claude_md_add.add_argument('--section', '-s', required=True, help='Section name (e.g., "API 规范", "代码风格")')
    claude_md_add.add_argument('--content', '-c', required=True, help='Convention content to add')
    
    # claude-md list
    claude_md_subparsers.add_parser('list', help='List all conventions in CLAUDE.md')
    
    # claude-md show
    claude_md_subparsers.add_parser('show', help='Show CLAUDE.md file content')
    
    # claude-md init
    claude_md_init = claude_md_subparsers.add_parser('init', help='Initialize CLAUDE.md file')
    claude_md_init.add_argument('--force', '-f', action='store_true', help='Overwrite existing file')

    args = parser.parse_args()

    if args.command == 'status':
        return cmd_status(args)
    elif args.command == 'import':
        return cmd_import(args)
    elif args.command == 'export':
        return cmd_export(args)
    elif args.command == 'evolve':
        return cmd_evolve(args)
    elif args.command == 'claude-md':
        return cmd_claude_md(args)
    else:
        parser.print_help()
        return 1


if __name__ == '__main__':
    sys.exit(main() or 0)
