import { useState } from "react";
import { LuCheck, LuCopy } from "react-icons/lu";

// ======================================================
// CodeBlock Component (แสดงผลซอร์สโค้ดอย่างปลอดภัย)
// รองรับ UAT-034: Type-Specific Sanitization for Code
// ======================================================
// โค้ดจะถูกเรนเดอร์เป็น Text ธรรมดา (Escaped Text) ไม่มีการตีความเป็น HTML หรือ Script
// มีปุ่มคัดลอกโค้ด (Copy) ให้ผู้เรียนใช้งานได้สะดวก
// ======================================================

function CodeBlock({ code, language = "plaintext", caption }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-800 bg-[#1E1E1E] text-gray-200 shadow-md">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-gray-700/60 bg-[#252526] px-4 py-2 text-xs font-mono text-gray-400">
        <span>{caption || language || "Code"}</span>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold transition hover:bg-gray-700 text-gray-300 active:scale-95 cursor-pointer"
        >
          {copied ? (
            <>
              <LuCheck className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              <span>คัดลอกแล้ว!</span>
            </>
          ) : (
            <>
              <LuCopy className="h-3.5 w-3.5" aria-hidden="true" />
              <span>คัดลอกโค้ด</span>
            </>
          )}
        </button>
      </div>

      {/* Code Area */}
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default CodeBlock;
