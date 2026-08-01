(() => {
  'use strict';

  const STORAGE_KEY = 'groupActivityCarnival:v2';
  const DEFAULT_QUESTIONS = [
    { id: crypto.randomUUID(), question: '香港最高的山峰是哪一座？', options: ['太平山', '大帽山', '獅子山', '鳳凰山'], answer: 1, score: 100, explanation: '大帽山海拔約 957 米，是香港最高峰。' },
    { id: crypto.randomUUID(), question: '下列哪一項最適合作為小組破冰活動？', options: ['沉默閱讀', '互相介紹與找共同點', '個人考試', '填寫長問卷'], answer: 1, score: 100, explanation: '互相介紹及尋找共同點能快速建立交流和安全感。' },
    { id: crypto.randomUUID(), question: '一個標準多項選擇題通常包含甚麼？', options: ['題目及選項', '只有答案', '只有圖片', '只有分數'], answer: 0, score: 100, explanation: '多項選擇題至少需要題目、選項及指定正確答案。' },
    { id: crypto.randomUUID(), question: '進行抽獎時，哪項設定有助提升公平性？', options: ['隱藏所有名單', '設定參加條件', '只抽熟悉的人', '每次指定同一人'], answer: 1, score: 100, explanation: '清晰設定參加條件，有助確保合資格人士被公平納入抽選。' }
  ];

  const DEFAULT_PARTICIPANTS = [
    { id: crypto.randomUUID(), name: '小明', attended: true, taskDone: true, points: 120 },
    { id: crypto.randomUUID(), name: '小美', attended: true, taskDone: true, points: 100 },
    { id: crypto.randomUUID(), name: '阿豪', attended: true, taskDone: false, points: 80 },
    { id: crypto.randomUUID(), name: '小琪', attended: false, taskDone: true, points: 60 },
    { id: crypto.randomUUID(), name: '阿晴', attended: true, taskDone: true, points: 140 },
    { id: crypto.randomUUID(), name: '小杰', attended: true, taskDone: true, points: 95 },
    { id: crypto.randomUUID(), name: '樂兒', attended: true, taskDone: false, points: 110 },
    { id: crypto.randomUUID(), name: '志軒', attended: true, taskDone: true, points: 130 }
  ];


  const DEFAULT_BIGTV_CATEGORIES = [
    { id: 'action', name: '動作類', icon: '🏃' },
    { id: 'animal', name: '動物類', icon: '🐾' },
    { id: 'life', name: '日常生活類', icon: '🏠' },
    { id: 'sports', name: '運動類', icon: '🏀' },
    { id: 'cartoon', name: '卡通角色類', icon: '🎭' },
    { id: 'job', name: '職業類', icon: '💼' }
  ];

  const DEFAULT_BIGTV_QUESTIONS = [
    { id: crypto.randomUUID(), prompt: '刷牙', categoryId: 'action', difficulty: '中等' },
    { id: crypto.randomUUID(), prompt: '打羽毛球', categoryId: 'sports', difficulty: '中等' },
    { id: crypto.randomUUID(), prompt: '游泳', categoryId: 'action', difficulty: '簡單' },
    { id: crypto.randomUUID(), prompt: '獅子', categoryId: 'animal', difficulty: '簡單' },
    { id: crypto.randomUUID(), prompt: '洗頭', categoryId: 'life', difficulty: '簡單' },
    { id: crypto.randomUUID(), prompt: '開車', categoryId: 'life', difficulty: '中等' },
    { id: crypto.randomUUID(), prompt: '恐龍', categoryId: 'animal', difficulty: '中等' },
    { id: crypto.randomUUID(), prompt: '老師', categoryId: 'job', difficulty: '簡單' },
    { id: crypto.randomUUID(), prompt: '超人', categoryId: 'cartoon', difficulty: '中等' },
    { id: crypto.randomUUID(), prompt: '踢足球', categoryId: 'sports', difficulty: '中等' },
    { id: crypto.randomUUID(), prompt: '刷牆', categoryId: 'job', difficulty: '困難' },
    { id: crypto.randomUUID(), prompt: '企鵝', categoryId: 'animal', difficulty: '簡單' }
  ];

  const DEFAULT_BIGTV_TEAMS = [
    { id: crypto.randomUUID(), name: '第一組', mascot: '🐶', score: 240, solved: 1, color: 'red' },
    { id: crypto.randomUUID(), name: '第二組', mascot: '🐱', score: 180, solved: 1, color: 'blue' },
    { id: crypto.randomUUID(), name: '第三組', mascot: '🐻', score: 210, solved: 1, color: 'purple' },
    { id: crypto.randomUUID(), name: '第四組', mascot: '🐰', score: 160, solved: 0, color: 'orange' }
  ];

  const initialState = {
    questions: DEFAULT_QUESTIONS,
    participants: DEFAULT_PARTICIPANTS,
    wheelSettings: { requireAttendance: true, requireTask: false, minPointsEnabled: false, minPoints: 80, allowRepeat: false },
    quizSettings: { secondsPerQuestion: 20, shuffleQuestions: true, shuffleOptions: true, showExplanation: true },
    bigTvQuestions: DEFAULT_BIGTV_QUESTIONS,
    bigTvCategories: DEFAULT_BIGTV_CATEGORIES,
    bigTvSettings: { teamCount: 4, secondsPerRound: 20, scoringMode: 'speed', pointsPerCorrect: 100, splitScreen: true, selectedCategoryId: 'action', rounds: 5, theme: 'classic' },
    bigTvTeams: DEFAULT_BIGTV_TEAMS,
    bigTvGame: { active: false, queue: [], currentQuestionId: null, currentTeamIndex: 0, roundIndex: 0, secondsLeft: 20, paused: false, showAnswer: false },
    drawnIds: [],
    soundEnabled: true
  };

  const state = loadState();
  const root = document.getElementById('viewRoot');
  const toastRegion = document.getElementById('toastRegion');
  const modalLayer = document.getElementById('modalLayer');
  const mobileNav = document.getElementById('mobileNav');
  const menuButton = document.getElementById('menuButton');
  const soundToggle = document.getElementById('soundToggle');

  let currentRoute = getRoute();
  let wheelRotation = 0;
  let quizSession = null;
  let quizTimer = null;
  let participantPage = 0;
  let bankPage = 0;
  const PARTICIPANTS_PER_PAGE = 5;
  const QUESTIONS_PER_PAGE = 4;

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(initialState);
      const parsed = JSON.parse(raw);
      return {
        ...structuredClone(initialState),
        ...parsed,
        wheelSettings: { ...initialState.wheelSettings, ...(parsed.wheelSettings || {}) },
        quizSettings: { ...initialState.quizSettings, ...(parsed.quizSettings || {}) },
        bigTvSettings: { ...initialState.bigTvSettings, ...(parsed.bigTvSettings || {}) },
        bigTvGame: { ...initialState.bigTvGame, ...(parsed.bigTvGame || {}) },
        bigTvCategories: Array.isArray(parsed.bigTvCategories) && parsed.bigTvCategories.length ? parsed.bigTvCategories : structuredClone(initialState.bigTvCategories),
        bigTvQuestions: Array.isArray(parsed.bigTvQuestions) && parsed.bigTvQuestions.length ? parsed.bigTvQuestions : structuredClone(initialState.bigTvQuestions),
        bigTvTeams: Array.isArray(parsed.bigTvTeams) && parsed.bigTvTeams.length ? parsed.bigTvTeams : structuredClone(initialState.bigTvTeams)
      };
    } catch (error) {
      console.warn('Unable to load saved state', error);
      return structuredClone(initialState);
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getRoute() {
    const route = location.hash.replace(/^#\/?/, '').split('?')[0];
    return ['home', 'wheel', 'quiz', 'tv', 'tvplay', 'bank'].includes(route) ? route : 'home';
  }

  function setRoute(route) {
    location.hash = route;
  }

  function render() {
    currentRoute = getRoute();
    document.querySelectorAll('[data-route]').forEach((button) => { const route = button.dataset.route; const active = route === currentRoute || (route === 'tv' && currentRoute === 'tvplay'); button.classList.toggle('is-active', active); });
    mobileNav.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    clearQuizTimer();

    const views = { home: renderHome, wheel: renderWheel, quiz: renderQuiz, tv: renderTV, tvplay: renderTVPlay, bank: renderBank };
    root.innerHTML = views[currentRoute]();
    root.focus({ preventScroll: true });
    bindRouteActions();
    const binders = { home: bindHome, wheel: bindWheel, quiz: bindQuiz, tv: bindTV, tvplay: bindTVPlay, bank: bindBank };
    binders[currentRoute]();
  }

  function renderHome() {
    return `
      <div class="page">
        <section class="hero" aria-labelledby="heroTitle">
          <div class="carnival-lights"></div><div class="bunting"></div>
          <div class="hero-grid">
            <div class="hero-copy">
              <h1 id="heroTitle">小組活動<span>綜合平台</span></h1>
              <p>把抽獎、問答與題庫管理集中在一個有趣又易用的平台，讓每一次小組活動都更有氣氛、更有參與感。</p>
              <div class="hero-actions">
                <button class="btn btn-primary" data-route="wheel">🎡 立即玩抽獎輪盤</button>
                <button class="btn btn-ghost" data-route="bank">📚 建立題庫</button>
              </div>
            </div>
            <div class="hero-visual" aria-hidden="true">
              <div class="ferris"></div>
              <div class="ringmaster">🐶</div>
            </div>
          </div>
        </section>

        <section class="section" aria-labelledby="toolsHeading">
          <div class="section-heading"><div><h2 id="toolsHeading">熱門工具・第一階段</h2><p>三個核心工具已可直接使用及設定。</p></div></div>
          <div class="tool-grid">
            <article class="tool-card">
              <div class="card-title-row">
                <div class="card-title"><span class="number-badge">1</span><div><h3>抽獎輪盤</h3><p>精美動畫 × 條件抽選</p></div></div>
                <div class="tags"><span class="tag coral">嘉年華動畫</span><span class="tag gold">公平抽選</span></div>
              </div>
              <div class="preview-stage">
                <div class="wheel-preview">
                  <div class="mini-wheel"></div>
                  <div class="condition-board"><strong>抽獎條件</strong><span>✓ 出席者</span><span>✓ 完成任務</span><span>✓ 積分達標</span><span>符合人數：${getEligibleParticipants().length} 人</span></div>
                </div>
              </div>
              <div class="card-actions"><button class="btn btn-coral" data-route="wheel">▶ 進入</button><button class="btn btn-ghost" data-route="wheel" data-focus="settings">⚙ 設定</button></div>
            </article>

            <article class="tool-card is-blue">
              <div class="card-title-row">
                <div class="card-title"><span class="number-badge">2</span><div><h3>多項選擇遊戲</h3><p>即時計分 × 題目管理</p></div></div>
                <div class="tags"><span class="tag green">即時計分</span><span class="tag">Excel 匯入</span></div>
              </div>
              <div class="preview-stage blue">
                <div class="quiz-preview">
                  <div class="quiz-toolbar"><span>第 2 題 / 共 ${state.questions.length} 題</span><span>00:15</span><span>⭐ 120</span></div>
                  <div class="quiz-preview-panel"><h4>香港最高的山峰是哪一座？</h4><div class="answer-grid"><div class="answer-chip">A 太平山</div><div class="answer-chip correct">B 大帽山 ✓</div><div class="answer-chip">C 獅子山</div><div class="answer-chip">D 鳳凰山</div></div></div>
                </div>
              </div>
              <div class="card-actions"><button class="btn btn-blue" data-route="quiz">▶ 進入</button><button class="btn btn-ghost" data-route="bank">⚙ 設定題庫</button></div>
            </article>
            </article>

            <article class="tool-card is-purple">
              <div class="card-title-row">
                <div class="card-title"><span class="number-badge">3</span><div><h3>大電視動作猜估</h3><p>看題目 × 做動作 × 隊友猜答案</p></div></div>
                <div class="tags"><span class="tag gold">多人競賽</span><span class="tag green">分割畫面</span></div>
              </div>
              <div class="preview-stage purple">
                <div class="tv-card-preview">
                  <div class="tv-card-banner">大電視</div>
                  <div class="tv-card-question">題目：打羽毛球</div>
                  <div class="tv-card-scoreboard">${renderBigTvTeamStrip()}</div>
                </div>
              </div>
              <div class="card-actions"><button class="btn btn-dark" data-route="tv">▶ 進入</button><button class="btn btn-ghost" data-route="tv">⚙ 設定</button></div>
            </article>
          </div>
        </section>

        <section class="section">
          <div class="section-heading"><div><h2>更多好玩工具</h2><p>已預留同一設計系統，方便日後擴充。</p></div></div>
          <div class="quick-tools">
            ${quickTool('❓','互動問答箱','匿名提問、投票及即時回饋。')}
            ${quickTool('⏱️','小組計時器','倒數、分組競賽及活動節奏控制。')}
            ${quickTool('🎯','任務挑戰卡','建立任務、完成條件及小組挑戰。')}
            ${quickTool('📊','結果統計','整理答題結果及活動成效。')}
          </div>
        </section>
      </div>`;
  }

  function quickTool(icon, title, text) {
    return `<article class="quick-card"><div class="quick-icon">${icon}</div><h3>${title}</h3><p>${text}</p><div class="tags" style="margin-top:14px"><span class="tag gold">即將推出</span></div></article>`;
  }

  function renderWheel() {
    const eligible = getEligibleParticipants();
    return `
      <div class="panel-page">
        <div class="page-head"><div><h1>🎡 抽獎輪盤</h1><p>按出席、完成任務及積分條件篩選參加者，再進行動畫抽選。</p></div><div class="page-head-actions"><button class="btn btn-ghost" id="resetDraws">重設已抽名單</button><button class="btn btn-primary" id="spinFromHead">開始抽獎</button></div></div>
        <div class="wheel-workspace">
          <section class="wheel-arena">
            <div class="bunting"></div>
            <div class="wheel-host" id="wheelHost"><div class="wheel-pointer"></div><div class="wheel-disc" id="wheelDisc"></div><button class="wheel-center" id="spinWheel">開始</button></div>
            <div class="result-board">目前合資格：<strong>${eligible.length}</strong> 人　｜　已抽出：<strong>${state.drawnIds.length}</strong> 人</div>
          </section>
          <aside class="stack">
            <section class="panel" id="wheelSettingsPanel"><div class="panel-header"><h2>抽選條件</h2></div><div class="panel-body form-grid">
              ${checkboxField('requireAttendance','只包括出席者',state.wheelSettings.requireAttendance)}
              ${checkboxField('requireTask','只包括已完成任務者',state.wheelSettings.requireTask)}
              ${checkboxField('minPointsEnabled','啟用最低積分',state.wheelSettings.minPointsEnabled)}
              <div class="field"><label for="minPoints">最低積分</label><input class="input" id="minPoints" type="number" min="0" value="${state.wheelSettings.minPoints}"></div>
              ${checkboxField('allowRepeat','容許重複抽中',state.wheelSettings.allowRepeat)}
              <div class="divider"></div>
              <div><strong>合資格名單</strong><div class="eligible-list" id="eligibleList" style="margin-top:10px">${renderEligibleChips(eligible)}</div></div>
            </div></section>
            <section class="panel participant-panel"><div class="panel-header"><div><h2>參加者名單</h2><p class="help-text">每頁 ${PARTICIPANTS_PER_PAGE} 人，避免頁面出現捲動列。</p></div><div class="panel-tools"><div class="pager compact"><button class="icon-mini" id="participantPrev" title="上一頁">‹</button><span>${participantPage + 1} / ${Math.max(1, Math.ceil(state.participants.length / PARTICIPANTS_PER_PAGE))}</span><button class="icon-mini" id="participantNext" title="下一頁">›</button></div><button class="btn btn-small btn-blue" id="addParticipant">＋ 新增</button></div></div><div class="panel-body"><div class="table-wrap participant-table"><table><thead><tr><th>姓名</th><th>出席</th><th>完成任務</th><th>積分</th><th></th></tr></thead><tbody>${renderParticipantRows()}</tbody></table></div></div></section>
          </aside>
        </div>
      </div>`;
  }

  function checkboxField(id, label, checked) {
    return `<label class="check-row"><input id="${id}" type="checkbox" ${checked ? 'checked' : ''}><span>${label}</span></label>`;
  }

  function renderParticipantRows() {
    const pageCount = Math.max(1, Math.ceil(state.participants.length / PARTICIPANTS_PER_PAGE));
    participantPage = clamp(participantPage, 0, pageCount - 1);
    const start = participantPage * PARTICIPANTS_PER_PAGE;
    const rows = state.participants.slice(start, start + PARTICIPANTS_PER_PAGE);
    return rows.map((p) => `<tr data-participant-row="${p.id}"><td><input class="input participant-name" value="${escapeHtml(p.name)}" aria-label="姓名"></td><td><input class="participant-attended" type="checkbox" ${p.attended ? 'checked' : ''} aria-label="出席"></td><td><input class="participant-task" type="checkbox" ${p.taskDone ? 'checked' : ''} aria-label="完成任務"></td><td><input class="input participant-points" type="number" min="0" value="${p.points}" aria-label="積分"></td><td><button class="icon-mini delete-participant" title="刪除">✕</button></td></tr>`).join('') || '<tr><td colspan="5"><div class="empty-state">尚未有參加者。</div></td></tr>';
  }

  function renderEligibleChips(list) {
    return list.length ? list.map((p) => `<span class="person-chip">🎟️ ${escapeHtml(p.name)}</span>`).join('') : '<span class="help-text">暫時沒有合資格參加者。</span>';
  }

  function getEligibleParticipants() {
    return state.participants.filter((p) => {
      if (state.wheelSettings.requireAttendance && !p.attended) return false;
      if (state.wheelSettings.requireTask && !p.taskDone) return false;
      if (state.wheelSettings.minPointsEnabled && Number(p.points) < Number(state.wheelSettings.minPoints)) return false;
      if (!state.wheelSettings.allowRepeat && state.drawnIds.includes(p.id)) return false;
      return Boolean(p.name.trim());
    });
  }

  function renderQuiz() {
    return `
      <div class="panel-page">
        <div class="page-head"><div><h1>🎮 多項選擇遊戲</h1><p>使用已建立的題庫進行計時問答、即時計分及結果回顧。</p></div><div class="page-head-actions"><button class="btn btn-ghost" data-route="bank">管理題庫</button><button class="btn btn-primary" id="startQuizHead">開始遊戲</button></div></div>
        <div id="quizArea">${renderQuizSetup()}</div>
      </div>`;
  }

  function renderQuizSetup() {
    return `<div class="two-col">
      <section class="panel"><div class="panel-header"><h2>遊戲設定</h2></div><div class="panel-body form-grid">
        <div class="stat-grid"><div class="stat"><small>題目數量</small><strong>${state.questions.length}</strong></div><div class="stat"><small>每題時間</small><strong>${state.quizSettings.secondsPerQuestion}s</strong></div><div class="stat"><small>滿分</small><strong>${state.questions.reduce((sum,q)=>sum+Number(q.score||100),0)}</strong></div></div>
        <div class="form-grid two"><div class="field"><label for="secondsPerQuestion">每題作答時間（秒）</label><input class="input" id="secondsPerQuestion" type="number" min="5" max="300" value="${state.quizSettings.secondsPerQuestion}"></div><div class="field"><label for="questionCount">本次題目數量</label><select class="select" id="questionCount">${[5,10,15,20,state.questions.length].filter((v,i,a)=>v<=state.questions.length&&a.indexOf(v)===i).map(v=>`<option value="${v}" ${v===Math.min(10,state.questions.length)?'selected':''}>${v} 題</option>`).join('')}</select></div></div>
        ${checkboxField('shuffleQuestions','隨機排列題目',state.quizSettings.shuffleQuestions)}
        ${checkboxField('shuffleOptions','隨機排列選項',state.quizSettings.shuffleOptions)}
        ${checkboxField('showExplanation','答題後顯示解說',state.quizSettings.showExplanation)}
        <button class="btn btn-blue btn-wide" id="startQuiz">▶ 開始多項選擇遊戲</button>
      </div></section>
      <aside class="panel"><div class="panel-header"><h2>題庫預覽</h2><span class="tag">${state.questions.length} 題</span></div><div class="panel-body stack">${state.questions.slice(0,4).map((q,i)=>`<div><strong>${i+1}. ${escapeHtml(q.question)}</strong><div class="help-text" style="margin-top:6px">正確答案：${String.fromCharCode(65+q.answer)}　｜　${q.score||100} 分</div></div><div class="divider"></div>`).join('') || '<div class="empty-state">尚未建立題目。</div>'}<button class="btn btn-ghost btn-wide" data-route="bank">＋ 匯入或新增題目</button></div></aside>
    </div>`;
  }

  function startQuiz() {
    if (!state.questions.length) {
      toast('請先建立至少一條題目。');
      setRoute('bank');
      return;
    }
    const countSelect = document.getElementById('questionCount');
    const secondsInput = document.getElementById('secondsPerQuestion');
    state.quizSettings.secondsPerQuestion = clamp(Number(secondsInput?.value || 20), 5, 300);
    state.quizSettings.shuffleQuestions = Boolean(document.getElementById('shuffleQuestions')?.checked);
    state.quizSettings.shuffleOptions = Boolean(document.getElementById('shuffleOptions')?.checked);
    state.quizSettings.showExplanation = Boolean(document.getElementById('showExplanation')?.checked);
    saveState();

    const maxCount = Math.min(Number(countSelect?.value || state.questions.length), state.questions.length);
    let questions = state.questions.map((q) => ({ ...q, options: [...q.options] }));
    if (state.quizSettings.shuffleQuestions) questions = shuffle(questions);
    questions = questions.slice(0, maxCount);
    if (state.quizSettings.shuffleOptions) {
      questions = questions.map((q) => {
        const correctText = q.options[q.answer];
        const options = shuffle([...q.options]);
        return { ...q, options, answer: options.indexOf(correctText) };
      });
    }
    quizSession = { questions, index: 0, score: 0, streak: 0, answered: false, answers: [], secondsLeft: state.quizSettings.secondsPerQuestion };
    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    clearQuizTimer();
    const area = document.getElementById('quizArea');
    if (!quizSession || !area) return;
    const q = quizSession.questions[quizSession.index];
    const progress = ((quizSession.index) / quizSession.questions.length) * 100;
    area.innerHTML = `<section class="quiz-play-shell">
      <div class="quiz-status"><div class="score-box"><small>目前分數</small><strong>⭐ ${quizSession.score}</strong></div><div class="timer-circle" id="quizTimer">${quizSession.secondsLeft}</div><div class="score-box"><small>連續答對</small><strong>🔥 ${quizSession.streak}</strong></div></div>
      <div class="progress-track"><span style="width:${progress}%"></span></div>
      <div class="question-card"><div class="tags" style="justify-content:center;margin-bottom:14px"><span class="tag">第 ${quizSession.index+1} 題 / 共 ${quizSession.questions.length} 題</span><span class="tag gold">${q.score||100} 分</span></div><h2>${escapeHtml(q.question)}</h2><div class="quiz-options">${q.options.map((option,i)=>`<button class="quiz-option" data-option="${i}"><span class="letter">${String.fromCharCode(65+i)}</span><span>${escapeHtml(option)}</span></button>`).join('')}</div><div id="quizFeedback"></div><div class="quiz-footer"><span class="help-text">請在時間完結前選擇答案。</span><button class="btn btn-blue" id="nextQuestion" hidden>${quizSession.index===quizSession.questions.length-1?'查看結果':'下一題'}</button></div></div>
    </section>`;
    area.querySelectorAll('[data-option]').forEach((button) => button.addEventListener('click', () => answerQuiz(Number(button.dataset.option), false)));
    document.getElementById('nextQuestion').addEventListener('click', nextQuizQuestion);
    quizTimer = window.setInterval(() => {
      if (!quizSession || quizSession.answered) return;
      quizSession.secondsLeft -= 1;
      const timerEl = document.getElementById('quizTimer');
      if (timerEl) timerEl.textContent = quizSession.secondsLeft;
      if (quizSession.secondsLeft <= 0) answerQuiz(-1, true);
    }, 1000);
  }

  function answerQuiz(selected, timedOut) {
    if (!quizSession || quizSession.answered) return;
    quizSession.answered = true;
    clearQuizTimer();
    const q = quizSession.questions[quizSession.index];
    const correct = selected === q.answer;
    if (correct) { quizSession.score += Number(q.score || 100); quizSession.streak += 1; playTone(660, .08); }
    else { quizSession.streak = 0; playTone(220, .12); }
    quizSession.answers.push({ questionId: q.id, selected, correct, timedOut });
    document.querySelectorAll('.quiz-option').forEach((button) => {
      const index = Number(button.dataset.option);
      button.disabled = true;
      if (index === q.answer) button.classList.add('correct');
      else if (index === selected) button.classList.add('wrong');
    });
    const feedback = document.getElementById('quizFeedback');
    feedback.innerHTML = `<div class="quiz-explanation"><strong>${timedOut ? '⏰ 時間到！' : correct ? '✅ 答對了！' : '❌ 答錯了。'}</strong>${state.quizSettings.showExplanation && q.explanation ? `<div style="margin-top:7px">${escapeHtml(q.explanation)}</div>` : ''}</div>`;
    document.getElementById('nextQuestion').hidden = false;
  }

  function nextQuizQuestion() {
    if (!quizSession) return;
    if (quizSession.index >= quizSession.questions.length - 1) { renderQuizResults(); return; }
    quizSession.index += 1;
    quizSession.answered = false;
    quizSession.secondsLeft = state.quizSettings.secondsPerQuestion;
    renderQuizQuestion();
  }

  function renderQuizResults() {
    clearQuizTimer();
    const area = document.getElementById('quizArea');
    const correctCount = quizSession.answers.filter((a) => a.correct).length;
    const percent = Math.round((correctCount / quizSession.questions.length) * 100);
    area.innerHTML = `<section class="panel"><div class="panel-body" style="text-align:center;padding:48px 24px"><div style="font-size:72px">${percent>=80?'🏆':percent>=50?'🎉':'💪'}</div><h2 style="font-size:38px;margin:10px 0">遊戲完成！</h2><p style="color:var(--muted)">你答對了 ${correctCount} / ${quizSession.questions.length} 題</p><div class="stat-grid" style="max-width:650px;margin:28px auto"><div class="stat"><small>總分</small><strong>${quizSession.score}</strong></div><div class="stat"><small>正確率</small><strong>${percent}%</strong></div><div class="stat"><small>題目數</small><strong>${quizSession.questions.length}</strong></div></div><div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap"><button class="btn btn-blue" id="playAgain">再玩一次</button><button class="btn btn-ghost" data-route="bank">管理題庫</button></div></div></section>`;
    document.getElementById('playAgain').addEventListener('click', () => { document.getElementById('quizArea').innerHTML = renderQuizSetup(); bindQuizSetupControls(); });
    bindRouteActions();
    launchConfetti();
  }


  function renderTV() {
    const selectedCategoryName = getBigTvCategoryName(state.bigTvSettings.selectedCategoryId);
    return `
      <div class="panel-page tv-page">
        <section class="tv-marquee-hero">
          <div class="bunting"></div>
          <div class="tv-marquee-inner">
            <div class="tv-mascot host">🐶</div>
            <div class="tv-hero-copy">
              <div class="tv-title-board">
                <div class="tv-title-main">大電視</div>
                <div class="tv-title-sub">多人動作猜估互動工具</div>
                <div class="tv-title-flow">看題目 → 做動作 → 隊友猜答案</div>
              </div>
            </div>
            <div class="tv-mascot clown">🤡</div>
          </div>
        </section>

        <div class="tv-top-grid">
          <section class="panel tv-preview-panel">
            <div class="panel-header"><div><h2>遊戲預覽</h2><p class="help-text">展示大螢幕頁面、題目類別及各隊分數版面。</p></div><span class="tag coral">${state.bigTvSettings.teamCount} 組分割畫面</span></div>
            <div class="panel-body">
              <div class="tv-stage-preview">
                <div class="tv-category-tabs">
                  ${state.bigTvCategories.slice(0,5).map((cat, index) => `<button class="tv-tab ${cat.id === state.bigTvSettings.selectedCategoryId ? 'is-active' : ''}" data-tv-quick-category="${cat.id}">${escapeHtml(cat.name)}</button>`).join('')}
                </div>
                <div class="tv-stage-board">
                  <div class="tv-stage-question-label">${escapeHtml(selectedCategoryName)}</div>
                  <div class="tv-stage-question">題目：${escapeHtml(state.bigTvQuestions.find((q) => q.categoryId === state.bigTvSettings.selectedCategoryId)?.prompt || state.bigTvQuestions[0]?.prompt || '請先加入題目')}</div>
                  <div class="tv-stage-timer">⏳ ${state.bigTvSettings.secondsPerRound} 秒</div>
                </div>
                <div class="tv-stage-scoreboard">${renderBigTvTeamCards(state.bigTvSettings.teamCount, false)}</div>
              </div>
            </div>
          </section>

          <aside class="panel tv-settings-panel">
            <div class="panel-header"><div><h2>快速設定</h2><p class="help-text">調整隊伍數量、計分與作答時間。</p></div></div>
            <div class="panel-body stack">
              ${renderChoiceRow('隊伍數量', 'tv-team-count', [['2 組',2],['3 組',3],['4 組',4]], state.bigTvSettings.teamCount)}
              <div class="field"><label for="tvCategorySelect">題目類別</label><div class="inline-field"><select class="select" id="tvCategorySelect">${state.bigTvCategories.map((cat) => `<option value="${cat.id}" ${cat.id === state.bigTvSettings.selectedCategoryId ? 'selected' : ''}>${escapeHtml(cat.name)}</option>`).join('')}</select><button class="btn btn-ghost btn-small" id="scrollToCategoryManager">管理類別</button></div></div>
              ${renderChoiceRow('計分模式', 'tv-scoring-mode', [['競速積分','speed'],['累積積分','accumulate']], state.bigTvSettings.scoringMode)}
              ${renderChoiceRow('每題時間', 'tv-seconds', [['15 秒',15],['20 秒',20],['30 秒',30],['45 秒',45]], state.bigTvSettings.secondsPerRound)}
              <div class="form-grid two"><div class="field"><label for="tvPointsPerCorrect">每題分數</label><input class="input" id="tvPointsPerCorrect" type="number" min="10" step="10" value="${state.bigTvSettings.pointsPerCorrect}"></div><div class="field"><label for="tvRounds">回合數</label><input class="input" id="tvRounds" type="number" min="1" max="50" value="${state.bigTvSettings.rounds}"></div></div>
              <label class="switch-row"><span><strong>分割畫面模式</strong><small>同時顯示各隊得分與狀態</small></span><input type="checkbox" id="tvSplitScreen" ${state.bigTvSettings.splitScreen ? 'checked' : ''}></label>
              <div class="card-actions"><button class="btn btn-blue" id="previewTvPlay">預覽大螢幕</button><button class="btn btn-primary" id="startTvGame">開始遊戲</button></div>
            </div>
          </aside>
        </div>

        <div class="tv-management-grid">
          <section class="panel tv-import-manager">
            <div class="panel-header"><div><h2>題目匯入與管理</h2><p class="help-text">支援 Excel／CSV、批量輸入及手動新增。</p></div><button class="btn btn-ghost btn-small" id="downloadTvTemplate">下載範本</button></div>
            <div class="panel-body stack">
              <div class="import-tabs" role="tablist"><button class="import-tab is-active" data-tv-tab="bulk">批量輸入</button><button class="import-tab" data-tv-tab="excel">Excel / CSV</button><button class="import-tab" data-tv-tab="manual">手動新增</button></div>
              <div class="import-pane is-active" data-tv-pane="bulk">
                <div class="field"><label for="tvBulkText">每行一題</label><textarea class="textarea" id="tvBulkText" style="min-height:210px" placeholder="刷牙&#10;打籃球&#10;游泳&#10;獅子&#10;開車"></textarea></div>
                <div class="form-grid two"><div class="field"><label for="tvBulkCategory">題目類別</label><select class="select" id="tvBulkCategory">${state.bigTvCategories.map((cat) => `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`).join('')}</select></div><div class="field"><label for="tvBulkDifficulty">難度</label><select class="select" id="tvBulkDifficulty"><option>簡單</option><option selected>中等</option><option>困難</option></select></div></div>
                <button class="btn btn-blue" id="importTvBulk">匯入題目</button>
              </div>
              <div class="import-pane" data-tv-pane="excel">
                <div class="dropzone" id="tvDropzone"><div style="font-size:42px">🎬</div><h3>拖放大電視題庫檔案到這裡</h3><p class="help-text">欄位可用：題目、類別、難度。</p><label class="btn btn-blue" for="tvExcelFile">選擇檔案</label><input id="tvExcelFile" type="file" accept=".xlsx,.xls,.csv" hidden></div>
                <label class="check-row"><input id="replaceTvOnImport" type="checkbox"><span>匯入時取代現有大電視題庫</span></label>
              </div>
              <div class="import-pane" data-tv-pane="manual">
                <div class="field"><label for="tvManualPrompt">題目內容</label><input class="input" id="tvManualPrompt" placeholder="例如：打羽毛球"></div>
                <div class="form-grid two"><div class="field"><label for="tvManualCategory">題目類別</label><select class="select" id="tvManualCategory">${state.bigTvCategories.map((cat) => `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`).join('')}</select></div><div class="field"><label for="tvManualDifficulty">難度</label><select class="select" id="tvManualDifficulty"><option>簡單</option><option selected>中等</option><option>困難</option></select></div></div>
                <button class="btn btn-blue" id="addTvManualQuestion">＋ 加入題庫</button>
              </div>
              <div class="import-report" id="tvImportReport"></div>
            </div>
          </section>

          <section class="panel tv-category-manager" id="tvCategoryManager">
            <div class="panel-header"><div><h2>題目類別管理</h2><p class="help-text">管理大電視題目分類。</p></div></div>
            <div class="panel-body stack">
              <div class="tv-category-list">${renderBigTvCategoryRows()}</div>
              <div class="form-grid two"><div class="field"><label for="newTvCategoryName">新增類別名稱</label><input class="input" id="newTvCategoryName" placeholder="例如：節日類"></div><div class="field"><label for="newTvCategoryIcon">圖示</label><input class="input" id="newTvCategoryIcon" placeholder="例如：🎉"></div></div>
              <button class="btn btn-ghost" id="addTvCategory">＋ 新增類別</button>
            </div>
          </section>

          <section class="panel tv-question-bank-preview">
            <div class="panel-header"><div><h2>題庫與分數預覽</h2><p class="help-text">目前共 ${state.bigTvQuestions.length} 題。</p></div><span class="tag green">${state.bigTvSettings.pointsPerCorrect} 分 / 題</span></div>
            <div class="panel-body stack">
              <div class="tv-mini-score-preview">${renderBigTvTeamStrip()}</div>
              <div class="tv-question-list">${renderBigTvQuestionPreviewRows()}</div>
            </div>
          </section>
        </div>
      </div>`;
  }

  function renderTVPlay() {
    const game = state.bigTvGame;
    const queue = getBigTvQueueFromState();
    const question = queue[game.roundIndex] || null;
    const teamCount = state.bigTvSettings.teamCount;
    const activeTeam = state.bigTvTeams[game.currentTeamIndex] || state.bigTvTeams[0];
    const leader = getBigTvLeader();
    const totalRounds = Math.max(1, Math.min(state.bigTvSettings.rounds, queue.length || 1));
    return `
      <div class="tv-play-page">
        <div class="tv-play-header">
          <div class="tv-play-brand">大電視<span>即時競答・動作猜估</span></div>
          <div class="tv-play-topline"><span>第 ${Math.min(game.roundIndex + 1, totalRounds)} 回合 / 共 ${totalRounds} 回合</span><span class="big-timer">${String(game.secondsLeft).padStart(2, '0')}</span><span>類別：${escapeHtml(question ? getBigTvCategoryName(question.categoryId) : getBigTvCategoryName(state.bigTvSettings.selectedCategoryId))}</span></div>
        </div>
        <div class="tv-play-layout ${state.bigTvSettings.splitScreen ? 'is-split' : ''}">
          <section class="tv-main-screen">
            <div class="tv-live-banner">目前出題：${escapeHtml(activeTeam?.name || '第一組')}</div>
            <div class="tv-question-screen">
              <div class="tv-question-screen-inner">
                <div class="tv-question-tag">題目</div>
                <div class="tv-question-prompt">${escapeHtml(question?.prompt || '請先到設定頁開始遊戲')}</div>
                <div class="tv-question-rule">${game.showAnswer ? '答案已公開，可切換到下一題。' : '只能做動作，不可說話'}</div>
              </div>
            </div>
          </section>
          <aside class="tv-host-panel">
            <h3>主持人控制區</h3>
            <button class="btn btn-green btn-wide" id="tvPlayStart">${game.paused || !game.active ? '開始 / 繼續' : '遊戲進行中'}</button>
            <button class="btn btn-blue btn-wide" id="tvAwardPoint">答中 +${state.bigTvSettings.pointsPerCorrect}</button>
            <button class="btn btn-coral btn-wide" id="tvNextPrompt">下一題</button>
            <button class="btn btn-ghost btn-wide" id="tvSkipPrompt">跳過</button>
            <button class="btn btn-dark btn-wide" id="tvRevealAnswer">${game.showAnswer ? '隱藏答案提示' : '顯示答案提示'}</button>
            <button class="btn btn-ghost btn-wide" id="tvPauseGame">${game.paused ? '已暫停' : '暫停'}</button>
            <button class="btn btn-ghost btn-wide" id="tvBackToSetup">返回設定頁</button>
            <label class="switch-row"><span><strong>分割畫面模式</strong><small>同步顯示隊伍分數</small></span><input type="checkbox" id="tvSplitPlay" ${state.bigTvSettings.splitScreen ? 'checked' : ''}></label>
          </aside>
        </div>
        <section class="tv-live-scores ${state.bigTvSettings.splitScreen ? '' : 'is-hidden'}">${renderBigTvTeamCards(teamCount, true)}</section>
        <div class="tv-play-footer"><span>🏆 目前領先：${escapeHtml(leader.name)} ${leader.score} 分</span><span>總回合數：${totalRounds} 回合</span><span>遊戲模式：動作猜估</span></div>
      </div>`;
  }

  function renderBigTvCategoryRows() {
    return state.bigTvCategories.map((cat) => {
      const count = state.bigTvQuestions.filter((q) => q.categoryId === cat.id).length;
      return `<div class="tv-category-row" data-tv-category-row="${cat.id}"><div class="tv-category-info"><span class="tv-category-icon">${escapeHtml(cat.icon || '🏷️')}</span><div><strong>${escapeHtml(cat.name)}</strong><small>${count} 題</small></div></div><div class="row-actions"><button class="icon-mini edit-tv-category" title="編輯">✎</button><button class="icon-mini delete-tv-category" title="刪除">✕</button></div></div>`;
    }).join('');
  }

  function renderBigTvQuestionPreviewRows() {
    return state.bigTvQuestions.slice(0, 8).map((q, index) => `<div class="tv-question-row"><div><strong>${index + 1}. ${escapeHtml(q.prompt)}</strong><div class="help-text">${escapeHtml(getBigTvCategoryName(q.categoryId))}｜${escapeHtml(q.difficulty || '中等')}</div></div></div>`).join('') || '<div class="empty-state">尚未加入任何大電視題目。</div>';
  }

  function renderBigTvTeamStrip() {
    return state.bigTvTeams.slice(0, state.bigTvSettings.teamCount).map((team) => `<div class="tv-team-pill ${team.color}"><span>${escapeHtml(team.name)}</span><strong>${team.score}</strong></div>`).join('');
  }

  function renderBigTvTeamCards(count, showStatus) {
    return state.bigTvTeams.slice(0, count).map((team, index) => {
      const isActive = index === state.bigTvGame.currentTeamIndex;
      const status = isActive ? (state.bigTvGame.active && !state.bigTvGame.paused ? '作答中' : '準備中') : '等待中';
      return `<article class="tv-team-card ${team.color} ${isActive ? 'is-active' : ''}" data-tv-team-card="${index}"><div class="tv-team-card-head"><span class="tv-team-avatar">${team.mascot}</span><strong>${escapeHtml(team.name)}</strong></div><div class="tv-team-score">${team.score}<small>分</small></div>${showStatus ? `<div class="tv-team-status">${status}</div><div class="tv-team-meta">已答中：${team.solved || 0} 題</div>` : ''}</article>`;
    }).join('');
  }

  function renderChoiceRow(label, name, items, selectedValue) {
    return `<div class="field"><label>${label}</label><div class="choice-row">${items.map(([text, value]) => `<button class="choice-chip ${String(selectedValue) === String(value) ? 'is-active' : ''}" data-choice-group="${name}" data-choice-value="${value}">${text}</button>`).join('')}</div></div>`;
  }

  function getBigTvCategoryName(categoryId) {
    return state.bigTvCategories.find((cat) => cat.id === categoryId)?.name || '未分類';
  }

  function getBigTvQueueFromState() {
    const selected = state.bigTvSettings.selectedCategoryId;
    let list = state.bigTvQuestions.filter((q) => !selected || q.categoryId === selected);
    if (!list.length) list = [...state.bigTvQuestions];
    if (!list.length) return [];
    return list.slice(0, Math.max(1, Math.min(state.bigTvSettings.rounds, list.length)));
  }

  function getBigTvLeader() {
    return state.bigTvTeams.slice(0, state.bigTvSettings.teamCount).reduce((best, team) => team.score > best.score ? team : best, state.bigTvTeams[0]);
  }

  function renderBank() {
    return `
      <div class="panel-page">
        <div class="page-head"><div><h1>📚 題庫管理</h1><p>支援逐題新增、批量文字輸入、Excel／CSV 匯入及題庫匯出。</p></div><div class="page-head-actions"><a class="btn btn-ghost" id="downloadTemplate" href="./question-bank-template.xlsx" download="題庫匯入範本.xlsx">下載 Excel 範本</a><button class="btn btn-primary" id="exportQuestions">匯出目前題庫</button></div></div>
        <div class="stack bank-layout">
          <section class="panel import-panel"><div class="panel-header"><div><h2>新增及匯入題目</h2><p class="help-text">Excel 欄位：題目、選項A、選項B、選項C、選項D、正確答案、分數、解說</p></div></div><div class="panel-body stack">
            <div class="import-tabs" role="tablist"><button class="import-tab is-active" data-import-tab="manual">逐題新增</button><button class="import-tab" data-import-tab="bulk">批量輸入</button><button class="import-tab" data-import-tab="excel">Excel / CSV</button></div>
            <div class="import-pane is-active" data-import-pane="manual">${manualQuestionForm()}</div>
            <div class="import-pane" data-import-pane="bulk">${bulkImportForm()}</div>
            <div class="import-pane" data-import-pane="excel">${excelImportForm()}</div>
            <div class="import-report" id="importReport"></div>
          </div></section>
          <section class="panel question-panel"><div class="panel-header"><div><h2>目前題庫</h2><p class="help-text">共 ${state.questions.length} 題，每頁 ${QUESTIONS_PER_PAGE} 題。</p></div><div class="panel-tools"><div class="pager"><button class="icon-mini" id="questionPrev" title="上一頁">‹</button><span>${bankPage + 1} / ${Math.max(1, Math.ceil(state.questions.length / QUESTIONS_PER_PAGE))}</span><button class="icon-mini" id="questionNext" title="下一頁">›</button></div><button class="btn btn-small btn-ghost" id="clearQuestions">清空題庫</button></div></div><div class="panel-body"><div class="table-wrap question-table"><table><thead><tr><th>#</th><th>題目</th><th>正確答案</th><th>分數</th><th>解說</th><th></th></tr></thead><tbody>${renderQuestionRows()}</tbody></table></div></div></section>
        </div>
      </div>`;
  }

  function manualQuestionForm() {
    return `<div class="form-grid"><div class="field"><label for="manualQuestion">題目</label><input class="input" id="manualQuestion" placeholder="輸入題目內容"></div><div class="form-grid two"><div class="field"><label for="manualA">選項 A</label><input class="input" id="manualA"></div><div class="field"><label for="manualB">選項 B</label><input class="input" id="manualB"></div><div class="field"><label for="manualC">選項 C</label><input class="input" id="manualC"></div><div class="field"><label for="manualD">選項 D</label><input class="input" id="manualD"></div></div><div class="form-grid two"><div class="field"><label for="manualAnswer">正確答案</label><select class="select" id="manualAnswer"><option value="0">A</option><option value="1">B</option><option value="2">C</option><option value="3">D</option></select></div><div class="field"><label for="manualScore">分數</label><input class="input" id="manualScore" type="number" min="1" value="100"></div></div><div class="field"><label for="manualExplanation">解說（選填）</label><textarea class="textarea" id="manualExplanation"></textarea></div><button class="btn btn-blue" id="addManualQuestion">＋ 加入題庫</button></div>`;
  }

  function bulkImportForm() {
    return `<div class="field"><label for="bulkText">每行一題，以直線「|」或 Tab 分隔</label><textarea class="textarea" id="bulkText" style="min-height:240px" placeholder="題目 | 選項A | 選項B | 選項C | 選項D | 正確答案 | 分數 | 解說\n香港最高的山峰？ | 太平山 | 大帽山 | 獅子山 | 鳳凰山 | B | 100 | 大帽山是香港最高峰"></textarea><div class="help-text">正確答案可填 A、B、C、D、1、2、3、4，或完整選項文字。第一行如為欄位名稱會自動略過。</div></div><button class="btn btn-blue" id="importBulk">匯入批量題目</button>`;
  }

  function excelImportForm() {
    return `<div class="dropzone" id="dropzone"><div style="font-size:44px">📥</div><h3>拖放 Excel／CSV 到這裡</h3><p class="help-text">支援 .xlsx、.xls、.csv；亦可按下方按鈕選擇檔案。</p><label class="btn btn-blue" for="excelFile">選擇檔案</label><input id="excelFile" type="file" accept=".xlsx,.xls,.csv" hidden></div><label class="check-row"><input id="replaceOnImport" type="checkbox"><span>匯入時取代現有題庫</span></label><div class="help-text">Excel 讀取使用 SheetJS 瀏覽器版本。若網絡阻擋外部程式庫，CSV 及批量輸入仍可使用。</div>`;
  }

  function renderQuestionRows() {
    const pageCount = Math.max(1, Math.ceil(state.questions.length / QUESTIONS_PER_PAGE));
    bankPage = clamp(bankPage, 0, pageCount - 1);
    const start = bankPage * QUESTIONS_PER_PAGE;
    const rows = state.questions.slice(start, start + QUESTIONS_PER_PAGE);
    return rows.map((q,index)=>`<tr data-question-row="${q.id}"><td>${start+index+1}</td><td><strong>${escapeHtml(q.question)}</strong><div class="help-text question-options" style="margin-top:5px">${q.options.map((o,i)=>`${String.fromCharCode(65+i)}. ${escapeHtml(o)}`).join('　')}</div></td><td>${String.fromCharCode(65+q.answer)}. ${escapeHtml(q.options[q.answer])}</td><td>${q.score||100}</td><td class="question-explanation">${escapeHtml(q.explanation||'—')}</td><td><div class="row-actions"><button class="icon-mini edit-question" title="編輯">✎</button><button class="icon-mini delete-question" title="刪除">✕</button></div></td></tr>`).join('') || '<tr><td colspan="6"><div class="empty-state">尚未有題目。請從上方新增或匯入。</div></td></tr>';
  }

  function bindRouteActions() {
    document.querySelectorAll('[data-route]').forEach((button) => {
      button.addEventListener('click', () => setRoute(button.dataset.route));
    });
  }

  function bindHome() {}

  function bindWheel() {
    renderWheelDisc();
    ['requireAttendance','requireTask','minPointsEnabled','allowRepeat'].forEach((id) => {
      document.getElementById(id)?.addEventListener('change', (event) => {
        state.wheelSettings[id] = event.target.checked;
        saveState();
        refreshWheelSidePanel();
        renderWheelDisc();
      });
    });
    document.getElementById('minPoints')?.addEventListener('input', (event) => {
      state.wheelSettings.minPoints = Number(event.target.value || 0);
      saveState(); refreshWheelSidePanel(); renderWheelDisc();
    });
    document.getElementById('spinWheel')?.addEventListener('click', spinWheel);
    document.getElementById('spinFromHead')?.addEventListener('click', spinWheel);
    document.getElementById('resetDraws')?.addEventListener('click', () => { state.drawnIds=[]; saveState(); toast('已重設已抽名單。'); render(); });
    document.getElementById('participantPrev')?.addEventListener('click', () => { participantPage = Math.max(0, participantPage - 1); render(); });
    document.getElementById('participantNext')?.addEventListener('click', () => { const last = Math.max(0, Math.ceil(state.participants.length / PARTICIPANTS_PER_PAGE) - 1); participantPage = Math.min(last, participantPage + 1); render(); });
    document.getElementById('addParticipant')?.addEventListener('click', () => { state.participants.push({ id: crypto.randomUUID(), name: '新參加者', attended: true, taskDone: false, points: 0 }); participantPage = Math.max(0, Math.ceil(state.participants.length / PARTICIPANTS_PER_PAGE) - 1); saveState(); render(); });
    document.querySelectorAll('[data-participant-row]').forEach((row) => bindParticipantRow(row));
  }

  function bindParticipantRow(row) {
    const participant = state.participants.find((p) => p.id === row.dataset.participantRow);
    if (!participant) return;
    row.querySelector('.participant-name').addEventListener('input', (e) => { participant.name=e.target.value; saveState(); refreshWheelSidePanel(); renderWheelDisc(); });
    row.querySelector('.participant-attended').addEventListener('change', (e) => { participant.attended=e.target.checked; saveState(); refreshWheelSidePanel(); renderWheelDisc(); });
    row.querySelector('.participant-task').addEventListener('change', (e) => { participant.taskDone=e.target.checked; saveState(); refreshWheelSidePanel(); renderWheelDisc(); });
    row.querySelector('.participant-points').addEventListener('input', (e) => { participant.points=Number(e.target.value||0); saveState(); refreshWheelSidePanel(); renderWheelDisc(); });
    row.querySelector('.delete-participant').addEventListener('click', () => { state.participants=state.participants.filter((p)=>p.id!==participant.id); state.drawnIds=state.drawnIds.filter((id)=>id!==participant.id); participantPage = Math.min(participantPage, Math.max(0, Math.ceil(state.participants.length / PARTICIPANTS_PER_PAGE) - 1)); saveState(); render(); });
  }

  function refreshWheelSidePanel() {
    const eligible = getEligibleParticipants();
    const list = document.getElementById('eligibleList');
    if (list) list.innerHTML = renderEligibleChips(eligible);
    const board = document.querySelector('.result-board');
    if (board) board.innerHTML = `目前合資格：<strong>${eligible.length}</strong> 人　｜　已抽出：<strong>${state.drawnIds.length}</strong> 人`;
  }

  function renderWheelDisc() {
    const disc = document.getElementById('wheelDisc');
    if (!disc) return;
    const eligible = getEligibleParticipants();
    if (!eligible.length) {
      disc.style.background = '#29305c';
      disc.innerHTML = '<div style="position:absolute;inset:0;display:grid;place-items:center;color:#fff;font-weight:900;padding:40px;text-align:center">沒有合資格參加者</div>';
      return;
    }
    const colors = ['#ffd25a','#ff7d8f','#8f6df6','#4fc4d5','#63cd8d','#5d93ff','#f59345','#ed6eb1','#9ddf67','#ffb25a'];
    const step = 360 / eligible.length;
    const gradient = eligible.map((_,i)=>`${colors[i%colors.length]} ${i*step}deg ${(i+1)*step}deg`).join(',');
    disc.style.background = `conic-gradient(${gradient})`;
    disc.innerHTML = eligible.map((p,i)=>`<span class="wheel-label" style="transform:rotate(${i*step+step/2}deg) translateY(-50%)">${escapeHtml(p.name)}</span>`).join('');
    disc.style.transform = `rotate(${wheelRotation}deg)`;
  }

  function spinWheel() {
    const eligible = getEligibleParticipants();
    if (!eligible.length) { toast('沒有合資格參加者，請調整條件。'); return; }
    const disc = document.getElementById('wheelDisc');
    const button = document.getElementById('spinWheel');
    if (!disc || button.disabled) return;
    button.disabled = true;
    const winnerIndex = Math.floor(Math.random()*eligible.length);
    const step = 360/eligible.length;
    const target = 360 - (winnerIndex*step + step/2);
    const baseTurns = 6 + Math.floor(Math.random()*3);
    wheelRotation += baseTurns*360 + target - (wheelRotation%360);
    disc.style.transform = `rotate(${wheelRotation}deg)`;
    playTone(440,.08);
    window.setTimeout(() => {
      const winner = eligible[winnerIndex];
      if (!state.wheelSettings.allowRepeat) state.drawnIds.push(winner.id);
      saveState();
      button.disabled = false;
      showWinner(winner);
      refreshWheelSidePanel();
    }, 4850);
  }

  function showWinner(winner) {
    modalLayer.innerHTML = `<div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="winnerTitle"><div class="modal"><div style="font-size:62px">🎉</div><h2 id="winnerTitle">恭喜抽中</h2><div class="winner">${escapeHtml(winner.name)}</div><p>積分：${winner.points}　｜　${winner.attended?'已出席':'未出席'}　｜　${winner.taskDone?'已完成任務':'未完成任務'}</p><div class="modal-actions"><button class="btn btn-coral" id="drawAgain">再抽一次</button><button class="btn btn-ghost" id="closeWinner">關閉</button></div></div></div>`;
    document.getElementById('closeWinner').addEventListener('click', closeModal);
    document.getElementById('drawAgain').addEventListener('click', () => { closeModal(); renderWheelDisc(); spinWheel(); });
    launchConfetti(); playTone(880,.16);
  }

  function closeModal() { modalLayer.innerHTML=''; renderWheelDisc(); }

  function bindQuiz() {
    bindQuizSetupControls();
    document.getElementById('startQuizHead')?.addEventListener('click', startQuiz);
  }

  function bindQuizSetupControls() {
    document.getElementById('startQuiz')?.addEventListener('click', startQuiz);
    bindRouteActions();
  }


  function bindTV() {
    document.querySelectorAll('[data-tv-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        document.querySelectorAll('[data-tv-tab]').forEach((tab) => tab.classList.toggle('is-active', tab === button));
        document.querySelectorAll('[data-tv-pane]').forEach((pane) => pane.classList.toggle('is-active', pane.dataset.tvPane === button.dataset.tvTab));
      });
    });

    document.querySelectorAll('[data-choice-group]').forEach((button) => {
      button.addEventListener('click', () => {
        const group = button.dataset.choiceGroup;
        const value = button.dataset.choiceValue;
        if (group === 'tv-team-count') state.bigTvSettings.teamCount = Number(value);
        if (group === 'tv-scoring-mode') state.bigTvSettings.scoringMode = value;
        if (group === 'tv-seconds') state.bigTvSettings.secondsPerRound = Number(value);
        state.bigTvGame.secondsLeft = state.bigTvSettings.secondsPerRound;
        saveState();
        render();
      });
    });

    document.getElementById('tvCategorySelect')?.addEventListener('change', (event) => {
      state.bigTvSettings.selectedCategoryId = event.target.value;
      saveState();
      render();
    });
    document.getElementById('tvPointsPerCorrect')?.addEventListener('input', (event) => {
      state.bigTvSettings.pointsPerCorrect = Math.max(10, Number(event.target.value || 100));
      saveState();
    });
    document.getElementById('tvRounds')?.addEventListener('input', (event) => {
      state.bigTvSettings.rounds = clamp(Number(event.target.value || 5), 1, 50);
      saveState();
    });
    document.getElementById('tvSplitScreen')?.addEventListener('change', (event) => {
      state.bigTvSettings.splitScreen = event.target.checked;
      saveState();
    });

    document.querySelectorAll('[data-tv-quick-category]').forEach((button) => {
      button.addEventListener('click', () => {
        state.bigTvSettings.selectedCategoryId = button.dataset.tvQuickCategory;
        saveState();
        render();
      });
    });

    document.getElementById('scrollToCategoryManager')?.addEventListener('click', () => document.getElementById('tvCategoryManager')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    document.getElementById('previewTvPlay')?.addEventListener('click', () => { prepareBigTvGame(false); setRoute('tvplay'); });
    document.getElementById('startTvGame')?.addEventListener('click', () => { prepareBigTvGame(true); setRoute('tvplay'); });

    document.getElementById('importTvBulk')?.addEventListener('click', importBigTvBulkQuestions);
    document.getElementById('addTvManualQuestion')?.addEventListener('click', addBigTvManualQuestion);
    document.getElementById('addTvCategory')?.addEventListener('click', addBigTvCategory);
    document.getElementById('downloadTvTemplate')?.addEventListener('click', downloadBigTvTemplate);

    document.querySelectorAll('[data-tv-category-row]').forEach((row) => {
      const id = row.dataset.tvCategoryRow;
      row.querySelector('.edit-tv-category')?.addEventListener('click', () => editBigTvCategory(id));
      row.querySelector('.delete-tv-category')?.addEventListener('click', () => deleteBigTvCategory(id));
    });

    const dropzone = document.getElementById('tvDropzone');
    const fileInput = document.getElementById('tvExcelFile');
    if (dropzone) {
      ['dragenter', 'dragover'].forEach((type) => dropzone.addEventListener(type, (event) => { event.preventDefault(); dropzone.classList.add('is-dragging'); }));
      ['dragleave', 'drop'].forEach((type) => dropzone.addEventListener(type, (event) => { event.preventDefault(); dropzone.classList.remove('is-dragging'); }));
      dropzone.addEventListener('drop', (event) => { const file = event.dataTransfer?.files?.[0]; if (file) importBigTvExcel(file); });
    }
    fileInput?.addEventListener('change', (event) => { const file = event.target.files?.[0]; if (file) importBigTvExcel(file); event.target.value = ''; });
  }

  function bindTVPlay() {
    document.getElementById('tvPlayStart')?.addEventListener('click', () => {
      if (!state.bigTvGame.active) prepareBigTvGame(true);
      state.bigTvGame.active = true;
      state.bigTvGame.paused = false;
      saveState();
      startBigTvTimer();
      render();
    });
    document.getElementById('tvAwardPoint')?.addEventListener('click', awardBigTvPoint);
    document.getElementById('tvNextPrompt')?.addEventListener('click', () => advanceBigTvTurn(false));
    document.getElementById('tvSkipPrompt')?.addEventListener('click', () => advanceBigTvTurn(false, true));
    document.getElementById('tvRevealAnswer')?.addEventListener('click', () => { state.bigTvGame.showAnswer = !state.bigTvGame.showAnswer; saveState(); render(); });
    document.getElementById('tvPauseGame')?.addEventListener('click', () => { state.bigTvGame.paused = !state.bigTvGame.paused; saveState(); if (state.bigTvGame.paused) clearQuizTimer(); else startBigTvTimer(); render(); });
    document.getElementById('tvBackToSetup')?.addEventListener('click', () => { clearQuizTimer(); setRoute('tv'); });
    document.getElementById('tvSplitPlay')?.addEventListener('change', (event) => { state.bigTvSettings.splitScreen = event.target.checked; saveState(); render(); });
    if (state.bigTvGame.active && !state.bigTvGame.paused) startBigTvTimer();
  }

  function prepareBigTvGame(activate) {
    const queue = getBigTvQueueFromState();
    state.bigTvGame = {
      active: activate,
      queue: queue.map((item) => item.id),
      currentQuestionId: queue[0]?.id || null,
      currentTeamIndex: 0,
      roundIndex: 0,
      secondsLeft: state.bigTvSettings.secondsPerRound,
      paused: !activate,
      showAnswer: false
    };
    saveState();
  }

  function startBigTvTimer() {
    clearQuizTimer();
    quizTimer = setInterval(() => {
      if (currentRoute !== 'tvplay' || state.bigTvGame.paused || !state.bigTvGame.active) return;
      if (state.bigTvGame.secondsLeft > 0) {
        state.bigTvGame.secondsLeft -= 1;
        const timer = document.querySelector('.big-timer');
        if (timer) timer.textContent = String(state.bigTvGame.secondsLeft).padStart(2, '0');
      } else {
        advanceBigTvTurn(false, true);
      }
    }, 1000);
  }

  function awardBigTvPoint() {
    const team = state.bigTvTeams[state.bigTvGame.currentTeamIndex];
    if (!team) return;
    team.score += Number(state.bigTvSettings.pointsPerCorrect || 100);
    team.solved = (team.solved || 0) + 1;
    playTone(660, .12);
    advanceBigTvTurn(true);
  }

  function advanceBigTvTurn(scored, skipped = false) {
    const queue = getBigTvQueueFromState();
    if (!queue.length) {
      toast('請先在設定頁加入大電視題目。');
      return;
    }
    const teamCount = state.bigTvSettings.teamCount;
    state.bigTvGame.showAnswer = false;
    state.bigTvGame.secondsLeft = state.bigTvSettings.secondsPerRound;
    state.bigTvGame.currentTeamIndex = (state.bigTvGame.currentTeamIndex + 1) % teamCount;
    state.bigTvGame.roundIndex += 1;
    if (state.bigTvGame.roundIndex >= Math.min(queue.length, state.bigTvSettings.rounds)) {
      state.bigTvGame.active = false;
      state.bigTvGame.paused = true;
      saveState();
      clearQuizTimer();
      toast('大電視回合完成！');
      render();
      return;
    }
    state.bigTvGame.currentQuestionId = queue[state.bigTvGame.roundIndex]?.id || queue[0].id;
    saveState();
    render();
  }

  function addBigTvManualQuestion() {
    const prompt = document.getElementById('tvManualPrompt')?.value.trim();
    const categoryId = document.getElementById('tvManualCategory')?.value || state.bigTvCategories[0]?.id;
    const difficulty = document.getElementById('tvManualDifficulty')?.value || '中等';
    if (!prompt) {
      reportTv([{ type: 'error', text: '請先輸入題目內容。' }]);
      return;
    }
    state.bigTvQuestions.push({ id: crypto.randomUUID(), prompt, categoryId, difficulty });
    saveState();
    reportTv([{ type: 'ok', text: `已加入題目：「${prompt}」` }]);
    render();
  }

  function importBigTvBulkQuestions() {
    const raw = document.getElementById('tvBulkText')?.value || '';
    const categoryId = document.getElementById('tvBulkCategory')?.value || state.bigTvCategories[0]?.id;
    const difficulty = document.getElementById('tvBulkDifficulty')?.value || '中等';
    const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (!lines.length) {
      reportTv([{ type: 'error', text: '請先輸入批量題目。' }]);
      return;
    }
    const added = lines.map((prompt) => ({ id: crypto.randomUUID(), prompt, categoryId, difficulty }));
    state.bigTvQuestions.push(...added);
    saveState();
    reportTv([{ type: 'ok', text: `已批量匯入 ${added.length} 題。` }]);
    render();
  }

  function addBigTvCategory() {
    const name = document.getElementById('newTvCategoryName')?.value.trim();
    const icon = document.getElementById('newTvCategoryIcon')?.value.trim() || '🏷️';
    if (!name) {
      reportTv([{ type: 'error', text: '請輸入類別名稱。' }]);
      return;
    }
    const id = slugify(name);
    if (state.bigTvCategories.some((cat) => cat.id === id || cat.name === name)) {
      reportTv([{ type: 'error', text: '已有相同類別名稱。' }]);
      return;
    }
    state.bigTvCategories.push({ id, name, icon });
    saveState();
    reportTv([{ type: 'ok', text: `已新增類別：「${name}」` }]);
    render();
  }

  function editBigTvCategory(id) {
    const category = state.bigTvCategories.find((cat) => cat.id === id);
    if (!category) return;
    const name = prompt('請輸入新的類別名稱：', category.name);
    if (!name) return;
    category.name = name.trim();
    saveState();
    render();
  }

  function deleteBigTvCategory(id) {
    if (state.bigTvCategories.length <= 1) {
      reportTv([{ type: 'error', text: '至少需要保留一個類別。' }]);
      return;
    }
    const category = state.bigTvCategories.find((cat) => cat.id === id);
    if (!category) return;
    if (!confirm(`確定刪除「${category.name}」？其題目會移至第一個類別。`)) return;
    const fallbackId = state.bigTvCategories.find((cat) => cat.id !== id).id;
    state.bigTvQuestions.forEach((q) => { if (q.categoryId === id) q.categoryId = fallbackId; });
    state.bigTvCategories = state.bigTvCategories.filter((cat) => cat.id !== id);
    if (state.bigTvSettings.selectedCategoryId === id) state.bigTvSettings.selectedCategoryId = fallbackId;
    saveState();
    render();
  }

  async function importBigTvExcel(file) {
    const name = file.name.toLowerCase();
    try {
      let rows = [];
      if (name.endsWith('.csv')) {
        rows = parseCsv(await file.text());
      } else if (window.XLSX) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
      } else {
        reportTv([{ type: 'error', text: '未能載入 Excel 函式庫，請改用 CSV。' }]);
        return;
      }
      const imported = parseBigTvRows(rows);
      if (document.getElementById('replaceTvOnImport')?.checked) state.bigTvQuestions = [];
      state.bigTvQuestions.push(...imported.items);
      saveState();
      reportTv([{ type: 'ok', text: `已匯入 ${imported.items.length} 題。` }, ...imported.errors.map((text) => ({ type: 'error', text }))]);
      render();
    } catch (error) {
      console.error(error);
      reportTv([{ type: 'error', text: '匯入失敗，請檢查檔案格式。' }]);
    }
  }

  function parseBigTvRows(rows) {
    if (!rows.length) return { items: [], errors: ['檔案內沒有資料。'] };
    const headers = rows[0].map((cell) => normalizeHeader(cell));
    const questionIndex = findHeader(headers, ['題目', '內容', 'prompt', 'question']);
    const categoryIndex = findHeader(headers, ['類別', 'category']);
    const difficultyIndex = findHeader(headers, ['難度', 'difficulty']);
    const items = [];
    const errors = [];
    const startAt = questionIndex >= 0 ? 1 : 0;
    rows.slice(startAt).forEach((row, idx) => {
      const promptText = String(row[questionIndex >= 0 ? questionIndex : 0] ?? '').trim();
      if (!promptText) return;
      const categoryName = String(row[categoryIndex] ?? '').trim();
      const difficulty = String(row[difficultyIndex] ?? '').trim() || '中等';
      let categoryId = state.bigTvCategories.find((cat) => cat.name === categoryName)?.id || state.bigTvSettings.selectedCategoryId;
      if (!categoryId) categoryId = state.bigTvCategories[0]?.id;
      items.push({ id: crypto.randomUUID(), prompt: promptText, categoryId, difficulty });
    });
    return { items, errors };
  }

  async function downloadBigTvTemplate() {
    const rows = [['題目', '類別', '難度'], ['刷牙', '動作類', '中等'], ['企鵝', '動物類', '簡單']];
    if (window.XLSX) {
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '大電視題庫');
      XLSX.writeFile(wb, '大電視題庫範本.xlsx');
      toast('大電視題庫範本已下載。');
      return;
    }
    downloadCsv(rows, '大電視題庫範本.csv');
  }

  function reportTv(items) {
    const el = document.getElementById('tvImportReport');
    if (el) el.innerHTML = items.map((item) => `<div class="report-item ${item.type}">${escapeHtml(item.text)}</div>`).join('');
  }

  function bindBank() {
    document.querySelectorAll('[data-import-tab]').forEach((tab)=>tab.addEventListener('click',()=>{
      document.querySelectorAll('[data-import-tab]').forEach(t=>t.classList.toggle('is-active',t===tab));
      document.querySelectorAll('[data-import-pane]').forEach(p=>p.classList.toggle('is-active',p.dataset.importPane===tab.dataset.importTab));
    }));
    document.getElementById('addManualQuestion')?.addEventListener('click', addManualQuestion);
    document.getElementById('importBulk')?.addEventListener('click', importBulkQuestions);
    document.getElementById('excelFile')?.addEventListener('change', (e)=>handleExcelFile(e.target.files[0]));
    const dropzone = document.getElementById('dropzone');
    ['dragenter','dragover'].forEach(type=>dropzone?.addEventListener(type,(e)=>{e.preventDefault();dropzone.classList.add('is-dragging');}));
    ['dragleave','drop'].forEach(type=>dropzone?.addEventListener(type,(e)=>{e.preventDefault();dropzone.classList.remove('is-dragging');}));
    dropzone?.addEventListener('drop',(e)=>handleExcelFile(e.dataTransfer.files[0]));
    document.getElementById('exportQuestions')?.addEventListener('click',()=>exportQuestions());
    document.getElementById('questionPrev')?.addEventListener('click',()=>{ bankPage=Math.max(0,bankPage-1); render(); });
    document.getElementById('questionNext')?.addEventListener('click',()=>{ const last=Math.max(0,Math.ceil(state.questions.length/QUESTIONS_PER_PAGE)-1); bankPage=Math.min(last,bankPage+1); render(); });
    document.getElementById('clearQuestions')?.addEventListener('click',()=>{
      if (confirm('確定清空全部題目？此動作不能復原。')) { state.questions=[]; saveState(); render(); }
    });
    document.querySelectorAll('[data-question-row]').forEach((row)=>{
      const question = state.questions.find(q=>q.id===row.dataset.questionRow);
      row.querySelector('.delete-question').addEventListener('click',()=>{ state.questions=state.questions.filter(q=>q.id!==question.id); bankPage=Math.min(bankPage,Math.max(0,Math.ceil(state.questions.length/QUESTIONS_PER_PAGE)-1)); saveState(); render(); });
      row.querySelector('.edit-question').addEventListener('click',()=>openEditQuestion(question));
    });
  }

  function addManualQuestion() {
    const question = document.getElementById('manualQuestion').value.trim();
    const options = ['manualA','manualB','manualC','manualD'].map(id=>document.getElementById(id).value.trim());
    const answer = Number(document.getElementById('manualAnswer').value);
    const score = Math.max(1, Number(document.getElementById('manualScore').value || 100));
    const explanation = document.getElementById('manualExplanation').value.trim();
    if (!question || options.some(Boolean)===false || options.some(o=>!o)) { report([{type:'error',text:'請填寫題目及四個選項。'}]); return; }
    state.questions.push({ id: crypto.randomUUID(), question, options, answer, score, explanation });
    bankPage = Math.max(0, Math.ceil(state.questions.length / QUESTIONS_PER_PAGE) - 1);
    saveState(); toast('題目已加入題庫。'); render();
  }

  function importBulkQuestions() {
    const text = document.getElementById('bulkText').value.trim();
    if (!text) { report([{type:'error',text:'請先貼上批量題目。'}]); return; }
    const lines = text.split(/\r?\n/).filter(line=>line.trim());
    const imported=[]; const errors=[];
    lines.forEach((line,index)=>{
      const parts = line.includes('\t') ? line.split('\t') : line.split('|');
      const cells = parts.map(p=>p.trim());
      if (index===0 && /題目|question/i.test(cells[0]) && /選項|option/i.test(cells[1]||'')) return;
      const parsed = parseQuestionCells(cells);
      if (parsed.error) errors.push(`第 ${index+1} 行：${parsed.error}`); else imported.push(parsed.question);
    });
    state.questions.push(...imported); saveState();
    report([{type:'ok',text:`成功匯入 ${imported.length} 題。`},...errors.slice(0,8).map(text=>({type:'error',text}))]);
    if (imported.length) setTimeout(render,700);
  }

  async function handleExcelFile(file) {
    if (!file) return;
    try {
      if (/\.csv$/i.test(file.name)) {
        const text = await file.text();
        const rows = parseCsv(text);
        importRows(rows, file.name);
        return;
      }
      if (!window.XLSX) throw new Error('Excel 讀取程式庫未能載入。請檢查網絡，或改用 CSV／批量輸入。');
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
      importRows(rows, file.name);
    } catch (error) {
      report([{type:'error',text:error.message || '檔案讀取失敗。'}]);
    }
  }

  function importRows(rows, sourceName) {
    if (!Array.isArray(rows) || !rows.length) { report([{type:'error',text:'檔案沒有可匯入的資料。'}]); return; }
    const headers = rows[0].map(normalizeHeader);
    const map = {
      question: findHeader(headers,['題目','問題','question']),
      a: findHeader(headers,['選項a','選項1','a','optiona','option1']),
      b: findHeader(headers,['選項b','選項2','b','optionb','option2']),
      c: findHeader(headers,['選項c','選項3','c','optionc','option3']),
      d: findHeader(headers,['選項d','選項4','d','optiond','option4']),
      answer: findHeader(headers,['正確答案','答案','answer','correctanswer']),
      score: findHeader(headers,['分數','score','points']),
      explanation: findHeader(headers,['解說','答案解說','說明','explanation','feedback'])
    };
    if ([map.question,map.a,map.b,map.c,map.d,map.answer].some(v=>v<0)) { report([{type:'error',text:'找不到必要欄位。請使用範本欄位：題目、選項A、選項B、選項C、選項D、正確答案。'}]); return; }
    const imported=[]; const errors=[];
    rows.slice(1).forEach((row,index)=>{
      if (!row.some(cell=>String(cell).trim())) return;
      const cells=[row[map.question],row[map.a],row[map.b],row[map.c],row[map.d],row[map.answer],map.score>=0?row[map.score]:'',map.explanation>=0?row[map.explanation]:''];
      const parsed=parseQuestionCells(cells);
      if(parsed.error) errors.push(`第 ${index+2} 行：${parsed.error}`); else imported.push(parsed.question);
    });
    if (document.getElementById('replaceOnImport')?.checked) state.questions=[];
    state.questions.push(...imported); saveState();
    report([{type:'ok',text:`已從「${sourceName}」匯入 ${imported.length} 題。`},...errors.slice(0,8).map(text=>({type:'error',text}))]);
    if (imported.length) setTimeout(render,700);
  }

  function parseQuestionCells(cells) {
    const question = String(cells[0] ?? '').trim();
    const options = [1,2,3,4].map(i=>String(cells[i] ?? '').trim());
    if (!question) return { error:'缺少題目' };
    if (options.some(o=>!o)) return { error:'四個選項未填完整' };
    const answer = normalizeAnswer(cells[5], options);
    if (answer < 0) return { error:'正確答案格式無法辨識' };
    const score = Math.max(1, Number(cells[6] || 100));
    return { question:{ id:crypto.randomUUID(), question, options, answer, score:Number.isFinite(score)?score:100, explanation:String(cells[7]??'').trim() } };
  }

  function normalizeAnswer(value, options) {
    const raw=String(value??'').trim();
    const upper=raw.toUpperCase().replace(/[.、。\s]/g,'');
    if(['A','B','C','D'].includes(upper)) return upper.charCodeAt(0)-65;
    if(['1','2','3','4'].includes(upper)) return Number(upper)-1;
    return options.findIndex(o=>o.trim()===raw);
  }

  function normalizeHeader(value) { return String(value??'').trim().toLowerCase().replace(/[\s_\-]/g,''); }
  function findHeader(headers, aliases) { return headers.findIndex(h=>aliases.some(a=>h===normalizeHeader(a))); }

  function parseCsv(text) {
    const rows=[]; let row=[]; let cell=''; let quoted=false;
    for(let i=0;i<text.length;i++){
      const ch=text[i]; const next=text[i+1];
      if(ch==='"' && quoted && next==='"'){cell+='"';i++;continue;}
      if(ch==='"'){quoted=!quoted;continue;}
      if(ch===',' && !quoted){row.push(cell);cell='';continue;}
      if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&next==='\n')i++;row.push(cell);rows.push(row);row=[];cell='';continue;}
      cell+=ch;
    }
    if(cell.length||row.length){row.push(cell);rows.push(row);} return rows;
  }

  async function downloadTemplate() {
    const filename = '題庫匯入範本.xlsx';
    const templateUrl = new URL('./question-bank-template.xlsx', window.location.href);
    try {
      const response = await fetch(templateUrl, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      triggerDownload(objectUrl, filename);
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1200);
      toast('Excel 題庫範本已開始下載。');
      return;
    } catch (error) {
      console.warn('Static template download failed; using generated fallback.', error);
    }

    const rows = [
      ['題目','選項A','選項B','選項C','選項D','正確答案','分數','解說'],
      ['香港最高的山峰是哪一座？','太平山','大帽山','獅子山','鳳凰山','B',100,'大帽山是香港最高峰。']
    ];
    if (window.XLSX) {
      const sheet = XLSX.utils.aoa_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, '題庫');
      XLSX.writeFile(workbook, filename);
      toast('Excel 題庫範本已重新產生並下載。');
      return;
    }
    downloadCsv(rows, '題庫匯入範本.csv');
    toast('Excel 程式庫未載入，已改為下載可直接用 Excel 開啟的 CSV 範本。');
  }

  function triggerDownload(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function exportQuestions() {
    const rows=[['題目','選項A','選項B','選項C','選項D','正確答案','分數','解說'],...state.questions.map(q=>[q.question,...q.options,String.fromCharCode(65+q.answer),q.score||100,q.explanation||''])];
    if(window.XLSX){const ws=XLSX.utils.aoa_to_sheet(rows);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'題庫');XLSX.writeFile(wb,'小組活動題庫.xlsx');}
    else downloadCsv(rows,'小組活動題庫.csv');
  }

  function downloadCsv(rows,filename){const csv='\ufeff'+rows.map(row=>row.map(cell=>`"${String(cell??'').replace(/"/g,'""')}"`).join(',')).join('\r\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);}

  function openEditQuestion(question) {
    modalLayer.innerHTML=`<div class="modal-backdrop" role="dialog" aria-modal="true"><div class="modal" style="text-align:left;width:min(760px,100%)"><h2>編輯題目</h2><div class="form-grid"><div class="field"><label>題目</label><input class="input" id="editQuestion" value="${escapeAttr(question.question)}"></div><div class="form-grid two">${question.options.map((o,i)=>`<div class="field"><label>選項 ${String.fromCharCode(65+i)}</label><input class="input edit-option" value="${escapeAttr(o)}"></div>`).join('')}</div><div class="form-grid two"><div class="field"><label>正確答案</label><select class="select" id="editAnswer">${[0,1,2,3].map(i=>`<option value="${i}" ${i===question.answer?'selected':''}>${String.fromCharCode(65+i)}</option>`).join('')}</select></div><div class="field"><label>分數</label><input class="input" id="editScore" type="number" min="1" value="${question.score||100}"></div></div><div class="field"><label>解說</label><textarea class="textarea" id="editExplanation">${escapeHtml(question.explanation||'')}</textarea></div><div class="modal-actions"><button class="btn btn-blue" id="saveEditQuestion">儲存</button><button class="btn btn-ghost" id="cancelEditQuestion">取消</button></div></div></div></div>`;
    document.getElementById('cancelEditQuestion').addEventListener('click',closeModal);
    document.getElementById('saveEditQuestion').addEventListener('click',()=>{
      const questionText=document.getElementById('editQuestion').value.trim();
      const options=[...document.querySelectorAll('.edit-option')].map(i=>i.value.trim());
      if(!questionText||options.some(o=>!o)){toast('請填寫題目及四個選項。');return;}
      question.question=questionText;question.options=options;question.answer=Number(document.getElementById('editAnswer').value);question.score=Math.max(1,Number(document.getElementById('editScore').value||100));question.explanation=document.getElementById('editExplanation').value.trim();saveState();closeModal();render();
    });
  }

  function report(items) { const el=document.getElementById('importReport'); if(el) el.innerHTML=items.map(item=>`<div class="report-item ${item.type}">${escapeHtml(item.text)}</div>`).join(''); }

  function toast(message) { const el=document.createElement('div');el.className='toast';el.textContent=message;toastRegion.appendChild(el);setTimeout(()=>el.remove(),2600); }

  function launchConfetti() {
    const colors=['#ff5e78','#ffd25a','#25c7c9','#7a5cff','#3cc678','#ff9f39'];
    for(let i=0;i<50;i++){
      const piece=document.createElement('span');piece.className='confetti';piece.style.left=`${Math.random()*100}vw`;piece.style.background=colors[i%colors.length];piece.style.animationDelay=`${Math.random()*.6}s`;piece.style.transform=`rotate(${Math.random()*360}deg)`;document.body.appendChild(piece);setTimeout(()=>piece.remove(),2600);
    }
  }

  function playTone(frequency=440,duration=.08){
    if(!state.soundEnabled||!window.AudioContext)return;
    try{const ctx=new AudioContext();const oscillator=ctx.createOscillator();const gain=ctx.createGain();oscillator.frequency.value=frequency;oscillator.type='sine';gain.gain.setValueAtTime(.045,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration);oscillator.connect(gain).connect(ctx.destination);oscillator.start();oscillator.stop(ctx.currentTime+duration);oscillator.addEventListener('ended',()=>ctx.close());}catch(error){console.debug(error);}
  }

  function clearQuizTimer(){if(quizTimer){clearInterval(quizTimer);quizTimer=null;}}
  function shuffle(array){for(let i=array.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[array[i],array[j]]=[array[j],array[i]];}return array;}
  function clamp(value,min,max){return Math.min(max,Math.max(min,value));}
  function slugify(value){return String(value||'').trim().toLowerCase().replace(/[^a-z0-9一-鿿]+/g,'-').replace(/^-+|-+$/g,'') || crypto.randomUUID();}
  function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,(char)=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));}
  function escapeAttr(value){return escapeHtml(value).replace(/`/g,'&#96;');}

  menuButton.addEventListener('click',()=>{const open=!mobileNav.classList.contains('is-open');mobileNav.classList.toggle('is-open',open);menuButton.setAttribute('aria-expanded',String(open));});
  soundToggle.addEventListener('click',()=>{state.soundEnabled=!state.soundEnabled;saveState();soundToggle.innerHTML=state.soundEnabled?'🔊':'🔇';toast(state.soundEnabled?'音效已開啟':'音效已關閉');});
  soundToggle.innerHTML=state.soundEnabled?'🔊':'🔇';
  window.addEventListener('hashchange',render);
  document.addEventListener('keydown',(e)=>{if(e.key==='Escape')closeModal();});
  render();
})();
