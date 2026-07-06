# LendSignal 360 — Scoring Design

## 1. Purpose

The Financial Health Score is a deterministic, explainable 0–100 decision-support score for synthetic MSME lending analysis.

It is not a final bank credit model and must not be presented as one.

## 2. Score summary

```txt
Total score: 100
Risk tier: derived from score
Data confidence: separate 0-100 quality score
Suggested credit range: derived from revenue, balance, EMI burden, risk tier, and confidence
```

## 3. Risk tier mapping

| Score | Tier | Meaning |
|---:|---|---|
| 85–100 | very_low | Strong profile, standard verification still required |
| 70–84 | moderate_low | Generally healthy, may require conditions |
| 55–69 | moderate | Usable but needs human review |
| 40–54 | elevated | High caution, reduced limit or rework |
| 0–39 | high | Not recommended without rework/verification |

## 4. Component scoring

### 4.1 Cashflow strength — 25 points

Signals:

- monthly revenue average
- monthly expense average
- average bank balance
- cash inflow volatility

Suggested logic:

| Condition | Points |
|---|---:|
| revenue positive and expense ratio < 75% | +8 |
| average bank balance >= 20% monthly revenue | +6 |
| cashflow volatility < 0.20 | +6 |
| cashflow volatility 0.20–0.35 | +3 |
| monthly revenue > 5x EMI obligation | +5 |

Negative flags:

- expense ratio > 90%
- volatility > 0.45
- average balance very low

### 4.2 Growth and resilience — 15 points

Signals:

- revenue growth 3m
- revenue growth 6m
- business vintage
- segment stability

Suggested logic:

| Condition | Points |
|---|---:|
| 6m growth between 5% and 25% | +6 |
| 3m growth positive but not extreme | +4 |
| vintage > 36 months | +3 |
| stable segment scenario | +2 |

Negative flags:

- sudden growth > 70% without supporting order/payment signal
- declining revenue > 20%
- very new business with large request

### 4.3 Repayment stress — 20 points

Signals:

- EMI obligation
- existing debt
- EMI-to-revenue ratio
- bounce counts

Suggested logic:

| Condition | Points |
|---|---:|
| EMI/revenue < 12% | +8 |
| EMI/revenue 12–22% | +4 |
| bounce_count_6m = 0 | +6 |
| bounce_count_6m 1–2 | +3 |
| existing debt/revenue manageable | +6 |

Negative flags:

- EMI/revenue > 30%
- bounce_count_6m > 3
- debt overload

### 4.4 Business concentration and collections — 15 points

Signals:

- buyer concentration
- invoice delay
- order completion rate

Suggested logic:

| Condition | Points |
|---|---:|
| buyer concentration < 30% | +5 |
| buyer concentration 30–50% | +2 |
| invoice delay < 20 days | +4 |
| invoice delay 20–40 days | +2 |
| order completion > 90% | +6 |
| order completion 75–90% | +3 |

Negative flags:

- buyer concentration > 60%
- invoice delay > 60 days
- order completion < 70%

### 4.5 Compliance/data discipline — 15 points

Signals:

- GST-like filing regularity
- document completeness
- digital payment ratio
- bank statement availability

Suggested logic:

| Condition | Points |
|---|---:|
| GST-like regularity > 0.9 | +5 |
| GST-like regularity 0.75–0.9 | +3 |
| bank statement available | +4 |
| bureau-like report available | +2 |
| Udyam-like data available | +2 |
| digital payment ratio > 0.65 | +2 |

Negative flags:

- missing bank statement
- GST-like filing regularity < 0.6
- key documents stale/missing

### 4.6 Fraud/suspicious pattern guardrail — 10 points

Signals:

- revenue spike ratio
- cash deposit ratio
- mismatch between growth and payment/order signals
- high volatility with missing documents

Suggested logic:

| Condition | Points |
|---|---:|
| no suspicious spike | +4 |
| low cash deposit ratio | +3 |
| growth supported by digital/order signal | +3 |

Negative flags:

- revenue spike > 1.8x and no order support
- cash deposit ratio unusually high
- missing documents plus extreme growth
- high volatility plus low digital payment ratio

## 5. Data confidence score

Data confidence is separate from health score.

Start at 100.

Penalties:

| Issue | Penalty |
|---|---:|
| bank statement missing | -25 |
| bank statement partial/stale | -12 |
| GST-like data missing | -18 |
| GST-like data partial | -8 |
| bureau-like report missing | -10 |
| Udyam-like data missing | -6 |
| ITR-like data missing | -5 |
| suspicious spike | -10 |
| conflicting signals | -8 |
| latest data older than 3 months | -12 |

Clamp between 0 and 100.

## 6. Recommendation logic

| Condition | Recommendation |
|---|---|
| data_confidence < 50 | insufficient_data |
| score >= 70 and confidence >= 75 | consider_with_conditions |
| score 55–69 and confidence >= 65 | review_required |
| score 40–54 | consider_lower_limit |
| score < 40 | not_recommended_without_rework |
| suspicious spike and confidence < 70 | review_required |

Never return `approved` as a final decision.

## 7. Suggested credit range

Base suggested max:

```txt
base_capacity = min(
  monthly_revenue_avg * 2.0,
  average_bank_balance * 6.0,
  monthly_revenue_avg * max(0.5, 1.5 - emi_to_revenue_ratio)
)
```

Risk multipliers:

| Risk tier | Multiplier |
|---|---:|
| very_low | 1.00 |
| moderate_low | 0.85 |
| moderate | 0.65 |
| elevated | 0.40 |
| high | 0.20 |

Confidence multipliers:

| Confidence | Multiplier |
|---|---:|
| >= 85 | 1.00 |
| 70–84 | 0.85 |
| 50–69 | 0.60 |
| < 50 | 0.30 |

Suggested max:

```txt
suggested_credit_max = min(requested_credit_amount, base_capacity * risk_multiplier * confidence_multiplier)
```

Suggested min:

```txt
suggested_credit_min = suggested_credit_max * 0.75
```

Round to nearest ₹50,000 for display.

## 8. Reason code generation

Every score must include at least:

- 2 positive factors, if available
- 2 negative factors or warnings, if available
- source fields
- impact points
- evidence text

Reason code categories:

```txt
cashflow_strength
growth_resilience
repayment_stress
business_concentration
compliance_discipline
suspicious_pattern
data_quality
```

## 9. Early warning triggers

Generate triggers for:

| Trigger | Condition |
|---|---|
| revenue_drop_watch | revenue growth 3m < -0.15 |
| buyer_concentration_watch | buyer concentration > 0.5 |
| bounce_behavior_watch | bounce_count_3m >= 2 |
| gst_delay_watch | gst_filing_regularity < 0.75 |
| debt_stress_watch | EMI/revenue > 0.25 |
| suspicious_spike_review | revenue_spike_ratio > 1.8 |
| invoice_delay_watch | invoice_delay_avg_days > 45 |

## 10. Scoring trace format

```json
{
  "component": "cashflow_strength",
  "max_points": 25,
  "awarded_points": 20,
  "source_fields": ["monthly_revenue_avg", "cash_inflow_volatility"],
  "notes": "Low volatility and healthy average balance."
}
```

## 11. Required tests

1. Score always 0–100.
2. Very healthy profile scores higher than stressed profile.
3. Missing bank statement reduces confidence significantly.
4. Suspicious spike creates warning.
5. Suggested max never exceeds requested amount.
6. High-risk profile gets lower credit range than healthy profile.
7. Data confidence does not directly overwrite score.
8. Reason codes include source fields.
9. Early warning triggers fire on expected conditions.
10. Recommendation never returns final approval language.
