╔═══════════════════════════════════════════════════════════════════╗
║      GRAND JEU CHANDELEUR - VERSION AVEC PRODUITS                ║
║           Style Ambiance & Styles - Décembre 2025                 ║
╚═══════════════════════════════════════════════════════════════════╝

📦 CONTENU
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ index.html  - Structure avec conteneur produits
✓ style.css   - CSS avec styles produits
✓ script.js   - Logique avec produits par profil
✓ README.txt  - Documentation


🎯 NOUVEAUTÉ : PRODUITS PAR PROFIL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ AFFICHAGE DES PRODUITS RECOMMANDÉS
   • Chaque profil a ses produits spécifiques
   • 6-7 produits par profil
   • Images pour chaque produit
   • Liens directs vers Ambiance & Styles
   • Design moderne en cartes

✨ 3 PROFILS AVEC PRODUITS

1️⃣ LA CRÊPIÈRE QUI RASSEMBLE
   • Poêle à crêpes Mastrad
   • Plat de présentation
   • Spatules colorées
   • Verres colorés
   • Verres enfant
   • Beurrier

2️⃣ LE DUO CRÊPES-PARTY
   • Poêle à crêpes
   • Vaisselle Shadow Nacre
   • Mini ramequins
   • Shaker à crêpes
   • Tartineur
   • Moule 7 mini blinis

3️⃣ LA TRADITION QUI FAIT DU BIEN
   • Poêle à crêpes Mastrad
   • Louche inox
   • Bol à mixer
   • Râteau à crêpes
   • Plat à gâteau
   • Cuillère à miel
   • Spatule en hêtre


🎨 DESIGN DES PRODUITS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CARTE PRODUIT :
┌─────────────────────────────┐
│  ┌────┐                     │
│  │IMG │  Nom du produit     │
│  │70px│  Voir le produit →  │
│  └────┘                     │
└─────────────────────────────┘

CARACTÉRISTIQUES :
• Image 70x70px (60px mobile, 50px petit écran)
• Border 2px #E5E5E5
• Border-radius 12px
• Hover : border bordeaux + translateX(4px)
• Lien cliquable vers la page produit


📝 UTILISATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Ouvrez index.html dans un navigateur
2. Complétez les 3 jeux
3. Remplissez le formulaire
4. Découvrez votre profil + produits recommandés
5. Cliquez sur un produit pour l'acheter


🎮 PARCOURS COMPLET
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ JEU 1 - Memory
2️⃣ JEU 2 - Mots Mystères
3️⃣ JEU 3 - Quiz avec images
🎁 Formulaire
📦 Résultat : Profil + Produits recommandés


🔧 PERSONNALISATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Pour modifier les produits :
→ script.js, lignes 550-600 (produitsParProfil)

Structure d'un produit :
{
    nom: "Nom du produit",
    url: "https://ambianceetstyles.com/articles/...",
    image: "URL de l'image"
}

Pour modifier les images :
→ Remplacez les URLs Unsplash par vos propres images
→ Ou utilisez les images directement depuis votre site


📊 DONNÉES DU FICHIER EXCEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tous les produits du fichier Listing-produits-quizz.xlsx
ont été intégrés avec leurs liens Ambiance & Styles.

Images utilisées :
• Photos Unsplash thématiques
• Ustensiles de cuisine
• Vaisselle moderne
• Style cohérent avec le design


✨ TOUTES LES FONCTIONNALITÉS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Disposition CSS parfaite
✅ Responsive complet
✅ Images propres sans overlay vert
✅ Pas de labels (effet surprise)
✅ Image pour chaque question du quiz
✅ Animations modernes
✅ Produits recommandés par profil 🆕
✅ Images des produits 🆕
✅ Liens cliquables vers boutique 🆕


🎯 AFFICHAGE PAGE RÉSULTAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌──────────────────────────────┐
│         🎁                   │
│                              │
│   Votre Profil               │
│   La Crêpière qui Rassemble  │
│                              │
│   Description du profil...   │
│                              │
│   🛍️ Vos produits            │
│   recommandés                │
│                              │
│   ┌────────────────────┐    │
│   │ [IMG] Poêle à...   │    │
│   │       Voir →       │    │
│   └────────────────────┘    │
│                              │
│   ┌────────────────────┐    │
│   │ [IMG] Plat de...   │    │
│   │       Voir →       │    │
│   └────────────────────┘    │
│                              │
│   ... (6 produits)           │
│                              │
│   ┌──────────────┐           │
│   │   Rejouer    │           │
│   └──────────────┘           │
└──────────────────────────────┘


📱 RESPONSIVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Desktop (>480px) :
• Images produits : 70x70px
• Gap : 15px

Mobile (≤480px) :
• Images produits : 60x60px
• Gap : 10px

Petit (≤380px) :
• Images produits : 50x50px
• Gap : 10px


💡 NOTES IMPORTANTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Les produits sont cliquables et ouvrent dans un nouvel onglet
• Les images sont hébergées sur Unsplash (temporaire)
• Pour production : remplacer par vos propres images
• Les URLs des produits sont exactes (du fichier Excel)
• Chaque profil a entre 6 et 7 produits


🔗 SOURCES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Produits depuis : Listing-produits-quizz.xlsx (Sheet A&S)
Images : Unsplash (placeholder)
Liens : ambianceetstyles.com


═══════════════════════════════════════════════════════════════════

Design parfait, produits avec images - Prêt à l'emploi ! 🥞🛍️✨

═══════════════════════════════════════════════════════════════════
