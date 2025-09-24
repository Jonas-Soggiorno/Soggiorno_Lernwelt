import {worldData} from './data.js';

//===GLOBALE VARIABLEN===
const levelOrder = ["A1_1", "A1_2", "A1_3"];
let appState = {
    levels: {
        "A1_1": { 
            status: 'unlocked',
            chapters:[
                { id: 'trieste', visited: false},
                { id: 'udine', visited: false},
                { id: 'valdobbiadene', visited: false},
                { id: 'bassano_del_grappa', visited: false},
                { id: 'venezia', visited: false},
                { id: 'vizenza', visited: false},
                { id: 'verona', visited: false},
                { id: 'sirmione', visited: false},
                { id: 'monza', visited: false},
                { id: 'milano', visited: false}
            ]
        },
        "A1_2": {
            status: 'locked',
            chapters: [
                { id: 'Torino', visited: false },
                { id: 'Asti', visited: false }
            ]
        },
        "A1_3": {
            status: 'locked',
            chapters: [
                { id: 'parma', visited: false },
                { id: 'ferrara', visited: false }
            ]
        },
    }
};
let mapCanvas = null;
let initialViewBox = "";

//===APP START===
document.addEventListener('DOMContentLoaded', initApp);

function initApp(){
    buildMap();
    initEventListeners();
}



function buildMap(){
    mapCanvas = document.getElementById('map-canvas');
    mapCanvas.innerHTML = '';

    //1. EBENE: REGIONEN
    const regionsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    regionsLayer.id = 'regions-layer';
    mapCanvas.appendChild(regionsLayer);

    for (const levelId in worldData){
        const levelData = worldData[levelId];
        const regionPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        regionPath.setAttribute('d', levelData.regionPathData);
        regionPath.setAttribute('id', `region-${levelId}`);
        regionPath.classList.add('region-path');

        if (appState.levels[levelId].status === 'locked'){
            regionPath.classList.add('locked');
        }

        regionPath.addEventListener('click', () => {
            if (appState.levels[levelId].status === 'locked') {
                alert('Du musst erst die vorherige Region abschließen!');
                return;
            }
            
            // Dieser Code wird nur ausgeführt, wenn die Region freigeschaltet ist
            showJourney(levelId);
        });
        regionsLayer.appendChild(regionPath);
    }

    //2. EBENEN: REISEN (für jedes Level eine, anfangs unsichtbar)
    for (const levelId in worldData){
        const levelData = worldData[levelId];
        const journeyLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        journeyLayer.id = `journey-${levelId}-layer`;
        journeyLayer.classList.add('journey-layer');
        journeyLayer.classList.add('hidden');
        mapCanvas.appendChild(journeyLayer);

        //Hintergrundpfad der Region
        const bgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        bgPath.setAttribute('d', levelData.regionPathData);
        journeyLayer.appendChild(bgPath);

        levelData.chapters.forEach((chapter, index) => {
            if (chapter.path) { // Prüft, ob ein Pfad für diese Stadt existiert
                const journeyPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                journeyPath.setAttribute('d', chapter.path);
                journeyPath.classList.add('journey-path'); // Gibt ihm den Stil!

                // Prüft, ob der Pfad bereits abgeschlossen ist
                if (index < appState.levels[levelId].completedChapters) {
                    journeyPath.classList.add('completed');
                }
                
                journeyLayer.appendChild(journeyPath);
            }
        }); 

        levelData.chapters.forEach((chapter, index) => {
            const svg_group = document.createElementNS('http://www.w3.org/2000/svg','g');

            const levelState = appState.levels[levelId];

            // Finde heraus, wie viele Kapitel abgeschlossen sind, indem wir die letzte besuchte Stadt suchen
            // Wir gehen davon aus, dass abgeschlossene Kapitel als "besucht" markiert sind.
            const completedChaptersCount = levelState.chapters.filter(c => c.visited).length; 

            const isCompleted = index < completedChaptersCount;
            const isNext = index === completedChaptersCount;

            let nextCityPosition = null

            const svg_circle = document.createElementNS('http://www.w3.org/2000/svg','circle');
            svg_circle.setAttribute('cx', chapter.pos.x);
            svg_circle.setAttribute('cy', chapter.pos.y);
            svg_circle.setAttribute('r', 3);
            svg_circle.classList.add('city-pin');
            svg_circle.addEventListener('click', function() {
                if (svg_group.classList.contains('locked')) {
                    return; // Stoppt die Funktion sofort
                }
                openLessonPanel(levelId, chapter.id);
            });

            const svg_text = document.createElementNS('http://www.w3.org/2000/svg','text');
            svg_text.setAttribute("x", chapter.pos.x);
            svg_text.setAttribute("y", chapter.pos.y);
            svg_text.textContent = chapter.name;
            svg_text.classList.add('map-city-name');
            

            if (isCompleted) {
                svg_group.classList.add('completed');
            } else if (isNext) {
                svg_group.classList.add('next-stop');
            } else {
                svg_group.classList.add('locked');
            }


            svg_group.appendChild(svg_circle);
            //svg_group.appendChild(svg_text)  //Ich weiß noch nicht ob ich diesen Text anzeigen will...

            journeyLayer.appendChild(svg_group);
        });
    }

    requestAnimationFrame(() => {
        // 1. Jetzt, wo das Layout stabil ist, vermessen wir den Inhalt
        const bbox = mapCanvas.getBBox();
        const padding = 20;
        const viewBox = `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + (padding * 2)} ${bbox.height + (padding * 2)}`;
        
        // 2. Setze den korrekten viewBox-Startwert
        mapCanvas.setAttribute('viewBox', viewBox);

        // 3. Speichere diesen Wert in unserer neuen globalen Variable
        initialViewBox = viewBox;
    });
}

function showJourney(levelId) {
    const mapCanvas = document.getElementById('map-canvas');
    const regionPath = document.getElementById(`region-${levelId}`);

    // Wir warten auf den nächsten Frame, um stabile Maße zu haben
    requestAnimationFrame(() => {
        // --- SCHRITT 1: ZIELE DEFINIEREN ---
        
        // Finde die nächste Stadt als unseren Fokuspunkt
        const levelState = appState.levels[levelId];
        const chapters = worldData[levelId].chapters;

        const nextChapterIndex = levelState.chapters.findIndex(c => c.visited === false);

        const targetChapter = chapters[nextChapterIndex === -1 ? chapters.length -1 : nextChapterIndex];
        const focalPoint = targetChapter.pos;

        // Vermesse die Region und die Leinwand für die Zoom-Berechnung
        const regionBBox = regionPath.getBBox();
        const canvasRect = mapCanvas.getBoundingClientRect();

        // --- SCHRITT 2: DEN ZIEL-VIEWBOX BERECHNEN ---

        // Die Höhe des neuen viewBox soll so sein, dass die Region 70% der Leinwandhöhe einnimmt
        const targetViewBoxHeight = regionBBox.height / 0.7;

        // Die Breite wird basierend auf dem Seitenverhältnis der Leinwand berechnet, um Verzerrungen zu vermeiden
        const targetViewBoxWidth = targetViewBoxHeight * (canvasRect.width / canvasRect.height);

        // Die X/Y-Koordinaten werden so berechnet, dass der Fokuspunkt (die Stadt) in der Mitte ist
        const targetViewBoxX = focalPoint.x - (targetViewBoxWidth / 2);
        const targetViewBoxY = focalPoint.y - (targetViewBoxHeight / 2);

        // Baue den finalen viewBox-String zusammen
        const targetViewBox = `${targetViewBoxX} ${targetViewBoxY} ${targetViewBoxWidth} ${targetViewBoxHeight}`;

        // --- SCHRITT 3: ANIMATION MIT GSAP AUSFÜHREN ---
        gsap.to(mapCanvas, {
            duration: 1.2,
            attr: { viewBox: targetViewBox },
            ease: "power2.inOut"
        });

        document.getElementById('back-to-italy-btn').classList.add('visible');

        // --- SCHRITT 4: EBENEN UMSCHALTEN ---
        setTimeout(() => {
            //document.getElementById('regions-layer').classList.add('hidden');
            document.getElementById(`journey-${levelId}-layer`).classList.remove('hidden');
        }, 600);
    });
}


function showRegions() {
    document.getElementById('back-to-italy-btn').classList.remove('visible');

    // Animiere zurück zum gespeicherten Start-viewBox
    gsap.to(mapCanvas, {
        duration: 1.2,
        attr: { viewBox: initialViewBox },
        ease: "power2.inOut"
    });

    // Blende die Ebenen um
    setTimeout(() => {
        document.querySelectorAll('[id^="journey-"]').forEach(layer => layer.classList.add('hidden'));
        //document.getElementById('regions-layer').classList.remove('hidden');
    }, 600);
}

function initEventListeners(){
    const backToItalyBtn = document.getElementById('back-to-italy-btn');
    if (backToItalyBtn){
        backToItalyBtn.addEventListener('click', showRegions);
    }

    const lessonPanel = document.getElementById('lesson-panel');
    const lessonPanelClose_btn = document.getElementById('lesson-panel-close-btn');
    lessonPanelClose_btn.addEventListener('click', function() {
        lessonPanel.classList.remove('visible');
    });
}

function openLessonPanel(levelId, chapterId){
    const lessonPanel = document.getElementById('lesson-panel')
    const lessonPanelTitel = document.getElementById('lesson-panel-title')
    const lessonPanelContent = document.getElementById('lesson-panel-content')

    const chapterState = appState.levels[levelId].chapters.find(c => c.id === chapterId);
    const cityData = worldData[levelId].chapters.find(chap => chap.id === chapterId)
    const contentData = worldData[levelId].content[chapterId]

    if (chapterState && !chapterState.visited) {
        // --- JA, ERSTER BESUCH ---
        chapterState.visited = true; // Setze den Status auf "besucht"
        
        // Hole die nötigen HTML-Elemente
        const overlay = document.getElementById('welcome-overlay');
        const cityNameEl = document.getElementById('welcome-city-name');

        // Setze Inhalt und Hintergrundbild
        cityNameEl.textContent = `Benvenuta a ${cityData.name}!`;
        overlay.style.backgroundImage = `url(https://source.unsplash.com/1600x900/?${cityData.id},italy)`;
        
        // Zeige die Animation
        overlay.classList.add('visible');

        // Nach 3 Sekunden: Blende Animation aus und zeige das Panel
        setTimeout(() => {
            overlay.classList.remove('visible');
            // Warte kurz, bis die Ausblend-Animation fertig ist
            setTimeout(showPanel, 500);
        }, 2000);

    } else {
        // --- NEIN, WIEDERHOLTER BESUCH ---
        // Zeige das Panel sofort an
        showPanel();
    }

    function showPanel(){
        if (!contentData || contentData.length === 0){
                alert(`Die Inhalte für ${cityData.name} sind noch nicht verfügbar.`);
                return;
        }

        lessonPanelTitel.textContent = cityData.name;
        lessonPanelContent.innerHTML = ''

        contentData.forEach((exercise, index) => {
            const card = document.createElement('div');
            card.className = 'module-card';
            card.innerHTML = `
                <div class="module-icon">${exercise.data.icon}</div>
                <h3 class="module-title">${exercise.data.title}</h3>
            `;

            card.addEventListener('click', function(){
                lessonPanel.classList.remove('visible');

                renderExercise(levelId, chapterId, index); 
            });

            lessonPanelContent.appendChild(card);
        });

        lessonPanel.classList.add('visible')
    }
    
}


function updateJourneyLayer(levelId) {
    const levelData = worldData[levelId];
    const journeyLayer = document.getElementById(`journey-${levelId}-layer`);
    journeyLayer.innerHTML = ''; // Leere nur den Inhalt DIESER Ebene

    // Baue den Inhalt neu auf (dieser Code ist aus deiner buildMap-Funktion kopiert)
    const bgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    bgPath.setAttribute('d', levelData.regionPathData);
    bgPath.classList.add('journey-region-path');
    journeyLayer.appendChild(bgPath);

    //Hintergrundpfad der Region
        bgPath.setAttribute('d', levelData.regionPathData);
        journeyLayer.appendChild(bgPath);

        levelData.chapters.forEach((chapter, index) => {
            if (chapter.path) { // Prüft, ob ein Pfad für diese Stadt existiert
                const journeyPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                journeyPath.setAttribute('d', chapter.path);
                journeyPath.classList.add('journey-path'); // Gibt ihm den Stil!

                // Prüft, ob der Pfad bereits abgeschlossen ist
                if (index < appState.levels[levelId].completedChapters) {
                    journeyPath.classList.add('completed');
                }
                
                journeyLayer.appendChild(journeyPath);
            }
        }); 

    levelData.chapters.forEach((chapter, index) => {
        levelData.chapters.forEach((chapter, index) => {
            const svg_group = document.createElementNS('http://www.w3.org/2000/svg','g');

            const levelState = appState.levels[levelId];

            const completedCount = levelState.chapters.filter(c => c.visited === true).length;

            const isCompleted = index < completedCount;
            const isNext = index === completedCount;

            let nextCityPosition = null

            const svg_circle = document.createElementNS('http://www.w3.org/2000/svg','circle');
            svg_circle.setAttribute('cx', chapter.pos.x);
            svg_circle.setAttribute('cy', chapter.pos.y);
            svg_circle.setAttribute('r', 3);
            svg_circle.classList.add('city-pin');
            svg_circle.addEventListener('click', function() {
                if (svg_group.classList.contains('locked')) {
                    return; // Stoppt die Funktion sofort
                }
                panToCity(chapter.pos);
                openLessonPanel(levelId, chapter.id);
            });

            const svg_text = document.createElementNS('http://www.w3.org/2000/svg','text');
            svg_text.setAttribute("x", chapter.pos.x);
            svg_text.setAttribute("y", chapter.pos.y);
            svg_text.textContent = chapter.name;
            svg_text.classList.add('map-city-name');
            

            if (isCompleted) {
                svg_group.classList.add('completed');
            } else if (isNext) {
                svg_group.classList.add('next-stop');
            } else {
                svg_group.classList.add('locked');
            }


            svg_group.appendChild(svg_circle);
            //svg_group.appendChild(svg_text)  Ich weiß noch nicht ob ich diesen Text anzeigen will...

            journeyLayer.appendChild(svg_group);
        });
    });
}

function panToCity(cityPosition) {
    // Hol dir die aktuellen Dimensionen des viewBox
    const currentViewBox = mapCanvas.viewBox.baseVal;
    const targetViewBoxWidth = currentViewBox.width;
    const targetViewBoxHeight = currentViewBox.height;

    // Berechne die neue obere linke Ecke, um die Stadt zu zentrieren
    const targetViewBoxX = cityPosition.x - (targetViewBoxWidth / 2);
    const targetViewBoxY = cityPosition.y - (targetViewBoxHeight / 2);

    const targetViewBox = `${targetViewBoxX} ${targetViewBoxY} ${targetViewBoxWidth} ${targetViewBoxHeight}`;

    // Animiere sanft zum neuen viewBox
    gsap.to(mapCanvas, {
        duration: 1.0,
        attr: { viewBox: targetViewBox },
        ease: "power2.inOut"
    });
}

function renderExercise(levelId, chapterId, exerciseIndex){
    const exercise = worldData[levelId].content[chapterId][exerciseIndex]
    const moduleData = exercise.data

    const lesson_view = document.getElementById('lesson-view')
    const lesson_content = document.getElementById('lesson-content')
    const journey_view = document.getElementById('journey-view')

    lesson_content.innerHTML = ''
    let contentHTML = ''


    //ContentHTML befüllen
    if (exercise.type === 'vokabeln'){
        contentHTML =  `
            <div class="modal-header">
                <h2>${moduleData.title}</h2>
            </div>
            <div id="flashcard-stage"></div>
            <div class="flashcard-controls">

                <button id="prev-card-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                    </svg>
                </button>

                <span id="card-progress"></span>

                <button id="next-card-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                    </svg>
                </button>

            </div>
        `;
    } else if (exercise.type === 'grammatik') {
        contentHTML = `
            <div class="modal-header">
                <h2>${moduleData.title}</h2>
            </div>
            <p>${moduleData.text}</p>
            <p><strong>Frage:</strong> ${moduleData.question}</p>
            <div class="quiz-options">
                ${moduleData.options.map((option, index) => `
                    <button class="quiz-option" data-correct="${index === moduleData.correct}">
                        ${option}
                    </button>
                `).join('')}
            </div>
        `;
    } else if (exercise.type === 'test') {
        contentHTML = `
            <div class="modal-header">
                <h2>${moduleData.title}</h2>
            </div>
            <div class="test-form">
                <p>Übersetze die Vokabeln, um die Lektion abzuschließen:</p>
                ${moduleData.questions.map((question, index) => `
                    <div class="test-question">
                        <label for="test-input-${index}">${question.q}</label>
                        <input type="text" id="test-input-${index}" class="test-input" data-correct-answer="${question.a.toLowerCase()}">
                    </div>
                `).join('')}
            </div>
            <button id="check-test-btn" class="action-button">Antworten prüfen</button>
            <div id="test-feedback"></div>
        `;
    } lesson_content.innerHTML = contentHTML
    lesson_view.classList.add('active')
    
    


    if (exercise.type === 'vokabeln'){
        let currentCardIndex = 0
        const cards = moduleData.cards

        //Die Funktion die eine Karte anzeigt
        function showCard(index){
            const stage = document.getElementById('flashcard-stage')
            const progress = document.getElementById('card-progress')
            const cardData = cards[index]

            //Fortschrittsanzeige aktualsieren
            progress.textContent = `${index + 1}/${cards.length}`

            //HTML für die EINE Karte bauen
            stage.innerHTML = `
                <div id="flashcard">
                    <div id="flashcard-inner">
                        <div class="flashcard-face flashcard-front">${cardData.q}</div>
                        <div class="flashcard-face flashcard-back">${cardData.a}</div>
                    </div>
                </div>`;

            // Flip-Logik für die EINE NEUE Karte aktivieren
            const flashcard = document.getElementById('flashcard')
            flashcard.addEventListener('click', () => flashcard.classList.toggle('is-flipped'))

            const nextBtn = document.getElementById('next-card-btn');
            const prevBtn = document.getElementById('prev-card-btn');

            prevBtn.disabled = (index === 0);
            nextBtn.disabled = (index === cards.length - 1);
        }

        const nextBtn = document.getElementById('next-card-btn')
        const prevBtn = document.getElementById('prev-card-btn')

        nextBtn.addEventListener('click', () =>{
            if (currentCardIndex < cards.length - 1){
                currentCardIndex++
                showCard(currentCardIndex)
            
            }
        });

        prevBtn.addEventListener('click', () =>{
            if (currentCardIndex > 0){
                currentCardIndex--
                showCard(currentCardIndex)
            }
        });

        showCard(currentCardIndex)
    
    }
    if (exercise.type === 'grammatik') {
        const quizOptions = document.querySelectorAll('.quiz-option')
        if (quizOptions.length > 0) { // Nur ausführen, wenn es Quiz-Buttons gibt
            quizOptions.forEach(button => {
                button.addEventListener('click', function() {
                    const isCorrect = button.dataset.correct === 'true';
                    if (isCorrect) {
                        button.classList.add('correct');
                    } else {
                        button.classList.add('incorrect');
                    }
                    // Optional: Alle Buttons nach der ersten Antwort deaktivieren
                    quizOptions.forEach(btn => btn.disabled = true);
                });
            });
        }

    }
    if (exercise.type === 'test'){
        const checkBtn = document.getElementById('check-test-btn')
        const feedbackEl = document.getElementById('test-feedback')
        const inputs = document.querySelectorAll('.test-input')

        checkBtn.addEventListener('click', () => {
            let correctAnswers = 0;
            inputs.forEach(input => {
                const userAnswer = input.value.trim().toLowerCase()
                const correctAnswer = input.dataset.correctAnswer

                input.classList.remove('correct', 'incorrect')

                if (userAnswer === correctAnswer){
                    correctAnswers++
                    input.classList.add('correct')
                } else {
                    input.classList.add('incorrect')
                }
            });

            if (correctAnswers === inputs.length){
                feedbackEl.innerHTML = '<p class="correct-feedback">Perfekt! Die Lektion ist abgeschlossen.</p>';
                checkBtn.disabled = true;

                setTimeout(() => {
                    completeChapter(levelId, chapterId)
                }, 1500);
            } else {
                feedbackEl.innerHTML = '<p class="incorrect-feedback">Einige Antworten sind noch nicht richtig. Versuche es erneut!</p>';
            }
        });
    }
    const back_to_journey_btn = document.getElementById('back-to-journey-btn');
    back_to_journey_btn.addEventListener('click', function(){
        lesson_view.classList.remove('active');
        
        document.getElementById('map-view').classList.add('active');
    });
}

function completeChapter(levelId, chapterId) {
    const levelState = appState.levels[levelId];

    // 1. FORTSCHRITT AKTUALISIEREN
    // Finde das Kapitel im appState und markiere es als "besucht".
    const chapterToUpdate = levelState.chapters.find(c => c.id === chapterId);
    if (chapterToUpdate && !chapterToUpdate.visited) {
        chapterToUpdate.visited = true;
    }

    // 2. UI AKTUALISIEREN
    // Blende die Lern-Ansicht aus.
    document.getElementById('lesson-view').classList.remove('active');
    
    // Zeichne die Reise-Ebene neu, um den Pin grün zu färben.
    updateJourneyLayer(levelId);

    // 3. NÄCHSTES ZIEL FINDEN
    // Zähle, wie viele Kapitel jetzt besucht sind.
    const completedCount = levelState.chapters.filter(c => c.visited === true).length;
    // Das nächste Kapitel ist das an der Position des Zählers.
    const nextChapter = worldData[levelId].chapters[completedCount];

    // 4. ZUM ZIEL NAVIGIEREN
    if (nextChapter) {
        // Wenn es eine nächste Stadt gibt, schwenke dorthin.
        setTimeout(() => {
            panToCity(nextChapter.pos);
        }, 200); // Eine kleine Verzögerung für einen sauberen Übergang
    } else {
        // Wenn alle Städte fertig sind, zoome zur Italien-Karte zurück.
        showRegions();
    }
}



