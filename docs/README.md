# docs 目录说明

> 泓泽宜通 · 运输组织方案系统 — 项目文档目录

---

## 目录结构

```
docs/
├── README.md                 # 本文件，目录说明
├── templates/                # 📋 模板文件
│   ├── PRD模板.md            # PRD（产品需求文档）模板
│   ├── 任务拆分模板.md        # 任务拆分模板
│   ├── AI提示词模板.md        # Vibe Coding AI 提示词模板
│   ├── 开发日志模板.md        # 开发日志模板
│   └── 需求确认单.md          # 需求确认单模板
├── prd/                      # 📄 PRD 文档（按功能存放）
│   └── _template.md → ../templates/PRD模板.md
├── logs/                     # 📝 开发日志（按日期/任务存放）
│   └── _template.md → ../templates/开发日志模板.md
└── decisions/                # 🧠 重要决策记录
    └── YYYYMMDD_决策主题.md
```

---

## 文档使用流程

对应 Vibe Coding 工作流的7步：

| 步骤 | 产出文档 | 存放位置 | 模板 |
|------|---------|---------|------|
| 1. 需求确认 | 需求确认单 | GitHub Issue | `templates/需求确认单.md` |
| 2. PRD 编写 | PRD 文档 | `prd/YYYYMMDD_功能名称_PRD.md` | `templates/PRD模板.md` |
| 3. 任务拆分 | 任务清单 | GitHub Issue | `templates/任务拆分模板.md` |
| 4. AI 编程 | 代码提交 | 功能分支 | `templates/AI提示词模板.md` |
| 5. 代码审查 | PR | GitHub PR | `.github/PULL_REQUEST_TEMPLATE.md` |
| 6. 测试验证 | 测试结果 | PR 评论 | - |
| 7. 文档日志 | 开发日志 | `logs/YYYYMMDD_任务名称.md` | `templates/开发日志模板.md` |

---

## 重要决策记录

重大技术选型、方案取舍、架构变更等，记录在 `decisions/` 目录下，格式：

```
YYYYMMDD_决策主题.md
```

内容包括：
- 决策背景
- 备选方案
- 决策结果
- 决策原因
- 后续影响

---

## 相关文档

- **AI 编程规则**：项目根目录 `RULE.md`（详细）和 `AGENTS.md`（快速参考）
- **团队协作指南**：`01_团队协作开发指南.md`（文档目录）
- **系统架构与任务规划**：`02_系统架构与任务规划.md`（文档目录）
- **Vibe Coding 工作流**：`03_VibeCoding工作流.md`（文档目录）
