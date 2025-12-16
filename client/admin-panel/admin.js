const ADMIN_APP = {
  // Mets ici ton backend Railway
  API_BASE_URL: "https://ek-chandeleur-game-production.up.railway.app",

  // Endpoints (tu peux adapter si ton backend a d'autres routes)
  ENDPOINTS: {
    login: "/api/admin/login",          // POST { email, password } => { token }
    participants: "/api/participants",  // GET ?page=&limit=&q=&enseigne=&optin=&sort=
    deleteParticipant: (id) => `/api/participants/${id}` // DELETE
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
  selected: new Set()
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
    inscritsCard.classList.remove("hidden");
  } else {
    authStatusPill.textContent = "Non connecté";
    authStatusPill.style.borderColor = "rgba(255,255,255,.08)";
    authStatusPill.style.color = "rgba(232,238,251,.65)";
    loginCard.classList.remove("hidden");
    inscritsCard.classList.add("hidden");
  }
}

async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");

  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  // Si on envoie du JSON
  if (options.json) {
    headers.set("Content-Type", "application/json");
    options.body = JSON.stringify(options.json);
    delete options.json;
  }

  const res = await fetch(`${ADMIN_APP.API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }

  // certaines routes peuvent renvoyer du texte; on tente json
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

// ---------- Data
async function loadParticipants() {
  tbody.innerHTML = `<tr><td colspan="7" class="muted">Chargement…</td></tr>`;

  const [sortField, sortDir] = (sortSelect.value || "created_at:desc").split(":");

  // On envoie des params "classiques"
  const query = buildQuery({
    page: state.page,
    limit: ADMIN_APP.PAGE_SIZE,
    q: searchInput.value.trim(),
    enseigne: enseigneSelect.value,
    optin: optinSelect.value,        // "true"/"false"
    sort: sortField,
    dir: sortDir
  });

  const data = await apiFetch(`${ADMIN_APP.ENDPOINTS.participants}?${query}`);

  // On supporte 2 formats possibles de backend:
  // - { rows: [...], total: 123 }
  // - { participants: [...], total: 123 }
  const rows = data.rows || data.participants || data.data || [];
  const total = data.total ?? rows.length;

  state.rows = rows;
  state.total = total;
  state.selected.clear();
  selectAll.checked = false;
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
    // On supporte plusieurs noms de colonnes possibles
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
    const payload = { email: loginEmail.value.trim(), password: loginPassword.value };
    const data = await apiFetch(ADMIN_APP.ENDPOINTS.login, { method: "POST", json: payload });

    // support { token } ou { access_token }
    const token = data.token || data.access_token;
    if (!token) throw new Error("Token manquant dans la réponse /login");

    setToken(token);
    setAuthUi();
    toastMsg("Connecté");
    await loadParticipants();
  } catch (err) {
    loginMsg.textContent = "Connexion refusée";
    toastMsg(`Login KO: ${err.message}`);
  }
}

async function exportCsv() {
  // export local à partir des lignes déjà chargées (simple & robuste)
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
    } catch (e) {
      // continue
    }
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

  crumbView.textContent = view === "inscrits" ? "Inscrits" : "Stats";
  pageTitle.textContent = view === "inscrits" ? "Inscrits" : "Stats";

  inscritsCard.classList.toggle("hidden", view !== "inscrits" || !isAuthed());
  statsCard.classList.toggle("hidden", view !== "stats" || !isAuthed());
}

function wireEvents() {
  loginForm.addEventListener("submit", handleLogin);

  logoutBtn.addEventListener("click", () => {
    clearToken();
    setAuthUi();
    toastMsg("Déconnecté");
  });

  refreshBtn.addEventListener("click", async () => {
    if (!isAuthed()) return toastMsg("Connecte-toi d'abord");
    await loadParticipants();
    toastMsg("OK");
  });

  document.querySelectorAll(".nav-item").forEach((b) => {
    b.addEventListener("click", () => setView(b.dataset.view));
  });

  // filtres
  const reload = async () => {
    state.page = 1;
    await loadParticipants();
  };

  searchInput.addEventListener("input", debounce(reload, 250));
  enseigneSelect.addEventListener("change", reload);
  optinSelect.addEventListener("change", reload);
  sortSelect.addEventListener("change", reload);

  // pagination
  prevPageBtn.addEventListener("click", async () => {
    if (state.page <= 1) return;
    state.page--;
    await loadParticipants();
  });

  nextPageBtn.addEventListener("click", async () => {
    // on avance “optimiste” (si backend renvoie moins de rows => page vide)
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

function debounce(fn, wait) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

// ---------- Init
(async function init() {
  setAuthUi();
  wireEvents();
  setView("inscrits");

  if (isAuthed()) {
    try {
      await loadParticipants();
    } catch (e) {
      toastMsg("Token invalide, reconnecte-toi");
      clearToken();
      setAuthUi();
    }
  }
})();
