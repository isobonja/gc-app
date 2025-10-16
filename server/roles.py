from enum import Enum

class Role(Enum):
    OWNER = "Owner"
    ADMIN = "Admin"
    EDITOR = "Editor"
    VIEWER = "Viewer"
    TEMPORARY = "Temporary"