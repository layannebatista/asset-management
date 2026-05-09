import json
import re
import sqlite3
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path


def normalize_path(value: str) -> str:
    return value.replace('\\\\?\\', '').replace('/', '\\').rstrip('\\').lower()


def parse_timestamp(value: str):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace('Z', '+00:00'))
    except ValueError:
        return None


def list_jsonl_files(root: Path):
    if not root.exists():
        return []
    return list(root.rglob('*.jsonl'))


def list_files(root: Path, pattern: str):
    if not root.exists():
        return []
    return list(root.rglob(pattern))


def load_text(path: Path):
    try:
        return path.read_text(encoding='utf-8', errors='ignore')
    except OSError:
        return ''


def normalize_model_name(value: str):
    model = (value or '').strip()
    if not model:
        return ''
    return model.replace(' -> ', ' -> ').rstrip('.,;:')


def parse_log_timestamp(value: str):
    if not value:
        return None
    first_token = value.split(' ', 1)[0].strip()
    try:
        parsed = datetime.fromisoformat(first_token.replace('Z', '+00:00'))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def register_model(observed, *, agent, provider, model, timestamp, session_id='', entrypoint='', source=''):
    model_name = normalize_model_name(model)
    if not model_name:
        return

    key = (agent, provider, model_name, source)
    entry = observed.setdefault(key, {
        'agent': agent,
        'provider': provider,
        'model': model_name,
        'assistantMessages': 0,
        'sessions': set(),
        'lastSeen': '',
        'entrypoints': set(),
        'source': source,
    })
    entry['assistantMessages'] += 1

    if session_id:
        entry['sessions'].add(session_id)
    if entrypoint:
        entry['entrypoints'].add(entrypoint)
    if timestamp and timestamp > entry['lastSeen']:
        entry['lastSeen'] = timestamp


def load_commands(history_db: Path, project_root: str, cutoff: datetime):
    if not history_db.exists():
      return []

    conn = sqlite3.connect(history_db)
    conn.row_factory = sqlite3.Row
    try:
        rows = conn.execute(
            """
            SELECT
              timestamp,
              original_cmd,
              rtk_cmd,
              input_tokens,
              output_tokens,
              saved_tokens,
              savings_pct,
              exec_time_ms,
              project_path
            FROM commands
            ORDER BY timestamp DESC
            """
        ).fetchall()
    finally:
        conn.close()

    commands = []
    for row in rows:
        timestamp = parse_timestamp(row['timestamp'])
        if timestamp is None or timestamp < cutoff:
            continue
        if normalize_path(row['project_path'] or '') != project_root:
            continue

        commands.append({
            'timestamp': row['timestamp'],
            'originalCmd': row['original_cmd'] or '',
            'rtkCmd': row['rtk_cmd'] or '',
            'inputTokens': int(row['input_tokens'] or 0),
            'outputTokens': int(row['output_tokens'] or 0),
            'savedTokens': int(row['saved_tokens'] or 0),
            'savingsPct': float(row['savings_pct'] or 0),
            'execTimeMs': int(row['exec_time_ms'] or 0),
            'projectPath': row['project_path'] or '',
        })

    return commands


def load_failures(history_db: Path, cutoff: datetime):
    if not history_db.exists():
        return []

    conn = sqlite3.connect(history_db)
    conn.row_factory = sqlite3.Row
    try:
        rows = conn.execute(
            """
            SELECT
              timestamp,
              raw_command,
              error_message,
              fallback_succeeded
            FROM parse_failures
            ORDER BY timestamp DESC
            """
        ).fetchall()
    finally:
        conn.close()

    failures = []
    for row in rows:
        timestamp = parse_timestamp(row['timestamp'])
        if timestamp is None or timestamp < cutoff:
            continue

        failures.append({
            'timestamp': row['timestamp'],
            'rawCommand': row['raw_command'] or '',
            'errorMessage': row['error_message'] or '',
            'fallbackSucceeded': int(row['fallback_succeeded'] or 0) == 1,
        })

    return failures


def load_claude_models(claude_projects: Path, project_root: str, cutoff: datetime, observed):
    for file_path in list_jsonl_files(claude_projects):
        raw = load_text(file_path)
        if not raw:
            continue

        for line in raw.splitlines():
            line = line.strip()
            if not line:
                continue

            try:
                event = json.loads(line)
            except json.JSONDecodeError:
                continue

            model = ((event.get('message') or {}).get('model'))
            cwd = normalize_path(event.get('cwd') or '')
            timestamp = parse_timestamp(event.get('timestamp') or '')

            if (
                not model
                or model == '<synthetic>'
                or event.get('type') != 'assistant'
                or cwd != project_root
                or timestamp is None
                or timestamp < cutoff
            ):
                continue

            register_model(
                observed,
                agent='Claude',
                provider='Anthropic',
                model=model,
                timestamp=event.get('timestamp') or '',
                session_id=event.get('sessionId') or '',
                entrypoint=event.get('entrypoint') or '',
                source='claude-projects',
            )


def infer_codex_model(base_instructions):
    text = ''
    if isinstance(base_instructions, dict):
        text = base_instructions.get('text') or ''
    elif isinstance(base_instructions, str):
        text = base_instructions

    match = re.search(r'based on ([A-Za-z0-9.\-]+)', text, flags=re.IGNORECASE)
    if match:
        return match.group(1).rstrip('.,;:')

    if 'gpt-5' in text.lower():
        return 'gpt-5'

    return 'gpt-5'


def load_codex_models(codex_sessions: Path, project_root: str, cutoff: datetime, observed):
    for file_path in list_jsonl_files(codex_sessions):
        raw = load_text(file_path)
        if not raw:
            continue

        session_meta = None
        assistant_messages = 0
        last_seen = ''

        for line in raw.splitlines():
            line = line.strip()
            if not line:
                continue

            try:
                event = json.loads(line)
            except json.JSONDecodeError:
                continue

            event_type = event.get('type')
            payload = event.get('payload') or {}

            if event_type == 'session_meta':
                session_meta = payload
                continue

            event_timestamp = parse_timestamp(event.get('timestamp') or '')
            if event_timestamp is None or event_timestamp < cutoff:
                continue

            if event_type == 'response_item':
                response_type = payload.get('type')
                role = payload.get('role')
                if response_type == 'message' and role == 'assistant':
                    assistant_messages += 1
                    if (event.get('timestamp') or '') > last_seen:
                        last_seen = event.get('timestamp') or last_seen
            elif event_type == 'event_msg' and payload.get('type') == 'agent_message':
                assistant_messages += 1
                if (event.get('timestamp') or '') > last_seen:
                    last_seen = event.get('timestamp') or last_seen

        if not session_meta:
            continue

        cwd = normalize_path(session_meta.get('cwd') or '')
        session_timestamp = parse_timestamp(session_meta.get('timestamp') or '')
        if cwd != project_root:
            continue
        if not last_seen and (session_timestamp is None or session_timestamp < cutoff):
            continue

        register_model(
            observed,
            agent='Codex',
            provider='OpenAI',
            model=infer_codex_model(session_meta.get('base_instructions')),
            timestamp=last_seen or session_meta.get('timestamp') or '',
            session_id=session_meta.get('id') or str(file_path),
            entrypoint=session_meta.get('originator') or session_meta.get('source') or '',
            source='codex-sessions',
        )

        key = ('Codex', 'OpenAI', infer_codex_model(session_meta.get('base_instructions')), 'codex-sessions')
        if key in observed:
            observed[key]['assistantMessages'] = max(observed[key]['assistantMessages'], assistant_messages or 1)


def parse_simple_yaml(text: str):
    values = {}
    for line in text.splitlines():
        if ':' not in line:
            continue
        key, value = line.split(':', 1)
        values[key.strip()] = value.strip()
    return values


def load_copilot_models(copilot_root: Path, project_root: str, cutoff: datetime, observed):
    workspace_hits = []
    session_root = copilot_root / 'session-state'
    log_root = copilot_root / 'logs'

    for file_path in list_files(session_root, 'workspace.yaml'):
        content = load_text(file_path)
        if not content:
            continue
        values = parse_simple_yaml(content)
        cwd = normalize_path(values.get('cwd') or values.get('git_root') or '')
        updated_at = parse_timestamp(values.get('updated_at') or values.get('created_at') or '')
        if cwd != project_root:
            continue
        if updated_at is not None and updated_at < cutoff:
            continue
        workspace_hits.append({
            'session_id': values.get('id') or str(file_path.parent),
            'timestamp': values.get('updated_at') or values.get('created_at') or '',
            'file_path': file_path,
        })

    if not workspace_hits:
        return

    log_files = list_files(log_root, '*.log')
    for log_path in log_files:
        content = load_text(log_path)
        if not content:
            continue

        if project_root not in normalize_path(content):
            continue

        for line in content.splitlines():
            log_timestamp = parse_log_timestamp(line)
            if log_timestamp is None or log_timestamp < cutoff:
                continue

            model = ''
            entrypoint = ''

            default_match = re.search(r'Using default model:\s*(.+)$', line)
            success_match = re.search(r'\|\s*success\s*\|\s*([^|]+?)\s*\|\s*[^|]+\s*\|\s*(\[[^\]]+\])', line)
            if success_match:
                model = success_match.group(1).strip()
                entrypoint = success_match.group(2).strip('[]')
            elif default_match:
                model = default_match.group(1).strip()
                entrypoint = 'default-model'

            if not model:
                continue

            for workspace in workspace_hits:
                register_model(
                    observed,
                    agent='GitHub Copilot',
                    provider='GitHub',
                    model=model,
                    timestamp=log_timestamp.isoformat(),
                    session_id=workspace['session_id'],
                    entrypoint=entrypoint,
                    source='copilot-cli',
                )


def build_models_snapshot(observed):
    result = []
    for value in observed.values():
        result.append({
            'agent': value['agent'],
            'provider': value['provider'],
            'model': value['model'],
            'assistantMessages': value['assistantMessages'],
            'sessions': len(value['sessions']),
            'lastSeen': value['lastSeen'],
            'entrypoints': sorted(value['entrypoints']),
            'source': value['source'],
        })

    result.sort(key=lambda item: (item['agent'], -item['assistantMessages'], item['model']))
    return result


def main():
    if len(sys.argv) != 6 + 1:
        raise SystemExit(
            'Usage: read_rtk_snapshot.py <history_db> <claude_projects> <codex_sessions> <copilot_root> <project_root> <days>',
        )

    history_db = Path(sys.argv[1])
    claude_projects = Path(sys.argv[2])
    codex_sessions = Path(sys.argv[3])
    copilot_root = Path(sys.argv[4])
    project_root = normalize_path(sys.argv[5])
    days = int(sys.argv[6])

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    observed = {}
    load_claude_models(claude_projects, project_root, cutoff, observed)
    load_codex_models(codex_sessions, project_root, cutoff, observed)
    load_copilot_models(copilot_root, project_root, cutoff, observed)

    snapshot = {
        'projectRoot': project_root,
        'historyDbPath': str(history_db),
        'generatedAt': datetime.now(timezone.utc).isoformat(),
        'commands': load_commands(history_db, project_root, cutoff),
        'failures': load_failures(history_db, cutoff),
        'models': build_models_snapshot(observed),
    }

    print(json.dumps(snapshot, ensure_ascii=False))


if __name__ == '__main__':
    main()
