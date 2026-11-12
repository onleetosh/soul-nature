from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class CheckoutAttempt(Base):
    __tablename__ = "checkout_attempts"

    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    stripe_session_id: Mapped[str | None] = mapped_column(
        String(255), unique=True, nullable=True
    )
