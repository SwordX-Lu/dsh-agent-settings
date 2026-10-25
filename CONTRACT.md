# 契约：智能体设置 / Agent Settings（宿主 ↔ 客户端）

所有数据都是纯 JSON。宿主在 `ctx.connection.fetch.register` 上注册精确路由，
客户端用相对 URL `api/...` 调用（页面根为 `/`，等价于 `/api/...`）。
所有响应 `cache-control: no-store`，鉴权由 Connection 的 `/api` 认证围栏负责。

## 路由

### 1. `GET /api/agent-settings.state`

200：

```json
{
  "ok": true,
  "state": {
    "agents": [
      {
        "id": "agt_ab12cd34",
        "name": "code-reviewer",
        "title": "代码审查员",
        "description": "只读审查 diff 的正确性与安全性，给出阻断性问题清单。",
        "whenToUse": "任务涉及代码审查、diff 检查、安全审计、回归风险判断时使用。",
        "provider": "workbuddy",
        "model": "deepseek-v4.1-flash",
        "reasoningEffort": "low",
        "maxTokens": null,
        "enabled": true,
        "autoLaunch": true,
        "order": 0,
        "createdAt": 1761350000000,
        "updatedAt": 1761350000000
      }
    ],
    "catalog": {
      "providers": [{ "id": "workbuddy", "name": "WorkBuddy" }]
    },
    "settings": {
      "autoLaunch": true,
      "maxAgents": 24,
      "spawnProvider": "spawn",
      "storagePath": "/home/user/.dsh/agent-settings.json"
    }
  }
}
```

### 2. `POST /api/agent-settings.save`

请求体：`{ "agent": { ...部分或全部字段 } }`（`id` 缺省表示新建）。
200：`{ "ok": true, "state": <同上> }`
200（校验失败）：`{ "ok": false, "error": "面向用户的一句话原因" }`
500：`{ "ok": false, "error": "..." }`

### 3. `POST /api/agent-settings.remove`

请求体：`{ "id": "agt_..." }` → 与 save 相同响应形状。

### 4. `GET /api/agent-settings.models?provider=<id>`

每个模型带该路由的真实能力，面板据此渲染推理强度下拉与输出上限提示：

```json
{ "ok": true, "models": [{
  "id": "deepseek-v4.1-flash",
  "name": "deepseek-v4.1-flash",
  "efforts": [{ "id": "low", "name": "Low" }, { "id": "xhigh", "name": "Xhigh" }],
  "defaultEffort": "low",
  "defaultMaxTokens": 128000,
  "contextWindow": 1000000
}]}
```

`efforts` 缺省表示该路由不支持推理强度；`defaultMaxTokens` 缺省表示该路由未声明输出上限。
失败：`{ "ok": false, "error": "...", "models": [] }`。

### 5. 上限默认值与迁移

- 保存时若 `maxTokens` 留空，宿主用 `llm.resolveCallConfig` 物化出的值（源自该模型的
  `defaultMaxTokens`）写回，**不写 `null`**；只有路由确实未声明上限时才保留 `null`。
- 启动时宿主对已有的 `maxTokens: null` 档案补写一次模型配置值，解析失败的档案原样保留。

## 字段校验（宿主权威，客户端只做提示）

| 字段 | 规则 |
|---|---|
| `name` | 必填，`^[a-z][a-z0-9-]{1,31}$`，全局唯一（改名也要唯一） |
| `title` | 必填，1–48 字符 |
| `description` | 必填，1–600 字符 |
| `whenToUse` | 必填，1–600 字符 |
| `provider` / `model` | 必填，非空字符串；保存时宿主用 `ctx.llm.resolveCallConfig` 预检路由 |
| `reasoningEffort` | 可空字符串；空串表示跟随模型默认 |
| `maxTokens` | `null` 或 1–1000000 的整数 |
| `enabled` / `autoLaunch` | 布尔 |
| `order` | 0–999 整数，客户端按列表顺序发送 |

## 客户端 UI 要求

- 侧边栏面板：`sidebar.panellist`，`id: 'agent-settings'`，`order: 20`，
  `label: () => t('panel')`；主面板：`main`，`key: 'agent-settings'`。
- 页面：左侧列表（空态、行卡片：title + name、`provider/model` 徽标、enabled/autoLaunch 开关、
  编辑/删除），右侧编辑表单（新建/编辑共用）。删除需二次确认（同一行内确认，不用 window.confirm）。
- **每个开关旁边必须有可见的文字标签**，不能只有 `aria-label`/`title`；表单里的开关还要跟随一行说明。
- 包名 / 模块 id / patch row：`dsh-agent-settings` / `agent-settings`（三处必须一致）。
- 表单字段：`name`、`title`、`description`、`whenToUse`、`provider`（select，来自 catalog）、
  `model`（**只能**用 `<select>` 下拉，选项来自 models 路由；提供方切换时清空已选模型与档位）、
  `reasoningEffort`（**只能**用 `<select>` 下拉，选项 = 该模型的 `efforts`，首项为「跟随模型默认」）、
  `maxTokens`（数字；留空 = 用该模型的 `defaultMaxTokens`）、`enabled`、`autoLaunch`。
- 所有文案走 `ctx.locale.register('agentRoster', { zh, en })` + `ctx.locale.bind('agentRoster')`，
  通过 slot `inject` 传给组件；不硬编码中文/英文句子。
- 样式：只允许 `--dsw-alias-*` 主题变量；用组件内的 `<style>` React 元素承载 CSS，
  所有类名/选择器以 `.dshAgentRoster` 前缀；禁止 import 任何 `@deepseek-ai/*` 客户端包，
  只用模块表里的 `react`、`fetch`。
- 保存/删除调用上述路由；失败时在表单顶部显示 `error` 文案；成功后用响应里的 `state` 覆盖本地状态。
- 监听 `connection/reset` 重新拉取 state。
- 组件必须是纯函数组件，副作用放进 `useEffect`，卸载即取消未完成请求。
