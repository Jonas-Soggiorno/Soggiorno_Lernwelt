import {worldData} from './world.js';

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
                { id: 'Torino', visited: false, completed: false },
                { id: 'Asti', visited: false, completed: false }
            ]
        },
        "A1_3": {
            status: 'locked',
            chapters: [
                { id: 'parma', visited: false, completed: false },
                { id: 'ferrara', visited: false, completed: false}
            ]
        },
    }
};
let mapCanvas = null;
let initialViewBox = "";
let currentLevelData = null;

//===APP START===
document.addEventListener('DOMContentLoaded', initApp);

function initApp(){
    buildMap();
    initEventListeners();
}



function buildMap() {
    mapCanvas = document.getElementById('map-canvas');
    mapCanvas.innerHTML = '';

    const regionsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    regionsLayer.id = 'regions-layer';
    mapCanvas.appendChild(regionsLayer);

    // Erstellt nur noch die klickbaren Regionen der Italien-Karte
    for (const levelId in worldData) {
        const levelData = worldData[levelId];
        const regionPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        regionPath.setAttribute('d', levelData.regionPathData);
        regionPath.setAttribute('id', `region-${levelId}`);
        regionPath.classList.add('region-path');
        
        if (appState.levels[levelId].status === 'locked') {
            regionPath.classList.add('locked');
        }

        regionPath.addEventListener('click', () => showJourney(levelId));
        regionsLayer.appendChild(regionPath);
    }
    
    // Setzt die initiale viewBox (dein Code von vorher)
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
            const targetChapter = currentLevelData.chapters[targetChapterIndex];
            const focalPoint = targetChapter.pos;

            // --- ZIEL-VIEWBOX BERECHNEN ---
            const regionBBox = regionPath.getBBox();
            const canvasRect = mapCanvas.getBoundingClientRect();
            const targetViewBoxHeight = regionBBox.height / 0.7;
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

    levelData.chapters.forEach((chapter, index) => {
        if (chapter.path) {
            const journeyPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            journeyPath.setAttribute('d', chapter.path);
            journeyPath.classList.add('journey-path');
            if (index < appState.levels[levelId].chapters.filter(c => c.completed).length) {
                journeyPath.classList.add('completed');
            }
            journeyLayer.appendChild(journeyPath);
        }
    });

    levelData.chapters.forEach((chapter, index) => {
        const svg_group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const levelState = appState.levels[levelId];
        const completedCount = levelState.chapters.filter(c => c.completed === true).length;
        const isCompleted = index < completedCount;
        const isNext = index === completedCount;

        if (isCompleted) { svg_group.classList.add('completed'); }
        else if (isNext) { svg_group.classList.add('next-stop'); }
        else { svg_group.classList.add('locked'); }

        const svg_circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        svg_circle.setAttribute('cx', chapter.pos.x);
        svg_circle.setAttribute('cy', chapter.pos.y);
        svg_circle.setAttribute('r', 3);
        svg_circle.classList.add('city-pin');
        
        svg_group.addEventListener('click', function() {
            if (svg_group.classList.contains('locked')) return;
            panToCity(chapter.pos);
            openLessonPanel(levelId, chapter.id);
        });

        svg_group.appendChild(svg_circle);
        journeyLayer.appendChild(svg_group);
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
        document.getElementById('regions-layer').classList.remove('hidden');
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
            card.innerHTML = `<div class="module-icon">${exercise.data.icon}</div><h3 class="module-title">${exercise.data.title}</h3>`;
            card.addEventListener('click', () => {
                lessonPanel.classList.remove('visible');
                document.getElementById('map-view').classList.remove('active');
                renderExercise(levelId, chapterId, index);
            });
            lessonPanelContent.appendChild(card);
        });
        
        lessonPanel.classList.add('visible');
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
    const exercise = currentLevelData.content[chapterId][exerciseIndex];
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
    } else if (exercise.type === 'geografie'){
        contentHTML = `
            <div class="modal-header">
                <h2>${moduleData.title}</h2>
            </div>
            <div class="info-content">
                <img src="https://source.unsplash.com/800x600/?${moduleData.image}" alt="${moduleData.title}">
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

        // Baue die Karten von hinten nach vorne auf
        cardsData.slice().reverse().forEach(cardInfo => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card-stack-item';
            cardEl.innerHTML = `
                <div class="flashcard-inner">
                    <div class="flashcard-face flashcard-front">${cardInfo.q}</div>
                    <div class="flashcard-face flashcard-back">${cardInfo.a}</div>
                </div>`;
            stackContainer.appendChild(cardEl);
            allCards.push(cardEl);
        });

        allCards.forEach(card => {
            const hammer = new Hammer(card);
            hammer.get('pan').set({ threshold: 10, direction: Hammer.DIRECTION_HORIZONTAL });
            hammer.get('tap').requireFailure('pan');

            // Tippen zum Umdrehen
            hammer.on('tap', () => {
                card.querySelector('.flashcard-inner').classList.toggle('is-flipped');
            });

            // Wischen
            hammer.on('pan', (e) => {
                if (card.querySelector('.flashcard-inner').classList.contains('is-flipped')) return;
                // BENUTZE GSAP, um die Position zu setzen, nicht style.transform
                gsap.set(card, {
                    x: e.deltaX,
                    rotation: e.deltaX / 10
                });
            });

            // Loslassen
            hammer.on('panend', (e) => {
                if (card.querySelector('.flashcard-inner').classList.contains('is-flipped')) return;

                // Töte alle alten Animationen auf dieser Karte
                gsap.killTweensOf(card);

                if (Math.abs(e.deltaX) > 100) {
                    // Weit genug gewischt: Wegfliegen lassen
                    const flingDistance = e.velocityX * 300;
                    gsap.to(card, {
                        x: e.deltaX + flingDistance,
                        rotation: (e.deltaX / 10) + (e.velocityX * 15),
                        duration: 0.5,
                        ease: "power1.out",
                        onComplete: () => {
                            // Karte für Wiederverwendung zurücksetzen
                            gsap.set(card, { x: 0, y: 0, rotation: 0, display: 'none' });
                            const parent = card.parentElement;
                            parent.insertBefore(card, parent.firstChild);
                            setTimeout(() => gsap.set(card, { display: 'block' }), 20);
                        }
                    });
                } else {
                    // Nicht weit genug: Zurückschnappen lassen
                    gsap.to(card, {
                        x: 0,
                        rotation: 0,
                        duration: 0.4,
                        ease: "elastic.out(1, 0.75)"
                    });
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
    if (back_to_journey_btn) {
        back_to_journey_btn.addEventListener('click', function(){
            lesson_view.classList.remove('active');
            document.getElementById('map-view').classList.add('active');
        });
    }

}

function completeChapter(levelId, chapterId) {

    const levelState = appState.levels[levelId];
    const chapterToUpdate = levelState.chapters.find(c => c.id === chapterId);
    if (chapterToUpdate && !chapterToUpdate.completed) {
        chapterToUpdate.completed = true;
    }

    document.getElementById('lesson-view').classList.remove('active');
    document.getElementById('map-view').classList.add('active');

    buildJourneyLayer(levelId, currentLevelData);

    const completedCount = levelState.chapters.filter(c => c.visited === true).length;
    const nextChapter = currentLevelData.chapters[completedCount];
    

    if (nextChapter) {
        setTimeout(() => {
            panToCity(nextChapter.pos);
        }, 200); 
    } else {
        showRegions();
    }

    showJourney(levelId)
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
        });
        grid.appendChild(card);
    });
}