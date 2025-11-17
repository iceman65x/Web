const JSON_FILE = 'data.json';
const outputElement = document.getElementById('vysledny-dokument');
const checkboxIds = [
    "nedostatok_serverovna", "nedostatok_dimovy_hlasic", "nedostatok_bezpecnostne_dvere", 
    "nedostatok_zalozne_napajanie", "nedostatok_antivirus", "nedostatok_zalohy_offsite", 
    "nedostatok_vpn", "nedostatok_kamery", "nedostatok_hesla", 
    "nedostatok_audit"
];

/**
 * Načíta JSON súbor.
 */
async function nacitatData() {
    try {
        const response = await fetch(JSON_FILE);
        if (!response.ok) {
            throw new Error(`Chyba pri načítaní ${JSON_FILE}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Nastala chyba pri načítaní dát:", error);
        outputElement.textContent = `CHYBA: Nepodarilo sa načítať dátovú šablónu (${error.message}).`;
        return null;
    }
}

/**
 * Hlavná funkcia na generovanie dokumentu (iba textový výstup na web).
 */
async function generovatDokument() {
    outputElement.textContent = "Generujem dokument, čakajte...";
    
    const data = await nacitatData();
    if (!data) return;

    // 1. Získanie stavu všetkých checkboxov a nájdenie ZISTENÍ
    const zisteneNedostatky = [];

    checkboxIds.forEach(id => {
        const checkbox = document.getElementById(id);
        const otazkaDiv = checkbox.closest('.otazka');

        if (checkbox && checkbox.checked) {
            // True znamená PROBLÉM/NEDOSTATOK - vyhľadáme zodpovedajúce zistenie z JSONu
            const zistenie = data.zistenia.find(z => z.id === id);
            if (zistenie) {
                zisteneNedostatky.push(zistenie);
            }
            if (otazkaDiv) otazkaDiv.classList.remove('ok');
        } else {
            // False znamená, že PROBLÉM NIE JE
            if (otazkaDiv) otazkaDiv.classList.add('ok');
        }
    });

    // 2. Skladanie výsledného TEXTOVÉHO VÝSTUPU
    let finalDocument = data.uvod;
    let pocetZistenychRizik = zisteneNedostatky.length;

    finalDocument += `\n*** Celkový počet zistených rizík: ${pocetZistenychRizik} ***\n\n`;

    if (pocetZistenychRizik > 0) {
        finalDocument += data.sekcia_zistenia_hlavicka;
        
        zisteneNedostatky.forEach((z, index) => {
            finalDocument += `\n=======================================================\n`;
            finalDocument += `ZISTENIE ${index + 1}: ${z.nazov}\n`;
            finalDocument += `=======================================================\n`;
            finalDocument += `\n-> KONTROLA ISO: ${z.kod} ${z.norma_odkaz}\n`;
            finalDocument += `\n   Relevantná pasáž z ISO: \n   "${z.norma_pasaz}"\n`;
            finalDocument += `\n   ODPORÚČANIE: ${z.odporucanie}\n`;
        });
        finalDocument += `\n=======================================================\n`;
        
    } else {
        finalDocument += data.sekcia_bez_rizik;
    }
    
    // 3. Zobrazenie výsledku
    outputElement.textContent = finalDocument;

    // Kód pre generovanie PDF bol odstránený/zakomentovaný, 
    // aby sa výstup generoval iba na web.
    // if (zisteneNedostatky.length > 0) {
    //     vytvoritPDF(data.uvod, zisteneNedostatky); 
    // } 
}


// Spustenie funkcie na DOMContentLoaded na nastavenie počiatočného textu a listenerov
document.addEventListener('DOMContentLoaded', () => {
    outputElement.textContent = "Systém pripravený. Zaškrtnite voľby, kde existuje PROBLÉM/RIZIKO.";
    
    // Pridanie Event Listeners na checkboxy pre vizuálnu spätnú väzbu
    checkboxIds.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', (event) => {
                const otazkaDiv = event.target.closest('.otazka');
                if (otazkaDiv) {
                    if (event.target.checked) {
                        otazkaDiv.classList.remove('ok'); // Ak je True (problém), zrušíme zelenú
                    } else {
                        otazkaDiv.classList.add('ok'); // Ak je False (nie je problém), dáme zelenú
                    }
                }
            });
            // Nastavenie počiatočného stavu
            if (!checkbox.checked) {
                checkbox.closest('.otazka')?.classList.add('ok');
            }
        }
    });
});

// POZNÁMKA: Ak chcete, aby kód fungoval, musíte v súbore 'index.html' odstrániť alebo zakomentovať 
// riadky s volaním PDF knižníc:
// <script src='https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.70/pdfmake.min.js'></script>
// <script src='https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.70/vfs_fonts.js'></script>