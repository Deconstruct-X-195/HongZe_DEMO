# AGENTS.md — AI 编程快速参考

> 泓泽宜通 · 运输组织方案系统
> 本文件为 AI 编程时的快速参考，详细规则请阅读 `RULE.md`。

---

## 项目概述

- **技术栈**：Vue 3 + TypeScript + Vite + Pinia + Vue Router + Tailwind CSS
- **数据持久化**：localStorage（MVP 阶段）
- **开发端口**：5174
- **设计风格**：Apple 风格（简洁、圆角、留白、毛玻璃）

---

## 目录结构

```
src/
├── api/          # 后端接口契约层（占位，当前未使用）
├── components/   # 通用 UI 组件（可复用、无业务依赖）
├── lib/          # 非组件基础设施
│   ├── format.ts       # 格式化工具
│   ├── pdfExport.ts    # PDF 导出
│   └── storage/        # 数据访问层（按实体拆分）
├── pages/        # 路由页面（一页一文件，以 Page 结尾）
├── router/       # 路由配置
├── stores/       # Pinia 状态管理
│   ├── order.ts        # 订单业务 store（核心）
│   └── business.ts     # 统一业务 store（13个模块CRUD）
├── types/        # TypeScript 类型定义（按领域拆分）
├── App.vue       # 根组件
├── index.css     # 全局样式
└── main.ts       # 应用入口
```

---

## 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 页面组件 | PascalCase + `Page` | `CustomerListPage.vue` |
| 通用组件 | PascalCase | `Badge.vue`、`TopBar.vue` |
| 变量/函数 | camelCase | `customerList`、`getById` |
| 常量 | UPPER_SNAKE_CASE | `STATUS_META` |
| 类型/接口 | PascalCase（不加 I/T 前缀） | `Customer`、`OrderStatus` |
| 功能分支 | `feature/描述` | `feature/customer-list` |
| 修复分支 | `fix/描述` | `fix/login-error` |
| 提交信息 | `<type>: <描述>` | `feat: 完成客户列表页` |

**提交类型**：`feat`（新功能）、`fix`（修Bug）、`docs`（文档）、`style`（样式）、`refactor`（重构）、`perf`（性能）、`test`（测试）、`chore`（杂项）

---

## 编码规范

- 使用 `<script setup lang="ts">`
- 2 空格缩进，单引号，无分号
- 禁止使用 `any`（用 `unknown` 或具体类型）
- 函数参数和返回值必须有类型
- 样式优先使用 Tailwind 工具类
- 颜色使用语义令牌：`text-apple-text`、`bg-apple-bg`、`border-apple-border`、`text-apple-blue`
- 禁止硬编码颜色值
- 业务命名、注释、用户可见文案用中文；代码标识符用英文

---

## 新增实体六层贯穿

新增业务实体时，必须按顺序完成：

1. **types/** — 定义 interface + META 常量 + 状态机
2. **lib/storage/** — 实现 list/get/upsert/remove
3. **stores/business.ts** — 添加 load/add/update/remove
4. **pages/** — 创建 ListPage + FormPage
5. **router/index.ts** — 添加3条路由（列表/新增/编辑）
6. **pages/HomePage.vue** — 在 modules 数组添加导航入口

---

## 提交前自检

```bash
npm run type-check   # 必须零错误
npm run lint         # 必须零警告零错误
npm run build        # 重大变更时必须通过
```

---

## Git 协作流程

```bash
git checkout main
git pull origin main
git checkout -b feature/xxx
# 开发代码
npm run type-check && npm run lint
git add .
git commit -m "feat: 描述"
git push -u origin feature/xxx
# 在 GitHub 提 PR，等待审批
```

- main 分支受保护，必须通过 PR 合并
- 所有 PR 需 @Deconstruct-X-195 审批（CODEOWNERS）

---

## 常用组件

优先使用已有组件：`TopBar`、`Badge`、`Icon`、`EmptyState`、`Field`、`FieldGroup`、`InfoRow`、`SearchSelect`、`Stepper`

---

## 禁止事项

1. ❌ 禁止直接在 main 分支提交
2. ❌ 禁止使用 `any` 类型
3. ❌ 禁止硬编码颜色值
4. ❌ 禁止在 components/ 中读写 store 或 localStorage
5. ❌ 禁止在 stores/ 中直接操作 localStorage
6. ❌ 禁止提交 console.log 调试代码
7. ❌ 禁止提交注释掉的废弃代码
8. ❌ 禁止写模糊提交信息

---

> 详细规则请阅读 `RULE.md`.
