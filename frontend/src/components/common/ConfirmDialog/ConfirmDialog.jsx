import Modal from "../Modal";
import Button from "../Button";

// ======================================================
// ConfirmDialog Component (กล่องยืนยันการทำรายการ)
// ======================================================
// ใช้สำหรับยืนยัน Action สำคัญ เช่น ลบข้อมูล, เพิกถอนสิทธิ์, ปรับสถานะ

function ConfirmDialog({
  isOpen = false,
  onClose,
  onConfirm,
  title = "ยืนยันการทำรายการ",
  message = "คุณแน่ใจหรือไม่ว่าต้องการดำเนินการนี้ การกระทำนี้อาจไม่สามารถย้อนกลับได้",
  confirmText = "ยืนยัน",
  cancelText = "ยกเลิก",
  variant = "danger",
  loading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? undefined : onClose}
      title={title}
      size="sm"
      showClose={!loading}
    >
      <div className="space-y-6">
        <p className="text-xs sm:text-sm text-[#6B7773] leading-relaxed">
          {message}
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>

          <Button
            variant={variant}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
