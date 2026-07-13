# Copilot Markdown Streaming — LendSignal 360

## Overview
Credit Copilot responses are rendered as Markdown using react-markdown with remark-gfm. This provides structured, readable output for bank officers.

## Response Schema (CopilotChatResponse)
- answer_markdown: Markdown-formatted answer
- decision_support_only: true (enforced at schema level)
- cited_internal_inputs: list of evidence IDs, score IDs, etc.
- trace: agent node execution trace
- provider, model, prompt_version
- summary, recommended_human_action, assumptions, follow_up_questions

## Markdown Components
- Headings (h3, h4) for section organization
- Paragraphs with leading-6 spacing
- Unordered lists with cyan dot markers
- Ordered lists with decimal numbering
- Inline code and code blocks
- Blockquotes with amber left border
- Tables with header styling
- External links in new tabs
- Horizontal rules for section breaks

## Source Chips
- evidence: links open the evidence file in a new tab
- score_history / score_delta_event: displayed as non-clickable tags
- Other inputs: displayed as non-clickable tags

## Streaming
- Brief generation streams via SSE (Server-Sent Events)
- Each agent node (Data Quality, Credit Analyst, Prospect Assist, Risk Investigator, Lending Brief) shows status badges
- Final brief rendered as Markdown when complete

## Prompt Versioning
- Each response includes prompt_version field
- Prompts are versioned in the Groq provider adapter
