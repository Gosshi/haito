# Project Structure

## Organization Philosophy

Keep samples small and self-contained under `src/`, prioritizing clarity over deep layering. Each sample stands alone and can be run directly.

## Directory Patterns

### Sample Apps
**Location**: `/src/samples/<sample_name>/`  
**Purpose**: Self-contained demo services with their own entrypoint and dependencies.  
**Example**: `/src/samples/time_api/`

### Sample Entrypoint
**Location**: `/src/samples/<sample_name>/main.py`  
**Purpose**: Defines the FastAPI app, routes, and response models.  
**Example**: `/src/samples/time_api/main.py`

### Sample Requirements
**Location**: `/src/samples/<sample_name>/requirements.txt`  
**Purpose**: Sample-specific dependencies to keep demos portable.  
**Example**: `/src/samples/time_api/requirements.txt`

## Naming Conventions

- **Files**: `snake_case.py`
- **Classes / Models**: `PascalCase`
- **Functions**: `snake_case`

## Import Organization

```python
# Standard library
from datetime import datetime, timezone, timedelta

# Third-party
from fastapi import FastAPI
from pydantic import BaseModel
```

**Path Aliases**:
- None defined

## Code Organization Principles

- Prefer module-level constants for shared configuration (e.g., timezones).
- Keep endpoint handlers small and pure (no hidden state).
- Define public API schemas explicitly with Pydantic models.

---
_Document patterns, not file trees. New files following patterns shouldn't require updates_
