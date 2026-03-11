// Dangerous executable/script extensions - block for security
export const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.scr', '.vbs', '.wsf', '.ps1',
  '.sh', '.bash', '.zsh', '.csh',
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  '.php', '.php3', '.php4', '.php5', '.php7', '.php8', '.phtml',
  '.py', '.pyc', '.pyw', '.pyo', '.pyd',
  '.rb', '.rbw', '.pl', '.pm', '.cgi',
  '.asp', '.aspx', '.jsp', '.jspx',
  '.html', '.htm', '.xhtml', '.shtml',
  '.dll', '.so', '.dylib', '.sys', '.drv', '.bin',
  '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz',
  '.jar', '.war', '.ear', '.sar',
  '.msi', '.deb', '.rpm', '.pkg', '.dmg', '.app', '.apk', '.ipa',
  '.swf', '.fla', '.action', '.vb', '.vbe', '.ws', '.wsf', '.wsc', '.wsh',
  '.scpt', '.applescript', '.lnk', '.url', '.reg',
];

export const isDangerousFile = (filename: string): boolean => {
  const ext = '.' + (filename.split('.').pop() || '').toLowerCase();
  return DANGEROUS_EXTENSIONS.includes(ext);
};

// File validation constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB for images
export const MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10MB for videos
export const MAX_MAIN_IMAGE_SIZE = 1 * 1024 * 1024; // 1MB for main image
export const MAX_ADDITIONAL_IMAGES_SIZE = 15 * 1024 * 1024; // 15MB total for additional images
export const MAX_ADDITIONAL_IMAGES_COUNT = 20; // Max 20 additional images
export const MAX_DOCUMENT_SIZE = 15 * 1024 * 1024; // 15MB for documents

// Allowed image MIME types (matches backend: JPEG, JPG, PNG, WEBP, AVIF, GIF)
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif'
];

// Allowed document MIME types (for PDFs, etc.)
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf'
];

export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
export const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov'];

export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Block executable and dangerous files
  if (isDangerousFile(file.name)) {
    return { valid: false, error: 'Executable and script files are not allowed for security reasons.' };
  }

  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: `Invalid file type. Only JPG, JPEG, PNG, WEBP, AVIF, and GIF images are allowed (max 5MB).` 
    };
  }

  // Check file size
  if (file.size > MAX_IMAGE_SIZE) {
    const maxSizeMB = MAX_IMAGE_SIZE / (1024 * 1024);
    return { 
      valid: false, 
      error: `File size exceeds ${maxSizeMB}MB limit. File size: ${(file.size / (1024 * 1024)).toFixed(2)}MB` 
    };
  }

  // Check if file is empty
  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  return { valid: true };
};

export const validateVideoFile = (file: File): { valid: boolean; error?: string } => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Block executable and dangerous files
  if (isDangerousFile(file.name)) {
    return { valid: false, error: 'Executable and script files are not allowed for security reasons.' };
  }

  const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
  if (!ALLOWED_VIDEO_EXTENSIONS.includes(ext) || !ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid video format. Only MP4, WebM, OGG, or QuickTime video allowed.' };
  }

  if (file.size > MAX_VIDEO_SIZE) {
    return {
      valid: false,
      error: `Video size exceeds 10MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  return { valid: true };
};

export const validateDocumentFile = (file: File): { valid: boolean; error?: string } => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Block executable and dangerous files
  if (isDangerousFile(file.name)) {
    return { valid: false, error: 'Executable and script files are not allowed for security reasons.' };
  }

  // Check file extension (more reliable than MIME type)
  const fileName = file.name.toLowerCase();
  const hasValidExtension = fileName.endsWith('.pdf');
  
  // Check MIME type
  const hasValidMimeType = ALLOWED_DOCUMENT_TYPES.includes(file.type);
  
  // Require both extension and MIME type to be valid
  if (!hasValidExtension || !hasValidMimeType) {
    return { 
      valid: false, 
      error: `Invalid file type. Only PDF files are allowed.` 
    };
  }

  // Check file size
  if (file.size > MAX_DOCUMENT_SIZE) {
    const maxSizeMB = MAX_DOCUMENT_SIZE / (1024 * 1024);
    return { 
      valid: false, 
      error: `File size exceeds ${maxSizeMB}MB limit. File size: ${(file.size / (1024 * 1024)).toFixed(2)}MB` 
    };
  }

  // Check if file is empty
  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  return { valid: true };
};

export const validateImageFiles = (files: FileList | File[]): { 
  valid: boolean; 
  validFiles: File[]; 
  errors: string[] 
} => {
  const fileArray = Array.from(files);
  const validFiles: File[] = [];
  const errors: string[] = [];

  fileArray.forEach((file, index) => {
    const validation = validateImageFile(file);
    if (validation.valid) {
      validFiles.push(file);
    } else {
      errors.push(`File ${index + 1} (${file.name}): ${validation.error}`);
    }
  });

  return {
    valid: errors.length === 0,
    validFiles,
    errors
  };
};

// Validate main image (single image, max 1MB)
export const validateMainImage = (file: File): { valid: boolean; error?: string } => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: `Invalid file type. Only JPG, JPEG, PNG, WEBP, AVIF, and GIF images are allowed.` 
    };
  }

  // Check file size (1MB max)
  if (file.size > MAX_MAIN_IMAGE_SIZE) {
    return { 
      valid: false, 
      error: `Main image size exceeds 1MB limit. File size: ${(file.size / (1024 * 1024)).toFixed(2)}MB` 
    };
  }

  // Check if file is empty
  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  return { valid: true };
};

// Validate QR Image (single image, max 1MB, optional)
export const validateQRImage = (file: File): { valid: boolean; error?: string } => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: `Invalid file type. Only JPG, JPEG, PNG, WEBP, AVIF, and GIF images are allowed.` 
    };
  }

  // Check file size (1MB max)
  if (file.size > MAX_MAIN_IMAGE_SIZE) {
    return { 
      valid: false, 
      error: `QR image size exceeds 1MB limit. File size: ${(file.size / (1024 * 1024)).toFixed(2)}MB` 
    };
  }

  // Check if file is empty
  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  return { valid: true };
};

// Validate additional images (max 20 images, total max 15MB)
export const validateAdditionalImages = (files: FileList | File[]): { 
  valid: boolean; 
  validFiles: File[]; 
  errors: string[] 
} => {
  const fileArray = Array.from(files);
  const validFiles: File[] = [];
  const errors: string[] = [];

  // Check count limit
  if (fileArray.length > MAX_ADDITIONAL_IMAGES_COUNT) {
    errors.push(`Maximum ${MAX_ADDITIONAL_IMAGES_COUNT} images allowed. You selected ${fileArray.length} images.`);
    return {
      valid: false,
      validFiles: [],
      errors
    };
  }

  // Validate each file and calculate total size
  let totalSize = 0;
  fileArray.forEach((file, index) => {
    // Check file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      errors.push(`Image ${index + 1} (${file.name}): Invalid file type. Only JPG, JPEG, PNG, WEBP, AVIF, and GIF images are allowed.`);
      return;
    }

    // Check individual file size (should be reasonable)
    if (file.size === 0) {
      errors.push(`Image ${index + 1} (${file.name}): File is empty`);
      return;
    }

    totalSize += file.size;
    validFiles.push(file);
  });

  // Check total size limit
  if (totalSize > MAX_ADDITIONAL_IMAGES_SIZE) {
    errors.push(`Total size of all images exceeds 15MB limit. Total size: ${(totalSize / (1024 * 1024)).toFixed(2)}MB`);
    return {
      valid: false,
      validFiles: [],
      errors
    };
  }

  return {
    valid: errors.length === 0,
    validFiles,
    errors
  };
};

