import { useState } from "react";
import PropTypes from "prop-types";

/**
 * CenteredIllustration Component
 * คอมโพเนนต์มาตรฐานสำหรับจัดวางรูปภาพ, ภาพประกอบ (Illustration) หรือ SVG ให้อยู่กึ่งกลางเสมอ
 * 
 * วัตถุประสงค์:
 * 1. ควบคุม Visual Center และ Mathematical Center ให้ตรงกันผ่าน Flexbox Container
 * 2. จัดการ Object Fit (contain สำหรับภาพวาด/ไอคอน, cover สำหรับภาพหน้าปก)
 * 3. จัดการ Error Fallback ป้องกันภาพแตกหรือพื้นที่ว่างผิดรูปเมื่อโหลดรูปไม่สำเร็จ
 */
function CenteredIllustration({
  src,
  alt = "Illustration",
  fallbackSrc = "/images/classroom-default.svg",
  fit = "contain",
  className = "w-48 h-48",
  imageClassName = "",
  aspectRatio = "",
  containerClassName = "",
  onClick,
  ...rest
}) {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);
  const [hasError, setHasError] = useState(false);

  // เมื่อ src เปลี่ยน ให้รีเซ็ตสถานะรูปภาพ
  if (src && src !== imgSrc && !hasError) {
    setImgSrc(src);
  }

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc);
    }
  };

  const fitClass = fit === "cover" ? "object-cover object-center" : "object-contain object-center";

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${containerClassName}`}
      onClick={onClick}
    >
      <img
        src={imgSrc}
        alt={alt}
        onError={handleError}
        className={`max-w-full max-h-full ${fitClass} ${aspectRatio} ${className} ${imageClassName}`}
        loading="lazy"
        {...rest}
      />
    </div>
  );
}

CenteredIllustration.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  fallbackSrc: PropTypes.string,
  fit: PropTypes.oneOf(["contain", "cover", "fill", "none"]),
  className: PropTypes.string,
  imageClassName: PropTypes.string,
  aspectRatio: PropTypes.string,
  containerClassName: PropTypes.string,
  onClick: PropTypes.func,
};

export default CenteredIllustration;
