const state = loadState() ?? createDefaultState();

const els = {
  viewMain: document.querySelector('[data-view="main"]'),
  viewExport: document.querySelector('[data-view="export"]'),
  viewDatabase: document.querySelector('[data-view="database"]'),
  tabMain: document.querySelector("#tab-main"),
  tabExport: document.querySelector("#tab-export"),
  tabDatabase: document.querySelector("#tab-database"),
  metaProject: document.querySelector("#meta-project"),
  metaRevision: document.querySelector("#meta-revision"),
  metaCustomer: document.querySelector("#meta-customer"),
  metaOwner: document.querySelector("#meta-owner"),
  connectors: document.querySelector("#connectors"),
  cables: document.querySelector("#cables"),
  connections: document.querySelector("#connections"),
  catalogConnectors: document.querySelector("#catalog-connectors"),
  catalogCables: document.querySelector("#catalog-cables"),
  addDbConnector: document.querySelector("#add-db-connector"),
  addDbCable: document.querySelector("#add-db-cable"),
  yamlOutput: document.querySelector("#yaml-output"),
  wirevizPreview: document.querySelector("#wireviz-preview"),
  wirevizModal: document.querySelector("#wireviz-modal"),
  wirevizModalPreview: document.querySelector("#wireviz-modal-preview"),
  expandWireviz: document.querySelector("#expand-wireviz"),
  wirevizBom: document.querySelector("#wireviz-bom"),
  wirevizStatus: document.querySelector("#wireviz-status"),
  generateWireviz: document.querySelector("#generate-wireviz"),
  exportWireviz: document.querySelector("#export-wireviz"),
  themeToggle: document.querySelector("#theme-toggle"),
  addConnector: document.querySelector("#add-connector"),
  addCable: document.querySelector("#add-cable"),
  addConnection: document.querySelector("#add-connection"),
};

const uid = (prefix) =>
  `${prefix}_${Math.random().toString(36).slice(2, 7)}${Date.now().toString(36).slice(-4)}`;
const THEME_STORAGE_KEY = "cableforge-theme";
const STORAGE_KEY = "cableforge-state";
let lastWirevizSvg = "";

function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredTheme(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage errors and keep the UI usable.
  }
}

function applyTheme(theme) {
  const normalized = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = normalized;
  document.documentElement.style.colorScheme = normalized;
  els.themeToggle.setAttribute("aria-pressed", normalized === "dark" ? "true" : "false");
  els.themeToggle.textContent = normalized === "dark" ? "Modo claro" : "Modo escuro";
  setStoredTheme(normalized);
}

function createDefaultState() {
  return {
    ui: {
      activeTab: "main",
    },
    metadata: {
      project: "Nome do Chicote/Projeto",
      revision: "A",
      customer: "Nova Instruments",
      owner: "CableForge",
    },
    catalogs: {
      connectors: [
        {
          id: "CONN-1",
          name: "JST XH 4P",
          type: "JST-XH",
          subtype: "female",
          manufacturer: "JST",
          mpn: "B4B-XH-A(LF)(SN)",
          supplier: "LCSC",
          spn: "C123456",
          notes: "",
          pinlabels: ["+12V", "GND", "SDA", "SCL"],
        },
      ],
      cables: [
        {
          id: "CABL-1",
          name: "Harness cable 4 vias",
          type: "Harness cable",
          gauge: "0.25 mm2",
          length: "0.30 m",
          colorCode: "DIN",
          wirecount: 4,
          shield: false,
          notes: "",
        },
      ],
    },
    connectors: [
      {
        id: "X1",
        templateId: "CONN-1",
        type: "JST-XH",
        subtype: "female",
        manufacturer: "JST",
        mpn: "B4B-XH-A(LF)(SN)",
        supplier: "LCSC",
        spn: "C123456",
        notes: "",
        pinlabels: ["+12V", "GND", "SDA", "SCL"],
      },
      {
        id: "X2",
        templateId: "CONN-1",
        type: "JST-XH",
        subtype: "female",
        manufacturer: "JST",
        mpn: "B4B-XH-A(LF)(SN)",
        supplier: "LCSC",
        spn: "C123457",
        notes: "",
        pinlabels: ["+12V", "GND", "SDA", "SCL"],
      },
    ],
    cables: [
      {
        id: "W1",
        templateId: "CABL-1",
        type: "Harness cable",
        gauge: "0.25 mm2",
        length: "0.30 m",
        colorCode: "DIN",
        wirecount: 4,
        shield: false,
        notes: "",
      },
    ],
    connections: [
      {
        id: "C1",
        leftConnector: "X1",
        leftPins: "1,2,3,4",
        cable: "W1",
        cablePins: "1,2,3,4",
        rightConnector: "X2",
        rightPins: "1,2,3,4",
      },
    ],
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeState(JSON.parse(raw)) : createDefaultState();
  } catch {
    return createDefaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function normalizeState(raw) {
  const defaults = createDefaultState();
  const source = raw && typeof raw === "object" ? raw : {};
  const connectors = Array.isArray(source.connectors) ? source.connectors : defaults.connectors;
  const cables = Array.isArray(source.cables) ? source.cables : defaults.cables;
  const pickText = (value, fallback) =>
    typeof value === "string" && value.trim() !== "" ? value : fallback;
  return {
    ...defaults,
    ...source,
    ui: {
      ...defaults.ui,
      ...(source.ui || {}),
      activeTab: ["main", "export", "database"].includes(source.ui?.activeTab) ? source.ui.activeTab : "main",
    },
    metadata: {
      project: pickText(source.metadata?.project, defaults.metadata.project),
      revision: pickText(source.metadata?.revision, defaults.metadata.revision),
      customer: pickText(source.metadata?.customer, defaults.metadata.customer),
      owner: pickText(source.metadata?.owner, defaults.metadata.owner),
    },
    catalogs: {
      connectors: Array.isArray(source.catalogs?.connectors) && source.catalogs.connectors.length
        ? source.catalogs.connectors
        : defaults.catalogs.connectors,
      cables: Array.isArray(source.catalogs?.cables) && source.catalogs.cables.length
        ? source.catalogs.cables
        : defaults.catalogs.cables,
    },
    connectors: connectors.map((connector, index) => ({
      templateId: connector.templateId || defaults.catalogs.connectors[0]?.id || "",
      ...connector,
      id: connector.id || `X${index + 1}`,
      pinlabels: Array.isArray(connector.pinlabels) ? connector.pinlabels : [],
    })),
    cables: cables.map((cable, index) => ({
      templateId: cable.templateId || defaults.catalogs.cables[0]?.id || "",
      ...cable,
      id: cable.id || `W${index + 1}`,
    })),
    connections: Array.isArray(source.connections) ? source.connections : defaults.connections,
  };
}

function escapeYamlString(value) {
  const text = String(value ?? "");
  if (text === "") return '""';
  if (/^[A-Za-z0-9 _./:+-]+$/.test(text)) return text;
  return JSON.stringify(text);
}

function yamlScalar(value) {
  if (value === null || value === undefined) return '""';
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return escapeYamlString(value);
}

function yamlInlineArray(items) {
  return `[${items.map((item) => yamlScalar(item)).join(", ")}]`;
}

function yamlLinesForObject(obj, indent) {
  const pad = "  ".repeat(indent);
  const lines = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      lines.push(`${pad}${key}: ${yamlInlineArray(value)}`);
      continue;
    }
    lines.push(`${pad}${key}: ${yamlScalar(value)}`);
  }
  return lines;
}

function formatPinList(text) {
  return String(text || "")
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      if (/^\d+$/.test(item)) return Number(item);
      return item;
    });
}

function formatConnectionPins(text) {
  return String(text || "")
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function render() {
  const defaults = createDefaultState().metadata;
  let metadataUpdated = false;

  if (!String(state.metadata.project || "").trim()) {
    state.metadata.project = defaults.project;
    metadataUpdated = true;
  }
  if (!String(state.metadata.revision || "").trim()) {
    state.metadata.revision = defaults.revision;
    metadataUpdated = true;
  }
  if (!String(state.metadata.customer || "").trim()) {
    state.metadata.customer = defaults.customer;
    metadataUpdated = true;
  }
  if (!String(state.metadata.owner || "").trim()) {
    state.metadata.owner = defaults.owner;
    metadataUpdated = true;
  }

  els.metaProject.value = state.metadata.project ?? "";
  els.metaRevision.value = state.metadata.revision ?? "";
  els.metaCustomer.value = state.metadata.customer ?? "";
  els.metaOwner.value = state.metadata.owner ?? "";

  if (metadataUpdated) {
    saveState();
  }

  renderTabs();

  els.connectors.innerHTML = "";
  state.connectors.forEach((connector, index) => {
    els.connectors.appendChild(renderConnector(connector, index));
  });

  els.cables.innerHTML = "";
  state.cables.forEach((cable, index) => {
    els.cables.appendChild(renderCable(cable, index));
  });

  els.connections.innerHTML = "";
  state.connections.forEach((connection, index) => {
    els.connections.appendChild(renderConnection(connection, index));
  });

  els.catalogConnectors.innerHTML = "";
  state.catalogs.connectors.forEach((connector, index) => {
    els.catalogConnectors.appendChild(renderCatalogConnector(connector, index));
  });

  els.catalogCables.innerHTML = "";
  state.catalogs.cables.forEach((cable, index) => {
    els.catalogCables.appendChild(renderCatalogCable(cable, index));
  });

  refreshYaml();
}

function renderTabs() {
  const activeTab = ["main", "export", "database"].includes(state.ui.activeTab) ? state.ui.activeTab : "main";
  els.viewMain.hidden = activeTab !== "main";
  els.viewExport.hidden = activeTab !== "export";
  els.viewDatabase.hidden = activeTab !== "database";
  els.tabMain.classList.toggle("is-active", activeTab === "main");
  els.tabExport.classList.toggle("is-active", activeTab === "export");
  els.tabDatabase.classList.toggle("is-active", activeTab === "database");
  els.tabMain.setAttribute("aria-pressed", activeTab === "main" ? "true" : "false");
  els.tabExport.setAttribute("aria-pressed", activeTab === "export" ? "true" : "false");
  els.tabDatabase.setAttribute("aria-pressed", activeTab === "database" ? "true" : "false");
}

function setWirevizStatus(message, tone = "info") {
  els.wirevizStatus.textContent = message;
  els.wirevizStatus.dataset.tone = tone;
}

function slugify(value) {
  return (
    String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "wireviz-harness"
  );
}

function renderConnector(connector, index) {
  const templateOptions = catalogConnectorOptions(connector.templateId);
  const wrapper = document.createElement("div");
  wrapper.className = "row-card";
  wrapper.innerHTML = `
    <div class="row-card__header">
      <div class="row-card__title">${connector.id || `Conector ${index + 1}`}</div>
      <button class="danger-button" type="button" data-action="remove-connector" data-index="${index}">
        Remover
      </button>
    </div>
    <div class="row-grid row-grid--two">
      <label>Modelo salvo
        <select data-field="templateId" data-kind="connector" data-index="${index}">
          ${templateOptions}
        </select>
      </label>
      <label>Nome
        <input data-field="name" data-kind="connector" data-index="${index}" value="${escapeAttr(connector.name || "")}" placeholder="Nome interno" />
      </label>
    </div>
    <div class="row-grid row-grid--three">
      <label>Designador
        <input data-field="id" data-kind="connector" data-index="${index}" value="${escapeAttr(connector.id)}" placeholder="X1" />
      </label>
      <label>Tipo
        <input data-field="type" data-kind="connector" data-index="${index}" value="${escapeAttr(connector.type)}" placeholder="JST-XH" />
      </label>
      <label>Subtipo
        <input data-field="subtype" data-kind="connector" data-index="${index}" value="${escapeAttr(connector.subtype)}" placeholder="female" />
      </label>
    </div>
    <div class="row-grid row-grid--three">
      <label>Fabricante
        <input data-field="manufacturer" data-kind="connector" data-index="${index}" value="${escapeAttr(connector.manufacturer)}" placeholder="JST" />
      </label>
      <label>MPN
        <input data-field="mpn" data-kind="connector" data-index="${index}" value="${escapeAttr(connector.mpn)}" placeholder="B4B-XH-A(LF)(SN)" />
      </label>
      <label>LCSC SPN
        <input data-field="spn" data-kind="connector" data-index="${index}" value="${escapeAttr(connector.spn)}" placeholder="Cxxxxxx" />
      </label>
    </div>
    <div class="row-grid row-grid--two">
      <label>Fornecedor
        <input data-field="supplier" data-kind="connector" data-index="${index}" value="${escapeAttr(connector.supplier || "LCSC")}" />
      </label>
      <label>Notas
        <input data-field="notes" data-kind="connector" data-index="${index}" value="${escapeAttr(connector.notes)}" placeholder="Informações de montagem" />
      </label>
    </div>
    <label>Pin labels
      <textarea data-field="pinlabels" data-kind="connector" data-index="${index}" placeholder="+12V, GND, SDA, SCL">${(connector.pinlabels || []).join(", ")}</textarea>
      <span class="hint">Separe por vírgula ou por linha. Isso define os nomes dos pinos.</span>
    </label>
  `;
  return wrapper;
}

function renderCable(cable, index) {
  const templateOptions = catalogCableOptions(cable.templateId);
  const wrapper = document.createElement("div");
  wrapper.className = "row-card";
  wrapper.innerHTML = `
    <div class="row-card__header">
      <div class="row-card__title">${cable.id || `Cabo ${index + 1}`}</div>
      <button class="danger-button" type="button" data-action="remove-cable" data-index="${index}">
        Remover
      </button>
    </div>
    <div class="row-grid row-grid--two">
      <label>Modelo salvo
        <select data-field="templateId" data-kind="cable" data-index="${index}">
          ${templateOptions}
        </select>
      </label>
      <label>Nome
        <input data-field="name" data-kind="cable" data-index="${index}" value="${escapeAttr(cable.name || "")}" placeholder="Nome interno" />
      </label>
    </div>
    <div class="row-grid row-grid--three">
      <label>Designador
        <input data-field="id" data-kind="cable" data-index="${index}" value="${escapeAttr(cable.id)}" placeholder="W1" />
      </label>
      <label>Tipo
        <input data-field="type" data-kind="cable" data-index="${index}" value="${escapeAttr(cable.type)}" placeholder="Harness cable" />
      </label>
      <label>Contagem
        <input data-field="wirecount" data-kind="cable" data-index="${index}" value="${escapeAttr(cable.wirecount)}" type="number" min="1" step="1" />
      </label>
    </div>
    <div class="row-grid row-grid--three">
      <label>Bitola
        <input data-field="gauge" data-kind="cable" data-index="${index}" value="${escapeAttr(cable.gauge)}" placeholder="0.25 mm2" />
      </label>
      <label>Comprimento
        <input data-field="length" data-kind="cable" data-index="${index}" value="${escapeAttr(cable.length)}" placeholder="0.30 m" />
      </label>
      <label>Color code
        <input data-field="colorCode" data-kind="cable" data-index="${index}" value="${escapeAttr(cable.colorCode)}" placeholder="DIN" />
      </label>
    </div>
    <div class="row-grid row-grid--two">
      <label>Blindagem
        <select data-field="shield" data-kind="cable" data-index="${index}">
          <option value="false" ${cable.shield ? "" : "selected"}>Não</option>
          <option value="true" ${cable.shield ? "selected" : ""}>Sim</option>
        </select>
      </label>
      <label>Notas
        <input data-field="notes" data-kind="cable" data-index="${index}" value="${escapeAttr(cable.notes)}" placeholder="Notas de fabricação" />
      </label>
    </div>
  `;
  return wrapper;
}

function renderConnection(connection, index) {
  const connectorOptions = state.connectors.map((connector) => `<option value="${escapeAttr(connector.id)}">${escapeHtml(connector.id)}</option>`).join("");
  const cableOptions = state.cables.map((cable) => `<option value="${escapeAttr(cable.id)}">${escapeHtml(cable.id)}</option>`).join("");
  const wrapper = document.createElement("div");
  wrapper.className = "row-card";
  wrapper.innerHTML = `
    <div class="row-card__header">
      <div class="row-card__title">${connection.id || `Ligação ${index + 1}`}</div>
      <button class="danger-button" type="button" data-action="remove-connection" data-index="${index}">
        Remover
      </button>
    </div>
    <div class="row-grid row-grid--three">
      <label>Conector A
        <select data-field="leftConnector" data-kind="connection" data-index="${index}">
          ${connectorOptions}
        </select>
      </label>
      <label>Cabo
        <select data-field="cable" data-kind="connection" data-index="${index}">
          ${cableOptions}
        </select>
      </label>
      <label>Conector B
        <select data-field="rightConnector" data-kind="connection" data-index="${index}">
          ${connectorOptions}
        </select>
      </label>
    </div>
    <div class="row-grid row-grid--three">
      <label>Pinos A
        <input data-field="leftPins" data-kind="connection" data-index="${index}" value="${escapeAttr(connection.leftPins)}" placeholder="1,2,3,4" />
      </label>
      <label>Pinos do cabo
        <input data-field="cablePins" data-kind="connection" data-index="${index}" value="${escapeAttr(connection.cablePins)}" placeholder="1,2,3,4" />
      </label>
      <label>Pinos B
        <input data-field="rightPins" data-kind="connection" data-index="${index}" value="${escapeAttr(connection.rightPins)}" placeholder="1,2,3,4" />
      </label>
    </div>
    <div class="row-actions">
      <button class="button button--ghost" type="button" data-action="reverse-right-pins" data-index="${index}">
        Inverter pinos B
      </button>
    </div>
    <div class="hint">
    </div>
  `;

  setSelectValue(wrapper.querySelector(`[data-field="leftConnector"]`), connection.leftConnector);
  setSelectValue(wrapper.querySelector(`[data-field="cable"]`), connection.cable);
  setSelectValue(wrapper.querySelector(`[data-field="rightConnector"]`), connection.rightConnector);
  return wrapper;
}

function renderCatalogConnector(connector, index) {
  const wrapper = document.createElement("div");
  wrapper.className = "row-card";
  wrapper.innerHTML = `
    <div class="row-card__header">
      <div class="row-card__title">${connector.name || `Conector salvo ${index + 1}`}</div>
      <div class="actions">
        <button class="button button--ghost" type="button" data-action="use-catalog-connector" data-index="${index}">
          Usar no chicote
        </button>
        <button class="danger-button" type="button" data-action="remove-catalog-connector" data-index="${index}">
          Remover
        </button>
      </div>
    </div>
    <div class="row-grid row-grid--two">
      <label>Nome
        <input data-field="name" data-kind="catalog-connector" data-index="${index}" value="${escapeAttr(connector.name || "")}" placeholder="Nome do conector" />
      </label>
      <label>Designador interno
        <input data-field="id" data-kind="catalog-connector" data-index="${index}" value="${escapeAttr(connector.id || "")}" placeholder="CONN-1" />
      </label>
    </div>
    <div class="row-grid row-grid--three">
      <label>Tipo
        <input data-field="type" data-kind="catalog-connector" data-index="${index}" value="${escapeAttr(connector.type || "")}" placeholder="JST-XH" />
      </label>
      <label>Subtipo
        <input data-field="subtype" data-kind="catalog-connector" data-index="${index}" value="${escapeAttr(connector.subtype || "")}" placeholder="female" />
      </label>
      <label>Fabricante
        <input data-field="manufacturer" data-kind="catalog-connector" data-index="${index}" value="${escapeAttr(connector.manufacturer || "")}" placeholder="JST" />
      </label>
    </div>
    <div class="row-grid row-grid--three">
      <label>MPN
        <input data-field="mpn" data-kind="catalog-connector" data-index="${index}" value="${escapeAttr(connector.mpn || "")}" placeholder="B4B-XH-A(LF)(SN)" />
      </label>
      <label>Fornecedor
        <input data-field="supplier" data-kind="catalog-connector" data-index="${index}" value="${escapeAttr(connector.supplier || "LCSC")}" />
      </label>
      <label>SPN
        <input data-field="spn" data-kind="catalog-connector" data-index="${index}" value="${escapeAttr(connector.spn || "")}" placeholder="Cxxxxxx" />
      </label>
    </div>
    <div class="row-grid row-grid--two">
      <label>Notas
        <input data-field="notes" data-kind="catalog-connector" data-index="${index}" value="${escapeAttr(connector.notes || "")}" placeholder="Notas locais" />
      </label>
      <label>Pinos
        <textarea data-field="pinlabels" data-kind="catalog-connector" data-index="${index}" placeholder="+12V, GND, SDA, SCL">${(connector.pinlabels || []).join(", ")}</textarea>
      </label>
    </div>
  `;
  return wrapper;
}

function renderCatalogCable(cable, index) {
  const wrapper = document.createElement("div");
  wrapper.className = "row-card";
  wrapper.innerHTML = `
    <div class="row-card__header">
      <div class="row-card__title">${cable.name || `Cabo salvo ${index + 1}`}</div>
      <div class="actions">
        <button class="button button--ghost" type="button" data-action="use-catalog-cable" data-index="${index}">
          Usar no chicote
        </button>
        <button class="danger-button" type="button" data-action="remove-catalog-cable" data-index="${index}">
          Remover
        </button>
      </div>
    </div>
    <div class="row-grid row-grid--two">
      <label>Nome
        <input data-field="name" data-kind="catalog-cable" data-index="${index}" value="${escapeAttr(cable.name || "")}" placeholder="Nome do cabo" />
      </label>
      <label>Designador interno
        <input data-field="id" data-kind="catalog-cable" data-index="${index}" value="${escapeAttr(cable.id || "")}" placeholder="CABL-1" />
      </label>
    </div>
    <div class="row-grid row-grid--three">
      <label>Tipo
        <input data-field="type" data-kind="catalog-cable" data-index="${index}" value="${escapeAttr(cable.type || "")}" placeholder="Harness cable" />
      </label>
      <label>Bitola
        <input data-field="gauge" data-kind="catalog-cable" data-index="${index}" value="${escapeAttr(cable.gauge || "")}" placeholder="0.25 mm2" />
      </label>
      <label>Comprimento
        <input data-field="length" data-kind="catalog-cable" data-index="${index}" value="${escapeAttr(cable.length || "")}" placeholder="0.30 m" />
      </label>
    </div>
    <div class="row-grid row-grid--three">
      <label>Color code
        <input data-field="colorCode" data-kind="catalog-cable" data-index="${index}" value="${escapeAttr(cable.colorCode || "")}" placeholder="DIN" />
      </label>
      <label>Contagem
        <input data-field="wirecount" data-kind="catalog-cable" data-index="${index}" value="${escapeAttr(cable.wirecount)}" type="number" min="1" step="1" />
      </label>
      <label>Blindagem
        <select data-field="shield" data-kind="catalog-cable" data-index="${index}">
          <option value="false" ${cable.shield ? "" : "selected"}>Não</option>
          <option value="true" ${cable.shield ? "selected" : ""}>Sim</option>
        </select>
      </label>
    </div>
    <label>Notas
      <input data-field="notes" data-kind="catalog-cable" data-index="${index}" value="${escapeAttr(cable.notes || "")}" placeholder="Notas locais" />
    </label>
  `;
  return wrapper;
}

function catalogConnectorOptions(selectedId) {
  const options = [`<option value="">Selecione um modelo</option>`];
  for (const item of state.catalogs.connectors) {
    options.push(`<option value="${escapeAttr(item.id)}" ${item.id === selectedId ? "selected" : ""}>${escapeHtml(item.name || item.id)}</option>`);
  }
  return options.join("");
}

function catalogCableOptions(selectedId) {
  const options = [`<option value="">Selecione um modelo</option>`];
  for (const item of state.catalogs.cables) {
    options.push(`<option value="${escapeAttr(item.id)}" ${item.id === selectedId ? "selected" : ""}>${escapeHtml(item.name || item.id)}</option>`);
  }
  return options.join("");
}

function applyCatalogConnectorToHarness(connectorIndex, catalogId) {
  const template = state.catalogs.connectors.find((item) => item.id === catalogId);
  if (!template) return;
  const target = state.connectors[connectorIndex];
  if (!target) return;
  target.templateId = template.id;
  target.name = template.name || target.name || "";
  target.type = template.type || "";
  target.subtype = template.subtype || "";
  target.manufacturer = template.manufacturer || "";
  target.mpn = template.mpn || "";
  target.supplier = template.supplier || "LCSC";
  target.spn = template.spn || "";
  target.notes = template.notes || "";
  target.pinlabels = Array.isArray(template.pinlabels) ? [...template.pinlabels] : [];
}

function applyCatalogCableToHarness(cableIndex, catalogId) {
  const template = state.catalogs.cables.find((item) => item.id === catalogId);
  if (!template) return;
  const target = state.cables[cableIndex];
  if (!target) return;
  target.templateId = template.id;
  target.name = template.name || target.name || "";
  target.type = template.type || "";
  target.gauge = template.gauge || "";
  target.length = template.length || "";
  target.colorCode = template.colorCode || "";
  target.wirecount = Number(template.wirecount) || 1;
  target.shield = Boolean(template.shield);
  target.notes = template.notes || "";
}

function addHarnessConnectorFromCatalog(catalogIndex) {
  const template = state.catalogs.connectors[catalogIndex];
  if (!template) return;
  state.connectors.push({
    id: `X${state.connectors.length + 1}`,
    templateId: template.id,
    name: template.name || "",
    type: template.type || "",
    subtype: template.subtype || "",
    manufacturer: template.manufacturer || "",
    mpn: template.mpn || "",
    supplier: template.supplier || "LCSC",
    spn: template.spn || "",
    notes: template.notes || "",
    pinlabels: Array.isArray(template.pinlabels) ? [...template.pinlabels] : [],
  });
}

function addHarnessCableFromCatalog(catalogIndex) {
  const template = state.catalogs.cables[catalogIndex];
  if (!template) return;
  state.cables.push({
    id: `W${state.cables.length + 1}`,
    templateId: template.id,
    name: template.name || "",
    type: template.type || "",
    gauge: template.gauge || "",
    length: template.length || "",
    colorCode: template.colorCode || "",
    wirecount: Number(template.wirecount) || 1,
    shield: Boolean(template.shield),
    notes: template.notes || "",
  });
}

function setSelectValue(select, value) {
  if (!select) return;
  select.value = value || "";
}

function escapeAttr(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("\"", "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeHtml(value) {
  return escapeAttr(value);
}

function updateFromInputs() {
  state.metadata.project = els.metaProject.value.trim();
  state.metadata.revision = els.metaRevision.value.trim();
  state.metadata.customer = els.metaCustomer.value.trim();
  state.metadata.owner = els.metaOwner.value.trim();
}

function updateField(kind, index, field, value) {
  if (kind === "connector" || kind === "cable") {
    const target = state[`${kind}s`]?.[index];
    if (!target) return;
    if (field === "templateId") {
      target.templateId = value;
      if (kind === "connector") {
        applyCatalogConnectorToHarness(index, value);
      } else {
        applyCatalogCableToHarness(index, value);
      }
      return;
    }
    if (kind === "connector" && field === "pinlabels") {
      target.pinlabels = String(value)
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean);
      return;
    }
    if (kind === "cable" && field === "wirecount") {
      target[field] = Number(value);
      return;
    }
    if (kind === "cable" && field === "shield") {
      target[field] = value === "true";
      return;
    }
    target[field] = value;
    return;
  }

  if (kind === "catalog-connector") {
    const target = state.catalogs.connectors?.[index];
    if (!target) return;
    const oldId = target.id;
    if (field === "pinlabels") {
      target.pinlabels = String(value)
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean);
    } else {
      target[field] = value;
    }
    if (field === "id" && value && value !== oldId) {
      state.connectors.forEach((connector) => {
        if (connector.templateId === oldId) {
          connector.templateId = value;
        }
      });
    }
    return;
  }

  if (kind === "catalog-cable") {
    const target = state.catalogs.cables?.[index];
    if (!target) return;
    const oldId = target.id;
    if (field === "wirecount") {
      target[field] = Number(value);
    } else if (field === "shield") {
      target[field] = value === "true";
    } else {
      target[field] = value;
    }
    if (field === "id" && value && value !== oldId) {
      state.cables.forEach((cable) => {
        if (cable.templateId === oldId) {
          cable.templateId = value;
        }
      });
    }
  }
}

function addConnector() {
  state.connectors.push({
    id: `X${state.connectors.length + 1}`,
    templateId: state.catalogs.connectors[0]?.id || "",
    type: "Connector",
    subtype: "female",
    manufacturer: "",
    mpn: "",
    supplier: "LCSC",
    spn: "",
    notes: "",
    pinlabels: ["PIN1", "PIN2"],
  });
}

function addCable() {
  state.cables.push({
    id: `W${state.cables.length + 1}`,
    templateId: state.catalogs.cables[0]?.id || "",
    type: "Cable",
    gauge: "0.25 mm2",
    length: "0.20 m",
    colorCode: "DIN",
    wirecount: 2,
    shield: false,
    notes: "",
  });
}

function addConnection() {
  const left = state.connectors[0]?.id ?? "X1";
  const right = state.connectors[1]?.id ?? state.connectors[0]?.id ?? "X2";
  const cable = state.cables[0]?.id ?? "W1";
  state.connections.push({
    id: `C${state.connections.length + 1}`,
    leftConnector: left,
    leftPins: "1,2",
    cable,
    cablePins: "1,2",
    rightConnector: right,
    rightPins: "1,2",
  });
}

function removeItem(kind, index) {
  state[`${kind}s`].splice(index, 1);
  if (kind === "connector") {
    state.connections = state.connections.filter(
      (connection) => connection.leftConnector !== state.connectors[index]?.id && connection.rightConnector !== state.connectors[index]?.id,
    );
  }
}

function removeCatalogItem(kind, index) {
  const collection = kind === "connector" ? state.catalogs.connectors : state.catalogs.cables;
  const removed = collection[index];
  if (!removed) return;
  collection.splice(index, 1);
  if (kind === "connector") {
    state.connectors.forEach((connector) => {
      if (connector.templateId === removed.id) {
        connector.templateId = "";
      }
    });
  } else {
    state.cables.forEach((cable) => {
      if (cable.templateId === removed.id) {
        cable.templateId = "";
      }
    });
  }
}

function buildYaml() {
  const lines = [];

  lines.push("metadata:");
  lines.push(...yamlLinesForObject(state.metadata, 1));

  lines.push("connectors:");
  for (const connector of state.connectors) {
    const id = connector.id || uid("X");
    lines.push(`  ${id}:`);
    lines.push(...yamlLinesForObject(
      {
        type: connector.type,
        subtype: connector.subtype,
        manufacturer: connector.manufacturer,
        mpn: connector.mpn,
        supplier: connector.supplier || "LCSC",
        spn: connector.spn,
        notes: connector.notes,
        pinlabels: formatPinList(connector.pinlabels?.join(", ")),
      },
      2,
    ));
  }

  lines.push("cables:");
  for (const cable of state.cables) {
    const id = cable.id || uid("W");
    lines.push(`  ${id}:`);
    lines.push(
      ...yamlLinesForObject(
        {
          type: cable.type,
          gauge: cable.gauge,
          length: cable.length,
          color_code: cable.colorCode,
          wirecount: Number(cable.wirecount) || undefined,
          shield: cable.shield,
          notes: cable.notes,
        },
        2,
      ),
    );
  }

  lines.push("connections:");
  for (const connection of state.connections) {
    const items = [];
    if (connection.leftConnector && connection.leftPins) {
      items.push({ [connection.leftConnector]: formatConnectionPins(connection.leftPins) });
    }
    if (connection.cable && connection.cablePins) {
      items.push({ [connection.cable]: formatConnectionPins(connection.cablePins) });
    }
    if (connection.rightConnector && connection.rightPins) {
      items.push({ [connection.rightConnector]: formatConnectionPins(connection.rightPins) });
    }
    if (!items.length) continue;
    lines.push(`  -`);
    for (const item of items) {
      const [key, pins] = Object.entries(item)[0];
      lines.push(`    - ${key}: ${yamlInlineArray(pins)}`);
    }
  }

  return lines.join("\n");
}

function refreshYaml() {
  els.yamlOutput.textContent = buildYaml();
  saveState();
}

function renderWirevizOutput(result) {
  lastWirevizSvg = result.svg || "";
  if (result.svg) {
    els.wirevizPreview.innerHTML = result.svg;
  } else {
    els.wirevizPreview.innerHTML = '<div class="preview-empty">Não foi possível gerar a visualização.</div>';
  }

  els.wirevizBom.textContent = result.bom ? `BOM\n\n${result.bom}` : "BOM não retornado.";
}

function openWirevizModal() {
  if (!lastWirevizSvg) {
    setWirevizStatus("Gere o chicote primeiro para abrir a visualização ampliada.", "info");
    return;
  }

  els.wirevizModalPreview.innerHTML = lastWirevizSvg;
  els.wirevizModal.classList.add("is-open");
  els.wirevizModal.setAttribute("aria-hidden", "false");
}

function closeWirevizModal() {
  els.wirevizModal.classList.remove("is-open");
  els.wirevizModal.setAttribute("aria-hidden", "true");
}

async function generateWithWireviz() {
  return generateWirevizImpl(false);
}

async function exportWithWireviz() {
  return generateWirevizImpl(true);
}

function downloadText(name, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function downloadBase64(name, base64, type) {
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  const blob = new Blob([bytes], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function downloadWirevizBundle(payload) {
  const base = slugify(state.metadata.project || "wireviz-harness");
  if (payload.png) {
    downloadBase64(`${base}.png`, payload.png, "image/png");
  }
}

async function generateWirevizImpl(shouldExport) {
  const yaml = buildYaml();
  setWirevizStatus("Gerando visualização...", "info");
  els.generateWireviz.disabled = true;
  els.exportWireviz.disabled = true;

  try {
    const response = await fetch("/api/render-wireviz", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ yaml }),
    });

    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || "Falha ao gerar a visualização.");
    }

    renderWirevizOutput(payload);
    setWirevizStatus("Visualização gerada com sucesso.", "success");
    if (shouldExport) {
      downloadWirevizBundle(payload);
      setWirevizStatus("Visualização gerada e PNG exportado.", "success");
    }
  } catch (error) {
    els.wirevizPreview.innerHTML = '<div class="preview-empty">Não foi possível gerar o chicote.</div>';
    els.wirevizBom.textContent = "";
    setWirevizStatus(String(error?.message || error), "error");
  } finally {
    els.generateWireviz.disabled = false;
    els.exportWireviz.disabled = false;
  }
}

document.addEventListener("input", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  if (target.matches("#meta-project, #meta-revision, #meta-customer, #meta-owner")) {
    updateFromInputs();
    refreshYaml();
    return;
  }

  const kind = target.getAttribute("data-kind");
  const index = Number(target.getAttribute("data-index"));
  const field = target.getAttribute("data-field");
  if (!kind || !field || Number.isNaN(index)) return;
  updateField(kind, index, field, target.value);
  refreshYaml();
});

document.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const kind = target.getAttribute("data-kind");
  const index = Number(target.getAttribute("data-index"));
  const field = target.getAttribute("data-field");
  if (!kind || !field || Number.isNaN(index)) return;
  updateField(kind, index, field, target.value);
  refreshYaml();
});

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const tab = target.getAttribute("data-tab");
  if (tab === "main" || tab === "export" || tab === "database") {
    state.ui.activeTab = tab;
    renderTabs();
    saveState();
    return;
  }

  const action = target.getAttribute("data-action");
  if (!action) return;
  if (action === "close-wireviz-modal") {
    closeWirevizModal();
    return;
  }
  const index = Number(target.getAttribute("data-index"));

  if (action === "remove-connector" && Number.isFinite(index)) {
    state.connectors.splice(index, 1);
    state.connections = state.connections.filter((connection) => {
      const connectorIds = state.connectors.map((item) => item.id);
      return connectorIds.includes(connection.leftConnector) && connectorIds.includes(connection.rightConnector);
    });
    render();
  }

  if (action === "remove-cable" && Number.isFinite(index)) {
    state.cables.splice(index, 1);
    state.connections = state.connections.filter((connection) =>
      state.cables.some((cable) => cable.id === connection.cable),
    );
    render();
  }

  if (action === "remove-connection" && Number.isFinite(index)) {
    state.connections.splice(index, 1);
    render();
  }

  if (action === "reverse-right-pins" && Number.isFinite(index)) {
    const connection = state.connections[index];
    if (!connection) return;
    const pins = formatConnectionPins(connection.rightPins);
    if (!pins.length) return;
    connection.rightPins = pins.reverse().join(",");
    render();
    saveState();
  }

  if (action === "remove-catalog-connector" && Number.isFinite(index)) {
    removeCatalogItem("connector", index);
    render();
  }

  if (action === "remove-catalog-cable" && Number.isFinite(index)) {
    removeCatalogItem("cable", index);
    render();
  }

  if (action === "use-catalog-connector" && Number.isFinite(index)) {
    addHarnessConnectorFromCatalog(index);
    state.ui.activeTab = "main";
    render();
    saveState();
  }

  if (action === "use-catalog-cable" && Number.isFinite(index)) {
    addHarnessCableFromCatalog(index);
    state.ui.activeTab = "main";
    render();
    saveState();
  }
});

els.addConnector.addEventListener("click", () => {
  addConnector();
  render();
});

els.addCable.addEventListener("click", () => {
  addCable();
  render();
});

els.addConnection.addEventListener("click", () => {
  addConnection();
  render();
});

els.addDbConnector.addEventListener("click", () => {
  state.catalogs.connectors.push({
    id: uid("CONN"),
    name: "Novo conector",
    type: "",
    subtype: "",
    manufacturer: "",
    mpn: "",
    supplier: "LCSC",
    spn: "",
    notes: "",
    pinlabels: [],
  });
  state.ui.activeTab = "database";
  render();
  saveState();
});

els.addDbCable.addEventListener("click", () => {
  state.catalogs.cables.push({
    id: uid("CABL"),
    name: "Novo cabo",
    type: "",
    gauge: "",
    length: "",
    colorCode: "",
    wirecount: 1,
    shield: false,
    notes: "",
  });
  state.ui.activeTab = "database";
  render();
  saveState();
});

els.generateWireviz.addEventListener("click", generateWithWireviz);
els.exportWireviz.addEventListener("click", exportWithWireviz);
els.expandWireviz.addEventListener("click", openWirevizModal);
els.themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
});

updateFromInputs();
applyTheme(getStoredTheme() || "light");
render();
setWirevizStatus("Pronto para gerar a visualização.", "info");

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && els.wirevizModal.classList.contains("is-open")) {
    closeWirevizModal();
  }
});
