# 项目开发规则（AI 编程必读）

> 泓泽宜通 · 运输组织方案系统
> 本文档为 AI 编程（vibe coding）时的强制规则，所有代码生成必须遵守。

***

## 一、项目基本信息

| 项目    | 说明                                                            |
| ----- | ------------------------------------------------------------- |
| 项目名称  | 泓泽宜通 · 运输组织方案系统                                               |
| 技术栈   | Vue 3 + TypeScript + Vite + Pinia + Vue Router + Tailwind CSS |
| 数据持久化 | localStorage（MVP 阶段），预留后端 API 切换能力                            |
| 开发端口  | 5174                                                          |
| 代码仓库  | <https://github.com/Deconstruct-X-195/HongZe_DEMO>            |

***

## 二、目录结构与职责

```
src/
├── api/          # 后端接口契约层（占位，当前未使用）
├── assets/       # 静态资源
├── components/   # 通用 UI 组件（可复用、无业务依赖）
├── lib/          # 非组件基础设施（纯函数、数据访问、工具）
│   ├── format.ts       # 格式化工具
│   ├── pdfExport.ts    # PDF 导出
│   └── storage/        # 数据访问层（按实体拆分，每个实体一个文件）
├── pages/        # 路由页面（一页一文件，以 Page 结尾）
├── router/       # 路由配置
├── stores/       # Pinia 状态管理
│   ├── order.ts        # 订单业务 store（核心）
│   └── business.ts     # 统一业务 store（13个模块的CRUD）
├── types/        # TypeScript 类型定义（按领域拆分）
├── App.vue       # 根组件
├── index.css     # 全局样式
└── main.ts       # 应用入口
```

### 职责边界（强制）

| 目录            | 允许                 | 禁止                               |
| ------------- | ------------------ | -------------------------------- |
| `components/` | 可复用 UI 组件          | 直接读写 store 或 localStorage        |
| `pages/`      | 路由页面、组装组件、调用 store | 直接操作 DOM 做跨页逻辑                   |
| `lib/`        | 纯函数、数据访问、工具        | 引入 `.vue` 组件                     |
| `stores/`     | Pinia store、业务逻辑   | 直接操作 localStorage（应通过 storage 层） |
| `types/`      | 类型、常量、元数据          | 副作用、运行时 I/O                      |
| `api/`        | 后端接口契约、请求封装        | 业务逻辑、UI 组件                       |

***

## 三、命名规范（强制）

### 3.1 文件命名

| 类型       | 规范                     | 示例                                         |
| -------- | ---------------------- | ------------------------------------------ |
| 页面组件     | PascalCase + `Page` 后缀 | `CustomerListPage.vue`、`OrderFormPage.vue` |
| 通用组件     | PascalCase             | `Badge.vue`、`TopBar.vue`                   |
| 类型文件     | kebab-case（小写+连字符）或小写  | `customer.ts`、`order.ts`                   |
| 存储文件     | 小写，与类型文件对应             | `customer.ts`、`order.ts`                   |
| Store 文件 | 小写                     | `order.ts`、`business.ts`                   |
| 工具函数     | camelCase              | `format.ts`、`pdfExport.ts`                 |

### 3.2 代码标识符

| 类型     | 规范                        | 示例                               |
| ------ | ------------------------- | -------------------------------- |
| 组件名    | PascalCase                | `CustomerListPage`、`Badge`       |
| 变量/函数  | camelCase                 | `customerList`、`getCustomerById` |
| 常量     | UPPER\_SNAKE\_CASE        | `STATUS_META`、`MAX_RETRY`        |
| 类型/接口  | PascalCase                | `Customer`、`OrderStatus`         |
| 类型前缀   | 接口不加 `I` 前缀，类型别名不加 `T` 前缀 | `Customer`（不是 `ICustomer`）       |
| 事件处理   | `handle` + 动作             | `handleSubmit`、`handleDelete`    |
| 计算属性   | 名词或形容词                    | `filteredList`、`isValid`         |
| Ref 变量 | 名词                        | `search`、`form`、`dialogVisible`  |

### 3.3 分支命名

| 类型     | 规范             | 示例                                           |
| ------ | -------------- | -------------------------------------------- |
| 新功能    | `feature/功能描述` | `feature/customer-list`、`feature/login-page` |
| 修复 Bug | `fix/问题描述`     | `fix/login-error`、`fix/order-status-bug`     |
| 重构     | `refactor/描述`  | `refactor/module-split`、`refactor/stores`    |
| 文档     | `docs/描述`      | `docs/update-readme`、`docs/api-doc`          |
| 样式     | `style/描述`     | `style/homepage-ui`                          |
| 杂项     | `chore/描述`     | `chore/update-deps`、`chore/config`           |

### 3.4 提交信息（强制）

格式：`<type>: <description>`

| type       | 说明               | 示例                        |
| ---------- | ---------------- | ------------------------- |
| `feat`     | 新功能              | `feat: 完成客户管理列表页`         |
| `fix`      | 修复 Bug           | `fix: 修复订单状态流转错误`         |
| `docs`     | 文档变更             | `docs: 更新开发规则文档`          |
| `style`    | 样式调整（不影响逻辑）      | `style: 优化首页卡片间距`         |
| `refactor` | 重构（不新增功能、不修 Bug） | `refactor: 拆分订单详情页为多 Tab` |
| `perf`     | 性能优化             | `perf: 优化列表渲染性能`          |
| `test`     | 测试相关             | `test: 添加客户管理单元测试`        |
| `chore`    | 构建/依赖/杂项         | `chore: 升级 Vue 到 3.4`     |

**禁止**：`update`、`修改`、`fix`、`test` 等模糊描述。

***

## 四、编码规范（强制）

### 4.1 基本规范

- **语言**：业务命名、注释、用户可见文案统一使用**中文**；代码标识符使用英文
- **缩进**：2 空格
- **引号**：单引号
- **分号**：不使用分号（遵循现有代码风格）
- **行尾**：无尾随空格
- **文件编码**：UTF-8

### 4.2 Vue 组件规范

- 统一使用 `<script setup lang="ts">` 语法
- 页面组件以 `Page` 结尾
- Props 使用 `defineProps<{...}>()` 类型声明
- Emits 使用 `defineEmits<{...}>()` 类型声明
- 响应式数据使用 `ref` / `reactive`
- 计算属性使用 `computed`
- 生命周期使用 `onMounted` / `onUnmounted` 等
- 模板中使用 `v-if` / `v-for` 时注意 `key`
- 样式优先使用 Tailwind 工具类，复杂样式使用 `<style scoped>`

### 4.3 TypeScript 规范

- 禁止使用 `any`，除非确实需要（应使用 `unknown` 或具体类型）
- 函数参数和返回值必须有类型
- 接口定义使用 `interface`，联合类型使用 `type`
- 枚举优先使用联合类型或常量对象，不使用 `enum`
- 类型导出统一在 `types/index.ts` 聚合

### 4.4 样式规范

- 优先使用 Tailwind CSS 工具类
- 颜色使用语义令牌：`text-apple-text`、`bg-apple-bg`、`border-apple-border`、`text-apple-blue` 等
- 圆角使用 `rounded-apple`、`rounded-apple-lg` 等自定义类
- 阴影使用 `shadow-card`、`shadow-card-hover` 等自定义类
- 禁止使用硬编码颜色值（如 `#fff`、`rgb(0,0,0)`），应使用语义令牌

***

## 五、新增实体/模块标准流程（强制）

当需要新增一个业务实体/模块时，必须按以下顺序完成六层改动：

### 第 1 层：类型定义

在 `src/types/` 下创建 `实体名.ts`，定义：

- `interface 实体名` — 数据结构
- 状态类型（如果有状态机）
- `META` 常量（状态标签、颜色等元数据）
- 在 `types/index.ts` 中导出

### 第 2 层：数据访问层

在 `src/lib/storage/` 下创建 `实体名.ts`，实现：

- `KEYS` 常量（localStorage 键名）
- `list()` — 获取列表
- `get(id)` — 根据 ID 获取
- `upsert(data)` — 新增或更新
- `remove(id)` — 删除
- 数据迁移函数（如果需要）
- 在 `storage/index.ts` 中导出

### 第 3 层：Store 层

在 `src/stores/business.ts` 中添加：

- 对应的 state（数组）
- `loadXxx()` — 加载数据
- `addXxx(data)` — 新增
- `updateXxx(id, data)` — 更新
- `removeXxx(id)` — 删除
- 在 return 中导出

### 第 4 层：页面层

在 `src/pages/` 下创建两个文件：

- `实体名ListPage.vue` — 列表页（搜索 + 筛选 + 表格 + 统计卡片）
- `实体名FormPage.vue` — 表单页（新增 + 编辑共用）

### 第 5 层：路由层

在 `src/router/index.ts` 中添加 3 条路由：

- `/实体名` — 列表页
- `/实体名/new` — 新增
- `/实体名/:id/edit` — 编辑

### 第 6 层：导航入口

在 `src/pages/HomePage.vue` 的 `modules` 数组中添加导航入口：

- `name` — 模块名称
- `path` — 路由路径
- `icon` — 图标名称（必须是 Icon.vue 支持的图标）
- `color` — 主题色

> 注意：跨实体级联删除时，主实体删除必须同步清理关联数据，保证数据一致性。

***

## 六、Git 协作规范（强制）

### 6.1 分支策略

- `main` 分支：受保护，不允许直接推送，必须通过 PR 合并
- 功能开发：从 `main` 创建 `feature/xxx` 分支
- Bug 修复：从 `main` 创建 `fix/xxx` 分支

### 6.2 开发流程

```bash
# 1. 切换到 main 并拉取最新代码
git checkout main
git pull origin main

# 2. 创建功能分支
git checkout -b feature/xxx

# 3. 开发代码

# 4. 提交前自检（必须通过）
npm run type-check
npm run lint

# 5. 提交
git add .
git commit -m "feat: 描述"

# 6. 推送
git push -u origin feature/xxx

# 7. 在 GitHub 提 PR，等待审批合并

# 8. 合并后清理本地分支
git checkout main
git pull origin main
git branch -d feature/xxx
```

### 6.3 PR 规范

- PR 标题：与提交信息格式一致，`feat: 描述`
- PR 描述：说明改了什么、影响哪些模块、测试结果
- 所有 PR 必须通过 CODEOWNERS 审批（@Deconstruct-X-195）
- 审批通过后才能合并到 main

***

## 七、提交前自检清单（强制）

提交代码前，必须确认以下全部通过：

- [ ] `npm run type-check` — 类型检查零错误
- [ ] `npm run lint` — 代码检查零警告零错误
- [ ] `npm run build` — 构建成功（重大变更时）
- [ ] 命名规范符合本文档要求
- [ ] 没有使用 `any` 类型
- [ ] 没有硬编码颜色值
- [ ] 没有 `console.log` 调试代码（错误处理的 `console.error` 除外）
- [ ] 没有注释掉的废弃代码
- [ ] 新增实体已完成六层贯穿
- [ ] 提交信息格式正确

***

## 八、UI 设计规范

### 8.1 设计风格

- Apple 风格：简洁、圆角、留白、毛玻璃效果
- 主色调：`#0071e3`（apple-blue）
- 文字颜色：`#1d1d1f`（apple-text）、`#6e6e73`（apple-subtext）
- 背景色：`#f5f5f7`（apple-bg）、`#ffffff`（apple-card）
- 边框色：`#d2d2d7`（apple-border）

### 8.2 列表页标准布局

1. 顶部：TopBar 导航栏
2. 统计卡片行（4个卡片：总数、进行中、已完成、总额等）
3. 搜索 + 筛选工具栏
4. 表格列表（或卡片网格）
5. 空状态展示（无数据时）

### 8.3 表单页标准布局

1. 顶部：TopBar 导航栏（带返回按钮）
2. 分组卡片表单（每个分组一个 FieldGroup 或卡片）
3. 底部：取消 + 保存按钮

***

## 九、常用组件清单

开发页面时，优先使用已有组件，不要重复造轮子：

| 组件                    | 路径                                     | 用途               |
| --------------------- | -------------------------------------- | ---------------- |
| `TopBar`              | `@/components/TopBar.vue`              | 顶部导航栏            |
| `Badge`               | `@/components/Badge.vue`               | 状态徽标             |
| `Icon`                | `@/components/Icon.vue`                | 内联 SVG 图标（36个图标） |
| `EmptyState`          | `@/components/EmptyState.vue`          | 空状态展示            |
| `Field`               | `@/components/Field.vue`               | 表单字段容器           |
| `FieldGroup`          | `@/components/FieldGroup.vue`          | 卡片式分组（可折叠）       |
| `InfoRow`             | `@/components/InfoRow.vue`             | 信息行展示            |
| `SearchSelect`        | `@/components/SearchSelect.vue`        | 可搜索下拉选择          |
| `Stepper`             | `@/components/Stepper.vue`             | 步骤条              |
| `OrderContextBar`     | `@/components/OrderContextBar.vue`     | 订单上下文栏           |
| `TransportPlanReport` | `@/components/TransportPlanReport.vue` | 运输方案报告           |

***

## 十、禁止事项

1. ❌ 禁止直接在 `main` 分支上提交代码
2. ❌ 禁止使用 `any` 类型
3. ❌ 禁止硬编码颜色值（使用语义令牌）
4. ❌ 禁止在 `components/` 中直接读写 store 或 localStorage
5. ❌ 禁止在 `stores/` 中直接操作 localStorage（应通过 storage 层）
6. ❌ 禁止在 `types/` 中写副作用或运行时 I/O
7. ❌ 禁止提交 `console.log` 调试代码
8. ❌ 禁止提交注释掉的废弃代码
9. ❌ 禁止写模糊的提交信息（如 `update`、`修改`）
10. ❌ 禁止两个人同时改同一个核心文件（types/storage/store/router）

***

