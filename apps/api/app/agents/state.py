from typing import Any, TypedDict

from app.agents.schemas import CopilotBriefPayload, CopilotContext, TraceStep


class CopilotState(TypedDict, total=False):
    msme_id: str
    context: CopilotContext
    node_outputs: dict[str, dict[str, Any]]
    trace: list[TraceStep]
    provider: str
    final_brief: CopilotBriefPayload
    errors: list[str]
