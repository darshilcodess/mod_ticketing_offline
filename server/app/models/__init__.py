# Import all models here so Alembic can detect them during autogenerate.
# This also ensures they are registered on Base.metadata.
from app.models.user import User  # noqa: F401
from app.models.team import Team  # noqa: F401
from app.models.ticket import Ticket  # noqa: F401
from app.models.comment import Comment  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.document import TicketDocument  # noqa: F401
from app.models.document_content import (  # noqa: F401
    VoucherContent, OutboundDeliveryContent,
    VoucherVariableQtyContent, VoucherWithTitleContent,
    VoucherWithExplanationContent
)
