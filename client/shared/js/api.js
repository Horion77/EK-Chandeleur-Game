window.API = {
  async createParticipant(payload) {
    const r = await fetch(`${window.APP_CONFIG.API_BASE_URL}/api/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, enseigne: window.APP_CONFIG.ENSEIGNE })
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }
};
