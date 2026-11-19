import { useState, useEffect, useRef } from "react";
import { LuPlay, LuRotateCcw, LuZap, LuCheck, LuSparkles } from "react-icons/lu";

/**
 * SimulationWidget Component
 * ระบบจำลองการทำงานอัตโนมัติ (Simulation) สำหรับ Chapter 2 / EP 2.4
 * แสดงวงจร:
 * Soil Moisture 18% → ESP32 → Condition < 30% → Relay ON → Pump ON → Moisture 18% → 25% → 35% → Pump OFF
 */
function SimulationWidget({ onSimulationComplete, className = "" }) {
  const [step, setStep] = useState(0); // 0: idle, 1: sensing, 2: relay_on, 3: pumping, 4: rising, 5: target_reached, 6: done
  const [moisture, setMoisture] = useState(18);
  const [isRelayOn, setIsRelayOn] = useState(false);
  const [isPumpOn, setIsPumpOn] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [statusMessage, setStatusMessage] = useState("กดปุ่ม '▶ เริ่มจำลอง' เพื่อทดสอบการทำงานของระบบ");

  const timerRef = useRef(null);

  // รีเซ็ตการจำลอง
  const handleReset = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsRunning(false);
    setStep(0);
    setMoisture(18);
    setIsRelayOn(false);
    setIsPumpOn(false);
    setStatusMessage("กดปุ่ม '▶ เริ่มจำลอง' เพื่อทดสอบการทำงานของระบบ");
  };

  // เริ่มการจำลองทีละขั้นตอน
  const handleStart = () => {
    if (isRunning) return;
    handleReset();
    setIsRunning(true);
    setStep(1);
    setStatusMessage("📡 เซนเซอร์อ่านค่าความชื้นดินได้ 18% ส่งสัญญาณไปยัง ESP32...");

    // Step 1: ESP32 ประมวลผลเงื่อนไข
    timerRef.current = setTimeout(() => {
      setStep(2);
      setStatusMessage("🧠 ESP32 ตรวจสอบเงื่อนไข: ความชื้น 18% < 30% (จริง) → ส่งคำสั่งไปที่รีเลย์");

      // Step 2: Relay สับสวิตช์ ON
      timerRef.current = setTimeout(() => {
        setStep(3);
        setIsRelayOn(true);
        setStatusMessage("⚡ รีเลย์ทำงาน (Relay ON) ปล่อยกระแสไฟ 12V ไปยังปั๊มน้ำ");

        // Step 3: Pump ทำงาน น้ำไหล
        timerRef.current = setTimeout(() => {
          setStep(4);
          setIsPumpOn(true);
          setMoisture(25);
          setStatusMessage("💧 ปั๊มน้ำทำงาน (Pump ON) น้ำไหลสู่แปลงปลูก → ความชื้นเพิ่มขึ้นเป็น 25%");

          // Step 4: ดินชุ่มขึ้นถึง 35%
          timerRef.current = setTimeout(() => {
            setStep(5);
            setMoisture(35);
            setStatusMessage("🌱 ความชื้นในดินเพิ่มขึ้นเป็น 35% (ถึงเกณฑ์เป้าหมาย)");

            // Step 5: ตัดการทำงาน Relay & Pump OFF
            timerRef.current = setTimeout(() => {
              setStep(6);
              setIsRelayOn(false);
              setIsPumpOn(false);
              setIsRunning(false);
              setStatusMessage(
                "🎉 สำเร็จ! ESP32 ตรวจสอบพบความชื้น 35% >= 30% จึงสั่งตัดไฟ Relay OFF และ Pump OFF อัตโนมัติ"
              );
              onSimulationComplete?.();
            }, 1200);
          }, 1400);
        }, 1200);
      }, 1200);
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div
      className={`rounded-3xl border border-[#ABD1C6] bg-gradient-to-b from-[#FAFAFA] to-white p-6 sm:p-8 shadow-sm space-y-6 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5E9E7] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#004643] text-white shadow-2xs">
              <LuZap className="h-4 w-4 text-[#ABD1C6]" aria-hidden="true" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#004643]">
              การจำลองระบบอัตโนมัติ (Live Simulation)
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-[#26332F] mt-1">
            จำลองระบบรดน้ำอัตโนมัติตามความชื้นดิน
          </h3>
          <p className="text-xs text-[#6B7773] mt-0.5">
            สังเกตการไหลของข้อมูลและคำสั่งจาก Sensor → ESP32 → Relay → Pump แบบสมบูรณ์
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleStart}
            disabled={isRunning}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#004643] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#003835] active:scale-98 transition disabled:opacity-50 cursor-pointer"
          >
            <LuPlay className="h-4 w-4 text-[#ABD1C6]" />
            <span>{isRunning ? "กำลังจำลอง..." : "▶ เริ่มจำลอง"}</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-[#E5E9E7] bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-[#26332F] hover:bg-gray-50 active:scale-98 transition cursor-pointer"
          >
            <LuRotateCcw className="h-4 w-4 text-[#6B7773]" />
            <span>รีเซ็ต</span>
          </button>
        </div>
      </div>

      {/* Interactive Simulation Dashboard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Node 1: Soil Moisture Sensor */}
        <div
          className={`rounded-2xl border p-4 text-center transition-all ${
            step >= 1
              ? "border-[#ABD1C6] bg-white shadow-md ring-2 ring-[#ABD1C6]/30"
              : "border-gray-200 bg-[#FAFAFA]"
          }`}
        >
          <div className="text-3xl mb-1">🌱</div>
          <span className="text-xs font-bold text-[#6B7773]">เซนเซอร์ความชื้นในดิน</span>
          <div className="my-2 flex items-center justify-center">
            <span
              className={`text-2xl sm:text-3xl font-mono font-black transition-colors ${
                moisture < 30 ? "text-rose-600" : "text-emerald-600"
              }`}
            >
              {moisture}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                moisture < 30 ? "bg-rose-500" : "bg-emerald-500"
              }`}
              style={{ width: `${moisture}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] font-semibold text-[#6B7773]">
            {moisture < 30 ? "⚠️ ดินแห้ง (ต้องการน้ำ)" : "✓ ดินชุ่มชื้นพอดี"}
          </p>
        </div>

        {/* Node 2: ESP32 Brain */}
        <div
          className={`rounded-2xl border p-4 text-center transition-all ${
            step >= 2
              ? "border-[#004643] bg-white shadow-md ring-2 ring-[#004643]/20"
              : "border-gray-200 bg-[#FAFAFA]"
          }`}
        >
          <div className="text-3xl mb-1">🧠</div>
          <span className="text-xs font-bold text-[#6B7773]">สมองกล ESP32</span>
          <div className="my-2 rounded-xl bg-[#FAFAFA] border border-[#E5E9E7] p-2 text-[11px] font-mono font-bold text-[#004643]">
            IF (moisture &lt; 30)
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                moisture < 30
                  ? "bg-rose-100 text-rose-800"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {moisture < 30 ? "เงื่อนไขเป็นจริง (TRUE)" : "เงื่อนไขเป็นเท็จ (FALSE)"}
            </span>
          </div>
        </div>

        {/* Node 3: Relay Switch */}
        <div
          className={`rounded-2xl border p-4 text-center transition-all ${
            isRelayOn
              ? "border-amber-400 bg-amber-50/40 shadow-md ring-2 ring-amber-300"
              : "border-gray-200 bg-[#FAFAFA]"
          }`}
        >
          <div className="text-3xl mb-1">⚡</div>
          <span className="text-xs font-bold text-[#6B7773]">รีเลย์สวิตช์ (Relay)</span>
          <div className="my-2">
            <span
              className={`inline-block px-3 py-1 rounded-xl text-sm font-mono font-black ${
                isRelayOn
                  ? "bg-amber-500 text-white shadow-xs animate-pulse"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {isRelayOn ? "ON (สับสวิตช์)" : "OFF (ตัดวงจร)"}
            </span>
          </div>
          <p className="text-[11px] text-[#6B7773]">
            {isRelayOn ? "ปล่อยไฟเข้าปั๊มน้ำ" : "ไม่มีกระแสไฟส่งออก"}
          </p>
        </div>

        {/* Node 4: Water Pump */}
        <div
          className={`rounded-2xl border p-4 text-center transition-all ${
            isPumpOn
              ? "border-cyan-500 bg-cyan-50/40 shadow-md ring-2 ring-cyan-300"
              : "border-gray-200 bg-[#FAFAFA]"
          }`}
        >
          <div className="text-3xl mb-1">{isPumpOn ? "🚿" : "💤"}</div>
          <span className="text-xs font-bold text-[#6B7773]">ปั๊มน้ำ (Pump)</span>
          <div className="my-2">
            <span
              className={`inline-block px-3 py-1 rounded-xl text-sm font-mono font-black ${
                isPumpOn
                  ? "bg-cyan-600 text-white shadow-xs animate-bounce"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {isPumpOn ? "RUNNING (น้ำกำลังไหล)" : "STOPPED (หยุดทำงาน)"}
            </span>
          </div>
          <p className="text-[11px] text-[#6B7773]">
            {isPumpOn ? "ส่งน้ำเข้าแปลงพืช" : "ปั๊มน้ำหยุดพัก"}
          </p>
        </div>
      </div>

      {/* Real-time Status Message Banner */}
      <div
        className={`rounded-2xl p-4 text-xs sm:text-sm border transition-all ${
          step === 6
            ? "bg-emerald-50 border-emerald-200 text-emerald-950 font-semibold"
            : isRunning
            ? "bg-cyan-50 border-cyan-200 text-cyan-950"
            : "bg-[#FAFAFA] border-[#E5E9E7] text-[#26332F]"
        }`}
      >
        <div className="flex items-center gap-2">
          {step === 6 ? (
            <LuSparkles className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : isRunning ? (
            <div className="h-3 w-3 rounded-full bg-cyan-500 animate-ping shrink-0" />
          ) : (
            <LuCheck className="h-4 w-4 text-[#004643] shrink-0" />
          )}
          <span>{statusMessage}</span>
        </div>
      </div>
    </div>
  );
}

export default SimulationWidget;
