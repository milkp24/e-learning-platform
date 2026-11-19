import { create } from "zustand";

// ======================================================
// useConfirmStore — กล่องยืนยันกลางของระบบ (ข้อ 38)
// ใช้แทน window.confirm เพื่อให้หน้าตาเหมือนกันทุกหน้า และระบุชื่อสิ่งที่จะลบ
//
//   import { confirmDelete } from "../store/useConfirmStore";
//   if (!(await confirmDelete({ itemType: "บทเรียน", itemName: lesson.title }))) return;
// ======================================================

const useConfirmStore = create((set, get) => ({
  isOpen: false,
  title: "",
  message: "",
  itemName: "",
  confirmText: "ยืนยัน",
  variant: "danger",
  resolver: null,

  open: (options) =>
    new Promise((resolve) => {
      // ถ้ามีกล่องค้างอยู่ ให้ถือว่ายกเลิกกล่องเดิม
      get().resolver?.(false);
      set({
        isOpen: true,
        title: options.title || "ยืนยันการทำรายการ",
        message: options.message || "",
        itemName: options.itemName || "",
        confirmText: options.confirmText || "ยืนยัน",
        variant: options.variant || "danger",
        resolver: resolve,
      });
    }),

  close: (result) => {
    get().resolver?.(result);
    set({ isOpen: false, resolver: null });
  },
}));

/** เปิดกล่องยืนยันทั่วไป คืนค่า Promise<boolean> */
export const confirmAction = (options) => useConfirmStore.getState().open(options);

/**
 * เปิดกล่องยืนยันการลบ โดยระบุประเภทและชื่อสิ่งที่จะลบ
 * @param {{ itemType: string, itemName?: string, detail?: string, confirmText?: string }} options
 */
export const confirmDelete = ({ itemType, itemName, detail, confirmText }) =>
  confirmAction({
    title: `ยืนยันการลบ${itemType}`,
    itemName,
    message: `${itemName ? "" : `คุณแน่ใจหรือไม่ว่าต้องการลบ${itemType}นี้? `}${detail || "การลบไม่สามารถย้อนกลับได้"}`,
    confirmText: confirmText || `ลบ${itemType}`,
  });

export default useConfirmStore;
