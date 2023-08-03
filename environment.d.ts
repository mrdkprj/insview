declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV: "development" | "production";
            PORT?: string;
            TOKEN: string;
            USER_ID: string;
            COUNT: string;
            VERSION: string;
            QUERY_HASH: string;
            SECRET: string;
            AZ_ENDPOINT: string;
            AZ_KEY:string;
            AZ_DB_ID:string;
            ACCOUNT:string;
            API_URL:string;
            LOGIN_POINT: "Local" | "Remote";
            MOCK:string;
        }
    }
}

export {}