import TextBlockModal from "./TextBlockModal";
import ImageBlockModal from "./ImageBlockModal";
import FileBlockModal from "./FileBlockModal";
import VideoBlockModal from "./VideoBlockModal";
import YouTubeBlockModal from "./YouTubeBlockModal";

/**
 * ContentBlockModalManager Component
 * Consolidates the mounting and conditional rendering of the 5 Content Block Modals:
 * - "text"           -> TextBlockModal
 * - "image"          -> ImageBlockModal
 * - "file" | "pdf"   -> FileBlockModal
 * - "video"          -> VideoBlockModal
 * - "youtube"        -> YouTubeBlockModal
 */
function ContentBlockModalManager({
  activeBlockModal,
  onClose,
  onSave,
}) {
  const { isOpen = false, type = null, block = null } = activeBlockModal || {};

  if (!isOpen || !type) return null;

  switch (type) {
    case "text":
      return (
        <TextBlockModal
          isOpen={isOpen}
          initialData={block}
          onClose={onClose}
          onSave={onSave}
        />
      );

    case "image":
      return (
        <ImageBlockModal
          isOpen={isOpen}
          initialData={block}
          onClose={onClose}
          onSave={onSave}
        />
      );

    case "pdf":
    case "file":
      return (
        <FileBlockModal
          isOpen={isOpen}
          initialData={block}
          onClose={onClose}
          onSave={onSave}
        />
      );

    case "video":
      return (
        <VideoBlockModal
          isOpen={isOpen}
          initialData={block}
          onClose={onClose}
          onSave={onSave}
        />
      );

    case "youtube":
      return (
        <YouTubeBlockModal
          isOpen={isOpen}
          initialData={block}
          onClose={onClose}
          onSave={onSave}
        />
      );

    default:
      return null;
  }
}

export default ContentBlockModalManager;
