/**
 * Environment Variable Validator and Fallback Handler
 * 
 * Provides centralized environment variable validation and fallback handling
 * for all NeonHub agents. Ensures graceful degradation when services are unavailable.
 */

import { logger } from '../logger';

export interface ServiceConfig {
  name: string;
  required: boolean;
  fallbackEnabled: boolean;
  testConnection?: () => Promise<boolean>;
}

export interface EnvValidationResult {
  isValid: boolean;
  missingRequired: string[];
  missingOptional: string[];
  availableServices: string[];
  fallbackServices: string[];
}

/**
 * Service configurations with their environment requirements
 */
export const SERVICE_CONFIGS: Record<string, ServiceConfig> = {
  // AI Services
  openai: {
    name: 'OpenAI',
    required: false, // Made optional with fallbacks
    fallbackEnabled: true,
  },
  anthropic: {
    name: 'Anthropic Claude',
    required: false,
    fallbackEnabled: true,
  },
  
  // Communication Services
  sendgrid: {
    name: 'SendGrid Email',
    required: false,
    fallbackEnabled: true,
  },
  twilio: {
    name: 'Twilio SMS/WhatsApp',
    required: false,
    fallbackEnabled: true,
  },
  
  // Social Media Services
  facebook: {
    name: 'Facebook/Meta',
    required: false,
    fallbackEnabled: true,
  },
  instagram: {
    name: 'Instagram',
    required: false,
    fallbackEnabled: true,
  },
  twitter: {
    name: 'Twitter/X',
    required: false,
    fallbackEnabled: true,
  },
  tiktok: {
    name: 'TikTok',
    required: false,
    fallbackEnabled: true,
  },
  
  // Voice Services
  deepgram: {
    name: 'Deepgram Speech',
    required: false,
    fallbackEnabled: true,
  },
  azure_speech: {
    name: 'Azure Speech',
    required: false,
    fallbackEnabled: true,
  },
  google_speech: {
    name: 'Google Speech',
    required: false,
    fallbackEnabled: true,
  },
  
  // Infrastructure
  database: {
    name: 'Database',
    required: true,
    fallbackEnabled: false,
  },
  redis: {
    name: 'Redis Cache',
    required: false,
    fallbackEnabled: true,
  },
};

/**
 * Environment variable mappings for each service
 */
export const ENV_MAPPINGS: Record<string, string[]> = {
  openai: ['OPENAI_API_KEY', 'OPENAI_ORG_ID'],
  anthropic: ['ANTHROPIC_API_KEY'],
  sendgrid: ['SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL'],
  twilio: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN'],
  facebook: ['FB_ACCESS_TOKEN', 'FACEBOOK_APP_ID', 'META_APP_ID'],
  instagram: ['INSTAGRAM_ACCESS_TOKEN', 'INSTAGRAM_CLIENT_ID'],
  twitter: ['TWITTER_API_KEY', 'TWITTER_ACCESS_TOKEN', 'TWITTER_API_SECRET'],
  tiktok: ['TIKTOK_API_KEY', 'TIKTOK_CLIENT_ID'],
  deepgram: ['DEEPGRAM_API_KEY'],
  azure_speech: ['AZURE_SPEECH_KEY'],
  google_speech: ['GOOGLE_SPEECH_KEY'],
  database: ['DATABASE_URL'],
  redis: ['REDIS_URL'],
};

/**
 * Check if a service is properly configured
 */
export function isServiceConfigured(serviceName: string): boolean {
  const envVars = ENV_MAPPINGS[serviceName];
  if (!envVars) return false;
  
  // For services with multiple env vars, check if at least one primary var exists
  if (serviceName === 'facebook') {
    return !!(process.env.FB_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN);
  }
  
  // For most services, check the primary environment variable
  const primaryVar = envVars[0];
  return !!process.env[primaryVar];
}

/**
 * Get available and fallback services
 */
export function validateEnvironment(): EnvValidationResult {
  const missingRequired: string[] = [];
  const missingOptional: string[] = [];
  const availableServices: string[] = [];
  const fallbackServices: string[] = [];
  
  Object.entries(SERVICE_CONFIGS).forEach(([serviceName, config]) => {
    const isConfigured = isServiceConfigured(serviceName);
    
    if (isConfigured) {
      availableServices.push(config.name);
    } else {
      if (config.required) {
        missingRequired.push(config.name);
      } else {
        missingOptional.push(config.name);
        if (config.fallbackEnabled) {
          fallbackServices.push(config.name);
        }
      }
    }
  });
  
  return {
    isValid: missingRequired.length === 0,
    missingRequired,
    missingOptional,
    availableServices,
    fallbackServices,
  };
}

/**
 * Get environment variable with fallback and logging
 */
export function getEnvWithFallback(
  key: string,
  fallback: string,
  serviceName?: string
): string {
  const value = process.env[key];
  
  if (!value) {
    const message = serviceName 
      ? `${serviceName}: ${key} not configured, using fallback mode`
      : `${key} not found, using fallback value`;
    
    logger.warn(message, { 
      envVar: key, 
      fallback: fallback.substring(0, 10) + '...', 
      service: serviceName 
    });
    
    return fallback;
  }
  
  return value;
}

/**
 * Check if environment variable exists and is not a mock value
 */
export function isValidApiKey(key: string): boolean {
  const value = process.env[key];
  if (!value) return false;
  
  // Check for common mock/test values
  const mockPatterns = [
    'mock_',
    'test_',
    'sk-test-',
    'your-api-key',
    'your-token',
    'placeholder',
  ];
  
  return !mockPatterns.some(pattern => 
    value.toLowerCase().includes(pattern.toLowerCase())
  );
}

/**
 * Log service availability status for debugging
 */
export function logServiceStatus(agentName: string): void {
  const validation = validateEnvironment();
  
  logger.info(`${agentName} Service Status`, {
    available: validation.availableServices,
    fallbacks: validation.fallbackServices,
    missing: validation.missingOptional,
    critical: validation.missingRequired,
  });
  
  if (validation.missingRequired.length > 0) {
    logger.error(`${agentName} Critical services missing`, {
      services: validation.missingRequired,
    });
  }
}

/**
 * Fallback message generator for degraded functionality
 */
export function getFallbackMessage(serviceName: string, operation: string): string {
  return `${serviceName} service unavailable - ${operation} running in limited mode. Please configure the required environment variables for full functionality.`;
}

/**
 * Create a graceful degradation wrapper for service calls
 */
export function withFallback<T>(
  serviceCall: () => Promise<T>,
  fallbackCall: () => T,
  serviceName: string,
  operation: string
): Promise<T> {
  return serviceCall().catch((error) => {
    logger.warn(`${serviceName} ${operation} failed, using fallback`, { error });
    return fallbackCall();
  });
}