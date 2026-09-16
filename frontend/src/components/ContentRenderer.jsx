import React from "react";
import YouTubePlayer from "./YouTubePlayer";
import CodeBlock from "./CodeBlock";

// ======================================================
// ContentRenderer Component (ตัวแสดงผลเนื้อหาบทเรียน)
// รองรับ UAT-029, UAT-034 (Safe YouTube, Raw Code, PDF, Image, Rich Text)
// ======================================================

function ContentRenderer({ content }) {
  if (!content) return null;

  const { content_type, content_data, caption } = content;

  // ตรวจสอบว่าเป็น URL ของ YouTube หรือไม่
  const isYoutube =
    content_type === "youtube" ||
    (content_type === "video" &&
      content_data &&
      (content_data.includes("youtube.com") || content_data.includes("youtu.be")));

  if (isYoutube) {
    return <YouTubePlayer url={content_data} caption={caption} />;
  }

  switch (content_type) {
    // ----------------------------------------------------
    // 1. TEXT (ข้อความทั่วไป / Rich Text)
    // ----------------------------------------------------
    case "text":
      return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-2">
          {caption && (
            <h4 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2">
              📝 {caption}
            </h4>
          )}
          <div
            className="prose max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: content_data || "ไม่มีเนื้อหาข้อความ" }}
          />
        </div>
      );

    // ----------------------------------------------------
    // 2. VIDEO (วิดีโอจาก URL โดยตรง)
    // ----------------------------------------------------
    case "video":
      return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-black shadow-sm p-4 text-center">
          <video
            src={content_data}
            controls
            className="mx-auto max-h-[500px] w-full rounded-lg"
          >
            เบราว์เซอร์ของคุณไม่รองรับการเล่นวิดีโอโดยตรง
          </video>
          {caption && (
            <p className="mt-2 text-xs text-gray-400 italic">
              🎬 {caption}
            </p>
          )}
          <a
            href={content_data}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-xs text-gray-400 hover:text-white underline"
          >
            เปิดลิงก์วิดีโอต้นฉบับ ↗
          </a>
        </div>
      );

    // ----------------------------------------------------
    // 3. PDF (เอกสาร PDF จาก URL)
    // ----------------------------------------------------
    case "pdf":
      return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 text-2xl font-bold">
              📄
            </div>
            <div className="overflow-hidden">
              <h4 className="font-semibold text-gray-800 truncate">
                {caption || "เอกสารประกอบการเรียน (PDF)"}
              </h4>
              <p className="text-xs text-gray-500 truncate max-w-md">
                {content_data || "ไม่พบ URL ของเอกสาร"}
              </p>
            </div>
          </div>
          {content_data && (
            <a
              href={content_data}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#ABD1C6] px-5 py-2.5 text-sm font-bold text-[#20302C] transition hover:bg-[#9CC5B9]"
            >
              เปิดดูเอกสาร PDF ↗
            </a>
          )}
        </div>
      );

    // ----------------------------------------------------
    // 4. IMAGE (รูปภาพจาก URL)
    // ----------------------------------------------------
    case "image":
      return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm text-center">
          <img
            src={content_data}
            alt={caption || "Lesson content"}
            className="mx-auto max-h-[550px] w-auto rounded-xl object-contain"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/images/image-placeholder.svg";
            }}
          />
          {caption && (
            <p className="mt-2 text-xs text-gray-500 italic">
              🖼️ {caption}
            </p>
          )}
        </div>
      );

    // ----------------------------------------------------
    // 5. CODE (ซอร์สโค้ดดิบ Render ผ่าน CodeBlock)
    // ----------------------------------------------------
    case "code":
      return <CodeBlock code={content_data} caption={caption} />;

    default:
      return (
        <div className="rounded-xl border border-gray-200 p-4 text-sm text-gray-500">
          รูปแบบเนื้อหาไม่ถูกต้อง ({content_type})
        </div>
      );
  }
}

export default ContentRenderer;
