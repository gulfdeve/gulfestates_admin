import DOMPurify from 'isomorphic-dompurify';

export const sanitizeHtml = (html: string | undefined | null): string => {
  if (!html || typeof html !== 'string') return '';
  
  // Use DOMPurify to sanitize HTML and prevent XSS attacks
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'b', 'i', 's', 'sub', 'sup',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'dl', 'dt', 'dd',
      'a', 'blockquote', 'pre', 'code', 'hr',
      'div', 'span', 'img', 'table', 'thead', 'tbody', 'tr', 'td', 'th'
    ],
    ALLOWED_ATTR: ['href', 'title', 'class', 'src', 'alt', 'width', 'height'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'style'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'onblur', 'style'],
    ALLOW_ARIA_ATTR: false,
    KEEP_CONTENT: true
  });
};


export const cleanHtmlContent = (html: string | undefined | null): string => {
  if (!html || typeof html !== 'string') return '';
  
  // Use DOMPurify to sanitize HTML and prevent XSS attacks
  // This replaces the insecure regex-based cleaning with proper HTML sanitization
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'b', 'i', 's', 'sub', 'sup',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'dl', 'dt', 'dd',
      'a', 'blockquote', 'pre', 'code', 'hr',
      'div', 'span', 'img', 'table', 'thead', 'tbody', 'tr', 'td', 'th'
    ],
    ALLOWED_ATTR: ['href', 'title', 'class', 'src', 'alt', 'width', 'height'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'style'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'onblur', 'style'],
    ALLOW_ARIA_ATTR: false,
    KEEP_CONTENT: true
  });
};

