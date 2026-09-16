// ======================================================
// IoT 101 — ภารกิจปลุกเมืองให้ฉลาด (Course & Curriculum Data)
// Mock Data สำหรับ Phase 1 LMS Frontend
// ======================================================

export const IOT_101_COURSE = {
  id: "iot-101",
  classroom_id: "iot-101",
  title: "IoT 101 — ภารกิจปลุกเมืองให้ฉลาด",
  description:
    "ผู้เรียนจะเรียนรู้พื้นฐาน IoT ตั้งแต่ Sensor, Controller, Network, MQTT, Platform, Database, Dashboard, Automation และ AI ผ่านเรื่องราวของ “สวนเรียนรู้แห่งเมืองนาวา”",
  instructor_id: "inst-iot-01",
  instructor_name: "ดร. ภาณุวัฒน์ เมืองฉลาด",
  status: "active",
  category: "IoT & Smart City",
  level: "Beginner",
  student_count: 142,
  chapter_count: 8,
  lesson_count: 27,
  progressPercent: 65,
  is_enrolled: true,
  thumbnail_url: "/images/classroom-default.svg",
  cover_image: "/images/classroom-default.svg",
  current_episode_id: "ep-1-2",
};

export const IOT_101_CHAPTERS = [
  {
    id: "ch-0",
    sequence_no: 0,
    title: "Chapter 0: ปัญหาของเมืองนาวา",
    description: "จุดเริ่มต้นของภารกิจ ปัญหาสิ่งแวดล้อมและคุณภาพชีวิตในเมืองนาวา",
    status: "completed",
    episodes: [
      {
        id: "ep-0-1",
        code: "EP 0.1",
        title: "เมืองนาวากำลังมีปัญหา",
        duration: "10 นาที",
        status: "completed",
        type: "concept",
      },
      {
        id: "ep-0-2",
        code: "EP 0.2",
        title: "ภารกิจของไอโอ",
        duration: "12 นาที",
        status: "completed",
        type: "story",
      },
    ],
  },
  {
    id: "ch-1",
    sequence_no: 1,
    title: "Chapter 1: Sensors",
    description: "อุปกรณ์ตรวจจับและแปลงสัญญาณทางกายภาพสู่ข้อมูลดิจิทัล",
    status: "in_progress",
    episodes: [
      {
        id: "ep-1-1",
        code: "EP 1.1",
        title: "Sensor คืออะไร",
        duration: "15 นาที",
        status: "completed",
        type: "concept",
      },
      {
        id: "ep-1-2",
        code: "EP 1.2",
        title: "Temperature และ Humidity Sensor",
        duration: "20 นาที",
        status: "in_progress",
        type: "hands_on",
      },
      {
        id: "ep-1-3",
        code: "EP 1.3",
        title: "Soil Moisture Sensor",
        duration: "18 นาที",
        status: "available",
        type: "hands_on",
      },
      {
        id: "ep-1-4",
        code: "EP 1.4",
        title: "Motion และ Water Level Sensor",
        duration: "22 นาที",
        status: "available",
        type: "hands_on",
      },
    ],
  },
  {
    id: "ch-2",
    sequence_no: 2,
    title: "Chapter 2: Controller และ Actuator",
    description: "สมองกลไมโครคอนโทรลเลอร์และการสั่งการอุปกรณ์ขับเคลื่อน",
    status: "available",
    episodes: [
      {
        id: "ep-2-1",
        code: "EP 2.1",
        title: "Controller คืออะไร",
        duration: "15 นาที",
        status: "available",
        type: "concept",
      },
      {
        id: "ep-2-2",
        code: "EP 2.2",
        title: "ESP32",
        duration: "25 นาที",
        status: "available",
        type: "hardware",
      },
      {
        id: "ep-2-3",
        code: "EP 2.3",
        title: "Actuator",
        duration: "15 นาที",
        status: "available",
        type: "concept",
      },
      {
        id: "ep-2-4",
        code: "EP 2.4",
        title: "Relay และ Pump",
        duration: "20 นาที",
        status: "available",
        type: "hands_on",
      },
    ],
  },
  {
    id: "ch-3",
    sequence_no: 3,
    title: "Chapter 3: Network และ Messaging",
    description: "โครงข่ายไร้สายและโปรโตคอลรับส่งข้อความสำหรับ IoT",
    status: "locked",
    episodes: [
      {
        id: "ep-3-1",
        code: "EP 3.1",
        title: "การเชื่อมต่อ IoT",
        duration: "15 นาที",
        status: "locked",
        type: "concept",
      },
      {
        id: "ep-3-2",
        code: "EP 3.2",
        title: "Wi-Fi / BLE / LoRa",
        duration: "20 นาที",
        status: "locked",
        type: "network",
      },
      {
        id: "ep-3-3",
        code: "EP 3.3",
        title: "MQTT",
        duration: "25 นาที",
        status: "locked",
        type: "protocol",
      },
      {
        id: "ep-3-4",
        code: "EP 3.4",
        title: "Publish / Subscribe / Topic",
        duration: "20 นาที",
        status: "locked",
        type: "hands_on",
      },
    ],
  },
  {
    id: "ch-4",
    sequence_no: 4,
    title: "Chapter 4: IoT Platform และ Data",
    description: "ระบบคลาวด์แพลตฟอร์ม ฐานข้อมูล และกระดานสรุปผลแสดงสถานะ",
    status: "locked",
    episodes: [
      {
        id: "ep-4-1",
        code: "EP 4.1",
        title: "IoT Platform",
        duration: "20 นาที",
        status: "locked",
        type: "platform",
      },
      {
        id: "ep-4-2",
        code: "EP 4.2",
        title: "Device Management",
        duration: "18 นาที",
        status: "locked",
        type: "platform",
      },
      {
        id: "ep-4-3",
        code: "EP 4.3",
        title: "Database",
        duration: "22 นาที",
        status: "locked",
        type: "data",
      },
      {
        id: "ep-4-4",
        code: "EP 4.4",
        title: "Dashboard",
        duration: "25 นาที",
        status: "locked",
        type: "dashboard",
      },
    ],
  },
  {
    id: "ch-5",
    sequence_no: 5,
    title: "Chapter 5: Automation และ Notification",
    description: "การตั้งกฎอัตโนมัติ ตารางเวลา และระบบแจ้งเตือนเมื่อเกิดเหตุผิดปกติ",
    status: "locked",
    episodes: [
      {
        id: "ep-5-1",
        code: "EP 5.1",
        title: "Automation",
        duration: "15 นาที",
        status: "locked",
        type: "automation",
      },
      {
        id: "ep-5-2",
        code: "EP 5.2",
        title: "IF / THEN",
        duration: "18 นาที",
        status: "locked",
        type: "rules",
      },
      {
        id: "ep-5-3",
        code: "EP 5.3",
        title: "Schedule",
        duration: "15 นาที",
        status: "locked",
        type: "schedule",
      },
      {
        id: "ep-5-4",
        code: "EP 5.4",
        title: "Notification",
        duration: "20 นาที",
        status: "locked",
        type: "notification",
      },
    ],
  },
  {
    id: "ch-6",
    sequence_no: 6,
    title: "Chapter 6: Analytics และ AI",
    description: "การวิเคราะห์แนวโน้มข้อมูล การตรวจจับความผิดปกติ และปัญญาประดิษฐ์",
    status: "locked",
    episodes: [
      {
        id: "ep-6-1",
        code: "EP 6.1",
        title: "IoT Data",
        duration: "18 นาที",
        status: "locked",
        type: "analytics",
      },
      {
        id: "ep-6-2",
        code: "EP 6.2",
        title: "Analytics",
        duration: "22 นาที",
        status: "locked",
        type: "analytics",
      },
      {
        id: "ep-6-3",
        code: "EP 6.3",
        title: "Anomaly Detection",
        duration: "25 นาที",
        status: "locked",
        type: "ai",
      },
      {
        id: "ep-6-4",
        code: "EP 6.4",
        title: "AI และ AIoT",
        duration: "30 นาที",
        status: "locked",
        type: "ai",
      },
    ],
  },
  {
    id: "ch-7",
    sequence_no: 7,
    title: "Chapter 7: Build Everything",
    description: "การรวมทุกส่วนประกอบเข้าด้วยกัน เพื่อสร้าง Smart City เต็มรูปแบบ",
    status: "locked",
    episodes: [
      {
        id: "ep-7-1",
        code: "EP 7.1",
        title: "รวมองค์ประกอบ IoT",
        duration: "25 นาที",
        status: "locked",
        type: "integration",
      },
      {
        id: "ep-7-2",
        code: "EP 7.2",
        title: "ออกแบบระบบ",
        duration: "30 นาที",
        status: "locked",
        type: "system_design",
      },
      {
        id: "ep-7-3",
        code: "EP 7.3",
        title: "Build Everything",
        duration: "40 นาที",
        status: "locked",
        type: "final_project",
      },
    ],
  },
];

// ฟังก์ชันค้นหา Episode และ Chapter จาก episodeId
export function getEpisodeById(episodeId) {
  for (const chapter of IOT_101_CHAPTERS) {
    const epIndex = chapter.episodes.findIndex((e) => e.id === episodeId);
    if (epIndex !== -1) {
      const episode = chapter.episodes[epIndex];
      // หา prev และ next episode
      let prevEp = null;
      let nextEp = null;

      // Flatten episodes to find overall prev and next
      const allEpisodes = IOT_101_CHAPTERS.flatMap((c) =>
        c.episodes.map((e) => ({ ...e, chapterTitle: c.title, chapterSeq: c.sequence_no }))
      );
      const overallIndex = allEpisodes.findIndex((e) => e.id === episodeId);
      if (overallIndex > 0) prevEp = allEpisodes[overallIndex - 1];
      if (overallIndex < allEpisodes.length - 1) nextEp = allEpisodes[overallIndex + 1];

      return {
        chapter,
        episode,
        prevEpisode: prevEp,
        nextEpisode: nextEp,
      };
    }
  }
  return null;
}

// Mock Content สำหรับการแสดงผลผ่าน ContentRenderer ใน LessonDetail
export function getMockContentsForEpisode(episodeId) {
  switch (episodeId) {
    case "ep-1-2":
      return [
        {
          content_id: "cnt-1-2-1",
          content_type: "text",
          content_data:
            "## ภารกิจตรวจวัดอากาศ: Temperature & Humidity Sensor\n\nยินดีต้อนรับสู่บทเรียน **EP 1.2** ในสวนเรียนรู้แห่งเมืองนาวา! สภาพภูมิอากาศในสวนมีความสำคัญต่อการเจริญเติบโตของพืชพรรณและคุณภาพอากาศของชาวเมือง\n\nในบทนี้ เราจะทำความรู้จักกับ **เซนเซอร์วัดอุณหภูมิและความชื้น** (DHT11 / DHT22) ซึ่งเป็นเซนเซอร์พื้นฐานที่นิยมที่สุดในระบบ Smart City",
        },
        {
          content_id: "cnt-1-2-2",
          content_type: "text",
          content_data:
            "### หลักการทำงาน\n\n- **Thermistor (NTC)**: ตัวต้านทานที่เปลี่ยนค่าตามอุณหภูมิ เมื่ออุณหภูมิสูงขึ้น ความต้านทานจะลดลง\n- **Capacitive Humidity Sensor**: สารตั้งต้นดูดซับความชื้นในอากาศ ทำให้ค่าความจุไฟฟ้า (Capacitance) เปลี่ยนแปลง\n- **ชิปประมวลผลภายใน**: ทำหน้าที่แปลงสัญญาณแอนะล็อกเป็นดิจิทัล และส่งข้อมูลผ่านสายสัญญาณเพียงเส้นเดียว (Single-bus Data Line)",
        },
        {
          content_id: "cnt-1-2-3",
          content_type: "code",
          content_data:
            "// ตัวอย่างโค้ดอ่านค่าอุณหภูมิและความชื้นด้วย ESP32\n#include <DHT.h>\n\n#define DHTPIN 4     // ขา GPIO4 บน ESP32\n#define DHTTYPE DHT22   // ชนิดเซนเซอร์ DHT22 (AM2302)\n\nDHT dht(DHTPIN, DHTTYPE);\n\nvoid setup() {\n  Serial.begin(115200);\n  Serial.println(F(\"เริ่มต้นระบบตรวจวัดสภาพอากาศเมืองนาวา...\"));\n  dht.begin();\n}\n\nvoid loop() {\n  delay(2000); // อ่านค่าทุกๆ 2 วินาที\n\n  float h = dht.readHumidity();\n  float t = dht.readTemperature();\n\n  if (isnan(h) || isnan(t)) {\n    Serial.println(F(\"❌ ไม่สามารถอ่านค่าจาก DHT เซนเซอร์ได้!\"));\n    return;\n  }\n\n  Serial.print(F(\"💧 ความชื้น: \"));\n  Serial.print(h);\n  Serial.print(F(\"%  🌡️ อุณหภูมิ: \"));\n  Serial.print(t);\n  Serial.println(F(\"°C\"));\n}",
        },
      ];

    case "ep-0-1":
      return [
        {
          content_id: "cnt-0-1-1",
          content_type: "text",
          content_data:
            "## เมืองนาวากำลังมีปัญหา\n\nเมืองนาวาเคยเป็นเมืองที่ร่มรื่นและสงบสุข แต่เมื่อเมืองเติบโตขึ้นอย่างรวดเร็ว ปัญหาที่ไม่คาดคิดก็เริ่มปรากฏขึ้น...\n\n1. การใช้น้ำและพลังงานอย่างสิ้นเปลือง\n2. สภาพอากาศและมลภาวะที่ตรวจวัดไม่ได้แบบ Real-time\n3. การจัดการพื้นที่สาธารณะและสวนเรียนรู้ที่ขาดประสิทธิภาพ",
        },
      ];

    case "ep-1-1":
      return [
        {
          content_id: "cnt-1-1-1",
          content_type: "text",
          content_data:
            "## Sensor คืออะไร?\n\nเซนเซอร์ (Sensor) หรืออุปกรณ์ตรวจจับ คืออุปกรณ์ที่ทำหน้าที่รับสัญญาณจากสภาพแวดล้อมทางกายภาพ เช่น แสง, อุณหภูมิ, ความชื้น, การเคลื่อนไหว แล้วแปลงให้เป็นสัญญาณไฟฟ้า (แอนะล็อกหรือดิจิทัล) เพื่อให้ไมโครคอนโทรลเลอร์สามารถประมวลผลได้",
        },
      ];

    default:
      return [
        {
          content_id: `cnt-${episodeId}-1`,
          content_type: "text",
          content_data:
            `## เนื้อหาบทเรียน: ${episodeId}\n\nบทเรียนนี้เป็นส่วนหนึ่งของหลักสูตร **IoT 101 — ภารกิจปลุกเมืองให้ฉลาด**\nผู้เรียนจะได้ศึกษาหลักการทำงานและการนำเทคโนโลยี IoT ไปประยุกต์ใช้งานจริงในสวนเรียนรู้แห่งเมืองนาวา`,
        },
      ];
  }
}
