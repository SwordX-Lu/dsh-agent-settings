/**
 * Agent Roster — durable, user-authored agent profiles for this Harness profile.
 *
 * The roster is a durable list of named agent profiles: what the agent does, when
 * to use it, plus the LLM route it runs on. Three consumers share one store:
 *
 * - the Web panel (`api/agent-settings.*` routes) creates, edits, and removes them;
 * - the `list_roster_agents` / `delegate_to_roster_agent` / `save_roster_agent`
 *   tools let the agent read the roster, save one, and launch one;
 * - the system prompt advertises enabled profiles' `whenToUse`, so the model
 *   starts the right child on its own instead of asking first.
 *
 * This module imports nothing from the Harness packages: a profile bundle
 * resolves its own dependencies, and a plain Cordis plugin needs only the
 * services already on `ctx`.
 *
 * @module agent-settings
 */

import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

/** Stable Cordis plugin name. */
export const name = 'agent-settings'

/** Services required before this plugin activates. */
export const inject = ['tools', 'systemPrompt', 'connection', 'subagents', 'llm']

const ROSTER_VERSION = 1
const NAME_PATTERN = /^[a-z][a-z0-9-]{1,31}$/
const MAX_TEXT = 600

/** Resolve the default roster document beside the profile's other durable state. */
function defaultStoragePath() {
  const home = process.env.DSH_HOME?.trim()
  const root = home !== undefined && home.length > 0 ? home : join(homedir(), '.dsh')
  return join(root, 'agent-settings.json')
}

/** One user-facing validation failure the panel and the tools both surface verbatim. */
class RosterError extends Error {
  /**
   * @param {string} message - one sentence the person can act on.
   * @param {string} [code] - stable machine code for the tool result.
   */
  constructor(message, code = 'AGENT_ROSTER_INVALID') {
    super(message)
    this.name = 'RosterError'
    this.code = code
  }
}

/** Trim one stored string, rejecting wrong types instead of coercing them. */
function text(value, field, max, { required = true } = {}) {
  if (value === undefined || value === null) {
    if (required) throw new RosterError(`缺少字段 ${field}`)
    return ''
  }
  if (typeof value !== 'string') throw new RosterError(`字段 ${field} 必须是字符串`)
  const trimmed = value.trim()
  if (required && trimmed.length === 0) throw new RosterError(`字段 ${field} 不能为空`)
  if (trimmed.length > max) throw new RosterError(`字段 ${field} 超过 ${max} 个字符`)
  return trimmed
}

/** Normalize the model route; an empty reasoning effort means "follow the model default". */
function route(raw) {
  const provider = text(raw.provider, 'provider', 120)
  const model = text(raw.model, 'model', 200)
  const reasoningEffort = text(raw.reasoningEffort, 'reasoningEffort', 60, { required: false })
  let maxTokens = raw.maxTokens
  if (typeof maxTokens === 'string') maxTokens = maxTokens.trim() === '' ? null : Number(maxTokens)
  if (maxTokens === undefined || maxTokens === null) maxTokens = null
  else if (typeof maxTokens !== 'number' || !Number.isSafeInteger(maxTokens) || maxTokens < 1 || maxTokens > 1_000_000) {
    throw new RosterError('字段 maxTokens 必须是 1 到 1000000 之间的整数，或留空')
  }
  return { provider, model, reasoningEffort: reasoningEffort === '' ? null : reasoningEffort, maxTokens }
}

/**
 * Validate and normalize one profile from untrusted input.
 * @param {unknown} raw - candidate profile; an update may carry only the changed fields.
 * @param {{ existing?: object | null, taken?: Set<string> }} options - merge context.
 * @returns {object} a complete profile without `id` or timestamps.
 */
function normalizeProfile(raw, { existing = null, taken = new Set() } = {}) {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new RosterError('agent 必须是一个对象')
  const base = existing ?? {}
  const pick = (field, fallback) => (Object.hasOwn(raw, field) ? raw[field] : fallback)

  const profile = {
    name: text(pick('name', base.name), 'name', 32),
    title: text(pick('title', base.title), 'title', 48),
    description: text(pick('description', base.description), 'description', MAX_TEXT),
    whenToUse: text(pick('whenToUse', base.whenToUse), 'whenToUse', MAX_TEXT),
    ...route({
      provider: pick('provider', base.provider),
      model: pick('model', base.model),
      reasoningEffort: pick('reasoningEffort', base.reasoningEffort),
      maxTokens: pick('maxTokens', base.maxTokens),
    }),
    enabled: pick('enabled', base.enabled ?? true) !== false,
    autoLaunch: pick('autoLaunch', base.autoLaunch ?? true) !== false,
    order: pick('order', base.order ?? 0),
  }

  if (!NAME_PATTERN.test(profile.name)) {
    throw new RosterError('name 必须是 2–32 位小写字母、数字或连字符，且以字母开头')
  }
  if (taken.has(profile.name)) throw new RosterError(`name "${profile.name}" 已被其他智能体使用`)
  if (typeof profile.order !== 'number' || !Number.isSafeInteger(profile.order) || profile.order < 0 || profile.order > 999) {
    throw new RosterError('order 必须是 0 到 999 之间的整数')
  }
  return profile
}

/**
 * Read the durable roster, tolerating an absent file and rejecting a malformed
 * one with a message that names the file. One unreadable profile is skipped so a
 * hand edit cannot lock the whole panel.
 * @param {string} path - absolute roster path.
 * @returns {Promise<object[]>} stored profiles.
 */
async function readRoster(path) {
  let raw
  try {
    raw = await readFile(path, 'utf8')
  } catch (error) {
    if (error?.code === 'ENOENT') return []
    throw new RosterError(`读取名单文件失败：${path}（${String(error?.message ?? error)}）`, 'AGENT_ROSTER_IO')
  }
  let document
  try {
    document = JSON.parse(raw)
  } catch {
    throw new RosterError(`名单文件不是合法 JSON：${path}`, 'AGENT_ROSTER_CORRUPT')
  }
  const agents = document?.agents
  if (!Array.isArray(agents)) return []
  const seen = new Set()
  const profiles = []
  for (const entry of agents) {
    try {
      const profile = normalizeProfile(entry, { taken: seen })
      seen.add(profile.name)
      profiles.push({ id: entry.id, createdAt: entry.createdAt, updatedAt: entry.updatedAt, ...profile })
    } catch {
      // Skipped: the panel shows the rest, and the person can repair the file.
    }
  }
  return profiles
}

/** Atomically replace the roster document, creating its directory when needed. */
async function writeRoster(path, agents) {
  const document = { version: ROSTER_VERSION, agents }
  const body = `${JSON.stringify(document, null, 2)}\n`
  const directory = dirname(path)
  await mkdir(directory, { recursive: true })
  const temporary = join(directory, `.${randomUUID()}.tmp`)
  await writeFile(temporary, body, 'utf8')
  await rename(temporary, path)
}

/** Build one new profile id. */
function mintId() {
  return `agt_${randomUUID().replaceAll('-', '').slice(0, 12)}`
}

/** Public projection of one stored profile. */
function view(profile) {
  return {
    id: profile.id,
    name: profile.name,
    title: profile.title,
    description: profile.description,
    whenToUse: profile.whenToUse,
    provider: profile.provider,
    model: profile.model,
    reasoningEffort: profile.reasoningEffort ?? null,
    maxTokens: profile.maxTokens ?? null,
    enabled: profile.enabled !== false,
    autoLaunch: profile.autoLaunch !== false,
    order: profile.order ?? 0,
    createdAt: profile.createdAt ?? 0,
    updatedAt: profile.updatedAt ?? 0,
  }
}

/** Sort by display order then name, so the panel and the prompt always agree. */
function sorted(agents) {
  return [...agents].sort((left, right) => (left.order ?? 0) - (right.order ?? 0) || left.name.localeCompare(right.name))
}

/** The panel's view of one model route: display name plus the limits it accepts. */
function capability(entry, info) {
  const efforts = Array.isArray(info?.reasoning?.efforts)
    ? info.reasoning.efforts.map((effort) => ({ id: String(effort.id), name: effort.name ?? String(effort.id) }))
    : []
  return {
    id: entry.id,
    name: entry.name ?? entry.id,
    ...efforts.length === 0 ? {} : { efforts },
    ...info?.reasoning?.defaultEffort === undefined ? {} : { defaultEffort: String(info.reasoning.defaultEffort) },
    ...typeof info?.defaultMaxTokens === 'number' ? { defaultMaxTokens: info.defaultMaxTokens } : {},
    ...typeof info?.context?.contextWindow === 'number' ? { contextWindow: info.context.contextWindow } : {},
  }
}

/** One JSON response that no layer may cache. */
function json(status, value) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

/** Read one request body as JSON, tolerating an empty body. */
async function readJson(request) {
  const body = await request.text()
  if (body.trim() === '') return {}
  try {
    return JSON.parse(body)
  } catch {
    throw new RosterError('请求体不是合法 JSON')
  }
}

/** One-line summary of a stored profile, shared by the prompt and the list tool. */
function summarize(entry) {
  return `- ${entry.name}「${entry.title}」(${entry.provider}/${entry.model})：${entry.whenToUse}`
}

/**
 * Carry a pre-rename roster document forward.
 *
 * An update must not lose a user's profiles, so the legacy file name is read
 * exactly once, and only when the current document is absent.
 * @param {string} storagePath - the current document path.
 * @returns {Promise<void>} resolution after the one-time copy or when none was needed.
 */
async function migrateLegacyFile(storagePath) {
  const legacy = join(dirname(storagePath), 'agent-roster.json')
  if (legacy === storagePath) return
  try {
    const body = await readFile(legacy, 'utf8')
    await writeFile(storagePath, body, { flag: 'wx' })
  } catch {
    // No legacy file, or a current file that already exists: nothing to do.
  }
}

/**
 * Host half of the Agent Settings plugin.
 * @param {import('@deepseek-ai/cordis').Context} ctx - plugin context.
 * @param {object} [config] - `{ storagePath?, autoLaunch?, maxAgents?, spawnProvider?, toolName? }`.
 */
export async function apply(ctx, config) {
  const settings = config ?? {}
  const storagePath =
    typeof settings.storagePath === 'string' && settings.storagePath.trim().length > 0 ? settings.storagePath : defaultStoragePath()
  const autoLaunch = settings.autoLaunch !== false
  const maxAgents = Number.isSafeInteger(settings.maxAgents) && settings.maxAgents > 0 ? Math.min(settings.maxAgents, 256) : 24
  const spawnProvider =
    typeof settings.spawnProvider === 'string' && settings.spawnProvider.length > 0 ? settings.spawnProvider : 'spawn'
  const delegateToolName =
    typeof settings.toolName === 'string' && settings.toolName.length > 0 ? settings.toolName : 'delegate_to_roster_agent'

  /** Serialize every read-modify-write so two saves (panel and tool) cannot interleave. */
  let queue = Promise.resolve()
  const serialized = (operation) => {
    const next = queue.then(operation, operation)
    queue = next.then(
      () => undefined,
      () => undefined,
    )
    return next
  }

  // An installation that predates the rename keeps its profiles: copy the old
  // document once, only when the new one does not exist yet.
  await migrateLegacyFile(storagePath)

  /** The advertisement mirror keeps the synchronous prompt section cheap. */
  let advertised = []
  const refreshAdvertised = async () => {
    try {
      const agents = await readRoster(storagePath)
      advertised = sorted(agents.filter((entry) => entry.enabled !== false && entry.autoLaunch !== false))
    } catch {
      advertised = []
    }
  }
  void refreshAdvertised()

  /**
   * Backfill limits that an older profile stored as `null`.
   *
   * A profile saved before this plugin read model capability has no recorded
   * output limit, and `null` reads as "ask the provider", which silently drops
   * the limit the model's own configuration declares. Rewriting each such
   * profile once at startup keeps the stored state meaningful. Failures are
   * ignored: a route that is currently unavailable must not block activation.
   */
  const backfillLimits = () =>
    serialized(async () => {
      const agents = await readRoster(storagePath)
      let changed = false
      const next = []
      for (const agent of agents) {
        if (typeof agent.maxTokens === 'number') {
          next.push(agent)
          continue
        }
        let info
        try {
          info = await ctx.llm.resolveModelInfo(agent.provider, agent.model)
        } catch {
          next.push(agent)
          continue
        }
        if (typeof info?.defaultMaxTokens !== 'number') {
          next.push(agent)
          continue
        }
        next.push({ ...agent, maxTokens: info.defaultMaxTokens, updatedAt: Date.now() })
        changed = true
      }
      if (changed) await writeRoster(storagePath, next)
      return changed
    })
  void backfillLimits().catch(() => undefined)

  /** Host-side view used by the panel routes. */
  const snapshot = async () => {
    const agents = sorted((await readRoster(storagePath)).map(view))
    const providers = []
    try {
      for (const entry of ctx.llm.listProviders()) providers.push({ id: entry.id, name: entry.name })
    } catch {
      // The panel falls back to free text when the adapter directory is unavailable.
    }
    return { agents, catalog: { providers }, settings: { autoLaunch, maxAgents, spawnProvider, storagePath } }
  }

  /**
   * Validate one route and fill the limits the model's own configuration declares.
   * A profile never stores `null` for `maxTokens`: omitting it means "use the
   * route's configured output limit", which is what the adapter reports.
   * @param {object} profile - the normalized profile.
   * @param {AbortSignal | undefined} signal - caller cancellation.
   * @returns {Promise<{ reasoningEffort: string | null, maxTokens: number | null }>} limits to store.
   */
  const assertRoute = async (profile, signal) => {
    const call = { provider: profile.provider, model: profile.model }
    if (typeof profile.reasoningEffort === 'string' && profile.reasoningEffort.length > 0) call.reasoningEffort = profile.reasoningEffort
    if (typeof profile.maxTokens === 'number') call.maxTokens = profile.maxTokens
    let resolved
    try {
      resolved = await ctx.llm.resolveCallConfig(call, signal)
    } catch (error) {
      throw new RosterError(
        `模型路由不可用：${profile.provider}/${profile.model}（${String(error?.message ?? error)}）`,
        'AGENT_ROSTER_MODEL',
      )
    }
    let info
    try {
      info = await ctx.llm.resolveModelInfo(profile.provider, profile.model, signal)
    } catch {
      info = undefined
    }
    const declaredMax = typeof info?.defaultMaxTokens === 'number' ? info.defaultMaxTokens : undefined
    return {
      // The adapter's own default effort is what an omitted effort already means;
      // storing it explicitly keeps the panel and the delegated child in agreement.
      reasoningEffort:
        typeof profile.reasoningEffort === 'string' && profile.reasoningEffort.length > 0 ? profile.reasoningEffort : null,
      maxTokens: typeof resolved?.maxTokens === 'number' ? resolved.maxTokens : (declaredMax ?? null),
    }
  }

  /**
   * Create or update one profile under the write lock.
   * @param {object} input - `{ id?, ...fields }`; a present `id` means update.
   * @param {AbortSignal | undefined} signal - caller cancellation.
   * @returns {Promise<object>} the saved profile view.
   */
  const save = (input, signal) =>
    serialized(async () => {
      const raw = typeof input === 'object' && input !== null ? input : {}
      const agents = await readRoster(storagePath)
      const id = typeof raw.id === 'string' && raw.id.length > 0 ? raw.id : null
      const existing = id === null ? null : agents.find((entry) => entry.id === id)
      if (id !== null && existing === undefined) throw new RosterError(`找不到智能体 ${id}`, 'AGENT_ROSTER_NOT_FOUND')
      if (existing === null && agents.length >= maxAgents) {
        throw new RosterError(`名单已达上限 ${maxAgents} 个智能体，请先删除不用的`)
      }

      const taken = new Set(agents.filter((entry) => entry.id !== id).map((entry) => entry.name))
      const profile = normalizeProfile(raw, { existing: existing ?? null, taken })
      const limits = await assertRoute(profile, signal)

      const now = Date.now()
      const stored = {
        id: existing?.id ?? mintId(),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        ...profile,
        ...limits,
      }
      const next = existing === null ? [...agents, stored] : agents.map((entry) => (entry.id === stored.id ? stored : entry))
      await writeRoster(storagePath, next)
      await refreshAdvertised()
      return view(stored)
    })

  /** Remove one profile under the write lock. */
  const remove = (id) =>
    serialized(async () => {
      const agents = await readRoster(storagePath)
      if (!agents.some((entry) => entry.id === id)) throw new RosterError(`找不到智能体 ${id}`, 'AGENT_ROSTER_NOT_FOUND')
      await writeRoster(
        storagePath,
        agents.filter((entry) => entry.id !== id),
      )
      await refreshAdvertised()
    })

  // --- Panel routes -------------------------------------------------------
  // Connection's `/api` fence authenticates the browser before these run; the
  // panel half uses the same relative paths so no token handling is duplicated.

  const routes = [
    {
      path: '/api/agent-settings.state',
      methods: ['GET'],
      requestBody: 'buffered',
      fetch: async () => {
        try {
          return json(200, { ok: true, state: await snapshot() })
        } catch (error) {
          return json(500, { ok: false, error: String(error?.message ?? error) })
        }
      },
    },
    {
      path: '/api/agent-settings.save',
      methods: ['POST'],
      requestBody: 'buffered',
      fetch: async (request) => {
        try {
          const body = await readJson(request)
          await save(body.agent, request.signal)
          return json(200, { ok: true, state: await snapshot() })
        } catch (error) {
          return json(200, { ok: false, error: error instanceof RosterError ? error.message : String(error?.message ?? error) })
        }
      },
    },
    {
      path: '/api/agent-settings.remove',
      methods: ['POST'],
      requestBody: 'buffered',
      fetch: async (request) => {
        try {
          const body = await readJson(request)
          if (typeof body.id !== 'string' || body.id.length === 0) throw new RosterError('缺少 id')
          await remove(body.id)
          return json(200, { ok: true, state: await snapshot() })
        } catch (error) {
          return json(200, { ok: false, error: error instanceof RosterError ? error.message : String(error?.message ?? error) })
        }
      },
    },
    {
      path: '/api/agent-settings.models',
      methods: ['GET'],
      requestBody: 'buffered',
      fetch: async (request) => {
        const provider = new URL(request.url, 'http://agent-settings.invalid').searchParams.get('provider') ?? ''
        try {
          const listed = await ctx.llm.listModels(provider)
          // The panel needs the real capability, not just the id: which efforts a
          // route accepts and the output limit its configuration already declares.
          const models = await Promise.all(
            listed.map(async (entry) => {
              try {
                const info = await ctx.llm.resolveModelInfo(provider, entry.id, request.signal)
                return capability(entry, info)
              } catch {
                return capability(entry, undefined)
              }
            }),
          )
          return json(200, { ok: true, models })
        } catch (error) {
          return json(200, { ok: false, error: String(error?.message ?? error), models: [] })
        }
      },
    },
  ]
  for (const route of routes) ctx.effect(() => ctx.connection.fetch.register(route), `agent-settings: ${route.path}`)

  // --- Model tools -------------------------------------------------------

  /** Enabled profiles the agent may delegate to. */
  const executable = async () => sorted((await readRoster(storagePath)).filter((profile) => profile.enabled !== false))

  ctx.effect(() =>
    ctx.tools.register({
      name: delegateToolName,
      description:
        '启动一个用户预置的智能体来执行任务。它的模型、角色与工作方式由用户为该智能体配置。先用 list_roster_agents 查看可用智能体，选择 whenToUse 与当前任务最匹配的一个；与任何一条都不匹配时不要使用本工具。',
      parameters: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'description', 'prompt'],
        properties: {
          name: { type: 'string', description: 'list_roster_agents 返回的智能体 name（不是 title）。' },
          description: { type: 'string', description: '3–5 个词的委派摘要，用于在对话中显示。' },
          prompt: { type: 'string', description: '交给该智能体的完整、自包含任务说明；它看不到本对话。' },
        },
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          required: ['kind', 'subagentId', 'name', 'model'],
          properties: {
            kind: { type: 'string', const: 'activation' },
            subagentId: { type: 'string' },
            name: { type: 'string' },
            model: { type: 'string' },
          },
        },
        render: (_args, value) => [
          { type: 'text', text: `started ${value.name} (${value.model}) as subagent ${value.subagentId}` },
        ],
      },
      isConcurrencySafe: () => true,
      async execute(args, exec) {
        const parent = exec.agent
        if (parent === undefined) throw new Error(`${delegateToolName} requires a calling agent`)
        const input = args ?? {}
        const agents = await executable()
        const profile = agents.find((entry) => entry.name === input.name)
        if (profile === undefined) {
          const available = agents.map((entry) => entry.name).join(', ')
          throw new RosterError(`没有启用的智能体 "${String(input.name)}"；可用：${available || '(无)'}`, 'AGENT_ROSTER_NOT_FOUND')
        }
        const agentOptions = { provider: profile.provider, model: profile.model }
        if (typeof profile.reasoningEffort === 'string' && profile.reasoningEffort.length > 0) {
          agentOptions.reasoningEffort = profile.reasoningEffort
        }
        if (typeof profile.maxTokens === 'number') agentOptions.maxTokens = profile.maxTokens
        const activation = await ctx.subagents.startActivation({
          provider: spawnProvider,
          label: input.description,
          request: {
            prompt: [
              {
                type: 'text',
                text: [`你是「${profile.title}」（${profile.name}）。`, profile.description, '', '任务：', input.prompt].join('\n'),
              },
            ],
            parent,
            agentOptions,
          },
          signal: exec.signal,
          delivery: 'parent',
        })
        return { kind: 'activation', subagentId: activation.childId, name: profile.name, model: profile.model }
      },
    }),
  )

  ctx.effect(() =>
    ctx.tools.register({
      name: 'list_roster_agents',
      description: '列出用户预置的智能体：name、标题、适用场景与所用模型。委派前先用它选人。',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          includeDisabled: { type: 'boolean', description: '同时列出已停用的智能体。默认只列启用的。' },
        },
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          required: ['agents'],
          properties: {
            agents: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['name', 'title', 'whenToUse', 'provider', 'model', 'enabled'],
                properties: {
                  name: { type: 'string' },
                  title: { type: 'string' },
                  whenToUse: { type: 'string' },
                  provider: { type: 'string' },
                  model: { type: 'string' },
                  enabled: { type: 'boolean' },
                },
              },
            },
          },
        },
        render: (_args, value) => [
          {
            type: 'text',
            text: value.agents.length === 0 ? '名单里还没有智能体。' : value.agents.map((entry) => summarize(entry)).join('\n'),
          },
        ],
      },
      isConcurrencySafe: () => true,
      async execute(args) {
        const includeDisabled = args?.includeDisabled === true
        const agents = sorted((await readRoster(storagePath)).filter((entry) => includeDisabled || entry.enabled !== false))
        return {
          agents: agents.map((entry) => ({
            name: entry.name,
            title: entry.title,
            whenToUse: entry.whenToUse,
            provider: entry.provider,
            model: entry.model,
            enabled: entry.enabled !== false,
          })),
        }
      },
    }),
  )

  ctx.effect(() =>
    ctx.tools.register({
      name: 'save_roster_agent',
      description:
        '创建或更新一个用户预置的智能体。description 说明它做什么，whenToUse 说明什么任务该用它——后者决定自动委派时是否选中它。新建时必须提供 name、title、description、whenToUse、provider、model；更新时传 id，未提供的字段保留原值。',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string', description: '更新时传已有智能体的 id；新建时省略。' },
          name: { type: 'string', description: '2–32 位小写字母、数字或连字符，以字母开头，全局唯一。' },
          title: { type: 'string', description: '面向用户的短标题，例如「代码审查员」。' },
          description: { type: 'string', description: '这个智能体做什么；会作为子智能体的角色说明注入。' },
          whenToUse: { type: 'string', description: '什么任务该用它，用于自动匹配。' },
          provider: { type: 'string', description: 'LLM provider 路由 id，例如 workbuddy。' },
          model: { type: 'string', description: '该 provider 下的 model id。' },
          reasoningEffort: { type: 'string', description: '可选推理强度；留空跟随模型默认。' },
          maxTokens: { type: 'integer', description: '可选输出上限；省略跟随模型默认。' },
          enabled: { type: 'boolean', description: '是否允许委派给它，默认 true。' },
          autoLaunch: { type: 'boolean', description: '是否把它的 whenToUse 广告给模型用于自动启动，默认 true。' },
        },
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          required: ['ok'],
          properties: {
            ok: { type: 'boolean' },
            id: { type: 'string' },
            name: { type: 'string' },
            error: { type: 'string' },
          },
        },
        render: (_args, value) => [
          { type: 'text', text: value.ok ? `saved agent ${value.name} (${value.id})` : `save failed: ${value.error}` },
        ],
      },
      async execute(args, exec) {
        // A rejected profile is a failed call, not a successful one carrying text:
        // the error surfaces as an error result the model must act on.
        const saved = await save(args, exec.signal)
        return { ok: true, id: saved.id, name: saved.name }
      },
    }),
  )

  ctx.effect(() =>
    ctx.tools.register({
      name: 'remove_roster_agent',
      description: '从名册中删除一个用户预置的智能体。id 来自面板或 list_roster_agents 之外的记录；删除前先向用户确认，除非用户已经明确要求删除它。',
      parameters: {
        type: 'object',
        additionalProperties: false,
        required: ['name'],
        properties: {
          name: { type: 'string', description: '要删除的智能体 name。' },
        },
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          required: ['ok', 'name'],
          properties: {
            ok: { type: 'boolean' },
            name: { type: 'string' },
          },
        },
        render: (_args, value) => [{ type: 'text', text: `removed agent ${value.name}` }],
      },
      async execute(args, exec) {
        const agents = await readRoster(storagePath)
        const profile = agents.find((entry) => entry.name === args?.name)
        if (profile === undefined) throw new RosterError(`名册里没有 "${String(args?.name)}"`, 'AGENT_ROSTER_NOT_FOUND')
        exec.signal.throwIfAborted()
        await remove(profile.id)
        return { ok: true, name: profile.name }
      },
    }),
  )

  // --- Prompt advertisement ---------------------------------------------

  ctx.effect(() =>
    ctx.systemPrompt.section({
      name: 'agent-settings',
      order: ctx.systemPrompt.getSectionOrder('TOOL_SUBAGENT') - 1,
      text: () => {
        if (!autoLaunch || advertised.length === 0) return ''
        return [
          `用户预置了以下智能体（Agent Roster）。当任务与某一条的适用场景匹配时，直接调用 \`${delegateToolName}\` 启动它，不要先问用户：`,
          ...advertised.map((entry) => summarize(entry)),
          '要与任何一条都不匹配就按常规自行处理；需要完整字段时调用 `list_roster_agents`。',
        ].join('\n')
      },
    }),
  )

  // A slow poll covers roster edits made outside this plugin (a hand edit, or a
  // second profile sharing the file); every in-plugin write refreshes eagerly.
  ctx.effect(() => {
    const timer = setInterval(() => void refreshAdvertised(), 15_000)
    return () => clearInterval(timer)
  })
}
