const JSON_FILE = 'data.json';
const outputElement = document.getElementById('vysledny-dokument');

// 1. Definovanie Kvalitatívnej Matice a Opatrení priamo v JS
const KVALITATIVNA_METRIKA = {
    // Definícia matice z NBÚ 2.0 (kap. 5.3.3) pre zistenie úrovne R. 
    // Kľúče: Pravdepodobnosť / Hodnota Následku -> Výsledné Riziko
    MATICA_HODNOTENIA: {
        "Veľmi vysoká": { "Zanedbateľný": "Stredné", "Malý": "Stredné", "Stredný": "Vysoké", "Závažný": "Veľmi vysoké", "Katastrofický": "Veľmi vysoké" },
        "Vysoká": { "Zanedbateľný": "Stredné", "Malý": "Stredné", "Stredný": "Vysoké", "Závažný": "Vysoké", "Katastrofický": "Veľmi vysoké" },
        "Stredná": { "Zanedbateľný": "Nízke", "Malý": "Stredné", "Stredný": "Stredné", "Závažný": "Vysoké", "Katastrofický": "Vysoké" },
        "Nízka": { "Zanedbateľný": "Veľmi nízke", "Malý": "Nízke", "Stredný": "Stredné", "Závažný": "Stredné", "Katastrofický": "Stredné" },
        "Veľmi nízka": { "Zanedbateľný": "Veľmi nízke", "Malý": "Veľmi nízke", "Stredný": "Nízke", "Závažný": "Nízke", "Katastrofický": "Stredné" }
    },
    // Požadované akcie ošetrenia (kap. 8.2)
    OPATRENIA: {
        "Veľmi vysoké": "Rozšírené a dodatočné bezpečnostné opatrenia sú bezpodmienečne nutné a je nutné prijať ich bezodkladne. Výkon kľúčových procesov a ďalšia prevádzka systému je podmienená prijatím opatrení.",
        "Vysoké": "Rozšírené a dodatočné bezpečnostné opatrenia sú potrebné a mali by byť prijaté v dohľadnej dobe, ktorú určí vlastník rizika.",
        "Stredné": "Rozšírené, príp. dodatočné bezpečnostné opatrenia sú potrebné a mali by byť prijaté v dobe, ktorú určí vlastník rizika.",
        "Nízke": "Vlastník aktíva musí stanoviť, či je nutné prijať rozšírené bezpečnostné opatrenia, alebo či v minulosti prijaté opatrenia sú ešte potrebné. Riziko je možné akceptovať ako prijateľné len v prípade, že boli prijaté rozšírené bezpečnostné opatrenia.",
        "Veľmi nízke": "Nie je nutné prijať dodatočné ani rozšírené bezpečnostné opatrenia. Riziko je možné akceptovať ako prijateľné."
    },
    // Pomocná funkcia na určenie priority (pre triedenie výstupu)
    PRIORITY_MAP: ["Veľmi nízke", "Nízke", "Stredné", "Vysoké", "Veľmi vysoké"]
};


/**
 * Načíta dáta zo súboru data.json.
 */
async function nacitatData() {
    try {
        const response = await fetch(JSON_FILE);
        if (!response.ok) {
            throw new Error(`Chyba pri načítaní ${JSON_FILE}: ${response.statusText}`);
        }
        
        const text = await response.text();
        const data = JSON.parse(text);

        // Získanie všetkých ID z JSONu pre inicializáciu
        return {
            metadata: data.metadata,
            rizika: data.rizika,
            checkboxIds: data.rizika.map(r => r.id)
        };

    } catch (error) {
        console.error("Nastala chyba pri načítaní alebo parsovaní dát:", error);
        outputElement.textContent = `CHYBA: Nepodarilo sa načítať dátovú šablónu alebo je v nej syntaktická chyba (${error.message}).`;
        return null;
    }
}


/**
 * Určí úroveň rizika na základe hodnôt Následok a Pravdepodobnosť pomocou matice.
 * @param {string} pNazov - Slovná hodnota Pravdepodobnosti (napr. "Vysoká")
 * @param {string} dNazov - Slovná hodnota Následku (napr. "Závažný")
 * @returns {string} Slovná úroveň výsledného rizika (napr. "Veľmi vysoké")
 */
function urcitUrovenRizika(pNazov, dNazov) {
    const matica = KVALITATIVNA_METRIKA.MATICA_HODNOTENIA;
    
    if (matica[pNazov] && matica[pNazov][dNazov]) {
        return matica[pNazov][dNazov];
    }
    return "Nešpecifikované"; // Ak kombinácia neexistuje v matici (chyba v JSON)
}


/**
 * Hlavná funkcia na generovanie dokumentu.
 */
async function generovatDokument() {
    outputElement.textContent = "Generujem dokument, čakajte...";

    const data = await nacitatData();
    if (!data) return;

    let finalDocument = data.metadata.uvod;
    let celkovyPocetRizik = 0;
    let zisteneRizika = [];

    // 1. Iterácia cez dáta z JSONu
    data.rizika.forEach(rizikoDef => {
        const checkbox = document.getElementById(rizikoDef.id);
        const otazkaDiv = checkbox ? checkbox.closest('.otazka') : null;

        const jeProblem = checkbox ? checkbox.checked : false;

        if (otazkaDiv) {
            jeProblem ? otazkaDiv.classList.remove('ok') : otazkaDiv.classList.add('ok');
        }

        // 2. Iba ak existuje problém (True), ohodnotíme riziko
        if (jeProblem) {
            celkovyPocetRizik++;
            
            const pPriProbleme = rizikoDef.pravdepodobnost_pri_probleme;
            const dNastaveny = rizikoDef.nasledok_nastaveny;

            // Výpočet výsledného rizika pomocou matice
            const urovenRizika = urcitUrovenRizika(pPriProbleme, dNastaveny);
            
            // Priradenie akcie a sformovanie objektu pre výstup
            zisteneRizika.push({
                ...rizikoDef,
                pravdepodobnost: pPriProbleme,
                nasledok: dNastaveny,
                uroven_rizika: urovenRizika,
                akcia_opatrenia: KVALITATIVNA_METRIKA.OPATRENIA[urovenRizika] || "N/A - Úroveň rizika je mimo definovanej škály NBÚ."
            });
        }
    });

    // 3. Triedenie rizík od najvyššej po najnižšiu (NBÚ 8.2)
    zisteneRizika.sort((a, b) => 
        KVALITATIVNA_METRIKA.PRIORITY_MAP.indexOf(b.uroven_rizika) - KVALITATIVNA_METRIKA.PRIORITY_MAP.indexOf(a.uroven_rizika)
    );

    // 4. Skladanie textového výstupu
    finalDocument += `*** Celkový počet zistených nedostatkov: ${celkovyPocetRizik} ***\n\n`;

    if (zisteneRizika.length > 0) {
        finalDocument += "### Zistené a ohodnotené scenáre rizík (Vyžadujú Ošetrenie)\n";
        finalDocument += "Riziká sú zoradené pre ošetrovanie **od najvyššej závažnosti po najnižšiu** (v súlade s požiadavkou kap. 8.2 Metodiky NBÚ).\n";
        
        zisteneRizika.forEach((r, index) => {
            finalDocument += `\n=======================================================\n`;
            finalDocument += `RIZIKO ${index + 1}: ${r.nazov}\n`;
            finalDocument += `=======================================================\n`;
            
            finalDocument += `-> KONTROLA: ISO/IEC 27002:2022 / ${r.kod_iso}\n`;
            finalDocument += `-> SCENÁR RIZIKA: ${r.otazka_kontext}\n`;
            finalDocument += `-> PRAVDEPODOBNOSŤ (P): ${r.pravdepodobnost}\n`;
            finalDocument += `-> NÁSLEDOK (D): ${r.nasledok}\n`;
            finalDocument += `-> VÝSLEDNÉ RIZIKO (R): **${r.uroven_rizika}**\n\n`;
            finalDocument += `   AKCIA (NBÚ, kap. 8.2): ${r.akcia_opatrenia}\n`;
            finalDocument += `   OŠETRENIE: ${r.odporucanie}\n`;
        });
        finalDocument += `\n=======================================================\n`;
        
    } else {
        finalDocument += "### Žiadne zistenia\n";
        finalDocument += "Neboli zistené žiadne nedostatky v kontrolách. Nie je nutné prijať dodatočné ani rozšírené bezpečnostné opatrenia. Riziko je možné akceptovať ako prijateľné (Veľmi nízke riziko).";
    }
    
    outputElement.textContent = finalDocument;
}


// Pridanie Event Listeners (inicializácia po načítaní DOM)
document.addEventListener('DOMContentLoaded', async () => {
    outputElement.textContent = "Systém pripravený. Načítavam dáta rizík...";

    const initialData = await nacitatData();
    if (initialData) {
        outputElement.textContent = "Systém pripravený. Zaškrtnite voľby, kde existuje PROBLÉM/RIZIKO.";

        // Pridanie Event Listeners pre všetky ID načítané z JSONu
        initialData.checkboxIds.forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox) {
                checkbox.addEventListener('change', () => generovatDokument());
                
                // Nastavenie počiatočného stavu (pre vizuálnu spätnú väzbu)
                const otazkaDiv = checkbox.closest('.otazka');
                if (!checkbox.checked && otazkaDiv) {
                    otazkaDiv.classList.add('ok');
                }
            }
        });
    }
});