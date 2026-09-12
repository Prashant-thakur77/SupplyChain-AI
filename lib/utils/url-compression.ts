import pako from 'pako';

// Version prefix for future format changes
const COMPRESSION_VERSION = 'v1';
const VERSION_PREFIX = `${COMPRESSION_VERSION}:`;

/**
 * Converts regular base64 to URL-safe base64
 */
function toBase64Url(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Converts URL-safe base64 to regular base64
 */
function fromBase64Url(base64Url: string): string {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
  const padding = base64.length % 4;
  if (padding === 2) base64 += '==';
  if (padding === 3) base64 += '=';
  return base64;
}

/**
 * Compresses a JSON object to a URL-safe string
 */
export function compressUrlData(data: any): string {
  try {
    // Convert to JSON string
    const jsonString = JSON.stringify(data);
    
    // Compress using gzip
    const compressed = pako.gzip(jsonString);
    
    // Convert to base64 (handle large arrays safely)
    let binaryString = '';
    for (let i = 0; i < compressed.length; i++) {
      binaryString += String.fromCharCode(compressed[i]);
    }
    const base64 = btoa(binaryString);
    
    // Make URL-safe and add version prefix
    const urlSafe = toBase64Url(base64);
    
    return `${VERSION_PREFIX}${urlSafe}`;
  } catch (error) {
    console.error('Error compressing URL data:', error);
    throw new Error('Failed to compress URL data');
  }
}

/**
 * Decompresses a URL-safe string back to a JSON object
 */
export function decompressUrlData(compressedData: string): any {
  try {
    let dataToDecompress = compressedData;
    
    // Check for version prefix and remove it
    if (compressedData.startsWith(VERSION_PREFIX)) {
      dataToDecompress = compressedData.substring(VERSION_PREFIX.length);
    } else {
      // Fallback: try to decompress as-is for backward compatibility
      // If it fails, we'll try as uncompressed base64
      try {
        return JSON.parse(atob(fromBase64Url(compressedData)));
      } catch {
        // Continue with compression attempt
      }
    }
    
    // Convert from URL-safe base64
    const base64 = fromBase64Url(dataToDecompress);
    
    // Decode base64 to binary
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Decompress using gzip
    const decompressed = pako.ungzip(bytes, { to: 'string' });
    
    // Parse JSON
    return JSON.parse(decompressed);
  } catch (error) {
    console.error('Error decompressing URL data:', error);
    
    // Final fallback: try to parse as regular base64 JSON (backward compatibility)
    try {
      return JSON.parse(atob(compressedData));
    } catch (fallbackError) {
      console.error('Fallback decompression also failed:', fallbackError);
      throw new Error('Failed to decompress URL data');
    }
  }
}

/**
 * Calculates the compression ratio as a percentage
 */
export function getCompressionRatio(original: string, compressed: string): number {
  return Math.round((compressed.length / original.length) * 100);
}

/**
 * Checks if the data appears to be compressed (has version prefix)
 */
export function isCompressed(data: string): boolean {
  return data.startsWith(VERSION_PREFIX);
}

/**
 * Safely compresses arch data for URLs
 */
export function compressArchData(archData: any): string {
  if (!archData) return '';
  
  try {
    const compressed = compressUrlData(archData);
    const original = JSON.stringify(archData);
    const ratio = getCompressionRatio(original, compressed);
    
    console.log(`🗜️ URL compression: ${original.length} → ${compressed.length} chars (${ratio}% of original)`);
    
    return compressed;
  } catch (error) {
    console.error('Failed to compress arch data, using fallback:', error);
    // Fallback to base64 encoding without compression
    return btoa(JSON.stringify(archData));
  }
}

/**
 * Safely decompresses arch data from URLs
 */
export function decompressArchData(compressedData: string): any {
  if (!compressedData) return null;
  
  try {
    const decompressed = decompressUrlData(compressedData);
    console.log('✅ URL decompression successful');
    return decompressed;
  } catch (error) {
    console.error('Failed to decompress arch data:', error);
    throw error;
  }
}

export function storeArchInSession(id: string, arch: any): void {
  try {
    const key = `view-arch-${id}`;
    sessionStorage.setItem(key, JSON.stringify(arch));
  } catch (error) {
    // SessionStorage might be unavailable (e.g. Safari private mode)
    console.warn('⚠️  Unable to store architecture in sessionStorage:', error);
  }
} 