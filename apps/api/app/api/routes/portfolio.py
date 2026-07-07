from fastapi import APIRouter, Query

from app.schemas.portfolio import (
    AlertsResponse,
    ModelMonitorSnapshotResponse,
    PortfolioCasesResponse,
    PortfolioInsightsResponse,
    PortfolioSummaryResponse,
    WatchlistResponse,
)
from app.services.portfolio_service import (
    get_alerts,
    get_model_monitor_snapshot,
    get_portfolio_cases,
    get_portfolio_insights,
    get_portfolio_summary,
    get_watchlist,
)

portfolio_router = APIRouter(prefix="/portfolio", tags=["portfolio"])
watchlist_router = APIRouter(prefix="/watchlist", tags=["watchlist"])
alerts_router = APIRouter(prefix="/alerts", tags=["alerts"])
insights_router = APIRouter(prefix="/insights", tags=["insights"])
model_monitor_router = APIRouter(prefix="/model-monitor", tags=["model-monitor"])


@portfolio_router.get("/cases", response_model=PortfolioCasesResponse)
def portfolio_cases(
    limit: int = Query(default=100, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    sort: str = "prospect_score_desc",
    risk_tier: str | None = None,
    segment: str | None = None,
    query: str | None = None,
    city: str | None = None,
    zone: str | None = None,
    branch: str | None = None,
    scenario: str | None = None,
) -> PortfolioCasesResponse:
    return get_portfolio_cases(limit=limit, offset=offset, sort=sort, risk_tier=risk_tier, segment=segment, query=query, city=city, zone=zone, branch=branch, scenario=scenario)


@portfolio_router.get("/summary", response_model=PortfolioSummaryResponse)
def portfolio_summary() -> PortfolioSummaryResponse:
    return get_portfolio_summary()


@watchlist_router.get("", response_model=WatchlistResponse)
def watchlist() -> WatchlistResponse:
    return get_watchlist()


@alerts_router.get("", response_model=AlertsResponse)
def alerts() -> AlertsResponse:
    return get_alerts()


@insights_router.get("/portfolio", response_model=PortfolioInsightsResponse)
def portfolio_insights() -> PortfolioInsightsResponse:
    return get_portfolio_insights()


@model_monitor_router.get("/snapshot", response_model=ModelMonitorSnapshotResponse)
def model_monitor_snapshot() -> ModelMonitorSnapshotResponse:
    return get_model_monitor_snapshot()
