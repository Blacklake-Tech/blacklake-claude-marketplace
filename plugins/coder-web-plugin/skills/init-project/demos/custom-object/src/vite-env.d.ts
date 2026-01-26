/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_API_BASE_URL?: string; // API 基础 URL
  // 在这里添加其他环境变量类型
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

