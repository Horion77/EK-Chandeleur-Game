const ADMIN_APP = {
  API_BASE_URL: window.location.origin,

  ENDPOINTS: {
    loginCandidates: [
      "/api/admin/login",
      "/api/auth/admin",
      "/api/auth/login",
      "/admin/login"
    ],

    participantsCandidates: [
      "/api/participants",
      "/api/participants/list",
      "/api/participants/admin",
      "/participants",
      "/participants/list",
      "/participants/admin"
    ],

    deleteParticipantCandidates: [
      (id) => `/api/participants/${id}`,
      (id) => `/participants/${id}`
    ]
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
  participantsEndpoint: null,
  deleteEndpointFactory: null
};

// ---------- Utils
function toastMsg(message) {
  if (!toast) return alert(message);
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
  if (apiBaseUrlLabel) apiBaseUrlLabel.textContent = ADMIN_APP.API_BASE_URL;

  if (authStatusPill) {
    if (isAuthed()) {
      authStatusPill.textContent = "Connecté";
      authStatusPill.style.borderColor = "rgba(230, 57, 70,.40)";
      authStatusPill.style.color = "rgba(245,245,245,.85)";
    } else {
      authStatusPill.textContent = "Non connecté";
      authStatusPill.style.borderColor = "rgba(255,255,255,.08)";
      authStatusPill.style.color = "rgba(245,245,245,.65)";
    }
  }

  if (loginCard) loginCard.classList.toggle("hidden", isAuthed());

  if (inscritsCard) inscritsCard.classList.toggle("hidden", !(isAuthed() && state.view === "inscrits"));
  if (statsCard) statsCard.classList.toggle("hidden", !(isAuthed() && state.view === "stats"));
  if (testsCard) testsCard.classList.toggle("hidden", !(isAuthed() && state.view === "tests"));
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
    err.url = url;
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

// ---------- Data : résolution endpoint participants + delete
async function resolveParticipantsEndpoint() {
  if (state.participantsEndpoint) return state.participantsEndpoint;

  const testQuery = buildQuery({ page: 1, limit: 1 });

  for (const ep of ADMIN_APP.ENDPOINTS.participantsCandidates) {
    try {
      await apiFetch(`${ep}?${testQuery}`);
      state.participantsEndpoint = ep;

      state.deleteEndpointFactory = ep.startsWith("/api/")
        ? ADMIN_APP.ENDPOINTS.deleteParticipantCandidates[0]
        : ADMIN_APP.ENDPOINTS.deleteParticipantCandidates[1];

      return ep;
    } catch (e) {
      if (e.status === 404) continue;

      if (e.status === 401 || e.status === 403) {
        state.participantsEndpoint = ep;
        state.deleteEndpointFactory = ep.startsWith("/api/")
          ? ADMIN_APP.ENDPOINTS.deleteParticipantCandidates[0]
          : ADMIN_APP.ENDPOINTS.deleteParticipantCandidates[1];
        return ep;
      }

      continue;
    }
  }

  throw new Error(
    "Aucune route 'participants' trouvée côté serveur (GET /api/participants ou /participants). " +
    "Il faut ajouter la route de listing dans le backend."
  );
}

async function loadParticipants() {
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="9" class="muted">Chargement…</td></tr>`;

  const endpoint = await resolveParticipantsEndpoint();
  const [sortField, sortDir] = (sortSelect?.value || "created_at:desc").split(":");

  const query = buildQuery({
    page: state.page,
    limit: ADMIN_APP.PAGE_SIZE,
    q: searchInput?.value?.trim() || "",
    enseigne: enseigneSelect?.value || "",
    optin: optinSelect?.value || "",
    sort: sortField,
    dir: sortDir
  });

  const data = await apiFetch(`${endpoint}?${query}`);
  const { rows, total } = parseRowsAndTotal(data);

  state.rows = rows;
  state.total = total;
  state.selected.clear();
  if (selectAll) selectAll.checked = false;
  if (deleteSelectedBtn) deleteSelectedBtn.disabled = true;

  renderParticipants();
}

function renderParticipants() {
  const rows = state.rows || [];

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="9" class="muted">Aucun résultat.</td></tr>`;
    if (countLabel) countLabel.textContent = "0 inscrit";
    if (pageLabel) pageLabel.textContent = `Page ${state.page}`;
    return;
  }

  tbody.innerHTML = rows.map((p) => {
    const id = p.id ?? p.participant_id ?? p.uuid ?? "";
    const created = p.created_at ?? p.createdAt ?? p.date ?? "";
    const nom = p.nom ?? p.last_name ?? "";
    const prenom = p.prenom ?? p.first_name ?? "";
    const email = p.email ?? "";
    const enseigne = p.enseigne ?? "";
    const magasin = p.magasin ?? "";
    const profil = p.profil ?? "—";
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
        <td>${escapeHtml(magasin)}</td>
        <td>${escapeHtml(profil)}</td>
        <td>${escapeHtml(optinTxt)}</td>
      </tr>
    `;
  }).join("");

  if (countLabel) countLabel.textContent = `${state.total} inscrit${state.total > 1 ? "s" : ""}`;
  if (pageLabel) pageLabel.textContent = `Page ${state.page}`;

  tbody.querySelectorAll(".row-check").forEach((cb) => {
    cb.addEventListener("change", () => {
      const id = cb.dataset.id;
      if (cb.checked) state.selected.add(id);
      else state.selected.delete(id);

      if (deleteSelectedBtn) deleteSelectedBtn.disabled = state.selected.size === 0;
      if (selectAll) selectAll.checked = state.selected.size === state.rows.length;
    });
  });
}

// ---------- Actions
async function handleLogin(e) {
  e.preventDefault();
  if (loginMsg) loginMsg.textContent = "";

  try {
    const payload = {
      email: loginEmail.value.trim(),
      username: loginEmail.value.trim(),
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
        if (err.status === 404) continue;
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
    if (loginMsg) loginMsg.textContent = "Connexion refusée";
    toastMsg(`Login KO: ${err.message}`);
  }
}

async function exportCsv() {
  // Export en colonnes (chaque colonne sur sa ligne verticale dans le CSV)
  const headers = ["Date", "Nom", "Prénom", "Email", "Enseigne", "Magasin", "Profil", "Opt-in"];
  const lines = [headers.join(",")];

  (state.rows || []).forEach((p) => {
    const created = formatDate(p.created_at ?? p.createdAt ?? p.date ?? "");
    const nom = (p.nom ?? p.last_name ?? "");
    const prenom = (p.prenom ?? p.first_name ?? "");
    const email = (p.email ?? "");
    const enseigne = (p.enseigne ?? "");
    const magasin = (p.magasin ?? "");
    const profil = (p.profil ?? "");
    const optin = (p.opt_in ?? p.optin ?? p.marketing_optin) ? "oui" : "non";

    const row = [created, nom, prenom, email, enseigne, magasin, profil, optin]
      .map((v) => `"${String(v).replaceAll('"', '""')}"`)
      .join(",");
    lines.push(row);
  });

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `inscrits_page-${state.page}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
  
  toastMsg("Export CSV réussi !");
}

async function deleteSelected() {
  if (!state.selected.size) return;
  if (!confirm(`Supprimer ${state.selected.size} participant(s) ?`)) return;

  const ids = Array.from(state.selected);
  let ok = 0;

  const delFactory = state.deleteEndpointFactory || ADMIN_APP.ENDPOINTS.deleteParticipantCandidates[0];

  for (const id of ids) {
    try {
      await apiFetch(delFactory(id), { method: "DELETE" });
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
  if (crumbView) crumbView.textContent = label;
  if (pageTitle) pageTitle.textContent = label;

  setAuthUi();
  
  // ⭐ AJOUTE CES LIGNES
  if (view === 'stats' && isAuthed()) {
    loadStats();
  }
}


function debounce(fn, wait) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function wireEvents() {
  if (loginForm) loginForm.addEventListener("submit", handleLogin);

  if (logoutBtn) logoutBtn.addEventListener("click", () => {
    clearToken();
    state.participantsEndpoint = null;
    state.deleteEndpointFactory = null;
    setAuthUi();
    toastMsg("Déconnecté");
  });

  if (refreshBtn) refreshBtn.addEventListener("click", async () => {
    if (!isAuthed()) return toastMsg("Connecte-toi d'abord");
    try {
      await loadParticipants();
      toastMsg("Données rafraîchies !");
    } catch (e) {
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

  if (searchInput) searchInput.addEventListener("input", debounce(reload, 250));
  if (enseigneSelect) enseigneSelect.addEventListener("change", reload);
  if (optinSelect) optinSelect.addEventListener("change", reload);
  if (sortSelect) sortSelect.addEventListener("change", reload);

  if (prevPageBtn) prevPageBtn.addEventListener("click", async () => {
    if (state.page <= 1) return;
    state.page--;
    await loadParticipants();
  });

  if (nextPageBtn) nextPageBtn.addEventListener("click", async () => {
    state.page++;
    await loadParticipants();
  });

  if (selectAll) selectAll.addEventListener("change", () => {
    const checks = tbody.querySelectorAll(".row-check");
    state.selected.clear();

    checks.forEach((cb) => {
      cb.checked = selectAll.checked;
      if (cb.checked) state.selected.add(cb.dataset.id);
    });

    if (deleteSelectedBtn) deleteSelectedBtn.disabled = state.selected.size === 0;
  });

  if (exportCsvBtn) exportCsvBtn.addEventListener("click", exportCsv);
  if (deleteSelectedBtn) deleteSelectedBtn.addEventListener("click", deleteSelected);
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
// ============================================================
// STATS - Chargement et affichage
// ============================================================

async function loadStats() {
  try {
    const token = getToken(); // ✅ Utilise la fonction getToken() existante
    const enseigne = document.getElementById('statsEnseigneFilter')?.value || '';
    
    // Stats globales (participations)
    const globalRes = await apiFetch('/api/stats');
    const globalData = globalRes;
    
    // Stats clics produits
    const clicksRes = await apiFetch(
      `/api/stats/product-clicks${enseigne ? `?enseigne=${enseigne}` : ''}`
    );
    const clicksData = clicksRes;
    
    renderGlobalStats(globalData);
    renderTopProducts(clicksData.topProducts);
    renderClicksByProfil(clicksData.clicksByProfil);
    renderClickRate(clicksData.clickRate);
    renderTimeline(clicksData.clicksByDay);
    
  } catch (err) {
    console.error('Erreur chargement stats:', err);
    toastMsg('Erreur chargement stats'); // ✅ Utilise toastMsg existant
  }
}

function renderGlobalStats(data) {
  const container = document.getElementById('globalStatsContainer');
  if (!container) return;
  
  const { global, byEnseigne, byProfil } = data;
  
  container.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
      <div class="stat-card">
        <div class="stat-value">${global.total_participants}</div>
        <div class="stat-label">Participants totaux</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${global.all_levels_done_count}</div>
        <div class="stat-label">Ont terminé les 3 jeux</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${Math.round((global.all_levels_done_count / global.total_participants) * 100)}%</div>
        <div class="stat-label">Taux de complétion</div>
      </div>
    </div>
    
    <h4 style="margin: 20px 0 10px; font-size: 14px; color: var(--text-secondary);">Par enseigne</h4>
    <table class="table" style="margin-top: 10px;">
      <thead>
        <tr>
          <th>Enseigne</th>
          <th>Total</th>
          <th>Complétés</th>
          <th>Opt-in</th>
        </tr>
      </thead>
      <tbody>
        ${byEnseigne.map(e => `
          <tr>
            <td><strong>${e.enseigne}</strong></td>
            <td>${e.total}</td>
            <td>${e.completes} (${Math.round((e.completes/e.total)*100)}%)</td>
            <td>${e.opt_in_count} (${Math.round((e.opt_in_count/e.total)*100)}%)</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderTopProducts(products) {
  const container = document.getElementById('topProductsContainer');
  if (!container) return;
  
  if (!products || products.length === 0) {
    container.innerHTML = '<p class="muted">Aucun clic produit enregistré.</p>';
    return;
  }
  
  const maxClicks = products[0].clicks;
  
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 12px;">
      ${products.map((p, idx) => `
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="min-width: 30px; font-weight: 600; color: ${idx < 3 ? 'var(--accent)' : 'var(--text-secondary)'};">
            ${idx + 1}
          </div>
          <div style="flex: 1;">
            <div style="font-weight: 500;">${escapeHtml(p.product_name)}</div>
            <div style="font-size: 12px; color: var(--text-secondary);">${p.unique_users} utilisateurs uniques</div>
          </div>
          <div style="min-width: 80px; text-align: right; font-weight: 600;">
            ${p.clicks} clics
          </div>
          <div style="width: 200px; height: 8px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden;">
            <div style="width: ${(p.clicks/maxClicks)*100}%; height: 100%; background: var(--accent); transition: width 0.3s;"></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderClicksByProfil(profils) {
  const container = document.getElementById('clicksByProfilContainer');
  if (!container) return;
  
  if (!profils || profils.length === 0) {
    container.innerHTML = '<p class="muted">Aucune donnée.</p>';
    return;
  }
  
  const total = profils.reduce((sum, p) => sum + p.clicks, 0);
  
  container.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px;">
      ${profils.map(p => `
        <div class="stat-card">
          <div class="stat-value">${p.clicks}</div>
          <div class="stat-label">${escapeHtml(p.profil) || 'Non défini'}</div>
          <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
            ${Math.round((p.clicks/total)*100)}% du total
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderClickRate(rate) {
  const container = document.getElementById('clickRateContainer');
  if (!container) return;
  
  if (!rate) {
    container.innerHTML = '<p class="muted">Aucune donnée.</p>';
    return;
  }
  
  container.innerHTML = `
    <div style="display: flex; align-items: center; gap: 40px;">
      <div style="flex: 1;">
        <div style="font-size: 48px; font-weight: 700; color: var(--accent);">
          ${rate.taux_clic_pourcent}%
        </div>
        <div style="font-size: 14px; color: var(--text-secondary); margin-top: 8px;">
          ${rate.users_qui_cliquent} utilisateurs sur ${rate.total_participants} ont cliqué sur au moins un produit
        </div>
      </div>
      <div style="width: 200px; height: 200px; border-radius: 50%; background: conic-gradient(
        var(--accent) 0deg ${rate.taux_clic_pourcent * 3.6}deg,
        var(--bg-secondary) ${rate.taux_clic_pourcent * 3.6}deg 360deg
      ); display: flex; align-items: center; justify-content: center;">
        <div style="width: 160px; height: 160px; border-radius: 50%; background: var(--bg); display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700;">
          ${rate.taux_clic_pourcent}%
        </div>
      </div>
    </div>
  `;
}

function renderTimeline(days) {
  const container = document.getElementById('timelineContainer');
  if (!container) return;
  
  if (!days || days.length === 0) {
    container.innerHTML = '<p class="muted">Aucune donnée.</p>';
    return;
  }
  
  container.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Clics</th>
        </tr>
      </thead>
      <tbody>
        ${days.map(d => `
          <tr>
            <td>${new Date(d.jour).toLocaleDateString('fr-FR')}</td>
            <td>${d.clicks}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}


function renderGlobalStats(data) {
  const container = document.getElementById('globalStatsContainer');
  const { global, byEnseigne, byProfil } = data;
  
  container.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
      <div class="stat-card">
        <div class="stat-value">${global.total_participants}</div>
        <div class="stat-label">Participants totaux</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${global.all_levels_done_count}</div>
        <div class="stat-label">Ont terminé les 3 jeux</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${Math.round((global.all_levels_done_count / global.total_participants) * 100)}%</div>
        <div class="stat-label">Taux de complétion</div>
      </div>
    </div>
    
    <h4 style="margin: 20px 0 10px; font-size: 14px; color: var(--text-secondary);">Par enseigne</h4>
    <table class="table" style="margin-top: 10px;">
      <thead>
        <tr>
          <th>Enseigne</th>
          <th>Total</th>
          <th>Complétés</th>
          <th>Opt-in</th>
        </tr>
      </thead>
      <tbody>
        ${byEnseigne.map(e => `
          <tr>
            <td><strong>${e.enseigne}</strong></td>
            <td>${e.total}</td>
            <td>${e.completes} (${Math.round((e.completes/e.total)*100)}%)</td>
            <td>${e.opt_in_count} (${Math.round((e.opt_in_count/e.total)*100)}%)</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderTopProducts(products) {
  const container = document.getElementById('topProductsContainer');
  if (!products || products.length === 0) {
    container.innerHTML = '<p class="muted">Aucun clic produit enregistré.</p>';
    return;
  }
  
  const maxClicks = products[0].clicks;
  
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 12px;">
      ${products.map((p, idx) => `
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="min-width: 30px; font-weight: 600; color: ${idx < 3 ? 'var(--accent)' : 'var(--text-secondary)'};">
            ${idx + 1}
          </div>
          <div style="flex: 1;">
            <div style="font-weight: 500;">${p.product_name}</div>
            <div style="font-size: 12px; color: var(--text-secondary);">${p.unique_users} utilisateurs uniques</div>
          </div>
          <div style="min-width: 80px; text-align: right; font-weight: 600;">
            ${p.clicks} clics
          </div>
          <div style="width: 200px; height: 8px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden;">
            <div style="width: ${(p.clicks/maxClicks)*100}%; height: 100%; background: var(--accent); transition: width 0.3s;"></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderClicksByProfil(profils) {
  const container = document.getElementById('clicksByProfilContainer');
  if (!profils || profils.length === 0) {
    container.innerHTML = '<p class="muted">Aucune donnée.</p>';
    return;
  }
  
  const total = profils.reduce((sum, p) => sum + p.clicks, 0);
  
  container.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px;">
      ${profils.map(p => `
        <div class="stat-card">
          <div class="stat-value">${p.clicks}</div>
          <div class="stat-label">${p.profil || 'Non défini'}</div>
          <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
            ${Math.round((p.clicks/total)*100)}% du total
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderClickRate(rate) {
  const container = document.getElementById('clickRateContainer');
  if (!rate) {
    container.innerHTML = '<p class="muted">Aucune donnée.</p>';
    return;
  }
  
  container.innerHTML = `
    <div style="display: flex; align-items: center; gap: 40px;">
      <div style="flex: 1;">
        <div style="font-size: 48px; font-weight: 700; color: var(--accent);">
          ${rate.taux_clic_pourcent}%
        </div>
        <div style="font-size: 14px; color: var(--text-secondary); margin-top: 8px;">
          ${rate.users_qui_cliquent} utilisateurs sur ${rate.total_participants} ont cliqué sur au moins un produit
        </div>
      </div>
      <div style="width: 200px; height: 200px; border-radius: 50%; background: conic-gradient(
        var(--accent) 0deg ${rate.taux_clic_pourcent * 3.6}deg,
        var(--bg-secondary) ${rate.taux_clic_pourcent * 3.6}deg 360deg
      ); display: flex; align-items: center; justify-content: center;">
        <div style="width: 160px; height: 160px; border-radius: 50%; background: var(--bg); display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700;">
          ${rate.taux_clic_pourcent}%
        </div>
      </div>
    </div>
  `;
}

function renderTimeline(days) {
  const container = document.getElementById('timelineContainer');
  if (!days || days.length === 0) {
    container.innerHTML = '<p class="muted">Aucune donnée.</p>';
    return;
  }
  
  container.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Clics</th>
        </tr>
      </thead>
      <tbody>
        ${days.map(d => `
          <tr>
            <td>${new Date(d.jour).toLocaleDateString('fr-FR')}</td>
            <td>${d.clicks}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// Event listener pour le filtre enseigne dans Stats
const statsFilter = document.getElementById('statsEnseigneFilter');
if (statsFilter) {
  statsFilter.addEventListener('change', () => {
    if (state.view === 'stats' && isAuthed()) { // ✅ Utilise state.view
      loadStats();
    }
  });
}
