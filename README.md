# 智能体设置（Agent Settings）

为 DeepSeek Harness 增加一个**可在任务之外手动维护智能体的面板**（侧边栏名称：智能体设置 / Agent Settings）：每个档案写清「它做什么」「什么任务该用它」「用哪个 provider/模型」，然后在任意任务里由模型按 `whenToUse` 自行启动对应的子 Agent，或由你显式点选。

## 它做了什么

| 能力 | 位置 |
|---|---|
| 侧边栏「智能体设置」图标 + 中央管理页（列表 / 新建 / 编辑 / 启停 / 自动启动开关 / 行内二次确认删除） | `sidebar.panellist` + `main`（key `agent-settings`） |
| 每个档案携带 provider / model / reasoningEffort / maxTokens 路由 | 保存时用 `llm.resolveCallConfig` 预检，写错在表单里就失败 |
| 模型工具：`list_roster_agents`、`delegate_to_roster_agent`、`save_roster_agent`、`remove_roster_agent` | `ctx.tools.register` |
| 自动启动：把启用且开了 `autoLaunch` 的档案按 `whenToUse` 写进系统提示，模型匹配就指派，不必先问你 | `systemPrompt.section`（`TOOL_SUBAGENT` 前一位） |
| 耐久存储 | `${DSH_HOME:-~/.dsh}/agent-settings.json`，原子替换写入（旧名 `agent-roster.json` 会自动迁移一次） |

面板与工具共用同一份存储：面板里改的档案，模型下一次 `list_roster_agents` 立刻看到；模型 `save_roster_agent` 写的档案，面板刷新即出现。

## 安装

本地目录：

```bash
dsh plugin --profile web add /home/kali/Documents/deepseek-harness/default-workspace/plugins/dsh-agent-settings
```

或用插件管理器以该目录为 `target` 执行 `install_bundle`。

从 GitHub（上架 dsh-market 后）：

```bash
dsh plugin --profile web add github:OWNER/dsh-agent-settings
```

上架到 dsh-market 的完整步骤见 [GITHUB-SETUP.md](GITHUB-SETUP.md)。

## 配置（`cordis.patch.yml`）

```yaml
- id: agent-settings
  name: 'dsh-agent-settings'
  config:
    storagePath: ~/.dsh/agent-settings.json  # 可省略，默认即此
    autoLaunch: true                        # false = 只留工具，不写系统提示
    maxAgents: 24                           # 档案上限（1–256）
    spawnProvider: spawn                    # 子 Agent 后端：spawn（全新）或 fork（继承对话）
    toolName: delegate_to_roster_agent      # 委派工具名
```

## 扩展约定

- 新增字段：`index.js` 的 `normalizeProfile` / `view`、`client.js` 的 `toDraft` / `draftToPayload`、`CONTRACT.md` 三处同步。
- 新增面板操作：先在 Host 里实现一次方法，再同时接路由与工具（见 `references/user-actions.md` 的「一个操作两个调用方」）。
- 子 Agent 的角色说明来自 `description`，任务说明来自调用时的 `prompt`；两者在委派时拼成一条文本提示。

## 图标资源

- `icon.svg` — 插件清单读取的矢量源。透明背景、扁平配色（`#145AF3` / `#7CB7FF` /
  `#45D9E7` / `#F2AF63`），与 dsh 自带 bundle 图标的视觉语言一致
- 侧边栏图标是另一套：`client.js` 里的 `RosterIcon` 用 `currentColor` 描边，
  继承宿主文字颜色，且在 16px 下仍可辨认
- `assets/icon-180.png` / `assets/icon-512.png` — dsh-market 目录条目所需的位图（目录不接受 SVG）
- `assets/icon-preview.png` — 与自带图标的同尺度对照图

## 已知限制

- 面板不支持拖拽排序（只按 `order` 升序；新建自动排到末尾）。
- 推理强度与模型都用下拉：档位来自该模型真实的 `efforts`，输出上限默认取模型配置的
  `defaultMaxTokens`（老档案里为 `null` 的会在启动时补写一次）。
- 档案禁用后不会被委派，也不进系统提示，但仍显示在面板里（`includeDisabled` 才能在工具里看到）。
- 视觉验证限于插槽注册与模块加载；浅色/深色下的实际观感未在浏览器中人工确认过。
