import {worldData} from './data.js';

let currentLevelId = null;

document.addEventListener('DOMContentLoaded', function() {

    const region_view = document.getElementById('region-view')
    const journey_view = document.getElementById('journey-view')
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
            console.log(currentLevelId)
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
});

function buildJourneyMap(levelId){
    const levelData = worldData[levelId]
    const journeyMap = document.getElementById('journey-map')
    journeyMap.innerHTML = ''

    const path = document.createElementNS('http://www.w3.org/2000/svg','path')
    path.setAttribute('d', levelData.regionPathData)
    path.classList.add('journey-region-path')
    journeyMap.appendChild(path)

    for (const chapter of levelData.chapters){
        if (chapter.path){
            const journeyPath = document.createElementNS('http://www.w3.org/2000/svg','path')
            journeyPath.setAttribute('d', chapter.path)
            journeyPath.setAttribute('class', 'journey-path')
            journeyMap.appendChild(journeyPath)
        }
    }

    for (const chapter of levelData.chapters){
        const svg_group = document.createElementNS('http://www.w3.org/2000/svg','g')

        const svg_circle = document.createElementNS('http://www.w3.org/2000/svg','circle')
        svg_circle.setAttribute('cx', chapter.pos.x)
        svg_circle.setAttribute('cy', chapter.pos.y)
        svg_circle.setAttribute('r', 3)
        svg_circle.classList.add('city-pin')
        svg_circle.addEventListener('click', function() {
            openLessonPanel(levelId, chapter.id)
        });

        const svg_text = document.createElementNS('http://www.w3.org/2000/svg','text')
        svg_text.setAttribute("x", chapter.pos.x)
        svg_text.setAttribute("y", chapter.pos.y)
        svg_text.textContent = chapter.name
        svg_text.classList.add('map-city-name')
        
        svg_group.appendChild(svg_circle)
        //svg_group.appendChild(svg_text)  Ich weiß noch nicht ob ich diesen Text anzeigen will...

        journeyMap.appendChild(svg_group)
    }
}


function openLessonPanel(levelId, chapterId){
    const lessonPanel = document.getElementById('lesson-panel')
    const lessonPanelTitel = document.getElementById('lesson-panel-title')
    const lessonPanelContent = document.getElementById('lesson-panel-content')

    const cityData = worldData[levelId].chapters.find(chap => chap.id === chapterId)
    const contentData = worldData[levelId].content[chapterId]

    lessonPanelTitel.textContent = cityData.name;
    lessonPanelContent.innerHTML = ''

    for (const key in contentData){
        const contentTitle = contentData[key].title
        const contentIcon = contentData[key].icon

        const card = document.createElement('div')
        card.className = 'module-card'
        card.innerHTML =  

        `
        <div class="module-icon">${contentData[key].icon}</div>
        <h3 class="module-title">${contentData[key].title}</h3>
        `;

        card.addEventListener('click', function(){
            openModal(levelId, chapterId, key);
        });

        lessonPanelContent.appendChild(card)
    }

    lessonPanel.classList.add('visible')
}


function openModal(levelId, chapterId, moduleKey){
    const moduleData = worldData[levelId].content[chapterId][moduleKey]
    const modal_container = document.getElementById('modal-container')
    const modal_content = document.getElementById('modal-content')

    modal_content.innerHTML = ''

    let contentHTML = ''

    switch (moduleKey) {
        case 'vokabeln':
            contentHTML = `
                <div class="modal-header">
                    <h2>${moduleData.title}</h2>
                    <button id="modal-close-btn">×</button>
                </div>
                <div id="flashcard">
                    <div id="flashcard-inner">
                        <div class="flashcard-face flashcard-front">
                            ${moduleData.cards[0].q}
                        </div>
                        <div class="flashcard-face flashcard-back">
                            ${moduleData.cards[0].a}
                        </div>
                    </div>
                </div>
            `;
            break;

        case 'grammatik':
            contentHTML = `
                <div class="modal-header">
                    <h2>${moduleData.title}</h2>
                    <button id="modal-close-btn">×</button>
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
            break;

        case 'stadt':
            contentHTML = `
                <button id="modal-close-btn">×</button>
                <h2>Stadt-Info</h2>
                <p>Informationen über die Stadt ${chapterId}...</p>
            `;
            break;
    }
    modal_content.innerHTML = contentHTML
    
    const closeModalBtn = document.getElementById('modal-close-btn')
    closeModalBtn.addEventListener('click', function() {
        modal_container.classList.remove('visible')
    });
    
    const flashcard = document.getElementById('flashcard')
    if (flashcard){
        flashcard.addEventListener('click', function(){
            flashcard.classList.toggle('is-flipped')
        });
    }

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

    modal_container.classList.add('visible')
}