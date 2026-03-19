# DECISIONS.md - Server-Side Technical Choices

## 1. Express-Validator for Input Control

We use middleware-based validation to keep controllers clean and ensure data integrity before reaching the logic layer.

## 2. Response Handler Utility

Unified `successResponse` and `errorResponse` helpers ensure consistent API behavior across all modules.

## 3. PDF Generation with PDFKit

Chosen for its fine-grained control over invoice layout, though it requires more manual positioning than HTML-to-PDF tools.
