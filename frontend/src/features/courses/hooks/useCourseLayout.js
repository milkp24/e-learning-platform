import { useCallback } from "react";
import useUrlParam from "../../../hooks/useUrlParam";

// ======================================================
// useCourseLayout — มุมมองรายการคอร์ส "cards" | "table"
// - เก็บใน URL (?layout=table) เพื่อให้ย้อนกลับ / รีเฟรช แล้วยังเป็นมุมมองเดิม
// - จำค่าที่เลือกล่าสุดไว้ในเบราว์เซอร์ เพื่อให้ทุกหน้าคอร์สเปิดมาด้วยมุมมองเดียวกัน
// ======================================================

const STORAGE_KEY = "courseLayout";
const LAYOUTS = ["cards", "table"];

function readStored() {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return LAYOUTS.includes(v) ? v : "cards";
  } catch {
    return "cards";
  }
}

export default function useCourseLayout() {
  const [fromUrl, setUrlLayout] = useUrlParam("layout", "");
  const layout = LAYOUTS.includes(fromUrl) ? fromUrl : readStored();

  const setLayout = useCallback(
    (next) => {
      if (!LAYOUTS.includes(next)) return;
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // เบราว์เซอร์ไม่ให้เก็บค่า: ยังใช้ค่าใน URL ได้ตามปกติ
      }
      setUrlLayout(next);
    },
    [setUrlLayout]
  );

  return [layout, setLayout];
}
