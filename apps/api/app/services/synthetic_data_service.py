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
    profiles = _profiles(rng)
    if profile_count > len(profiles):
        profiles.extend(_scaled_profiles(rng, len(profiles) + 1, profile_count))
    profiles = profiles[:profile_count]
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
    regions = {
        "Rajasthan": "North",
        "Madhya Pradesh": "Central",
        "Maharashtra": "West",
        "Uttar Pradesh": "North",
        "Karnataka": "South",
        "Gujarat": "West",
        "Kerala": "South",
        "Haryana": "North",
    }
    zones = ["Zone A", "Zone B", "Zone C", "Zone D"]
    return MSMEDetail(
        id=f"msme_{idx:03d}",
        business_name=name,
        segment=segment,
        scenario_label=scenario,
        city=city,
        state=state,
        region=regions.get(state, "West"),
        zone=zones[(idx - 1) % len(zones)],
        branch=f"{city} MSME Branch",
        relationship_manager=["Arjun Singh", "Meera Rao", "Vikram Patel", "Nisha Menon"][(idx - 1) % 4],
        sector_tags=_sector_tags(segment, scenario),
        monitoring_status="normal",
        last_updated=utc_now(),
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


def _scaled_profiles(rng: Random, start_idx: int, profile_count: int) -> list[MSMEDetail]:
    cities = [
        ("Ahmedabad", "Gujarat"),
        ("Chennai", "Tamil Nadu"),
        ("Hyderabad", "Telangana"),
        ("Kolkata", "West Bengal"),
        ("Delhi", "Delhi"),
        ("Mumbai", "Maharashtra"),
        ("Coimbatore", "Tamil Nadu"),
        ("Bhopal", "Madhya Pradesh"),
        ("Mysuru", "Karnataka"),
        ("Ludhiana", "Punjab"),
        ("Noida", "Uttar Pradesh"),
        ("Vadodara", "Gujarat"),
    ]
    segment_weights = [
        (Segment.retail_shop, 22),
        (Segment.small_manufacturer, 24),
        (Segment.services_firm, 16),
        (Segment.trader, 16),
        (Segment.food_business, 12),
        (Segment.digital_seller, 7),
        (Segment.gem_like_seller, 3),
    ]
    scenario_weights = [
        (ScenarioLabel.healthy_growth, 24),
        (ScenarioLabel.stable_moderate, 30),
        (ScenarioLabel.seasonal_volatility, 12),
        (ScenarioLabel.cashflow_stress, 10),
        (ScenarioLabel.high_buyer_concentration, 9),
        (ScenarioLabel.document_gap, 8),
        (ScenarioLabel.debt_overload, 5),
        (ScenarioLabel.suspicious_spike, 2),
    ]
    prefixes = ["Shakti", "Bharat", "Unity", "Crescent", "Savera", "Summit", "Lotus", "Prime", "Udaan", "Triveni"]
    suffixes = {
        Segment.retail_shop: "Retail Mart",
        Segment.small_manufacturer: "Engineering Works",
        Segment.services_firm: "Business Services",
        Segment.trader: "Trading Co",
        Segment.food_business: "Foods",
        Segment.digital_seller: "Digital Supplies",
        Segment.gem_like_seller: "GeM Office Needs",
    }
    profiles: list[MSMEDetail] = []
    for idx in range(start_idx, profile_count + 1):
        segment = _weighted_choice(rng, segment_weights)
        scenario = _weighted_choice(rng, scenario_weights)
        city, state = cities[(idx + rng.randint(0, len(cities) - 1)) % len(cities)]
        revenue = rng.randint(260000, 1250000)
        expense_ratio = rng.uniform(0.58, 0.92)
        volatility = rng.uniform(0.12, 0.38)
        growth6 = rng.uniform(-0.08, 0.24)
        buyer = rng.uniform(0.18, 0.48)
        delay = rng.randint(8, 36)
        bounce6 = rng.choice([0, 0, 0, 1, 1, 2])
        gst = rng.uniform(0.76, 0.96)
        if scenario == ScenarioLabel.cashflow_stress:
            expense_ratio = rng.uniform(0.9, 1.03)
            volatility = rng.uniform(0.36, 0.58)
        elif scenario == ScenarioLabel.debt_overload:
            bounce6 = rng.randint(3, 5)
        elif scenario == ScenarioLabel.high_buyer_concentration:
            buyer = rng.uniform(0.56, 0.78)
            delay = rng.randint(35, 65)
        elif scenario == ScenarioLabel.seasonal_volatility:
            volatility = rng.uniform(0.38, 0.55)
            growth6 = rng.uniform(-0.18, 0.08)
        elif scenario == ScenarioLabel.suspicious_spike:
            growth6 = rng.uniform(0.72, 0.98)
            gst = rng.uniform(0.58, 0.72)
        elif scenario == ScenarioLabel.healthy_growth:
            expense_ratio = rng.uniform(0.58, 0.74)
            growth6 = rng.uniform(0.08, 0.24)
            bounce6 = 0
        bank_status = DocumentAvailability.available
        gst_status = DocumentAvailability.available if gst >= 0.82 else DocumentAvailability.partial
        bureau_status = DocumentAvailability.available
        itr_status = DocumentAvailability.available
        missing: list[str] = []
        if scenario == ScenarioLabel.document_gap:
            bank_status = rng.choice([DocumentAvailability.partial, DocumentAvailability.available])
            bureau_status = DocumentAvailability.missing
            itr_status = DocumentAvailability.missing
            missing = ["bureau_report", "itr"]
        profiles.append(
            _profile(
                idx,
                f"{prefixes[idx % len(prefixes)]} {suffixes[segment]} {idx:04d}",
                segment,
                scenario,
                city,
                state,
                rng.randint(18, 120),
                rng.randint(4, 48),
                rng.randint(400000, 2800000),
                _financial(
                    revenue,
                    int(revenue * expense_ratio),
                    rng.randint(35000, 360000),
                    round(volatility, 2),
                    round(growth6 + rng.uniform(-0.08, 0.08), 2),
                    round(growth6, 2),
                    rng.randint(25000, 180000),
                    rng.randint(150000, 2600000),
                    min(bounce6, 2),
                    bounce6,
                    round(gst, 2),
                    round(buyer, 2),
                    round(rng.uniform(0.35, 0.92), 2),
                    delay,
                    round(rng.uniform(0.76, 0.98), 2) if segment in {Segment.digital_seller, Segment.gem_like_seller} else None,
                    round(rng.uniform(0.12, 0.56), 2),
                    round(rng.uniform(1.0, 2.25), 2) if scenario == ScenarioLabel.suspicious_spike else round(rng.uniform(0.95, 1.28), 2),
                ),
                _doc(bank=bank_status, gst=gst_status, bureau=bureau_status, itr=itr_status, gem=DocumentAvailability.available if segment == Segment.gem_like_seller else DocumentAvailability.not_applicable, missing=missing),
            )
        )
    return profiles


def _weighted_choice(rng: Random, weighted_items: list[tuple[object, int]]):
    total = sum(weight for _item, weight in weighted_items)
    pick = rng.randint(1, total)
    running = 0
    for item, weight in weighted_items:
        running += weight
        if pick <= running:
            return item
    return weighted_items[-1][0]


def _sector_tags(segment: Segment, scenario: ScenarioLabel) -> list[str]:
    tags = {
        Segment.retail_shop: ["retail", "kirana", "local_trade"],
        Segment.small_manufacturer: ["manufacturing", "input_cost_sensitive"],
        Segment.services_firm: ["services", "receivables"],
        Segment.trader: ["trading", "buyer_concentration"],
        Segment.food_business: ["food", "seasonal_demand"],
        Segment.digital_seller: ["digital_seller", "platform_sales"],
        Segment.gem_like_seller: ["gem_like", "public_procurement"],
    }[segment]
    if scenario in {ScenarioLabel.high_buyer_concentration, ScenarioLabel.suspicious_spike, ScenarioLabel.debt_overload}:
        tags.append(scenario.value)
    return tags
