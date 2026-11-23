import { create } from "zustand";

// ======================================================
// useToastStore — แถบแจ้งผลการทำงานมุมขวาบน ใช้ร่วมกันทุกหน้า ทุกบทบาท
// แสดงผ่าน <GlobalToaster /> ที่วางไว้ใน App.jsx
//
//   import { notify } from "../store/useToastStore";
//   notify.success("บันทึกเรียบร้อยแล้ว");
//   notify.error(err.response?.data?.message || "บันทึกไม่สำเร็จ");
//   const id = notify.loading("กำลังอัปโหลดรูป...");
//   notify.update(id, { type: "success", text: "อัปโหลดรูปสำเร็จ" });
// ======================================================

const DURATION = { success: 3500, info: 3500, error: 6000, loading: null };
const MAX_TOASTS = 4;
let nextId = 1;
const timers = new Map();

const useToastStore = create((set, get) => ({
  toasts: [],

  dismiss: (id) => {
    clearTimeout(timers.get(id));
    timers.delete(id);
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },

  _schedule: (id, type) => {
    clearTimeout(timers.get(id));
    const ms = DURATION[type];
    if (ms) timers.set(id, setTimeout(() => get().dismiss(id), ms));
  },

  show: (type, text) => {
    if (!text) return null;
    const id = nextId++;
    const toasts = [...get().toasts, { id, type, text }];
    // เก็บแค่ไม่กี่อันล่าสุด กันแถบล้นจอเมื่อกดหลายครั้งติดกัน
    toasts.slice(0, Math.max(0, toasts.length - MAX_TOASTS)).forEach((t) => get().dismiss(t.id));
    set({ toasts: toasts.slice(-MAX_TOASTS) });
    get()._schedule(id, type);
    return id;
  },

  update: (id, { type, text }) => {
    const exists = get().toasts.some((t) => t.id === id);
    if (!exists) return get().show(type, text);
    set({
      toasts: get().toasts.map((t) => (t.id === id ? { ...t, type: type || t.type, text: text || t.text } : t)),
    });
    get()._schedule(id, type);
    return id;
  },
}));

export const notify = {
  success: (text) => useToastStore.getState().show("success", text),
  error: (text) => useToastStore.getState().show("error", text),
  info: (text) => useToastStore.getState().show("info", text),
  loading: (text) => useToastStore.getState().show("loading", text),
  update: (id, next) => useToastStore.getState().update(id, next),
  dismiss: (id) => useToastStore.getState().dismiss(id),
  /** ใช้แทน showToast(type, text) เดิมของแต่ละหน้า */
  show: (type, text) => useToastStore.getState().show(type === "error" ? "error" : type || "success", text),
};

export default useToastStore;
