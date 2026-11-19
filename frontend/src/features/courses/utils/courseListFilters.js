// ======================================================
// courseListFilters — ตัวกรองรายการคอร์สเรียน (ใช้ร่วมกันหลายหน้า)
// ลำดับตัวกรอง: หมวดหมู่ → คอร์สของฉัน/ที่เป็นเจ้าของ → อาจารย์ → ค้นหา
// ======================================================

export const COURSES_PER_PAGE = 9;

const norm = (v) => (v || "").toString().trim().toLowerCase();

/**
 * กรองคอร์สตามเงื่อนไข
 * @param {Array} courses รายการคอร์สจาก API (/classrooms)
 * @param {{category?: string, view?: string, instructor?: string, q?: string}} filters
 *   view: "all" | "mine" (ลงทะเบียนหรือเป็นเจ้าของ) | "owned" (เป็นเจ้าของ)
 */
export function filterCourses(courses = [], { category = "", view = "all", instructor = "", q = "" } = {}) {
  const keyword = norm(q);
  const cat = norm(category);

  return courses.filter((c) => {
    if (cat && norm(c.category_name) !== cat) return false;
    if (view === "mine" && !(c.is_enrolled || c.is_owner)) return false;
    if (view === "owned" && !c.is_owner) return false;
    if (instructor && String(c.instructor_id) !== String(instructor)) return false;
    if (keyword) {
      const haystack = [c.title, c.description, c.instructor_name, c.category_name].map(norm).join(" ");
      if (!haystack.includes(keyword)) return false;
    }
    return true;
  });
}

/** หมวดหมู่ที่มีอยู่ในรายการคอร์ส (รวมหมวดที่เลือกอยู่ แม้ยังไม่มีคอร์ส เช่น มาจากปุ่มหน้าแรก) */
export function getCategoryOptions(courses = [], selected = "") {
  const names = new Map();
  courses.forEach((c) => {
    if (c.category_name) names.set(norm(c.category_name), c.category_name);
  });
  if (selected && !names.has(norm(selected))) names.set(norm(selected), selected);
  return [...names.values()].sort((a, b) => a.localeCompare(b, "th"));
}

/** รายชื่ออาจารย์เจ้าของคอร์ส สำหรับตัวกรอง "คอร์สของอาจารย์แต่ละคน" */
export function getInstructorOptions(courses = []) {
  const map = new Map();
  courses.forEach((c) => {
    if (c.instructor_id && !map.has(String(c.instructor_id))) {
      map.set(String(c.instructor_id), c.instructor_name || "ไม่ระบุชื่อ");
    }
  });
  return [...map.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "th"));
}

/** ตัดรายการตามหน้า และกันเลขหน้าเกินจำนวนหน้าที่มีจริง */
export function paginate(items = [], page = 1, perPage = COURSES_PER_PAGE) {
  const pages = Math.max(1, Math.ceil(items.length / perPage));
  const safePage = Math.min(Math.max(1, page), pages);
  const start = (safePage - 1) * perPage;
  return { pageItems: items.slice(start, start + perPage), page: safePage, pages };
}
