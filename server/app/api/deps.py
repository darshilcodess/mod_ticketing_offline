# This file is kept for backward compatibility.
# All dependency logic has been moved to `app/deps/` package.
# Re-export everything from the new location.
from app.deps import get_db, get_current_user, get_current_active_user, reusable_oauth2

__all__ = [
    "get_db",
    "get_current_user",
    "get_current_active_user",
    "reusable_oauth2",
]
