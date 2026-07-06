from collections import Counter
from random import Random

from app.db.repository import store
from app.schemas.common import DocumentAvailability, ScenarioLabel, Segment, utc_now
from app.schemas.msme import DocumentStatusSchema, FinancialSnapshotSchema, MSMEDetail, SeedResponse
from app.services.audit_service import create_audit_event
from app.services.prospect_service import generate_prospect_signals
from app.services.scoring_service import generate_score


def seed_demo_data(reset: bool = True, seed: int = 42, profile_count: int = 9, request_id: str | None = None) -> SeedResponse:
    if reset:
        store.reset()
    rng = Random(seed)
    profiles = _profiles(rng)[:profile_count]
    for profile in profiles:
        store.upsert_profile(profile)
    for profile in profiles:
        generate_score(profile.id, persist=True, include_trace=True)
        generate_prospect_signals(profile.id, persist=True)
    counts = Counter(profile.scenario_label.value for profile in profiles)
    audit = create_audit_event(
        "demo_seed_generated",
        None,
        {"seed": seed, "profile_count": len(profiles), "scenario_counts": dict(counts), "synthetic_only": True},
        request_id=request_id,
    )
    return SeedResponse(seeded=True, profile_count=len(profiles), scenario_counts=dict(counts), audit_event_id=audit.id, generated_at=utc_now())


def ensure_seeded() -> None:
    if not store.profiles:
        seed_demo_data()


def _doc(
    bank: DocumentAvailability = DocumentAvailability.available,
    gst: DocumentAvailability = DocumentAvailability.available,
    udyam: DocumentAvailability = DocumentAvailability.available,
    bureau: DocumentAvailability = DocumentAvailability.available,
    itr: DocumentAvailability = DocumentAvailability.available,
    gem: DocumentAvailability = DocumentAvailability.not_applicable,
    missing: list[str] | None = None,
    stale: list[str] | None = None,
) -> DocumentStatusSchema:
    return DocumentStatusSchema(bank_statement=bank, gst_returns=gst, udyam=udyam, bureau_report=bureau, itr=itr, gem_profile=gem, missing_documents=missing or [], stale_documents=stale or [])


def _financial(
    revenue: int,
    expenses: int,
    balance: int,
    volatility: float,
    growth3: float,
    growth6: float,
    emi: int,
    debt: int,
    b3: int,
    b6: int,
    gst: float,
    buyer: float,
    digital: float,
    delay: int,
    order: float | None,
    cash: float,
    spike: float,
) -> FinancialSnapshotSchema:
    return FinancialSnapshotSchema(
        snapshot_month="2026-06",
        monthly_revenue_avg=revenue,
        monthly_expense_avg=expenses,
        average_bank_balance=balance,
        cash_inflow_volatility=volatility,
        revenue_growth_3m=growth3,
        revenue_growth_6m=growth6,
        emi_obligation=emi,
        existing_debt=debt,
        bounce_count_3m=b3,
        bounce_count_6m=b6,
        gst_filing_regularity=gst,
        buyer_concentration=buyer,
        digital_payment_ratio=digital,
        gem_order_completion_rate=order,
        invoice_delay_avg_days=delay,
        cash_deposit_ratio=cash,
        revenue_spike_ratio=spike,
    )


def _profile(
    idx: int,
    name: str,
    segment: Segment,
    scenario: ScenarioLabel,
    city: str,
    state: str,
    vintage: int,
    employees: int,
    requested: int,
    financials: FinancialSnapshotSchema,
    documents: DocumentStatusSchema,
) -> MSMEDetail:
    return MSMEDetail(
        id=f"msme_{idx:03d}",
        business_name=name,
        segment=segment,
        scenario_label=scenario,
        city=city,
        state=state,
        business_vintage_months=vintage,
        employee_count=employees,
        requested_credit_amount=requested,
        financials=financials,
        documents=documents,
    )


def _profiles(rng: Random) -> list[MSMEDetail]:
    jitter = lambda value, spread: max(1, int(value + rng.randint(-spread, spread)))
    return [
        _profile(1, "Aarav Precision Tools", Segment.small_manufacturer, ScenarioLabel.healthy_growth, "Jaipur", "Rajasthan", 64, 24, 2200000, _financial(jitter(920000, 20000), 620000, 260000, 0.16, 0.09, 0.16, 85000, 760000, 0, 0, 0.94, 0.28, 0.78, 16, 0.93, 0.18, 1.12), _doc(gst=DocumentAvailability.partial, itr=DocumentAvailability.missing, missing=["itr"])),
        _profile(2, "Nirmal Kirana Mart", Segment.retail_shop, ScenarioLabel.stable_moderate, "Indore", "Madhya Pradesh", 88, 9, 800000, _financial(420000, 315000, 90000, 0.24, 0.03, 0.06, 48000, 350000, 0, 1, 0.86, 0.22, 0.58, 8, None, 0.32, 1.05), _doc(itr=DocumentAvailability.partial)),
        _profile(3, "PixelKart Supplies", Segment.digital_seller, ScenarioLabel.healthy_growth, "Pune", "Maharashtra", 42, 14, 1600000, _financial(710000, 490000, 190000, 0.18, 0.14, 0.22, 52000, 480000, 0, 0, 0.91, 0.34, 0.88, 14, 0.95, 0.12, 1.18), _doc(gem=DocumentAvailability.available)),
        _profile(4, "Sankalp GeM Office Needs", Segment.gem_like_seller, ScenarioLabel.healthy_growth, "Lucknow", "Uttar Pradesh", 54, 18, 2400000, _financial(980000, 705000, 310000, 0.19, 0.11, 0.19, 92000, 850000, 0, 1, 0.93, 0.36, 0.82, 19, 0.96, 0.16, 1.2), _doc(gst=DocumentAvailability.partial, gem=DocumentAvailability.available, itr=DocumentAvailability.missing, missing=["itr"])),
        _profile(5, "Pragati Design Services", Segment.services_firm, ScenarioLabel.document_gap, "Bengaluru", "Karnataka", 30, 11, 900000, _financial(520000, 390000, 70000, 0.28, 0.04, 0.09, 61000, 520000, 1, 2, 0.7, 0.42, 0.62, 31, None, 0.24, 1.1), _doc(bank=DocumentAvailability.partial, gst=DocumentAvailability.partial, bureau=DocumentAvailability.missing, itr=DocumentAvailability.missing, missing=["bureau_report", "itr"])),
        _profile(6, "Kaveri Trading Co", Segment.trader, ScenarioLabel.high_buyer_concentration, "Surat", "Gujarat", 72, 16, 1800000, _financial(760000, 590000, 115000, 0.31, 0.02, 0.05, 88000, 980000, 1, 2, 0.82, 0.68, 0.55, 38, None, 0.34, 1.08), _doc()),
        _profile(7, "Annapurna Foods", Segment.food_business, ScenarioLabel.seasonal_volatility, "Kochi", "Kerala", 50, 20, 1200000, _financial(610000, 505000, 85000, 0.42, -0.08, 0.02, 72000, 650000, 1, 2, 0.78, 0.44, 0.51, 29, None, 0.39, 1.25), _doc(gst=DocumentAvailability.partial)),
        _profile(8, "Metro Fabrication Works", Segment.small_manufacturer, ScenarioLabel.debt_overload, "Faridabad", "Haryana", 46, 21, 2000000, _financial(680000, 650000, 38000, 0.52, -0.18, -0.24, 245000, 2400000, 3, 5, 0.61, 0.57, 0.37, 64, None, 0.48, 1.06), _doc(gst=DocumentAvailability.partial, itr=DocumentAvailability.missing, missing=["itr"])),
        _profile(9, "Nova Wholesale Links", Segment.trader, ScenarioLabel.suspicious_spike, "Nagpur", "Maharashtra", 20, 8, 1500000, _financial(820000, 540000, 66000, 0.49, 0.74, 0.91, 78000, 500000, 1, 2, 0.66, 0.62, 0.29, 52, 0.62, 0.61, 2.15), _doc(bank=DocumentAvailability.partial, gst=DocumentAvailability.partial, bureau=DocumentAvailability.missing, itr=DocumentAvailability.missing, missing=["bureau_report", "itr"])),
    ]
