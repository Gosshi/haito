# Technology Stack

## Architecture

Small, stateless HTTP JSON API built with FastAPI. Each sample is self-contained and avoids external services or databases.

## Core Technologies

- **Language**: Python 3.9+
- **Framework**: FastAPI
- **Runtime**: Uvicorn (ASGI server)

## Key Libraries

- **Pydantic**: Response schemas and type-validated models.

## Development Standards

### Type Safety
- Type hints on endpoint functions.
- Pydantic models define public response shapes.

### Code Quality
- No repo-wide linting/formatting standard defined yet.

### Testing
- No test framework configured yet.

## Development Environment

### Required Tools
- Python 3.9+
- Dependency install via `requirements.txt` for samples (project uses a minimal `pyproject.toml`).

### Common Commands
```bash
# Dev: python src/samples/time_api/main.py
# Run (alt): uvicorn src.samples.time_api.main:app --reload
```

## Key Technical Decisions

- Keep sample services single-file for readability.
- Use explicit timezones (UTC/JST) and formatted strings for predictable API output.

---
_Document standards and patterns, not every dependency_
