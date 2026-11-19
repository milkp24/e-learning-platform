/**
 * ข้อมูลสำหรับ Interactive E-learning หลักสูตร IoT 101 — ภารกิจปลุกเมืองให้ฉลาด
 * ประกอบด้วย:
 * 1. ข้อมูล 10 อุปกรณ์ (Component Collection)
 * 2. ข้อมูลแผนที่สวนเรียนรู้แห่งเมืองนาวา 6 จุด (Interactive Map)
 * 3. ข้อมูลพิมพ์เขียวระบบ 4 ระดับ (System Blueprint)
 * 4. ข้อมูลภารกิจและบทสนทนาประจำตอน (Missions & Story Scenes)
 * 5. ข้อมูลการจำลองระบบ (Simulation Data)
 */

// 1. คลังอุปกรณ์ 10 ชนิด (Component Collection)
export const IOT_COMPONENTS = [
  {
    id: "soil_moisture",
    name: "Soil Moisture Sensor",
    thaiName: "เซนเซอร์วัดความชื้นในดิน",
    category: "Sensor",
    description: "วัดปริมาณน้ำและความชื้นสัมพัทธ์ในดินบริเวณรากพืช เพื่อช่วยตัดสินใจรดน้ำ",
    unlockEpisodeId: "ep-1-1",
    unlockChapter: 1,
    icon: "🌱",
    signalType: "Analog / Digital",
    operatingVoltage: "3.3V - 5V",
  },
  {
    id: "temp_sensor",
    name: "Temperature Sensor",
    thaiName: "เซนเซอร์วัดอุณหภูมิ",
    category: "Sensor",
    description: "ตรวจวัดอุณหภูมิโดยรอบแปลงปลูกและเรือนเพาะชำเพื่อป้องกันความร้อนสะสม",
    unlockEpisodeId: "ep-1-2",
    unlockChapter: 1,
    icon: "🌡️",
    signalType: "Digital",
    operatingVoltage: "3.3V - 5V",
  },
  {
    id: "humidity_sensor",
    name: "Humidity Sensor",
    thaiName: "เซนเซอร์วัดความชื้นในอากาศ",
    category: "Sensor",
    description: "ตรวจวัดความชื้นสัมพัทธ์ในบรรยากาศรอบสวน เพื่อประเมินการคายน้ำของพืช",
    unlockEpisodeId: "ep-1-2",
    unlockChapter: 1,
    icon: "💧",
    signalType: "Digital",
    operatingVoltage: "3.3V - 5V",
  },
  {
    id: "motion_sensor",
    name: "Motion Sensor",
    thaiName: "เซนเซอร์ตรวจจับการเคลื่อนไหว",
    category: "Sensor",
    description: "ตรวจจับรังสีอินฟราเรดจากสิ่งมีชีวิต สำหรับเปิด-ปิดไฟทางเดินอัตโนมัติ",
    unlockEpisodeId: "ep-1-4",
    unlockChapter: 1,
    icon: "🚶",
    signalType: "Digital",
    operatingVoltage: "3.3V - 5V",
  },
  {
    id: "water_level_sensor",
    name: "Water Level Sensor",
    thaiName: "เซนเซอร์วัดระดับน้ำ",
    category: "Sensor",
    description: "ตรวจวัดความสูงของน้ำในถังเก็บ เพื่อป้องกันไม่ให้น้ำหมดหรือล้นถัง",
    unlockEpisodeId: "ep-1-4",
    unlockChapter: 1,
    icon: "📏",
    signalType: "Analog",
    operatingVoltage: "3.3V - 5V",
  },
  {
    id: "esp32",
    name: "ESP32",
    thaiName: "ไมโครคอนโทรลเลอร์ประมวลผล",
    category: "Controller",
    description: "สมองกลควบคุมระบบ มีหน่วยประมวลผล Dual-core พร้อม Wi-Fi และ Bluetooth ในตัว",
    unlockEpisodeId: "ep-2-2",
    unlockChapter: 2,
    icon: "🧠",
    signalType: "Microcontroller",
    operatingVoltage: "3.3V",
  },
  {
    id: "relay",
    name: "Relay",
    thaiName: "รีเลย์สวิตช์ไฟฟ้า",
    category: "Actuator",
    description: "สวิตช์ควบคุมวงจรไฟฟ้าแรงสูงโดยใช้สัญญาณแรงดันต่ำจาก ESP32 ในการตัดต่อ",
    unlockEpisodeId: "ep-2-4",
    unlockChapter: 2,
    icon: "⚡",
    signalType: "Switching",
    operatingVoltage: "5V Trigger",
  },
  {
    id: "pump",
    name: "Pump",
    thaiName: "ปั๊มน้ำขนาดกะทัดรัด",
    category: "Actuator",
    description: "ปั๊มส่งน้ำเพื่อส่งต่อไปยังหัวสปริงเกอร์และสายน้ำหยดในแปลงพืช",
    unlockEpisodeId: "ep-2-4",
    unlockChapter: 2,
    icon: "🚿",
    signalType: "Motor",
    operatingVoltage: "12V DC",
  },
  {
    id: "wifi",
    name: "Wi-Fi",
    thaiName: "โครงข่ายไร้สาย Wi-Fi",
    category: "Network",
    description: "ช่องทางการสื่อสารไร้สายความเร็วสูงเพื่อเชื่อมต่ออุปกรณ์เข้าสู่อินเทอร์เน็ต",
    unlockEpisodeId: "ep-3-2",
    unlockChapter: 3,
    icon: "📶",
    signalType: "2.4 GHz IEEE 802.11 b/g/n",
    operatingVoltage: "-",
  },
  {
    id: "mqtt",
    name: "MQTT",
    thaiName: "โปรโตคอลรับส่งข้อความ IoT",
    category: "Protocol",
    description: "โปรโตคอลสื่อสารแบบ Publish/Subscribe ที่ประหยัดพลังงานและปริมาณข้อมูลสูงสุด",
    unlockEpisodeId: "ep-3-3",
    unlockChapter: 3,
    icon: "📨",
    signalType: "TCP/IP Protocol",
    operatingVoltage: "-",
  },
];

// 2. แผนที่สวนเรียนรู้แห่งเมืองนาวา 6 จุด (Interactive Map Hotspots)
export const GARDEN_MAP_ZONES = [
  {
    id: "trees",
    name: "พื้นที่ต้นไม้และแปลงเกษตร",
    icon: "🌳",
    color: "#2E7D32",
    coordinates: { x: 26, y: 32 },
    problemTitle: "ต้นไม้บางส่วนเริ่มเหี่ยวเฉา",
    problemDescription:
      "ต้นไม้ในโซนแปลงปลูกเริ่มมีใบเหลืองเหี่ยวเฉา ดินดูแห้งผาก แต่เจ้าหน้าที่ไม่ทราบว่าขาดน้ำจริงหรือเกิดจากความร้อนสะสม",
    question: "เราต้องการรู้อะไรเพื่อหาสาเหตุที่แท้จริง?",
    options: [
      {
        id: "opt-1",
        text: "ความชื้นในดิน (Soil Moisture)",
        isCorrect: true,
        feedback:
          "ถูกต้อง! ดินบริเวณรากพืชต้องการความชื้นที่เหมาะสม การวัดความชื้นในดินจะทำให้เรารู้ทันทีว่าต้องรดน้ำเมื่อใด",
        recommendedComponent: "Soil Moisture Sensor",
      },
      {
        id: "opt-2",
        text: "อุณหภูมิในอากาศ (Temperature)",
        isCorrect: false,
        feedback:
          "อุณหภูมิเป็นปัจจัยร่วม แต่ความชื้นในดินบริเวณรากคือสิ่งที่บ่งชี้ว่าพืชขาดน้ำโดยตรง",
      },
      {
        id: "opt-3",
        text: "ระดับน้ำในแม่น้ำ (River Level)",
        isCorrect: false,
        feedback:
          "ระดับน้ำในแม่น้ำอยู่นอกแปลงปลูก ไม่สามารถบอกสภาพดินของต้นไม้ในสวนได้",
      },
    ],
  },
  {
    id: "tank",
    name: "ถังน้ำกลางสวน",
    icon: "💧",
    color: "#0288D1",
    coordinates: { x: 74, y: 28 },
    problemTitle: "น้ำในถังเก็บลดลงไม่ทราบปริมาณ",
    problemDescription:
      "ถังเก็บน้ำคอนกรีตขนาดใหญ่ทึบแสง เจ้าหน้าที่มองไม่เห็นระดับน้ำภายใน หลายครั้งน้ำหมดกะทันหันขณะรดน้ำ",
    question: "เราควรใช้อุปกรณ์ใดตรวจวัดปริมาณน้ำที่เหลืออยู่?",
    options: [
      {
        id: "opt-1",
        text: "เซนเซอร์วัดระดับน้ำ (Water Level Sensor)",
        isCorrect: true,
        feedback:
          "ถูกต้อง! เซนเซอร์วัดระดับน้ำจะช่วยตรวจจับความสูงของน้ำและเตือนก่อนน้ำหมดถัง",
        recommendedComponent: "Water Level Sensor",
      },
      {
        id: "opt-2",
        text: "เซนเซอร์วัดแสง (LDR Sensor)",
        isCorrect: false,
        feedback: "เซนเซอร์วัดแสงใช้วัดความสว่าง ไม่สามารถวัดระดับของเหลวได้",
      },
      {
        id: "opt-3",
        text: "เซนเซอร์วัดเสียง (Microphone Sensor)",
        isCorrect: false,
        feedback: "เสียงไม่สามารถสะท้อนความจุของเหลวได้อย่างแม่นยำ",
      },
    ],
  },
  {
    id: "classroom",
    name: "ห้องเรียนกลางแจ้ง",
    icon: "🏫",
    color: "#6A1B9A",
    coordinates: { x: 18, y: 72 },
    problemTitle: "อากาศร้อนอบอ้าวไม่เหมาะจัดกิจกรรม",
    problemDescription:
      "ห้องเรียนกลางแจ้งมีแดดส่องถึง อากาศอบอ้าวในบางช่วงเวลา ผู้เรียนต้องการข้อมูลสภาพอากาศและมลภาวะแบบ Real-time",
    question: "อุปกรณ์ใดช่วยตรวจสภาพอากาศในห้องเรียนได้ดีที่สุด?",
    options: [
      {
        id: "opt-1",
        text: "เซนเซอร์อุณหภูมิและความชื้น (DHT22)",
        isCorrect: true,
        feedback:
          "ถูกต้อง! DHT22 สามารถวัดทั้งอุณหภูมิและความชื้นสัมพัทธ์ในอากาศพร้อมกันได้อย่างแม่นยำ",
        recommendedComponent: "Temperature & Humidity Sensor",
      },
      {
        id: "opt-2",
        text: "รีเลย์สวิตช์ไฟฟ้า (Relay)",
        isCorrect: false,
        feedback: "รีเลย์เป็นอุปกรณ์สั่งการ ไม่ใช่อุปกรณ์ตรวจวัดสภาพแวดล้อม",
      },
    ],
  },
  {
    id: "lighting",
    name: "ระบบไฟส่องสว่างทางเดิน",
    icon: "💡",
    color: "#F57F17",
    coordinates: { x: 50, y: 55 },
    problemTitle: "ไฟทางเดินเปิดทิ้งไว้ตลอดคืนสิ้นเปลืองพลังงาน",
    problemDescription:
      "ไฟตามทางเดินในสวนเปิดตลอดคืนแม้ไม่มีคนเดินผ่าน ทำให้ค่าไฟและพลังงานแสงอาทิตย์หมดเร็ว",
    question: "เราควรใช้เทคโนโลยีใดเพื่อเปิดไฟเฉพาะตอนมีคนเดินผ่าน?",
    options: [
      {
        id: "opt-1",
        text: "เซนเซอร์ตรวจจับการเคลื่อนไหว (PIR Motion Sensor)",
        isCorrect: true,
        feedback:
          "ถูกต้อง! เซนเซอร์ตรวจจับความเคลื่อนไหวจะสั่งเปิดไฟอัตโนมัติเมื่อมีคนเดินผ่าน และดับลงเมื่อไม่มีคน",
        recommendedComponent: "Motion Sensor",
      },
      {
        id: "opt-2",
        text: "เซนเซอร์วัดความชื้นในดิน",
        isCorrect: false,
        feedback: "เซนเซอร์ความชื้นในดินใช้วัดดิน ไม่สามารถตรวจจับคนเดินได้",
      },
    ],
  },
  {
    id: "watering",
    name: "ระบบรดน้ำอัตโนมัติ",
    icon: "🚿",
    color: "#00796B",
    coordinates: { x: 42, y: 82 },
    problemTitle: "การรดน้ำยังต้องใช้คนเดินเปิดวาล์ว",
    problemDescription:
      "เจ้าหน้าที่ต้องเดินไปเปิดวาล์วด้วยตนเองทุกเช้า-เย็น หากติดธุระต้นไม้ก็จะขาดน้ำ",
    question: "สมองกลควรสั่งการอุปกรณ์ใดเพื่อเปิด-ปิดปั๊มน้ำแทนมนุษย์?",
    options: [
      {
        id: "opt-1",
        text: "รีเลย์ (Relay) ต่อร่วมกับ ปั๊มน้ำ (Pump)",
        isCorrect: true,
        feedback:
          "ถูกต้อง! ESP32 สามารถสั่งตัดต่อไฟผ่านรีเลย์เพื่อเปิด-ปิดปั๊มน้ำโดยอัตโนมัติตามความต้องการของต้นไม้",
        recommendedComponent: "Relay & Pump",
      },
      {
        id: "opt-2",
        text: "เซนเซอร์วัดอุณหภูมิ",
        isCorrect: false,
        feedback: "เซนเซอร์ทำได้แค่อ่านค่า แต่ไม่สามารถขับเคลื่อนน้ำได้",
      },
    ],
  },
  {
    id: "control_room",
    name: "ห้องควบคุมกลางและแดชบอร์ด",
    icon: "🖥️",
    color: "#37474F",
    coordinates: { x: 80, y: 78 },
    problemTitle: "ข้อมูลกระจัดกระจาย ไม่เห็นภาพรวมของสวน",
    problemDescription:
      "เซนเซอร์แต่ละจุดทำงานแยกกัน ไม่มีที่ใดรวบรวมข้อมูลเพื่อดูสถิติและสั่งการจากระยะไกลได้",
    question: "สถาปัตยกรรมใดช่วยรวบรวมข้อมูลขึ้นสู่หน้าจอแดชบอร์ดกลางได้?",
    options: [
      {
        id: "opt-1",
        text: "Wi-Fi + MQTT + IoT Platform + Dashboard",
        isCorrect: true,
        feedback:
          "ถูกต้อง! การส่งข้อมูลผ่าน MQTT ไปยัง IoT Platform และจัดเก็บลง Database จะทำให้แสดงผลบน Dashboard ได้แบบ Real-time",
        recommendedComponent: "Wi-Fi, MQTT & IoT Platform",
      },
      {
        id: "opt-2",
        text: "สายไฟต่อตรงเข้าหลอดไฟ",
        isCorrect: false,
        feedback: "สายไฟต่อตรงไม่สามารถส่งข้อมูลหรือแสดงกราฟสถิติได้",
      },
    ],
  },
];

// 3. พิมพ์เขียวระบบของฉัน (System Blueprint)
export const SYSTEM_BLUEPRINT_CHAPTERS = [
  {
    chapter: 1,
    title: "Chapter 1: การรับรู้โลกกายภาพ (Perception)",
    ability: "SENSE",
    abilityThai: "การรับรู้สภาพแวดล้อม",
    description: "ระบบเริ่มรับรู้และแปลงข้อมูลจากโลกจริงสู่ตัวเลขดิจิทัล",
    nodes: [
      { id: "world", label: "โลกจริง", subtitle: "ต้นไม้ / ดิน / อากาศ", icon: "🌱", status: "active" },
      { id: "sensor", label: "Sensor", subtitle: "DHT22 / Soil / PIR", icon: "📡", status: "active" },
      { id: "data", label: "Data", subtitle: "สัญญาณดิจิทัล", icon: "📊", status: "active" },
    ],
  },
  {
    chapter: 2,
    title: "Chapter 2: สมองกลและการสั่งการ (Automation)",
    ability: "ACTUATE",
    abilityThai: "การสั่งการอัตโนมัติ",
    description: "นำข้อมูลมาตัดสินใจตามเงื่อนไข และสั่งการอุปกรณ์ขับเคลื่อน",
    nodes: [
      { id: "sensor_ch2", label: "Sensor", subtitle: "ตรวจจับค่าจริง", icon: "📡", status: "active" },
      { id: "esp32", label: "ESP32", subtitle: "ไมโครคอนโทรลเลอร์", icon: "🧠", status: "active" },
      { id: "logic", label: "Logic", subtitle: "IF / THEN เงื่อนไข", icon: "⚖️", status: "active" },
      { id: "relay", label: "Relay", subtitle: "สวิตช์ไฟฟ้า", icon: "⚡", status: "active" },
      { id: "pump", label: "Pump", subtitle: "ปั๊มรดน้ำต้นไม้", icon: "🚿", status: "active" },
    ],
  },
  {
    chapter: 3,
    title: "Chapter 3: โครงข่ายและการสื่อสาร (Connectivity)",
    ability: "CONNECT",
    abilityThai: "การสื่อสารไร้สาย",
    description: "ส่งผ่านข้อมูลข้ามระยะทางด้วยโปรโตคอลมาตรฐาน IoT",
    nodes: [
      { id: "sensor_ch3", label: "Sensor", subtitle: "จุดตรวจวัด", icon: "📡", status: "active" },
      { id: "esp32_ch3", label: "ESP32", subtitle: "ส่งข้อมูล", icon: "🧠", status: "active" },
      { id: "wifi", label: "Wi-Fi", subtitle: "เครือข่ายไร้สาย", icon: "📶", status: "active" },
      { id: "mqtt", label: "MQTT", subtitle: "Publish/Subscribe", icon: "📨", status: "active" },
    ],
  },
  {
    chapter: 4,
    title: "Chapter 4: ศูนย์กลางข้อมูลและแดชบอร์ด (Platform & Analytics)",
    ability: "PLATFORM",
    abilityThai: "คลาวด์และแดชบอร์ด",
    description: "รวบรวม วิเคราะห์ และแสดงผลภาพรวมทั้งเมืองบนจอเดียว",
    nodes: [
      { id: "sensor_ch4", label: "Sensor", subtitle: "จุดตรวจวัด", icon: "📡", status: "active" },
      { id: "esp32_ch4", label: "ESP32", subtitle: "โหนดภาคสนาม", icon: "🧠", status: "active" },
      { id: "network_ch4", label: "Wi-Fi / MQTT", subtitle: "ช่องทางส่งข้อมูล", icon: "📨", status: "active" },
      { id: "platform", label: "IoT Platform", subtitle: "คลาวด์จัดการอุปกรณ์", icon: "☁️", status: "active" },
      { id: "database", label: "Database", subtitle: "บันทึกข้อมูลย้อนหลัง", icon: "🗄️", status: "active" },
      { id: "dashboard", label: "Dashboard", subtitle: "แสดงผล Real-time", icon: "🖥️", status: "active" },
    ],
  },
];

// 4. ข้อมูลภารกิจและบทเรียน (Missions & Story Scenes per Episode)
export const EPISODE_INTERACTIVE_DATA = {
  "ep-0-1": {
    episodeId: "ep-0-1",
    chapterId: "ch-0",
    story: {
      sceneName: "สวนเรียนรู้แห่งเมืองนาวา",
      sceneSubtitle: "ฉากแนะนำ: สวนเรียนรู้กำลังเผชิญหน้ากับความท้าทาย",
      characterName: "ไอโอ (Io)",
      characterAvatar: "🤖",
      characterRole: "หุ่นยนต์ผู้ช่วยดูแลสวนนาวา",
      dialogue:
        "“วันนี้มีบางอย่างผิดปกติในสวน... ต้นไม้บางแปลงเริ่มเหี่ยวเฉา น้ำในถังเก็บก็ไม่รู้ว่าเหลือเท่าไหร่ ระบบรดน้ำก็เปิดไม่ตรงเวลา เราต้องรีบสำรวจปัญหาและหาเทคโนโลยีที่เหมาะสมมาช่วยฟื้นฟูเมืองนาวากันเถอะ!”",
      environmentElements: [
        { label: "ต้นไม้", icon: "🌳", desc: "เริ่มมีใบเหี่ยวเฉา" },
        { label: "ถังน้ำ", icon: "💧", desc: "มองไม่เห็นระดับน้ำ" },
        { label: "ห้องเรียน", icon: "🏫", desc: "อากาศร้อนอบอ้าว" },
        { label: "ระบบไฟ", icon: "💡", desc: "เปิดทิ้งไว้ตลอดคืน" },
        { label: "ระบบรดน้ำ", icon: "🚿", desc: "ต้องใช้คนเปิดวาล์ว" },
        { label: "ห้องควบคุม", icon: "🖥️", desc: "ข้อมูลไม่เชื่อมต่อกัน" },
      ],
    },
    mission: {
      title: "ภารกิจ: สำรวจจุดผิดปกติในสวนเรียนรู้แห่งเมืองนาวา",
      target: "สำรวจทั้ง 6 จุดในสวน และระบุสาเหตุของปัญหาให้ครบถ้วน",
      problem: "เมืองนาวาขาดระบบตรวจวัดอัตโนมัติ ทำให้การจัดการทรัพยากรผิดพลาด",
      searchFor: "สิ่งที่จำเป็นต้องตรวจวัดเพื่อหาสาเหตุ (ความชื้น, อุณหภูมิ, ระดับน้ำ)",
      actions: "คลิกสำรวจพื้นที่ในแผนที่สวน และตอบคำถามเพื่อวิเคราะห์ความต้องการ",
      status: "completed",
    },
  },
  "ep-0-2": {
    episodeId: "ep-0-2",
    chapterId: "ch-0",
    story: {
      sceneName: "ห้องปฏิบัติการสมองกลเมืองนาวา",
      sceneSubtitle: "การเตรียมพร้อมของไอโอและเครื่องมือชิ้นแรก",
      characterName: "ไอโอ (Io)",
      characterAvatar: "🤖",
      characterRole: "หุ่นยนต์ผู้ช่วยดูแลสวนนาวา",
      dialogue:
        "“เราค้นพบปัญหาสำคัญแล้ว! ต่อไปนี้ เราจะเริ่มติดตั้งเซนเซอร์ชิ้นแรกเพื่อรับรู้สภาพแวดล้อม และเชื่อมต่อเข้ากับไมโครคอนโทรลเลอร์เพื่อสร้างระบบอัตโนมัติกัน!”",
      environmentElements: [
        { label: "โต๊ะทดลอง", icon: "🔬", desc: "เตรียมอุปกรณ์พร้อม" },
        { label: "แผงวงจร", icon: "🧩", desc: "ESP32 รหัสนาวา-01" },
        { label: "เซนเซอร์", icon: "📡", desc: "ชุดทดสอบแรกเริ่ม" },
      ],
    },
    mission: {
      title: "ภารกิจ: เตรียมพิมพ์เขียวระบบ IoT ฉบับแรก",
      target: "ทำความเข้าใจโครงสร้างพื้นฐานของระบบ IoT และขั้นตอนการพัฒนา",
      problem: "ยังไม่มีสถาปัตยกรรมระบบที่ชัดเจนสำหรับการแก้ปัญหาในสวน",
      searchFor: "บทบาทของเซนเซอร์ สมองกล เครือข่าย และแดชบอร์ด",
      actions: "ศึกษาโครงสร้างระบบ IoT และปลดล็อกพิมพ์เขียวระบบระดับที่ 1",
      status: "completed",
    },
  },
  "ep-1-1": {
    episodeId: "ep-1-1",
    chapterId: "ch-1",
    story: {
      sceneName: "แปลงปลูกต้นไม้ โซน A",
      sceneSubtitle: "การเลือกและติดตั้งเซนเซอร์วัดความชื้นในดิน",
      characterName: "ไอโอ (Io)",
      characterAvatar: "🤖",
      characterRole: "หุ่นยนต์ผู้ช่วยดูแลสวนนาวา",
      dialogue:
        "“ดินแห้งมากเลย! ถ้าเราอยากรู้ว่าต้นไม้ต้องการน้ำจริง ๆ หรือไม่ เราต้องปัก Soil Moisture Sensor ลงไปในระดับรากพืช ไม่ใช่แค่แตะบนผิวดินนะ มาลองปักเซนเซอร์กันเลย!”",
      environmentElements: [
        { label: "แปลงต้นไม้", icon: "🌿", desc: "ดินแห้งแตกระแหง" },
        { label: "เซนเซอร์ดิน", icon: "🌱", desc: "โพรบวัดความชื้น 2 ขา" },
        { label: "สายจัมเปอร์", icon: "🔌", desc: "เชื่อมต่อไปยังบอร์ด" },
      ],
    },
    mission: {
      title: "ภารกิจ: ปักเซนเซอร์ช่วยต้นไม้ก่อนที่จะสายเกินไป",
      target: "ติดตั้ง Soil Moisture Sensor ในตำแหน่งที่ถูกต้องเพื่อตรวจวัดน้ำในดิน",
      problem: "ไม่สามารถประเมินความชื้นในดินด้วยสายตา ทำให้ต้นไม้เหี่ยวเฉา",
      searchFor: "ตำแหน่งที่รากพืชดูดซึมน้ำจริงเพื่อหาค่าความชื้นที่แม่นยำที่สุด",
      actions: "ลากเซนเซอร์วัดความชื้นไปปักบริเวณรากพืชใต้ชั้นดิน",
      status: "completed",
    },
    activity: {
      type: "sensor_placement",
      title: "กิจกรรม: ลากเซนเซอร์ไปวางตำแหน่งที่เหมาะสม",
      instruction: "เลือกและลาก Soil Moisture Sensor ไปปักในจุดที่ต้องการตรวจวัดความชื้น",
      zones: [
        { id: "leaves", name: "บริเวณใบไม้", isCorrect: false, hint: "ใบไม้ไม่ได้ดูดซึมน้ำจากดิน ลองเลื่อนลงไปในชั้นดินดูนะ" },
        { id: "stem", name: "บริเวณลำต้น", isCorrect: false, hint: "ลำต้นอยู่เหนือดิน ความชื้นในดินต้องวัดในดินใต้พื้นผิว" },
        { id: "topsoil", name: "บริเวณผิวดิน", isCorrect: false, hint: "ผิวดินอาจแห้งเร็วจากลมแดด แต่รากพืชอยู่ลึกลงไปอีกนิด" },
        { id: "roots", name: "บริเวณรากพืช (Root Zone)", isCorrect: true, hint: "ยอดเยี่ยม! รากพืชเป็นจุดที่ดูดซึมน้ำ ปักตรงนี้จะได้ค่าความชื้นที่แม่นยำที่สุด!" },
      ],
    },
  },
  "ep-1-2": {
    episodeId: "ep-1-2",
    chapterId: "ch-1",
    story: {
      sceneName: "เรือนเพาะชำควบคุมอุณหภูมิ",
      sceneSubtitle: "การตรวจวัดสภาพอากาศด้วยเซนเซอร์ DHT22",
      characterName: "ไอโอ (Io)",
      characterAvatar: "🤖",
      characterRole: "หุ่นยนต์ผู้ช่วยดูแลสวนนาวา",
      dialogue:
        "“เรือนเพาะชำต้องการทั้งอุณหภูมิและความชื้นสัมพัทธ์ที่พอดี DHT22 มีชิปประมวลผลภายในที่แปลงสัญญาณเป็นดิจิทัลให้เราอ่านค่าได้แม่นยำ มาทดสอบอ่านค่ากันเถอะ!”",
      environmentElements: [
        { label: "เรือนเพาะชำ", icon: "🏡", desc: "อากาศร้อนชื้น" },
        { label: "DHT22", icon: "🌡️", desc: "เซนเซอร์สีขาว 4 ขา" },
        { label: "ESP32", icon: "🧠", desc: "ต่อขา GPIO4" },
      ],
    },
    mission: {
      title: "ภารกิจ: ตรวจวัดอุณหภูมิและความชื้นสัมพัทธ์ในเรือนเพาะชำ",
      target: "อ่านค่า Temperature (°C) และ Humidity (%) ผ่านเซนเซอร์ DHT22",
      problem: "อากาศในเรือนเพาะชำอาจร้อนเกินไปจนทำให้ต้นอ่อนเสียหาย",
      searchFor: "เกณฑ์อุณหภูมิที่เหมาะสม (25°C - 32°C) และความชื้นสัมพัทธ์ (60% - 80%)",
      actions: "ต่อวงจร DHT22 กับ ESP32 ขา GPIO4 และตรวจสอบค่าสัญญาณที่อ่านได้",
      status: "in_progress",
    },
  },
  "ep-1-3": {
    episodeId: "ep-1-3",
    chapterId: "ch-1",
    story: {
      sceneName: "แปลงปลูกพืชสวนครัว",
      sceneSubtitle: "การเปรียบเทียบค่าความชื้นดินแบบแอนะล็อก",
      characterName: "ไอโอ (Io)",
      characterAvatar: "🤖",
      characterRole: "หุ่นยนต์ผู้ช่วยดูแลสวนนาวา",
      dialogue:
        "“ค่าความชื้นดินที่เราอ่านได้เป็นสัญญาณแอนะล็อก 0-4095 ยิ่งค่าต่ำแสดงว่าดินยิ่งชื้น ยิ่งค่าสูงแสดงว่าดินแห้ง! เรามาตั้งค่า Calibrate กันนะ”",
      environmentElements: [
        { label: "ดินแห้ง", icon: "🏜️", desc: "ค่าแอนะล็อกสูง" },
        { label: "ดินชุ่มน้ำ", icon: "🌊", desc: "ค่าแอนะล็อกต่ำ" },
      ],
    },
    mission: {
      title: "ภารกิจ: ปรับเทียบค่าความชื้นดิน (Soil Calibration)",
      target: "แปลงค่าแอนะล็อก 0-4095 เป็นเปอร์เซ็นต์ความชื้น 0-100%",
      problem: "ค่าดิบจากเซนเซอร์เข้าใจยาก ต้องแปลงเป็นเปอร์เซ็นต์ที่มนุษย์เข้าใจได้",
      searchFor: "ค่าในอากาศ (แห้งสนิท) และค่าน้ำเปล่า (ชุ่ม 100%)",
      actions: "เขียนฟังก์ชัน `map()` ใน ESP32 เพื่อแปลงค่าสัญญาณ",
      status: "available",
    },
    activity: {
      type: "sensor_placement",
      title: "กิจกรรม: ตรวจสอบตำแหน่ง Soil Moisture Sensor",
      instruction: "เลือกจุดที่ควรปักเซนเซอร์เพื่อติดตามความชื้นแปลงผัก",
      zones: [
        { id: "leaves", name: "บนใบผัก", isCorrect: false, hint: "ใบผักใช้วัดไม่ได้จ้า" },
        { id: "topsoil", name: "ผิวหน้าดิน", isCorrect: false, hint: "ผิวดินแห้งเร็วเกินไป" },
        { id: "roots", name: "ชั้นดินระดับราก (ลึก 5-10 ซม.)", isCorrect: true, hint: "ถูกต้อง! ความลึก 5-10 ซม. วัดน้ำที่รากพืชดูดซึมได้จริง" },
      ],
    },
  },
  "ep-2-4": {
    episodeId: "ep-2-4",
    chapterId: "ch-2",
    story: {
      sceneName: "สถานีสูบน้ำอัตโนมัติ เมืองนาวา",
      sceneSubtitle: "การขับเคลื่อนปั๊มน้ำด้วยรีเลย์และการสร้างระบบ Automation",
      characterName: "ไอโอ (Io)",
      characterAvatar: "🤖",
      characterRole: "หุ่นยนต์ผู้ช่วยดูแลสวนนาวา",
      dialogue:
        "“เมื่อดินแห้งต่ำกว่า 30% ESP32 จะส่งคำสั่งให้รีเลย์สับสวิตช์เปิดปั๊มน้ำทันที! เมื่อน้ำไหลจนดินชุ่มถึง 35% ปั๊มก็จะหยุดทำงานโดยอัตโนมัติ มาทดลองจำลองการทำงานกันเลย!”",
      environmentElements: [
        { label: "ปั๊มน้ำ 12V", icon: "🚿", desc: "ต่อท่อน้ำหยด" },
        { label: "รีเลย์โมดูล", icon: "⚡", desc: "สวิตช์แยกไฟสูง-ต่ำ" },
        { label: "ESP32", icon: "🧠", desc: "ตรวจสอบเงื่อนไข" },
      ],
    },
    mission: {
      title: "ภารกิจ: ปลุกระบบรดน้ำอัตโนมัติด้วยรีเลย์และปั๊มน้ำ",
      target: "สร้างระบบควบคุมแบบปิด (Closed-loop Control) รดน้ำเมื่อดินแห้ง และหยุดเมื่อชุ่มชื้น",
      problem: "การเปิดปั๊มน้ำค้างไว้อาจทำให้ดินแฉะจนรากเน่าและสิ้นเปลืองน้ำ",
      searchFor: "เกณฑ์ตัดต่อการทำงาน (Hysteresis: เปิดเมื่อ <30%, ปิดเมื่อ >=35%)",
      actions: "กดปุ่มจำลองการทำงานเพื่อดู Data Flow และสั่งการปั๊มน้ำตามเงื่อนไข",
      status: "available",
    },
    simulation: {
      type: "pump_automation",
      title: "จำลองระบบรดน้ำอัตโนมัติ (Soil Moisture Automation Simulation)",
      initialMoisture: 18,
      thresholdLow: 30,
      thresholdHigh: 35,
    },
  },
};
