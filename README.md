# 泓泽宜通 · 运输组织方案系统

**这是一个测试的修改，本行为测试拉去、推送的审核机制测验**


> 面向分布式团队的标准化开发文档。本文档是团队开发系统其余部分的**统一指导规范**，所有新增模块、页面、组件、接口与数据模型都必须遵循本文约定，以确保各模块在底层逻辑、目录结构、命名与交互风格上保持一致，为后续系统整合提供坚实基础。

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术架构](#2-技术架构)
3. [目录结构](#3-目录结构)
4. [开发环境配置](#4-开发环境配置)
5. [编码规范](#5-编码规范)
6. [模块划分原则](#6-模块划分原则)
7. [数据层与 API 设计标准](#7-数据层与-api-设计标准)
8. [状态流转与业务规则](#8-状态流转与业务规则)
9. [版本控制流程](#9-版本控制流程)
10. [测试要求](#10-测试要求)
11. [协作流程](#11-协作流程)
12. [常见问题解决方案](#12-常见问题解决方案)

---

## 1. 项目概述

泓泽宜通运输组织方案系统用于支撑「矿石采购 → 港口装卸 → 运力组织 → 运输方案 → 发运交付」全流程的数字化管理。系统以「订单（Order）」为核心主数据，围绕订单逐步录入港口、运力、运输方案，并在业务阶段管理财务、发运、货物动态与操作日志。

当前版本为**前端单页应用（MVP）**，数据持久化于浏览器 `localStorage`，通过存储层抽象为后续接入后端接口预留了无缝切换能力。

**核心业务阶段（Step 流转）**

```
订单录入 → 港口信息 → 运力信息 → 运输方案 → 待确认 → 发运 → 完成
```

**核心角色**

| 角色 | 标识 | 职责 |
| --- | --- | --- |
| 业务员 | `sales` | 订单录入与基本信息维护 |
| 港口专员 | `port` | 港口信息录入 |
| 运力专员 | `capacity` | 运力信息与通道组织 |
| 财务人员 | `finance` | 收款确认（订单状态由「待确认」推进至「已确认」） |
| 运输人员 | `transport` | 发运凭证上传与发运状态推进 |
| 管理员 | `admin` | 可跳过状态流转校验 |

---

## 2. 技术架构

| 层 | 技术选型 | 说明 |
| --- | --- | --- |
| 框架 | Vue 3（Composition API + `<script setup>`） | 全部组件使用单文件组件 `.vue` |
| 语言 | TypeScript | 严格模式，`noUnusedLocals` / `noUnusedParameters` 开启 |
| 构建 | Vite 8 | 开发端口固定为 **5174** |
| 路由 | Vue Router 5（`createWebHistory`） | 全部路由懒加载 |
| 状态管理 | Pinia 4（setup store 语法） | 组件唯一数据入口，见 `src/stores/order.ts` |
| 样式 | Tailwind CSS 3 + 自定义设计令牌 | Apple 设计风格，见 `tailwind.config.js` |
| 代码检查 | Oxlint | 配置见 `.oxlintrc.json` |
| 类型检查 | `vue-tsc` | `npm run type-check` |
| PDF 导出 | `jspdf` + `html2canvas` | 分节截图拼页，见 `src/lib/pdfExport.ts` |
| 数据持久化 | `localStorage`（可切换 `api`） | 见 `src/lib/storage.ts` |

**架构分层（单向数据流）**

```
pages（页面） → stores（Pinia 业务状态） → lib/storage（数据访问） → localStorage / 后端 API
```

- **页面层**只负责 UI 与交互，不直接读写存储。
- **store 层**是组件访问数据的唯一入口，封装业务逻辑（状态流转、凭证、日志）。
- **storage 层**是唯一的数据持久化边界，未来接入后端时**仅需修改此层**。

**路径别名**：`@` → `src/`（配置于 `vite.config.ts` 与 `tsconfig.app.json`）。

---

## 3. 目录结构

```
hongze_demo/
├── deploy/
│   └── nginx.conf              # Nginx 部署示例（SPA fallback + 静态缓存）
├── public/                     # 静态资源（favicon.svg、icons.svg）
├── src/
│   ├── assets/                 # 图片等静态资源
│   ├── components/             # 通用/跨页面复用的 UI 组件
│   │   ├── Badge.vue           # 状态徽标
│   │   ├── EmptyState.vue      # 空态展示
│   │   ├── Field.vue           # 表单字段容器（label + hint）
│   │   ├── FieldGroup.vue      # 卡片式分组（可折叠）
│   │   ├── Icon.vue            # 内联 SVG 图标（统一图标源）
│   │   ├── InfoRow.vue         # 信息行展示
│   │   ├── OrderContextBar.vue # 订单上下文栏
│   │   ├── SearchSelect.vue    # 可搜索下拉选择
│   │   ├── Stepper.vue         # 步骤条（订单 → 港口 → 运力 → 方案）
│   │   ├── TopBar.vue          # 顶部导航栏
│   │   └── TransportPlanReport.vue # 运输方案报告（PDF 导出目标）
│   ├── lib/                    # 非组件基础设施
│   │   ├── format.ts           # 数值/日期格式化等纯函数
│   │   ├── pdfExport.ts        # PDF 导出逻辑
│   │   └── storage.ts          # 数据访问层（localStorage / 后端切换）
│   ├── pages/                  # 路由页面（一页一文件）
│   │   ├── HomePage.vue        # 订单列表
│   │   ├── OrderFormPage.vue   # 订单录入/编辑
│   │   ├── OrderDetailPage.vue # 订单详情（5 Tab）
│   │   ├── PortFormPage.vue    # 港口信息
│   │   ├── CapacityFormPage.vue # 运力信息
│   │   └── PlanReportPage.vue  # 运输组织方案报告
│   ├── router/
│   │   └── index.ts            # 路由表（懒加载 + meta.title）
│   ├── stores/
│   │   └── order.ts            # 订单业务 store
│   ├── types/
│   │   └── index.ts            # 全局数据模型、常量与元数据
│   ├── App.vue                 # 根组件（布局 + 路由过渡）
│   ├── env.d.ts                # 环境变量类型声明
│   ├── index.css               # Tailwind 引入 + 全局基础样式/组件类
│   └── main.ts                 # 应用入口
├── .env.example                # 环境变量模板
├── .oxlintrc.json              # Oxlint 配置
├── index.html                  # HTML 入口
├── tailwind.config.js          # Tailwind 主题扩展（Apple 设计令牌）
├── vite.config.ts              # Vite 配置（端口、别名、分包）
└── tsconfig.*.json             # TypeScript 配置
```

**目录职责边界（务必遵守）**

| 目录 | 允许的内容 | 禁止 |
| --- | --- | --- |
| `components/` | 可复用、无业务数据依赖的 UI 组件 | 直接读写 store 或 localStorage |
| `pages/` | 路由页面、组装组件、调用 store | 直接操作 DOM 做跨页逻辑 |
| `lib/` | 纯函数、数据访问、工具 | 引入 `.vue` 组件 |
| `stores/` | Pinia store、业务状态逻辑 | 直接操作 localStorage |
| `types/` | 类型、常量、元数据映射 | 副作用、运行时 I/O |

---

## 4. 开发环境配置

### 4.1 环境要求

- Node.js ≥ 20（项目使用 ESM 与 `vite` 8）
- npm（推荐）或 pnpm / yarn

### 4.2 安装与启动

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器（固定端口 5174）
npm run dev
# 访问 http://localhost:5174

# 3. 类型检查
npm run type-check

# 4. 代码检查
npm run lint

# 5. 生产构建
npm run build          # 先类型检查再构建
npm run build:only     # 跳过类型检查直接构建

# 6. 本地预览生产构建
npm run preview
```

### 4.3 环境变量

复制 `.env.example` 为 `.env.local` 并按需修改：

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `VITE_APP_TITLE` | 应用标题 | `泓泽宜通 · 运输组织方案系统` |
| `VITE_STORAGE` | 存储模式：`local` = localStorage，`api` = 后端接口 | `local` |
| `VITE_API_BASE` | 后端 API 地址（`VITE_STORAGE=api` 时生效） | `/api` |

> 新增环境变量必须在 `src/env.d.ts` 的 `ImportMetaEnv` 接口中同步声明类型。

### 4.4 开发约束（重要）

- **开发端口固定为 5174**，不得修改 `vite.config.ts` 中的 `server.port`。
- Tailwind 的 `content` 必须包含 `.vue` 文件（见 [常见问题 §12.1](#121-tailwind-样式失效)）。

---

## 5. 编码规范

### 5.1 通用约定

- 语言：业务命名、注释、用户可见文案统一使用**中文**；代码标识符使用英文（camelCase / PascalCase）。
- 缩进：2 空格（遵循 `package.json` 与现有文件风格）。
- 单引号、无分号（遵循现有代码风格）。
- 提交前必须通过 `npm run type-check` 与 `npm run lint`。

### 5.2 组件（`.vue`）

- 统一使用 `<script setup lang="ts">`。
- 文件名：`components/` 与 `pages/` 内使用 **PascalCase**；页面文件以 `Page` 结尾（如 `OrderFormPage.vue`）。
- 组件内 import 使用 `@/` 别名，相对路径仅限同目录内部组件（如 `./Icon.vue`）。
- Props 声明示例（带默认值）：

```vue
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title: string
    desc?: string
    collapsible?: boolean
  }>(),
  { collapsible: false },
)
</script>
```

- Emits 声明使用元组语法：

```ts
const emit = defineEmits<{
  'update:isOpen': [value: boolean]
}>()
```

- `v-model` 双向绑定使用 `computed` 的 get/set 转发，避免直接修改 props。

### 5.3 类型与常量（`src/types/index.ts`）

- 数据模型使用 `interface`；枚举/联合类型使用 `type`。
- 所有状态、角色、通道等可枚举值，必须配套一份 `XXX_META` 常量映射（`label` / `color` / `bg`），供 UI 统一渲染，**禁止在组件内硬编码颜色与文案**。
- 全局选项（下拉候选）集中在 `types/index.ts` 顶部，以 `XXX_OPTIONS` 命名导出。
- 新增联合类型成员时，同步更新对应的 `META` 映射与状态流转规则。

### 5.4 样式

- 优先使用 Tailwind 工具类，避免内联 `style`（动态颜色除外）。
- 复用已有的设计令牌与组件类，禁止重复造类：

| 类 | 用途 |
| --- | --- |
| `btn btn-primary` | 主按钮 |
| `btn btn-secondary` | 次级按钮 |
| `btn btn-ghost` | 幽灵按钮 |
| `btn-danger` | 危险操作 |
| `card` | 卡片容器 |
| `field-label` / `field-input` | 表单标签 / 输入框 |
| `section-title` | 分组标题 |

- 颜色使用语义令牌：`text-apple-text`、`text-apple-subtext`、`bg-apple-bg`、`border-apple-border`、`text-apple-blue` 等，见 `tailwind.config.js`。
- 动画使用 `animate-fade-in` / `animate-slide-up` / `animate-scale-in`。

### 5.5 命名规范

| 对象 | 规范 | 示例 |
| --- | --- | --- |
| 组件 | PascalCase | `OrderContextBar.vue` |
| 页面 | PascalCase + `Page` 后缀 | `PortFormPage.vue` |
| store | `useXxxStore` | `useOrderStore` |
| 数据访问函数 | `list/get/upsert/delete` 前缀 | `listOrders`、`upsertOrder` |
| 类型/接口 | PascalCase | `Order`、`PortInfo` |
| 常量/元数据 | `UPPER_SNAKE_CASE` | `STATUS_FLOW`、`CHANNEL_META` |
| 工具函数 | camelCase，`fmt`/`to`/`gen` 前缀 | `fmtMoney`、`genOrderId` |

---

## 6. 模块划分原则

新增功能时，按下述原则确定代码落点：

1. **一个业务阶段 = 一个页面**：录入类功能（订单、港口、运力、方案）各占一个 `pages/*FormPage.vue`；展示/汇总类功能进入 `OrderDetailPage.vue` 的 Tab。
2. **新增实体必须贯穿四层**：
   - 在 `types/index.ts` 定义 `interface` + `META`；
   - 在 `lib/storage.ts` 新增 `KEYS` 项与 `list/get/upsert/delete` 函数；
   - 在 `stores/order.ts` 新增对应 store 动作并导出；
   - 在页面中通过 store 调用。
3. **跨实体级联删除**：主实体删除时，必须在 `deleteOrder` 中同步清理关联数据（参考现有实现），保证数据一致性。
4. **可复用 UI 下沉到 `components/`**；只被单页使用且逻辑独立时，才保留在页面内部。
5. **数据迁移**：修改已有数据模型字段时，在 `storage.ts` 内提供 `migrateXxx` 兼容函数，保证旧数据可平滑升级（参考 `migrateOrder`）。
6. **路由**：新页面必须在 `src/router/index.ts` 注册，设置 `meta.title`，并使用懒加载 `() => import(...)`。

---

## 7. 数据层与 API 设计标准

### 7.1 数据访问层约定

当前数据访问集中在 `src/lib/storage.ts`，对外暴露统一的**仓库式接口**。命名遵循：

| 前缀 | 语义 | 返回 |
| --- | --- | --- |
| `listXxx` | 查询列表（可按 `orderId` 过滤） | `T[]` |
| `getXxx` | 查询单条 | `T \| undefined` |
| `upsertXxx` | 新增或更新（按主键/唯一键判断） | `void` |
| `deleteXxx` | 删除 | `void` |
| `newXxxId` / `genXxxId` | 生成 ID | `string` |

所有实体通过 `KEYS` 常量表管理 localStorage key，key 命名规则：`hongze:<实体名复数>`。

### 7.2 关联关系约定

| 实体 | 关联键 | 基数 |
| --- | --- | --- |
| `PortInfo` | `orderId` | 每订单 1 条 |
| `Capacity` | `orderId`（+ `id`） | 每订单多条 |
| `ChannelDetail` | `orderId` + `channelType` | 每通道 1 条 |
| `FinancialInfo` | `orderId` | 每订单 1 条 |
| `ChannelShipping` | `capacityId` + `orderId` | 与 `Capacity` 1:1 |
| `CargoMilestone` | `orderId` | 每订单多条 |
| `OperationLog` | `orderId` | 每订单多条 |

### 7.3 后端接口对接规范（`VITE_STORAGE=api` 时）

未来接入后端时，**保持 `storage.ts` 的函数签名不变**，将内部 `read/write` 替换为 `fetch` 调用。接口需遵循以下 REST 约定：

| 方法 | 路径 | 对应 storage 函数 |
| --- | --- | --- |
| `GET` | `/api/orders` | `listOrders` |
| `GET` | `/api/orders/:id` | `getOrder` |
| `PUT` | `/api/orders/:id` | `upsertOrder` |
| `DELETE` | `/api/orders/:id` | `deleteOrder` |
| `GET` | `/api/orders/:id/ports` | `getPort` |
| `GET` | `/api/orders/:id/capacities` | `listCapacities` |

通用约定：

- 统一 JSON 请求/响应体；时间字段使用 ISO 8601 字符串（UTC）。
- 金额、数量使用 `number`，避免浮点误差需在服务端以「分」或定点数存储。
- 子资源按 `orderId` 过滤的接口，统一使用嵌套路径 `/orders/:id/...`。
- 错误响应统一结构：`{ code, message, data }`，前端在 storage 层统一处理并抛出。

---

## 8. 状态流转与业务规则

### 8.1 订单状态机

状态流转规则集中定义于 `src/types/index.ts` 的 `STATUS_FLOW`，**任何状态变更必须经过 `store.transitionStatus()`**，禁止直接调用 `updateOrderStatus`。

```
draft → port → capacity → plan → pending_confirm → confirmed → shipping → shipped → completed
```

| 阶段 | 说明 |
| --- | --- |
| 创建阶段 | `draft` → `port` → `capacity` → `plan` → `pending_confirm`，按 Step 逐步推进 |
| 业务阶段 | `pending_confirm`（财务确认收款）→ `confirmed` → `shipping` → `shipped` → `completed` |

关键约束：

- 状态推进是**角色化**的：`pending_confirm → confirmed` 必须由财务角色确认收款后触发。
- 状态流转必须记录 `OperationLog`（`fromStatus` / `toStatus` / `operator` / `role`）。
- `admin` 角色可跳过 `STATUS_FLOW` 校验，但普通角色非法流转会被拒绝并打印 `console.warn`。

### 8.2 运输通道状态

运输通道（`Capacity`）的状态在 `ChannelShipping` 中独立管理，各通道互不干扰。发运状态：`not_started → shipping → completed`。

### 8.3 表单联动与系统生成字段

- 上游步骤数据需自动带出到下游表单（如：订单 → 港口自动带出港口名；运力/方案金额自动汇总至财务「总金额」）。
- 系统自动计算的字段（如运输时效 `leadTime`、订单编号）以**只读块**展示，并附带「系统自动计算」徽标与说明图标。

---

## 9. 版本控制流程

### 9.1 分支模型

采用 **Git Flow 简化版**：

```
main（生产分支，始终可发布）
  └── develop（集成分支）
        ├── feature/xxx（功能分支，从 develop 切出）
        ├── fix/xxx（缺陷修复分支）
        └── chore/xxx（构建/文档/依赖等）
```

### 9.2 提交规范（Conventional Commits）

```
<type>(<scope>): <subject>
```

| type | 用途 |
| --- | --- |
| `feat` | 新功能 |
| `fix` | 缺陷修复 |
| `refactor` | 重构（不改行为） |
| `style` | 样式/格式（不影响逻辑） |
| `docs` | 文档 |
| `chore` | 构建、依赖、杂项 |

示例：

```
feat(capacity): 新增公铁联运中转装卸详情
fix(order): 修复终端客户销售数量合计错误
refactor(storage): 抽象数据访问层支持 api 模式切换
```

### 9.3 合并与发布

- 功能分支通过 **Pull Request / Merge Request** 合入 `develop`，必须至少 1 人 Code Review。
- 合入前确保 `npm run type-check` 与 `npm run lint` 通过。
- 发布时由 `develop` 合入 `main`，并打语义化版本 tag（`vX.Y.Z`）。
- 禁止直接向 `main` 提交；禁止 `push --force`。

---

## 10. 测试要求

当前项目以**静态检查 + 类型检查**为质量底线。新模块需满足：

1. **类型检查**：`npm run type-check` 零错误。
2. **代码检查**：`npm run lint` 零错误。
3. **关键纯函数单测**：`src/lib/format.ts`、`src/types/index.ts` 中的迁移/辅助函数（如 `migrateStatus`、`customersTotalQty`、`toChannelGroup`）等**纯逻辑**建议补充单元测试。
4. **手动回归清单**：新增页面需在 5174 端口完成以下人工验证：
   - 表单录入 → 保存 → 刷新后数据保留；
   - 上游数据正确联动到下游；
   - 状态流转符合 `STATUS_FLOW` 且日志正确生成；
   - PDF 导出样式一致（若涉及报告）。
5. 涉及数据模型变更时，必须验证**旧数据迁移**逻辑。

> 引入自动化测试框架时，优先选择 Vitest（与 Vite 生态一致），并在 CI 中接入 type-check、lint、test 三步流水线。

---

## 11. 协作流程

### 11.1 任务分配与模块边界

- 按**页面/业务阶段**拆分任务，明确每个模块的责任人，避免多人同时改动同一文件（尤其 `types/index.ts`、`storage.ts`、`order.ts` 三个核心文件）。
- 核心文件变更必须提前在 PR 描述中说明影响面。

### 11.2 开发流程

1. 从 `develop` 切出 `feature/xxx` 分支。
2. 本地开发（`npm run dev`，端口 5174）。
3. 遵循「模块划分原则」完成四层改动（types → storage → store → page）。
4. 自测 + `type-check` + `lint`。
5. 提交 PR，附变更说明与截图（如涉及 UI）。
6. Code Review 通过后合入 `develop`。

### 11.3 评审关注点

- 是否遵循目录职责边界与命名规范；
- 是否在组件内硬编码颜色/文案（应使用 `META` 常量）；
- 状态变更是否走 `transitionStatus`；
- 数据模型变更是否提供迁移函数；
- 是否破坏现有 PDF 导出、状态流转等既有功能。

---

## 12. 常见问题解决方案

### 12.1 Tailwind 样式失效

**现象**：新增 `.vue` 页面布局塌陷、样式丢失。

**原因**：`tailwind.config.js` 的 `content` 未包含 `.vue` 文件，导致工具类未被生成。

**解决**：确保 `content` 为：

```js
content: ['./index.html', './src/**/*.{vue,ts,tsx,js,jsx}']
```

### 12.2 读取响应式对象报 `undefined`

**现象**：在 `<script setup>` 中访问 store 返回的响应式数据时取不到值。

**原因**：直接访问了 `Ref`/`ComputedRef` 本体而非 `.value`。

**解决**：对 `ref`/`computed` 使用 `.value`，例如 `order.value?.cargoTotal`。

### 12.3 表单输入未绑定到 Vue 响应式数据

**现象**：通过自动化脚本 `input` 后，提交校验仍报字段为空。

**原因**：直接设置 DOM `value` 不会触发 Vue 的 `input`/`change` 事件。

**解决**：使用 `v-model` 绑定，或手动派发 `input` 事件触发响应式更新。

### 12.4 状态流转被拒绝

**现象**：控制台输出 `非法状态流转：X → Y`。

**原因**：目标状态不在 `STATUS_FLOW` 当前状态的允许集合内。

**解决**：检查 `src/types/index.ts` 的 `STATUS_FLOW`；若确需跨状态调整，应使用 `admin` 角色或先推进中间状态，禁止直接 `updateOrderStatus`。

### 12.5 PDF 导出样式不一致

**现象**：导出报告中部分区块出现颜色/排版偏差。

**原因**：导出基于 `.pdf-section` 截图拼页，区块使用了与正文不一致的样式。

**解决**：报告内容统一使用 `src/components/TransportPlanReport.vue` 中的既有样式与 `.pdf-section` 结构，保证各区块排版与配色统一；PDF 必须通过用户显式点击「下载」按钮触发，不得自动下载。

### 12.6 新页面路由 404

**现象**：直接访问深层路由刷新后 404。

**原因**：Vue Router history 模式需要服务端 SPA fallback。

**解决**：部署时使用 `deploy/nginx.conf` 中的 `try_files $uri $uri/ /index.html`；开发环境 Vite 已内置 fallback。

---

## 附：核心文件速查

| 文件 | 作用 |
| --- | --- |
| `src/types/index.ts` | 数据模型、状态流转、元数据与选项常量（**改动需谨慎**） |
| `src/lib/storage.ts` | 数据访问层（唯一持久化边界） |
| `src/stores/order.ts` | 业务状态与状态流转逻辑 |
| `src/router/index.ts` | 路由表与页面标题 |
| `src/lib/format.ts` | 数值/日期/订单摘要格式化 |
| `src/lib/pdfExport.ts` | PDF 导出 |
| `tailwind.config.js` | Apple 设计令牌与主题扩展 |
| `vite.config.ts` | 端口、别名、分包策略 |

## 测试行
这是一行用于测试CODEOWNERS审批规则的内容。
