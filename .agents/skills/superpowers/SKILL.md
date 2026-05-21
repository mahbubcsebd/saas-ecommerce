---
name: superpowers
description: Detailed reference guide for Jesse Vincent's Superpowers agentic methodology. Enforces TDD, structured planning, subagent execution, and systematic debugging for high-quality engineering.
---

# superpowers - Agentic Engineering Methodology

Use this skill to guide AI agents to write code systematically, adhering to professional software engineering standards.

## 1. Test-Driven Development (TDD)
- **Red-Green-Refactor**: Always write a failing test first, see it fail, write the minimal code to pass it, and then refactor.
- **Evidence-Based Success**: Never declare a task complete without executing and passing verification tests.

## 2. Structured Planning
- Before making code changes, always draft an implementation plan (`implementation_plan.md`) and a step-by-step TODO list (`task.md`).
- Focus on YAGNI (You Aren't Gonna Need It) and DRY (Don't Repeat Yourself).

## 3. Systematic Debugging
When a bug occurs:
1. **Reproduce**: Write a test to reproduce the bug.
2. **Isolate**: Trace the execution flow to find the root cause.
3. **Fix**: Implement the minimal fix.
4. **Verify**: Ensure the test passes and no regressions occur.

## 4. Component Isolation
- Work on small, focused components.
- Use isolated branches or worktrees where appropriate to prevent configuration noise.
