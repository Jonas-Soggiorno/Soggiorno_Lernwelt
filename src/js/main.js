import {worldData} from './world.js';
import {overviewPaths} from './overviewPaths.js'

//===GLOBALE VARIABLEN===
const levelOrder = ["A1_1", "A1_2", "A1_3"];
let appState = {
    levels: {
        "A1_1": { 
            status: 'unlocked',
            chapters:[
                { id: 'trieste', visited: false, completed: false},
                { id: 'udine', visited: false, completed: false},
                { id: 'valdobbiadene', visited: false, completed: false},
                { id: 'bassano_del_grappa', visited: false, completed: false},
                { id: 'venezia', visited: false, completed: false},
                { id: 'vicenza', visited: false, completed: false},
                { id: 'verona', visited: false, completed: false},
                { id: 'sirmione', visited: false, completed: false},
                { id: 'monza', visited: false, completed: false},
                { id: 'milano', visited: false, completed: false}
            ]
        },
        "A1_2": {
            status: 'locked',
            chapters: [
                { id: 'torino', visited: false, completed: false },
                { id: 'asti', visited: false, completed: false },
                { id: 'alba', visited: false, completed: false },
                { id: 'acqui terme', visited: false, completed: false },
                { id: 'sanremo', visited: false, completed: false },
                { id: 'imperia', visited: false, completed: false },
                { id: 'genova', visited: false, completed: false },
                { id: 'camogli', visited: false, completed: false },
                { id: 'la spezia', visited: false, completed: false },
                { id: 'riomaggiore', visited: false, completed: false }
            ]
        },
        "A1_3": {
            status: 'locked',
            chapters: [
                { id: 'parma', visited: false, completed: false },
                { id: 'ferrara', visited: false, completed: false},
                { id: 'bologna', visited: false, completed: false },
                { id: 'rimini', visited: false, completed: false },
                { id: 'san marino', visited: false, completed: false },
                { id: 'arezzo', visited: false, completed: false },
                { id: 'firenze', visited: false, completed: false },
                { id: 'montecatini terme', visited: false, completed: false },
                { id: 'lucca', visited: false, completed: false },
                { id: 'pisa', visited: false, completed: false }
            ]
        },
        "A2_1": {
            status: 'locked',
            chapters: [
                { id: 'san gimignano', visited: false, completed: false },
                { id: 'siena', visited: false, completed: false},
                { id: 'perugia', visited: false, completed: false },
                { id: 'assissi', visited: false, completed: false },
                { id: 'spoleto', visited: false, completed: false },
                { id: 'l aquila', visited: false, completed: false },
                { id: 'sulmona', visited: false, completed: false },
                { id: 'pescara', visited: false, completed: false },
                { id: 'città di vaticano', visited: false, completed: false },
                { id: 'roma', visited: false, completed: false }
            ]
        },
        "A2_2": {
            status: 'locked',
            chapters: [
                { id: 'napoli', visited: false, completed: false },
                { id: 'pompei', visited: false, completed: false},
                { id: 'sorrento', visited: false, completed: false },
                { id: 'capri', visited: false, completed: false },
                { id: 'positano', visited: false, completed: false },
                { id: 'ravello', visited: false, completed: false },
                { id: 'salerno', visited: false, completed: false },
                { id: 'bari', visited: false, completed: false },
                { id: 'ostuni', visited: false, completed: false },
                { id: 'lecce', visited: false, completed: false }
            ]
        },
        "A2_3": {
            status: 'locked',
            chapters: [
                { id: 'matera', visited: false, completed: false },
                { id: 'maratea', visited: false, completed: false},
                { id: 'tropea', visited: false, completed: false },
                { id: 'reggio calabria', visited: false, completed: false },
                { id: 'messina', visited: false, completed: false },
                { id: 'taormina', visited: false, completed: false },
                { id: 'catania', visited: false, completed: false },
                { id: 'syrakus', visited: false, completed: false },
                { id: 'cefalù', visited: false, completed: false },
                { id: 'palermo', visited: false, completed: false }
            ]
        }
    }
};
let mapCanvas = null;
let initialViewBox = "";
let currentLevelData = null;
let lastOpenedLevelId = null;
let lastOpenedChapterId= null;

//===APP START===
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    // Prüfe, ob ein Level als Parameter in der URL übergeben wurde
    const urlParams = new URLSearchParams(window.location.search);
    const debugLevel = urlParams.get('level'); // z.B. holt sich "A1_1" aus "?level=A1_1"

    initEventListeners(); 

    if (debugLevel && worldData[debugLevel]) {
        // --- DEBUG-MODUS: Lade direkt das angegebene Level ---
        console.warn(`DEBUG-MODUS: Lade direkt das Level "${debugLevel}"`);
        
        // Wir müssen die Karte trotzdem im Hintergrund bauen, damit Referenzen existieren,
        // machen sie aber nicht sichtbar.
        buildMap(); 
        
        // Lade und zeige die Reise für das in der URL angegebene Level
        showJourney(debugLevel);

    } else {
        // --- NORMALER MODUS: Starte mit der Italien-Karte ---
        buildMap();
    }
}



function buildMap() {
    mapCanvas = document.getElementById('map-canvas');
    mapCanvas.innerHTML = '';


    const regionsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    regionsLayer.id = 'regions-layer';
    mapCanvas.appendChild(regionsLayer);

    const overviewPathsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    overviewPathsLayer.id = 'overview-paths-layer';

    for (const levelId in overviewPaths) {
        const pathData = overviewPaths[levelId];
        const overviewPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        overviewPath.setAttribute('d', pathData);
        overviewPath.classList.add('overview-path');
        overviewPathsLayer.appendChild(overviewPath);
    }
    mapCanvas.appendChild(overviewPathsLayer);

    const nextRegionId = levelOrder.find(id =>
        appState.levels[id].status === 'unlocked' &&
        !appState.levels[id].chapters.every(c => c.completed)
    )

    // Erstellt nur noch die klickbaren Regionen der Italien-Karte
    for (const levelId in worldData) {
        const levelData = worldData[levelId];
        const regionPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        regionPath.setAttribute('d', levelData.regionPathData);
        regionPath.setAttribute('id', `region-${levelId}`);
        regionPath.classList.add('region-path');
        
        const levelState = appState.levels[levelId];
        const isCompleted = levelState.chapters.every(c => c.completed === true);

        if (isCompleted) {
            // Region ist vollständig abgeschlossen
            regionPath.classList.add('completed');
        } else if (levelId === nextRegionId) {
            // Das ist die nächste, aktive Region
            regionPath.classList.add('next-region');
        } else if (levelState.status === 'locked') {
            // Region ist noch gesperrt
            regionPath.classList.add('locked');
        }

        regionPath.addEventListener('click', () => showJourney(levelId));
        regionsLayer.appendChild(regionPath);
    }
    
    // Setzt die initiale viewBox
    requestAnimationFrame(() => {
        const bbox = mapCanvas.getBBox();
        const padding = 20;
        const viewBox = `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + (padding * 2)} ${bbox.height + (padding * 2)}`;
        mapCanvas.setAttribute('viewBox', viewBox);
        initialViewBox = viewBox;
    });
}

async function showJourney(levelId) {
    if (appState.levels[levelId].status === 'locked') {
        alert('Du musst erst die vorherige Region abschließen!');
        return;
    }

    document.getElementById('back-to-italy-btn').classList.add('visible');
    document.getElementById('city-nav-container').classList.add('visible');
    document.getElementById('main-app-title').classList.add('hidden-by-nav');

    try {
        const response = await fetch(`./data/${levelId}.json`);
        if (!response.ok) throw new Error('Level-Daten nicht gefunden!');
        currentLevelData = await response.json();

        buildJourneyLayer(levelId, currentLevelData);

        document.getElementById(`journey-${levelId}-layer`).classList.remove('hidden');

        const regionPath = document.getElementById(`region-${levelId}`);
        const mapCanvas = document.getElementById('map-canvas');

        requestAnimationFrame(() => {
            // --- ZIEL IDENTIFIZIEREN ---
            const levelState = appState.levels[levelId];
            const nextChapterIndex = levelState.chapters.findIndex(c => !c.visited);
            const targetChapterIndex = (nextChapterIndex === -1) ? currentLevelData.chapters.length - 1 : nextChapterIndex;
            updateCityDropdownSelection(targetChapterIndex);
            const targetChapter = currentLevelData.chapters[targetChapterIndex];
            const focalPoint = targetChapter.pos;

            // --- ZIEL-VIEWBOX BERECHNEN ---
            const regionBBox = regionPath.getBBox();
            const canvasRect = mapCanvas.getBoundingClientRect();
            const targetViewBoxHeight = regionBBox.height / 0.6;
            const targetViewBoxWidth = targetViewBoxHeight * (canvasRect.width / canvasRect.height);
            const targetViewBoxX = focalPoint.x - (targetViewBoxWidth / 2);
            const targetViewBoxY = focalPoint.y - (targetViewBoxHeight / 2);
            const targetViewBox = `${targetViewBoxX} ${targetViewBoxY} ${targetViewBoxWidth} ${targetViewBoxHeight}`;

            // --- ANIMATION AUSFÜHREN ---
            gsap.to(mapCanvas, {
                duration: 1.2,
                attr: { viewBox: targetViewBox },
                ease: "power2.inOut"
            });
        });

    } catch (error) {
        console.error("Fehler beim Laden des Levels:", error);
    }
}

function buildJourneyLayer(levelId, levelData) {
    let journeyLayer = document.getElementById(`journey-${levelId}-layer`);
    if (!journeyLayer) {
        journeyLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        journeyLayer.id = `journey-${levelId}-layer`;
        mapCanvas.appendChild(journeyLayer);
    }
    journeyLayer.innerHTML = '';
    journeyLayer.classList.add('journey-layer', 'hidden');

    const bgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    bgPath.setAttribute('d', worldData[levelId].regionPathData);
    bgPath.classList.add('journey-region-path');
    journeyLayer.appendChild(bgPath);

    // --- LOGIK FÜR GEKRÜMMTE PFADE STARTET HIER ---

    // Passe diesen Wert an, um die Stärke der Krümmung zu ändern
    const curveFactor = 0.2; 

    levelData.chapters.forEach((chapter, index) => {
        // Wir brauchen einen Start- und einen Endpunkt, also beginnen wir beim zweiten Kapitel
        if (index > 0) {
            const startPoint = levelData.chapters[index - 1].pos;
            const endPoint = chapter.pos;

            // 1. Mittelpunkt zwischen den beiden Städten finden
            const midX = (startPoint.x + endPoint.x) / 2;
            const midY = (startPoint.y + endPoint.y) / 2;

            // 2. Einen Kontrollpunkt für die Kurve berechnen,
            //    der senkrecht zur direkten Verbindungslinie liegt.
            const dx = endPoint.x - startPoint.x;
            const dy = endPoint.y - startPoint.y;
            const controlX = midX + curveFactor * dy; // Verschiebung auf der X-Achse
            const controlY = midY - curveFactor * dx; // Verschiebung auf der Y-Achse

            // 3. Den SVG-Pfadstring für die Kurve erstellen
            const pathString = `M ${startPoint.x} ${startPoint.y} Q ${controlX} ${controlY} ${endPoint.x} ${endPoint.y}`;

            // 4. Das <path>-Element erstellen und hinzufügen
            const journeyPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            journeyPath.setAttribute('d', pathString);
            journeyPath.classList.add('journey-path');
            
            // Prüfen, ob der Pfad als "abgeschlossen" markiert werden soll
            if (index <= appState.levels[levelId].chapters.filter(c => c.completed).length) {
                journeyPath.classList.add('completed');
            }
            journeyLayer.appendChild(journeyPath);
        }
    });
    
    // --- ENDE LOGIK FÜR PFADE ---


    const cityDropdown = document.getElementById('city-select-dropdown');
    const journeyTitle = document.getElementById('journey-title-display');
    cityDropdown.innerHTML = ''; // Leere alte Einträge

    journeyTitle.textContent = levelId.replace('_', '.');

    // Erster Eintrag als Titel
    const titleOption = document.createElement('option');
    titleOption.textContent = "Wähle eine Stadt...";
    titleOption.disabled = true;
    titleOption.selected = true;
    cityDropdown.appendChild(titleOption);

    const levelState = appState.levels[levelId];
    const completedCount = levelState.chapters.filter(c => c.completed).length;

    // Fülle das Dropdown mit den Städten
    levelData.chapters.forEach((chapter, index) => {
        const option = document.createElement('option');
        option.value = index; // Wir speichern den Index der Stadt
        option.textContent = chapter.name;

        // Logik: Nur bereits besuchte Städte + die nächste freigeschaltete sind klickbar
        if (index > completedCount) {
            option.disabled = true;
        }

        cityDropdown.appendChild(option);
    });

    // Event-Listener, der auf eine Auswahl im Dropdown reagiert
    cityDropdown.addEventListener('change', (event) => {
        const selectedIndex = parseInt(event.target.value, 10);
        const selectedCity = levelData.chapters[selectedIndex];
        
        if (selectedCity) {
            // Zentriere die Kamera auf die ausgewählte Stadt
            panToCity(selectedCity.pos);
        }
    });

    //====Stadt-Pins=====

    const pinWidth = 12.5;
    const pinHeight = 12.5;

    levelData.chapters.forEach((chapter, index) => {
        const svg_group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const levelState = appState.levels[levelId];
        // ... (deine Logik für isCompleted, isNext bleibt gleich) ...
        const completedCount = levelState.chapters.filter(c => c.completed === true).length;
        const isCompleted = index < completedCount;
        const isNext = index === completedCount;

        if (isCompleted) { svg_group.classList.add('completed'); }
        else if (isNext) { svg_group.classList.add('next-stop'); }
        else { svg_group.classList.add('locked'); }

        // --- ANPASSUNG: <use> DURCH <image> ERSETZEN ---

        const svg_pin = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        let pinFile = './src/images/pin-locked.svg'; // Standard ist gesperrt
        if (isCompleted) {
            pinFile = './src/images/pin-completed.svg';
        } else if (isNext) {
            pinFile = './src/images/pin-next.svg';
        }

        svg_pin.setAttribute('href', pinFile);
        svg_pin.classList.add('city-pin');

        const finalX = chapter.pos.x - (pinWidth / 2);
        const finalY = chapter.pos.y - pinHeight;

        svg_pin.setAttribute('x', finalX);
        svg_pin.setAttribute('y', finalY);

        svg_pin.setAttribute('width', pinWidth);
        svg_pin.setAttribute('height', pinHeight);


        
        svg_group.addEventListener('click', function() {
            if (svg_group.classList.contains('locked')) return;
            updateCityDropdownSelection(index);
            panToCity(chapter.pos);
            openLessonPanel(levelId, chapter.id);
        });

        svg_group.appendChild(svg_pin);
        journeyLayer.appendChild(svg_group);
    });

}

function showRegions() {
    document.getElementById('back-to-italy-btn').classList.remove('visible');
    document.getElementById('city-nav-container').classList.remove('visible');
    document.getElementById('main-app-title').classList.remove('hidden-by-nav');

    // Animiere zurück zum gespeicherten Start-viewBox
    gsap.to(mapCanvas, {
        duration: 1.2,
        attr: { viewBox: initialViewBox },
        ease: "power2.inOut"
    });

    // Blende die Ebenen um
    setTimeout(() => {
        document.querySelectorAll('[id^="journey-"]').forEach(layer => layer.classList.add('hidden'));
        document.getElementById('regions-layer').classList.remove('hidden');
    }, 600);
}

function initEventListeners(){
    const backToItalyBtn = document.getElementById('back-to-italy-btn');
    if (backToItalyBtn){
        backToItalyBtn.addEventListener('click', showRegions);
        document.getElementById('city-nav-container').classList.add('hidden');
    }

    // Erkennt, wenn ein Eingabefeld fokussiert wird (Tastatur erscheint)
    document.addEventListener('focusin', (e) => {
        if (e.target.matches('input[type="text"], textarea')) {
            document.body.classList.add('keyboard-visible');
        }
    });

    // Erkennt, wenn das Eingabefeld verlassen wird (Tastatur verschwindet)
    document.addEventListener('focusout', (e) => {
        if (e.target.matches('input[type="text"], textarea')) {
            document.body.classList.remove('keyboard-visible');
        }
    });

    const lessonPanel = document.getElementById('lesson-panel');
    const lessonPanelClose_btn = document.getElementById('lesson-panel-close-btn');
    lessonPanelClose_btn.addEventListener('click', function() {
        lessonPanel.classList.remove('visible');
    });

    lessonPanel.addEventListener('transitionend', (event) => {
        // Stelle sicher, dass wir auf die richtige Transition hören
        if (event.propertyName === 'transform') {
            // Nur wenn das Panel NICHT sichtbar ist, soll es versteckt werden
            if (!lessonPanel.classList.contains('visible')) {
                lessonPanel.style.display = 'none';
            }
        }
    });
}

function openLessonPanel(levelId, chapterId) {
    const lessonPanel = document.getElementById('lesson-panel');
    const lessonPanelTitel = document.getElementById('lesson-panel-title');
    const lessonPanelContent = document.getElementById('lesson-panel-content');

    const cityData = currentLevelData.chapters.find(chap => chap.id === chapterId);
    const contentData = currentLevelData.content[chapterId];

    // Finde den Zustand der angeklickten Stadt im appState
    const chapterState = appState.levels[levelId].chapters.find(c => c.id === chapterId);

    if (chapterState && !chapterState.visited) {
        // --- JA, ERSTER BESUCH ---
        chapterState.visited = true; // Setze den Status auf "besucht"
        
        const overlay = document.getElementById('welcome-overlay');
        const cityNameEl = document.getElementById('welcome-city-name');

        cityNameEl.textContent = `Benvenuta a ${cityData.name}!`;
        overlay.style.backgroundImage = `url(https://source.unsplash.com/1600x900/?${cityData.id},italy)`;
        
        overlay.classList.add('visible');

        // Nach 3 Sekunden: Animation ausblenden und dann das Panel zeigen
        setTimeout(() => {
            overlay.classList.remove('visible');
            setTimeout(showPanel, 500); // Kurze Pause für den Übergang
        }, 2000);

    } else {
        // --- NEIN, WIEDERHOLTER BESUCH ---
        // Zeige das Panel sofort an
        showPanel();
    }

    // Hilfsfunktion, um doppelten Code zu vermeiden
    function showPanel() {
        if (!contentData || contentData.length === 0) {
            alert(`Die Lerninhalte für ${cityData.name} sind noch nicht verfügbar.`);
            return;
        }

        lessonPanelTitel.textContent = cityData.name;
        lessonPanelContent.innerHTML = '';
        
        contentData.forEach((exercise, index) => {
            const card = document.createElement('div');
            card.className = 'module-card';
            card.innerHTML = `
                    <div class="module-icon">
                        <img src="${exercise.data.icon}" alt="${exercise.data.title}">
                    </div>
                    <h3 class="module-title">${exercise.data.title}</h3>
                `;
            card.addEventListener('click', () => {
                document.getElementById('city-nav-container').classList.remove('visible');
                lessonPanel.classList.remove('visible');
                document.getElementById('map-view').classList.remove('active');
                renderExercise(levelId, chapterId, index);
            });
            lessonPanelContent.appendChild(card);
        });

        lessonPanel.style.display = '';
        
        setTimeout(() => {
            lessonPanel.classList.add('visible');
        }, 10);
    }
}

function panToCity(cityPosition) {
    const currentViewBox = mapCanvas.viewBox.baseVal;
    const targetViewBoxWidth = currentViewBox.width;
    const targetViewBoxHeight = currentViewBox.height;

    const targetViewBoxX = cityPosition.x - (targetViewBoxWidth / 2);
    const targetViewBoxY = cityPosition.y - (targetViewBoxHeight / 2);

    const targetViewBox = `${targetViewBoxX} ${targetViewBoxY} ${targetViewBoxWidth} ${targetViewBoxHeight}`;

    gsap.to(mapCanvas, {
        duration: 1.0,
        attr: { viewBox: targetViewBox },
        ease: "power2.inOut"
    });
}

function renderExercise(levelId, chapterId, exerciseIndex){
    lastOpenedChapterId = chapterId;
    lastOpenedLevelId = levelId;

    const exercise = currentLevelData.content[chapterId][exerciseIndex];
    
    const lesson_view = document.getElementById('lesson-view')
    const lesson_content = document.getElementById('lesson-content')
    const journey_view = document.getElementById('journey-view')

    lesson_content.innerHTML = ''
    let contentHTML = ''

    lesson_content.className = 'view-content';
    lesson_content.classList.add(`${exercise.type}-layout`);

    const moduleData = exercise.data

    //ContentHTML befüllen
    if (exercise.type === 'vokabeln'){
        contentHTML =  `
            <div class="modal-header">
                <h2>${moduleData.title}</h2>
            </div>
            <div id="card-stack-container">
                </div>
            <div class="card-stack-instructions">
                <p>Tippe zum Umdrehen, wische zum Weglegen!</p>
            </div>
        `;
    } else if (exercise.type === 'grammatik') {
        const exercises = moduleData.exercises;
        contentHTML = `
            <div class="modal-header">
                <h2>${moduleData.title}</h2>
            </div>
            <div class="lesson-layout">
                <aside id="lesson-sidebar">
                    <nav id="lesson-nav">
                        <ul>
                            ${exercises.map((ex, index) => `
                                <li><a href="#exercise-${index}">${ex.title}</a></li>
                            `).join('')}
                        </ul>
                    </nav>
                </aside>
                <main id="lesson-main-content">
                    ${exercises.map((ex, index) => `
                        <section id="exercise-${index}" class="lesson-section">
                            <h3>${ex.title}</h3>
                            <p>${ex.text}</p>
                            
                            <p class="quiz-question">${ex.question}</p> 
                            
                            <div class="quiz-options">
                                ${ex.options.map((option, optIndex) => `
                                    <button class="quiz-option" data-correct="${optIndex === ex.correct}">
                                        ${option}
                                    </button>
                                `).join('')}
                            </div>
                        </section>
                    `).join('')}
                </main>
            </div>
        `;
    } else if (exercise.type === 'test') {
        contentHTML = `
            <div class="quiz-container">
                <div class="quiz-header">
                    <p id="quiz-progress-text"></p>
                    
                    <div id="quiz-progress-bar-container">
                        <div id="quiz-progress-bar"></div>
                    </div>
                </div>
                <div id="quiz-card">
                    <div id="quiz-question-area">
                        </div>
                    <div id="quiz-answer-area">
                        <label for="quiz-input" id="quiz-input-label">Deine Antwort</label>
                        <input type="text" id="quiz-input" class="test-input" placeholder="Übersetzung eingeben...">
                    </div>
                </div>
                <button id="quiz-next-btn" class="action-button">Weiter</button>
            </div>
            <div id="quiz-results-area">
                </div>
        `;
    } else if (exercise.type === 'geografie'){
        let mediaHTML = ''; // Eine leere Variable für unser Medium (Bild oder Karte)

        // Prüfe, ob eine iframe-URL vorhanden ist
        if (moduleData.iframeSrc) {
            // Ja: Baue den iframe-Tag
            mediaHTML = `
                <div class="map-container">
                    <iframe src="${moduleData.iframeSrc}" width="100%" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                </div>`;
        } else if (moduleData.image) {
            // Nein, aber es gibt ein Bild: Baue den img-Tag (wie bisher)
            mediaHTML = `<img src="https://source.unsplash.com/800x600/?${moduleData.image}" alt="${moduleData.title}">`;
        }

        // Setze das finale HTML zusammen
        contentHTML = `
            <div class="modal-header">
                <h2>${moduleData.title}</h2>
            </div>
            <div class="info-content">
                ${mediaHTML}
                <p>${moduleData.text}</p>
            </div>
        `;
    } else if (exercise.type === 'spiel'){
        contentHTML = `
            <div class="modal-header">
                <h2>${moduleData.title}</h2>
            </div>
            <p>Finde die passenden Paare!</p>
            <div id="memory-grid"></div>
        `;
    } else if (exercise.type === 'kultur'){
        contentHTML = `Kultur. JUHU`
    }

    lesson_content.innerHTML = contentHTML
    lesson_view.classList.add('active')
    if (exercise.type === 'spiel') {
        initMemoryGame(moduleData.pairs);
    }   
    


   if (exercise.type === 'vokabeln') {
        const stackContainer = document.getElementById('card-stack-container');
        const cardsData = moduleData.cards;
        const allCards = [];

        cardsData.sort(()=> Math.random() -0.5);

        // Baue die Karten von hinten nach vorne auf
        cardsData.slice().forEach(cardInfo => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card-stack-item';
            cardEl.innerHTML = `
                <div class="flashcard-inner">
                    <div class="flashcard-face flashcard-front">
                        <span class="language-hint">DEUTSCH</span>
                        <span class="card-text">${cardInfo.q}</span>
                    </div>
                    <div class="flashcard-face flashcard-back">
                        <span class="language-hint">ITALIENISCH</span>
                        <span class="card-text">${cardInfo.a}</span>
                    </div>
                </div>`;
            stackContainer.appendChild(cardEl);
            allCards.push(cardEl);
        });
 
        let isStackAnimating = false; // Die Sperre ist zurück und notwendig

        allCards.forEach(card => {
            const hammer = new Hammer(card);
            hammer.get('pan').set({ threshold: 10, direction: Hammer.DIRECTION_HORIZONTAL });

            hammer.on('tap', () => {
                if (isStackAnimating || card.classList.contains('is-flipping')) return;
                card.classList.add('is-flipping');
                card.querySelector('.flashcard-inner').classList.toggle('is-flipped');
                setTimeout(() => {
                    card.classList.remove('is-flipping');
                }, 600);
            });

            hammer.on('pan', (e) => {
                if (isStackAnimating || card.classList.contains('is-flipping')) return;
                gsap.set(card, { x: e.deltaX, rotation: e.deltaX / 10 });
            });

            hammer.on('panend', (e) => {
                if (isStackAnimating || card.classList.contains('is-flipping')) return;
                gsap.killTweensOf(card);

                if (Math.abs(e.deltaX) > 100) {
                    isStackAnimating = true; // SPERRE AKTIVIEREN
                    const parent = card.parentElement;

                    // Phase 1: Animationen
                    gsap.to(card, {
                        duration: 0.4, // Optional: Animation etwas beschleunigen
                        ease: "power1.out",
                        x: e.deltaX + (e.velocityX * 300),
                        rotation: (e.deltaX / 10) + (e.velocityX * 15),
                        onComplete: () => {
                            // Phase 2: Aufräumen & Zustand neu setzen
                            parent.appendChild(card);
                            const allCards = parent.querySelectorAll('.card-stack-item');
                            allCards.forEach((c, index) => {
                                gsap.set(c, { transition: 'none', zIndex: allCards.length - index });
                                if (index === 0) {
                                    gsap.set(c, { transform: 'none', opacity: 1, pointerEvents: 'auto' });
                                } else if (index === 1) {
                                    gsap.set(c, { transform: 'translateY(12px) rotate(4deg) scale(0.95)', opacity: 1, pointerEvents: 'none' });
                                } else if (index === 2) {
                                    gsap.set(c, { transform: 'translateY(24px) rotate(-5deg) scale(0.9)', opacity: 1, pointerEvents: 'none' });
                                } else {
                                    gsap.set(c, { opacity: 0, pointerEvents: 'none' });
                                }
                            });
                            isStackAnimating = false; // SPERRE FREIGEBEN
                        }
                    });

                    // Parallele Animation der nachrückenden Karten
                    const secondCard = parent.querySelector('.card-stack-item:nth-child(2)');
                    const thirdCard = parent.querySelector('.card-stack-item:nth-child(3)');
                    const fourthCard = parent.querySelector('.card-stack-item:nth-child(4)');

                    if (secondCard) {
                        gsap.to(secondCard, { duration: 0.3, delay: 0.05, ease: 'power2.out', y: 0, rotation: 0, scale: 1 });
                    }
                    if (thirdCard) {
                        gsap.to(thirdCard, { duration: 0.3, delay: 0.05, ease: 'power2.out', y: 12, rotation: 4, scale: 0.95 });
                    }
                    if (fourthCard) {
                        gsap.to(fourthCard, { duration: 0.3, delay: 0.05, ease: 'power2.out', y: 24, rotation: -5, scale: 0.9, opacity: 1 });
                    }
                } else {
                    gsap.to(card, { duration: 0.4, ease: "elastic.out(1, 0.75)", x: 0, rotation: 0 });
                }
            });
        });
    }

    if (exercise.type === 'grammatik') {
        const mainContent = document.getElementById('lesson-main-content');
        const navLinks = document.querySelectorAll('#lesson-nav a');
        const sections = document.querySelectorAll('.lesson-section');

        // Funktion, die den aktiven Link hervorhebt
        function updateActiveLink() {
            let currentSectionId = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop - 100; // Ein kleiner Puffer
                if (mainContent.scrollTop >= sectionTop) {
                    currentSectionId = section.id;
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${currentSectionId}`) {
                    link.classList.add('active');
                }
            });
        }

        // Höre auf das Scroll-Event im Inhaltsbereich
        mainContent.addEventListener('scroll', updateActiveLink);
        
        // Initialisiere den Zustand einmal beim Laden
        updateActiveLink();

        // Füge "Klick-zum-Scrollen"-Verhalten hinzu
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetSection = document.querySelector(targetId);

                // Prüfen, ob beide Elemente existieren
                if (mainContent && targetSection) {
                    // NEU: Scrolle nur den Inhalts-Container
                    mainContent.scrollTo({
                        top: targetSection.offsetTop, // Scrolle zur oberen Kante der Sektion
                        behavior: 'smooth'
                    });
                }
            });
        });

        const quizOptions = document.querySelectorAll('.quiz-option');

        quizOptions.forEach(button => {
            button.addEventListener('click', () => {
                const isCorrect = button.dataset.correct === 'true';
                const parentSection = button.closest('.quiz-options'); // Finde die Elterngruppe der Buttons

                // Deaktiviere alle Buttons in dieser Gruppe, um weitere Klicks zu verhindern
                parentSection.querySelectorAll('.quiz-option').forEach(btn => {
                    btn.disabled = true; 
                });

                // Füge die entsprechende CSS-Klasse für visuelles Feedback hinzu
                if (isCorrect) {
                    button.classList.add('correct');
                } else {
                    button.classList.add('incorrect');
                    // Optional: Zeige auch die richtige Antwort an
                    parentSection.querySelector('[data-correct="true"]').classList.add('correct');
                }
            });
        });
    }
    if (exercise.type === 'test') {
        // --- VARIABLEN ZUR STEUERUNG DES QUIZ ---
        let currentQuestionIndex = 0;
        const questions = moduleData.questions;
        const userAnswers = []; // Wir speichern die Antworten des Nutzers hier

        // --- ELEMENTE AUS DEM DOM HOLEN ---
        const progressEl = document.getElementById('quiz-progress-text');
        const questionAreaEl = document.getElementById('quiz-question-area');
        const inputEl = document.getElementById('quiz-input');
        const nextBtn = document.getElementById('quiz-next-btn');
        const resultsAreaEl = document.getElementById('quiz-results-area');

        // --- FUNKTION, UM DIE AKTUELLE FRAGE ANZUZEIGEN ---
        function displayCurrentQuestion() {
            if (currentQuestionIndex < questions.length) {
                const question = questions[currentQuestionIndex];
                progressEl.textContent = `Frage ${currentQuestionIndex + 1} von ${questions.length}`;
                questionAreaEl.innerHTML = `<label for="quiz-input">${question.q}</label>`;
                const progressBar = document.getElementById('quiz-progress-bar');
                progressBar.style.width = `${((currentQuestionIndex + 1) / questions.length) * 100}%`; 
                inputEl.value = ''; // Eingabefeld leeren
                inputEl.focus(); // Cursor direkt ins Feld setzen
            }
        }

        // --- FUNKTION, UM DIE ERGEBNISSE AM ENDE ANZUZEIGEN ---
        function showResults() {
            // Verstecke die Quiz-Elemente
            document.getElementById('quiz-card').style.display = 'none';
            document.getElementById('quiz-next-btn').style.display = 'none';
            document.querySelector('.quiz-header').style.display = 'none'; // Versteckt den ganzen Header

            let correctCount = 0;
            let resultsHTML = '<h3>Ergebnisse</h3>';

            questions.forEach((question, index) => {
                const userAnswer = userAnswers[index].trim().toLowerCase();
                const correctAnswers = question.a;
                let isCorrect = false; // Standardmäßig als falsch annehmen

                // NEUE PRÜFUNG: Ist die richtige Antwort ein Array?
                if (Array.isArray(correctAnswers)) {
                    // Ja: Prüfe, ob die Nutzerantwort im Array enthalten ist
                    // Wir normalisieren auch die korrekten Antworten zu Kleinbuchstaben
                    const lowerCaseCorrectAnswers = correctAnswers.map(ans => ans.toLowerCase());
                    isCorrect = lowerCaseCorrectAnswers.includes(userAnswer);
                } else {
                    // Nein (altes Format): Mache einen einfachen String-Vergleich
                    isCorrect = (userAnswer === correctAnswers.toLowerCase());
                }

                if (isCorrect) {
                    correctCount++;
                }

                // Passe die Anzeige der richtigen Antwort an
                let correctAnswerText = '';
                if (Array.isArray(correctAnswers)) {
                    correctAnswerText = correctAnswers.join(' / '); // Zeigt "ciao / salve"
                } else {
                    correctAnswerText = correctAnswers;
                }

                resultsHTML += `
                    <div class="result-item ${isCorrect ? 'correct' : 'incorrect'}">
                        <p><strong>Frage:</strong> ${question.q}</p>
                        <p><strong>Deine Antwort:</strong> ${userAnswers[index]} ${isCorrect ? '✔' : '✘'}</p>
                        ${!isCorrect ? `<p><strong>Mögliche Antworten:</strong> ${correctAnswerText}</p>` : ''}
                    </div>
                `;
            });
            
            resultsAreaEl.innerHTML = resultsHTML;

            // Prüfen, ob der Test bestanden wurde
            if (correctCount === questions.length) {
                resultsAreaEl.insertAdjacentHTML('afterbegin', '<p class="correct-feedback">Perfekt! Alles richtig.</p>');
                // Lektion nach kurzer Verzögerung als abgeschlossen markieren
                setTimeout(() => {
                    completeChapter(levelId, chapterId);
                }, 2000);
            } else {
                resultsAreaEl.insertAdjacentHTML('afterbegin', '<p class="incorrect-feedback">Schau dir die Fehler an und versuche es erneut!</p>');
                // Optional: Button zum Wiederholen hinzufügen
                const retryBtn = document.createElement('button');
                retryBtn.textContent = 'Erneut versuchen';
                retryBtn.className = 'action-button';
                retryBtn.onclick = () => renderExercise(levelId, chapterId, exerciseIndex); // Startet die Übung neu
                resultsAreaEl.appendChild(retryBtn);
            }
        }

        // --- EVENT-LISTENER FÜR DEN "WEITER"-BUTTON ---
        nextBtn.addEventListener('click', () => {
            // Speichere die aktuelle Antwort
            userAnswers.push(inputEl.value);
            
            // Gehe zur nächsten Frage
            currentQuestionIndex++;

            if (currentQuestionIndex < questions.length) {
                displayCurrentQuestion();
            } else {
                // Quiz ist zu Ende
                showResults();
            }
        });
        
        inputEl.addEventListener('keydown', (event) => {
            // Prüfen, ob die Enter-Taste gedrückt wurde
            if (event.key === 'Enter') {
                // Verhindert das Standardverhalten der Enter-Taste (z.B. Formular absenden)
                event.preventDefault(); 
                
                // Simuliert einen Klick auf den "Weiter"-Button
                nextBtn.click();
            }
        });
        
        // --- QUIZ STARTEN ---
        displayCurrentQuestion(); // Zeige die erste Frage an
    }

    const back_to_journey_btn = document.getElementById('back-to-journey-btn');
    if (back_to_journey_btn) {
        back_to_journey_btn.addEventListener('click', function(){
            lesson_view.classList.remove('active');
            document.getElementById('map-view').classList.add('active');
            document.getElementById('city-nav-container').classList.add('visible');
            if (lastOpenedChapterId && lastOpenedLevelId){
                openLessonPanel(lastOpenedLevelId, lastOpenedChapterId);
            }
        });
    }

}

function completeChapter(levelId, chapterId) {
    const levelState = appState.levels[levelId];
    const chapterToUpdate = levelState.chapters.find(c => c.id === chapterId);
    if (chapterToUpdate && !chapterToUpdate.completed) {
        chapterToUpdate.completed = true;
    }

    // Prüfen, ob alle Kapitel in diesem Level jetzt abgeschlossen sind
    const allChaptersCompleted = levelState.chapters.every(c => c.completed === true);

    if (allChaptersCompleted) {
        // --- LEVEL ABGESCHLOSSEN ---
        
        // 1. Finde den Index des nächsten Levels
        const currentLevelIndex = levelOrder.indexOf(levelId);
        const nextLevelId = levelOrder[currentLevelIndex + 1];

        // 2. Schalte das nächste Level frei, falls es existiert
        if (nextLevelId && appState.levels[nextLevelId]) {
            appState.levels[nextLevelId].status = 'unlocked';
            // Optional: Eine kleine Erfolgsmeldung
            //alert(`Glückwunsch! Du hast die Region ${levelId} abgeschlossen und ${nextLevelId} freigeschaltet!`);
        }

        // 3. Kehre zur Italien-Karte zurück
        document.getElementById('lesson-view').classList.remove('active');
        document.getElementById('map-view').classList.add('active');
        showRegions();
        
        // 4. Baue die Karte neu auf, damit die freigeschaltete Region klickbar wird
        buildMap(); 

    } else {
        
        // Verstecke die Lektionsansicht
        document.getElementById('lesson-view').classList.remove('active');
        document.getElementById('map-view').classList.add('active');

        // Aktualisiere die visuelle Darstellung der Reise (Pins, Pfade)
        buildJourneyLayer(levelId, currentLevelData);

        // Finde das nächste unvollständige Kapitel, um dorthin zu schwenken
        const nextChapterIndex = levelState.chapters.findIndex(c => !c.completed);
        if (nextChapterIndex !== -1) {
            const nextChapterData = currentLevelData.chapters[nextChapterIndex];
            setTimeout(() => {
                updateCityDropdownSelection(nextChapterIndex);
                panToCity(nextChapterData.pos);
            }, 200);
        }
    }
}


function initMemoryGame(pairs) {
    const grid = document.getElementById('memory-grid');
    grid.innerHTML = '';
    const cardsData = [];
    for (let i = 0; i < pairs.length; i += 2) {
        cardsData.push({ text: pairs[i], pairId: i });
        cardsData.push({ text: pairs[i+1], pairId: i });
    }
    cardsData.sort(() => Math.random() - 0.5); // Mischen

    let flippedCards = [];
    let lockBoard = false;
    let matchedPairsCount = 0;

    cardsData.forEach(cardInfo => {
        const card = document.createElement('div');
        card.classList.add('memory-card');
        card.dataset.pairId = cardInfo.pairId;
        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front">?</div>
                <div class="card-back">${cardInfo.text}</div>
            </div>`;
        
        card.addEventListener('click', () => {
            if (lockBoard || card.classList.contains('is-flipped') || card.classList.contains('is-matched')) return;
            
            card.classList.add('is-flipped');
            flippedCards.push(card);

            if (flippedCards.length === 2) {
                lockBoard = true;
                if (flippedCards[0].dataset.pairId === flippedCards[1].dataset.pairId) {
                    // Match!
                    flippedCards[0].classList.add('is-matched');
                    flippedCards[1].classList.add('is-matched');
                    matchedPairsCount++;
                    flippedCards = [];
                    lockBoard = false;
                } else {
                    // No Match
                    setTimeout(() => {
                        flippedCards[0].classList.remove('is-flipped');
                        flippedCards[1].classList.remove('is-flipped');
                        flippedCards = [];
                        lockBoard = false;
                    }, 1000);
                }
            }

            if (matchedPairsCount === pairs.length / 2) { // <- Hier wird erkannt, dass das Spiel gewonnen ist
                const isDesktop = window.innerWidth > 768; // Prüfen, ob der Bildschirm breiter als 768px ist

                if (isDesktop) {
                    // **Desktop-Animation: Zwei Kanonen von unten**
                    const duration = 2 * 1000; // 2 Sekunden
                    const animationEnd = Date.now() + duration;
                    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

                    const randomInRange = (min, max) => Math.random() * (max - min) + min;

                    const interval = setInterval(function() {
                        const timeLeft = animationEnd - Date.now();
                        if (timeLeft <= 0) {
                            return clearInterval(interval);
                        }
                        const particleCount = 50 * (timeLeft / duration);
                        // Linke Seite
                        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
                        // Rechte Seite
                        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
                    }, 250);

                } else {
                    // **Handy-Animation: Einzelner Schuss von oben (wie bisher, aber verbessert)**
                    confetti({
                        particleCount: 150,
                        spread: 90,
                        origin: { y: 0.6 },
                        gravity: 0.8 // Lässt das Konfetti realistischer nach unten fallen
                    });
                }

                setTimeout(() => {
                    const backButton = document.getElementById('back-to-journey-btn');
                    if (backButton) {
                        backButton.click(); // Simuliert einen Klick auf den "Zurück zur Reise"-Button
                    }
                }, 2000); // 2000 Millisekunden = 2 Sekunden Verzögerung
            }
        });
        grid.appendChild(card);
    });
}

function updateCityDropdownSelection(cityIndex) {
    const cityDropdown = document.getElementById('city-select-dropdown');
    // Überprüft, ob das Dropdown existiert, und setzt dann den ausgewählten Wert
    if (cityDropdown) {
        cityDropdown.value = cityIndex;
    }
}