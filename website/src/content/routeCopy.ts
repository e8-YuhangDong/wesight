import { type Language } from './siteCopy';

export type RouteCopy = {
  common: {
    backHome: string;
    download: string;
    contact: string;
  };
  pricing: {
    metaTitle: string;
    metaDescription: string;
    eyebrow: string;
    title: string;
    body: string;
    status: string;
    cards: Array<{ title: string; body: string }>;
    guideTitle: string;
    guideBody: string;
    steps: string[];
  };
  profile: {
    metaTitle: string;
    metaDescription: string;
    eyebrow: string;
    title: string;
    body: string;
    noticeTitle: string;
    noticeBody: string;
    cards: Array<{ title: string; body: string }>;
  };
  notFound: {
    metaTitle: string;
    metaDescription: string;
    eyebrow: string;
    title: string;
    body: string;
  };
};

export const routeCopy: Record<Language, RouteCopy> = {
  en: {
    common: {
      backHome: 'Back to home',
      download: 'Download WeSight',
      contact: 'Contact us',
    },
    pricing: {
      metaTitle: 'WeSight Pricing - Plans in Preparation',
      metaDescription:
        'WeSight plans are in preparation. Download the desktop app and connect your own model provider API key today.',
      eyebrow: 'Pricing',
      title: 'WeSight plans are in preparation',
      body: 'The desktop app is available from GitHub Releases. You can use your own supported model provider and API key while we prepare hosted service plans.',
      status: 'Hosted plans coming later',
      cards: [
        {
          title: 'Open-source desktop app',
          body: 'Download current macOS builds and follow releases in the public GitHub repository.',
        },
        {
          title: 'Bring your own provider',
          body: 'Connect an OpenAI-compatible, Anthropic, Gemini, DeepSeek, Qwen, Ollama, or custom provider.',
        },
        {
          title: 'Talk to the team',
          body: 'For team use, partnerships, or service questions, reach us at hello@wesight.ai.',
        },
      ],
      guideTitle: 'Use a custom API key',
      guideBody:
        'Provider credentials are configured in the desktop client. This website does not receive those credentials.',
      steps: [
        'Download and open the latest WeSight desktop release.',
        'Open Settings, choose Model Providers, and add your provider details.',
        'Select the configured model in a task and start your agent workflow.',
      ],
    },
    profile: {
      metaTitle: 'WeSight Account - Open the Desktop App',
      metaDescription:
        'Open the WeSight desktop app to view account details, usage, and available quota.',
      eyebrow: 'Account',
      title: 'View account details in the desktop app',
      body: 'Account information and usage belong to your authenticated desktop session. Open WeSight on your computer to review the current account and available quota.',
      noticeTitle: 'Web account access is not enabled',
      noticeBody:
        'This page does not read Electron tokens, local sessions, account records, or quota data.',
      cards: [
        {
          title: 'Account and quota',
          body: 'Open the desktop app and visit the account area to view the latest information.',
        },
        {
          title: 'Local configuration',
          body: 'Model providers, keys, sessions, and local settings stay within the desktop workflow.',
        },
        {
          title: 'Need help?',
          body: 'Contact hello@wesight.ai and include the desktop version you are using.',
        },
      ],
    },
    notFound: {
      metaTitle: 'Page Not Found - WeSight',
      metaDescription: 'The requested WeSight page could not be found.',
      eyebrow: '404',
      title: 'This page has left the workspace',
      body: 'The address may have changed. Return to the WeSight home page or download the desktop app.',
    },
  },
  zh: {
    common: {
      backHome: '返回首页',
      download: '下载 WeSight',
      contact: '联系我们',
    },
    pricing: {
      metaTitle: 'WeSight 服务 - 套餐筹备中',
      metaDescription:
        'WeSight 服务套餐仍在筹备，你现在可以下载桌面客户端并接入自己的模型 API Key。',
      eyebrow: '服务',
      title: 'WeSight 套餐仍在筹备',
      body: '桌面客户端已通过 GitHub Releases 提供下载。在托管服务上线前，你可以接入受支持的模型供应商和自己的 API Key。',
      status: '托管套餐稍后推出',
      cards: [
        {
          title: '开源桌面客户端',
          body: '下载当前 macOS 版本，并在公开 GitHub 仓库关注后续发布。',
        },
        {
          title: '接入自己的供应商',
          body: '支持 OpenAI-compatible、Anthropic、Gemini、DeepSeek、Qwen、Ollama 和自定义供应商。',
        },
        {
          title: '联系团队',
          body: '团队使用、合作或服务咨询，请发送邮件至 hello@wesight.ai。',
        },
      ],
      guideTitle: '使用自定义 API Key',
      guideBody: '供应商凭据在桌面客户端内配置，官网不会接收这些凭据。',
      steps: [
        '下载并打开最新 WeSight 桌面版本。',
        '进入设置，选择模型供应商，添加供应商信息。',
        '在任务中选择已配置的模型，开始 Agent 工作流。',
      ],
    },
    profile: {
      metaTitle: 'WeSight 账户 - 请打开桌面客户端',
      metaDescription: '请在 WeSight 桌面客户端查看账户信息、用量和可用额度。',
      eyebrow: '账户',
      title: '请在桌面客户端查看账户信息',
      body: '账户信息与用量属于你已登录的桌面会话。请在电脑上打开 WeSight，查看当前账户与可用额度。',
      noticeTitle: '网页账户功能暂未开放',
      noticeBody: '此页面不会读取 Electron Token、本地会话、账户记录或额度数据。',
      cards: [
        {
          title: '账户与额度',
          body: '打开桌面客户端并进入账户区域，查看最新信息。',
        },
        {
          title: '本地配置',
          body: '模型供应商、密钥、会话和本地设置都留在桌面工作流中。',
        },
        {
          title: '需要帮助？',
          body: '请联系 hello@wesight.ai，并附上你正在使用的桌面版本。',
        },
      ],
    },
    notFound: {
      metaTitle: '页面未找到 - WeSight',
      metaDescription: '没有找到你访问的 WeSight 页面。',
      eyebrow: '404',
      title: '这个页面已经离开工作区',
      body: '页面地址可能已调整。你可以返回 WeSight 首页，或下载桌面客户端。',
    },
  },
};
