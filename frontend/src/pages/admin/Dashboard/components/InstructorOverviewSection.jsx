import { LuCheck } from "react-icons/lu";
import StatCard from "./StatCard";

/**
 * InstructorOverviewSection Component
 * Domain 3: ภาพรวมผู้สอนและการจัดการเรียนการสอน (Instructor)
 *
 * Rule: 1 Chart = 1 Domain = 1 Topic
 * Summary:
 * - Total Instructors (ผู้สอนทั้งหมด)
 * - Active Instructors (ผู้สอนที่พร้อมใช้งาน)
 * - Instructors with Courses (ผู้สอนที่มีคอร์สสอน)
 *
 * Performance / Activity:
 * - Marked explicitly as "Coming Soon" with explanatory UI container
 * - Zero fake numbers, zero made-up metrics
 */
function InstructorOverviewSection({ stats }) {
  return (
    <section className="space-y-4">
      {/* Domain Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-[#E5E9E7] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#64748B]" />
            <h2 className="text-lg sm:text-xl font-black text-[#26332F] tracking-tight">
              สถิติอาจารย์และผู้สอน
            </h2>
          </div>
          <p className="text-xs text-[#6B7773] mt-0.5 ml-4.5">
            ภาพรวมอาจารย์ผู้สอนและการจัดการรายวิชา
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200/60 px-2.5 py-1 rounded-full self-start sm:self-auto ml-4.5 sm:ml-0">
          การจัดการผู้สอน
        </span>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="ผู้สอนทั้งหมด"
          value={stats.totalInstructors}
          subtitle="ผู้สอนทั้งหมดในระบบ"
          domain="slate"
          iconType="instructors"
        />
        <StatCard
          title="ผู้สอนที่พร้อมใช้งาน"
          value={stats.activeInstructors}
          subtitle="ผู้สอนที่มีสถานะพร้อมใช้งาน"
          domain="teal"
          iconType="check"
        />
        <StatCard
          title="ผู้สอนที่มีคอร์สในระบบ"
          value={stats.instructorsWithCourses}
          subtitle="ผู้สอนที่มีคอร์สในความรับผิดชอบ"
          domain="jade"
          iconType="courses"
        />
      </div>

      {/* Instructor Activity & Analytics Container (Coming Soon) */}
      <div className="rounded-[16px] border border-dashed border-[#CBD5E1] bg-[#FAFAFA] p-6 sm:p-8 text-center flex flex-col items-center justify-center">
        <div className="h-12 w-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-3 shadow-2xs">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-base font-black text-[#26332F]">
            ระบบวิเคราะห์ผลการสอนและกิจกรรมของผู้สอน
          </h3>
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-100/70 border border-amber-200/60 px-2 py-0.5 text-[11px] font-bold text-amber-800">
            เร็วๆ นี้
          </span>
        </div>

        <p className="max-w-xl text-xs sm:text-sm text-[#6B7773] leading-relaxed">
          ระบบวิเคราะห์ประสิทธิภาพของผู้สอน เช่น ชั่วโมงการสอนเฉลี่ย อัตราความพึงพอใจของผู้เรียน
          และการมีส่วนร่วมในห้องเรียน จะเปิดให้ใช้งานในเวอร์ชันถัดไป
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-white border border-[#E5E9E7] px-3 py-1 rounded-lg">
            <LuCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
            <span>ข้อมูลผู้สอน {stats.totalInstructors} ท่านพร้อมใช้งานในระบบ</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-white border border-[#E5E9E7] px-3 py-1 rounded-lg">
            <LuCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
            <span>ผู้สอนที่มีคอร์ส {stats.instructorsWithCourses} ท่านมีรายวิชาที่เปิดสอนแล้ว</span>
          </span>
        </div>
      </div>
    </section>
  );
}

export default InstructorOverviewSection;
