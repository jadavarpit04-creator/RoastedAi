// ============================================================================
// Tech Stack Analyzer - Technology Detection Rules
// ============================================================================
// Comprehensive detection rules for 250+ technologies organized into 21 categories.
// Each rule contains detection patterns that can be compiled at runtime via new RegExp().
// ============================================================================

export type Confidence = 'high' | 'medium' | 'low'

export type TechCategory =
  | 'frontend-language'
  | 'frontend-framework'
  | 'css-framework'
  | 'backend-language'
  | 'backend-framework'
  | 'cms-ecommerce'
  | 'database'
  | 'hosting-cloud'
  | 'js-library'
  | 'api-network'
  | 'build-tool'
  | 'cicd'
  | 'analytics'
  | 'security'
  | 'seo'
  | 'performance'
  | 'ai-ml'
  | 'web3'
  | 'realtime'
  | 'headless-cms'
  | 'auth'
  | 'monitoring'

export interface DetectionPattern {
  type: 'html' | 'header' | 'script' | 'url' | 'meta' | 'cookie' | 'css' | 'js-global'
  regex: string
  confidence: Confidence
  versionRegex?: string
}

export interface TechRule {
  id: string
  name: string
  category: TechCategory
  icon: string
  patterns: DetectionPattern[]
  description?: string
}

export const CATEGORY_META: Record<TechCategory, { label: string; icon: string; color: string }> = {
  'frontend-language': { label: 'Frontend Languages', icon: '🎨', color: 'text-purple-500' },
  'frontend-framework': { label: 'Frontend Frameworks', icon: '⚛️', color: 'text-purple-600' },
  'css-framework': { label: 'CSS Frameworks', icon: '🎭', color: 'text-pink-500' },
  'backend-language': { label: 'Backend Languages', icon: '🔧', color: 'text-green-500' },
  'backend-framework': { label: 'Backend Frameworks', icon: '🏗️', color: 'text-green-600' },
  'cms-ecommerce': { label: 'CMS & E-Commerce', icon: '🛒', color: 'text-orange-500' },
  'database': { label: 'Databases', icon: '🗄️', color: 'text-blue-500' },
  'hosting-cloud': { label: 'Hosting & Cloud', icon: '☁️', color: 'text-sky-500' },
  'js-library': { label: 'JS Libraries', icon: '📚', color: 'text-yellow-500' },
  'api-network': { label: 'API & Network', icon: '🌐', color: 'text-indigo-500' },
  'build-tool': { label: 'Build Tools', icon: '🔨', color: 'text-amber-600' },
  'cicd': { label: 'CI/CD', icon: '🔄', color: 'text-teal-500' },
  'analytics': { label: 'Analytics', icon: '📊', color: 'text-rose-500' },
  'security': { label: 'Security', icon: '🔒', color: 'text-red-500' },
  'seo': { label: 'SEO', icon: '🔍', color: 'text-emerald-500' },
  'performance': { label: 'Performance', icon: '⚡', color: 'text-cyan-500' },
  'ai-ml': { label: 'AI / ML', icon: '🤖', color: 'text-violet-500' },
  'web3': { label: 'Web3', icon: '⛓️', color: 'text-fuchsia-500' },
  'realtime': { label: 'Real-time', icon: '📡', color: 'text-lime-500' },
  'headless-cms': { label: 'Headless CMS', icon: '📝', color: 'text-pink-500' },
  'auth': { label: 'Authentication', icon: '🔑', color: 'text-amber-500' },
  'monitoring': { label: 'Monitoring', icon: '👁️', color: 'text-slate-500' },
}

// ============================================================================
// TECH_RULES - 250+ Technology Detection Rules
// ============================================================================

export const TECH_RULES: TechRule[] = [

  // ==========================================================================
  // FRONTEND LANGUAGES (12)
  // ==========================================================================
  {
    id: 'html',
    name: 'HTML',
    category: 'frontend-language',
    icon: '📄',
    patterns: [
      { type: 'html', regex: '<!DOCTYPE\\s+html|<html[^>]*>', confidence: 'high' },
    ],
    description: 'HyperText Markup Language — the standard markup language for web pages.',
  },
  {
    id: 'css',
    name: 'CSS',
    category: 'frontend-language',
    icon: '🎨',
    patterns: [
      { type: 'html', regex: '<link[^>]+rel=["\']stylesheet["\']|<style[^>]*>', confidence: 'high' },
      { type: 'css', regex: '[a-z-]+\\s*:\\s*[^;]+;', confidence: 'low' },
    ],
    description: 'Cascading Style Sheets — used to style and layout web pages.',
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    category: 'frontend-language',
    icon: '🟨',
    patterns: [
      { type: 'html', regex: '<script[^>]*>[\\s\\S]*?</script>|type=["\']text/javascript["\']', confidence: 'high' },
      { type: 'js-global', regex: 'window\\.|document\\.|navigator\\.', confidence: 'medium' },
    ],
    description: 'JavaScript — the primary programming language of the web.',
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    category: 'frontend-language',
    icon: '🔷',
    patterns: [
      { type: 'script', regex: 'typescript|\\.ts[x]?\\b', confidence: 'low' },
      { type: 'html', regex: '__NEXT_DATA__', confidence: 'medium' },
      { type: 'js-global', regex: '__TS__', confidence: 'low' },
      { type: 'meta', regex: 'typescript', confidence: 'low' },
    ],
    description: 'TypeScript — a typed superset of JavaScript that compiles to plain JS.',
  },
  {
    id: 'jsx',
    name: 'JSX',
    category: 'frontend-language',
    icon: '⟐',
    patterns: [
      { type: 'html', regex: 'data-reactroot|data-reactid', confidence: 'medium' },
      { type: 'script', regex: 'jsx|babel.*standalone', confidence: 'low' },
    ],
    description: 'JavaScript XML — a syntax extension for React.',
  },
  {
    id: 'scss',
    name: 'SCSS',
    category: 'frontend-language',
    icon: '🎭',
    patterns: [
      { type: 'css', regex: '\\$[a-zA-Z_-]+\\s*:', confidence: 'medium' },
      { type: 'html', regex: 'type=["\']text/scss["\']|lang=["\']scss["\']', confidence: 'high' },
    ],
    description: 'Sassy CSS — a preprocessor scripting language that is interpreted into CSS.',
  },
  {
    id: 'less',
    name: 'LESS',
    category: 'frontend-language',
    icon: '📉',
    patterns: [
      { type: 'html', regex: 'type=["\']text/less["\']|rel=["\']stylesheet/less["\']', confidence: 'high' },
      { type: 'script', regex: 'less\\.js|less\\.min\\.js', confidence: 'high' },
    ],
    description: 'LESS — a backward-compatible CSS preprocessor.',
  },
  {
    id: 'stylus',
    name: 'Stylus',
    category: 'frontend-language',
    icon: '✒️',
    patterns: [
      { type: 'html', regex: 'type=["\']text/stylus["\']|lang=["\']stylus["\']', confidence: 'high' },
      { type: 'script', regex: 'stylus\\.min\\.js|stylus-renderer', confidence: 'high' },
    ],
    description: 'Stylus — an expressive, dynamic, and robust CSS preprocessor.',
  },
  {
    id: 'pug',
    name: 'Pug',
    category: 'frontend-language',
    icon: '🐶',
    patterns: [
      { type: 'html', regex: 'lang=["\']pug["\']', confidence: 'high' },
      { type: 'meta', regex: 'pug', confidence: 'low' },
    ],
    description: 'Pug (formerly Jade) — a high-performance template engine for Node.js.',
  },
  {
    id: 'haml',
    name: 'Haml',
    category: 'frontend-language',
    icon: '💎',
    patterns: [
      { type: 'html', regex: 'lang=["\']haml["\']', confidence: 'high' },
      { type: 'meta', regex: 'haml', confidence: 'low' },
    ],
    description: 'Haml — a templating language for Ruby that compiles to HTML.',
  },
  {
    id: 'sass',
    name: 'Sass',
    category: 'frontend-language',
    icon: '🎀',
    patterns: [
      { type: 'html', regex: 'type=["\']text/sass["\']|lang=["\']sass["\']', confidence: 'high' },
      { type: 'css', regex: '\\$[a-zA-Z_-]+\\s*:', confidence: 'medium' },
    ],
    description: 'Syntactically Awesome Style Sheets — a CSS preprocessor.',
  },
  {
    id: 'coffeescript',
    name: 'CoffeeScript',
    category: 'frontend-language',
    icon: '☕',
    patterns: [
      { type: 'html', regex: 'type=["\']text/coffeescript["\']', confidence: 'high' },
      { type: 'script', regex: 'coffee-script\\.js|coffeescript', confidence: 'high' },
    ],
    description: 'CoffeeScript — a language that compiles to JavaScript.',
  },

  // ==========================================================================
  // FRONTEND FRAMEWORKS (20)
  // ==========================================================================
  {
    id: 'react',
    name: 'React',
    category: 'frontend-framework',
    icon: '⚛️',
    patterns: [
      { type: 'script', regex: 'react[.-](?:production|development)\\.min\\.js|react-dom', confidence: 'high' },
      { type: 'html', regex: 'data-reactroot|data-reactid|_reactRootContainer', confidence: 'high' },
      { type: 'js-global', regex: '__REACT_DEVTOOLS_|React\\.__SECRET_INTERNALS', confidence: 'high' },
    ],
    description: 'React — a JavaScript library for building user interfaces by Meta.',
    versionRegex: 'react[/.-](\\d+\\.\\d+(?:\\.\\d+)?)',
  },
  {
    id: 'vuejs',
    name: 'Vue.js',
    category: 'frontend-framework',
    icon: '💚',
    patterns: [
      { type: 'script', regex: 'vue\\.min\\.js|vue\\.global\\.js|vue\\.esm', confidence: 'high' },
      { type: 'html', regex: 'data-v-[a-f0-9]{4,8}|v-cloak|v-if|v-for', confidence: 'high' },
      { type: 'js-global', regex: '__VUE_|Vue\\.(?:version|config)', confidence: 'high' },
    ],
    description: 'Vue.js — a progressive JavaScript framework for building UIs.',
    versionRegex: 'vue[/.-](\\d+\\.\\d+(?:\\.\\d+)?)',
  },
  {
    id: 'angular',
    name: 'Angular',
    category: 'frontend-framework',
    icon: '🅰️',
    patterns: [
      { type: 'html', regex: 'ng-version|_nghost|_ngcontent|ng-reflect-', confidence: 'high' },
      { type: 'script', regex: 'angular\\.min\\.js|@angular/core', confidence: 'high' },
      { type: 'js-global', regex: 'ng\\.core|angular\\.(?:module|version)', confidence: 'high' },
      { type: 'html', regex: 'ng-app|ng-controller|ng-model', confidence: 'medium' },
    ],
    description: 'Angular — a platform for building mobile and desktop web apps by Google.',
    versionRegex: 'ng-version="(\\d+\\.\\d+(?:\\.\\d+)?)',
  },
  {
    id: 'svelte',
    name: 'Svelte',
    category: 'frontend-framework',
    icon: '🔥',
    patterns: [
      { type: 'html', regex: 'class="svelte-[a-z0-9]+"|data-svelte', confidence: 'high' },
      { type: 'js-global', regex: '__svelte', confidence: 'high' },
    ],
    description: 'Svelte — a radical new approach to building user interfaces.',
  },
  {
    id: 'solidjs',
    name: 'SolidJS',
    category: 'frontend-framework',
    icon: '💎',
    patterns: [
      { type: 'html', regex: 'data-hk="[a-z0-9]+"', confidence: 'high' },
      { type: 'js-global', regex: 'Solid\\(|createSignal|createEffect', confidence: 'low' },
    ],
    description: 'SolidJS — a simple and performant reactivity library for building UIs.',
  },
  {
    id: 'qwik',
    name: 'Qwik',
    category: 'frontend-framework',
    icon: '⚡',
    patterns: [
      { type: 'html', regex: 'q:base|q:version|qwik-loader', confidence: 'high' },
      { type: 'js-global', regex: 'qwik', confidence: 'medium' },
    ],
    description: 'Qwik — the instant-loading framework by Builder.io.',
  },
  {
    id: 'alpinejs',
    name: 'Alpine.js',
    category: 'frontend-framework',
    icon: '🏔️',
    patterns: [
      { type: 'script', regex: 'alpine\\.min\\.js|alpinejs', confidence: 'high' },
      { type: 'html', regex: 'x-data=|x-bind:|x-on:|x-show=|x-if=', confidence: 'high' },
      { type: 'js-global', regex: 'Alpine\\.(?:store|data|start)', confidence: 'high' },
    ],
    description: 'Alpine.js — a rugged, minimal tool for composing JavaScript directly in markup.',
  },
  {
    id: 'htmx',
    name: 'HTMX',
    category: 'frontend-framework',
    icon: '🔗',
    patterns: [
      { type: 'script', regex: 'htmx\\.min\\.js|htmx\\.org', confidence: 'high' },
      { type: 'html', regex: 'hx-get=|hx-post=|hx-trigger=|hx-target=', confidence: 'high' },
      { type: 'js-global', regex: 'htmx', confidence: 'high' },
    ],
    description: 'HTMX — allows accessing AJAX, CSS Transitions, WebSockets directly from HTML.',
  },
  {
    id: 'preact',
    name: 'Preact',
    category: 'frontend-framework',
    icon: '🪶',
    patterns: [
      { type: 'script', regex: 'preact[/.-](?:compat|core|debug)', confidence: 'high' },
      { type: 'js-global', regex: '__PREACT_DEVTOOLS__', confidence: 'high' },
    ],
    description: 'Preact — a fast 3kB alternative to React with the same modern API.',
  },
  {
    id: 'lit',
    name: 'Lit',
    category: 'frontend-framework',
    icon: '💡',
    patterns: [
      { type: 'html', regex: 'lit-html|LitElement', confidence: 'high' },
      { type: 'js-global', regex: 'litElement|LitElement', confidence: 'high' },
    ],
    description: 'Lit — a simple library for building fast, lightweight web components.',
  },
  {
    id: 'stencil',
    name: 'Stencil',
    category: 'frontend-framework',
    icon: '🔧',
    patterns: [
      { type: 'html', regex: 'data-stencil|stencil-',
        confidence: 'medium' },
      { type: 'meta', regex: 'stencil', confidence: 'low' },
    ],
    description: 'Stencil — a compiler for building fast, reusable web components.',
  },
  {
    id: 'nextjs',
    name: 'Next.js',
    category: 'frontend-framework',
    icon: '▲',
    patterns: [
      { type: 'html', regex: '__NEXT_DATA__|_next/static|next-route-announcer|__next', confidence: 'high' },
      { type: 'header', regex: 'x-nextjs-(?:cache|matched-path|redirect)', confidence: 'high' },
      { type: 'script', regex: '_next/static', confidence: 'high' },
    ],
    description: 'Next.js — the React framework for production by Vercel.',
  },
  {
    id: 'nuxtjs',
    name: 'Nuxt.js',
    category: 'frontend-framework',
    icon: '💚',
    patterns: [
      { type: 'html', regex: '__NUXT__|_nuxt/|nuxt-link|data-nuxt', confidence: 'high' },
      { type: 'header', regex: 'x-nuxt', confidence: 'medium' },
      { type: 'script', regex: '_nuxt/', confidence: 'high' },
    ],
    description: 'Nuxt.js — the intuitive Vue framework.',
  },
  {
    id: 'gatsby',
    name: 'Gatsby',
    category: 'frontend-framework',
    icon: '💜',
    patterns: [
      { type: 'html', regex: '___gatsby|gatsby-script|data-gatsby', confidence: 'high' },
      { type: 'meta', regex: 'Gatsby\\s+\\d', confidence: 'high' },
      { type: 'script', regex: 'gatsby-browser|gatsby-ssr', confidence: 'medium' },
    ],
    description: 'Gatsby — a React-based open-source framework for creating websites and apps.',
  },
  {
    id: 'remix',
    name: 'Remix',
    category: 'frontend-framework',
    icon: '💿',
    patterns: [
      { type: 'html', regex: '__remixContext|__remixManifest|remix-route', confidence: 'high' },
      { type: 'script', regex: 'remix\\.(?:run|dev)', confidence: 'medium' },
    ],
    description: 'Remix — a full-stack web framework for building better websites.',
  },
  {
    id: 'astro',
    name: 'Astro',
    category: 'frontend-framework',
    icon: '🚀',
    patterns: [
      { type: 'html', regex: 'astro-island|astro-slot|data-astro', confidence: 'high' },
      { type: 'meta', regex: 'astro', confidence: 'medium' },
    ],
    description: 'Astro — the web framework for content-driven websites.',
  },
  {
    id: 'eleventy',
    name: 'Eleventy',
    category: 'frontend-framework',
    icon: '🐿️',
    patterns: [
      { type: 'meta', regex: 'eleventy|11ty', confidence: 'high' },
      { type: 'html', regex: 'eleventy', confidence: 'medium' },
    ],
    description: 'Eleventy (11ty) — a simpler static site generator.',
  },
  {
    id: 'hugo',
    name: 'Hugo',
    category: 'frontend-framework',
    icon: '🏗️',
    patterns: [
      { type: 'meta', regex: 'Hugo\\s+\\d', confidence: 'high' },
      { type: 'header', regex: 'x-hugo', confidence: 'medium' },
    ],
    description: 'Hugo — one of the most popular open-source static site generators.',
  },
  {
    id: 'hydrogen',
    name: 'Hydrogen',
    category: 'frontend-framework',
    icon: '💧',
    patterns: [
      { type: 'html', regex: 'hydrogen|shopify-hydrogen', confidence: 'medium' },
      { type: 'meta', regex: 'hydrogen', confidence: 'medium' },
    ],
    description: 'Hydrogen — Shopify\'s React-based framework for custom storefronts.',
  },
  {
    id: 'vite-ssr',
    name: 'Vite SSR',
    category: 'frontend-framework',
    icon: '⚡',
    patterns: [
      { type: 'html', regex: 'vite-ssr|__VITE_SSR', confidence: 'medium' },
      { type: 'meta', regex: 'vite', confidence: 'low' },
    ],
    description: 'Vite SSR — server-side rendering with Vite.',
  },

  // ==========================================================================
  // CSS FRAMEWORKS (12)
  // ==========================================================================
  {
    id: 'tailwindcss',
    name: 'Tailwind CSS',
    category: 'css-framework',
    icon: '🌊',
    patterns: [
      { type: 'script', regex: 'tailwind\\.css|tailwindcss|tailwind\\.min\\.css', confidence: 'high' },
      { type: 'css', regex: 'tailwind', confidence: 'medium' },
      { type: 'html', regex: 'class="[^"]*\\b(?:bg-(?:gradient|clip)|text-(?:\\d+xl|\\d+x?l|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:\\d{2,3})|border-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:\\d{2,3})|rounded-(?:sm|md|lg|xl|2xl|3xl|full)|shadow-(?:sm|md|lg|xl|2xl|inner|none)|space-(?:x|y)-\\d|gap-\\d|px-\\d|py-\\d|pt-\\d|pb-\\d|pl-\\d|pr-\\d|max-w-(?:xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|screen-(?:sm|md|lg|xl|2xl)))\\b', confidence: 'high' },
      { type: 'html', regex: 'class="[^"]*\\b(?:sm:(?:flex|grid|hidden|block|inline)|md:(?:flex|grid|hidden|block|inline)|lg:(?:flex|grid|hidden|block|inline)|xl:(?:flex|grid|hidden|block|inline)|hover:(?:bg-|text-|border-|shadow-|scale-|opacity-))\\b', confidence: 'high' },
    ],
    description: 'Tailwind CSS — a utility-first CSS framework for rapid UI development.',
  },
  {
    id: 'bootstrap',
    name: 'Bootstrap',
    category: 'css-framework',
    icon: '🅱️',
    patterns: [
      { type: 'script', regex: 'bootstrap\\.min\\.(?:css|js)|bootstrap\\.bundle', confidence: 'high' },
      { type: 'css', regex: 'bootstrap', confidence: 'high' },
      { type: 'html', regex: 'data-bs-|bs-toggle|bs-target|bs-dismiss', confidence: 'high' },
      { type: 'html', regex: 'class="[^"]*\\b(?:col-(?:xs|sm|md|lg|xl)-\\d|btn-(?:primary|secondary|success|danger|warning|info|light|dark|outline)|navbar-(?:expand|collapse|brand|nav)|card-body|modal-dialog|alert-(?:primary|secondary|success|danger))\\b', confidence: 'high' },
    ],
    description: 'Bootstrap — the most popular HTML, CSS, and JS framework.',
    versionRegex: 'bootstrap[/.-](\\d+\\.\\d+(?:\\.\\d+)?)',
  },
  {
    id: 'material-ui',
    name: 'Material UI',
    category: 'css-framework',
    icon: '🎨',
    patterns: [
      { type: 'html', regex: 'class="[^"]*Mui(?:Typography|Button|Paper|Card|Grid|Container|AppBar|Toolbar|Drawer|Chip|Avatar|Badge|TextField|MenuItem|ListItemIcon|Divider)\\b', confidence: 'high' },
      { type: 'html', regex: 'class="[^"]*css-[a-z0-9]+\\b', confidence: 'medium' },
      { type: 'script', regex: '@mui|@material-ui', confidence: 'high' },
    ],
    description: 'Material UI — React components for faster and easier web development.',
  },
  {
    id: 'bulma',
    name: 'Bulma',
    category: 'css-framework',
    icon: '🟢',
    patterns: [
      { type: 'script', regex: 'bulma\\.css|bulma\\.min\\.css', confidence: 'high' },
      { type: 'css', regex: 'bulma', confidence: 'high' },
      { type: 'html', regex: 'class="[^"]*\\b(?:is-primary|is-info|is-success|is-warning|is-danger|is-dark|is-light|is-medium|is-large|is-small|is-fullheight|navbar-item|breadcrumb-item|pagination-link|level-item)\\b', confidence: 'high' },
    ],
    description: 'Bulma — a free, open-source CSS framework based on Flexbox.',
  },
  {
    id: 'foundation',
    name: 'Foundation',
    category: 'css-framework',
    icon: '🔷',
    patterns: [
      { type: 'script', regex: 'foundation\\.min\\.(?:css|js)|foundation\\.js', confidence: 'high' },
      { type: 'css', regex: 'foundation', confidence: 'high' },
      { type: 'html', regex: 'class="[^"]*\\b(?:top-bar|orbit|callout|reveal|sticky)\\b', confidence: 'high' },
    ],
    description: 'Foundation — the most advanced responsive front-end framework.',
  },
  {
    id: 'chakra-ui',
    name: 'Chakra UI',
    category: 'css-framework',
    icon: '⚡',
    patterns: [
      { type: 'html', regex: 'class="[^"]*chakra[^"]*"', confidence: 'high' },
      { type: 'script', regex: '@chakra-ui', confidence: 'high' },
    ],
    description: 'Chakra UI — a simple, modular and accessible component library.',
  },
  {
    id: 'ant-design',
    name: 'Ant Design',
    category: 'css-framework',
    icon: '🐜',
    patterns: [
      { type: 'html', regex: 'class="[^"]*ant-(?:btn|input|select|table|card|modal|form|layout|menu|dropdown|notification|message|spin|pagination|tag|badge|avatar|tooltip|popover)\\b', confidence: 'high' },
      { type: 'script', regex: 'antd|ant-design', confidence: 'high' },
    ],
    description: 'Ant Design — a design system for enterprise-level products.',
  },
  {
    id: 'semantic-ui',
    name: 'Semantic UI',
    category: 'css-framework',
    icon: '💠',
    patterns: [
      { type: 'html', regex: 'class="[^"]*ui (?:button|input|label|header|segment|grid|container|card|menu|modal|dropdown|accordion|tab|sidebar|popup|progress|step|breadcrumb)\\b', confidence: 'high' },
      { type: 'script', regex: 'semantic\\.min\\.(?:css|js)|semantic-ui', confidence: 'high' },
      { type: 'css', regex: 'semantic', confidence: 'high' },
    ],
    description: 'Semantic UI — a development framework for creating beautiful layouts.',
  },
  {
    id: 'pure-css',
    name: 'Pure CSS',
    category: 'css-framework',
    icon: '⚪',
    patterns: [
      { type: 'html', regex: 'class="[^"]*pure-(?:u-|button|form|table|menu|grid|g)\\b', confidence: 'high' },
      { type: 'script', regex: 'pure\\.min\\.css|purecss', confidence: 'high' },
    ],
    description: 'Pure CSS — a set of small, responsive CSS modules.',
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    category: 'css-framework',
    icon: '💀',
    patterns: [
      { type: 'script', regex: 'skeleton\\.min\\.css|skeleton-css', confidence: 'high' },
      { type: 'css', regex: 'skeleton', confidence: 'medium' },
    ],
    description: 'Skeleton — a dead simple, responsive boilerplate.',
  },
  {
    id: 'windi-css',
    name: 'Windi CSS',
    category: 'css-framework',
    icon: '💨',
    patterns: [
      { type: 'html', regex: 'class="[^"]*\\bwindi\\b', confidence: 'medium' },
      { type: 'script', regex: 'windicss', confidence: 'high' },
    ],
    description: 'Windi CSS — next-generation utility-first CSS framework.',
  },
  {
    id: 'unocss',
    name: 'UnoCSS',
    category: 'css-framework',
    icon: '🦄',
    patterns: [
      { type: 'script', regex: 'unocss', confidence: 'high' },
      { type: 'meta', regex: 'unocss', confidence: 'medium' },
    ],
    description: 'UnoCSS — the instant on-demand atomic CSS engine.',
  },

  // ==========================================================================
  // BACKEND LANGUAGES (14)
  // ==========================================================================
  {
    id: 'nodejs',
    name: 'Node.js',
    category: 'backend-language',
    icon: '🟩',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*Express|x-powered-by:\\s*Next\\.js|x-powered-by:\\s*Koa|x-powered-by:\\s*NestJS', confidence: 'medium' },
      { type: 'header', regex: 'x-powered-by:\\s*Node\\.js', confidence: 'high' },
      { type: 'cookie', regex: 'connect\\.sid', confidence: 'medium' },
      { type: 'html', regex: '__NEXT_DATA__|__remixContext|_next/static|_nuxt/', confidence: 'medium' },
    ],
    description: 'Node.js — a JavaScript runtime built on Chrome\'s V8 engine.',
  },
  {
    id: 'php',
    name: 'PHP',
    category: 'backend-language',
    icon: '🐘',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*PHP|x-powered-by:\\s*Plesk', confidence: 'high' },
      { type: 'html', regex: '\\.php[?"]|<\\?php', confidence: 'medium' },
      { type: 'cookie', regex: 'PHPSESSID', confidence: 'high' },
      { type: 'url', regex: '\\.php', confidence: 'medium' },
    ],
    description: 'PHP — a popular general-purpose scripting language for web development.',
    versionRegex: 'x-powered-by:\\s*PHP/(\\d+\\.\\d+(?:\\.\\d+)?)',
  },
  {
    id: 'python',
    name: 'Python',
    category: 'backend-language',
    icon: '🐍',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*Python|server:\\s*gunicorn|server:\\s*uvicorn|server:\\s*waitress', confidence: 'high' },
      { type: 'cookie', regex: 'csrftoken|sessionid', confidence: 'medium' },
      { type: 'html', regex: 'csrfmiddlewaretoken', confidence: 'high' },
      { type: 'html', regex: '__django|djdt|djDebug', confidence: 'high' },
    ],
    description: 'Python — a versatile programming language popular for web backends.',
  },
  {
    id: 'java',
    name: 'Java',
    category: 'backend-language',
    icon: '☕',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*(?:Servlet|JSP|Java)|server:\\s*(?:Apache-Coyote|Tomcat|Jetty|WildFly)', confidence: 'high' },
      { type: 'cookie', regex: 'JSESSIONID', confidence: 'high' },
    ],
    description: 'Java — a class-based, object-oriented programming language.',
  },
  {
    id: 'ruby',
    name: 'Ruby',
    category: 'backend-language',
    icon: '♦️',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*(?:Phusion|Passenger|Ruby)|server:\\s*Ruby', confidence: 'high' },
      { type: 'cookie', regex: '_session_id|_ruby', confidence: 'medium' },
      { type: 'html', regex: 'authenticity_token|csrf-token.*rails', confidence: 'high' },
      { type: 'html', regex: 'turbolinks|data-turbo', confidence: 'medium' },
    ],
    description: 'Ruby — a dynamic, open-source programming language focused on simplicity.',
  },
  {
    id: 'go',
    name: 'Go',
    category: 'backend-language',
    icon: '🔵',
    patterns: [
      { type: 'header', regex: 'server:\\s*Go|server:\\s*gorilla', confidence: 'high' },
      { type: 'cookie', regex: '_gorilla_csrf', confidence: 'medium' },
    ],
    description: 'Go — a statically typed, compiled language designed at Google.',
  },
  {
    id: 'csharp',
    name: 'C#',
    category: 'backend-language',
    icon: '🟣',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*ASP\\.NET|x-aspnet(?:version|-mvc-route)|server:\\s*Microsoft-IIS', confidence: 'high' },
      { type: 'cookie', regex: '\\.ASPXAUTH|ASP\\.NET_SessionId', confidence: 'high' },
    ],
    description: 'C# — a modern, object-oriented programming language by Microsoft.',
  },
  {
    id: 'rust',
    name: 'Rust',
    category: 'backend-language',
    icon: '🦀',
    patterns: [
      { type: 'header', regex: 'server:\\s*(?:Rocket|Actix|Axum|warp)', confidence: 'high' },
      { type: 'header', regex: 'x-powered-by:\\s*Rust', confidence: 'medium' },
    ],
    description: 'Rust — a language empowering everyone to build reliable and efficient software.',
  },
  {
    id: 'elixir',
    name: 'Elixir',
    category: 'backend-language',
    icon: '🧪',
    patterns: [
      { type: 'header', regex: 'server:\\s*Phoenix|x-powered-by:\\s*Elixir|server:\\s*Cowboy', confidence: 'high' },
      { type: 'cookie', regex: '_phoenix_key', confidence: 'medium' },
    ],
    description: 'Elixir — a dynamic, functional language for building maintainable applications.',
  },
  {
    id: 'scala',
    name: 'Scala',
    category: 'backend-language',
    icon: '🔴',
    patterns: [
      { type: 'header', regex: 'server:\\s*Play|x-powered-by:\\s*Scala', confidence: 'medium' },
      { type: 'cookie', regex: 'PLAY_SESSION', confidence: 'medium' },
    ],
    description: 'Scala — a language that combines object-oriented and functional programming.',
  },
  {
    id: 'perl',
    name: 'Perl',
    category: 'backend-language',
    icon: '🐪',
    patterns: [
      { type: 'header', regex: 'server:\\s*(?:Apache|Perl)|x-powered-by:\\s*Perl', confidence: 'medium' },
      { type: 'url', regex: '\\.pl[?"]|\\.cgi', confidence: 'medium' },
    ],
    description: 'Perl — a highly capable, feature-rich programming language.',
  },
  {
    id: 'deno',
    name: 'Deno',
    category: 'backend-language',
    icon: '🦕',
    patterns: [
      { type: 'header', regex: 'server:\\s*Deno|x-powered-by:\\s*Deno', confidence: 'high' },
      { type: 'html', regex: 'deno', confidence: 'low' },
    ],
    description: 'Deno — a simple, modern, and secure runtime for JavaScript and TypeScript.',
  },
  {
    id: 'bun',
    name: 'Bun',
    category: 'backend-language',
    icon: '🍞',
    patterns: [
      { type: 'header', regex: 'server:\\s*Bun|x-powered-by:\\s*Bun', confidence: 'high' },
      { type: 'html', regex: 'bun', confidence: 'low' },
    ],
    description: 'Bun — a fast JavaScript runtime, bundler, test runner, and package manager.',
  },
  {
    id: 'kotlin',
    name: 'Kotlin',
    category: 'backend-language',
    icon: '🟠',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*Ktor|server:\\s*Ktor', confidence: 'high' },
      { type: 'meta', regex: 'kotlin', confidence: 'low' },
    ],
    description: 'Kotlin — a modern programming language that makes developers happier.',
  },

  // ==========================================================================
  // BACKEND FRAMEWORKS (24)
  // ==========================================================================
  {
    id: 'express',
    name: 'Express',
    category: 'backend-framework',
    icon: '🚂',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*Express', confidence: 'high' },
      { type: 'cookie', regex: 'connect\\.sid', confidence: 'medium' },
    ],
    description: 'Express — a minimal and flexible Node.js web application framework.',
  },
  {
    id: 'nestjs',
    name: 'NestJS',
    category: 'backend-framework',
    icon: '🐱',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*NestJS', confidence: 'high' },
      { type: 'html', regex: 'nestjs', confidence: 'low' },
    ],
    description: 'NestJS — a progressive Node.js framework for building scalable server-side apps.',
  },
  {
    id: 'fastify',
    name: 'Fastify',
    category: 'backend-framework',
    icon: '⚡',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*Fastify|server:\\s*Fastify', confidence: 'high' },
    ],
    description: 'Fastify — a fast and low-overhead web framework for Node.js.',
  },
  {
    id: 'koa',
    name: 'Koa',
    category: 'backend-framework',
    icon: '🌿',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*Koa', confidence: 'high' },
    ],
    description: 'Koa — a new web framework designed by the team behind Express.',
  },
  {
    id: 'laravel',
    name: 'Laravel',
    category: 'backend-framework',
    icon: '🔴',
    patterns: [
      { type: 'cookie', regex: 'laravel_session', confidence: 'high' },
      { type: 'html', regex: 'laravel|csrf-token.*laravel', confidence: 'medium' },
      { type: 'header', regex: 'x-powered-by:\\s*Laravel', confidence: 'high' },
    ],
    description: 'Laravel — the PHP framework for web artisans.',
  },
  {
    id: 'symfony',
    name: 'Symfony',
    category: 'backend-framework',
    icon: '🎼',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*Symfony', confidence: 'high' },
      { type: 'cookie', regex: 'SYMFONY', confidence: 'medium' },
    ],
    description: 'Symfony — a PHP framework for web projects and reusable PHP components.',
  },
  {
    id: 'codeigniter',
    name: 'CodeIgniter',
    category: 'backend-framework',
    icon: '🔥',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*CodeIgniter', confidence: 'high' },
      { type: 'cookie', regex: 'ci_session|cisession', confidence: 'high' },
    ],
    description: 'CodeIgniter — a powerful PHP framework with a very small footprint.',
  },
  {
    id: 'cakephp',
    name: 'CakePHP',
    category: 'backend-framework',
    icon: '🎂',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*CakePHP', confidence: 'high' },
      { type: 'cookie', regex: 'CAKEPHP', confidence: 'high' },
    ],
    description: 'CakePHP — the rapid development PHP framework.',
  },
  {
    id: 'django',
    name: 'Django',
    category: 'backend-framework',
    icon: '🎸',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*Django|server:\\s*gunicorn', confidence: 'medium' },
      { type: 'cookie', regex: 'csrftoken|django', confidence: 'high' },
      { type: 'html', regex: 'csrfmiddlewaretoken', confidence: 'high' },
    ],
    description: 'Django — the web framework for perfectionists with deadlines.',
  },
  {
    id: 'flask',
    name: 'Flask',
    category: 'backend-framework',
    icon: '🍶',
    patterns: [
      { type: 'header', regex: 'server:\\s*Werkzeug|server:\\s*flask', confidence: 'high' },
      { type: 'cookie', regex: 'session', confidence: 'low' },
    ],
    description: 'Flask — a lightweight WSGI web application framework for Python.',
  },
  {
    id: 'fastapi',
    name: 'FastAPI',
    category: 'backend-framework',
    icon: '🚀',
    patterns: [
      { type: 'header', regex: 'server:\\s*uvicorn', confidence: 'medium' },
      { type: 'html', regex: 'fastapi|openapi\\.json', confidence: 'medium' },
    ],
    description: 'FastAPI — a modern, fast web framework for building APIs with Python.',
  },
  {
    id: 'pyramid',
    name: 'Pyramid',
    category: 'backend-framework',
    icon: '🔺',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*Pyramid|server:\\s*waitress', confidence: 'medium' },
      { type: 'cookie', regex: 'pyramid_', confidence: 'medium' },
    ],
    description: 'Pyramid — a Python web framework that makes it easy to write web apps.',
  },
  {
    id: 'spring-boot',
    name: 'Spring Boot',
    category: 'backend-framework',
    icon: '🍃',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*Spring|x-application-context', confidence: 'high' },
      { type: 'cookie', regex: 'JSESSIONID', confidence: 'low' },
    ],
    description: 'Spring Boot — makes it easy to create Spring-powered, production-grade applications.',
  },
  {
    id: 'micronaut',
    name: 'Micronaut',
    category: 'backend-framework',
    icon: '🔬',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*Micronaut|server:\\s*Micronaut', confidence: 'high' },
    ],
    description: 'Micronaut — a modern, JVM-based, full-stack framework for building modular applications.',
  },
  {
    id: 'quarkus',
    name: 'Quarkus',
    category: 'backend-framework',
    icon: 'Ⓠ',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*Quarkus|server:\\s*Quarkus', confidence: 'high' },
    ],
    description: 'Quarkus — a Kubernetes-native Java framework tailored for GraalVM and HotSpot.',
  },
  {
    id: 'rails',
    name: 'Rails',
    category: 'backend-framework',
    icon: '🛤️',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*Phusion|server:\\s*nginx.*Passenger', confidence: 'medium' },
      { type: 'cookie', regex: '_session_id|_rails', confidence: 'medium' },
      { type: 'html', regex: 'csrf-token.*rails|authenticity_token', confidence: 'high' },
      { type: 'meta', regex: 'Ruby on Rails', confidence: 'high' },
    ],
    description: 'Ruby on Rails — a server-side web application framework written in Ruby.',
  },
  {
    id: 'sinatra',
    name: 'Sinatra',
    category: 'backend-framework',
    icon: '🎩',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*Sinatra|server:\\s*Sinatra', confidence: 'high' },
      { type: 'header', regex: 'server:\\s*WEBrick|server:\\s*Puma', confidence: 'low' },
    ],
    description: 'Sinatra — a DSL for quickly creating web applications in Ruby.',
  },
  {
    id: 'gin',
    name: 'Gin',
    category: 'backend-framework',
    icon: '🍸',
    patterns: [
      { type: 'header', regex: 'server:\\s*Gin', confidence: 'high' },
    ],
    description: 'Gin — a HTTP web framework written in Go.',
  },
  {
    id: 'echo',
    name: 'Echo',
    category: 'backend-framework',
    icon: '🔊',
    patterns: [
      { type: 'header', regex: 'server:\\s*Echo', confidence: 'high' },
    ],
    description: 'Echo — a high performance, extensible, minimalist Go web framework.',
  },
  {
    id: 'fiber',
    name: 'Fiber',
    category: 'backend-framework',
    icon: '🧵',
    patterns: [
      { type: 'header', regex: 'server:\\s*Fiber|x-powered-by:\\s*Fiber', confidence: 'high' },
    ],
    description: 'Fiber — an Express-inspired web framework written in Go.',
  },
  {
    id: 'aspnet-core',
    name: 'ASP.NET Core',
    category: 'backend-framework',
    icon: '🔷',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*ASP\\.NET|server:\\s*Kestrel|x-aspnetcore-', confidence: 'high' },
      { type: 'cookie', regex: '\\.AspNetCore\\.', confidence: 'high' },
    ],
    description: 'ASP.NET Core — a cross-platform, high-performance framework by Microsoft.',
  },
  {
    id: 'blazor',
    name: 'Blazor',
    category: 'backend-framework',
    icon: '💜',
    patterns: [
      { type: 'html', regex: 'blazor|_blazor|_framework/blazor', confidence: 'high' },
      { type: 'script', regex: 'blazor\\.server\\.js|blazor\\.webview\\.js', confidence: 'high' },
    ],
    description: 'Blazor — build interactive web UIs using C# instead of JavaScript.',
  },
  {
    id: 'struts',
    name: 'Struts',
    category: 'backend-framework',
    icon: '🏗️',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*Struts|Struts2', confidence: 'high' },
      { type: 'url', regex: '\\.do[?"]|\\.action[?"]', confidence: 'medium' },
    ],
    description: 'Apache Struts — a free, open-source MVC framework for creating Java web applications.',
  },
  {
    id: 'play-framework',
    name: 'Play Framework',
    category: 'backend-framework',
    icon: '▶️',
    patterns: [
      { type: 'cookie', regex: 'PLAY_SESSION', confidence: 'high' },
      { type: 'header', regex: 'x-powered-by:\\s*Play', confidence: 'high' },
    ],
    description: 'Play Framework — a web framework for Scala and Java.',
  },

  // ==========================================================================
  // CMS & E-COMMERCE (16)
  // ==========================================================================
  {
    id: 'wordpress',
    name: 'WordPress',
    category: 'cms-ecommerce',
    icon: '📝',
    patterns: [
      { type: 'url', regex: '/wp-content/|/wp-includes/', confidence: 'high' },
      { type: 'meta', regex: 'WordPress\\s+\\d', confidence: 'high' },
      { type: 'script', regex: 'wp-|wp\\.js|wp-emoji', confidence: 'high' },
      { type: 'html', regex: 'wp-block|wp-image|wordpress', confidence: 'high' },
    ],
    description: 'WordPress — the world\'s most popular content management system.',
    versionRegex: 'WordPress\\s+(\\d+\\.\\d+(?:\\.\\d+)?)',
  },
  {
    id: 'shopify',
    name: 'Shopify',
    category: 'cms-ecommerce',
    icon: '🛍️',
    patterns: [
      { type: 'html', regex: 'Shopify\\.theme|shopify\\.com|cdn\\.shopify\\.com', confidence: 'high' },
      { type: 'script', regex: 'shopify', confidence: 'high' },
      { type: 'url', regex: '/cdn/shop/', confidence: 'high' },
      { type: 'cookie', regex: '_shopify_', confidence: 'high' },
    ],
    description: 'Shopify — a complete commerce platform for online stores.',
  },
  {
    id: 'webflow',
    name: 'Webflow',
    category: 'cms-ecommerce',
    icon: '🌐',
    patterns: [
      { type: 'html', regex: 'data-wf-|webflow\\.com|wf-module', confidence: 'high' },
      { type: 'script', regex: 'webflow\\.js|webflow\\.min\\.js', confidence: 'high' },
      { type: 'css', regex: 'w-', confidence: 'medium' },
    ],
    description: 'Webflow — a visual web design tool, CMS, and hosting platform.',
  },
  {
    id: 'wix',
    name: 'Wix',
    category: 'cms-ecommerce',
    icon: '✨',
    patterns: [
      { type: 'html', regex: 'wix\\.com|wixcode|_wix_', confidence: 'high' },
      { type: 'script', regex: 'wix', confidence: 'medium' },
      { type: 'url', regex: 'wixstatic\\.com', confidence: 'high' },
    ],
    description: 'Wix — a cloud-based web development platform.',
  },
  {
    id: 'squarespace',
    name: 'Squarespace',
    category: 'cms-ecommerce',
    icon: '⬛',
    patterns: [
      { type: 'html', regex: 'squarespace\\.com|sqs-', confidence: 'high' },
      { type: 'script', regex: 'squarespace', confidence: 'high' },
      { type: 'cookie', regex: '_squared_', confidence: 'medium' },
    ],
    description: 'Squarespace — a website building and hosting platform.',
  },
  {
    id: 'ghost',
    name: 'Ghost',
    category: 'cms-ecommerce',
    icon: '👻',
    patterns: [
      { type: 'meta', regex: 'Ghost\\s+\\d', confidence: 'high' },
      { type: 'header', regex: 'x-powered-by:\\s*Ghost', confidence: 'high' },
      { type: 'script', regex: 'ghost-sdk|ghost\\.min\\.js', confidence: 'high' },
    ],
    description: 'Ghost — a powerful platform for creating professional publications.',
  },
  {
    id: 'contentful-cms',
    name: 'Contentful',
    category: 'cms-ecommerce',
    icon: '📦',
    patterns: [
      { type: 'script', regex: 'contentful\\.com|ctf\\.assets', confidence: 'high' },
      { type: 'html', regex: 'contentful', confidence: 'medium' },
    ],
    description: 'Contentful — the content platform for digital teams.',
  },
  {
    id: 'strapi-cms',
    name: 'Strapi',
    category: 'cms-ecommerce',
    icon: '🦾',
    patterns: [
      { type: 'html', regex: 'strapi', confidence: 'medium' },
      { type: 'header', regex: 'x-powered-by:\\s*Strapi', confidence: 'high' },
    ],
    description: 'Strapi — the leading open-source headless CMS.',
  },
  {
    id: 'sanity-cms',
    name: 'Sanity',
    category: 'cms-ecommerce',
    icon: '🧠',
    patterns: [
      { type: 'script', regex: 'sanity\\.io|sanity\\.min\\.js|@sanity', confidence: 'high' },
      { type: 'html', regex: 'sanity', confidence: 'medium' },
    ],
    description: 'Sanity — the platform for structured content.',
  },
  {
    id: 'drupal',
    name: 'Drupal',
    category: 'cms-ecommerce',
    icon: '💧',
    patterns: [
      { type: 'meta', regex: 'Drupal\\s+\\d', confidence: 'high' },
      { type: 'html', regex: 'drupal|Drupal\\.settings', confidence: 'high' },
      { type: 'script', regex: 'drupal\\.js|drupal\\.min\\.js', confidence: 'high' },
      { type: 'header', regex: 'x-drupal-cache|x-generator:\\s*Drupal', confidence: 'high' },
    ],
    description: 'Drupal — an open-source content management framework.',
  },
  {
    id: 'joomla',
    name: 'Joomla',
    category: 'cms-ecommerce',
    icon: '🤖',
    patterns: [
      { type: 'meta', regex: 'Joomla!', confidence: 'high' },
      { type: 'html', regex: '/media/jui/|/media/system/', confidence: 'high' },
      { type: 'script', regex: 'joomla', confidence: 'high' },
    ],
    description: 'Joomla — a free and open-source CMS for publishing web content.',
  },
  {
    id: 'magento',
    name: 'Magento',
    category: 'cms-ecommerce',
    icon: '🛒',
    patterns: [
      { type: 'meta', regex: 'Magento', confidence: 'high' },
      { type: 'html', regex: 'mage\\.cookies|magento', confidence: 'high' },
      { type: 'script', regex: 'Magento_', confidence: 'high' },
      { type: 'cookie', regex: 'mage-cache', confidence: 'high' },
    ],
    description: 'Magento — an open-source e-commerce platform.',
  },
  {
    id: 'bigcommerce',
    name: 'BigCommerce',
    category: 'cms-ecommerce',
    icon: '🏪',
    patterns: [
      { type: 'html', regex: 'bigcommerce\\.com|bc-sf', confidence: 'high' },
      { type: 'script', regex: 'bigcommerce|bigcommerce\\.js', confidence: 'high' },
    ],
    description: 'BigCommerce — a leading e-commerce platform for growing businesses.',
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    category: 'cms-ecommerce',
    icon: '🟣',
    patterns: [
      { type: 'html', regex: 'woocommerce|wc-block', confidence: 'high' },
      { type: 'script', regex: 'woocommerce', confidence: 'high' },
      { type: 'css', regex: 'woocommerce', confidence: 'high' },
    ],
    description: 'WooCommerce — the most popular WordPress e-commerce plugin.',
  },
  {
    id: 'prestashop',
    name: 'PrestaShop',
    category: 'cms-ecommerce',
    icon: '🛍️',
    patterns: [
      { type: 'meta', regex: 'PrestaShop', confidence: 'high' },
      { type: 'html', regex: 'prestashop|ps-[a-z]+', confidence: 'high' },
      { type: 'cookie', regex: 'PrestaShop', confidence: 'high' },
    ],
    description: 'PrestaShop — an efficient and innovative e-commerce solution.',
  },
  {
    id: 'adobe-commerce',
    name: 'Adobe Commerce',
    category: 'cms-ecommerce',
    icon: '🟥',
    patterns: [
      { type: 'meta', regex: 'Adobe Commerce|Magento.*Adobe', confidence: 'high' },
      { type: 'html', regex: 'adobe-commerce', confidence: 'medium' },
    ],
    description: 'Adobe Commerce (formerly Magento) — an enterprise e-commerce platform.',
  },

  // ==========================================================================
  // DATABASES (13)
  // ==========================================================================
  {
    id: 'mysql',
    name: 'MySQL',
    category: 'database',
    icon: '🐬',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*MySQL|server:\\s*MySQL', confidence: 'medium' },
      { type: 'html', regex: 'mysql', confidence: 'low' },
    ],
    description: 'MySQL — the world\'s most popular open-source relational database.',
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    category: 'database',
    icon: '🐘',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*PostgreSQL|server:\\s*PostgreSQL', confidence: 'medium' },
      { type: 'html', regex: 'postgresql|postgres', confidence: 'low' },
    ],
    description: 'PostgreSQL — the world\'s most advanced open-source relational database.',
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    category: 'database',
    icon: '🍃',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*MongoDB|x-mongodb', confidence: 'medium' },
      { type: 'html', regex: 'mongodb|mongoose', confidence: 'low' },
    ],
    description: 'MongoDB — a document-oriented database classified as NoSQL.',
  },
  {
    id: 'firebase-db',
    name: 'Firebase',
    category: 'database',
    icon: '🔥',
    patterns: [
      { type: 'script', regex: 'firebase\\.js|firebaseapp\\.com|firebase\\.googleapis', confidence: 'high' },
      { type: 'html', regex: 'firebase', confidence: 'medium' },
    ],
    description: 'Firebase — Google\'s platform for building mobile and web applications.',
  },
  {
    id: 'redis',
    name: 'Redis',
    category: 'database',
    icon: '🔴',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*Redis|server:\\s*Redis', confidence: 'medium' },
      { type: 'cookie', regex: 'redis', confidence: 'low' },
    ],
    description: 'Redis — an in-memory data structure store used as a database and cache.',
  },
  {
    id: 'elasticsearch',
    name: 'Elasticsearch',
    category: 'database',
    icon: '🔎',
    patterns: [
      { type: 'header', regex: 'x-elastic|x-found', confidence: 'medium' },
      { type: 'html', regex: 'elasticsearch|elastic\\.co', confidence: 'low' },
    ],
    description: 'Elasticsearch — a distributed, RESTful search and analytics engine.',
  },
  {
    id: 'mariadb',
    name: 'MariaDB',
    category: 'database',
    icon: '🦭',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*MariaDB|server:\\s*MariaDB', confidence: 'medium' },
    ],
    description: 'MariaDB — an enhanced, community-developed fork of MySQL.',
  },
  {
    id: 'sqlite',
    name: 'SQLite',
    category: 'database',
    icon: '🪶',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*SQLite', confidence: 'medium' },
      { type: 'html', regex: 'sqlite', confidence: 'low' },
    ],
    description: 'SQLite — a C-language library implementing a small, fast, self-contained SQL database.',
  },
  {
    id: 'supabase',
    name: 'Supabase',
    category: 'database',
    icon: '⚡',
    patterns: [
      { type: 'script', regex: 'supabase\\.js|supabase\\.co|@supabase', confidence: 'high' },
      { type: 'html', regex: 'supabase', confidence: 'medium' },
    ],
    description: 'Supabase — the open-source Firebase alternative built on PostgreSQL.',
  },
  {
    id: 'dynamodb',
    name: 'DynamoDB',
    category: 'database',
    icon: '🔶',
    patterns: [
      { type: 'header', regex: 'x-amz-cf-|x-amzn-', confidence: 'low' },
      { type: 'html', regex: 'dynamodb', confidence: 'low' },
    ],
    description: 'Amazon DynamoDB — a serverless, NoSQL database for single-digit millisecond performance.',
  },
  {
    id: 'cassandra',
    name: 'Cassandra',
    category: 'database',
    icon: '🏛️',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*Cassandra', confidence: 'medium' },
      { type: 'html', regex: 'cassandra', confidence: 'low' },
    ],
    description: 'Apache Cassandra — a free, open-source, distributed NoSQL database.',
  },
  {
    id: 'neo4j',
    name: 'Neo4j',
    category: 'database',
    icon: '🔗',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*Neo4j', confidence: 'medium' },
      { type: 'html', regex: 'neo4j', confidence: 'low' },
    ],
    description: 'Neo4j — the world\'s leading graph database.',
  },
  {
    id: 'cockroachdb',
    name: 'CockroachDB',
    category: 'database',
    icon: '🪳',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*CockroachDB|server:\\s*CockroachDB', confidence: 'medium' },
      { type: 'html', regex: 'cockroachdb', confidence: 'low' },
    ],
    description: 'CockroachDB — a distributed SQL database for cloud-native applications.',
  },

  // ==========================================================================
  // HOSTING & CLOUD (16)
  // ==========================================================================
  {
    id: 'aws',
    name: 'AWS',
    category: 'hosting-cloud',
    icon: '☁️',
    patterns: [
      { type: 'header', regex: 'x-amz-|x-aws-|server:\\s*AmazonS3|server:\\s*CloudFront', confidence: 'high' },
      { type: 'url', regex: 'amazonaws\\.com|aws\\.amazon', confidence: 'high' },
      { type: 'cookie', regex: 'aws', confidence: 'low' },
    ],
    description: 'Amazon Web Services — the world\'s most comprehensive cloud platform.',
  },
  {
    id: 'gcp',
    name: 'GCP',
    category: 'hosting-cloud',
    icon: '🌐',
    patterns: [
      { type: 'header', regex: 'server:\\s*Google|x-goog-|gcloud', confidence: 'high' },
      { type: 'url', regex: 'googleapis\\.com|googlecloud', confidence: 'high' },
    ],
    description: 'Google Cloud Platform — Google\'s suite of cloud computing services.',
  },
  {
    id: 'azure',
    name: 'Azure',
    category: 'hosting-cloud',
    icon: '🔷',
    patterns: [
      { type: 'header', regex: 'x-azure|x-ms-|server:\\s*Microsoft', confidence: 'high' },
      { type: 'url', regex: 'azure\\.com|azureedge\\.net', confidence: 'high' },
    ],
    description: 'Microsoft Azure — a cloud computing platform by Microsoft.',
  },
  {
    id: 'vercel',
    name: 'Vercel',
    category: 'hosting-cloud',
    icon: '▲',
    patterns: [
      { type: 'header', regex: 'x-vercel-id|x-vercel-cache|server:\\s*Vercel', confidence: 'high' },
      { type: 'url', regex: 'vercel\\.app|now\\.sh', confidence: 'high' },
      { type: 'html', regex: 'vercel', confidence: 'medium' },
    ],
    description: 'Vercel — the platform for frontend developers, by the creators of Next.js.',
  },
  {
    id: 'netlify',
    name: 'Netlify',
    category: 'hosting-cloud',
    icon: '🌐',
    patterns: [
      { type: 'header', regex: 'x-nf-request-id|server:\\s*Netlify', confidence: 'high' },
      { type: 'url', regex: 'netlify\\.app|netlify\\.com', confidence: 'high' },
    ],
    description: 'Netlify — the modern web platform for faster, safer websites.',
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    category: 'hosting-cloud',
    icon: '☁️',
    patterns: [
      { type: 'header', regex: 'cf-ray|server:\\s*cloudflare|cf-cache-status', confidence: 'high' },
      { type: 'cookie', regex: '__cfduid|__cf_bm', confidence: 'high' },
    ],
    description: 'Cloudflare — the web infrastructure and website security company.',
  },
  {
    id: 'heroku',
    name: 'Heroku',
    category: 'hosting-cloud',
    icon: '💜',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*Heroku|server:\\s*Heroku', confidence: 'high' },
      { type: 'url', regex: 'herokuapp\\.com|heroku\\.com', confidence: 'high' },
      { type: 'cookie', regex: 'heroku', confidence: 'medium' },
    ],
    description: 'Heroku — a platform as a service for building, running, and scaling apps.',
  },
  {
    id: 'digitalocean',
    name: 'DigitalOcean',
    category: 'hosting-cloud',
    icon: '🌊',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*DigitalOcean|server:\\s*DigitalOcean', confidence: 'medium' },
      { type: 'url', regex: 'digitaloceanspaces\\.com|\\.digitalocean\\.', confidence: 'high' },
    ],
    description: 'DigitalOcean — a cloud infrastructure provider.',
  },
  {
    id: 'render',
    name: 'Render',
    category: 'hosting-cloud',
    icon: '🟢',
    patterns: [
      { type: 'header', regex: 'x-render-origin|server:\\s*Render', confidence: 'high' },
      { type: 'url', regex: 'onrender\\.com|render\\.com', confidence: 'high' },
    ],
    description: 'Render — a modern cloud platform for apps and websites.',
  },
  {
    id: 'railway',
    name: 'Railway',
    category: 'hosting-cloud',
    icon: '🚂',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*Railway|server:\\s*Railway', confidence: 'medium' },
      { type: 'url', regex: 'railway\\.app|up\\.railway\\.app', confidence: 'high' },
    ],
    description: 'Railway — infrastructure, instantly. Made for any language, for projects of any size.',
  },
  {
    id: 'flyio',
    name: 'Fly.io',
    category: 'hosting-cloud',
    icon: '✈️',
    patterns: [
      { type: 'header', regex: 'x-fly-region|server:\\s*Fly', confidence: 'high' },
      { type: 'url', regex: 'fly\\.dev|\\.fly\\.io', confidence: 'high' },
    ],
    description: 'Fly.io — run apps close to your users globally.',
  },
  {
    id: 'github-pages',
    name: 'GitHub Pages',
    category: 'hosting-cloud',
    icon: '🐙',
    patterns: [
      { type: 'header', regex: 'server:\\s*GitHub\\.com|x-github-request-id', confidence: 'high' },
      { type: 'url', regex: 'github\\.io', confidence: 'high' },
    ],
    description: 'GitHub Pages — websites for you and your projects, hosted from a GitHub repo.',
  },
  {
    id: 'firebase-hosting',
    name: 'Firebase Hosting',
    category: 'hosting-cloud',
    icon: '🔥',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*Firebase|server:\\s*Firebase', confidence: 'high' },
      { type: 'url', regex: 'firebaseapp\\.com|web\\.app|firebase\\.app', confidence: 'high' },
    ],
    description: 'Firebase Hosting — production-grade web content hosting by Google.',
  },
  {
    id: 'vultr',
    name: 'Vultr',
    category: 'hosting-cloud',
    icon: '🖥️',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*Vultr|server:\\s*Vultr', confidence: 'medium' },
      { type: 'url', regex: 'vultr\\.com', confidence: 'low' },
    ],
    description: 'Vultr — high-performance cloud compute.',
  },
  {
    id: 'linode',
    name: 'Linode',
    category: 'hosting-cloud',
    icon: '📗',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*Linode|server:\\s*Linode', confidence: 'medium' },
      { type: 'url', regex: 'linode\\.com', confidence: 'low' },
    ],
    description: 'Linode (now Akamai) — a cloud computing provider.',
  },
  {
    id: 'pantheon',
    name: 'Pantheon',
    category: 'hosting-cloud',
    icon: '🏛️',
    patterns: [
      { type: 'header', regex: 'x-pantheon|x-styx', confidence: 'high' },
      { type: 'url', regex: 'pantheon\\.io|pantheonsite\\.io', confidence: 'high' },
    ],
    description: 'Pantheon — the website operations platform for Drupal and WordPress.',
  },

  // ==========================================================================
  // JS LIBRARIES (20)
  // ==========================================================================
  {
    id: 'jquery',
    name: 'jQuery',
    category: 'js-library',
    icon: '💲',
    patterns: [
      { type: 'script', regex: 'jquery[.-]\\d|jquery\\.min\\.js|jquery\\.js', confidence: 'high' },
      { type: 'js-global', regex: 'jQuery|\\$\\(\\)', confidence: 'high' },
    ],
    description: 'jQuery — a fast, small, and feature-rich JavaScript library.',
    versionRegex: 'jquery[/.-](\\d+\\.\\d+(?:\\.\\d+)?)',
  },
  {
    id: 'lodash',
    name: 'Lodash',
    category: 'js-library',
    icon: '🔧',
    patterns: [
      { type: 'script', regex: 'lodash\\.min\\.js|lodash\\.js', confidence: 'high' },
      { type: 'js-global', regex: '_\\.VERSION|lodash', confidence: 'medium' },
    ],
    description: 'Lodash — a modern JavaScript utility library delivering modularity and performance.',
  },
  {
    id: 'momentjs',
    name: 'Moment.js',
    category: 'js-library',
    icon: '🕐',
    patterns: [
      { type: 'script', regex: 'moment\\.min\\.js|moment\\.js|moment-timezone', confidence: 'high' },
      { type: 'js-global', regex: 'moment\\(\\)|moment\\.format', confidence: 'high' },
    ],
    description: 'Moment.js — a JavaScript date library for parsing, validating, and formatting dates.',
  },
  {
    id: 'axios',
    name: 'Axios',
    category: 'js-library',
    icon: '📡',
    patterns: [
      { type: 'script', regex: 'axios\\.min\\.js|axios\\.js', confidence: 'high' },
      { type: 'js-global', regex: 'axios\\.create|axios\\.get', confidence: 'medium' },
    ],
    description: 'Axios — a promise-based HTTP client for the browser and Node.js.',
  },
  {
    id: 'd3js',
    name: 'D3.js',
    category: 'js-library',
    icon: '📊',
    patterns: [
      { type: 'script', regex: 'd3\\.min\\.js|d3\\.js|d3-', confidence: 'high' },
      { type: 'js-global', regex: 'd3\\.select|d3\\.scale', confidence: 'high' },
    ],
    description: 'D3.js — a JavaScript library for producing dynamic, interactive data visualizations.',
  },
  {
    id: 'threejs',
    name: 'Three.js',
    category: 'js-library',
    icon: '🧊',
    patterns: [
      { type: 'script', regex: 'three\\.min\\.js|three\\.js|three\\.module', confidence: 'high' },
      { type: 'js-global', regex: 'THREE\\.(?:Scene|PerspectiveCamera|WebGLRenderer)', confidence: 'high' },
    ],
    description: 'Three.js — a cross-browser JavaScript library for 3D graphics in the browser.',
  },
  {
    id: 'gsap',
    name: 'GSAP',
    category: 'js-library',
    icon: '🎬',
    patterns: [
      { type: 'script', regex: 'gsap\\.min\\.js|gsap\\.js|TweenMax|TweenLite', confidence: 'high' },
      { type: 'js-global', regex: 'gsap\\.(?:to|from|timeline)', confidence: 'high' },
    ],
    description: 'GreenSock Animation Platform — a JavaScript library for high-performance animations.',
  },
  {
    id: 'chartjs',
    name: 'Chart.js',
    category: 'js-library',
    icon: '📈',
    patterns: [
      { type: 'script', regex: 'chart\\.js|chart\\.min\\.js|Chart\\.js', confidence: 'high' },
      { type: 'js-global', regex: 'Chart\\.(?:register|defaults)', confidence: 'high' },
    ],
    description: 'Chart.js — a simple yet flexible JavaScript charting library.',
  },
  {
    id: 'tailwindcss',
    name: 'Tailwind CSS',
    category: 'js-library',
    icon: '🌬️',
    patterns: [
      { type: 'html', regex: 'tailwind\\.css|tailwindcss', confidence: 'high' },
      { type: 'css', regex: 'tw-|@tailwind|@apply', confidence: 'high' },
      { type: 'script', regex: 'tailwindcss', confidence: 'medium' },
    ],
    description: 'Tailwind CSS — a utility-first CSS framework for rapid UI development.',
  },
  {
    id: 'bootstrap',
    name: 'Bootstrap',
    category: 'js-library',
    icon: '🅱️',
    patterns: [
      { type: 'script', regex: 'bootstrap[.-]\\d|bootstrap\\.min\\.js|bootstrap\\.js', confidence: 'high' },
      { type: 'css', regex: 'bootstrap(?:\\.min)?\\.css', confidence: 'high' },
      { type: 'html', regex: 'data-bs-|class="[^"]*(?:container|row|col-(?:xs|sm|md|lg|xl))', confidence: 'high' },
    ],
    description: 'Bootstrap — the world\'s most popular front-end open-source toolkit.',
    versionRegex: 'bootstrap[/.-](\\d+\\.\\d+(?:\\.\\d+)?)',
  },
  {
    id: 'material-ui',
    name: 'Material UI',
    category: 'js-library',
    icon: '🎨',
    patterns: [
      { type: 'html', regex: 'MuiTypography|MuiButton|MuiPaper|data-mui', confidence: 'high' },
      { type: 'css', regex: 'MuiBox|MuiGrid|MuiContainer', confidence: 'high' },
      { type: 'script', regex: '@mui/material', confidence: 'high' },
    ],
    description: 'Material UI — a React component library implementing Google\'s Material Design.',
  },
  {
    id: 'chakra-ui',
    name: 'Chakra UI',
    category: 'js-library',
    icon: '⚡',
    patterns: [
      { type: 'html', regex: 'chakra-ui|css-0|data-chakra', confidence: 'high' },
      { type: 'script', regex: '@chakra-ui', confidence: 'high' },
    ],
    description: 'Chakra UI — a simple, modular component library for React.',
  },
  {
    id: 'ant-design',
    name: 'Ant Design',
    category: 'js-library',
    icon: '🐜',
    patterns: [
      { type: 'html', regex: 'ant-|anticon|ant-design', confidence: 'high' },
      { type: 'css', regex: 'ant-btn|ant-input|ant-table', confidence: 'high' },
      { type: 'script', regex: 'antd', confidence: 'high' },
    ],
    description: 'Ant Design — a design system for enterprise-level products.',
  },
  {
    id: 'emotion',
    name: 'Emotion',
    category: 'js-library',
    icon: '🎭',
    patterns: [
      { type: 'html', regex: 'css-[a-z0-9]+|emotion', confidence: 'medium' },
      { type: 'css', regex: 'css-[a-z0-9]+', confidence: 'medium' },
    ],
    description: 'Emotion — a performant and flexible CSS-in-JS library.',
  },
  {
    id: 'styled-components',
    name: 'Styled Components',
    category: 'js-library',
    icon: '💅',
    patterns: [
      { type: 'html', regex: 'sc-[a-zA-Z]+|data-styled', confidence: 'high' },
      { type: 'css', regex: 'sc-[a-zA-Z]+', confidence: 'high' },
    ],
    description: 'Styled Components — visual primitives for the component age.',
  },
  {
    id: 'framer-motion',
    name: 'Framer Motion',
    category: 'js-library',
    icon: '🌀',
    patterns: [
      { type: 'script', regex: 'framer-motion|framer\\.motion', confidence: 'high' },
      { type: 'html', regex: 'data-framer', confidence: 'medium' },
    ],
    description: 'Framer Motion — a production-ready motion library for React.',
  },
  {
    id: 'dayjs',
    name: 'Day.js',
    category: 'js-library',
    icon: '📅',
    patterns: [
      { type: 'script', regex: 'dayjs\\.min\\.js|day\\.js', confidence: 'high' },
      { type: 'js-global', regex: 'dayjs\\(\\)', confidence: 'medium' },
    ],
    description: 'Day.js — a minimalist JavaScript library that parses and formats dates.',
  },
  {
    id: 'date-fns',
    name: 'date-fns',
    category: 'js-library',
    icon: '🗓️',
    patterns: [
      { type: 'script', regex: 'date-fns', confidence: 'high' },
      { type: 'js-global', regex: 'dateFns', confidence: 'medium' },
    ],
    description: 'date-fns — a modern JavaScript date utility library.',
  },
  {
    id: 'ramda',
    name: 'Ramda',
    category: 'js-library',
    icon: '🐏',
    patterns: [
      { type: 'script', regex: 'ramda\\.min\\.js|ramda\\.js', confidence: 'high' },
      { type: 'js-global', regex: 'R\\.\\w+', confidence: 'low' },
    ],
    description: 'Ramda — a practical functional library for JavaScript programmers.',
  },
  {
    id: 'swiper',
    name: 'Swiper',
    category: 'js-library',
    icon: '🎯',
    patterns: [
      { type: 'script', regex: 'swiper\\.min\\.js|swiper\\.js|swiper-bundle', confidence: 'high' },
      { type: 'html', regex: 'swiper-container|swiper-slide|data-swiper', confidence: 'high' },
      { type: 'css', regex: 'swiper', confidence: 'high' },
    ],
    description: 'Swiper — the most modern free mobile touch slider with hardware accelerated transitions.',
  },

  // ==========================================================================
  // API & NETWORK (10)
  // ==========================================================================
  {
    id: 'rest-api',
    name: 'REST API',
    category: 'api-network',
    icon: '🔗',
    patterns: [
      { type: 'html', regex: '/api/v\\d+|/api/rest|swagger\\.json|openapi\\.json', confidence: 'medium' },
      { type: 'url', regex: '/api/v\\d+|/rest/', confidence: 'medium' },
    ],
    description: 'REST API — Representational State Transfer architectural style for web services.',
  },
  {
    id: 'graphql',
    name: 'GraphQL',
    category: 'api-network',
    icon: '◈',
    patterns: [
      { type: 'html', regex: '/graphql|graphql', confidence: 'high' },
      { type: 'script', regex: 'graphql|graphql\\.js', confidence: 'high' },
      { type: 'url', regex: '/graphql', confidence: 'high' },
    ],
    description: 'GraphQL — a query language for APIs and a runtime for executing those queries.',
  },
  {
    id: 'apollo',
    name: 'Apollo',
    category: 'api-network',
    icon: '🌙',
    patterns: [
      { type: 'script', regex: 'apollo-client|@apollo|apollo-boost', confidence: 'high' },
      { type: 'js-global', regex: '__APOLLO_|ApolloClient', confidence: 'high' },
    ],
    description: 'Apollo — a platform for building a supergraph, a unified network of GraphQL APIs.',
  },
  {
    id: 'urql',
    name: 'URQL',
    category: 'api-network',
    icon: '🔄',
    patterns: [
      { type: 'script', regex: 'urql|@urql', confidence: 'high' },
    ],
    description: 'URQL — a highly customizable and versatile GraphQL client.',
  },
  {
    id: 'websocket',
    name: 'WebSocket',
    category: 'api-network',
    icon: '🔌',
    patterns: [
      { type: 'header', regex: 'upgrade:\\s*websocket|connection:\\s*upgrade', confidence: 'high' },
      { type: 'script', regex: 'WebSocket|ws://|wss://', confidence: 'high' },
      { type: 'js-global', regex: 'WebSocket', confidence: 'medium' },
    ],
    description: 'WebSocket — a protocol providing full-duplex communication channels over TCP.',
  },
  {
    id: 'stripe-api',
    name: 'Stripe API',
    category: 'api-network',
    icon: '💳',
    patterns: [
      { type: 'script', regex: 'stripe\\.js|stripe\\.com|js\\.stripe\\.com', confidence: 'high' },
      { type: 'html', regex: 'stripe|data-stripe', confidence: 'high' },
    ],
    description: 'Stripe API — a payment processing platform for internet businesses.',
  },
  {
    id: 'google-maps-api',
    name: 'Google Maps API',
    category: 'api-network',
    icon: '🗺️',
    patterns: [
      { type: 'script', regex: 'maps\\.googleapis\\.com/maps/api/js|maps\\.google\\.com', confidence: 'high' },
      { type: 'html', regex: 'gm-[a-z]+|google.maps', confidence: 'high' },
      { type: 'js-global', regex: 'google\\.maps', confidence: 'high' },
    ],
    description: 'Google Maps API — a collection of APIs for embedding maps in web pages.',
  },
  {
    id: 'openai-api',
    name: 'OpenAI API',
    category: 'api-network',
    icon: '🤖',
    patterns: [
      { type: 'script', regex: 'openai\\.com|api\\.openai\\.com', confidence: 'high' },
      { type: 'html', regex: 'openai', confidence: 'medium' },
    ],
    description: 'OpenAI API — API access to OpenAI\'s powerful language models.',
  },
  {
    id: 'twilio',
    name: 'Twilio',
    category: 'api-network',
    icon: '📞',
    patterns: [
      { type: 'script', regex: 'twilio\\.com|twilio\\.js', confidence: 'high' },
      { type: 'html', regex: 'twilio', confidence: 'medium' },
    ],
    description: 'Twilio — a cloud communications platform as a service.',
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    category: 'api-network',
    icon: '📧',
    patterns: [
      { type: 'script', regex: 'sendgrid\\.com|sg-analytics', confidence: 'high' },
      { type: 'header', regex: 'x-sendgrid', confidence: 'medium' },
    ],
    description: 'SendGrid — an email delivery and management platform.',
  },

  // ==========================================================================
  // BUILD TOOLS (12)
  // ==========================================================================
  {
    id: 'webpack',
    name: 'Webpack',
    category: 'build-tool',
    icon: '📦',
    patterns: [
      { type: 'script', regex: 'webpack|webpackChunk|webpackJsonp|webpack-', confidence: 'high' },
      { type: 'html', regex: 'webpack', confidence: 'medium' },
      { type: 'js-global', regex: '__webpack_require__|__webpack_public_path__', confidence: 'high' },
    ],
    description: 'Webpack — a static module bundler for modern JavaScript applications.',
  },
  {
    id: 'vite',
    name: 'Vite',
    category: 'build-tool',
    icon: '⚡',
    patterns: [
      { type: 'script', regex: '/@vite/client|/@vite/env', confidence: 'high' },
      { type: 'html', regex: 'type="module"[^>]*src|vite-module', confidence: 'medium' },
      { type: 'meta', regex: 'vite', confidence: 'low' },
    ],
    description: 'Vite — the next-generation frontend build tool.',
  },
  {
    id: 'esbuild',
    name: 'esbuild',
    category: 'build-tool',
    icon: '🏗️',
    patterns: [
      { type: 'meta', regex: 'esbuild', confidence: 'low' },
      { type: 'html', regex: 'esbuild', confidence: 'low' },
    ],
    description: 'esbuild — an extremely fast JavaScript bundler and minifier.',
  },
  {
    id: 'rollup',
    name: 'Rollup',
    category: 'build-tool',
    icon: '🌯',
    patterns: [
      { type: 'meta', regex: 'rollup', confidence: 'low' },
      { type: 'js-global', regex: 'ROLLUP_ASSETS', confidence: 'medium' },
    ],
    description: 'Rollup — a module bundler for JavaScript that compiles small pieces of code.',
  },
  {
    id: 'parcel',
    name: 'Parcel',
    category: 'build-tool',
    icon: '📦',
    patterns: [
      { type: 'script', regex: 'parcel', confidence: 'medium' },
      { type: 'html', regex: '/parcel/', confidence: 'medium' },
    ],
    description: 'Parcel — a zero-configuration web application bundler.',
  },
  {
    id: 'turbopack',
    name: 'Turbopack',
    category: 'build-tool',
    icon: '🌀',
    patterns: [
      { type: 'meta', regex: 'turbopack', confidence: 'low' },
      { type: 'html', regex: 'turbopack', confidence: 'low' },
    ],
    description: 'Turbopack — the Rust-powered successor to Webpack by Vercel.',
  },
  {
    id: 'babel',
    name: 'Babel',
    category: 'build-tool',
    icon: '🅱️',
    patterns: [
      { type: 'script', regex: 'babel\\.js|babel-standalone|@babel', confidence: 'high' },
      { type: 'html', regex: 'type=["\']text/babel["\']', confidence: 'high' },
    ],
    description: 'Babel — a JavaScript compiler that transforms modern JS into backward-compatible versions.',
  },
  {
    id: 'swc',
    name: 'SWC',
    category: 'build-tool',
    icon: '⚙️',
    patterns: [
      { type: 'meta', regex: 'swc', confidence: 'low' },
      { type: 'html', regex: 'swc', confidence: 'low' },
    ],
    description: 'SWC — a fast TypeScript/JavaScript compiler written in Rust.',
  },
  {
    id: 'grunt',
    name: 'Grunt',
    category: 'build-tool',
    icon: '🐗',
    patterns: [
      { type: 'meta', regex: 'grunt', confidence: 'low' },
      { type: 'html', regex: 'grunt', confidence: 'low' },
    ],
    description: 'Grunt — the JavaScript task runner.',
  },
  {
    id: 'gulp',
    name: 'Gulp',
    category: 'build-tool',
    icon: '🥤',
    patterns: [
      { type: 'meta', regex: 'gulp', confidence: 'low' },
      { type: 'html', regex: 'gulp', confidence: 'low' },
    ],
    description: 'Gulp — a toolkit for automating painful or time-consuming tasks in your workflow.',
  },
  {
    id: 'postcss',
    name: 'PostCSS',
    category: 'build-tool',
    icon: '🎨',
    patterns: [
      { type: 'css', regex: 'postcss', confidence: 'medium' },
      { type: 'meta', regex: 'postcss', confidence: 'low' },
    ],
    description: 'PostCSS — a tool for transforming CSS with JavaScript plugins.',
  },
  {
    id: 'terser',
    name: 'terser',
    category: 'build-tool',
    icon: '✂️',
    patterns: [
      { type: 'meta', regex: 'terser', confidence: 'low' },
    ],
    description: 'Terser — a JavaScript parser, mangler, and compressor toolkit for ES6+.',
  },

  // ==========================================================================
  // CI/CD (6)
  // ==========================================================================
  {
    id: 'github-actions',
    name: 'GitHub Actions',
    category: 'cicd',
    icon: '🐙',
    patterns: [
      { type: 'header', regex: 'x-github-request-id', confidence: 'medium' },
      { type: 'html', regex: 'github\\.com/.*/actions|github-actions', confidence: 'medium' },
    ],
    description: 'GitHub Actions — automate your software workflows with CI/CD on GitHub.',
  },
  {
    id: 'gitlab-ci',
    name: 'GitLab CI',
    category: 'cicd',
    icon: '🦊',
    patterns: [
      { type: 'header', regex: 'x-gitlab', confidence: 'medium' },
      { type: 'html', regex: 'gitlab\\.com|gitlab-ci', confidence: 'medium' },
    ],
    description: 'GitLab CI — a continuous integration service built into GitLab.',
  },
  {
    id: 'jenkins',
    name: 'Jenkins',
    category: 'cicd',
    icon: '👷',
    patterns: [
      { type: 'header', regex: 'x-jenkins|x-hudson', confidence: 'high' },
      { type: 'html', regex: 'jenkins|hudson', confidence: 'medium' },
    ],
    description: 'Jenkins — the leading open-source automation server.',
  },
  {
    id: 'circleci',
    name: 'CircleCI',
    category: 'cicd',
    icon: '⭕',
    patterns: [
      { type: 'html', regex: 'circleci\\.com|circle-ci', confidence: 'medium' },
    ],
    description: 'CircleCI — a continuous integration and delivery platform.',
  },
  {
    id: 'docker',
    name: 'Docker',
    category: 'cicd',
    icon: '🐳',
    patterns: [
      { type: 'header', regex: 'x-docker|server:\\s*Docker|docker', confidence: 'medium' },
      { type: 'html', regex: 'docker', confidence: 'low' },
    ],
    description: 'Docker — a platform for building, shipping, and running applications in containers.',
  },
  {
    id: 'travis-ci',
    name: 'Travis CI',
    category: 'cicd',
    icon: '🔧',
    patterns: [
      { type: 'html', regex: 'travis-ci\\.org|travis-ci\\.com', confidence: 'medium' },
    ],
    description: 'Travis CI — a hosted continuous integration service for open-source projects.',
  },

  // ==========================================================================
  // ANALYTICS (10)
  // ==========================================================================
  {
    id: 'google-analytics-ua',
    name: 'Google Analytics (UA)',
    category: 'analytics',
    icon: '📊',
    patterns: [
      { type: 'script', regex: 'google-analytics\\.com/analytics\\.js|ga\\(\\)|UA-\\d+-\\d+', confidence: 'high' },
      { type: 'js-global', regex: 'ga\\(|gtag\\(', confidence: 'high' },
      { type: 'cookie', regex: '_ga|_gid|_gat', confidence: 'high' },
    ],
    description: 'Google Analytics Universal Analytics — web analytics by Google (legacy).',
  },
  {
    id: 'google-analytics-4',
    name: 'Google Analytics 4',
    category: 'analytics',
    icon: '📊',
    patterns: [
      { type: 'script', regex: 'googletagmanager\\.com/gtag/js|gtag\\(|G-\\w+', confidence: 'high' },
      { type: 'js-global', regex: 'gtag\\(|dataLayer', confidence: 'high' },
      { type: 'cookie', regex: '_ga_', confidence: 'high' },
    ],
    description: 'Google Analytics 4 — the next generation of Google Analytics.',
  },
  {
    id: 'gtm',
    name: 'GTM',
    category: 'analytics',
    icon: '🏷️',
    patterns: [
      { type: 'script', regex: 'googletagmanager\\.com/gtm\\.js|GTM-[A-Z0-9]+', confidence: 'high' },
      { type: 'html', regex: 'googletagmanager\\.com/ns\\.html', confidence: 'high' },
      { type: 'js-global', regex: 'dataLayer', confidence: 'high' },
    ],
    description: 'Google Tag Manager — manage all your tags without code changes.',
  },
  {
    id: 'facebook-pixel',
    name: 'Facebook Pixel',
    category: 'analytics',
    icon: '👍',
    patterns: [
      { type: 'script', regex: 'connect\\.facebook\\.net|fbq\\(', confidence: 'high' },
      { type: 'js-global', regex: 'fbq\\(', confidence: 'high' },
      { type: 'html', regex: 'facebook\\.net/signals', confidence: 'high' },
    ],
    description: 'Facebook Pixel — a piece of code for conversion tracking and optimization.',
  },
  {
    id: 'hotjar',
    name: 'Hotjar',
    category: 'analytics',
    icon: '🔥',
    patterns: [
      { type: 'script', regex: 'hotjar\\.com|static\\.hotjar\\.com', confidence: 'high' },
      { type: 'js-global', regex: 'hj\\(|hjSiteSettings', confidence: 'high' },
    ],
    description: 'Hotjar — behavior analytics and user feedback in one platform.',
  },
  {
    id: 'mixpanel',
    name: 'Mixpanel',
    category: 'analytics',
    icon: '📈',
    patterns: [
      { type: 'script', regex: 'mixpanel\\.com|mixpanel\\.js|mixpanel\\.min\\.js', confidence: 'high' },
      { type: 'js-global', regex: 'mixpanel\\.(?:track|identify|init)', confidence: 'high' },
    ],
    description: 'Mixpanel — a product analytics tool for tracking user interactions.',
  },
  {
    id: 'segment',
    name: 'Segment',
    category: 'analytics',
    icon: '🔗',
    patterns: [
      { type: 'script', regex: 'segment\\.com|segment\\.io|analytics\\.js/v1', confidence: 'high' },
      { type: 'js-global', regex: 'analytics\\.(?:track|identify|page)', confidence: 'high' },
    ],
    description: 'Segment — a customer data platform for collecting and routing data.',
  },
  {
    id: 'matomo',
    name: 'Matomo',
    category: 'analytics',
    icon: '📊',
    patterns: [
      { type: 'script', regex: 'matomo\\.js|piwik\\.js|matomo\\.php', confidence: 'high' },
      { type: 'js-global', regex: '_paq\\.push', confidence: 'high' },
      { type: 'cookie', regex: '_pk_id|_pk_ses', confidence: 'high' },
    ],
    description: 'Matomo — the leading open-source analytics platform.',
  },
  {
    id: 'clarity',
    name: 'Clarity',
    category: 'analytics',
    icon: '👁️',
    patterns: [
      { type: 'script', regex: 'clarity\\.ms|clarity\\.js', confidence: 'high' },
      { type: 'js-global', regex: 'clarity\\(', confidence: 'high' },
    ],
    description: 'Microsoft Clarity — a free user behavior analytics tool.',
  },
  {
    id: 'plausible',
    name: 'Plausible',
    category: 'analytics',
    icon: '📈',
    patterns: [
      { type: 'script', regex: 'plausible\\.io|plausible\\.js', confidence: 'high' },
      { type: 'html', regex: 'plausible', confidence: 'medium' },
    ],
    description: 'Plausible — a lightweight and privacy-friendly web analytics tool.',
  },

  // ==========================================================================
  // SECURITY (10)
  // ==========================================================================
  {
    id: 'ssl-tls',
    name: 'SSL/TLS',
    category: 'security',
    icon: '🔐',
    patterns: [
      { type: 'url', regex: 'https://', confidence: 'high' },
      { type: 'header', regex: 'strict-transport-security', confidence: 'high' },
    ],
    description: 'SSL/TLS — cryptographic protocols for securing network traffic.',
  },
  {
    id: 'hsts',
    name: 'HSTS',
    category: 'security',
    icon: '🛡️',
    patterns: [
      { type: 'header', regex: 'strict-transport-security', confidence: 'high' },
    ],
    description: 'HTTP Strict Transport Security — forces browsers to use HTTPS.',
  },
  {
    id: 'csp',
    name: 'CSP',
    category: 'security',
    icon: '🚧',
    patterns: [
      { type: 'header', regex: 'content-security-policy', confidence: 'high' },
    ],
    description: 'Content Security Policy — prevents Cross-Site Scripting and data injection attacks.',
  },
  {
    id: 'cloudflare-security',
    name: 'Cloudflare Security',
    category: 'security',
    icon: '☁️',
    patterns: [
      { type: 'header', regex: 'cf-ray|cf-mitigated|cf-cache-status', confidence: 'high' },
      { type: 'html', regex: 'cloudflare.*challenge|cf-browser-verification', confidence: 'high' },
    ],
    description: 'Cloudflare Security — DDoS protection, WAF, and bot management.',
  },
  {
    id: 'sucuri',
    name: 'Sucuri',
    category: 'security',
    icon: '🛡️',
    patterns: [
      { type: 'header', regex: 'x-sucuri-id|x-sucuri-cache', confidence: 'high' },
      { type: 'html', regex: 'sucuri\\.net|cloudproxy\\.sucuri', confidence: 'high' },
    ],
    description: 'Sucuri — a website security platform for malware cleanup and protection.',
  },
  {
    id: 'recaptcha',
    name: 'reCAPTCHA',
    category: 'security',
    icon: '🤖',
    patterns: [
      { type: 'script', regex: 'recaptcha\\.net|google\\.com/recaptcha', confidence: 'high' },
      { type: 'html', regex: 'g-recaptcha|data-sitekey', confidence: 'high' },
      { type: 'js-global', regex: 'grecaptcha', confidence: 'high' },
    ],
    description: 'Google reCAPTCHA — a system to protect websites from spam and abuse.',
  },
  {
    id: 'hcaptcha',
    name: 'hCaptcha',
    category: 'security',
    icon: '🔒',
    patterns: [
      { type: 'script', regex: 'hcaptcha\\.com|hcaptcha', confidence: 'high' },
      { type: 'html', regex: 'h-captcha|data-hcaptcha', confidence: 'high' },
    ],
    description: 'hCaptcha — a privacy-first CAPTCHA service.',
  },
  {
    id: 'lets-encrypt',
    name: "Let's Encrypt",
    category: 'security',
    icon: '🔑',
    patterns: [
      { type: 'header', regex: 'server:\\s*Let\'s Encrypt|issuer:\\s*Let\'s Encrypt', confidence: 'medium' },
    ],
    description: "Let's Encrypt — a free, automated, and open Certificate Authority.",
  },
  {
    id: 'auth0-security',
    name: 'Auth0',
    category: 'security',
    icon: '🔐',
    patterns: [
      { type: 'script', regex: 'auth0\\.com|auth0-js', confidence: 'high' },
      { type: 'html', regex: 'auth0\\.com', confidence: 'high' },
    ],
    description: 'Auth0 — an authentication and authorization platform.',
  },
  {
    id: 'cors',
    name: 'CORS',
    category: 'security',
    icon: '🔀',
    patterns: [
      { type: 'header', regex: 'access-control-allow-origin', confidence: 'high' },
    ],
    description: 'Cross-Origin Resource Sharing — a mechanism for controlled cross-origin requests.',
  },

  // ==========================================================================
  // SEO (8)
  // ==========================================================================
  {
    id: 'meta-tags',
    name: 'Meta Tags',
    category: 'seo',
    icon: '🏷️',
    patterns: [
      { type: 'meta', regex: '<meta[^>]+(?:name|property|http-equiv)=', confidence: 'high' },
      { type: 'html', regex: '<meta[^>]+content=', confidence: 'high' },
    ],
    description: 'Meta Tags — HTML tags providing metadata about a web page.',
  },
  {
    id: 'open-graph',
    name: 'Open Graph',
    category: 'seo',
    icon: '📱',
    patterns: [
      { type: 'html', regex: 'og:|og:title|og:description|og:image', confidence: 'high' },
      { type: 'meta', regex: 'og:', confidence: 'high' },
    ],
    description: 'Open Graph — a protocol that enables web pages to become rich objects in a social graph.',
  },
  {
    id: 'twitter-cards',
    name: 'Twitter Cards',
    category: 'seo',
    icon: '🐦',
    patterns: [
      { type: 'html', regex: 'twitter:|twitter:card|twitter:title|twitter:image', confidence: 'high' },
      { type: 'meta', regex: 'twitter:', confidence: 'high' },
    ],
    description: 'Twitter Cards — metadata that controls how URLs are displayed on Twitter.',
  },
  {
    id: 'structured-data',
    name: 'Structured Data',
    category: 'seo',
    icon: '📊',
    patterns: [
      { type: 'html', regex: 'application/ld\\+json|itemscope|itemtype', confidence: 'high' },
    ],
    description: 'Structured Data — a standardized format for providing information about a page.',
  },
  {
    id: 'sitemap',
    name: 'Sitemap',
    category: 'seo',
    icon: '🗺️',
    patterns: [
      { type: 'url', regex: '/sitemap\\.xml', confidence: 'medium' },
      { type: 'html', regex: 'sitemap', confidence: 'low' },
    ],
    description: 'XML Sitemap — a file that lists URLs for a site to inform search engines about pages.',
  },
  {
    id: 'robots-txt',
    name: 'Robots.txt',
    category: 'seo',
    icon: '🤖',
    patterns: [
      { type: 'url', regex: '/robots\\.txt', confidence: 'medium' },
      { type: 'html', regex: 'robots', confidence: 'low' },
    ],
    description: 'Robots.txt — a file that tells web robots which pages to crawl.',
  },
  {
    id: 'canonical-urls',
    name: 'Canonical URLs',
    category: 'seo',
    icon: '🔗',
    patterns: [
      { type: 'html', regex: 'rel=["\']canonical["\']', confidence: 'high' },
    ],
    description: 'Canonical URLs — specifying the preferred URL for a page to prevent duplicate content.',
  },
  {
    id: 'schema-org',
    name: 'Schema.org',
    category: 'seo',
    icon: '🏗️',
    patterns: [
      { type: 'html', regex: 'schema\\.org|schema_org', confidence: 'high' },
      { type: 'html', regex: '"@type"\\s*:\\s*"(?:Article|Product|Organization|Person|Event|Review|FAQPage)"', confidence: 'high' },
    ],
    description: 'Schema.org — a collaborative activity to create and promote schemas for structured data.',
  },

  // ==========================================================================
  // PERFORMANCE (8)
  // ==========================================================================
  {
    id: 'cloudflare-cdn',
    name: 'Cloudflare CDN',
    category: 'performance',
    icon: '☁️',
    patterns: [
      { type: 'header', regex: 'cf-cache-status|cf-ray|server:\\s*cloudflare', confidence: 'high' },
    ],
    description: 'Cloudflare CDN — a content delivery network for fast page loads.',
  },
  {
    id: 'fastly',
    name: 'Fastly',
    category: 'performance',
    icon: '⚡',
    patterns: [
      { type: 'header', regex: 'x-fastly-request-id|x-served-by:\\s*cache-|x-cache:\\s*HIT', confidence: 'high' },
      { type: 'header', regex: 'x-fastly', confidence: 'high' },
    ],
    description: 'Fastly — an edge cloud platform for real-time content delivery.',
  },
  {
    id: 'akamai',
    name: 'Akamai',
    category: 'performance',
    icon: '🌐',
    patterns: [
      { type: 'header', regex: 'x-akamai|x-akamai-transformed|akamai', confidence: 'high' },
      { type: 'cookie', regex: 'akamai', confidence: 'medium' },
    ],
    description: 'Akamai — a global content delivery network and cloud service provider.',
  },
  {
    id: 'cloudfront',
    name: 'CloudFront',
    category: 'performance',
    icon: '🔷',
    patterns: [
      { type: 'header', regex: 'x-amz-cf-id|via:\\s*.*cloudfront\\.net|server:\\s*CloudFront', confidence: 'high' },
      { type: 'url', regex: 'cloudfront\\.net', confidence: 'high' },
    ],
    description: 'Amazon CloudFront — a fast content delivery network (CDN) service.',
  },
  {
    id: 'imgix',
    name: 'Imgix',
    category: 'performance',
    icon: '🖼️',
    patterns: [
      { type: 'url', regex: 'imgix\\.net', confidence: 'high' },
      { type: 'html', regex: 'imgix\\.net', confidence: 'high' },
    ],
    description: 'Imgix — a real-time image processing and CDN service.',
  },
  {
    id: 'cloudinary',
    name: 'Cloudinary',
    category: 'performance',
    icon: '🌤️',
    patterns: [
      { type: 'url', regex: 'cloudinary\\.com|res\\.cloudinary', confidence: 'high' },
      { type: 'script', regex: 'cloudinary', confidence: 'high' },
      { type: 'html', regex: 'cloudinary\\.com', confidence: 'high' },
    ],
    description: 'Cloudinary — a media management and optimization platform.',
  },
  {
    id: 'varnish',
    name: 'Varnish',
    category: 'performance',
    icon: '🐇',
    patterns: [
      { type: 'header', regex: 'x-varnish|x-varnish-cache|via:\\s*varnish', confidence: 'high' },
    ],
    description: 'Varnish — a high-performance HTTP accelerator for web content.',
  },
  {
    id: 'nginx',
    name: 'nginx',
    category: 'performance',
    icon: '🟢',
    patterns: [
      { type: 'header', regex: 'server:\\s*nginx', confidence: 'high' },
    ],
    description: 'nginx — a high-performance web server, reverse proxy, and load balancer.',
  },

  // ==========================================================================
  // AI / ML (8)
  // ==========================================================================
  {
    id: 'tensorflow-js',
    name: 'TensorFlow.js',
    category: 'ai-ml',
    icon: '🧠',
    patterns: [
      { type: 'script', regex: 'tensorflow\\.js|tfjs|@tensorflow', confidence: 'high' },
      { type: 'js-global', regex: 'tf\\.(?:tensor|model|layers)', confidence: 'high' },
    ],
    description: 'TensorFlow.js — a library for machine learning in JavaScript.',
  },
  {
    id: 'hugging-face',
    name: 'Hugging Face',
    category: 'ai-ml',
    icon: '🤗',
    patterns: [
      { type: 'script', regex: 'huggingface\\.co|huggingface\\.js|@huggingface', confidence: 'high' },
      { type: 'html', regex: 'huggingface\\.co', confidence: 'high' },
    ],
    description: 'Hugging Face — the AI community building the future with open-source ML.',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    category: 'ai-ml',
    icon: '🤖',
    patterns: [
      { type: 'script', regex: 'openai\\.com|api\\.openai\\.com|chatgpt', confidence: 'high' },
      { type: 'html', regex: 'openai\\.com|chatgpt', confidence: 'high' },
    ],
    description: 'OpenAI — AI research and deployment company behind GPT and DALL-E.',
  },
  {
    id: 'langchain',
    name: 'LangChain',
    category: 'ai-ml',
    icon: '🔗',
    patterns: [
      { type: 'script', regex: 'langchain|@langchain', confidence: 'high' },
      { type: 'html', regex: 'langchain', confidence: 'medium' },
    ],
    description: 'LangChain — a framework for developing applications powered by LLMs.',
  },
  {
    id: 'pytorch',
    name: 'PyTorch',
    category: 'ai-ml',
    icon: '🔥',
    patterns: [
      { type: 'html', regex: 'pytorch\\.org|torch', confidence: 'low' },
      { type: 'meta', regex: 'pytorch', confidence: 'low' },
    ],
    description: 'PyTorch — an open-source machine learning framework (backend hint detection).',
  },
  {
    id: 'vertex-ai',
    name: 'Vertex AI',
    category: 'ai-ml',
    icon: '🔺',
    patterns: [
      { type: 'script', regex: 'vertex-ai|cloud\\.google\\.com/vertex', confidence: 'high' },
      { type: 'html', regex: 'vertex.?ai|cloud\\.google\\.com/vertex', confidence: 'medium' },
    ],
    description: 'Vertex AI — Google Cloud\'s machine learning platform.',
  },
  {
    id: 'replicate',
    name: 'Replicate',
    category: 'ai-ml',
    icon: '🔄',
    patterns: [
      { type: 'script', regex: 'replicate\\.com|replicate-api', confidence: 'high' },
      { type: 'html', regex: 'replicate\\.com', confidence: 'high' },
    ],
    description: 'Replicate — run machine learning models in the cloud with an API.',
  },
  {
    id: 'together-ai',
    name: 'together.ai',
    category: 'ai-ml',
    icon: '🤝',
    patterns: [
      { type: 'script', regex: 'together\\.ai|togethercomputer', confidence: 'high' },
      { type: 'html', regex: 'together\\.ai', confidence: 'high' },
    ],
    description: 'together.ai — a cloud platform for running open-source AI models.',
  },

  // ==========================================================================
  // WEB3 (6)
  // ==========================================================================
  {
    id: 'web3js',
    name: 'Web3.js',
    category: 'web3',
    icon: '⛓️',
    patterns: [
      { type: 'script', regex: 'web3\\.min\\.js|web3\\.js|web3\\.eth', confidence: 'high' },
      { type: 'js-global', regex: 'Web3\\.(?:eth|utils|providers)', confidence: 'high' },
    ],
    description: 'Web3.js — a collection of libraries for interacting with Ethereum nodes.',
  },
  {
    id: 'ethersjs',
    name: 'Ethers.js',
    category: 'web3',
    icon: '💎',
    patterns: [
      { type: 'script', regex: 'ethers\\.min\\.js|ethers\\.js|@ethersproject', confidence: 'high' },
      { type: 'js-global', regex: 'ethers\\.(?:providers|utils|Contract)', confidence: 'high' },
    ],
    description: 'Ethers.js — a library for interacting with the Ethereum blockchain.',
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    category: 'web3',
    icon: '👛',
    patterns: [
      { type: 'script', regex: 'walletconnect|@walletconnect', confidence: 'high' },
      { type: 'html', regex: 'walletconnect', confidence: 'high' },
    ],
    description: 'WalletConnect — an open protocol for connecting wallets to DApps.',
  },
  {
    id: 'metamask',
    name: 'MetaMask',
    category: 'web3',
    icon: '🦊',
    patterns: [
      { type: 'js-global', regex: 'ethereum\\.isMetaMask|window\\.ethereum', confidence: 'high' },
      { type: 'html', regex: 'metamask', confidence: 'medium' },
    ],
    description: 'MetaMask — a crypto wallet and gateway to blockchain DApps.',
  },
  {
    id: 'ipfs',
    name: 'IPFS',
    category: 'web3',
    icon: '📂',
    patterns: [
      { type: 'url', regex: 'ipfs://|ipfs\\.io|dweb\\.link|\\.ipfs\\.', confidence: 'high' },
      { type: 'script', regex: 'ipfs|ipfs-http-client', confidence: 'high' },
    ],
    description: 'IPFS — the InterPlanetary File System, a peer-to-peer hypermedia protocol.',
  },
  {
    id: 'solidity',
    name: 'Solidity',
    category: 'web3',
    icon: '⚙️',
    patterns: [
      { type: 'html', regex: 'solidity|\\.sol["\']|smart.?contract', confidence: 'medium' },
      { type: 'meta', regex: 'solidity', confidence: 'low' },
    ],
    description: 'Solidity — the primary language for smart contracts on Ethereum (hint detection).',
  },

  // ==========================================================================
  // REAL-TIME (5)
  // ==========================================================================
  {
    id: 'socketio',
    name: 'Socket.io',
    category: 'realtime',
    icon: '🔌',
    patterns: [
      { type: 'script', regex: 'socket\\.io\\.js|socket\\.io\\.min\\.js|socket\\.io', confidence: 'high' },
      { type: 'js-global', regex: 'io\\(|socket\\.io', confidence: 'high' },
    ],
    description: 'Socket.io — a library for real-time, bidirectional, event-based communication.',
  },
  {
    id: 'pusher',
    name: 'Pusher',
    category: 'realtime',
    icon: '📡',
    patterns: [
      { type: 'script', regex: 'pusher\\.com|pusher\\.min\\.js|pusher-js', confidence: 'high' },
      { type: 'js-global', regex: 'Pusher|new Pusher\\(', confidence: 'high' },
    ],
    description: 'Pusher — hosted APIs for building collaborative, real-time features.',
  },
  {
    id: 'ably',
    name: 'Ably',
    category: 'realtime',
    icon: '⚡',
    patterns: [
      { type: 'script', regex: 'ably\\.com|ably\\.min\\.js|ably-js', confidence: 'high' },
      { type: 'js-global', regex: 'Ably\\.Realtime|new Ably', confidence: 'high' },
    ],
    description: 'Ably — a real-time experience platform for APIs and messaging.',
  },
  {
    id: 'signalr',
    name: 'SignalR',
    category: 'realtime',
    icon: '📡',
    patterns: [
      { type: 'script', regex: 'signalr|signalr\\.js|signalr\\.min\\.js', confidence: 'high' },
      { type: 'js-global', regex: '\\$\\.connection|signalR', confidence: 'high' },
    ],
    description: 'SignalR — a library for ASP.NET developers for real-time web functionality.',
  },
  {
    id: 'firebase-realtime',
    name: 'Firebase Realtime',
    category: 'realtime',
    icon: '🔥',
    patterns: [
      { type: 'script', regex: 'firebaseio\\.com|firebase-database|firebase/database', confidence: 'high' },
      { type: 'js-global', regex: 'firebase\\.database', confidence: 'high' },
    ],
    description: 'Firebase Realtime Database — a cloud-hosted NoSQL database that syncs in real-time.',
  },

  // ==========================================================================
  // HEADLESS CMS (6)
  // ==========================================================================
  {
    id: 'sanity-headless',
    name: 'Sanity',
    category: 'headless-cms',
    icon: '🧠',
    patterns: [
      { type: 'script', regex: 'sanity\\.io|@sanity|sanity\\.client', confidence: 'high' },
      { type: 'html', regex: 'sanity\\.io|__sanity', confidence: 'high' },
      { type: 'url', regex: 'cdn\\.sanity\\.io', confidence: 'high' },
    ],
    description: 'Sanity — the composable content platform for structured content.',
  },
  {
    id: 'strapi-headless',
    name: 'Strapi',
    category: 'headless-cms',
    icon: '🦾',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*Strapi', confidence: 'high' },
      { type: 'url', regex: '/api/strapi|/strapi/', confidence: 'medium' },
      { type: 'html', regex: 'strapi', confidence: 'medium' },
    ],
    description: 'Strapi — the leading open-source headless CMS.',
  },
  {
    id: 'contentful-headless',
    name: 'Contentful',
    category: 'headless-cms',
    icon: '📦',
    patterns: [
      { type: 'script', regex: 'contentful\\.com|@contentful|contentful\\.js', confidence: 'high' },
      { type: 'url', regex: 'ctfassets\\.net|images\\.ctfassets', confidence: 'high' },
    ],
    description: 'Contentful — a composable content platform for digital experiences.',
  },
  {
    id: 'directus',
    name: 'Directus',
    category: 'headless-cms',
    icon: '🗄️',
    patterns: [
      { type: 'header', regex: 'x-powered-by:\\s*Directus', confidence: 'high' },
      { type: 'html', regex: 'directus|directus\\.io', confidence: 'medium' },
    ],
    description: 'Directus — an open data platform for managing and delivering content.',
  },
  {
    id: 'payload-cms',
    name: 'Payload CMS',
    category: 'headless-cms',
    icon: '🚀',
    patterns: [
      { type: 'html', regex: 'payloadcms|payload\\.cms|payload', confidence: 'medium' },
      { type: 'header', regex: 'x-powered-by:\\s*Payload', confidence: 'high' },
    ],
    description: 'Payload CMS — a headless CMS and application framework built with Node.js and React.',
  },
  {
    id: 'storyblok',
    name: 'Storyblok',
    category: 'headless-cms',
    icon: '📖',
    patterns: [
      { type: 'script', regex: 'storyblok\\.com|@storyblok|storyblok-js', confidence: 'high' },
      { type: 'html', regex: 'storyblok|data-blok-c|data-blok-uid', confidence: 'high' },
    ],
    description: 'Storyblok — a headless CMS with a visual editor for developers and marketers.',
  },

  // ==========================================================================
  // AUTHENTICATION (7)
  // ==========================================================================
  {
    id: 'auth0-auth',
    name: 'Auth0',
    category: 'auth',
    icon: '🔐',
    patterns: [
      { type: 'script', regex: 'auth0\\.com|auth0-js|@auth0', confidence: 'high' },
      { type: 'html', regex: 'auth0\\.com/auth', confidence: 'high' },
      { type: 'url', regex: 'auth0\\.com', confidence: 'high' },
    ],
    description: 'Auth0 — an identity platform for application builders.',
  },
  {
    id: 'firebase-auth',
    name: 'Firebase Auth',
    category: 'auth',
    icon: '🔥',
    patterns: [
      { type: 'script', regex: 'firebase.*auth|firebase-auth|firebase/auth', confidence: 'high' },
      { type: 'html', regex: 'firebase.*auth|firebaseapp\\.com.*auth', confidence: 'medium' },
    ],
    description: 'Firebase Authentication — Google\'s authentication service for web and mobile.',
  },
  {
    id: 'clerk',
    name: 'Clerk',
    category: 'auth',
    icon: '👤',
    patterns: [
      { type: 'script', regex: 'clerk\\.com|@clerk|clerk\\.js', confidence: 'high' },
      { type: 'html', regex: 'clerk|clerk\\.com', confidence: 'high' },
    ],
    description: 'Clerk — drop-in React components for authentication, user management.',
  },
  {
    id: 'nextauth',
    name: 'NextAuth.js',
    category: 'auth',
    icon: '🔑',
    patterns: [
      { type: 'html', regex: 'next-auth|nextauth|__nextAuth', confidence: 'high' },
      { type: 'url', regex: '/api/auth/', confidence: 'medium' },
      { type: 'cookie', regex: 'next-auth\\.session-token|__Secure-next-auth', confidence: 'high' },
    ],
    description: 'NextAuth.js — a complete open-source authentication solution for Next.js.',
  },
  {
    id: 'passportjs',
    name: 'Passport.js',
    category: 'auth',
    icon: '🛂',
    patterns: [
      { type: 'cookie', regex: 'connect\\.sid', confidence: 'low' },
      { type: 'html', regex: 'passport', confidence: 'low' },
    ],
    description: 'Passport.js — an authentication middleware for Node.js.',
  },
  {
    id: 'aws-cognito',
    name: 'AWS Cognito',
    category: 'auth',
    icon: '☁️',
    patterns: [
      { type: 'script', regex: 'amazoncognito|cognito|aws-amplify.*auth', confidence: 'high' },
      { type: 'html', regex: 'cognito|amazoncognito', confidence: 'medium' },
    ],
    description: 'Amazon Cognito — a simple, secure user sign-up, sign-in, and access control.',
  },
  {
    id: 'okta',
    name: 'Okta',
    category: 'auth',
    icon: '🔐',
    patterns: [
      { type: 'script', regex: 'okta\\.com|okta-auth-js|@okta', confidence: 'high' },
      { type: 'html', regex: 'okta\\.com|okta-login', confidence: 'high' },
    ],
    description: 'Okta — an enterprise identity and access management platform.',
  },

  // ==========================================================================
  // MONITORING (7)
  // ==========================================================================
  {
    id: 'sentry',
    name: 'Sentry',
    category: 'monitoring',
    icon: '🛡️',
    patterns: [
      { type: 'script', regex: 'sentry\\.io|@sentry|sentry-browser', confidence: 'high' },
      { type: 'js-global', regex: 'Sentry\\.(?:init|captureException|withScope)', confidence: 'high' },
    ],
    description: 'Sentry — an application monitoring platform for real-time error tracking.',
  },
  {
    id: 'logrocket',
    name: 'LogRocket',
    category: 'monitoring',
    icon: '🪵',
    patterns: [
      { type: 'script', regex: 'logrocket\\.com|logrocket\\.min\\.js', confidence: 'high' },
      { type: 'js-global', regex: 'LogRocket\\.(?:init|identify|track)', confidence: 'high' },
    ],
    description: 'LogRocket — a session replay and analytics tool for web apps.',
  },
  {
    id: 'datadog',
    name: 'Datadog',
    category: 'monitoring',
    icon: '🐕',
    patterns: [
      { type: 'script', regex: 'datadoghq\\.com|datadog|DD_RUM|datadog-browser', confidence: 'high' },
      { type: 'js-global', regex: 'DD_RUM|DD_LOGS|Datadog', confidence: 'high' },
    ],
    description: 'Datadog — a monitoring and analytics platform for cloud-scale applications.',
  },
  {
    id: 'new-relic',
    name: 'New Relic',
    category: 'monitoring',
    icon: '📊',
    patterns: [
      { type: 'script', regex: 'newrelic\\.com|new-relic|nr-\\d+', confidence: 'high' },
      { type: 'js-global', regex: 'NREUM|newrelic', confidence: 'high' },
      { type: 'header', regex: 'x-newrelic', confidence: 'medium' },
    ],
    description: 'New Relic — an observability platform for software monitoring.',
  },
  {
    id: 'bugsnag',
    name: 'Bugsnag',
    category: 'monitoring',
    icon: '🐛',
    patterns: [
      { type: 'script', regex: 'bugsnag\\.com|bugsnag\\.min\\.js|bugsnag-js', confidence: 'high' },
      { type: 'js-global', regex: 'Bugsnag\\.(?:start|notify|leaveBreadcrumb)', confidence: 'high' },
    ],
    description: 'Bugsnag — an error monitoring and reporting tool.',
  },
  {
    id: 'raygun',
    name: 'Raygun',
    category: 'monitoring',
    icon: '🔫',
    patterns: [
      { type: 'script', regex: 'raygun\\.io|raygun4js|Raygun', confidence: 'high' },
      { type: 'js-global', regex: 'Raygun\\.(?:init|send|setUser)', confidence: 'high' },
    ],
    description: 'Raygun — error, crash, and performance monitoring for software teams.',
  },
  {
    id: 'rollbar',
    name: 'Rollbar',
    category: 'monitoring',
    icon: '🍩',
    patterns: [
      { type: 'script', regex: 'rollbar\\.com|rollbar\\.min\\.js|rollbar-js', confidence: 'high' },
      { type: 'js-global', regex: 'Rollbar\\.(?:init|critical|error|warning)', confidence: 'high' },
    ],
    description: 'Rollbar — a continuous code improvement platform for error monitoring.',
  },

  // ==========================================================================
  // ADDITIONAL TECHNOLOGIES (12) — to exceed 250 total rules
  // ==========================================================================
  {
    id: 'emberjs',
    name: 'Ember.js',
    category: 'frontend-framework',
    icon: '🐹',
    patterns: [
      { type: 'script', regex: 'ember\\.min\\.js|ember\\.js|ember-application', confidence: 'high' },
      { type: 'html', regex: 'ember-application|ember-view', confidence: 'high' },
      { type: 'meta', regex: 'Ember', confidence: 'medium' },
    ],
    description: 'Ember.js — a productive, battle-tested JavaScript framework for building web apps.',
  },
  {
    id: 'backbonejs',
    name: 'Backbone.js',
    category: 'frontend-framework',
    icon: '🦴',
    patterns: [
      { type: 'script', regex: 'backbone\\.min\\.js|backbone\\.js', confidence: 'high' },
      { type: 'js-global', regex: 'Backbone\\.(?:Model|View|Collection|Router)', confidence: 'high' },
    ],
    description: 'Backbone.js — a library that gives structure to web applications with key-value binding.',
  },
  {
    id: 'meteor',
    name: 'Meteor',
    category: 'frontend-framework',
    icon: '☄️',
    patterns: [
      { type: 'script', regex: 'meteor\\.js|meteor-dev-bundle|__meteor_runtime_config__', confidence: 'high' },
      { type: 'html', regex: '__meteor_runtime_config__', confidence: 'high' },
      { type: 'js-global', regex: 'Meteor\\.(?:startup|methods|subscribe)', confidence: 'high' },
    ],
    description: 'Meteor — an open-source platform for web, mobile, and desktop.',
  },
  {
    id: 'handlebars',
    name: 'Handlebars',
    category: 'js-library',
    icon: '🔧',
    patterns: [
      { type: 'script', regex: 'handlebars\\.min\\.js|handlebars\\.js', confidence: 'high' },
      { type: 'html', regex: 'type=["\']text/x-handlebars-template["\']', confidence: 'high' },
      { type: 'js-global', regex: 'Handlebars\\.(?:compile|registerHelper)', confidence: 'high' },
    ],
    description: 'Handlebars — a templating language for building semantic templates effectively.',
  },
  {
    id: 'ejs',
    name: 'EJS',
    category: 'js-library',
    icon: '📋',
    patterns: [
      { type: 'html', regex: 'type=["\']text/ejs["\']|<%.*%>', confidence: 'medium' },
      { type: 'meta', regex: 'ejs', confidence: 'low' },
    ],
    description: 'EJS — Embedded JavaScript templating for generating HTML markup.',
  },
  {
    id: 'apache',
    name: 'Apache HTTP Server',
    category: 'performance',
    icon: '🪶',
    patterns: [
      { type: 'header', regex: 'server:\\s*Apache', confidence: 'high' },
      { type: 'header', regex: 'server:\\s*Apache/\\d', confidence: 'high' },
    ],
    description: 'Apache HTTP Server — the world\'s most widely used web server software.',
    versionRegex: 'server:\\s*Apache/(\\d+\\.\\d+(?:\\.\\d+)?)',
  },
  {
    id: 'couchdb',
    name: 'CouchDB',
    category: 'database',
    icon: '🛋️',
    patterns: [
      { type: 'header', regex: 'server:\\s*CouchDB|x-powered-by:\\s*CouchDB', confidence: 'high' },
      { type: 'html', regex: 'couchdb', confidence: 'low' },
    ],
    description: 'Apache CouchDB — a NoSQL document-oriented database.',
  },
  {
    id: 'prisma',
    name: 'Prisma',
    category: 'database',
    icon: '🔺',
    patterns: [
      { type: 'html', regex: 'prisma', confidence: 'low' },
      { type: 'header', regex: 'x-powered-by:\\s*Prisma', confidence: 'medium' },
    ],
    description: 'Prisma — a next-generation ORM for Node.js and TypeScript.',
  },
  {
    id: 'grafana',
    name: 'Grafana',
    category: 'monitoring',
    icon: '📊',
    patterns: [
      { type: 'html', regex: 'grafana|grafana-app', confidence: 'high' },
      { type: 'header', regex: 'x-grafana', confidence: 'high' },
    ],
    description: 'Grafana — an open-source analytics and monitoring platform.',
  },
  {
    id: 'prometheus',
    name: 'Prometheus',
    category: 'monitoring',
    icon: '🔥',
    patterns: [
      { type: 'header', regex: 'x-prometheus', confidence: 'medium' },
      { type: 'html', regex: 'prometheus', confidence: 'low' },
    ],
    description: 'Prometheus — an open-source monitoring and alerting toolkit.',
  },
  {
    id: 'storybook',
    name: 'Storybook',
    category: 'build-tool',
    icon: '📖',
    patterns: [
      { type: 'html', regex: 'storybook|sb-|story-source', confidence: 'high' },
      { type: 'script', regex: 'storybook', confidence: 'medium' },
    ],
    description: 'Storybook — a frontend workshop for building UI components in isolation.',
  },
  {
    id: 'husky',
    name: 'Husky',
    category: 'cicd',
    icon: '🐕',
    patterns: [
      { type: 'html', regex: 'husky', confidence: 'low' },
      { type: 'meta', regex: 'husky', confidence: 'low' },
    ],
    description: 'Husky — a tool for managing Git hooks in JavaScript projects.',
  },
]
