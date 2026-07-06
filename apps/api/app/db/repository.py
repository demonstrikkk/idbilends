from dataclasses import dataclass, field

from app.schemas.audit import AuditEventSchema
from app.schemas.msme import DocumentStatusSchema, FinancialSnapshotSchema, MSMEDetail
from app.schemas.prospect import ProspectSignalOutputSchema
from app.schemas.score import ScoreOutputSchema


@dataclass
class DemoStore:
    profiles: dict[str, MSMEDetail] = field(default_factory=dict)
    scores: dict[str, list[ScoreOutputSchema]] = field(default_factory=dict)
    prospects: dict[str, list[ProspectSignalOutputSchema]] = field(default_factory=dict)
    audit_events: list[AuditEventSchema] = field(default_factory=list)

    def reset(self) -> None:
        self.profiles.clear()
        self.scores.clear()
        self.prospects.clear()
        self.audit_events.clear()

    def upsert_profile(self, profile: MSMEDetail) -> None:
        self.profiles[profile.id] = profile

    def get_profile(self, msme_id: str) -> MSMEDetail | None:
        return self.profiles.get(msme_id)

    def list_profiles(self) -> list[MSMEDetail]:
        return list(self.profiles.values())

    def add_score(self, score: ScoreOutputSchema) -> None:
        self.scores.setdefault(score.msme_id, []).append(score)
        profile = self.profiles[score.msme_id]
        self.profiles[score.msme_id] = profile.model_copy(update={"latest_score_id": score.id})

    def latest_score(self, msme_id: str) -> ScoreOutputSchema | None:
        scores = self.scores.get(msme_id, [])
        return scores[-1] if scores else None

    def add_prospect(self, prospect: ProspectSignalOutputSchema) -> None:
        self.prospects.setdefault(prospect.msme_id, []).append(prospect)
        profile = self.profiles[prospect.msme_id]
        self.profiles[prospect.msme_id] = profile.model_copy(update={"latest_prospect_signal_id": prospect.id})

    def latest_prospect(self, msme_id: str) -> ProspectSignalOutputSchema | None:
        prospects = self.prospects.get(msme_id, [])
        return prospects[-1] if prospects else None

    def add_audit_event(self, event: AuditEventSchema) -> None:
        self.audit_events.append(event)

    def list_audit_events(self, msme_id: str, event_type: str | None = None) -> list[AuditEventSchema]:
        events = [event for event in self.audit_events if event.msme_id == msme_id]
        if event_type:
            events = [event for event in events if event.event_type == event_type]
        return events


store = DemoStore()
