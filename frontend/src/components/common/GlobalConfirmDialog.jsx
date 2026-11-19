import Modal from "./Modal/Modal";
import Button from "./Button/Button";
import useConfirmStore from "../../store/useConfirmStore";

/**
 * GlobalConfirmDialog — แสดงกล่องยืนยันจาก useConfirmStore (ติดตั้งครั้งเดียวใน App)
 * แสดงชื่อสิ่งที่จะลบให้เห็นชัด เพื่อป้องกันการลบผิดรายการ (ข้อ 38)
 */
function GlobalConfirmDialog() {
  const { isOpen, title, message, itemName, confirmText, variant, close } = useConfirmStore();

  return (
    <Modal isOpen={isOpen} onClose={() => close(false)} title={title} size="sm">
      <div className="space-y-5">
        {itemName && (
          <div className="space-y-1">
            <p className="text-xs sm:text-sm text-[#6B7773]">คุณแน่ใจหรือไม่ว่าต้องการลบ</p>
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-bold text-rose-800 break-words">
              {itemName}
            </p>
          </div>
        )}
        {message && <p className="text-xs sm:text-sm text-[#6B7773] leading-relaxed">{message}</p>}

        <div className="flex items-center justify-end gap-2.5 pt-1">
          <Button variant="ghost" size="sm" onClick={() => close(false)}>
            ยกเลิก
          </Button>
          <Button variant={variant} size="sm" onClick={() => close(true)}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default GlobalConfirmDialog;
