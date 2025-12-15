"""
Profil: RFA Fournisseurs

Logique:
- 1 ligne source = 1 TI + N LI (N = nombre de colonnes remise remplies)
- 4 types de remises possibles par ligne
- Colonnes fixes (U-V, W-X, Y-Z, AA-AB)
- Conversion Code Fournisseur (chiffres → lettres)
"""
import re
from decimal import Decimal

from profiles.base import BaseProfile
from profiles import register_profile
from utils.helpers import normalize_str, normalize_number, get_cell_value_raw


# ==============================================================================
# TABLE DE CORRESPONDANCE CODE FOURNISSEUR
# ==============================================================================
# Si le code lu est un chiffre (ex: 67001), on le convertit en lettres (FAJARD)

CODE_FOURNISSEUR_MAPPING = {
    # Format: "code_chiffre": "code_C_lettres"
    "67001": "CBROSS",      # ANDREE JARDIN
    "68482": "CALASK",      # ALASKAN
    "6058": "CALESSIF",     # ALESSI
    "62422": "CARCOS",      # ARCOS FRANCE
    "66521": "CBALVI",      # BALVI GIFTS
    "7146": "CBASTIDE",     # BASTIDE
    "4936": "CBEKA",        # BEKA
    "9992": "CBERGER",      # PRODUITS BERGER
    "66172": "CBILLIET",    # BILLIET VANLAERE BVT SA
    "2448": "CBRABAN",      # BRABANTIA
    "1417": "CBUGATTI",     # BUGATTI
    "9448": "CCADES",       # CADES
    "65345": "CCADRA",      # CADR'AVEN
    "63384": "CCARAMB",     # CARAMBELLE SAS
    "66203": "CCPROV",      # COLLINES DE PROVENCE
    "66851": "CCOFAR",      # COOKUT
    "1909": "CCOUZON",      # AMEFA
    "5479": "CCRISTEL",     # CRISTEL
    "63302": "CCUISINA",    # CUISINART - BABYLISS
    "1679": "CDEBUYER",     # DEBUYER
    "67339": "CDEEJO",      # CORIOLIS Sarl - marque DEEJO
    "2331": "CDEGLON",      # DEGLON SAS
    "1644": "CDERRIER",     # DERRIERE LA PORTE
    "927": "CEDELWEI",      # DRIMMER / GROUPE EDELWEISS
    "68264": "CEASYL",      # EASY LIFE
    "65002": "CEMILE",      # EMILE&CO
    "66111": "CESTEBAN",    # ESTEBAN
    "68591": "CFANDH",      # F&H
    "70522": "CFINE",       # FINE DINING LIVING
    "9816": "CGUZZINI",     # GUZZINI
    "9584": "CGEFU",        # GEFU
    "4959": "CMACRAND",     # GILDE MACRANDER
    "4943": "CGLASKDE",     # GLASKOCH/LEONARDO
    "2957": "CGRSEB",       # GROUPE SEB France
    "67322": "CJOLIPA",     # JOLIPA
    "67437": "CKAIF",       # KAI France
    "9769": "CKECKL",       # KELA KECK&LANG
    "64105": "CKITCR",      # Kitchen Craft (Nouv. 10)
    "2789": "CLACOR",       # LACOR - EXPORT
    "3257": "CCREUSET",     # LE CREUSET
    "69125": "CLESJA",      # LES JARDINS DE LA COMTESSE
    "9322": "CMARKHB",      # MARKhBHEIN-KIBIC
    "3630": "CMASTRAD",     # MASTRAD
    "66355": "CMICRO",      # MICROPLANE INTERNATIONAL
    "65048": "CMONBENT",    # MONBENTO
    "4016": "CN2J",         # N2J
    "1483": "CNOGENT",      # NOGENT 3 ETOILES
    "3030": "COPINEL",      # OPINEL
    "2955": "COPTIP",       # OPTIPLAST
    "66373": "CPATISSE",    # PATISSE
    "67595": "CPRESENT",    # PRESENT TIME BV
    "9292": "CPSP",         # PEUGEOT
    "66352": "CPOINT",      # LIVWISE - POINT VIRGULE
    "68465": "CQWETC",      # QWETCH
    "63139": "CREISEN",     # REISENTHEL
    "1966": "CRIVIERA",     # RIVIERA & BAR (ARB)
    "70156": "CROSET",      # ROSE ET TULAPINI
    "68282": "CROSLE",      # ROSLE
    "9382": "CROUSSEL",     # ROUSSELON DUMAS SABATIER
    "67942": "CSILIKO",     # SILIKOMART
    "65386": "CSOCAD",      # SOCADIS SAS
    "3211": "CTELLIER",     # TELLIER GOBEL
    "69876": "CTERDO",      # TERDO
    "70476": "CTRAMO",      # TRAMO
    "4109": "CUMBRA",       # UMBRA
    "4956": "CVB",          # VILLEROY & BOCH
    "64776": "CVERDIER",    # VERDIER ANDRE S.A. COUTELLERIE
    "65109": "CWARMCOOK",   # WARMCOOK Sarl
    "62470": "CWESTMARK",   # WESTMARK-SALEEN
    "2026": "CWINKLER",     # WINKLER SDE
    "65904": "CNWOLL",      # NORBERT WOLL
    "70022": "CWUSTH",      # WUSTHOF
    "70087": "CCECOA",      # SARL CECOA DIF/ZIIPA
    "2182": "CSTAUB",       # ZWILLING STAUB
    "2992": "CKUCHEN",      # KUCHENPROFI
    "69103": "CMEPRA",      # MEPRA SPA
    "70669": "CCIS",        # CONCEPT INTERNATIONAL SERVICES
    "64001": "CALMAM",      # ALMAM
}


# ==============================================================================
# CONSTANTES SPÉCIFIQUES AU PROFIL RFA FOURNISSEURS
# ==============================================================================

# Mapping des colonnes (index 0-based)
COLONNES_FIXES = {
    "code_client": 2,        # Col C (Numéro Fournisseur)
    "remise_enseigne_pct": 20,   # Col U
    "remise_enseigne_eur": 21,   # Col V
    "remise_privilege_pct": 22,  # Col W
    "remise_privilege_eur": 23,  # Col X
    "rfa_fixe_pct": 24,          # Col Y
    "rfa_fixe_eur": 25,          # Col Z
    "participation_pct": 26,     # Col AA
    "participation_eur": 27      # Col AB
}

# Mapping des articles par type de remise
ARTICLES_REMISES = {
    "enseigne": "FEKRFA-2",
    "privilege": "FEKRFA-3",
    "fixe": "FEKRFA-1",
    "participation": "FEKP-1"
}


def convertir_code_fournisseur(code_brut) -> str:
    """
    Convertit un code fournisseur chiffre en lettres.

    Exemples:
        67001 → FAJARD
        "67001" → FAJARD
        FAJARD → FAJARD (inchangé si déjà en lettres)
    """
    if not code_brut:
        return ""

    # Convertir en string et nettoyer
    code_str = str(code_brut).strip()

    # Si c'est déjà en lettres, retourner tel quel
    if not code_str.isdigit():
        return code_str

    # Chercher dans la table de correspondance
    code_lettres = CODE_FOURNISSEUR_MAPPING.get(code_str)

    if code_lettres:
        return code_lettres
    else:
        # Si pas trouvé, retourner le code original avec un warning
        # (tu peux logger ici si besoin)
        return code_str


@register_profile
class RFAFournisseursProfile(BaseProfile):
    """Profil pour les RFA Fournisseurs."""

    name = "RFA Fournisseurs"
    description = "Import des remises RFA fournisseurs avec colonnes fixes"
    has_ti_navigator = False  # Pas de navigateur pour ce profil

    default_ti_values = {
        "TypeClient": "En compte",
        "TypeTicket": "Facture",   
        "Depot": "PRI",
        "Reference": "RFA FOURNISSEURS",
        "CodeClient": "...",
        "NumeroBL": "",               # Vide
        "Date": "..."                 # Éditable
    }

    # Code Client est rempli auto, Date est éditable
    disabled_fields = ["CodeClient", "NumeroBL"]

    def get_column_mapping(self, header_columns: dict[int, str]) -> dict:
        """
        Retourne le mapping fixe des colonnes.
        Pas de détection auto, on utilise les index fixes.
        """
        return COLONNES_FIXES.copy()

    def analyze(self, ws, header_row_index: int, mapping: dict) -> dict:
        """Compte les lignes et les remises."""
        unique_clients = set()
        li_count = 0
        ti_count = 0
        errors = []

        min_row_to_read = header_row_index + 2

        for row in ws.iter_rows(min_row=min_row_to_read):
            # Lire le code client
            client_val = get_cell_value_raw(row, mapping["code_client"])

            if not client_val:
                continue  # Ligne vide

            ti_count += 1

            # Convertir chiffre → lettres
            client_code = convertir_code_fournisseur(client_val)
            if client_code:
                unique_clients.add(client_code)

            # Compter les LI (remises remplies)
            remises = [
                get_cell_value_raw(row, mapping["remise_enseigne_eur"]),
                get_cell_value_raw(row, mapping["remise_privilege_eur"]),
                get_cell_value_raw(row, mapping["rfa_fixe_eur"]),
                get_cell_value_raw(row, mapping["participation_eur"])
            ]

            for remise_val in remises:
                remise_num = normalize_number(remise_val)
                if remise_num is not None and remise_num != 0:
                    li_count += 1

        return {
            "stats": {
                "unique_clients_count": len(unique_clients),
                "total_li_count": li_count
            },
            "detected_ti_list": [],  # Pas de navigateur
            "errors": errors
        }

    def generate(self, ws_in, ws_out, header_row_index: int, 
                 mapping: dict, ti_data: dict) -> dict:
        """Génère 1 TI + N LI par ligne source."""

        row_count_ti = 0
        row_count_li = 0
        min_row_to_read = header_row_index + 2

        for row in ws_in.iter_rows(min_row=min_row_to_read):
            # Lire le code client
            client_val = get_cell_value_raw(row, mapping["code_client"])

            if not client_val:
                continue  # Ligne vide

            # 🔥 CONVERSION CHIFFRES → LETTRES
            client_code = convertir_code_fournisseur(client_val)

            # Liste pour stocker les LI à générer pour cette ligne
            li_list = []

            # Scanner les 4 types de remises
            remises_config = [
                ("enseigne", mapping["remise_enseigne_pct"], mapping["remise_enseigne_eur"]),
                ("privilege", mapping["remise_privilege_pct"], mapping["remise_privilege_eur"]),
                ("fixe", mapping["rfa_fixe_pct"], mapping["rfa_fixe_eur"]),
                ("participation", mapping["participation_pct"], mapping["participation_eur"])
            ]

            for remise_type, col_pct, col_eur in remises_config:
                montant_val = get_cell_value_raw(row, col_eur)
                montant_num = normalize_number(montant_val)

                if montant_num is None or montant_num == 0:
                    continue  # Pas de remise de ce type

                # Lire le pourcentage
                pct_val = get_cell_value_raw(row, col_pct)
                pct_num = normalize_number(pct_val)

                # Convertir % en décimal (2,00% → 0.0200)
                if pct_num is not None:
                    pct_decimal = pct_num / 100  # 2.0 → 0.02
                else:
                    pct_decimal = 0.0

                # Stocker la LI
                li_list.append({
                    "article": ARTICLES_REMISES[remise_type],
                    "quantite": float(pct_decimal),      # 🔥 POURCENTAGE EN QUANTITÉ
                    "prix": float(montant_num),          # 🔥 MONTANT € EN PRIX
                })

            # Si aucune remise, on skip cette ligne
            if not li_list:
                continue

            # Générer la TI
            row_count_ti += 1
            ti_line = [
                "TI",
                client_code,  
                ti_data.get("TypeClient"),
                ti_data.get("TypeTicket"),
                ti_data.get("Date"),
                ti_data.get("Depot"),
                ti_data.get("NumeroBL") or "",
                ti_data.get("Reference")
            ]
            ws_out.append(ti_line)
            self.apply_ti_style(ws_out, ws_out.max_row)

            # Générer les LI
            for li_data in li_list:
                row_count_li += 1
                li_line = [
                    "LI",
                    "Article",
                    li_data["article"],     # FEKRFA-2, FEKRFA-3, etc.
                    li_data["quantite"],    # 🔥 Col D = Pourcentage (0.0200)
                    li_data["prix"],        # 🔥 Col E = Montant € (375.36)
                    0,                      # 🔥 Col F = Remise (0)
                    None,
                    None
                ]
                ws_out.append(li_line)

        self.set_column_widths(ws_out)

        return {"ti_count": row_count_ti, "li_count": row_count_li}