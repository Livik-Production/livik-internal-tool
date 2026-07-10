'use client';

/**
 * HyperlinkButton — Centralized hyperlink-style interactive element.
 * Renders as <a> when `href` is provided, otherwise as a <button>.
 *
 * Props:
 *  - onClick    : click handler (for button mode)
 *  - href       : URL (renders as <a> tag)
 *  - children   : content
 *  - className  : extra classes appended on top of base styles
 *  - title      : tooltip
 *  - type       : button type (default "button")
 *  - disabled   : disables the element
 */
const HyperlinkButton = ({
  onClick,
  href,
  children,
  className = '',
  title,
  type = 'button',
  disabled = false,
  ...rest
}) => {
  const baseClass =
    'text-[#004475] hover:text-[#33a8d9] hover:underline font-medium cursor-pointer transition-colors';

  if (href) {
    return (
      <a
        href={href}
        className={`${baseClass} ${className}`}
        title={title}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClass} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      title={title}
      {...rest}
    >
      {children}
    </button>
  );
};

export default HyperlinkButton;
