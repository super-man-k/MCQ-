document.addEventListener('DOMContentLoaded', () => {
    
    // ==================== Combine Questions from Separate Files ====================
    const allQuestions = [
        ...hardwareQuestions,
        ...softwareQuestions,
        ...osQuestions,
        ...networkQuestions,
        ...nsquestions
    ];

    const questionsByCategory = {
        hardware: hardwareQuestions,
        software: softwareQuestions,
        os: osQuestions,
        network: networkQuestions,
        numbersys: nsquestions
    };

    // ==================== DOM Elements ====================
    const startScreen = document.getElementById('start-screen');
    const quizScreen = document.getElementById('quiz-screen');
    const resultScreen = document.getElementById('result-screen');
    // ... (rest of the DOM element selections remain the same)
    const reviewScreen = document.getElementById('review-screen');
    const modeButtons = document.querySelectorAll('.mode-btn');
    const topicSelection = document.getElementById('topic-selection');
    const topicButtonsContainer = document.getElementById('topic-buttons-container');
    const quizTitle = document.getElementById('quiz-title');
    const timerEl = document.getElementById('timer');
    const questionsContainer = document.getElementById('questions-container');
    const submitBtn = document.getElementById('submit-btn');
    const scoreDetails = document.getElementById('score-details');
    const reviewBtn = document.getElementById('review-btn');
    const restartBtn = document.getElementById('restart-btn');
    const reviewContainer = document.getElementById('review-container');
    const backToResultBtn = document.getElementById('back-to-result-btn');
    
    // ==================== State Variables ====================
    let currentMode = '', currentTopic = '', timerInterval;
    let quizQuestions = [], userAnswers = {}, score = 0;
    const NUM_QUESTIONS = 10;

    // ==================== Helper Functions ====================
    const shuffleArray = (array) => [...array].sort(() => Math.random() - 0.5);
    const switchScreen = (from, to) => {
        from.classList.add('hide');
        to.classList.remove('hide');
    };

    // ==================== Main Logic Functions ====================
    function setupAndStartQuiz() {
        if (setupQuiz()) {
            switchScreen(startScreen, quizScreen);
            startQuiz();
        }
    }

    modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentMode = button.getAttribute('data-mode');
            modeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            topicSelection.classList.toggle('hide', currentMode !== 'topic-wise');
            if (currentMode !== 'topic-wise') {
                setupAndStartQuiz();
            }
        });
    });

    topicButtonsContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            currentTopic = e.target.getAttribute('data-topic');
            document.querySelectorAll('.topic-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            setupAndStartQuiz();
        }
    });
    
    submitBtn.addEventListener('click', () => submitQuiz());
    reviewBtn.addEventListener('click', () => switchScreen(resultScreen, reviewScreen));
    backToResultBtn.addEventListener('click', () => switchScreen(reviewScreen, resultScreen));
    restartBtn.addEventListener('click', () => {
        resetState();
        switchScreen(resultScreen, startScreen);
    });

    // ==================== Core Quiz Functions (Updated) ====================
    function setupQuiz() {
        let title = '';
        
        if (currentMode === 'overall') {
            title = 'Overall';
            const hardwareQs = shuffleArray(questionsByCategory.hardware).slice(0, 3);
            const softwareQs = shuffleArray(questionsByCategory.software).slice(0, 2);
            const osQs = shuffleArray(questionsByCategory.os).slice(0, 3);
            const networkQs = shuffleArray(questionsByCategory.network).slice(0, 2);
            const nsQs = shuffleArray(questionsByCategory.numbersys).slice(0, 2);
            quizQuestions = shuffleArray([...hardwareQs, ...softwareQs, ...osQs, ...networkQs, ...nsQs]);

        } else if (currentMode === 'topic-wise') {
            const topicButton = document.querySelector(`.topic-btn[data-topic='${currentTopic}']`);
            title = `Topic: ${topicButton.textContent}`;
            const filtered = questionsByCategory[currentTopic] || [];
            quizQuestions = shuffleArray(filtered).slice(0, NUM_QUESTIONS);
        } else { // Rapid Fire
            title = 'Rapid Fire';
            quizQuestions = shuffleArray(allQuestions).slice(0, NUM_QUESTIONS);
        }

        if (quizQuestions.length < NUM_QUESTIONS && (currentMode === 'overall' || currentMode === 'rapid-fire')) {
            alert('Not enough questions in the database to start this mode.');
            resetState();
            return false;
        } else if (quizQuestions.length === 0 && currentMode === 'topic-wise') {
             alert(`No questions available for the topic: ${currentTopic}.`);
             resetState();
             return false;
        }
        
        quizTitle.textContent = title;
        return true;
    }

    function startQuiz() {
        displayQuestions();
        const timeLimit = currentMode === 'rapid-fire' ? 60 : 300; // 1 min or 5 mins
        startTimer(timeLimit);
    }
    
    function displayQuestions() {
        questionsContainer.innerHTML = '';
        quizQuestions.forEach((q, index) => {
            const questionBlock = document.createElement('div');
            questionBlock.className = 'question-block';
            questionBlock.innerHTML = `<p class="question-text">${index + 1}. ${q.question}</p>`;
            const optionsList = document.createElement('ul');
            optionsList.className = 'options-list';
            shuffleArray(q.options).forEach(option => {
                const li = document.createElement('li');
                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = `question${index}`;
                radio.value = option;
                const label = document.createElement('label');
                label.textContent = option;
                li.append(radio, label);
                li.addEventListener('click', () => {
                    radio.checked = true;
                    document.querySelectorAll(`input[name="question${index}"]`).forEach(r => r.parentElement.classList.remove('selected'));
                    li.classList.add('selected');
                });
                optionsList.appendChild(li);
            });
            questionBlock.appendChild(optionsList);
            questionsContainer.appendChild(questionBlock);
        });
    }

    function startTimer(duration) {
        let timer = duration;
        timerInterval = setInterval(() => {
            const minutes = String(Math.floor(timer / 60)).padStart(2, '0');
            const seconds = String(timer % 60).padStart(2, '0');
            timerEl.textContent = `${minutes}:${seconds}`;
            if (--timer < 0) {
                clearInterval(timerInterval);
                submitQuiz();
            }
        }, 1000);
    }

    function submitQuiz() {
        clearInterval(timerInterval);
        score = 0;
        userAnswers = {};
        quizQuestions.forEach((q, index) => {
            const selectedOption = document.querySelector(`input[name="question${index}"]:checked`);
            userAnswers[index] = selectedOption ? selectedOption.value : null;
            if (userAnswers[index] === q.answer) score++;
        });

        const total = quizQuestions.length;
        const incorrect = total - score;
        scoreDetails.innerHTML = `
            Total Questions: <strong>${total}</strong><br>
            Correct Answers: <strong style="color: #28a745;">${score}</strong><br>
            Incorrect Answers: <strong style="color: #dc3545;">${incorrect}</strong>
        `;
        displayReview();
        switchScreen(quizScreen, resultScreen);
    }

    function displayReview() {
        reviewContainer.innerHTML = '';
        quizQuestions.forEach((q, index) => {
            const userAnswer = userAnswers[index];
            const isCorrect = userAnswer === q.answer;
            const reviewBlock = document.createElement('div');
            reviewBlock.className = `review-block ${isCorrect ? 'correct' : 'incorrect'}`;
            reviewBlock.innerHTML = `
                <p class="question-text">${index + 1}. ${q.question}</p>
                <p><strong>Correct Answer:</strong> <span class="correct-answer">${q.answer}</span></p>
                <p><strong>Your Answer:</strong> <span class="user-answer ${isCorrect ? '' : 'incorrect'}">${userAnswer || 'Not Answered'}</span></p>
            `;
            reviewContainer.appendChild(reviewBlock);
        });
    }
    
    function resetState() {
        currentMode = '';
        currentTopic = '';
        clearInterval(timerInterval);
        document.querySelectorAll('.mode-btn, .topic-btn').forEach(btn => btn.classList.remove('active'));
        topicSelection.classList.add('hide');
    }

});
