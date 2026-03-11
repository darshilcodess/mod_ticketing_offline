import os
import sys
from logging.config import fileConfig
from pathlib import Path

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# ── Make sure `app` package is importable from here ──────────────────────────
# Adds the `server/` directory (parent of `alembic/`) to sys.path so that
# `from app.xxx import yyy` works without installing the package.
BASE_DIR = Path(__file__).resolve().parent.parent  # server/
sys.path.insert(0, str(BASE_DIR))

# ── Load .env file ────────────────────────────────────────────────────────────
# Look for .env in server/ first, then one level up (project root).
from dotenv import load_dotenv  # noqa: E402

_env_file = BASE_DIR / ".env"
if not _env_file.exists():
    _env_file = BASE_DIR.parent / ".env"
load_dotenv(dotenv_path=_env_file, override=True)

# ── Alembic Config object ─────────────────────────────────────────────────────
config = context.config

# ── Logging ───────────────────────────────────────────────────────────────────
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ── Import all models so Alembic can detect them for autogenerate ─────────────
from app.core.database import Base  # noqa: E402
from app import models  # noqa: F401

# ── Override sqlalchemy.url with DATABASE_URL env var ────────────────────────
database_url = os.environ.get("DATABASE_URL")
if database_url:
    config.set_main_option("sqlalchemy.url", database_url)

# Set the target metadata for autogenerate
target_metadata = Base.metadata


# ── Offline migrations ────────────────────────────────────────────────────────
def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    Configures the context with just a URL and not an Engine.
    Calls to context.execute() emit SQL to the script output.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


# ── Online migrations ─────────────────────────────────────────────────────────
def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    Creates an Engine and associates a connection with the context.
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
