import { Link } from "react-router-dom";
import { LuClock } from "react-icons/lu";

/**
 * IoTContinueBanner Component
 * Highlight card prompting user to resume IoT 101 learning at EP 1.2.
 */
function IoTContinueBanner() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl bg-gradient-to-r from-[#004643] via-[#003835] to-[#26332F] p-6 text-white shadow-sm">
      <div className="space-y-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#ABD1C6]/20 px-3 py-1 text-xs font-bold text-[#ABD1C6]">
          <LuClock className="h-3.5 w-3.5" aria-hidden="true" />
          <span>กำลังเรียนอยู่ล่าสุด</span>
        </span>
        <h3 className="text-lg sm:text-xl font-bold">
          Chapter 1: Sensors → EP 1.2: Temperature และ Humidity Sensor
        </h3>
        <p className="text-xs sm:text-sm text-gray-300 max-w-xl">
          เรียนค้างไว้ 80% • ต่อวงจรเซนเซอร์วัดสภาพอากาศ DHT22 กับไมโครคอนโทรลเลอร์ ESP32
        </p>
      </div>
      <Link
        to="/classrooms/iot-101/lessons/ep-1-2"
        className="inline-flex items-center justify-center rounded-xl bg-[#ABD1C6] px-6 py-3 text-sm font-bold text-[#20302C] shadow-sm hover:bg-[#9CC5B9] transition shrink-0"
      >
        เรียนต่อทันที →
      </Link>
    </div>
  );
}

export default IoTContinueBanner;
