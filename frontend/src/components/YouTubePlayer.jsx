import React from "react";

// ======================================================
// YouTubePlayer Component (เล่นวิดีโอ YouTube อย่างปลอดภัย)
// รองรับ UAT-034: Safe YouTube Embed & Sandbox Security
// ======================================================
// - ใช้โดเมน youtube-nocookie.com เพื่อป้องกันการติดตามข้อมูลคุกกี้ของผู้เรียน
// - กำหนด sandbox เพื่อจำกัดการเข้าถึงความปลอดภัยของเบราว์เซอร์
// ======================================================

function YouTubePlayer({ url, caption }) {
  // สกัด Video ID
  const extractVideoId = (inputUrl) => {
    if (!inputUrl) return null;
    const match = inputUrl.match(
      /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
    );
    return match ? match[1] : null;
  };

  const videoId = extractVideoId(url);

  if (!videoId) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
        ⚠️ URL วิดีโอ YouTube ไม่ถูกต้อง ({url || "ไม่ระบุ"})
      </div>
    );
  }

  const safeEmbedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative w-full overflow-hidden rounded-2xl bg-black pt-[56.25%] shadow-md">
        <iframe
          src={safeEmbedUrl}
          title={caption || "YouTube video player"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-presentation"
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
      {caption && (
        <p className="text-xs text-gray-500 italic text-center">
          📹 {caption}
        </p>
      )}
    </div>
  );
}

export default YouTubePlayer;
