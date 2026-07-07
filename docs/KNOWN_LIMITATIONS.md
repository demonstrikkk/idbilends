# Known Limitations

LendSignal 360 is a demo-grade MSME credit intelligence workbench.

- Uses synthetic data only.
- Contains no real IDBI, private bank, customer, bureau, GST, Udyam, GeM, or Account Aggregator data.
- Uses in-memory storage by default, so data resets when the backend restarts.
- Has no production authentication or role-based authorization yet.
- Does not issue final lending approval or final rejection.
- Has no live AA, GST, Udyam, GeM, ULI, bureau, or core-banking integrations.
- Uses deterministic scoring rules, not a trained production credit model.
- Groq is optional and replaceable through the backend provider adapter.
- Credit Copilot is decision-support only and depends on sanitized internal context.
- Model and score history are current snapshots only unless persisted later.
- Rate limiting is documented but not implemented.
- Audit events are demo in-memory events until persistence is added.
- Document parsing and upload workflows are roadmap items, not current production features.
