// API partagée : appels réseau vers le backend
window.API = {
  async createParticipant(payload) {
    const url = `${window.APP_CONFIG.API_BASE_URL}/api/participants`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        enseigne: window.APP_CONFIG.ENSEIGNE
      })
    });

    if (!response.ok) {
      // Le backend renvoie souvent un message texte en cas d'erreur
      const msg = await response.text();
      throw new Error(msg || "Erreur API createParticipant");
    }

    return response.json();
  }
};
