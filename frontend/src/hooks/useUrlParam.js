import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * useUrlParam — เก็บค่า state ไว้ใน Query String ของ URL (FB-05)
 * ใช้กับเลขหน้า ตัวกรอง และคำค้น เพื่อให้กดย้อนกลับ / รีเฟรช แล้วยังอยู่ที่เดิม
 *
 * const [page, setPage] = useUrlParam("page", 1);
 * const [search, setSearch] = useUrlParam("q", "");
 *
 * - ถ้าค่าเท่ากับค่าเริ่มต้น จะลบ key ออกจาก URL เพื่อให้ URL สั้น
 * - ใช้ replace: true จึงไม่สร้างประวัติใหม่ทุกครั้งที่พิมพ์
 * - อ่านค่าปัจจุบันจาก window.location ทุกครั้ง เพื่อให้เรียก setter หลายตัวติดกันได้โดยไม่ทับกัน
 */
export default function useUrlParam(key, defaultValue = "") {
  const [searchParams, setSearchParams] = useSearchParams();
  const isNumber = typeof defaultValue === "number";

  const parse = (raw) => {
    if (raw === null) return defaultValue;
    if (!isNumber) return raw;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : defaultValue;
  };

  const value = parse(searchParams.get(key));

  const setValue = useCallback(
    (next) => {
      const current = new URLSearchParams(window.location.search);
      const prev = parse(current.get(key));
      const resolved = typeof next === "function" ? next(prev) : next;

      if (resolved === defaultValue || resolved === "" || resolved === null || resolved === undefined) {
        current.delete(key);
      } else {
        current.set(key, String(resolved));
      }

      setSearchParams(current, { replace: true, preventScrollReset: true });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, defaultValue, setSearchParams]
  );

  return [value, setValue];
}
