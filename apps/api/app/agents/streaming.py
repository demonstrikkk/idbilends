import json

from app.agents.schemas import CopilotStreamEvent


def format_sse(event: CopilotStreamEvent) -> str:
    return f"event: {event.event}\ndata: {json.dumps(event.data, separators=(',', ':'))}\n\n"
