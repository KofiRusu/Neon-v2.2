interface BillingMetrics {
    totalCost: number;
    totalTokens: number;
    averageCostPerRun: number;
    costByAgentType: Record<string, number>;
    monthlyBudget: number;
    budgetUtilization: number;
    costTrends: Array<{
        date: string;
        cost: number;
        tokens: number;
    }>;
}
interface BudgetAlert {
    id: string;
    threshold: number;
    currentUtilization: number;
    alertType: "warning" | "critical" | "exceeded";
    message: string;
    timestamp: Date;
}
interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    agentType?: string;
    period: {
        start: Date;
        end: Date;
    };
}
interface Invoice {
    id: string;
    invoiceNumber: string;
    userId: string;
    period: {
        start: Date;
        end: Date;
    };
    items: InvoiceItem[];
    subtotal: number;
    tax: number;
    total: number;
    status: "draft" | "sent" | "paid" | "overdue";
    createdAt: Date;
    dueDate: Date;
    paidAt?: Date;
}
export declare const billingRouter: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
    ctx: import("../trpc").Context;
    meta: object;
    errorShape: never;
    transformer: import("@trpc/server").DataTransformerOptions;
}>, {
    getMetrics: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../trpc").Context;
            meta: object;
            errorShape: never;
            transformer: import("@trpc/server").DataTransformerOptions;
        }>;
        _meta: object;
        _ctx_out: import("../trpc").Context;
        _input_in: {
            agentType?: string;
            period?: "daily" | "weekly" | "monthly";
        };
        _input_out: {
            agentType?: string;
            period?: "daily" | "weekly" | "monthly";
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
        data: BillingMetrics;
    }>;
    getBudgetConfig: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../trpc").Context;
            meta: object;
            errorShape: never;
            transformer: import("@trpc/server").DataTransformerOptions;
        }>;
        _ctx_out: import("../trpc").Context;
        _input_in: typeof import("@trpc/server").unsetMarker;
        _input_out: typeof import("@trpc/server").unsetMarker;
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
        _meta: object;
    }, {
        success: boolean;
        data: {
            monthlyLimit: number;
            warningThreshold: number;
            criticalThreshold: number;
            agentLimits: {
                CONTENT: number;
                AD: number;
                SEO: number;
            };
            autoShutoff: boolean;
            currentUtilization: number;
            remainingBudget: number;
        };
    }>;
    updateBudgetConfig: import("@trpc/server").BuildProcedure<"mutation", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../trpc").Context;
            meta: object;
            errorShape: never;
            transformer: import("@trpc/server").DataTransformerOptions;
        }>;
        _meta: object;
        _ctx_out: import("../trpc").Context;
        _input_in: {
            monthlyLimit?: number;
            warningThreshold?: number;
            criticalThreshold?: number;
            agentLimits?: Record<string, number>;
            autoShutoff?: boolean;
        };
        _input_out: {
            monthlyLimit?: number;
            warningThreshold?: number;
            criticalThreshold?: number;
            agentLimits?: Record<string, number>;
            autoShutoff?: boolean;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
        data: {
            updatedAt: Date;
            monthlyLimit?: number;
            warningThreshold?: number;
            criticalThreshold?: number;
            agentLimits?: Record<string, number>;
            autoShutoff?: boolean;
        };
        message: string;
    }>;
    getBudgetAlerts: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../trpc").Context;
            meta: object;
            errorShape: never;
            transformer: import("@trpc/server").DataTransformerOptions;
        }>;
        _meta: object;
        _ctx_out: import("../trpc").Context;
        _input_in: {
            limit?: number;
            active?: boolean;
        };
        _input_out: {
            limit?: number;
            active?: boolean;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
        data: BudgetAlert[];
        total: number;
    }>;
    generateInvoice: import("@trpc/server").BuildProcedure<"mutation", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../trpc").Context;
            meta: object;
            errorShape: never;
            transformer: import("@trpc/server").DataTransformerOptions;
        }>;
        _meta: object;
        _ctx_out: import("../trpc").Context;
        _input_in: {
            startDate?: string;
            endDate?: string;
            agentTypes?: string[];
        };
        _input_out: {
            startDate?: string;
            endDate?: string;
            agentTypes?: string[];
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
        data: Invoice;
        message: string;
    }>;
    getInvoices: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../trpc").Context;
            meta: object;
            errorShape: never;
            transformer: import("@trpc/server").DataTransformerOptions;
        }>;
        _meta: object;
        _ctx_out: import("../trpc").Context;
        _input_in: {
            userId?: string;
            status?: "sent" | "draft" | "paid" | "overdue";
            startDate?: string;
            endDate?: string;
            limit?: number;
            offset?: number;
        };
        _input_out: {
            userId?: string;
            status?: "sent" | "draft" | "paid" | "overdue";
            startDate?: string;
            endDate?: string;
            limit?: number;
            offset?: number;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
        data: Invoice[];
        total: number;
        hasMore: boolean;
    }>;
    getInvoiceById: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../trpc").Context;
            meta: object;
            errorShape: never;
            transformer: import("@trpc/server").DataTransformerOptions;
        }>;
        _meta: object;
        _ctx_out: import("../trpc").Context;
        _input_in: {
            id?: string;
        };
        _input_out: {
            id?: string;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
        data: Invoice;
    }>;
    getOptimizationSuggestions: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../trpc").Context;
            meta: object;
            errorShape: never;
            transformer: import("@trpc/server").DataTransformerOptions;
        }>;
        _ctx_out: import("../trpc").Context;
        _input_in: typeof import("@trpc/server").unsetMarker;
        _input_out: typeof import("@trpc/server").unsetMarker;
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
        _meta: object;
    }, {
        success: boolean;
        data: {
            id: string;
            type: string;
            agentType: string;
            currentCost: number;
            projectedCost: number;
            savings: number;
            description: string;
            effort: string;
            impact: string;
        }[];
        totalSavings: number;
    }>;
}>;
export {};
//# sourceMappingURL=billing.d.ts.map