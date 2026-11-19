function LearningFlowSection() {
  return (
    <section className="rounded-3xl border border-[#E5E9E7] bg-white p-6 space-y-4 shadow-xs">
      <h2 className="text-lg font-black text-[#26332F]">
        เส้นทางการเรียนรู้: เรียนรู้ → ทดลอง → สร้าง → ปลดล็อก
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-center">
        <div className="p-3 rounded-xl bg-[#FAFAFA] border border-[#E5E9E7]">
          <div className="font-bold text-[#004643]">① เรียนรู้</div>
          <div className="text-xs text-[#6B7773]">ทฤษฎี IoT & พื้นฐาน</div>
        </div>
        <div className="p-3 rounded-xl bg-[#FAFAFA] border border-[#E5E9E7]">
          <div className="font-bold text-[#004643]">② ทดลอง</div>
          <div className="text-xs text-[#6B7773]">จำลองวงจรบนแล็บ</div>
        </div>
        <div className="p-3 rounded-xl bg-[#FAFAFA] border border-[#E5E9E7]">
          <div className="font-bold text-[#004643]">③ สร้าง</div>
          <div className="text-xs text-[#6B7773]">ต่อเซนเซอร์ & คลาวด์</div>
        </div>
        <div className="p-3 rounded-xl bg-[#ABD1C6]/20 border border-[#ABD1C6]">
          <div className="font-bold text-[#004643]">④ ปลดล็อก</div>
          <div className="text-xs text-[#6B7773]">พิชิตภารกิจรับ XP</div>
        </div>
      </div>
    </section>
  );
}

export default LearningFlowSection;
