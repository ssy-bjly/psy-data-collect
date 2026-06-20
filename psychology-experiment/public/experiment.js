const app = document.getElementById('app');
const query = new URLSearchParams(window.location.search);
const debugMode = query.get('debug') === '1';

const RESOURCE_TEXT = {
  scarcity: {
    title: '水资源现状材料',
    image: '/assets/water-scarcity.svg',
    text: '目前，我国水资源缺乏，水资源分布严重不均，全国约有三分之二的城市缺水。我国人均水资源占有量处于世界中下游水平，是全球十三个人均水资源最缺乏的国家之一。部分地区长期面临降水不足、河流水位下降、土地干旱等问题，居民生活用水和农业灌溉均受到不同程度影响。随着人口增长与经济发展，水资源短缺问题日益突出，节约和保护水资源已经成为社会发展的重要任务。'
  },
  neutral: {
    title: '水循环材料',
    image: '/assets/water-neutral.svg',
    text: '水是地球上最常见的化合物之一，也是生命活动不可或缺的物质基础。在自然界中，水会以固态、液态和气态三种形态存在，并在大气、海洋、陆地之间不断循环，这个过程被称为水循环。当太阳照射到海洋、湖泊和河流的水面时，部分液态水会吸收热量，蒸发成为水蒸气进入大气中。随着气流运动，水蒸气会在高空遇冷凝结成云，当云中的水滴或冰晶聚集到足够大的重量时，就会以雨、雪、冰雹等形式降落到地面，形成降水。降落到陆地上的水，一部分会渗入地下，成为地下水；一部分会汇入河流、湖泊，最终流回海洋；还有一部分会被植物吸收，再通过蒸腾作用重新回到大气中。水循环的过程，维持着全球水量的动态平衡，也塑造了多样的地貌与气候环境。'
  }
};

const TIME_TEXT = {
  future: {
    title: '任务说明',
    text: '在接下来的问题中，请您主要关注“未来”情境下的选择。请您在回答问题时，重点思考：该选择未来能够带来的长期收益；长远来看是否更加有利；从未来角度看，什么才是最佳选择。请尽量专注于长期结果和未来影响，而不仅仅是当前的感受或即时利益。'
  },
  neutral: {
    title: '任务说明',
    text: '在接下来的问题中，请您根据题目本身的要求进行选择。请您在回答问题时，重点关注：题目描述的内容本身；选项中提供的信息；问题所给出的所有条件。请尽量专注于问题本身和题目信息，根据自己的真实判断做出选择。'
  }
};

const CONTROL_ITEMS = [
  '我完全掌控我的行为',
  '我只是别人手中的一个工具',
  '我行为的结果往往会出乎我的意料',
  '决定是否采取行动以及何时采取行动都在我的掌控之中',
  '我做的事情是出于我的自由意愿',
  '我所做的行为没有一个是自愿的',
  '当我在行动的时候，我感觉自己是一个遥控机器人',
  '我的行为从开始到结束都是由我计划的',
  '我对由我的行为造成的一切后果负有完全的责任'
];

const FUTURE_TRAIT_ITEMS = [
  '我经常考虑事情在未来的发展状况，并且会通过当下的努力来实现我想要的结果。',
  '即使有些事情要在多年之后才能看到结果，我也愿意为之付出努力。',
  '为了实现未来的目标，我愿意牺牲一些当下的快乐和幸福。',
  '我认为无论事情是否会向不好的方向发展，都有必要提前做好应对的准备。',
  '相比于那些当下就能取得成效但并不重要的事情，我更愿意去做那些长期见效但影响更为深远的事情。',
  '当我做决定时，我会考虑它在未来对我产生的影响。',
  '我在做事情之前，都会考虑到它在未来产生的结果。'
];

const DEMOGRAPHICS = [
  ['gender', '您的性别', ['男', '女', '其他 / 不愿透露']],
  ['age', '您的年龄', ['18 岁及以下', '19-24 岁', '25-30 岁', '31-40 岁', '41 岁及以上']],
  ['education', '您的最高学历', ['高中及以下', '专科', '本科', '硕士研究生', '博士研究生及以上']],
  ['occupation', '您目前的职业状态', ['在校学生', '企业 / 公司职员', '事业单位 / 公务员', '自由职业者', '待业 / 其他']],
  ['income', '您的月可支配收入（学生可填生活费）', ['2000 元及以下', '2001-5000 元', '5001-10000 元', '10001 元及以上']],
  ['region', '您的成长 / 主要生活地区', ['一线城市（北上广深）', '新一线城市 / 省会城市', '地级市 / 县级市', '乡镇 / 农村']]
];

const PRODUCT_SETS = [
  {
    id: 'food',
    title: '商品组 1',
    options: [
      { id: 'regular_food', label: '普通食品', image: '/assets/product-regular-food.jpg' },
      { id: 'green_food', label: '绿色食品', image: '/assets/product-green-food.jpg' }
    ]
  },
  {
    id: 'detergent',
    title: '商品组 2',
    options: [
      { id: 'regular_detergent', label: '高泡洗衣液', image: '/assets/product-regular-detergent.jpg' },
      { id: 'green_detergent', label: '环保洗衣液', image: '/assets/product-green-detergent.jpg' }
    ]
  }
];

const state = {
  sessionId: '',
  participantCode: '',
  groupNumber: null,
  condition: null,
  data: {
    demographics: {},
    futureTrait: {},
    resourceManipulation: null,
    controlPre: {},
    instructionRestatement: '',
    timeManipulation: null,
    controlPost: {},
    productChoices: {},
    donationAmount: null
  },
  startedAt: null,
  currentStep: 'intro'
};

const steps = [
  'intro',
  'baseline',
  'resourcePrime',
  'resourceCheck',
  'controlPre',
  'timePrime',
  'timeCheck',
  'controlPost',
  'products',
  'donationBrowse',
  'donation',
  'finish'
];

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]));
}

function setStep(step) {
  state.currentStep = step;
  window.scrollTo({ top: 0, behavior: 'instant' });
  render();
}

function nextStep() {
  const index = steps.indexOf(state.currentStep);
  setStep(steps[index + 1]);
}

function page(title, body, button = '下一步') {
  app.innerHTML = `
    <section class="panel">
      <header class="page-head">
        <p class="eyebrow">心理学实验${debugMode ? ' · Debug 模式' : ''}</p>
        <h1>${title}</h1>
      </header>
      <form id="stepForm" class="stack">
        ${body}
        <div class="actions">
          <button type="submit">${button}</button>
        </div>
        <p id="error" class="error" role="alert"></p>
      </form>
    </section>
  `;
}

function requireMinimumSeconds(seconds, finalText = '下一步') {
  const button = document.querySelector('#stepForm button[type="submit"]');
  if (!button) return;
  // In debug mode, skip the minimum-time enforcement and enable the button immediately.
  if (debugMode) {
    button.disabled = false;
    button.textContent = finalText;
    return;
  }
  const started = Date.now();
  button.disabled = true;

  const tick = () => {
    const elapsed = Math.floor((Date.now() - started) / 1000);
    const remaining = Math.max(0, seconds - elapsed);
    if (remaining > 0) {
      button.textContent = `${finalText}（${remaining} 秒后可继续）`;
      window.setTimeout(tick, 250);
      return;
    }
    button.disabled = false;
    button.textContent = finalText;
  };

  tick();
}

function likert(name, value) {
  const options = Array.from({ length: 7 }, (_, i) => i + 1).map(score => `
    <label class="likert-option">
      <input type="radio" name="${name}" value="${score}" ${Number(value) === score ? 'checked' : ''} required>
      <span>${score}</span>
    </label>
  `).join('');
  return `
    <div class="likert">
      <div class="likert-labels">
        <span>非常不同意</span>
        <span>非常同意</span>
      </div>
      <div class="likert-grid">${options}</div>
    </div>
  `;
}

function scaleRow(name, text, value) {
  return `
    <fieldset class="question">
      <legend>${escapeHtml(text)}</legend>
      ${likert(name, value)}
    </fieldset>
  `;
}

function selected(name, value) {
  return value ? `input[name="${name}"][value="${CSS.escape(value)}"]` : '';
}

function getFormValues(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function validateAll(form) {
  if (!form.checkValidity()) {
    form.reportValidity();
    return false;
  }
  return true;
}

function renderIntro() {
  page('指导语', `
    <div class="prose">
      <p>您好，您正在参加一项关于个体判断与选择的心理学实验。实验过程中，您将阅读若干材料并完成一些问卷与选择任务。所有答案仅用于研究分析，请根据自己的真实感受和判断作答。</p>
      <p>实验没有对错之分。请在相对安静的环境中独立完成，并尽量不要中途退出或刷新页面。</p>
    </div>
    <label class="checkline">
      <input type="checkbox" required>
      <span>我已阅读上述说明，并自愿参加本实验。</span>
    </label>
  `, '开始实验');
  bindSubmit(() => {
    state.startedAt = Date.now();
    nextStep();
  });
}

function renderBaseline() {
  const demographicHtml = DEMOGRAPHICS.map(([key, label, options]) => `
    <fieldset class="question compact">
      <legend>${label}</legend>
      <div class="choice-list">
        ${options.map(option => `
          <label>
            <input type="radio" name="${key}" value="${escapeHtml(option)}" ${state.data.demographics[key] === option ? 'checked' : ''} required>
            <span>${escapeHtml(option)}</span>
          </label>
        `).join('')}
      </div>
    </fieldset>
  `).join('');

  const traitHtml = FUTURE_TRAIT_ITEMS.map((item, i) => scaleRow(`futureTrait_${i + 1}`, item, state.data.futureTrait[`futureTrait_${i + 1}`])).join('');

  page('基线问卷', `
    <p class="hint">请根据自身情况填写以下问题。量表采用 Likert 7 点计分，1 代表“非常不同意”，7 代表“非常同意”。</p>
    ${demographicHtml}
    ${traitHtml}
  `);
  bindSubmit(form => {
    const values = getFormValues(form);
    DEMOGRAPHICS.forEach(([key]) => state.data.demographics[key] = values[key]);
    FUTURE_TRAIT_ITEMS.forEach((_, i) => state.data.futureTrait[`futureTrait_${i + 1}`] = Number(values[`futureTrait_${i + 1}`]));
    nextStep();
  });
}

function renderResourcePrime() {
  const material = RESOURCE_TEXT[state.condition.resource];
  page(material.title, `
    <p class="hint">请认真阅读以下材料，并观察图片。</p>
    <img class="material-image" src="${material.image}" alt="">
    <div class="prose"><p>${material.text}</p></div>
  `);
  requireMinimumSeconds(15);
  bindSubmit(() => nextStep());
}

function renderResourceCheck() {
  page('材料理解题', `
    <fieldset class="question">
      <legend>阅读上述材料后，我感受到我国水资源的状况是：</legend>
      <div class="likert">
        <div class="likert-labels">
          <span>非常稀缺</span>
          <span>非常丰富</span>
        </div>
        <div class="likert-grid">
          ${Array.from({ length: 7 }, (_, i) => i + 1).map(score => `
            <label class="likert-option">
              <input type="radio" name="resourceManipulation" value="${score}" ${Number(state.data.resourceManipulation) === score ? 'checked' : ''} required>
              <span>${score}</span>
            </label>
          `).join('')}
        </div>
      </div>
    </fieldset>
  `);
  bindSubmit(form => {
    state.data.resourceManipulation = Number(getFormValues(form).resourceManipulation);
    nextStep();
  });
}

function renderControl(key, title) {
  const values = state.data[key];
  const html = CONTROL_ITEMS.map((item, i) => {
    const prefix = [2, 3, 6, 7].includes(i + 1) ? '＊' : '';
    return scaleRow(`${key}_${i + 1}`, `${prefix}${item}`, values[`${key}_${i + 1}`]);
  }).join('');
  page(title, `
    <p class="hint">Likert 7 点计分，1 代表“非常不同意”，7 代表“非常同意”。</p>
    ${html}
  `);
  bindSubmit(form => {
    const valuesFromForm = getFormValues(form);
    CONTROL_ITEMS.forEach((_, i) => values[`${key}_${i + 1}`] = Number(valuesFromForm[`${key}_${i + 1}`]));
    nextStep();
  });
}

function renderTimePrime() {
  const text = TIME_TEXT[state.condition.time];
  page(text.title, `
    <div class="prose"><p>${text.text}</p></div>
    <label class="textarea-field">
      <span>为了确保您已经理解上述说明，请用您自己的语言简单复述：在接下来的任务中，您应该重点关注什么？</span>
      <textarea name="instructionRestatement" rows="5" minlength="5" required>${escapeHtml(state.data.instructionRestatement)}</textarea>
    </label>
  `);
  bindSubmit(form => {
    state.data.instructionRestatement = getFormValues(form).instructionRestatement.trim();
    nextStep();
  });
}

function renderTimeCheck() {
  page('关注点检验', `
    <fieldset class="question">
      <legend>阅读上述材料后，你的主要关注点将会是什么？</legend>
      <div class="likert">
        <div class="likert-labels">
          <span>现在</span>
          <span>未来</span>
        </div>
        <div class="likert-grid">
          ${Array.from({ length: 7 }, (_, i) => i + 1).map(score => `
            <label class="likert-option">
              <input type="radio" name="timeManipulation" value="${score}" ${Number(state.data.timeManipulation) === score ? 'checked' : ''} required>
              <span>${score}</span>
            </label>
          `).join('')}
        </div>
      </div>
    </fieldset>
  `);
  bindSubmit(form => {
    state.data.timeManipulation = Number(getFormValues(form).timeManipulation);
    nextStep();
  });
}

function renderProducts() {
  const html = PRODUCT_SETS.map(set => `
    <fieldset class="question">
      <legend>${set.title}：请选择其一加入购物车</legend>
      <div class="product-grid">
        ${set.options.map(option => `
          <label class="product-card">
            <input type="radio" name="product_${set.id}" value="${option.id}" ${state.data.productChoices[set.id] === option.id ? 'checked' : ''} required>
            <img src="${option.image}" alt="">
            <span>${option.label}</span>
          </label>
        `).join('')}
      </div>
    </fieldset>
  `).join('');
  page('任务 1：商品选择', html);
  bindSubmit(form => {
    const values = getFormValues(form);
    PRODUCT_SETS.forEach(set => state.data.productChoices[set.id] = values[`product_${set.id}`]);
    nextStep();
  });
}

function renderDonationBrowse() {
  page('任务 2：亲环境机构浏览', `
    <p class="hint">请浏览以下公益组织募捐项目页面。页面至少停留 15 秒后方可继续。</p>
    <div class="external-link">
      <a href="https://gongyi.yeepay.com/www/charitabledetail.html?id=1960981726492307456#/" target="_blank" rel="noopener">打开自然之友募捐项目页面</a>
    </div>
    <label class="checkline">
      <input type="checkbox" name="visitedDonationPage" required>
      <span>我已浏览上述募捐项目页面。</span>
    </label>
  `);
  requireMinimumSeconds(15);
  bindSubmit(() => nextStep());
}

function renderDonation() {
  page('任务 2：亲环境机构捐赠', `
    <p class="hint">如果实验审核通过，到这里，你将获得 5 元被试费，你愿意将其中的多少元捐赠给上述组织。（确认后会真实捐赠，你将收获扣去捐赠数额的被试费）</p>
    <fieldset class="question">
      <legend>请选择您愿意捐赠的金额</legend>
      <div class="likert donation-scale">
        <div class="likert-labels">
          <span>非常不愿意</span>
          <span>非常愿意</span>
        </div>
        <div class="likert-grid donation-grid">
          ${Array.from({ length: 6 }, (_, score) => `
            <label class="likert-option">
              <input type="radio" name="donationAmount" value="${score}" ${Number(state.data.donationAmount) === score ? 'checked' : ''} required>
              <span>${score}</span>
            </label>
          `).join('')}
        </div>
      </div>
      <p class="hint scale-caption">单位：元</p>
    </fieldset>
  `, '提交实验');
  bindSubmit(async form => {
    const values = getFormValues(form);
    state.data.donationAmount = Number(values.donationAmount);
    await submitExperiment(form);
  });
}

function renderFinish() {
  app.innerHTML = `
    <section class="panel final-panel">
      <p class="eyebrow">实验完成</p>
      <h1>感谢您的参与</h1>
      <p>您的作答已提交。请按研究人员要求完成后续流程。</p>
    </section>
  `;
}

async function submitExperiment(form) {
  const button = form.querySelector('button');
  const error = document.getElementById('error');
  button.disabled = true;
  button.textContent = '提交中...';

  const now = Date.now();
  const durationMs = state.startedAt ? now - state.startedAt : 0;

  const payload = {
    sessionId: state.sessionId,
    participantCode: state.participantCode,
    groupNumber: state.groupNumber,
    condition: state.condition,
    durationMs,
    data: state.data
  };

  try {
    const res = await fetch(debugMode ? '/api/debug/submit' : '/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || '提交失败，请稍后重试。');
    sessionStorage.setItem('submitted', '1');
    state.currentStep = 'finish';
    render();
  } catch (err) {
    error.textContent = err.message;
    button.disabled = false;
    button.textContent = '提交实验';
  }
}

function bindSubmit(handler) {
  const form = document.getElementById('stepForm');
  // Disable native constraint validation in debug mode so the submit event fires.
  if (debugMode) form.setAttribute('novalidate', '');
  form.addEventListener('submit', event => {
    event.preventDefault();
    // In debug mode allow submitting without satisfying required fields.
    if (!debugMode && !validateAll(form)) return;
    handler(form);
  });
}

async function boot() {
  try {
    const res = await fetch(debugMode ? '/api/debug/session' : '/api/session');
    const data = await res.json();
    state.participantCode = data.participantCode || '';
    state.groupNumber = data.groupNumber || null;
    state.sessionId = data.sessionId || '';
    state.condition = data.condition || { resource: 'neutral', time: 'neutral' };
  } catch {
    state.participantCode = '';
    state.groupNumber = null;
    state.condition = { resource: 'neutral', time: 'neutral' };
  }
  render();
}

function render() {
  switch (state.currentStep) {
    case 'intro': return renderIntro();
    case 'baseline': return renderBaseline();
    case 'resourcePrime': return renderResourcePrime();
    case 'resourceCheck': return renderResourceCheck();
    case 'controlPre': return renderControl('controlPre', '请按照您当下的状态填写以下问题');
    case 'timePrime': return renderTimePrime();
    case 'timeCheck': return renderTimeCheck();
    case 'controlPost': return renderControl('controlPost', '请按照您当下的状态填写以下问题');
    case 'products': return renderProducts();
    case 'donationBrowse': return renderDonationBrowse();
    case 'donation': return renderDonation();
    case 'finish': return renderFinish();
    default: return renderIntro();
  }
}

boot();
