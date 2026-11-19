
import { LuFileText } from "react-icons/lu";

/**
 * QuizzesTable Component
 * Displays table of quizzes with title, course, questions count, pass score, duration, and status.
 */
function QuizzesTable({ quizzes }) {
  return (
    <div className="rounded-[16px] border border-[#E5E9E7] bg-white shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-[#26332F]">
          <thead className="border-b border-[#E5E9E7] bg-[#FAFAFA] text-xs font-bold uppercase tracking-wider text-[#6B7773]">
            <tr>
              <th className="px-6 py-4">แบบทดสอบ (Quiz Title)</th>
              <th className="px-6 py-4">หลักสูตร</th>
              <th className="px-6 py-4">จำนวนข้อ</th>
              <th className="px-6 py-4">เกณฑ์ผ่าน</th>
              <th className="px-6 py-4">เวลา</th>
              <th className="px-6 py-4">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E9E7]">
            {quizzes.map((q) => (
              <tr key={q.id} className="hover:bg-[#FAFAFA] transition duration-150">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#ABD1C6]/30 text-[#004643]">
                      <LuFileText className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="font-bold text-[#26332F]">
                      {q.title}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4 text-xs font-semibold text-[#6B7773]">
                  {q.course}
                </td>

                <td className="px-6 py-4 text-xs font-bold text-[#26332F]">
                  {q.questionsCount} ข้อ
                </td>

                <td className="px-6 py-4 text-xs font-bold text-emerald-800">
                  {q.passScore}%
                </td>

                <td className="px-6 py-4 text-xs font-medium text-[#6B7773]">
                  {q.durationMinutes} นาที
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`rounded-lg px-2.5 py-0.5 text-xs font-bold uppercase ${
                      q.status === "active"
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                        : "bg-gray-100 border border-gray-200 text-gray-700"
                    }`}
                  >
                    {q.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default QuizzesTable;
