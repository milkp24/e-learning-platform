# =====================================================================
# quiz_service.py: ไฟล์นี้คงไว้เพื่อให้ import เดิมยังใช้ได้
#   from app.services.quiz_service import submit_quiz_attempt   (ยังใช้ได้)
# โค้ดจริงย้ายไปอยู่ที่แพ็กเกจ app/services/quiz/ แล้ว ถ้าเขียนโค้ดใหม่ให้ import จากที่นั่น
# =====================================================================

from app.services.quiz import *  # noqa: F401,F403
from app.services.quiz import __all__  # noqa: F401
