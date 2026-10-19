from sqlalchemy import func, or_
from app.models.admin import AuditLog
from app.models.user import User


class AuditLogServiceError(Exception):
    """Base exception for audit log domain operations."""
    def __init__(self, message: str, status_code: int = 400, error: str = "Bad Request"):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error = error


class AuditLogService:
    """
    AuditLogService: Business logic for querying and filtering system audit trails (Module 9.10).
    """

    @classmethod
    def get_audit_logs(
        cls,
        caller: User | None,
        search: str = "",
        action_filter: str = "",
        page: int = 1,
        per_page: int = 20
    ) -> dict:
        """
        Real audit logs from PostgreSQL audit_logs table with search, filter, and pagination.
        """
        query = AuditLog.query
        if action_filter and action_filter != "all":
            query = query.filter_by(action=action_filter)

        if search:
            query = query.filter(
                or_(
                    func.lower(AuditLog.action).like(f"%{search}%"),
                    func.lower(AuditLog.entity_type).like(f"%{search}%")
                )
            )

        total = query.count()
        logs = query.order_by(AuditLog.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

        return {
            "logs": [
                {
                    "id": str(log.log_id),
                    "operator": log.actor.email if log.actor else "System",
                    "action": log.action,
                    "target": f"{log.entity_type or 'entity'}:{str(log.entity_id) if log.entity_id else ''}",
                    "details": str(log.details) if log.details else "",
                    "timestamp": log.created_at.strftime("%Y-%m-%d %H:%M:%S") if log.created_at else "",
                    "ip_address": log.ip_address or ""
                }
                for log in logs
            ],
            "total": total,
            "page": page,
            "per_page": per_page
        }
