import {
  Apple,
  Boxes,
  Clock3,
  Code2,
  Database,
  Github,
  LockKeyhole,
  MessageSquareText,
  Scale,
  Settings2,
  ShieldCheck,
  TerminalSquare,
} from 'lucide-react';

export const repoUrl = 'https://github.com/freestylefly/wesight';
export const releaseUrl = 'https://github.com/freestylefly/wesight/releases/latest';
export const docsUrl = 'https://github.com/freestylefly/wesight#readme';
export const logoUrl = '/logo.png';

export const productImages = {
  workspace: '/product/hero-workspace.png',
  conversation: '/product/conversation-workspace.png',
  pet: '/product/desktop-pet.png',
  engines: '/product/engine-switcher.png',
  models: '/product/model-settings.png',
  skills: '/product/skills-tasks.png',
};

export const stageNoteIcons = [TerminalSquare, ShieldCheck, Settings2];
export const workflowIcons = [MessageSquareText, Code2, LockKeyhole, Clock3];
export const trustIcons = [Github, Scale, Apple, Database, Boxes];

export const heroStats = [
  { icon: Apple, label: 'macOS Apple Silicon' },
  { icon: Scale, label: 'MIT License' },
  { icon: Database, label: 'Local SQLite' },
];

export const engines = [
  'Claude Code',
  'Codex',
  'OpenCode',
  'Qwen Code',
  'DeepSeek-TUI',
  'OpenClaw',
  'Hermes Agent',
  'Claude Agent SDK',
];

export type Language = 'en' | 'zh';

export type Copy = {
  htmlLang: string;
  metaTitle: string;
  metaDescription: string;
  languageToggle: string;
  languageLabel: string;
  header: {
    nav: {
      product: string;
      workflows: string;
      studio: string;
      engines: string;
      skills: string;
      openSource: string;
      changelog: string;
      docs: string;
    };
    download: string;
  };
  downloadMenu: {
    title: string;
    description: string;
    appleSilicon: string;
    appleSiliconHint: string;
    intel: string;
    intelHint: string;
    windows: string;
    windowsHint: string;
    allReleases: string;
  };
  hero: {
    title: string[];
    body: string;
    primaryCta: string;
    secondaryCta: string;
    commandHints: string[];
  };
  product: {
    eyebrow: string;
    title: string;
    body: string;
    chromeTitle: string;
    stageCards: Array<{ label: string; title: string }>;
    notes: Array<{ title: string; body: string }>;
  };
  studio: {
    eyebrow: string;
    title: string;
    body: string;
    chatTitle: string;
    chatBody: string;
    petTitle: string;
    petBody: string;
    points: string[];
  };
  workflows: {
    eyebrow: string;
    title: string;
    body: string;
    cards: Array<{ title: string; body: string; rows: string[] }>;
  };
  engines: {
    eyebrow: string;
    title: string;
    body: string;
    aria: string;
    panels: Array<{ image: string; title: string; body: string }>;
  };
  skills: {
    eyebrow: string;
    title: string;
    body: string;
    chromeTitle: string;
    items: Array<{ name: string; body: string }>;
  };
  trust: {
    eyebrow: string;
    title: string;
    body: string;
    items: Array<{ title: string; body: string }>;
  };
  changelog: {
    metaTitle: string;
    metaDescription: string;
    eyebrow: string;
    title: string;
    body: string;
    latest: string;
    download: string;
    githubRelease: string;
    filterLabel: string;
    filters: {
      all: string;
      desktop: string;
      website: string;
      release: string;
    };
    versionLabel: string;
    viewRelease: string;
  };
  final: {
    title: string;
    body: string;
    primaryCta: string;
    secondaryCta: string;
    footerBody: string;
    footerNav: {
      product: string;
      workflows: string;
      pricing: string;
      profile: string;
      docs: string;
      releases: string;
      github: string;
      contact: string;
    };
  };
};

export const copy: Record<Language, Copy> = {
  en: {
    htmlLang: 'en',
    metaTitle: 'WeSight - Run CLI Agents from One Desktop App',
    metaDescription:
      'WeSight is an open-source desktop AI Agent workspace for CLI agents, local runtimes, model providers, permission events, skills, scheduled tasks, and memory.',
    languageToggle: '中文',
    languageLabel: 'Switch language to Chinese',
    header: {
      nav: {
        product: 'Product',
        workflows: 'Workflows',
        studio: 'Studio',
        engines: 'Engines',
        skills: 'Skills',
        openSource: 'Open Source',
        changelog: 'Changelog',
        docs: 'Docs',
      },
      download: 'Download',
    },
    downloadMenu: {
      title: 'Choose your desktop build',
      description: 'Downloads the matching installer from the latest GitHub Release.',
      appleSilicon: 'Apple Silicon',
      appleSiliconHint: 'M1, M2, M3, M4, and newer',
      intel: 'Intel',
      intelHint: 'Intel-based Macs',
      windows: 'Windows x64',
      windowsHint: '64-bit Windows 10 and 11',
      allReleases: 'View all releases',
    },
    hero: {
      title: ['Run your CLI agents', 'from one desktop app'],
      body: 'Bring Claude Code, Codex, OpenClaw, and other terminal agents into a visual desktop chat. WeSight unifies local runtimes, model providers, permission events, skills, scheduled tasks, and memory.',
      primaryCta: 'Download latest',
      secondaryCta: 'View on GitHub',
      commandHints: [
        '/run code review',
        '/plan task breakdown',
        '/docs draft docs',
        '/search latest context',
      ],
    },
    product: {
      eyebrow: 'Product',
      title: 'A real WeSight workspace',
      body: 'From the welcome screen and prompt box to engine selection and settings, core agent operations happen inside one desktop product surface.',
      chromeTitle: 'WeSight Workspace',
      stageCards: [
        { label: 'Prompt', title: 'Assign a task or ask anything' },
        { label: 'Runtime', title: 'Codex / Claude Code / OpenClaw' },
      ],
      notes: [
        {
          title: 'Reuse local CLI sessions',
          body: 'Claude Code, Codex, OpenCode, Qwen Code, DeepSeek-TUI, and other terminal agents can connect to visual chat.',
        },
        {
          title: 'Visible permission events',
          body: 'File access, shell commands, and tool calls are surfaced on the desktop so you can review work as it runs.',
        },
        {
          title: 'Unified model settings',
          body: 'Manage OpenAI-compatible, Anthropic, DeepSeek, Qwen, Gemini, Ollama, OpenRouter, and custom providers in one place.',
        },
      ],
    },
    studio: {
      eyebrow: 'Conversation Studio',
      title: 'A visual place for agents to work with you',
      body: 'WeSight turns CLI agent sessions into a desktop studio with chat input, workroom view, runtime status, and a lightweight companion that can stay nearby.',
      chatTitle: 'Chat and workroom in one surface',
      chatBody:
        'Move between conversation and the visual workroom while the active engine, current agent, and prompt box stay visible.',
      petTitle: 'Desktop Pet',
      petBody:
        'Enable the optional desktop companion from Appearance settings. It can animate, move, and react through lightweight interactions.',
      points: [
        'Conversation and workroom tabs',
        'Runtime status at a glance',
        'A companion that stays on the desktop',
      ],
    },
    workflows: {
      eyebrow: 'Workflows',
      title: 'Visual workflows. Real control.',
      body: 'WeSight turns messages, tools, permissions, and task state into observable desktop layers that make agent work easier to continue.',
      cards: [
        {
          title: 'Chat with agents visually',
          body: 'Stream CLI agent replies, context, and outputs into a single desktop conversation.',
          rows: ['User prompt', 'Streaming answer', 'Continue session'],
        },
        {
          title: 'Inspect tool execution',
          body: 'Tool calls, command output, and file operations are shown in panels so every step is traceable.',
          rows: ['read_file', 'command output', 'tool result'],
        },
        {
          title: 'Review permissions',
          body: 'Sensitive operations appear as events before they proceed, giving you a desktop review surface.',
          rows: ['File access', 'Shell command', 'Network request'],
        },
        {
          title: 'Run long tasks',
          body: 'Scheduled tasks, status transitions, and memory extraction help agent work continue across sessions.',
          rows: ['Scheduled task', 'Run monitor', 'Memory'],
        },
      ],
    },
    engines: {
      eyebrow: 'Engines',
      title: 'One workspace. Many runtimes.',
      body: 'Choose the execution engine for each task and reuse local CLI configuration, accounts, and terminal habits from the desktop.',
      aria: 'Supported engines',
      panels: [
        {
          image: productImages.engines,
          title: 'Switch execution engines',
          body: 'Pick a runtime from the task header while keeping the same desktop workflow.',
        },
        {
          image: productImages.models,
          title: 'Manage model providers',
          body: 'Configure providers, API Base URLs, model lists, and compatible formats from visual settings.',
        },
      ],
    },
    skills: {
      eyebrow: 'Skills & Automation',
      title: 'Turn repeat work into reusable capabilities',
      body: 'Skills, slash commands, scheduled tasks, and memory make agent workflows callable, reusable, and durable.',
      chromeTitle: 'Skills',
      items: [
        { name: 'web-search', body: 'Live research and browser automation' },
        { name: 'docx / xlsx / pptx', body: 'Document, spreadsheet, and slide workflows' },
        { name: 'pdf', body: 'PDF extraction, processing, and generation' },
        { name: 'playwright', body: 'Real browser operation and verification' },
        { name: 'imap-smtp-email', body: 'Email reading and sending' },
        { name: 'scheduled tasks', body: 'Recurring research, reports, reminders, and automation' },
      ],
    },
    trust: {
      eyebrow: 'Open Source',
      title: 'Open-source. Local CLI friendly. Desktop-first.',
      body: 'WeSight is shaped around local agent workflows, open-source distribution, local configuration, and controlled execution.',
      items: [
        {
          title: 'GitHub Releases',
          body: 'Public desktop builds are distributed through GitHub Releases.',
        },
        {
          title: 'MIT License',
          body: 'A clear open-source license for learning, modification, and integration.',
        },
        {
          title: 'macOS Apple Silicon',
          body: 'Early public builds prioritize Apple Silicon.',
        },
        {
          title: 'Local persistence',
          body: 'Sessions, settings, and memory are managed by a local SQLite persistence layer.',
        },
        {
          title: 'Managed runtimes',
          body: 'OpenClaw and Hermes runtimes are prepared and maintained by WeSight.',
        },
      ],
    },
    changelog: {
      metaTitle: 'WeSight Changelog - Chinese Product Updates',
      metaDescription:
        'Read the latest WeSight desktop, website, and release pipeline updates in Chinese.',
      eyebrow: 'Product updates',
      title: '更新日志',
      body: '感谢你跟随 WeSight 一路前进。这里集中记录桌面客户端、官网与发布流程的每一次更新。',
      latest: 'Latest',
      download: 'Download latest',
      githubRelease: 'GitHub Release',
      filterLabel: 'Filter release notes',
      filters: {
        all: 'All updates',
        desktop: 'Desktop',
        website: 'Website',
        release: 'Release pipeline',
      },
      versionLabel: 'WeSight',
      viewRelease: 'View release details',
    },
    final: {
      title: 'Download WeSight and start your desktop agent workflow',
      body: 'Get the latest desktop build from GitHub Releases, or read the source and README directly.',
      primaryCta: 'Download latest',
      secondaryCta: 'View GitHub repo',
      footerBody:
        'Open-source desktop AI Agent workspace for CLI agents, local runtimes, skills, scheduled tasks, and memory.',
      footerNav: {
        product: 'Product',
        workflows: 'Workflows',
        pricing: 'Pricing',
        profile: 'Account',
        docs: 'Docs',
        releases: 'Releases',
        github: 'GitHub',
        contact: 'Contact',
      },
    },
  },
  zh: {
    htmlLang: 'zh-CN',
    metaTitle: 'WeSight - 用一个桌面应用运行你的 CLI Agent',
    metaDescription:
      'WeSight 是开源桌面 AI Agent 工作区，把 CLI agents、本地 runtimes、模型供应商、权限事件、Skills、定时任务和记忆放进同一个桌面产品表面。',
    languageToggle: 'EN',
    languageLabel: '切换语言为英文',
    header: {
      nav: {
        product: '产品',
        workflows: '工作流',
        studio: '工作室',
        engines: '引擎',
        skills: '技能',
        openSource: '开源',
        changelog: '更新日志',
        docs: '文档',
      },
      download: '下载',
    },
    downloadMenu: {
      title: '选择桌面版本',
      description: '从最新 GitHub Release 下载对应的安装包。',
      appleSilicon: 'Apple 芯片',
      appleSiliconHint: 'M1、M2、M3、M4 及更新机型',
      intel: 'Intel 芯片',
      intelHint: '搭载 Intel 处理器的 Mac',
      windows: 'Windows x64',
      windowsHint: '64 位 Windows 10 和 Windows 11',
      allReleases: '查看全部发布版本',
    },
    hero: {
      title: ['用一个桌面应用', '运行你的 CLI Agent'],
      body: '把 Claude Code、Codex、OpenClaw 等终端 Agent 带进可视化桌面 Chat。统一本地 runtime、模型供应商、权限事件、Skills、定时任务与记忆。',
      primaryCta: '下载最新版本',
      secondaryCta: '查看 GitHub',
      commandHints: ['/run 代码审查', '/plan 任务拆解', '/docs 生成文档', '/search 最新资料'],
    },
    product: {
      eyebrow: '产品',
      title: '真实 WeSight 工作区',
      body: '从欢迎页、输入框、引擎选择到设置面板，核心 Agent 操作都在桌面产品表面完成。',
      chromeTitle: 'WeSight Workspace',
      stageCards: [
        { label: '提示词', title: '分配一个任务或提问任何问题' },
        { label: '运行时', title: 'Codex / Claude Code / OpenClaw' },
      ],
      notes: [
        {
          title: '复用本机 CLI 登录态',
          body: 'Claude Code、Codex、OpenCode、Qwen Code、DeepSeek-TUI 等终端 Agent 可以接入图形化 Chat。',
        },
        {
          title: '权限事件可见',
          body: '文件访问、Shell 命令、工具调用在桌面侧呈现，适合边执行边审阅。',
        },
        {
          title: '统一模型配置',
          body: 'OpenAI-compatible、Anthropic、DeepSeek、Qwen、Gemini、Ollama、OpenRouter 与自定义供应商集中管理。',
        },
      ],
    },
    studio: {
      eyebrow: '对话工作室',
      title: '对话、工作室和小助手一起出现在桌面上',
      body: 'WeSight 把 CLI Agent 会话放进桌面工作室，输入框、工作室视图、runtime 状态和桌面宠物都可以被看见。',
      chatTitle: '对话与工作室在同一个界面',
      chatBody: '在对话区和工作室之间切换时，当前引擎、当前 Agent 和输入框依然保持可见。',
      petTitle: '桌面宠物',
      petBody: '在外观设置中开启桌面宠物后，它可以动画展示、移动，并支持简单互动。',
      points: ['对话与工作室标签', 'runtime 状态一眼可见', '常驻桌面的小助手'],
    },
    workflows: {
      eyebrow: '工作流',
      title: '可视化工作流，真实控制感',
      body: 'WeSight 把消息、工具、权限和状态拆成可观察的桌面层，让 Agent 工作更容易继续。',
      cards: [
        {
          title: '可视化 Agent 对话',
          body: '把 CLI Agent 的流式回复、上下文和输出放进同一个桌面会话。',
          rows: ['用户输入', '流式回复', '继续会话'],
        },
        {
          title: '检查工具执行',
          body: '工具调用、命令输出、文件读写结果用面板呈现，便于追踪每一步。',
          rows: ['read_file', 'command output', 'tool result'],
        },
        {
          title: '审阅权限事件',
          body: '敏感操作先展示事件，允许、拒绝或继续观察都在桌面完成。',
          rows: ['文件访问', 'Shell 命令', '网络请求'],
        },
        {
          title: '运行长期任务',
          body: '定时任务、状态流转、记忆提取帮助 Agent 工作跨会话延续。',
          rows: ['定时任务', '运行监控', '记忆'],
        },
      ],
    },
    engines: {
      eyebrow: '引擎',
      title: '一个工作区，多种 runtime',
      body: '根据任务选择执行引擎，也可以复用本机 CLI 配置，把已有账号和终端习惯接到桌面侧。',
      aria: '支持的执行引擎',
      panels: [
        {
          image: productImages.engines,
          title: '切换执行引擎',
          body: '从任务头部选择不同 runtime，保持同一个桌面工作流。',
        },
        {
          image: productImages.models,
          title: '集中管理模型供应商',
          body: '把 provider、API Base URL、模型列表和兼容格式放到可视化设置里。',
        },
      ],
    },
    skills: {
      eyebrow: '技能与自动化',
      title: '把重复工作沉淀为可复用能力',
      body: 'Skills、Slash 指令、定时任务和记忆系统让 Agent 工作流可以被调用、复用和延续。',
      chromeTitle: 'Skills',
      items: [
        { name: 'web-search', body: '实时资料检索与浏览器自动化' },
        { name: 'docx / xlsx / pptx', body: '文档、表格、幻灯片工作流' },
        { name: 'pdf', body: 'PDF 提取、处理与生成' },
        { name: 'playwright', body: '真实浏览器操作与验证' },
        { name: 'imap-smtp-email', body: '邮件读取与发送' },
        { name: 'scheduled tasks', body: '周期性研究、报告、提醒与自动化' },
      ],
    },
    trust: {
      eyebrow: '开源',
      title: '开源、本地 CLI 友好、桌面优先',
      body: '面向本地 Agent 工作流，围绕开源分发、本地配置和可控执行建立产品边界。',
      items: [
        {
          title: 'GitHub Releases',
          body: '公开桌面构建通过 GitHub Releases 分发。',
        },
        {
          title: 'MIT License',
          body: '开源协议清晰，方便学习、改造和集成。',
        },
        {
          title: 'macOS Apple Silicon',
          body: '早期公开版优先支持 Apple Silicon。',
        },
        {
          title: 'Local persistence',
          body: '会话、配置和记忆由本地 SQLite 持久化层管理。',
        },
        {
          title: 'Managed runtimes',
          body: 'OpenClaw 和 Hermes runtime 由 WeSight 准备和维护。',
        },
      ],
    },
    changelog: {
      metaTitle: 'WeSight 更新日志 - 产品版本记录',
      metaDescription: '查看 WeSight 桌面客户端、官网与发布流程的中文更新日志。',
      eyebrow: '产品动态',
      title: '更新日志',
      body: '感谢你跟随 WeSight 一路前进。这里集中记录桌面客户端、官网与发布流程的每一次更新。',
      latest: '最新版本',
      download: '下载最新版本',
      githubRelease: 'GitHub Release',
      filterLabel: '筛选更新日志',
      filters: {
        all: '全部更新',
        desktop: '桌面客户端',
        website: '官网',
        release: '发布流程',
      },
      versionLabel: 'WeSight',
      viewRelease: '查看发布详情',
    },
    final: {
      title: '下载 WeSight，开始你的桌面 Agent 工作流',
      body: '从 GitHub Releases 获取最新桌面构建，或者直接阅读源码与 README。',
      primaryCta: '下载最新版本',
      secondaryCta: '查看 GitHub 仓库',
      footerBody:
        'Open-source desktop AI Agent workspace for CLI agents, local runtimes, skills, scheduled tasks, and memory.',
      footerNav: {
        product: '产品',
        workflows: '工作流',
        pricing: '服务',
        profile: '账户',
        docs: '文档',
        releases: '发布',
        github: 'GitHub',
        contact: '联系',
      },
    },
  },
};
