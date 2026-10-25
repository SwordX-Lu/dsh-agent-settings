window.__ModuleLoader__.load({
  id: 'dsh-agent-settings',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'agentRoster';
    const PANEL_ID = 'agent-settings';
    const STATE_ROUTE = 'api/agent-settings.state';
    const SAVE_ROUTE = 'api/agent-settings.save';
    const REMOVE_ROUTE = 'api/agent-settings.remove';
    const MODELS_ROUTE = 'api/agent-settings.models';
    const NAME_PATTERN = /^[a-z][a-z0-9-]{1,31}$/;

    /**
     * One stylesheet for the page, carried by a React <style> element so that
     * unmounting the panel removes it. Every selector is scoped under
     * `.dshAgentRoster`, and every color is a host theme alias.
     */
    const STYLES = [
      '.dshAgentRosterPage{display:flex;box-sizing:border-box;width:100%;height:100%;min-height:0;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-family:inherit;font-size:13px;line-height:20px}',
      '.dshAgentRosterList{display:flex;flex-direction:column;box-sizing:border-box;flex:0 0 340px;width:340px;min-width:0;min-height:0;border-right:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}',
      '.dshAgentRosterListHead{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;padding:16px 14px 10px}',
      '.dshAgentRosterListHeading{display:flex;flex-direction:column;gap:2px;min-width:0}',
      '.dshAgentRosterHeading{margin:0;font-size:13px;line-height:20px;font-weight:600;color:var(--dsw-alias-label-primary)}',
      '.dshAgentRosterCount{font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary)}',
      '.dshAgentRosterScroll{display:flex;flex-direction:column;gap:6px;flex:1;min-height:0;overflow:auto;padding:2px 10px 16px}',
      '.dshAgentRosterRow{display:flex;flex-direction:column;box-sizing:border-box;gap:6px;padding:8px 10px;border:1px solid transparent;border-radius:8px;background:var(--dsw-alias-bg-layer-1)}',
      '.dshAgentRosterRowActive{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-2)}',
      '.dshAgentRosterRowMain{display:flex;align-items:baseline;gap:8px;min-width:0;cursor:pointer;border-radius:4px}',
      '.dshAgentRosterRowMain:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
      '.dshAgentRosterRowTitle{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600;color:var(--dsw-alias-label-primary)}',
      '.dshAgentRosterRowName{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary)}',
      '.dshAgentRosterMeta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;min-width:0}',
      '.dshAgentRosterBadge{box-sizing:border-box;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:0 7px;border:1px solid var(--dsw-alias-border-l1);border-radius:999px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:10px;line-height:17px}',
      '.dshAgentRosterBadgeOff{color:var(--dsw-alias-state-idle-primary);border-color:var(--dsw-alias-border-l2)}',
      '.dshAgentRosterBadgeAuto{color:var(--dsw-alias-state-success-primary)}',
      '.dshAgentRosterRowActions{display:flex;align-items:center;gap:6px;flex-wrap:wrap;min-width:0}',
      '.dshAgentRosterRowButtons{display:inline-flex;align-items:center;gap:6px}',
      '.dshAgentRosterToggleGroup{display:inline-flex;flex-wrap:wrap;align-items:center;gap:14px}',
      '.dshAgentRosterToggle{display:inline-flex;align-items:center;gap:6px;cursor:pointer}',
      '.dshAgentRosterToggleLabel{font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary);white-space:nowrap}',
      '.dshAgentRosterFlagText{display:inline-flex;flex-direction:column;gap:1px;min-width:0}',
      '.dshAgentRosterSpacer{flex:1}',
      '.dshAgentRosterButton{display:inline-flex;align-items:center;justify-content:center;gap:4px;box-sizing:border-box;padding:4px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;line-height:18px;white-space:nowrap;cursor:pointer;transition:background .12s,border-color .12s,color .12s}',
      '.dshAgentRosterButton:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-border-l1)}',
      '.dshAgentRosterButton:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.dshAgentRosterButton:disabled{opacity:.55;cursor:default}',
      '.dshAgentRosterButtonPrimary{color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-1)}',
      '.dshAgentRosterButtonPrimary:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2)}',
      '.dshAgentRosterButtonDanger{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-primary)}',
      '.dshAgentRosterMini{padding:2px 7px;font-size:11px;line-height:16px}',
      '.dshAgentRosterSwitch{position:relative;display:inline-flex;flex:none;align-items:center;box-sizing:border-box;width:30px;height:18px;padding:0;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;background:var(--dsw-alias-bg-layer-2);cursor:pointer;transition:background .12s,border-color .12s}',
      '.dshAgentRosterSwitch:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.dshAgentRosterSwitch:disabled{opacity:.55;cursor:default}',
      '.dshAgentRosterSwitchOn{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}',
      '.dshAgentRosterKnob{position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:var(--dsw-alias-bg-base);transition:transform .12s}',
      '.dshAgentRosterSwitchOn .dshAgentRosterKnob{transform:translateX(12px)}',
      '.dshAgentRosterConfirm{display:inline-flex;align-items:center;gap:6px}',
      '.dshAgentRosterConfirmText{font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary)}',
      '.dshAgentRosterError{display:flex;align-items:flex-start;gap:8px;box-sizing:border-box;margin-bottom:12px;padding:7px 10px;border:1px solid var(--dsw-alias-state-error-primary);border-radius:6px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:18px}',
      '.dshAgentRosterErrorText{flex:1;min-width:0;word-break:break-word}',
      '.dshAgentRosterListError{margin:0 10px 10px}',
      '.dshAgentRosterEmpty{display:flex;flex-direction:column;align-items:flex-start;gap:8px;padding:16px 12px;border:1px dashed var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-2)}',
      '.dshAgentRosterEmptyTitle{margin:0;font-size:12px;line-height:18px;font-weight:600;color:var(--dsw-alias-label-primary)}',
      '.dshAgentRosterEmptyHint{margin:0;font-size:11px;line-height:17px;color:var(--dsw-alias-label-secondary)}',
      '.dshAgentRosterLoading{margin:0;padding:12px;color:var(--dsw-alias-label-secondary);font-size:12px}',
      '.dshAgentRosterPanel{flex:1;min-width:0;min-height:0;box-sizing:border-box;overflow:auto;padding:20px 22px 32px;background:var(--dsw-alias-bg-base)}',
      '.dshAgentRosterPanelEmpty{display:flex;flex-direction:column;align-items:flex-start;gap:10px;max-width:420px;margin:12vh auto 0}',
      '.dshAgentRosterPanelTitle{margin:0;font-size:15px;line-height:22px;font-weight:600;color:var(--dsw-alias-label-primary)}',
      '.dshAgentRosterPanelHint{margin:0;font-size:12px;line-height:19px;color:var(--dsw-alias-label-secondary)}',
      '.dshAgentRosterForm{display:block;box-sizing:border-box;max-width:860px}',
      '.dshAgentRosterFormHead{display:flex;flex-direction:column;gap:2px;margin-bottom:14px}',
      '.dshAgentRosterFormTitle{margin:0;font-size:15px;line-height:22px;font-weight:600;color:var(--dsw-alias-label-primary)}',
      '.dshAgentRosterFormSubtitle{margin:0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}',
      '.dshAgentRosterFormGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 14px}',
      '.dshAgentRosterField{display:flex;flex-direction:column;gap:4px;min-width:0}',
      '.dshAgentRosterFieldWide{grid-column:1 / -1}',
      '.dshAgentRosterLabel{font-size:12px;line-height:18px;font-weight:600;color:var(--dsw-alias-label-primary)}',
      '.dshAgentRosterHint{font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary)}',
      '.dshAgentRosterInput,.dshAgentRosterSelect,.dshAgentRosterTextarea{box-sizing:border-box;width:100%;min-height:30px;padding:5px 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;line-height:18px}',
      '.dshAgentRosterTextarea{min-height:68px;resize:vertical}',
      '.dshAgentRosterInput:focus,.dshAgentRosterSelect:focus,.dshAgentRosterTextarea:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}',
      '.dshAgentRosterInput:disabled,.dshAgentRosterSelect:disabled,.dshAgentRosterTextarea:disabled{opacity:.6}',
      '.dshAgentRosterFlags{display:flex;flex-wrap:wrap;align-items:center;gap:16px}',
      '.dshAgentRosterFlag{display:inline-flex;align-items:flex-start;gap:8px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-primary)}',
      '.dshAgentRosterFlagLabel{font-size:12px;line-height:18px;font-weight:600;color:var(--dsw-alias-label-primary)}',
      '.dshAgentRosterFooter{display:flex;align-items:center;gap:8px;margin-top:18px;padding-top:14px;border-top:1px solid var(--dsw-alias-border-l1)}',
      '@media (max-width:900px){.dshAgentRosterPage{flex-direction:column}.dshAgentRosterList{flex:0 0 auto;width:100%;max-height:44%;border-right:0;border-bottom:1px solid var(--dsw-alias-border-l1)}.dshAgentRosterFormGrid{grid-template-columns:minmax(0,1fr)}}'
    ].join('');

    /** A named set of reload listeners: `connection/reset` fans out through it. */
    function createResetBus() {
      const listeners = new Set();
      return {
        subscribe(listener) {
          listeners.add(listener);
          return () => {
            listeners.delete(listener);
          };
        },
        emit() {
          for (const listener of Array.from(listeners)) {
            try {
              listener();
            } catch (error) {
              // A subscriber must not take down the others.
            }
          }
        }
      };
    }

    /** Read one JSON route, turning transport and `ok:false` failures into Errors. */
    async function requestJson(url, options) {
      const response = await fetch(url, options);
      let payload = null;
      try {
        payload = await response.json();
      } catch (error) {
        payload = null;
      }
      if (!response.ok) {
        const message = payload !== null && typeof payload.error === 'string' ? payload.error : 'HTTP ' + response.status;
        throw new Error(message);
      }
      if (payload === null || typeof payload !== 'object') throw new Error('invalid response');
      return payload;
    }

    function errorMessage(error) {
      if (error !== null && error !== undefined && typeof error.message === 'string' && error.message !== '') return error.message;
      return '';
    }

    function isRosterState(value) {
      return value !== null && typeof value === 'object' && Array.isArray(value.agents);
    }

    function normalizeOrder(value) {
      const numeric = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(numeric)) return 0;
      return Math.min(999, Math.max(0, Math.trunc(numeric)));
    }

    /** A blank draft for the new-agent form, seeded from the host catalog and settings. */
    function defaultDraft(rosterState) {
      const catalog = rosterState !== null && rosterState !== undefined && rosterState.catalog !== null && typeof rosterState.catalog === 'object' ? rosterState.catalog : {};
      const providers = Array.isArray(catalog.providers) ? catalog.providers : [];
      const settings = rosterState !== null && rosterState !== undefined && rosterState.settings !== null && typeof rosterState.settings === 'object' ? rosterState.settings : {};
      const agents = rosterState !== null && rosterState !== undefined && Array.isArray(rosterState.agents) ? rosterState.agents : [];
      // New records land after the current tail so the host's order-then-name
      // sort keeps them where the form put them.
      const nextOrder = agents.reduce((max, agent) => Math.max(max, normalizeOrder(agent.order) + 1), 0);
      return {
        id: null,
        name: '',
        title: '',
        description: '',
        whenToUse: '',
        provider: providers.length > 0 && typeof providers[0].id === 'string' ? providers[0].id : '',
        model: '',
        reasoningEffort: '',
        maxTokens: '',
        enabled: true,
        autoLaunch: settings.autoLaunch === true,
        order: normalizeOrder(nextOrder)
      };
    }

    /** Project one stored record into the editable draft shape. */
    function toDraft(agent) {
      return {
        id: typeof agent.id === 'string' ? agent.id : null,
        name: typeof agent.name === 'string' ? agent.name : '',
        title: typeof agent.title === 'string' ? agent.title : '',
        description: typeof agent.description === 'string' ? agent.description : '',
        whenToUse: typeof agent.whenToUse === 'string' ? agent.whenToUse : '',
        provider: typeof agent.provider === 'string' ? agent.provider : '',
        model: typeof agent.model === 'string' ? agent.model : '',
        reasoningEffort: typeof agent.reasoningEffort === 'string' ? agent.reasoningEffort : '',
        maxTokens: typeof agent.maxTokens === 'number' && Number.isFinite(agent.maxTokens) ? String(agent.maxTokens) : '',
        enabled: agent.enabled !== false,
        autoLaunch: agent.autoLaunch === true,
        order: typeof agent.order === 'number' ? agent.order : 0
      };
    }

    /** Convert the draft to the contract's request body (id omitted for a new record). */
    function draftToPayload(draft) {
      const payload = {
        name: draft.name.trim(),
        title: draft.title.trim(),
        description: draft.description.trim(),
        whenToUse: draft.whenToUse.trim(),
        provider: draft.provider.trim(),
        model: draft.model.trim(),
        reasoningEffort: draft.reasoningEffort.trim(),
        maxTokens: draft.maxTokens.trim() === '' ? null : Number(draft.maxTokens),
        enabled: draft.enabled === true,
        autoLaunch: draft.autoLaunch === true,
        order: normalizeOrder(draft.order)
      };
      if (draft.id !== null) payload.id = draft.id;
      return payload;
    }

    /** The capability entry for one model id, when the catalog has it. */
    function modelCapability(list, id) {
      if (!Array.isArray(list) || typeof id !== 'string' || id === '') return null;
      const found = list.find((model) => model !== null && typeof model === 'object' && model.id === id);
      return found !== undefined && found !== null && typeof found === 'object' ? found : null;
    }

    /** The efforts one capability entry offers, always as a plain array. */
    function effortsOf(capability) {
      if (capability === null || !Array.isArray(capability.efforts)) return [];
      return capability.efforts
        .filter((effort) => effort !== null && typeof effort === 'object' && typeof effort.id === 'string' && effort.id !== '')
        .map((effort) => ({ id: effort.id, name: typeof effort.name === 'string' && effort.name !== '' ? effort.name : effort.id }));
    }

    /** The output limit one route declares, when it declares one. */
    function defaultMaxOf(capability) {
      return capability !== null && typeof capability.defaultMaxTokens === 'number' && Number.isFinite(capability.defaultMaxTokens)
        ? capability.defaultMaxTokens
        : null;
    }

    /** Client-side hints only; the host remains the authority on every field. */
    function validateDraft(draft) {
      if (!NAME_PATTERN.test(draft.name.trim())) return 'validate.name';
      const title = draft.title.trim();
      if (title === '' || title.length > 48) return 'validate.title';
      const description = draft.description.trim();
      if (description === '' || description.length > 600) return 'validate.description';
      const whenToUse = draft.whenToUse.trim();
      if (whenToUse === '' || whenToUse.length > 600) return 'validate.whenToUse';
      if (draft.provider.trim() === '' || draft.model.trim() === '') return 'validate.route';
      const tokens = draft.maxTokens.trim();
      if (tokens !== '') {
        const numeric = Number(tokens);
        if (!Number.isInteger(numeric) || numeric < 1 || numeric > 1000000) return 'validate.maxTokens';
      }
      return null;
    }

    /** Rebuild the form from the authoritative state after a successful write. */
    function nextDraftAfterSave(nextState, previous, payload) {
      const list = isRosterState(nextState) ? nextState.agents : [];
      let target = null;
      if (previous.id !== null) {
        target = list.find((item) => item.id === previous.id) || null;
      } else {
        target = list.find((item) => item.name === payload.name) || null;
      }
      if (target !== null) return toDraft(target);
      return previous;
    }

    function describeFormError(error, t) {
      if (error === null || error === undefined) return '';
      if (typeof error.key === 'string') return t(error.key);
      const message = typeof error.message === 'string' && error.message !== '' ? error.message : t('error.unknown');
      return t('form.saveFailed', { error: message });
    }

    function describeListError(error, t) {
      if (error === null || error === undefined) return '';
      const message = typeof error.message === 'string' && error.message !== '' ? error.message : t('error.unknown');
      return t('list.actionFailed', { error: message });
    }

    /**
     * Sidebar glyph: a person joined by a roster's list lines. It is decorative;
     * the shell owns the row button, its label, and the navigation. `active` only
     * nudges the stroke so the selected row reads a little heavier.
     */
    function RosterIcon(props) {
      const size = typeof props.size === 'number' && Number.isFinite(props.size) ? props.size : 18;
      const active = props.active === true;
      // Two rails with a solid knob each: the sidebar's own outline language,
      // readable at 16px where a filled tile would turn into a blob.
      const strokeWidth = active === true ? 2 : 1.8;
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth,
        strokeLinecap: 'round',
        'aria-hidden': 'true',
        focusable: 'false',
        style: { display: 'block' }
      },
      h('path', { key: 'rail-top', d: 'M4 7.5h16' }),
      h('path', { key: 'rail-bottom', d: 'M4 16.5h16' }),
      h('circle', { key: 'knob-top', cx: 15.5, cy: 7.5, r: 2.6, fill: 'currentColor', stroke: 'none' }),
      h('circle', { key: 'knob-bottom', cx: 9, cy: 16.5, r: 2.6, fill: 'currentColor', stroke: 'none' }));
    }

    /** The main panel: roster list on the left, shared new/edit form on the right. */
    function RosterPage(props) {
      const t = typeof props.t === 'function' ? props.t : (key) => key;
      const bus = props.bus;

      const [state, setState] = React.useState(null);
      const [status, setStatus] = React.useState('loading');
      const [loadError, setLoadError] = React.useState('');
      const [reloadKey, setReloadKey] = React.useState(0);
      const [draft, setDraft] = React.useState(null);
      const [formError, setFormError] = React.useState(null);
      const [listError, setListError] = React.useState(null);
      const [confirmId, setConfirmId] = React.useState(null);
      const [saving, setSaving] = React.useState(false);
      const [removingId, setRemovingId] = React.useState(null);
      const [togglingId, setTogglingId] = React.useState(null);
      // Each entry carries the route's real capability: the efforts it accepts and
      // the output limit its own configuration declares.
      const [models, setModels] = React.useState({ provider: null, status: 'idle', list: [] });

      const mutationRef = React.useRef(null);
      const initializedRef = React.useRef(false);

      // The contract's order field is authoritative for list order; ties keep
      // the host's own sequence so saves never reshuffle rows unexpectedly.
      const agents = isRosterState(state)
        ? state.agents
          .map((agent, index) => ({ agent, index }))
          .sort((left, right) => normalizeOrder(left.agent.order) - normalizeOrder(right.agent.order) || left.index - right.index)
          .map((entry) => entry.agent)
        : [];
      const providers = state !== null && state.catalog !== null && typeof state.catalog === 'object' && Array.isArray(state.catalog.providers) ? state.catalog.providers : [];
      const busy = saving || removingId !== null || togglingId !== null;
      const draftProvider = draft === null ? null : draft.provider;

      React.useEffect(() => {
        if (bus === null || bus === undefined || typeof bus.subscribe !== 'function') return undefined;
        return bus.subscribe(() => {
          setReloadKey((value) => value + 1);
        });
      }, [bus]);

      React.useEffect(() => {
        const controller = new AbortController();
        let cancelled = false;
        setStatus('loading');
        setLoadError('');
        (async () => {
          try {
            const payload = await requestJson(STATE_ROUTE, { signal: controller.signal });
            if (cancelled) return;
            if (payload.ok !== true) throw new Error(typeof payload.error === 'string' ? payload.error : '');
            const nextState = isRosterState(payload.state) ? payload.state : { agents: [], catalog: { providers: [] }, settings: {} };
            setState(nextState);
            setStatus('ready');
            if (!initializedRef.current) {
              initializedRef.current = true;
              if (nextState.agents.length > 0) setDraft(toDraft(nextState.agents[0]));
            }
          } catch (error) {
            if (cancelled || controller.signal.aborted) return;
            setStatus('error');
            setLoadError(errorMessage(error));
          }
        })();
        return () => {
          cancelled = true;
          controller.abort();
        };
      }, [reloadKey]);

      React.useEffect(() => {
        if (draftProvider === null || draftProvider === '') {
          setModels({ provider: draftProvider, status: 'idle', list: [] });
          return undefined;
        }
        const controller = new AbortController();
        let cancelled = false;
        setModels({ provider: draftProvider, status: 'loading', list: [] });
        (async () => {
          try {
            const url = MODELS_ROUTE + '?provider=' + encodeURIComponent(draftProvider);
            const payload = await requestJson(url, { signal: controller.signal });
            if (cancelled) return;
            if (payload.ok !== true) throw new Error(typeof payload.error === 'string' ? payload.error : '');
            const list = Array.isArray(payload.models) ? payload.models : [];
            setModels({ provider: draftProvider, status: 'ready', list });
          } catch (error) {
            if (cancelled || controller.signal.aborted) return;
            // Models are a convenience list only; manual entry must stay possible.
            setModels({ provider: draftProvider, status: 'error', list: [] });
          }
        })();
        return () => {
          cancelled = true;
          controller.abort();
        };
      }, [draftProvider]);

      React.useEffect(() => () => {
        const current = mutationRef.current;
        mutationRef.current = null;
        if (current !== null && typeof current.abort === 'function') current.abort();
      }, []);

      const reload = () => {
        setReloadKey((value) => value + 1);
      };

      const startNew = () => {
        setFormError(null);
        setListError(null);
        setConfirmId(null);
        setDraft(defaultDraft(state));
      };

      const startEdit = (agent) => {
        setFormError(null);
        setConfirmId(null);
        setDraft(toDraft(agent));
      };

      const cancelEdit = () => {
        setFormError(null);
        setDraft(null);
      };

      const updateField = (field, value) => {
        setDraft((current) => (current === null ? current : { ...current, [field]: value }));
      };

      const submit = (event) => {
        if (event !== null && event !== undefined && typeof event.preventDefault === 'function') event.preventDefault();
        if (draft === null || saving) return;
        const invalidKey = validateDraft(draft);
        if (invalidKey !== null) {
          setFormError({ key: invalidKey });
          return;
        }
        const controller = new AbortController();
        mutationRef.current = controller;
        const payload = draftToPayload(draft);
        const previous = draft;
        setSaving(true);
        setFormError(null);
        setListError(null);
        (async () => {
          try {
            const result = await requestJson(SAVE_ROUTE, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ agent: payload }),
              signal: controller.signal
            });
            if (result.ok !== true) throw new Error(typeof result.error === 'string' ? result.error : '');
            if (controller.signal.aborted) return;
            if (isRosterState(result.state)) setState(result.state);
            setDraft(nextDraftAfterSave(result.state, previous, payload));
            setConfirmId(null);
          } catch (error) {
            if (controller.signal.aborted) return;
            setFormError({ message: errorMessage(error) });
          } finally {
            if (mutationRef.current === controller) mutationRef.current = null;
            if (!controller.signal.aborted) setSaving(false);
          }
        })();
      };

      const toggleFlag = (agent, field) => {
        if (busy) return;
        const value = agent[field] !== true;
        const controller = new AbortController();
        mutationRef.current = controller;
        setTogglingId(agent.id);
        setFormError(null);
        setListError(null);
        (async () => {
          try {
            // Send the whole editable record so the host's validator sees every
            // required field, with only the toggled flag changed.
            const body = {
              id: agent.id,
              name: agent.name,
              title: agent.title,
              description: agent.description,
              whenToUse: agent.whenToUse,
              provider: agent.provider,
              model: agent.model,
              reasoningEffort: typeof agent.reasoningEffort === 'string' ? agent.reasoningEffort : '',
              maxTokens: typeof agent.maxTokens === 'number' ? agent.maxTokens : null,
              enabled: field === 'enabled' ? value : agent.enabled === true,
              autoLaunch: field === 'autoLaunch' ? value : agent.autoLaunch === true,
              order: typeof agent.order === 'number' ? agent.order : 0
            };
            const result = await requestJson(SAVE_ROUTE, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ agent: body }),
              signal: controller.signal
            });
            if (result.ok !== true) throw new Error(typeof result.error === 'string' ? result.error : '');
            if (controller.signal.aborted) return;
            if (isRosterState(result.state)) setState(result.state);
            setDraft((current) => (current !== null && current.id === agent.id ? { ...current, [field]: value } : current));
          } catch (error) {
            if (controller.signal.aborted) return;
            setListError({ message: errorMessage(error) });
          } finally {
            if (mutationRef.current === controller) mutationRef.current = null;
            if (!controller.signal.aborted) setTogglingId(null);
          }
        })();
      };

      const removeAgent = (id) => {
        if (busy) return;
        const controller = new AbortController();
        mutationRef.current = controller;
        setRemovingId(id);
        setFormError(null);
        setListError(null);
        (async () => {
          try {
            const result = await requestJson(REMOVE_ROUTE, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ id }),
              signal: controller.signal
            });
            if (result.ok !== true) throw new Error(typeof result.error === 'string' ? result.error : '');
            if (controller.signal.aborted) return;
            if (isRosterState(result.state)) setState(result.state);
            setConfirmId(null);
            setDraft((current) => (current !== null && current.id === id ? null : current));
          } catch (error) {
            if (controller.signal.aborted) return;
            setListError({ message: errorMessage(error) });
          } finally {
            if (mutationRef.current === controller) mutationRef.current = null;
            if (!controller.signal.aborted) setRemovingId(null);
          }
        })();
      };

      const renderSwitch = (label, checked, onChange, disabled) => h('button', {
        key: label,
        type: 'button',
        role: 'switch',
        'aria-checked': checked === true,
        'aria-label': label,
        title: label,
        className: 'dshAgentRosterSwitch' + (checked === true ? ' dshAgentRosterSwitchOn' : ''),
        disabled: disabled === true,
        onClick: onChange
      }, h('span', { className: 'dshAgentRosterKnob', 'aria-hidden': 'true' }));

      const renderListError = () => {
        if (listError === null) return null;
        return h('div', { key: 'list-error', className: 'dshAgentRosterError dshAgentRosterListError', role: 'alert' },
          h('span', { className: 'dshAgentRosterErrorText' }, describeListError(listError, t)));
      };

      const renderLoadBanner = () => {
        if (loadError === '') return null;
        return h('div', { key: 'load-error', className: 'dshAgentRosterError dshAgentRosterListError', role: 'alert' },
          h('span', { className: 'dshAgentRosterErrorText' }, t('list.loadFailed', { error: loadError })),
          h('button', { type: 'button', className: 'dshAgentRosterButton dshAgentRosterMini', onClick: reload }, t('list.retry')));
      };

      const renderRow = (agent) => {
        const editing = draft !== null && draft.id === agent.id;
        const rowClass = 'dshAgentRosterRow' + (editing ? ' dshAgentRosterRowActive' : '');
        const route = (typeof agent.provider === 'string' ? agent.provider : '?') + ' / ' + (typeof agent.model === 'string' ? agent.model : '?');
        const enabledBadge = h('span', {
          key: 'enabled',
          className: 'dshAgentRosterBadge' + (agent.enabled === true ? '' : ' dshAgentRosterBadgeOff')
        }, agent.enabled === true ? t('status.enabled') : t('status.disabled'));
        const autoBadge = agent.autoLaunch === true
          ? h('span', { key: 'auto', className: 'dshAgentRosterBadge dshAgentRosterBadgeAuto' }, t('status.autoLaunch'))
          : null;
        const toggles = h('span', { key: 'toggles', className: 'dshAgentRosterToggleGroup' },
          h('span', {
            key: 'enabled',
            className: 'dshAgentRosterToggle',
            title: t('switch.enabledHint')
          },
          renderSwitch(t('switch.enabled'), agent.enabled === true, () => toggleFlag(agent, 'enabled'), busy),
          h('span', { className: 'dshAgentRosterToggleLabel' }, t('switch.enabled'))),
          h('span', {
            key: 'autoLaunch',
            className: 'dshAgentRosterToggle',
            title: t('switch.autoLaunchHint')
          },
          renderSwitch(t('switch.autoLaunch'), agent.autoLaunch === true, () => toggleFlag(agent, 'autoLaunch'), busy),
          h('span', { className: 'dshAgentRosterToggleLabel' }, t('switch.autoLaunch'))));
        const actions = confirmId === agent.id
          ? h('span', { key: 'confirm', className: 'dshAgentRosterConfirm' },
            h('span', { className: 'dshAgentRosterConfirmText' }, t('delete.prompt')),
            h('button', {
              type: 'button',
              className: 'dshAgentRosterButton dshAgentRosterMini dshAgentRosterButtonDanger',
              disabled: removingId !== null,
              onClick: () => removeAgent(agent.id)
            }, removingId === agent.id ? t('action.removing') : t('action.deleteConfirm')),
            h('button', {
              type: 'button',
              className: 'dshAgentRosterButton dshAgentRosterMini',
              onClick: () => setConfirmId(null)
            }, t('action.cancel')))
          : h('span', { key: 'buttons', className: 'dshAgentRosterRowButtons' },
            h('button', {
              type: 'button',
              className: 'dshAgentRosterButton dshAgentRosterMini',
              'aria-label': t('list.editNamed', { name: agent.name }),
              onClick: () => startEdit(agent)
            }, t('action.edit')),
            h('button', {
              type: 'button',
              className: 'dshAgentRosterButton dshAgentRosterMini dshAgentRosterButtonDanger',
              'aria-label': t('list.deleteNamed', { name: agent.name }),
              disabled: busy,
              onClick: () => setConfirmId(agent.id)
            }, t('action.delete')));
        const openRow = () => {
          startEdit(agent);
        };
        return h('div', { key: agent.id, className: rowClass },
          h('div', {
            className: 'dshAgentRosterRowMain',
            role: 'button',
            tabIndex: 0,
            title: agent.name,
            onClick: openRow,
            onKeyDown: (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openRow();
              }
            }
          },
          h('span', { className: 'dshAgentRosterRowTitle' }, agent.title !== '' ? agent.title : agent.name),
          h('span', { className: 'dshAgentRosterRowName' }, agent.name)),
          h('div', { className: 'dshAgentRosterMeta' },
            h('span', { key: 'route', className: 'dshAgentRosterBadge' }, route),
            enabledBadge,
            autoBadge),
          h('div', { className: 'dshAgentRosterRowActions' }, toggles, h('span', { className: 'dshAgentRosterSpacer' }), actions));
      };

      const renderListBody = () => {
        if (state === null) {
          if (status === 'error') {
            return h('div', { key: 'load', className: 'dshAgentRosterEmpty' },
              h('p', { className: 'dshAgentRosterEmptyTitle' }, t('list.loadFailed', { error: loadError !== '' ? loadError : t('error.unknown') })),
              h('button', { type: 'button', className: 'dshAgentRosterButton', onClick: reload }, t('list.retry')));
          }
          return h('p', { key: 'loading', className: 'dshAgentRosterLoading' }, t('list.loading'));
        }
        if (agents.length === 0) {
          return h('div', { key: 'empty', className: 'dshAgentRosterEmpty' },
            h('p', { className: 'dshAgentRosterEmptyTitle' }, t('list.empty')),
            h('p', { className: 'dshAgentRosterEmptyHint' }, t('list.emptyHint')),
            h('button', { type: 'button', className: 'dshAgentRosterButton dshAgentRosterButtonPrimary', onClick: startNew }, t('list.emptyAction')));
        }
        return agents.map(renderRow);
      };

      const renderList = () => h('aside', { className: 'dshAgentRosterList' },
        h('div', { className: 'dshAgentRosterListHead' },
          h('div', { className: 'dshAgentRosterListHeading' },
            h('h2', { className: 'dshAgentRosterHeading' }, t('list.title')),
            h('span', { className: 'dshAgentRosterCount' }, t('list.count', { count: String(agents.length) }))),
          h('button', {
            type: 'button',
            className: 'dshAgentRosterButton dshAgentRosterButtonPrimary',
            disabled: busy,
            onClick: startNew
          }, t('list.new'))),
        renderLoadBanner(),
        renderListError(),
        h('div', { className: 'dshAgentRosterScroll' }, renderListBody()));

      const renderPanelEmpty = () => h('div', { className: 'dshAgentRosterPanelEmpty' },
        h('p', { className: 'dshAgentRosterPanelTitle' }, t('detail.title')),
        h('p', { className: 'dshAgentRosterPanelHint' }, t('detail.hint')),
        h('button', { type: 'button', className: 'dshAgentRosterButton dshAgentRosterButtonPrimary', onClick: startNew }, t('list.new')));

      const renderForm = () => {
        const isNew = draft === null || draft.id === null;
        const providerOptions = providers.map((provider) => h('option', { key: provider.id, value: provider.id }, provider.name !== undefined && provider.name !== '' ? provider.name : provider.id));
        if (draft.provider !== '' && !providers.some((provider) => provider.id === draft.provider)) {
          providerOptions.unshift(h('option', { key: 'draft-provider', value: draft.provider }, draft.provider));
        }
        // Model selection is a closed list: a stored route outside the current
        // catalog stays selectable so an existing profile never becomes uneditable.
        const modelChoices = (() => {
          const listed = models.list
            .map((model) => {
              const id = typeof model.id === 'string' ? model.id : '';
              const name = typeof model.name === 'string' && model.name !== '' ? model.name : id;
              return { id, name };
            })
            .filter((choice) => choice.id !== '');
          if (draft.model !== '' && !listed.some((choice) => choice.id === draft.model)) {
            listed.unshift({ id: draft.model, name: draft.model });
          }
          return listed;
        })();
        const providerMissing = draft.provider === '' || draft.provider === null;
        const selectedCapability = modelCapability(models.list, draft.model);
        const effortChoices = effortsOf(selectedCapability);
        const declaredMax = defaultMaxOf(selectedCapability);
        // An empty effort means "follow the route's own default"; offering that
        // explicitly keeps a stored non-default effort distinguishable from it.
        const effortOptions = [
          h('option', { key: 'effort-default', value: '' },
            selectedCapability !== null && typeof selectedCapability.defaultEffort === 'string'
              ? t('form.effortDefaultNamed', { name: selectedCapability.defaultEffort })
              : t('form.effortDefault')),
          // A stored value the route no longer advertises stays visible so the
          // field never silently reads as the default when it is not.
          ...draft.reasoningEffort !== '' && !effortChoices.some((effort) => effort.id === draft.reasoningEffort)
            ? [h('option', { key: 'effort-stored', value: draft.reasoningEffort }, draft.reasoningEffort)]
            : [],
          ...effortChoices.map((effort) => h('option', { key: effort.id, value: effort.id }, effort.name))
        ];
        const effortHint = effortChoices.length === 0
          ? t('form.effortUnavailable')
          : t('form.effortHint');
        const modelHint = models.status === 'loading'
          ? t('form.modelLoading')
          : models.status === 'error'
            ? t('form.modelFailed')
            : providerMissing
              ? t('form.providerMissing')
              : t('form.modelHint');
        const providerHint = providers.length === 0 ? t('form.providerEmpty') : t('form.providerHint');
        const heading = isNew ? t('form.newTitle') : t('form.editTitle', { name: draft.name !== '' ? draft.name : t('form.untitled') });
        const subtitle = isNew ? t('form.newHint') : t('form.editHint');

        const field = (key, labelText, control, hintText, wide) => h('label', {
          key,
          className: 'dshAgentRosterField' + (wide === true ? ' dshAgentRosterFieldWide' : '')
        },
        h('span', { className: 'dshAgentRosterLabel' }, labelText),
        control,
        hintText !== null && hintText !== '' ? h('span', { className: 'dshAgentRosterHint' }, hintText) : null);

        const flag = (key, labelKey, hintKey, value, onChange) => h('span', {
          key,
          className: 'dshAgentRosterFlag',
          title: t(hintKey)
        },
        renderSwitch(t(labelKey), value, () => onChange(value !== true), saving),
        h('span', { className: 'dshAgentRosterFlagText' },
          h('span', { className: 'dshAgentRosterFlagLabel' }, t(labelKey)),
          h('span', { className: 'dshAgentRosterHint' }, t(hintKey))));

        const formErrorBox = formError === null ? null : h('div', { key: 'form-error', className: 'dshAgentRosterError', role: 'alert' },
          h('span', { className: 'dshAgentRosterErrorText' }, describeFormError(formError, t)));

        return h('form', {
          key: 'form',
          className: 'dshAgentRosterForm',
          noValidate: true,
          onSubmit: submit
        },
        h('div', { className: 'dshAgentRosterFormHead' },
          h('h2', { className: 'dshAgentRosterFormTitle' }, heading),
          h('p', { className: 'dshAgentRosterFormSubtitle' }, subtitle)),
        formErrorBox,
        h('div', { className: 'dshAgentRosterFormGrid' },
          field('name', t('form.name'), h('input', {
            className: 'dshAgentRosterInput',
            value: draft.name,
            placeholder: t('form.placeholder.name'),
            autoComplete: 'off',
            spellCheck: false,
            disabled: saving,
            onChange: (event) => updateField('name', event.target.value)
          }), t('form.nameHint'), false),
          field('title', t('form.title'), h('input', {
            className: 'dshAgentRosterInput',
            value: draft.title,
            placeholder: t('form.placeholder.title'),
            autoComplete: 'off',
            disabled: saving,
            onChange: (event) => updateField('title', event.target.value)
          }), t('form.titleHint'), false),
          field('provider', t('form.provider'), h('select', {
            className: 'dshAgentRosterSelect',
            value: draft.provider,
            disabled: saving || providers.length === 0,
            onChange: (event) => {
              // A model id, its efforts, and its output limit all belong to one
              // provider, so switching providers invalidates every one of them.
              const nextProvider = event.target.value;
              setDraft((current) => (current === null ? current : { ...current, provider: nextProvider, model: '', reasoningEffort: '', maxTokens: '' }));
            }
          }, providerOptions), providerHint, false),
          field('model', t('form.model'), h('select', {
            className: 'dshAgentRosterSelect',
            value: draft.model,
            disabled: saving || modelChoices.length === 0,
            onChange: (event) => {
              const nextModel = event.target.value;
              const nextCapability = modelCapability(models.list, nextModel);
              const nextEfforts = effortsOf(nextCapability);
              // A different route has its own accepted efforts and output limit, so
              // the previous effort only survives when the new route also offers it.
              setDraft((current) => current === null ? current : {
                ...current,
                model: nextModel,
                reasoningEffort: nextEfforts.some((effort) => effort.id === current.reasoningEffort) ? current.reasoningEffort : '',
                maxTokens: defaultMaxOf(nextCapability) === null ? current.maxTokens : String(defaultMaxOf(nextCapability))
              });
            }
          }, modelChoices.length === 0
            ? [h('option', { key: 'no-model', value: '' }, models.status === 'loading' ? t('form.modelLoading') : t('form.modelFailed'))]
            : [
              draft.model === ''
                ? h('option', { key: 'pick-model', value: '' }, t('form.modelPick'))
                : null,
              ...modelChoices.map((choice) => h('option', { key: choice.id, value: choice.id }, choice.name))
            ]), modelHint, false),
          field('description', t('form.description'), h('textarea', {
            className: 'dshAgentRosterTextarea',
            value: draft.description,
            placeholder: t('form.placeholder.description'),
            disabled: saving,
            onChange: (event) => updateField('description', event.target.value)
          }), t('form.descriptionHint'), true),
          field('whenToUse', t('form.whenToUse'), h('textarea', {
            className: 'dshAgentRosterTextarea',
            value: draft.whenToUse,
            placeholder: t('form.placeholder.whenToUse'),
            disabled: saving,
            onChange: (event) => updateField('whenToUse', event.target.value)
          }), t('form.whenToUseHint'), true),
          field('reasoningEffort', t('form.reasoningEffort'), h('select', {
            className: 'dshAgentRosterSelect',
            value: draft.reasoningEffort,
            disabled: saving || effortChoices.length === 0,
            onChange: (event) => updateField('reasoningEffort', event.target.value)
          }, effortOptions), effortHint, false),
          field('maxTokens', t('form.maxTokens'), h('input', {
            className: 'dshAgentRosterInput',
            type: 'number',
            min: 1,
            max: 1000000,
            step: 1,
            value: draft.maxTokens,
            placeholder: declaredMax === null ? t('form.placeholder.maxTokens') : String(declaredMax),
            autoComplete: 'off',
            disabled: saving,
            onChange: (event) => updateField('maxTokens', event.target.value)
          }), declaredMax === null ? t('form.maxTokensHint') : t('form.maxTokensHintDefault', { value: String(declaredMax) }), false),
          h('div', { key: 'flags', className: 'dshAgentRosterField dshAgentRosterFieldWide' },
            h('span', { className: 'dshAgentRosterLabel' }, t('form.flags')),
            h('div', { className: 'dshAgentRosterFlags' },
              flag('enabled', 'form.enabled', 'form.enabledHint', draft.enabled, (value) => updateField('enabled', value)),
              flag('autoLaunch', 'form.autoLaunch', 'form.autoLaunchHint', draft.autoLaunch, (value) => updateField('autoLaunch', value))))),
        h('div', { className: 'dshAgentRosterFooter' },
          h('button', {
            type: 'submit',
            className: 'dshAgentRosterButton dshAgentRosterButtonPrimary',
            disabled: saving
          }, saving ? t('action.saving') : t('action.save')),
          h('button', {
            type: 'button',
            className: 'dshAgentRosterButton',
            disabled: saving,
            onClick: cancelEdit
          }, t('action.cancel'))));
      };

      const renderPanel = () => h('section', { className: 'dshAgentRosterPanel' },
        draft === null ? renderPanelEmpty() : renderForm());

      return h('div', { className: 'dshAgentRoster dshAgentRosterPage' },
        h('style', { key: 'agent-settings-styles' }, STYLES),
        renderList(),
        renderPanel());
    }

    /**
     * Register the roster page and its sidebar entry. Panel navigation stays with
     * the shell: the sidebar row and the `main` key share one id, and the shell
     * selects the panel when the row is clicked.
     */
    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'agent-settings: dictionaries');
      const t = ctx.locale.bind(NS);
      const bus = createResetBus();
      ctx.effect(() => ctx.on('connection/reset', () => {
        bus.emit();
      }), 'agent-settings: connection reset');
      ctx.slots.inject('main', () => ctx.slots.register({
        name: 'main',
        key: PANEL_ID,
        locale: NS,
        inject: () => ({ bus })
      }, RosterPage));
      ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
        name: 'sidebar.panellist',
        id: PANEL_ID,
        order: 20,
        locale: NS,
        label: () => t('panel')
      }, RosterIcon));
    }

    const zh = {
      panel: '智能体设置',
      'page.title': '智能体设置',
      'page.subtitle': '定义可复用的子智能体，配置职责、适用场景与所用模型；任务中由模型按场景自行指派。',
      'list.title': '智能体',
      'list.count': '共 {count} 个智能体',
      'list.loading': '正在加载智能体…',
      'list.loadFailed': '加载智能体失败：{error}',
      'list.retry': '重试',
      'list.empty': '还没有智能体',
      'list.emptyHint': '在右侧新建第一个智能体，填写它的职责与适用场景。',
      'list.emptyAction': '新建智能体',
      'list.new': '新建',
      'list.editNamed': '编辑 {name}',
      'list.deleteNamed': '删除 {name}',
      'list.actionFailed': '操作失败：{error}',
      'status.enabled': '已启用',
      'status.disabled': '已停用',
      'status.autoLaunch': '自动启动',
      'switch.enabled': '启用',
      'switch.enabledHint': '启用后才允许委派给它；停用后它不会出现在可用名单里。',
      'switch.autoLaunch': '自动启动',
      'switch.autoLaunchHint': '开启后把这个 Agent 的适用场景写进系统提示，模型遇到匹配任务会自己启动它。',
      'action.edit': '编辑',
      'action.delete': '删除',
      'action.deleteConfirm': '确认删除',
      'action.removing': '删除中…',
      'action.cancel': '取消',
      'action.save': '保存',
      'action.saving': '保存中…',
      'delete.prompt': '删除该档案？',
      'detail.title': '智能体详情',
      'detail.hint': '从左侧选择一个档案进行编辑，或新建一个。',
      'form.newTitle': '新建智能体',
      'form.editTitle': '编辑 {name}',
      'form.untitled': '未命名',
      'form.newHint': '保存后该智能体加入列表，可随时停用或继续编辑。',
      'form.editHint': '保存后立即生效；列表顺序即显示顺序。',
      'form.name': '名称（name）',
      'form.nameHint': '小写字母开头，仅含小写字母、数字和连字符，2–32 个字符，全局唯一。',
      'form.title': '标题（title）',
      'form.titleHint': '1–48 个字符，显示在智能体列表里。',
      'form.description': '描述（description）',
      'form.descriptionHint': '1–600 个字符，说明该 Agent 做什么。',
      'form.whenToUse': '使用时机（whenToUse）',
      'form.whenToUseHint': '1–600 个字符，说明何时应指派该 Agent。',
      'form.provider': '提供方（provider）',
      'form.providerHint': '来自宿主 catalog 的可用提供方。',
      'form.providerEmpty': '宿主未返回可用提供方，请先在设置中配置模型提供方。',
      'form.model': '模型（model）',
      'form.modelPick': '请选择模型',
      'form.modelHint': '只能从该提供方已注册的模型中选择。',
      'form.modelLoading': '正在获取模型列表…',
      'form.modelFailed': '没有可用模型，请先在「设置 → 模型」里为该提供方添加模型。',
      'form.providerMissing': '请先选择提供方。',
      'form.reasoningEffort': '推理强度（reasoningEffort）',
      'form.reasoningEffortHint': '只列出该模型支持的档位；选「默认」由模型自己决定。',
      'form.effortHint': '只列出该模型支持的档位；选「默认」由模型自己决定。',
      'form.effortDefault': '跟随模型默认',
      'form.effortDefaultNamed': '跟随模型默认（{name}）',
      'form.effortUnavailable': '该模型不支持推理强度，只能使用默认。',
      'form.maxTokens': '最大 token（maxTokens）',
      'form.maxTokensHint': '范围 1–1000000 的整数；留空则使用该模型配置的输出上限。',
      'form.maxTokensHintDefault': '该模型配置的输出上限是 {value}；留空即使用它。',
      'form.enabled': '允许委派',
      'form.enabledHint': '关闭后保留配置，但不会再有子 Agent 以它启动。',
      'form.autoLaunch': '自动启动',
      'form.autoLaunchHint': '关闭后仍需明确点名才会用到它；开启则由模型按适用场景自行选择。',
      'form.autoLaunchHint': '开启后宿主可按需自动拉起该 Agent。',
      'form.flags': '状态',
      'form.placeholder.name': 'code-reviewer',
      'form.placeholder.title': '代码审查员',
      'form.placeholder.description': '只读审查 diff 的正确性与安全性，给出阻断性问题清单。',
      'form.placeholder.whenToUse': '任务涉及代码审查、diff 检查、安全审计或回归风险判断时使用。',
      'form.placeholder.model': 'deepseek-v4.1-flash',
      'form.placeholder.reasoningEffort': 'low / medium / high',
      'form.placeholder.maxTokens': '留空 = 默认',
      'form.saveFailed': '保存失败：{error}',
      'validate.name': '名称需以小写字母开头，仅含小写字母、数字和连字符，长度 2–32 个字符。',
      'validate.title': '标题需为 1–48 个字符。',
      'validate.description': '描述需为 1–600 个字符。',
      'validate.whenToUse': '使用时机需为 1–600 个字符。',
      'validate.route': '提供方和模型都必须填写。',
      'validate.maxTokens': '最大 token 需留空或为 1–1000000 的整数。',
      'error.unknown': '未知错误，请稍后重试。'
    };

    const en = {
      panel: 'Agent Settings',
      'page.title': 'Agent Settings',
      'page.subtitle': 'Define reusable sub-agents with their responsibility, when to use them, and the model they run on; the model assigns them from these descriptions.',
      'list.title': 'Agents',
      'list.count': '{count} agents',
      'list.loading': 'Loading agents…',
      'list.loadFailed': 'Could not load agents: {error}',
      'list.retry': 'Retry',
      'list.empty': 'No agents yet',
      'list.emptyHint': 'Create the first agent on the right, with its responsibility and when to use it.',
      'list.emptyAction': 'New agent',
      'list.new': 'New',
      'list.editNamed': 'Edit {name}',
      'list.deleteNamed': 'Delete {name}',
      'list.actionFailed': 'Action failed: {error}',
      'status.enabled': 'Enabled',
      'status.disabled': 'Disabled',
      'status.autoLaunch': 'Auto-launch',
      'switch.enabled': 'Enabled',
      'switch.enabledHint': 'Delegation is allowed only while enabled; disabled profiles disappear from the available list.',
      'switch.autoLaunch': 'Auto-launch',
      'switch.autoLaunchHint': 'Advertises this profile\'s use cases in the system prompt so the model starts it on a matching task.',
      'action.edit': 'Edit',
      'action.delete': 'Delete',
      'action.deleteConfirm': 'Confirm delete',
      'action.removing': 'Deleting…',
      'action.cancel': 'Cancel',
      'action.save': 'Save',
      'action.saving': 'Saving…',
      'delete.prompt': 'Delete this profile?',
      'detail.title': 'Agent details',
      'detail.hint': 'Select a profile on the left to edit it, or create a new one.',
      'form.newTitle': 'New Agent',
      'form.editTitle': 'Edit {name}',
      'form.untitled': 'Untitled',
      'form.newHint': 'Saving adds the profile to the roster; you can disable or edit it later.',
      'form.editHint': 'Changes apply on save; the roster order follows the list order.',
      'form.name': 'Name',
      'form.nameHint': 'Starts with a lowercase letter; lowercase letters, digits, and hyphens only; 2–32 characters; unique across the roster.',
      'form.title': 'Title',
      'form.titleHint': '1–48 characters, shown in the roster list.',
      'form.description': 'Description',
      'form.descriptionHint': '1–600 characters describing what this Agent does.',
      'form.whenToUse': 'When to use',
      'form.whenToUseHint': '1–600 characters describing when this Agent should be assigned.',
      'form.provider': 'Provider',
      'form.providerHint': 'Providers available in the host catalog.',
      'form.providerEmpty': 'The host returned no providers; configure a model provider in settings first.',
      'form.model': 'Model',
      'form.modelPick': 'Choose a model',
      'form.modelHint': 'Choose from the models registered for this provider.',
      'form.modelLoading': 'Loading models…',
      'form.modelFailed': 'No models available. Add one for this provider in Settings → Models first.',
      'form.providerMissing': 'Choose a provider first.',
      'form.reasoningEffort': 'Reasoning effort',
      'form.reasoningEffortHint': 'Only the efforts this model accepts are listed; Default lets the model decide.',
      'form.effortHint': 'Only the efforts this model accepts are listed; Default lets the model decide.',
      'form.effortDefault': 'Model default',
      'form.effortDefaultNamed': 'Model default ({name})',
      'form.effortUnavailable': 'This model does not accept a reasoning effort; the default applies.',
      'form.maxTokens': 'Max tokens',
      'form.maxTokensHint': 'An integer from 1 to 1000000; empty uses the output limit this model is configured with.',
      'form.maxTokensHintDefault': 'This model is configured for {value} output tokens; empty uses it.',
      'form.enabled': 'Allow delegation',
      'form.enabledHint': 'Off keeps the profile but no child is launched from it.',
      'form.autoLaunch': 'Auto-launch',
      'form.autoLaunchHint': 'Off requires an explicit request by name; on lets the model pick it from the use case.',
      'form.autoLaunchHint': 'When on, the host may launch this Agent automatically.',
      'form.flags': 'State',
      'form.placeholder.name': 'code-reviewer',
      'form.placeholder.title': 'Code reviewer',
      'form.placeholder.description': 'Reviews diffs for correctness and security and lists blocking issues.',
      'form.placeholder.whenToUse': 'Use for code review, diff checks, security audits, or regression risk.',
      'form.placeholder.model': 'deepseek-v4.1-flash',
      'form.placeholder.reasoningEffort': 'low / medium / high',
      'form.placeholder.maxTokens': 'Empty = default',
      'form.saveFailed': 'Save failed: {error}',
      'validate.name': 'Name must start with a lowercase letter, use only lowercase letters, digits, and hyphens, and be 2–32 characters long.',
      'validate.title': 'Title must be 1–48 characters long.',
      'validate.description': 'Description must be 1–600 characters long.',
      'validate.whenToUse': 'When to use must be 1–600 characters long.',
      'validate.route': 'Provider and model are both required.',
      'validate.maxTokens': 'Max tokens must be empty or an integer from 1 to 1000000.',
      'error.unknown': 'Unknown error; try again later.'
    };

    return {
      inject: ['slots', 'locale'],
      apply
    };
  }
});
