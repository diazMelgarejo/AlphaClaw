// The keyed roster is authoritative. Read legacy lists only when no keyed
// roster exists, and never persist the UI/service list projection.
const kAgentListView = Symbol("agent-list-view");
const isRecord = (value) => value && typeof value === "object" && !Array.isArray(value);

const getAgentEntries = (cfg = {}) => {
  if (isRecord(cfg.agents?.entries)) return { ...cfg.agents.entries };
  return Object.fromEntries(
    (Array.isArray(cfg.agents?.list) ? cfg.agents.list : [])
      .filter((entry) => isRecord(entry) && typeof entry.id === "string")
      .map(({ id, ...entry }) => [id, entry]),
  );
};

const canonicalizeAgentConfig = (cfg) => {
  if (!isRecord(cfg.agents)) return cfg;
  const { list, ...agents } = cfg.agents;
  if (cfg.agents[kAgentListView] || (!isRecord(agents.entries) && Array.isArray(list))) {
    agents.entries = Object.fromEntries(
      (list || []).map(({ id, ...entry }) => [id, entry]),
    );
  }
  if (isRecord(agents.entries)) {
    agents.entries = Object.fromEntries(Object.entries(agents.entries).map(([id, value]) => {
      const { default: retiredDefault, ...entry } = value;
      return [id, entry];
    }));
    if (Object.keys(agents.entries).length > 1) agents.ownership = "explicit";
  }
  return { ...cfg, agents };
};

const getPrimaryModel = (model) =>
  typeof model === "string" ? model : model?.primary || null;

const toModelConfig = (model) =>
  typeof model === "string" ? { primary: model } : { ...(model || {}) };

const allowAgentModel = (cfg, agent, primary) => {
  if (!primary) return;
  const policy = agent.modelPolicy ?? cfg.agents?.defaults?.modelPolicy;
  if (Array.isArray(policy?.allow) && policy.allow.length && !policy.allow.includes(primary)) {
    agent.modelPolicy = { ...policy, allow: [...policy.allow, primary] };
  }
  const models = agent.models ?? cfg.agents?.defaults?.models;
  if (!isRecord(models) || Object.keys(models).length === 0 || models[primary]) return;
  agent.models = {
    ...models,
    [primary]: cfg.agents?.defaults?.models?.[primary] || {},
  };
};

module.exports = {
  kAgentListView,
  getAgentEntries,
  canonicalizeAgentConfig,
  getPrimaryModel,
  toModelConfig,
  allowAgentModel,
};
