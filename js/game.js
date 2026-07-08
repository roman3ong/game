/**
 * 星际宠物 · Star Pets
 * 移动端星际宠物养成游戏
 */

// ===== 宠物种类定义 =====
const PET_SPECIES = {
  stardust: {
    id: 'stardust',
    name: '星尘兽',
    desc: '由宇宙尘埃凝聚而成',
    emoji: ['🌟', '⭐', '💫'],
    color: '#fbbf24',
  },
  moonspirit: {
    id: 'moonspirit',
    name: '月魄精灵',
    desc: '月光的温柔守护者',
    emoji: ['🌙', '🌕', '✨'],
    color: '#a855f7',
  },
  comet: {
    id: 'comet',
    name: '彗尾小龙',
    desc: '划过天际的火焰之子',
    emoji: ['🔥', '🐉', '☄️'],
    color: '#f97316',
  },
  nebula: {
    id: 'nebula',
    name: '星云猫',
    desc: '诞生于彩色星云之中',
    emoji: ['🐱', '🌈', '🐾'],
    color: '#ec4899',
  },
};

const EVOLVE_LEVELS = [1, 5, 10];
const STAGE_NAMES = ['幼体', '成长期', '完全体'];

const SHOP_ITEMS = [
  { id: 'starFood', name: '星尘口粮', desc: '饱食度 +30', icon: '🍖', price: 10, effect: { hunger: 30 } },
  { id: 'cosmicTreat', name: '宇宙零食', desc: '心情 +25', icon: '🍬', price: 15, effect: { mood: 25 } },
  { id: 'energyDrink', name: '能量饮料', desc: '能量 +30', icon: '🥤', price: 12, effect: { energy: 30 } },
  { id: 'healPotion', name: '治愈药剂', desc: '健康 +25', icon: '💊', price: 20, effect: { health: 25 } },
  { id: 'megaPack', name: '全能补给', desc: '全属性 +15', icon: '🎁', price: 35, effect: { hunger: 15, mood: 15, energy: 15, health: 15 } },
];

const MOOD_MESSAGES = ['❤️', '😊', '🎵', '✨', '💕', '🌟'];

const SAVE_KEY = 'starPets_save';

// ===== 游戏状态 =====
let state = {
  pet: null,
  coins: 0,
  inventory: {},
  logs: [],
  lastTick: Date.now(),
  actionCooldowns: {},
};

let exploreTimer = null;
let exploreScore = 0;
let tickInterval = null;

// ===== DOM 元素 =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ===== 初始化 =====
function init() {
  createStars();
  loadGame();
  bindEvents();

  if (state.pet) {
    showScreen('screen-game');
    startGameLoop();
    renderGame();
  } else {
    showScreen('screen-welcome');
    renderPetSelect();
  }
}

function createStars() {
  const bg = $('#stars-bg');
  for (let i = 0; i < 30; i++) {
    const star = document.createElement('div');
    star.style.cssText = `
      position:absolute;
      width:${Math.random() * 2 + 1}px;
      height:${Math.random() * 2 + 1}px;
      background:white;
      border-radius:50%;
      left:${Math.random() * 100}%;
      top:${Math.random() * 100}%;
      opacity:${Math.random() * 0.5 + 0.3};
      animation: twinkle ${Math.random() * 3 + 2}s ease-in-out infinite alternate;
    `;
    bg.appendChild(star);
  }
}

function bindEvents() {
  // 孵化蛋
  $('#cosmic-egg')?.addEventListener('click', onEggTap);

  // 操作按钮
  $$('.action-btn').forEach((btn) => {
    btn.addEventListener('click', () => doAction(btn.dataset.action));
  });

  // 点击宠物
  $('#pet-sprite')?.addEventListener('click', onPetTap);

  // 底部导航
  $$('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => openPanel(btn.dataset.tab));
  });

  // 关闭面板
  $$('.close-btn').forEach((btn) => {
    btn.addEventListener('click', () => closePanel(btn.dataset.close));
  });

  // 探索返回
  $('#explore-back')?.addEventListener('click', endExplore);

  // 阻止双击缩放
  document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) e.preventDefault();
  }, { passive: false });

  let lastTouch = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouch <= 300) e.preventDefault();
    lastTouch = now;
  }, { passive: false });
}

// ===== 欢迎 / 选宠 =====
let eggTaps = 0;

function onEggTap() {
  const egg = $('#cosmic-egg');
  egg.classList.add('shaking');
  eggTaps++;

  setTimeout(() => egg.classList.remove('shaking'), 500);

  if (eggTaps >= 5) {
    egg.classList.add('hatching');
    setTimeout(() => {
      $('#egg-container').classList.add('hidden');
      $('#pet-select').classList.remove('hidden');
    }, 800);
  }
}

function renderPetSelect() {
  const container = $('#pet-cards');
  container.innerHTML = '';

  Object.values(PET_SPECIES).forEach((species) => {
    const card = document.createElement('div');
    card.className = 'pet-card';
    card.innerHTML = `
      <span class="emoji">${species.emoji[0]}</span>
      <span class="name">${species.name}</span>
      <span class="desc">${species.desc}</span>
    `;
    card.addEventListener('click', () => selectPet(species.id));
    container.appendChild(card);
  });
}

function selectPet(speciesId) {
  const species = PET_SPECIES[speciesId];
  state.pet = {
    speciesId,
    name: species.name,
    level: 1,
    exp: 0,
    stage: 0,
    hunger: 80,
    mood: 80,
    energy: 80,
    health: 100,
    bornAt: Date.now(),
  };
  state.coins = 50;
  addLog(`🎉 ${species.name} 诞生了！欢迎来到星际世界！`);
  saveGame();
  showScreen('screen-game');
  startGameLoop();
  renderGame();
  showToast(`欢迎，${species.name}！`);
}

// ===== 游戏循环 =====
function startGameLoop() {
  if (tickInterval) clearInterval(tickInterval);
  tickInterval = setInterval(gameTick, 10000); // 每10秒衰减
}

function gameTick() {
  if (!state.pet) return;

  const pet = state.pet;
  pet.hunger = clamp(pet.hunger - 2, 0, 100);
  pet.mood = clamp(pet.mood - 1.5, 0, 100);
  pet.energy = clamp(pet.energy - 1, 0, 100);

  if (pet.hunger < 20 || pet.mood < 20) {
    pet.health = clamp(pet.health - 3, 0, 100);
  } else if (pet.health < 100) {
    pet.health = clamp(pet.health + 1, 0, 100);
  }

  state.lastTick = Date.now();
  saveGame();
  renderStats();

  if (pet.health <= 0) {
    showToast('宠物健康值归零！请尽快治疗！');
    pet.health = 1;
  }
}

// ===== 操作 =====
const ACTION_CONFIG = {
  feed: { hunger: 25, energy: -5, exp: 5, coins: 0, anim: 'eating', msg: '好好吃饭~', cooldown: 3000 },
  play: { mood: 20, energy: -15, hunger: -5, exp: 8, coins: 0, anim: 'happy', msg: '玩得好开心！', cooldown: 3000 },
  rest: { energy: 30, hunger: -5, exp: 3, coins: 0, anim: 'sleeping', msg: 'zzz...', cooldown: 5000 },
  train: { energy: -20, mood: -5, hunger: -10, exp: 15, coins: 5, anim: 'training', msg: '变强了！', cooldown: 5000 },
  explore: { energy: -25, mood: 10, exp: 0, coins: 0, anim: 'happy', msg: '', cooldown: 0, special: true },
};

function doAction(action) {
  if (!state.pet) return;

  const config = ACTION_CONFIG[action];
  if (!config) return;

  if (config.special && action === 'explore') {
    if (state.pet.energy < 25) {
      showToast('能量不足，无法探索！');
      return;
    }
    startExplore();
    return;
  }

  const now = Date.now();
  if (state.actionCooldowns[action] && now - state.actionCooldowns[action] < config.cooldown) {
    return;
  }

  const pet = state.pet;

  if (action === 'train' && pet.energy < 20) {
    showToast('能量不足，无法训练！');
    return;
  }
  if (action === 'play' && pet.energy < 15) {
    showToast('太累了，先休息一下吧！');
    return;
  }

  applyEffect(pet, config);
  addExp(config.exp || 0);
  state.coins += config.coins || 0;
  state.actionCooldowns[action] = now;

  playAnim(config.anim);
  if (config.msg) showMoodBubble(config.msg);
  addLog(getActionLog(action));
  saveGame();
  renderGame();

  if (config.cooldown) {
    const btn = document.querySelector(`[data-action="${action}"]`);
    btn?.classList.add('cooldown');
    setTimeout(() => btn?.classList.remove('cooldown'), config.cooldown);
  }
}

function applyEffect(pet, effect) {
  ['hunger', 'mood', 'energy', 'health'].forEach((key) => {
    if (effect[key]) pet[key] = clamp(pet[key] + effect[key], 0, 100);
  });
}

function getActionLog(action) {
  const names = { feed: '喂食', play: '玩耍', rest: '休息', train: '训练', explore: '探索' };
  return `${names[action] || action}了一次`;
}

function onPetTap() {
  if (!state.pet) return;
  playAnim('happy');
  const msg = MOOD_MESSAGES[Math.floor(Math.random() * MOOD_MESSAGES.length)];
  showMoodBubble(msg);
  state.pet.mood = clamp(state.pet.mood + 2, 0, 100);
  saveGame();
  renderStats();
}

// ===== 经验 & 升级 =====
function addExp(amount) {
  if (!state.pet || amount <= 0) return;

  const pet = state.pet;
  pet.exp += amount;
  const needed = expToLevel(pet.level);

  while (pet.exp >= needed && pet.level < 20) {
    pet.exp -= needed;
    pet.level++;
    addLog(`🎊 升级了！当前等级 Lv.${pet.level}`);
    showToast(`升级！Lv.${pet.level}`);
    spawnParticles('⭐');
  }

  saveGame();
}

function expToLevel(level) {
  return Math.floor(50 + level * 30);
}

function getEvolveStage(level) {
  if (level >= EVOLVE_LEVELS[2]) return 2;
  if (level >= EVOLVE_LEVELS[1]) return 1;
  return 0;
}

// ===== 探索小游戏 =====
function startExplore() {
  applyEffect(state.pet, { energy: -25, mood: 10 });
  exploreScore = 0;
  showScreen('screen-explore');
  $('#explore-score').textContent = '0';
  $('#explore-field').innerHTML = '';

  let timeLeft = 30;
  $('#explore-timer').textContent = timeLeft;

  spawnExploreStar();
  const starInterval = setInterval(spawnExploreStar, 800);

  exploreTimer = setInterval(() => {
    timeLeft--;
    $('#explore-timer').textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(exploreTimer);
      clearInterval(starInterval);
      finishExplore();
    }
  }, 1000);
}

function spawnExploreStar() {
  const field = $('#explore-field');
  if (!field) return;

  const star = document.createElement('div');
  star.className = 'explore-star';
  star.textContent = ['⭐', '✨', '💫', '🌟'][Math.floor(Math.random() * 4)];
  star.style.left = `${Math.random() * 80 + 5}%`;
  star.style.top = `${Math.random() * 80 + 5}%`;

  star.addEventListener('click', () => {
    exploreScore += Math.floor(Math.random() * 3) + 1;
    $('#explore-score').textContent = exploreScore;
    star.remove();
  });

  field.appendChild(star);

  setTimeout(() => star.remove(), 2000);
}

function endExplore() {
  if (exploreTimer) clearInterval(exploreTimer);
  finishExplore();
}

function finishExplore() {
  const earned = exploreScore * 2;
  state.coins += earned;
  addExp(exploreScore * 3);
  addLog(`🚀 探索完成！获得 ${earned} 星尘，${exploreScore * 3} 经验`);
  showToast(`探索结束！+${earned} 星尘`);
  saveGame();
  showScreen('screen-game');
  renderGame();
}

// ===== 商店 =====
function renderShop() {
  const list = $('#shop-list');
  list.innerHTML = '';

  SHOP_ITEMS.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'shop-item';
    div.innerHTML = `
      <span class="item-icon">${item.icon}</span>
      <div class="item-info">
        <div class="item-name">${item.name}</div>
        <div class="item-desc">${item.desc}</div>
      </div>
      <button class="buy-btn" ${state.coins < item.price ? 'disabled' : ''}>⭐ ${item.price}</button>
    `;
    div.querySelector('.buy-btn').addEventListener('click', () => buyItem(item));
    list.appendChild(div);
  });
}

function buyItem(item) {
  if (state.coins < item.price) {
    showToast('星尘不足！');
    return;
  }

  state.coins -= item.price;
  applyEffect(state.pet, item.effect);
  addLog(`🛒 购买了 ${item.name}`);
  showToast(`使用了 ${item.name}！`);
  playAnim('happy');
  saveGame();
  renderGame();
  renderShop();
}

// ===== 进化 =====
function renderEvolve() {
  const container = $('#evolve-content');
  const pet = state.pet;
  const species = PET_SPECIES[pet.speciesId];
  const currentStage = getEvolveStage(pet.level);

  let html = `<p>当前: ${species.name} · ${STAGE_NAMES[currentStage]}</p>`;
  html += '<div class="evolve-stages">';

  species.emoji.forEach((emoji, i) => {
    const isCurrent = i === currentStage;
    const isLocked = i > currentStage;
    html += `
      <div class="evolve-stage ${isCurrent ? 'current' : ''} ${isLocked ? 'locked' : ''}">
        <span class="stage-emoji">${emoji}</span>
        <span class="stage-label">${STAGE_NAMES[i]}</span>
        <span class="stage-label">Lv.${EVOLVE_LEVELS[i]}</span>
      </div>
    `;
    if (i < species.emoji.length - 1) html += '<span class="evolve-arrow">→</span>';
  });

  html += '</div>';

  const nextStage = currentStage + 1;
  if (nextStage < 3) {
    const canEvolve = pet.level >= EVOLVE_LEVELS[nextStage];
    html += `
      <button class="evolve-btn" ${canEvolve ? '' : 'disabled'} id="evolve-btn">
        ${canEvolve ? '✨ 进化！' : `需要 Lv.${EVOLVE_LEVELS[nextStage]}`}
      </button>
      <p class="evolve-info">进化后外观将发生变化</p>
    `;
  } else {
    html += '<p class="evolve-info">🎉 已达到最终形态！</p>';
  }

  container.innerHTML = html;

  $('#evolve-btn')?.addEventListener('click', () => {
    if (currentStage < 2 && pet.level >= EVOLVE_LEVELS[currentStage + 1]) {
      pet.stage = currentStage + 1;
      addLog(`✨ ${species.name} 进化成了 ${STAGE_NAMES[pet.stage]}！`);
      showToast('进化成功！');
      spawnParticles('✨');
      playAnim('happy');
      saveGame();
      renderGame();
      renderEvolve();
    }
  });
}

// ===== 日志 =====
function renderLogs() {
  const list = $('#log-list');
  list.innerHTML = state.logs.length
    ? state.logs.slice(0, 50).map((entry) => `
        <div class="log-entry">
          <div class="log-time">${entry.time}</div>
          <div>${entry.text}</div>
        </div>
      `).join('')
    : '<p style="text-align:center;color:var(--text-muted);padding:20px;">暂无记录</p>';
}

function addLog(text) {
  const now = new Date();
  const time = `${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  state.logs.unshift({ time, text });
  if (state.logs.length > 100) state.logs.length = 100;
}

// ===== 渲染 =====
function renderGame() {
  if (!state.pet) return;

  const pet = state.pet;
  const species = PET_SPECIES[pet.speciesId];
  const stage = getEvolveStage(pet.level);

  $('#display-name').textContent = pet.name;
  $('#display-level').textContent = pet.level;
  $('#display-coins').textContent = state.coins;
  $('#pet-sprite').textContent = species.emoji[stage];

  renderStats();
}

function renderStats() {
  if (!state.pet) return;
  const pet = state.pet;

  ['hunger', 'mood', 'energy', 'health'].forEach((stat) => {
    const val = Math.round(pet[stat]);
    $(`#bar-${stat}`).style.width = `${val}%`;
    $(`#val-${stat}`).textContent = val;
  });

  const expNeeded = expToLevel(pet.level);
  const expPercent = pet.level >= 20 ? 100 : (pet.exp / expNeeded) * 100;
  $('#bar-exp').style.width = `${expPercent}%`;
}

// ===== 动画 & 特效 =====
function playAnim(className) {
  const sprite = $('#pet-sprite');
  if (!sprite) return;
  sprite.classList.remove('happy', 'eating', 'sleeping', 'training');
  void sprite.offsetWidth;
  sprite.classList.add(className);
  setTimeout(() => sprite.classList.remove(className), 2000);
}

function showMoodBubble(text) {
  const bubble = $('#mood-bubble');
  if (!bubble) return;
  bubble.textContent = text;
  bubble.classList.remove('hidden');
  setTimeout(() => bubble.classList.add('hidden'), 2000);
}

function spawnParticles(emoji) {
  const container = $('#particles');
  if (!container) return;

  for (let i = 0; i < 6; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.textContent = emoji;
    p.style.left = '50%';
    p.style.top = '50%';
    p.style.setProperty('--dx', `${(Math.random() - 0.5) * 120}px`);
    p.style.setProperty('--dy', `${-Math.random() * 100 - 30}px`);
    container.appendChild(p);
    setTimeout(() => p.remove(), 1000);
  }
}

// ===== UI 工具 =====
function showScreen(id) {
  $$('.screen').forEach((s) => s.classList.remove('active'));
  $(`#${id}`)?.classList.add('active');
}

function openPanel(tab) {
  $$('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));

  if (tab === 'home') {
    closeAllPanels();
    return;
  }

  closeAllPanels();
  const panel = $(`#panel-${tab}`);
  panel?.classList.remove('hidden');

  if (tab === 'shop') renderShop();
  if (tab === 'evolve') renderEvolve();
  if (tab === 'log') renderLogs();
}

function closePanel(tab) {
  $(`#panel-${tab}`)?.classList.add('hidden');
  $$('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === 'home'));
}

function closeAllPanels() {
  $$('.overlay-panel').forEach((p) => p.classList.add('hidden'));
}

let toastTimer = null;
function showToast(msg) {
  const toast = $('#toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 2500);
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// ===== 存档 =====
function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Save failed:', e);
  }
}

function loadGame() {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      state = { ...state, ...data };
      // 离线衰减
      if (state.pet && state.lastTick) {
        const elapsed = Date.now() - state.lastTick;
        const ticks = Math.floor(elapsed / 10000);
        for (let i = 0; i < Math.min(ticks, 60); i++) {
          state.pet.hunger = clamp(state.pet.hunger - 2, 0, 100);
          state.pet.mood = clamp(state.pet.mood - 1.5, 0, 100);
          state.pet.energy = clamp(state.pet.energy - 1, 0, 100);
        }
        state.lastTick = Date.now();
      }
    }
  } catch (e) {
    console.warn('Load failed:', e);
  }
}

// ===== 启动 =====
document.addEventListener('DOMContentLoaded', init);
