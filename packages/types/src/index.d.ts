/**
 * Common type definitions for Neon0.2 monorepo
 */
export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';
export type CampaignType = 'CONTENT_GENERATION' | 'AD_OPTIMIZATION' | 'B2B_OUTREACH' | 'TREND_ANALYSIS' | 'DESIGN_GENERATION';
export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'FAILED';
export interface BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface Config {
    environment: 'development' | 'production' | 'test';
    apiUrl: string;
    version: string;
}
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export interface BaseEvent {
    type: string;
    timestamp: Date;
    payload: Record<string, unknown>;
}
export interface AppError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}
export type Result<T, E = AppError> = {
    success: true;
    data: T;
} | {
    success: false;
    error: E;
};
export interface Logger {
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
    debug(message: string, meta?: Record<string, unknown>): void;
}
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}
export type AgentName = 'ContentAgent' | 'SEOAgent' | 'EmailMarketingAgent' | 'SocialPostingAgent' | 'CustomerSupportAgent' | 'AdAgent' | 'OutreachAgent' | 'TrendAgent' | 'InsightAgent' | 'DesignAgent';
export interface AgentAction {
    id: string;
    agent: AgentName;
    action: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    metadata?: Record<string, unknown>;
    createdAt: Date;
    completedAt?: Date;
}
export interface HealthStatus {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    version: string;
    environment: string;
    services: Record<string, 'healthy' | 'unhealthy'>;
    uptime: number;
    error?: string;
}
//# sourceMappingURL=index.d.ts.map