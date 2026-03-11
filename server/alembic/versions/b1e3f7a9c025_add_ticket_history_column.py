"""add ticket history column

Revision ID: b1e3f7a9c025
Revises: acf320e15e6a
Create Date: 2026-02-20 10:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'b1e3f7a9c025'
down_revision: Union[str, None] = 'acf320e15e6a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add history JSON column to tickets table."""
    op.add_column(
        'tickets',
        sa.Column('history', sa.JSON(), nullable=True, server_default='[]')
    )


def downgrade() -> None:
    """Remove history column from tickets table."""
    op.drop_column('tickets', 'history')
