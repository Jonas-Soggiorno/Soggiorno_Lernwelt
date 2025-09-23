import {worldData} from './data.js';

let appState = {
    levels: {
        "A1_1": { status: 'unlocked', completedChapters: 0},
        "A1_2": { status: 'unlocked', completedChapters: 0}
    }
};

let journeyPanZoom = null;

let currentLevelId = null;

document.addEventListener('DOMContentLoaded', function() {

    const region_view = document.getElementById('region-view')
    const journey_view = document.getElementById('journey-view')
    const lesson_view = document.getElementById('lesson-view')
    const regionMap = document.getElementById('region-map')

    const back_to_italy_btn = document.getElementById('back-to-italy-btn')
    const lessonPanelClose_btn = document.getElementById('lesson-panel-close-btn')
    const lessonPanel = document.getElementById('lesson-panel')
    

    for (let datapack in worldData) {
        const new_region_path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        new_region_path.setAttribute('d', worldData[datapack].regionPathData)
        new_region_path.setAttribute('id', datapack)
        new_region_path.setAttribute('class', 'region-path')

        new_region_path.addEventListener('click', function() {
            region_view.classList.remove('active')
            journey_view.classList.add('active')
            currentLevelId = datapack
            buildJourneyMap(currentLevelId)
        });

        regionMap.appendChild(new_region_path)
    }

    back_to_italy_btn.addEventListener('click', function() {
        journey_view.classList.remove('active')
        region_view.classList.add('active')
    });

    lessonPanelClose_btn.addEventListener('click', function() {
        lessonPanel.classList.remove('visible')
    });

    const back_to_journey_btn = document.getElementById('back-to-journey-btn')
    back_to_journey_btn.addEventListener('click', function(){
        lesson_view.classList.remove('active')
        journey_view.classList.add('active')
    });

    window.addEventListener('resize', () => {
        if (journeyPanZoom) {
            setTimeout(() => {
                journeyPanZoom.resize()
                journeyPanZoom.fit()
                journeyPanZoom.center()
            }, 100);
        }
    });

    const mapView = document.getElementById('journey-view')
    mapView.addEventListener('touchmove', function(event){
        event.preventDefault()
    }, {passive: false});

});


function buildJourneyMap(levelId){
    const levelData = worldData[levelId]
    const journeyMap = document.getElementById('journey-map')
    journeyMap.innerHTML = ''

    let nextCityPosition = null

    const path = document.createElementNS('http://www.w3.org/2000/svg','path')
    path.setAttribute('d', levelData.regionPathData)
    path.classList.add('journey-region-path')
    journeyMap.appendChild(path)


    levelData.chapters.forEach((chapter, index) => {
        if (chapter.path) {
            const journeyPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            journeyPath.setAttribute('d', chapter.path);
            journeyPath.setAttribute('class', 'journey-path');

            if (index < appState.levels[levelId].completedChapters) {
                journeyPath.classList.add('completed');
            }

            journeyMap.appendChild(journeyPath);
        }
    });
    

    levelData.chapters.forEach((chapter, index) => {
        const svg_group = document.createElementNS('http://www.w3.org/2000/svg','g')

        const levelState = appState.levels[levelId]
        const isCompleted = index < levelState.completedChapters;
        const isNext = index === levelState.completedChapters;

        if (isNext){
            nextCityPosition = chapter.pos;
        }

        const svg_circle = document.createElementNS('http://www.w3.org/2000/svg','circle')
        svg_circle.setAttribute('cx', chapter.pos.x)
        svg_circle.setAttribute('cy', chapter.pos.y)
        svg_circle.setAttribute('r', 3)
        svg_circle.classList.add('city-pin')
        svg_circle.addEventListener('click', function() {
            if (svg_group.classList.contains('locked')) {
                return; // Stoppt die Funktion sofort
            }
            openLessonPanel(levelId, chapter.id)
        });

        const svg_text = document.createElementNS('http://www.w3.org/2000/svg','text')
        svg_text.setAttribute("x", chapter.pos.x)
        svg_text.setAttribute("y", chapter.pos.y)
        svg_text.textContent = chapter.name
        svg_text.classList.add('map-city-name')
        

        if (isCompleted) {
            svg_group.classList.add('completed')
        } else if (isNext) {
            svg_group.classList.add('next-stop')
        } else {
            svg_group.classList.add('locked')
        }


        svg_group.appendChild(svg_circle)
        //svg_group.appendChild(svg_text)  Ich weiß noch nicht ob ich diesen Text anzeigen will...

        journeyMap.appendChild(svg_group)
    });

    const bbox = journeyMap.getBBox();

    const padding = 20;
    const viewBox = `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + (padding * 2)} ${bbox.height + (padding * 2)}`;

    journeyMap.setAttribute('viewBox', viewBox)

    if (journeyPanZoom) {
        journeyPanZoom.destroy();
        journeyPanZoom = null;
    }

    const journeyMapElement = document.getElementById('journey-map');

    // 2. Zwinge den Browser, das Layout JETZT zu berechnen (ein Profi-Trick)
    journeyMapElement.getBoundingClientRect();

    // 3. Warte auf den nächsten "Paint Cycle" des Browsers
    requestAnimationFrame(() => {

        // 4. Vermesse den INHALT der Karte
        const bbox = journeyMapElement.getBBox();

        // Sicherheits-Check: Wenn der Inhalt keine Größe hat, ist etwas fundamental falsch
        if (bbox.width === 0 || bbox.height === 0) {
            console.error("SVG-Inhalt hat keine Größe! Überprüfe die Pfad-Daten in data.js.");
            return; // Funktion hier abbrechen
        }

        // 5. Setze die viewBox basierend auf der Größe des Inhalts
        const padding = 20;
        const viewBoxValue = `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + (padding * 2)} ${bbox.height + (padding * 2)}`;
        journeyMapElement.setAttribute('viewBox', viewBoxValue);

        // 6. JETZT ERST die panzoom-Bibliothek auf dem korrekt skalierten SVG initialisieren
        journeyPanZoom = Panzoom(journeyMapElement, {
            maxScale: 10,
            minScale: 0.75,
            contain: 'outside'
        });
        
        journeyMapElement.parentElement.addEventListener('wheel', journeyPanZoom.zoomWithWheel);

        // 7. FÜHRE JETZT ERST den initialen Zoom auf die nächste Stadt aus
        if (nextCityPosition) {
            const scale = 1.5;
            // Wichtig: Wir benutzen jetzt clientWidth/clientHeight, da das SVG jetzt skaliert ist
            const centerX = journeyMapElement.clientWidth / 2;
            const centerY = journeyMapElement.clientHeight / 2;
            const panX = -nextCityPosition.x * scale + centerX;
            const panY = -nextCityPosition.y * scale + centerY;

            // Kleiner Timeout, damit die Bibliothek vollständig bereit ist
            setTimeout(() => {
                journeyPanZoom.pan(panX, panY);
                journeyPanZoom.zoom(scale, { animate: true });
            }, 50);
        }
    });

}


function openLessonPanel(levelId, chapterId){
    const lessonPanel = document.getElementById('lesson-panel')
    const lessonPanelTitel = document.getElementById('lesson-panel-title')
    const lessonPanelContent = document.getElementById('lesson-panel-content')

    const cityData = worldData[levelId].chapters.find(chap => chap.id === chapterId)
    const contentData = worldData[levelId].content[chapterId]

    lessonPanelTitel.textContent = cityData.name;
    lessonPanelContent.innerHTML = ''

    const journey_view = document.getElementById('journey-view')

    contentData.forEach((exercise, index) => {
        const card = document.createElement('div');
        card.className = 'module-card';
        card.innerHTML = `
            <div class="module-icon">${exercise.data.icon}</div>
            <h3 class="module-title">${exercise.data.title}</h3>
        `;

        card.addEventListener('click', function(){
            lessonPanel.classList.remove('visible');
            journey_view.classList.remove('active');

            renderExercise(levelId, chapterId, index); 
        });

        lessonPanelContent.appendChild(card);
    });

    lessonPanel.classList.add('visible')
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
}

function completeChapter(levelId, chapterId){
    const levelState = appState.levels[levelId]
    const chapterIndex = worldData[levelId].chapters.findIndex(chap => chap.id === chapterId)

    if (chapterIndex === levelState.completedChapters){
        levelState.completedChapters++;
    }

    if (levelState.completedChapters === worldData[levelId].chapters.length){
        levelState.status = 'completed';
        const currentLevelIndex = levelOrder.indexOf(levelId)

        if (currentLevelIndex +1 < levelOrder.length){
            const nextLevelId = levelOrder[currentLevelIndex +1]
            appState.levels[nextLevelId].status = 'unlocked';
        }
    }

    document.getElementById('lesson-view').classList.remove('active')
    document.getElementById('journey-view').classList.add('active')
    buildJourneyMap(levelId)
}
