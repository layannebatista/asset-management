import 'dotenv/config';
export declare const config: {
    readonly service: {
        readonly port: number;
        readonly apiKey: string;
        readonly nodeEnv: string;
    };
    readonly openai: {
        readonly apiKey: string;
        readonly model: string;
        readonly fallbackModel: string;
        readonly maxTokens: number;
        readonly temperature: number;
    };
    readonly db: {
        readonly host: string;
        readonly port: number;
        readonly database: string;
        readonly user: string;
        readonly password: string;
    };
    readonly services: {
        readonly prometheusUrl: string;
        readonly allureUrl: string;
        readonly backendUrl: string;
        readonly grafanaUrl: string;
    };
    readonly github: {
        readonly token: string;
        readonly owner: string;
        readonly repo: string;
    };
    readonly cache: {
        readonly ttlSeconds: number;
    };
    readonly rateLimit: {
        readonly windowMs: number;
        readonly maxRequests: number;
    };
};
//# sourceMappingURL=index.d.ts.map