const ADMIN_APP = {
  // Comme /admin et /api sont servis par le même serveur Railway, le plus robuste = origin courant.
  API_BASE_URL: window.location.origin,

  // Endpoints
  ENDPOINTS: {
    loginCandidates: [
      "/api/admin/login",   // si tu as une route admin dédiée
      "/api/auth/admin",    // fallback possible
      "/api/auth/login"     // fallback possible
    ],

    // On teste plusieurs routes de listing (car ton backend peut exposer GET /api/participants différemment)
    participantsCandidates: [
      "/api/participants",
      "/api/participants/list",
      "/api/participants/admin"
    ],

    deleteParticipant: (id) => `/api/participants/${id}`
  },

  PAGE_SIZE: 25,
  TOKEN_KEY: "chandeleur_admin_token"
};

// ---------- DOM
const $ = (id) => document.getElementById(id);

const loginCard = $("loginCard");
const loginForm = $("loginForm");
const loginEmail = $("loginEmail");
const loginPassword = $("loginPassword");
const loginMsg = $("loginMsg");

const authStatusPill = $("authStatusPill");
const apiBaseUrlLabel = $("apiBaseUrlLabel");

const refreshBtn = $("refreshBtn");
const logoutBtn = $("logoutBtn");

const inscritsCard = $("inscritsCard");
const statsCard = $("statsCard");
const testsCard = $("testsCard");

const pageTitle = $("pageTitle");
const crumbView = $("crumbView");

const searchInput = $("searchInput");
const enseigneSelect = $("enseigneSelect");
const optinSelect = $("optinSelect");
const sortSelect = $("sortSelect");

const exportCsvBtn = $("exportCsvBtn");
const deleteSelectedBtn = $("deleteSelectedBtn");

const tbody = $("participantsTbody");
const countLabel = $("countLabel");
const prevPageBtn = $("prevPageBtn");
const nextPageBtn = $("nextPageBtn");
const pageLabel = $("pageLabel");
const selectAll = $("selectAll");

const toast = $("toast");

// ---------- State
let state = {
  view: "inscrits",
  page: 1,
  total: 0,
  rows: [],
  selected: new Set(),
  participantsEndpoint: null // endpoint réellement utilisé après détection
};

// ---------- Utils
function toastMsg(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

function getToken() {
  return localStorage.getItem(ADMIN_APP.TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(ADMIN_APP.TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(ADMIN_APP.TOKEN_KEY);
}

function isAuthed() {
  return !!getToken();
}

function setAuthUi() {
  apiBaseUrlLabel.textContent = ADMIN_APP.API_BASE_URL;

  if (isAuthed()) {
    authStatusPill.textContent = "Connecté";
    authStatusPill.style.borderColor = "rgba(79,156,255,.35)";
    authStatusPill.style.color = "rgba(232,238,251,.85)";
    loginCard.classList.add("hidden");
  } else {
    authStatusPill.textContent = "Non connecté";
    authStatusPill.style.borderColor = "rgba(255,255,255,.08)";
    authStatusPill.style.color = "rgba(232,238,251,.65)";
    loginCard.classList.remove("hidden");
  }

  // Affichage des vues selon auth + onglet
  inscritsCard.classList.toggle("hidden", !(isAuthed() && state.view === "inscrits"));
  statsCard.classList.toggle("hidden", !(isAuthed() && state.view === "stats"));
  testsCard.classList.toggle("hidden", !(isAuthed() && state.view === "tests"));
}

async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");

  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  if (options.json) {
    headers.set("Content-Type", "application/json");
    options.body = JSON.stringify(options.json);
    delete options.json;
  }

  const url = path.startsWith("http") ? path : `${ADMIN_APP.API_BASE_URL}${path}`;

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const ct = res.headers.get("content-type") || "";
    let payloadText = "";
    try {
      payloadText = ct.includes("application/json")
        ? JSON.stringify(await res.json())
        : await res.text();
    } catch (_) {
      payloadText = "";
    }

    const err = new Error(payloadText || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

function buildQuery(params) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === "" || v === null || v === undefined) return;
    q.set(k, String(v));
  });
  return q.toString();
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("fr-FR");
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseRowsAndTotal(data) {
  const rows = data.rows || data.participants || data.data || data.items || [];
  const total = data.total ?? data.count ?? rows.length;
  return { rows, total };
}

// ---------- Data
async function resolveParticipantsEndpoint() {
  if (state.participantsEndpoint) return state.participantsEndpoint;

  // test “léger” sans query (ou page=1)
  const testQuery = buildQuery({ page: 1, limit: 1 });
  for (const ep of ADMIN_APP.ENDPOINTS.participantsCandidates) {
    try {
      await apiFetch(`${ep}?${testQuery}`);
      state.participantsEndpoint = ep;
      return ep;
    } catch (e) {
      // si 404 => on continue à tester
      if (e.status === 404) continue;

      // si 401/403 => le endpoint existe probablement mais token requis; on le garde
      if (e.status === 401 || e.status === 403) {
        state.participantsEndpoint = ep;
        return ep;
      }

      // autres erreurs : continue quand même
      continue;
    }
  }

  // fallback : on garde la valeur “standard”
  state.participantsEndpoint = "/api/participants";
  return state.participantsEndpoint;
}

async function loadParticipants() {
  tbody.innerHTML = `<tr><td colspan="7" class="muted">Chargement…</td></tr>`;

  const endpoint = await resolveParticipantsEndpoint();
  const [sortField, sortDir] = (sortSelect.value || "created_at:desc").split(":");

  const query = buildQuery({
    page: state.page,
    limit: ADMIN_APP.PAGE_SIZE,
    q: searchInput.value.trim(),
    enseigne: enseigneSelect.value,
    optin: optinSelect.value,
    sort: sortField,
    dir: sortDir
  });

  const data = await apiFetch(`${endpoint}?${query}`);
  const { rows, total } = parseRowsAndTotal(data);

  state.rows = rows;
  state.total = total;
  state.selected.clear();
  if (selectAll) selectAll.checked = false;
  deleteSelectedBtn.disabled = true;

  renderParticipants();
}

function renderParticipants() {
  const rows = state.rows;

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="muted">Aucun résultat.</td></tr>`;
    countLabel.textContent = "0 inscrit";
    pageLabel.textContent = `Page ${state.page}`;
    return;
  }

  tbody.innerHTML = rows.map((p) => {
    const id = p.id ?? p.participant_id ?? p.uuid ?? "";
    const created = p.created_at ?? p.createdAt ?? p.date ?? "";
    const nom = p.nom ?? p.last_name ?? "";
    const prenom = p.prenom ?? p.first_name ?? "";
    const email = p.email ?? "";
    const enseigne = p.enseigne ?? "";
    const optin = (p.opt_in ?? p.optin ?? p.marketing_optin);
    const optinTxt = (optin === true || optin === "true") ? "oui" : "non";

    return `
      <tr data-id="${escapeHtml(id)}">
        <td class="col-check">
          <input type="checkbox" class="row-check" data-id="${escapeHtml(id)}" />
        </td>
        <td>${escapeHtml(formatDate(created))}</td>
        <td>${escapeHtml(nom)}</td>
        <td>${escapeHtml(prenom)}</td>
        <td>${escapeHtml(email)}</td>
        <td>${escapeHtml(enseigne)}</td>
        <td>${escapeHtml(optinTxt)}</td>
      </tr>
    `;
  }).join("");

  countLabel.textContent = `${state.total} inscrit${state.total > 1 ? "s" : ""}`;
  pageLabel.textContent = `Page ${state.page}`;

  tbody.querySelectorAll(".row-check").forEach((cb) => {
    cb.addEventListener("change", () => {
      const id = cb.dataset.id;
      if (cb.checked) state.selected.add(id);
      else state.selected.delete(id);

      deleteSelectedBtn.disabled = state.selected.size === 0;
      selectAll.checked = state.selected.size === state.rows.length;
    });
  });
}

// ---------- Actions
async function handleLogin(e) {
  e.preventDefault();
  loginMsg.textContent = "";

  try {
    const payload = {
      email: loginEmail.value.trim(),
      username: loginEmail.value.trim(), // compat si ton backend attend "username"
      password: loginPassword.value
    };

    let data = null;
    let lastErr = null;

    for (const ep of ADMIN_APP.ENDPOINTS.loginCandidates) {
      try {
        data = await apiFetch(ep, { method: "POST", json: payload });
        break;
      } catch (err) {
        lastErr = err;
        if (err.status === 404) continue; // on teste le prochain endpoint
      }
    }

    if (!data) throw lastErr || new Error("Login impossible (endpoint introuvable)");

    const token = data.token || data.access_token;
    if (!token) throw new Error("Token manquant dans la réponse du login");

    setToken(token);
    state.page = 1;
    setAuthUi();
    toastMsg("Connecté");

    await loadParticipants();
  } catch (err) {
    loginMsg.textContent = "Connexion refusée";
    toastMsg(`Login KO: ${err.message}`);
  }
}

async function exportCsv() {
  const headers = ["date", "nom", "prenom", "email", "enseigne", "opt_in"];
  const lines = [headers.join(",")];

  state.rows.forEach((p) => {
    const created = p.created_at ?? p.createdAt ?? p.date ?? "";
    const nom = (p.nom ?? p.last_name ?? "");
    const prenom = (p.prenom ?? p.first_name ?? "");
    const email = (p.email ?? "");
    const enseigne = (p.enseigne ?? "");
    const optin = (p.opt_in ?? p.optin ?? p.marketing_optin) ? "true" : "false";

    const row = [formatDate(created), nom, prenom, email, enseigne, optin]
      .map((v) => `"${String(v).replaceAll('"', '""')}"`)
      .join(",");
    lines.push(row);
  });

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `inscrits_page-${state.page}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function deleteSelected() {
  if (!state.selected.size) return;
  if (!confirm(`Supprimer ${state.selected.size} participant(s) ?`)) return;

  const ids = Array.from(state.selected);
  let ok = 0;

  for (const id of ids) {
    try {
      await apiFetch(ADMIN_APP.ENDPOINTS.deleteParticipant(id), { method: "DELETE" });
      ok++;
    } catch (_) { /* continue */ }
  }

  toastMsg(`Supprimés: ${ok}/${ids.length}`);
  await loadParticipants();
}

// ---------- Navigation
function setView(view) {
  state.view = view;

  document.querySelectorAll(".nav-item").forEach((b) => {
    b.classList.toggle("active", b.dataset.view === view);
  });

  const label = view === "inscrits" ? "Inscrits" : (view === "stats" ? "Stats" : "Tests");
  crumbView.textContent = label;
  pageTitle.textContent = label;

  setAuthUi();
}

function debounce(fn, wait) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function wireEvents() {
  loginForm.addEventListener("submit", handleLogin);

  logoutBtn.addEventListener("click", () => {
    clearToken();
    state.participantsEndpoint = null;
    setAuthUi();
    toastMsg("Déconnecté");
  });

  refreshBtn.addEventListener("click", async () => {
    if (!isAuthed()) return toastMsg("Connecte-toi d'abord");
    try {
      await loadParticipants();
      toastMsg("OK");
    } catch (e) {
      // On ne “déconnecte” pas sur un 404/500.
      // On ne purge le token que si le serveur dit clairement qu'il est invalide.
      if (e.status === 401 || e.status === 403) {
        clearToken();
        setAuthUi();
        toastMsg("Session expirée, reconnecte-toi");
      } else {
        toastMsg(`Erreur: ${e.message}`);
      }
    }
  });

  document.querySelectorAll(".nav-item").forEach((b) => {
    b.addEventListener("click", () => setView(b.dataset.view));
  });

  const reload = async () => {
    state.page = 1;
    await loadParticipants();
  };

  searchInput.addEventListener("input", debounce(reload, 250));
  enseigneSelect.addEventListener("change", reload);
  optinSelect.addEventListener("change", reload);
  sortSelect.addEventListener("change", reload);

  prevPageBtn.addEventListener("click", async () => {
    if (state.page <= 1) return;
    state.page--;
    await loadParticipants();
  });

  nextPageBtn.addEventListener("click", async () => {
    state.page++;
    await loadParticipants();
  });

  selectAll.addEventListener("change", () => {
    const checks = tbody.querySelectorAll(".row-check");
    state.selected.clear();

    checks.forEach((cb) => {
      cb.checked = selectAll.checked;
      if (cb.checked) state.selected.add(cb.dataset.id);
    });

    deleteSelectedBtn.disabled = state.selected.size === 0;
  });

  exportCsvBtn.addEventListener("click", exportCsv);
  deleteSelectedBtn.addEventListener("click", deleteSelected);
}

// ---------- Init
(async function init() {
  setAuthUi();
  wireEvents();
  setView("inscrits");

  // si déjà connecté : on charge sans supprimer le token au moindre souci
  if (isAuthed()) {
    try {
      await loadParticipants();
    } catch (e) {
      if (e.status === 401 || e.status === 403) {
        clearToken();
        setAuthUi();
        toastMsg("Token invalide, reconnecte-toi");
      } else {
        toastMsg(`Erreur chargement: ${e.message}`);
      }
    }
  }
})();
