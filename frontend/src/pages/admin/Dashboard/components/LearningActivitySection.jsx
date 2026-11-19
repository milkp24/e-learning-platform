import { LuCheck, LuHourglass } from "react-icons/lu";
import StatCard from "./StatCard";

/**
 * LearningActivitySection Component
 * Domain 5: กิจกรรมการเรียนรู้และการประเมินผล (Learning & Assessment Activity)
 *
 * Rule: 1 Chart = 1 Domain = 1 Topic
 * Summary:
 * - Active Learners (ผู้เรียนที่มีความเคลื่อนไหว - Coming Soon)
 * - Course Enrollments (ยอดการลงทะเบียนเรียนจริง - Real data)
 * - Lesson Completion (บทเรียนที่เรียนจบ - Coming Soon)
 * - Quiz Attempts (การทำแบบทดสอบ - Coming Soon)
 *
 * Educational Notice:
 * - Clarifies: Active Account != Active Learner
 *
 * Progress Container:
 * - Coming Soon container explaining connection to Module 4 & 8
 */
function LearningActivitySection({ stats }) {
  return (
    <section className="space-y-4">
      {/* Domain Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-[#E5E9E7] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <h2 className="text-lg sm:text-xl font-black text-[#26332F] tracking-tight">
              สถิติกิจกรรมการเรียนรู้
            </h2>
          </div>
          <p className="text-xs text-[#6B7773] mt-0.5 ml-4.5">
            ภาพรวมกิจกรรมการเรียนรู้และความก้าวหน้าของผู้เรียน
          </p>
        </div>
        <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/50 px-2.5 py-1 rounded-full self-start sm:self-auto ml-4.5 sm:ml-0">
          กิจกรรมผู้เรียน
        </span>
      </div>

      {/* Educational Distinction Banner: Active Account vs Active Learner */}
      <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4 flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-xs text-[#26332F] space-y-1">
          <p className="font-bold text-emerald-900 text-sm">
            ความแตกต่างระหว่างบัญชีเปิดใช้งานและผู้เรียนที่มีกิจกรรม
          </p>
          <p className="text-[#6B7773] leading-relaxed">
            <strong className="text-[#26332F]">บัญชีที่เปิดใช้งาน (Active Account):</strong> คือบัญชีผู้ใช้ที่มีสถานะปกติและสามารถเข้าสู่ระบบได้
            <br />
            <strong className="text-[#26332F]">ผู้เรียนที่มีกิจกรรม (Active Learner):</strong> คือผู้เรียนที่เข้าศึกษาบทเรียน ส่งงาน หรือทำแบบทดสอบอย่างสม่ำเสมอ
          </p>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="ผู้เรียนที่มีกิจกรรม"
          value={null}
          badge="เร็วๆ นี้"
          subtitle="ผู้เรียนที่มีกิจกรรมการเรียนรู้"
          domain="green"
          iconType="activity"
        />
        <StatCard
          title="ยอดลงทะเบียนเรียน"
          value={stats.courseEnrollments}
          subtitle="ยอดการลงทะเบียนเรียนทั้งหมด"
          domain="teal"
          iconType="student"
        />
        <StatCard
          title="บทเรียนที่เรียนจบ"
          value={null}
          badge="เร็วๆ นี้"
          subtitle="บทเรียนที่เรียนจบสมบูรณ์"
          domain="jade"
          iconType="check"
        />
        <StatCard
          title="การทำแบบทดสอบ"
          value={null}
          badge="เร็วๆ นี้"
          subtitle="จำนวนครั้งที่ทำแบบทดสอบ"
          domain="darkJade"
          iconType="book"
        />
      </div>

      {/* Learning Progress & Assessment Analytics Container (Coming Soon) */}
      <div className="rounded-[16px] border border-dashed border-[#CBD5E1] bg-[#FAFAFA] p-6 sm:p-8 text-center flex flex-col items-center justify-center">
        <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-3 shadow-2xs">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-base font-black text-[#26332F]">
            ระบบติดตามความก้าวหน้าและผลการทดสอบ
          </h3>
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-100/70 border border-amber-200/60 px-2 py-0.5 text-[11px] font-bold text-amber-800">
            เร็วๆ นี้
          </span>
        </div>

        <p className="max-w-xl text-xs sm:text-sm text-[#6B7773] leading-relaxed">
          กราฟแสดงความก้าวหน้าในการเรียนรู้และสถิติผลการทดสอบ จะเปิดให้แสดงผลในเวอร์ชันถัดไปเมื่อผู้เรียนเริ่มมีกิจกรรมการเรียนรู้ในระบบ
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
            <LuCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
            <span>ยอดลงทะเบียนเรียน {stats.courseEnrollments} ที่นั่งในระบบ</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-white border border-[#E5E9E7] px-3 py-1 rounded-lg">
            <LuHourglass className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
            <span>ระบบติดตามความคืบหน้ารายบทเรียนจะพร้อมใช้งานเร็วๆ นี้</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-white border border-[#E5E9E7] px-3 py-1 rounded-lg">
            <LuHourglass className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
            <span>ระบบสรุปผลคะแนนแบบทดสอบจะพร้อมใช้งานเร็วๆ นี้</span>
          </span>
        </div>
      </div>
    </section>
  );
}

export default LearningActivitySection;
