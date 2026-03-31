# Design Guide

This document captures the current design direction for Scrum Poker Pro so future changes stay visually and behaviorally consistent.

## Experience Goals

- Feel professional and lightweight
- Be easy to scan during live estimation sessions
- Prioritize clarity over decorative visuals
- Support both desktop and mobile without layout friction

## Current UI Direction

- Neutral, enterprise-style palette
- Card-based sections with clear grouping
- Soft motion and transitions
- Dark mode support
- Clean typography with restrained emphasis

The app should feel reliable and polished, not experimental or overly playful.

## Interaction Style

- Use clear calls to action
- Keep forms straightforward
- Surface room state clearly:
  - current feature
  - vote progress
  - reveal state
  - saved decisions
- Preserve the current owner-led estimation workflow

## Component Guidance

Prefer existing primitives from `client/src/components/ui`:

- `Card`
- `Typography`
- `Button`
- `Input`
- `Select`
- `LoadingSpinner`
- `EmptyState`

When adding new UI, build from these first before creating new primitives.

## Motion Guidance

- Keep animations subtle
- Favor quick fade/slide transitions
- Avoid aggressive bounce or novelty effects
- New animations should match the current Framer Motion usage patterns already in the app

## Layout Guidance

- Pages should remain centered and readable
- Avoid dense dashboards unless necessary
- Use section spacing to separate states and results
- Tables are appropriate for session history or analytics summaries

## What To Preserve

- Room flow: create, join, vote, reveal, decide, continue
- Participant visibility during active voting
- Session feature history at the bottom of the room view
- Clean separation between voting state and results state

## When Extending The Design

Prefer:

- additive improvements
- clearer information architecture
- stronger empty states
- better mobile handling
- refined statistics and summaries

Avoid:

- replacing the current design language wholesale
- introducing a flashy marketing-site aesthetic into the room flow
- inconsistent typography or button styles
