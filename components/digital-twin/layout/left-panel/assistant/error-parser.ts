import { ChatError } from './types';

/**
 * Parses various error types and formats them into a standardized ChatError object
 * @param error - The error to parse (can be GraphQL response, Response object, Error instance, or string)
 * @returns A standardized ChatError object with type, message, code, and retryability info
 */
export const parseError = (error: any): ChatError | null => {
  console.log('🔍 Error Parser: Parsing error:', error);
  console.log('🔍 Error type:', typeof error);
  console.log('🔍 Error keys:', error ? Object.keys(error) : 'null');
  
  // Ignore specific, non-critical errors
  if (error?.message?.includes('signal is aborted without reason')) {
    console.log('🔍 Ignoring abort error');
    return null; // Don't show a toast for this
  }
  
  // Handle GraphQL error responses (CopilotKit format)
  if (error && typeof error === 'object' && error.errors && Array.isArray(error.errors)) {
    console.log('🔍 GraphQL error detected:', error.errors);
    
    const firstError = error.errors[0];
    if (firstError) {
      // Check for originalError in extensions
      const originalError = firstError.extensions?.originalError;
      if (originalError?.message) {
        console.log('🔍 Original error message:', originalError.message);
        
        // Handle Google Gemini specific errors
        if (originalError.message.includes('models/gemini-2.5- is not found')) {
          return {
            type: 'SERVICE',
            message: 'AI model configuration error. The requested Gemini model is not available. Please contact support.',
            code: 'MODEL_NOT_FOUND',
            retryable: false
          };
        }
        
        if (originalError.message.includes('status code 404')) {
          return {
            type: 'SERVICE',
            message: 'AI service configuration error. The requested model or endpoint was not found.',
            code: 'SERVICE_NOT_FOUND',
            retryable: false
          };
        }
        
        if (originalError.message.includes('status code 429')) {
          return {
            type: 'RATE_LIMIT',
            message: 'Too many requests to AI service. Please wait a moment and try again.',
            code: 'RATE_LIMIT',
            retryable: true
          };
        }
        
        if (originalError.message.includes('status code 5')) {
          return {
            type: 'SERVICE',
            message: 'AI service is experiencing issues. Please try again in a moment.',
            code: 'SERVICE_ERROR',
            retryable: true
          };
        }
      }
      
      // Check extensions code
      if (firstError.extensions?.code) {
        const code = firstError.extensions.code;
        console.log('🔍 GraphQL error code:', code);
        
        if (code === 'INTERNAL_SERVER_ERROR') {
          return {
            type: 'SERVICE',
            message: 'AI service encountered an internal error. Please try again.',
            code: code,
            retryable: true
          };
        }
      }
      
      // Use the GraphQL error message
      return {
        type: 'SERVICE',
        message: firstError.message || 'AI service error occurred. Please try again.',
        code: firstError.extensions?.code || 'GRAPHQL_ERROR',
        retryable: true
      };
    }
  }
  
  // Handle Google Gemini specific errors from string responses
  if (typeof error === 'string') {
    if (error.includes('models/gemini-2.5- is not found')) {
      return {
        type: 'SERVICE',
        message: 'AI model configuration error. The requested model is not available.',
        code: 'MODEL_NOT_FOUND',
        retryable: false
      };
    }
    if (error.includes('INTERNAL_SERVER_ERROR')) {
      return {
        type: 'SERVICE',
        message: 'AI service is experiencing issues. Please try again in a moment.',
        code: 'INTERNAL_SERVER_ERROR',
        retryable: true
      };
    }
  }
  
  // Handle Response objects
  if (error instanceof Response) {
    const status = error.status;
    if (status === 404) {
      return {
        type: 'SERVICE',
        message: 'AI service endpoint not found. Please check your configuration.',
        code: `HTTP_${status}`,
        retryable: false
      };
    }
    if (status >= 500) {
      return {
        type: 'SERVICE',
        message: 'AI service is temporarily unavailable. Please try again later.',
        code: `HTTP_${status}`,
        retryable: true
      };
    }
    if (status === 429) {
      return {
        type: 'RATE_LIMIT',
        message: 'Too many requests. Please wait a moment and try again.',
        code: `HTTP_${status}`,
        retryable: true
      };
    }
  }
  
  // Handle network errors
  if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
    return {
      type: 'CONNECTION',
      message: 'Network error. Please check your internet connection.',
      retryable: true
    };
  }
  
  // Handle other error objects
  if (error?.message) {
    return {
      type: 'UNKNOWN',
      message: error.message,
      retryable: true
    };
  }
  
  // Fallback
  return {
    type: 'UNKNOWN',
    message: 'An unexpected error occurred. Please try again.',
    retryable: true
  };
}; 