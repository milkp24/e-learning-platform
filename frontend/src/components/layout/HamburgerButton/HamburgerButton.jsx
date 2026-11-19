/**
 * HamburgerButton Component
 * Unified standard hamburger button for all layouts (Guest, Student, Instructor, Admin)
 * Follows the Jade Design System: #E5E9E7 border, #26332F text, #ABD1C6/25 hover
 */
function HamburgerButton({
  onClick,
  ariaLabel = "Open sidebar menu",
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E9E7] bg-white text-[#26332F] hover:bg-[#ABD1C6]/25 transition cursor-pointer shadow-2xs ${className}`}
    >
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.2"
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>
  );
}

export default HamburgerButton;
