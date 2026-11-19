import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { LuSparkles, LuRefreshCw, LuArrowRight, LuBookOpen } from "react-icons/lu";
import classroomService from "../../../../services/classroomService";
import CourseCard from "../../../../features/courses/components/CourseCard";
import { IOT_101_COURSE } from "../../../../data/iot101Data";

/**
 * GuestCoursesSection Component
 * ส่วนแสดงคอร์สแนะนำสำหรับ Guest บนหน้าแรก (Guest Home)
 * - ดึงข้อมูลคอร์สจริงจาก API และคอร์สแกน IoT 101
 * - แสดงผลเป็นการ์ดคอร์ส พร้อมข้อมูลผู้สอน, ระดับ, จำนวนบทเรียน
 * - รองรับ Filter ตามหมวดหมู่
 * - มี Loading Skeletons และ Error State พร้อมปุ่ม Retry
 * - นำทางไปหน้ารายละเอียดคอร์ส (/classrooms/:id) เพื่อดู Curriculum Outline
 */
function GuestCoursesSection() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await classroomService.getClassrooms();
      const apiClassrooms = data.classrooms || [];

      // คอร์สหลัก IoT 101 สำหรับ Guest (ปิดสถานะ enrolled เพื่อพรีวิว)
      const guestIoT101 = {
        ...IOT_101_COURSE,
        is_enrolled: false,
        progressPercent: null,
      };

      // กรองห้องเรียนจาก API เพื่อป้องกัน id ซ้ำกับ iot-101
      const filteredApiCourses = apiClassrooms.filter(
        (c) => c.classroom_id !== "iot-101"
      );

      setCourses([guestIoT101, ...filteredApiCourses]);
    } catch (err) {
      console.error("Failed to fetch guest courses:", err);
      // หากเกิดข้อผิดพลาดจาก API ให้ยังคงแสดง IoT 101 เพื่อไม่ให้หน้าแรกว่างเปล่า
      const guestIoT101 = {
        ...IOT_101_COURSE,
        is_enrolled: false,
        progressPercent: null,
      };
      setCourses([guestIoT101]);
      setError("ไม่สามารถโหลดคอร์สเพิ่มเติมจากเซิร์ฟเวอร์ได้ในขณะนี้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const categories = [
    { id: "all", label: "ทั้งหมด" },
    { id: "iot", label: "IoT & Smart City" },
    { id: "hardware", label: "Hardware & Sensor" },
  ];

  const filteredCourses = courses.filter((course) => {
    if (selectedCategory === "all") return true;
    if (selectedCategory === "iot") {
      return (
        course.category?.toLowerCase().includes("iot") ||
        course.title?.toLowerCase().includes("iot")
      );
    }
    if (selectedCategory === "hardware") {
      return (
        course.category?.toLowerCase().includes("hardware") ||
        course.description?.toLowerCase().includes("hardware") ||
        course.description?.toLowerCase().includes("sensor")
      );
    }
    return true;
  });

  return (
    <section
      id="courses-discovery"
      className="py-16 px-4 sm:px-8 max-w-7xl mx-auto space-y-10 scroll-mt-12"
    >
      {/* 1. ส่วนหัวข้อ Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#E5E9E7] pb-8">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#ABD1C6]/30 px-3 py-1 text-xs font-bold text-[#004643]">
            <LuSparkles className="h-3.5 w-3.5" />
            <span>คอร์สเรียนแนะนำสำหรับคุณ</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#26332F] tracking-tight">
            สำรวจคอร์สเรียน IoT คุณภาพสูง
          </h2>
          <p className="text-sm text-[#6B7773] leading-relaxed">
            ดูรายละเอียดโครงสร้างหลักสูตร หัวข้อบทเรียน และโจทย์ภารกิจได้ทันที
            สมัครสมาชิกเพื่อเริ่มลงมือปฏิบัติการจริง
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-[#004643] text-white shadow-xs"
                  : "bg-white border border-[#E5E9E7] text-[#6B7773] hover:text-[#26332F] hover:border-[#ABD1C6]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4 animate-pulse"
            >
              <div className="aspect-video w-full rounded-xl bg-gray-200" />
              <div className="h-4 w-3/4 rounded-md bg-gray-200" />
              <div className="h-3 w-full rounded-md bg-gray-100" />
              <div className="h-3 w-5/6 rounded-md bg-gray-100" />
              <div className="pt-4 border-t border-gray-100 flex justify-between">
                <div className="h-8 w-24 rounded-lg bg-gray-200" />
                <div className="h-8 w-24 rounded-lg bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Error Alert (ถ้ามี แต่ยังมีคอร์สแสดงผล) */}
      {!loading && error && (
        <div className="flex items-center justify-between rounded-2xl bg-[#FAFAFA] border border-[#E5E9E7] p-4 text-xs text-[#26332F]">
          <span className="text-[#6B7773]">{error}</span>
          <button
            type="button"
            onClick={fetchCourses}
            className="inline-flex items-center gap-1 font-bold text-[#004643] underline hover:no-underline cursor-pointer"
          >
            <LuRefreshCw className="h-3 w-3" />
            <span>โหลดใหม่</span>
          </button>
        </div>
      )}

      {/* 4. Course Cards Grid */}
      {!loading && filteredCourses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((c) => (
            <CourseCard
              key={c.id || c.classroom_id}
              course={c}
              role="guest"
            />
          ))}
        </div>
      )}

      {/* 5. Empty State */}
      {!loading && filteredCourses.length === 0 && (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center space-y-3">
          <LuBookOpen className="h-10 w-10 text-gray-400 mx-auto" />
          <p className="text-base font-bold text-gray-700">ไม่พบคอร์สในหมวดหมู่นี้</p>
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className="text-xs font-bold text-[#004643] underline hover:no-underline cursor-pointer"
          >
            ดูคอร์สทั้งหมด
          </button>
        </div>
      )}

      {/* 6. Footer Call-to-Action แนะนำให้สำรวจห้องเรียนทั้งหมด */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-[#004643] to-[#26332F] p-6 sm:p-8 text-white shadow-md">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-lg sm:text-xl font-bold">
            ต้องการสำรวจห้องเรียนทั้งหมดใช่ไหม?
          </h3>
          <p className="text-xs sm:text-sm text-[#ABD1C6]">
            เรามีคอร์สเรียนและห้องเรียน IoT พร้อมบทเรียนรอให้คุณเรียนรู้
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/classrooms"
            className="inline-flex items-center gap-2 rounded-xl bg-[#ABD1C6] px-5 py-2.5 text-xs sm:text-sm font-bold text-[#20302C] hover:bg-[#9CC5B9] transition shadow-xs"
          >
            <span>ดูคอร์สทั้งหมด</span>
            <LuArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default GuestCoursesSection;
