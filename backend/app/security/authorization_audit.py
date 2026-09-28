from typing import Any, Optional
from app.models.user import User


def audit_object_ownership(resource_owner_id: Optional[int], current_user_id: Optional[int]) -> bool:
    """
    Verifies object-level authorization predicate.
    Returns True only if resource_owner_id matches current_user_id.
    """
    if resource_owner_id is None or current_user_id is None:
        return False
    return int(resource_owner_id) == int(current_user_id)


def audit_rbac_access(user: Optional[User], required_role: str = "admin") -> bool:
    """
    Verifies role-based access control predicate.
    """
    if not user:
        return False

    if required_role == "admin":
        return bool(user.is_admin)

    return True
