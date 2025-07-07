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
    errorShape: import("@trpc/server").DefaultErrorShape;
    transformer: import("@trpc/server").DefaultDataTransformer;
}>, {
    getMetrics: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../trpc").Context;
            meta: object;
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: import("@trpc/server").DefaultDataTransformer;
        }>;
        _meta: object;
        _ctx_out: import("../trpc").Context;
        _input_in: {
            agentType?: string | undefined;
            period?: "daily" | "weekly" | "monthly" | undefined;
        };
        _input_out: {
            period: "daily" | "weekly" | "monthly";
            agentType?: string | undefined;
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
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: import("@trpc/server").DefaultDataTransformer;
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
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: import("@trpc/server").DefaultDataTransformer;
        }>;
        _meta: object;
        _ctx_out: import("../trpc").Context;
        _input_in: {
            monthlyLimit: number;
            warningThreshold?: number | undefined;
            criticalThreshold?: number | undefined;
            agentLimits?: Record<string, number> | undefined;
            autoShutoff?: boolean | undefined;
        };
        _input_out: {
            monthlyLimit: number;
            warningThreshold: number;
            criticalThreshold: number;
            autoShutoff: boolean;
            agentLimits?: Record<string, number> | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
        data: {
            updatedAt: Date;
            monthlyLimit: number;
            warningThreshold: number;
            criticalThreshold: number;
            autoShutoff: boolean;
            agentLimits?: Record<string, number> | undefined;
        };
        message: string;
    }>;
    getBudgetAlerts: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../trpc").Context;
            meta: object;
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: import("@trpc/server").DefaultDataTransformer;
        }>;
        _meta: object;
        _ctx_out: import("../trpc").Context;
        _input_in: {
            limit?: number | undefined;
            active?: boolean | undefined;
        };
        _input_out: {
            limit: number;
            active: boolean;
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
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: import("@trpc/server").DefaultDataTransformer;
        }>;
        _meta: object;
        _ctx_out: import("../trpc").Context;
        _input_in: {
            startDate: string;
            endDate: string;
            agentTypes?: string[] | undefined;
        };
        _input_out: {
            startDate: string;
            endDate: string;
            agentTypes?: string[] | undefined;
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
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: import("@trpc/server").DefaultDataTransformer;
        }>;
        _meta: object;
        _ctx_out: import("../trpc").Context;
        _input_in: {
            status?: "sent" | "draft" | "paid" | "overdue" | undefined;
            startDate?: string | undefined;
            endDate?: string | undefined;
            userId?: string | undefined;
            limit?: number | undefined;
            offset?: number | undefined;
        };
        _input_out: {
            limit: number;
            offset: number;
            status?: "sent" | "draft" | "paid" | "overdue" | undefined;
            startDate?: string | undefined;
            endDate?: string | undefined;
            userId?: string | undefined;
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
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: import("@trpc/server").DefaultDataTransformer;
        }>;
        _meta: object;
        _ctx_out: import("../trpc").Context;
        _input_in: {
            id: string;
        };
        _input_out: {
            id: string;
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
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: import("@trpc/server").DefaultDataTransformer;
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