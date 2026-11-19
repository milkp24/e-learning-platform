import {
  LuFileText,
  LuVideo,
  LuImage,
  LuFileSpreadsheet,
  LuFileArchive,
  LuDownload,
  LuExternalLink,
} from "react-icons/lu";
import YouTubePlayer from "../YouTubePlayer";
import CodeBlock from "../CodeBlock";

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
            <h4 className="flex items-center gap-1.5 text-sm font-bold text-gray-800 border-b border-gray-100 pb-2">
              <LuFileText className="h-4 w-4 text-[#004643]" aria-hidden="true" />
              <span>{caption}</span>
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
            <p className="mt-2 text-xs text-gray-400 italic flex items-center justify-center gap-1">
              <LuVideo className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
              <span>{caption}</span>
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
    // 3. PDF & ATTACHMENTS (เอกสาร PDF และเอกสารแนบ)
    // ----------------------------------------------------
    case "pdf":
    case "file": {
      const isDataUrl = content_data?.startsWith("data:");
      const isPdf = !caption || caption.toLowerCase().endsWith(".pdf") || content_data?.toLowerCase().includes(".pdf");
      const isSpreadsheet = caption?.toLowerCase().endsWith(".xlsx") || caption?.toLowerCase().endsWith(".xls") || caption?.toLowerCase().endsWith(".csv");
      const isArchive = caption?.toLowerCase().endsWith(".zip") || caption?.toLowerCase().endsWith(".rar");

      if (isPdf) {
        return (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 bg-[#FAFAFA] p-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 font-bold">
                  <LuFileText className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-gray-800 text-sm truncate">
                    {caption || "เอกสารประกอบการเรียน (PDF)"}
                  </h4>
                  <p className="text-xs text-gray-500 truncate max-w-md font-mono">
                    {isDataUrl ? "เอกสารแนบในระบบ" : content_data}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!isDataUrl && (
                  <a
                    href={content_data}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition shadow-2xs"
                  >
                    <LuExternalLink className="h-3.5 w-3.5" />
                    <span>เปิดดูในแท็บใหม่ ↗</span>
                  </a>
                )}
                <a
                  href={content_data}
                  download={caption || "document.pdf"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#ABD1C6] px-4 py-2 text-xs font-bold text-[#20302C] transition hover:bg-[#9CC5B9] shadow-2xs"
                >
                  <LuDownload className="h-3.5 w-3.5" />
                  <span>ดาวน์โหลด PDF</span>
                </a>
              </div>
            </div>
            <div className="p-3 sm:p-4 bg-gray-100/80">
              <iframe
                src={content_data}
                title={caption || "เอกสาร PDF"}
                className="w-full h-[550px] sm:h-[650px] rounded-xl border border-gray-200 bg-white shadow-inner"
              />
            </div>
          </div>
        );
      }

      return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-bold ${
                isSpreadsheet
                  ? "bg-emerald-50 text-emerald-600"
                  : isArchive
                  ? "bg-amber-50 text-amber-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {isSpreadsheet ? (
                <LuFileSpreadsheet className="h-6 w-6" aria-hidden="true" />
              ) : isArchive ? (
                <LuFileArchive className="h-6 w-6" aria-hidden="true" />
              ) : (
                <LuFileText className="h-6 w-6" aria-hidden="true" />
              )}
            </div>
            <div className="overflow-hidden min-w-0">
              <h4 className="font-semibold text-gray-800 truncate">
                {caption || "เอกสารแนบ"}
              </h4>
              <p className="text-xs text-gray-500 truncate max-w-md">
                {isDataUrl
                  ? "เอกสารแนบในระบบพร้อมดาวน์โหลด"
                  : content_data || "ไม่พบ URL ของเอกสาร"}
              </p>
            </div>
          </div>
          {content_data && (
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={content_data}
                download={caption || "attachment"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#ABD1C6] px-5 py-2.5 text-xs sm:text-sm font-bold text-[#20302C] transition hover:bg-[#9CC5B9]"
              >
                <LuDownload className="h-4 w-4" />
                <span>ดาวน์โหลดเอกสาร</span>
              </a>
            </div>
          )}
        </div>
      );
    }

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
            <p className="mt-2 text-xs text-gray-500 italic flex items-center justify-center gap-1">
              <LuImage className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
              <span>{caption}</span>
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
