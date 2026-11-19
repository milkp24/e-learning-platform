import StatCard from "./StatCard";
import ActivityChart from "./ActivityChart";

/**
 * AccountOverviewSection Component
 * Domain 4: ภาพรวมสถานะการใช้งานและการต่ออายุบัญชี (Account Status & Renewal)
 *
 * Rule: 1 Chart = 1 Domain = 1 Topic
 * Summary:
 * - Active Accounts (บัญชีที่ใช้งานอยู่)
 * - Inactive Accounts (บัญชีที่ระงับ/ไม่ใช้งาน)
 * - Expiring Accounts (บัญชีใกล้หมดอายุ - Coming Soon)
 * - Expired Accounts (บัญชีหมดอายุ - Coming Soon)
 *
 * Visual Components:
 * - ActivityChart: Daily active accounts trend
 * - Account Renewal Status: Coming Soon container
 */
function AccountOverviewSection({ stats }) {
  return (
    <section className="space-y-4">
      {/* Domain Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-[#E5E9E7] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#26332F]" />
            <h2 className="text-lg sm:text-xl font-black text-[#26332F] tracking-tight">
              สถิติสถานะบัญชีผู้ใช้
            </h2>
          </div>
          <p className="text-xs text-[#6B7773] mt-0.5 ml-4.5">
            ภาพรวมสถานะการใช้งานและความเคลื่อนไหวของบัญชีผู้ใช้
          </p>
        </div>
        <span className="text-xs font-semibold text-[#26332F] bg-[#26332F]/10 border border-[#26332F]/20 px-2.5 py-1 rounded-full self-start sm:self-auto ml-4.5 sm:ml-0">
          สถานะบัญชีผู้ใช้งาน
        </span>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="บัญชีที่ใช้งานได้"
          value={stats.activeAccounts}
          subtitle="บัญชีที่เข้าสู่ระบบได้ปกติ"
          domain="darkJade"
          iconType="check"
        />
        <StatCard
          title="บัญชีที่ถูกระงับ"
          value={stats.inactiveAccounts}
          subtitle="บัญชีที่ระงับหรือปิดใช้งาน"
          domain="red"
          iconType="alert"
        />
        <StatCard
          title="บัญชีใกล้หมดอายุ"
          value={null}
          badge="เร็วๆ นี้"
          subtitle="บัญชีที่ใกล้หมดอายุใน 30 วัน"
          domain="amber"
          iconType="clock"
        />
        <StatCard
          title="บัญชีหมดอายุแล้ว"
          value={null}
          badge="เร็วๆ นี้"
          subtitle="บัญชีที่หมดอายุการใช้งานแล้ว"
          domain="red"
          iconType="archive"
        />
      </div>

      {/* Visual Components Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Active Accounts Activity Chart */}
        <div className="lg:col-span-7 flex flex-col">
          <ActivityChart dailyActivity={stats?.dailyActivity} />
        </div>

        {/* Right: Account Renewal & Expiration Analytics Container */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-[16px] border border-dashed border-[#CBD5E1] bg-[#FAFAFA] p-5 sm:p-6">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E9E7]">
              <div>
                <h3 className="text-base font-black text-[#26332F]">
                  ระบบต่ออายุบัญชีและการใช้งาน
                </h3>
                <p className="text-xs text-[#6B7773] mt-0.5">
                  ระบบติดตามอายุการใช้งานบัญชีและการต่ออายุ
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-100/70 border border-amber-200/60 px-2 py-0.5 text-[11px] font-bold text-amber-800 shrink-0">
                เร็วๆ นี้
              </span>
            </div>

            <div className="mt-5 space-y-3">
              <p className="text-xs sm:text-sm text-[#6B7773] leading-relaxed">
                ระบบติดตามระยะเวลาการใช้งานบัญชีและการแจ้งเตือนการต่ออายุ
                จะเปิดให้ใช้งานในเวอร์ชันถัดไป
              </p>

              <div className="space-y-2 pt-2">
                <div className="p-3 rounded-xl bg-white border border-[#E5E9E7] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold text-[#26332F]">
                      สถานะเปิดใช้งานปกติ
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    พร้อมใช้งาน
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#E5E9E7] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-xs font-semibold text-[#26332F]">
                      การแจ้งเตือนใกล้หมดอายุ
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                    เร็วๆ นี้
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#E5E9E7] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span className="text-xs font-semibold text-[#26332F]">
                      การระงับบัญชีเมื่อสิ้นสุดอายุ
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded">
                    เร็วๆ นี้
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-[#E5E9E7]/80 text-xs text-[#6B7773]">
            ข้อมูลบัญชี Active / Inactive อ้างอิงจาก User Status ปัจจุบันในระบบจริง
          </div>
        </div>
      </div>
    </section>
  );
}

export default AccountOverviewSection;
