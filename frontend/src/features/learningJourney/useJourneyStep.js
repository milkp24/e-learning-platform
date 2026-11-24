// =====================================================================
// useJourneyStep.js: ให้หน้าบอกขั้น Learning Journey ที่ละเอียดกว่า URL (ข้อ 26)
//
// แถบ Learning Journey อยู่ใน Layout (GuestLayout / StudentLayout) จึงแสดงทุกหน้า
// และเลื่อนไฮไลต์ตามหน้าที่เปิดอยู่เอง (คำนวณจาก URL)
// หน้าที่รู้ข้อมูลมากกว่า URL (เช่น ลงทะเบียนแล้ว, บทเรียนมีกิจกรรม) เรียก useJourneyStep(ขั้น)
// ค่าจะถูกล้างทันทีเมื่อออกจากหน้านั้น จึงไม่ค้างไปหน้าถัดไป
// =====================================================================
import { useEffect } from "react";
import { create } from "zustand";

export const useJourneyOverrideStore = create((set) => ({
  step: null,
  setStep: (step) => set({ step }),
}));

export function useJourneyStep(step) {
  const setStep = useJourneyOverrideStore((s) => s.setStep);
  useEffect(() => {
    setStep(step ?? null);
    return () => setStep(null);
  }, [step, setStep]);
}

export default useJourneyStep;
