const feed = document.getElementById('feed');
const loadingState = document.getElementById('loadingState');
let posts = [];
let currentIndex = 0;
let isNavigationReady = false;

function initApp() {
  showLoadingState();

  const splash = document.getElementById('splash');
  const snakeScales = document.querySelector('.snake-scales-container');
  splash.style.display = 'none';
  if (snakeScales) snakeScales.style.display = 'none';

  fetch('feedData.json?cache=' + Date.now())
    .then(res => {
      if (!res.ok) throw new Error('Network response was not ok');
      return res.text();
    })
    .then(text => {
      if (text.trim().startsWith('<')) throw new Error('Received HTML instead of JSON');
      return JSON.parse(text);
    })
    .then(data => {
      posts = data;
      preloadAllVideos(posts);
    })
    .catch(err => {
      console.error('Error loading feedData.json:', err);
      showErrorState();
    });
}

// 修复的提示框函数
function showTipsPopup() {
  console.log('💡 显示操作提示框');

  // 创建提示框并立即应用样式
  const popup = document.createElement('div');
  popup.className = 'tips-popup';
  popup.innerHTML = 'scroll or use arrow keys to roam around';
  
  // 立即添加到DOM
  document.body.appendChild(popup);

  // 强制重绘以确保样式应用
  void popup.offsetWidth;

  // 2秒后开始淡出
  setTimeout(() => {
    popup.classList.add('fade-out');
  }, 2000);

  // 4秒后移除元素
  setTimeout(() => {
    if (popup.parentNode) {
      popup.remove();
    }
  }, 4000);
}

function showLoadingState() {
  const loading = document.getElementById('loadingState');
  const instruction = loading.querySelector('.loading-instruction');
  feed.style.display = 'none';
  loading.classList.remove('hidden');
  loading.style.display = 'flex';
  isNavigationReady = false;

  // reset + show instruction fade
  instruction.classList.remove('fade-out');
  setTimeout(() => instruction.classList.add('fade-out'), 2500);
}

function hideLoadingState() {
  const loading = document.getElementById('loadingState');
  loading.classList.add('hidden');
  setTimeout(() => {
    loading.style.display = 'none';
    feed.style.display = 'block';
    feed.classList.add('visible');
  }, 800);
  isNavigationReady = true;
}

function showErrorState() {
  loadingState.innerHTML = `
    <div class="loading-spinner">Error loading content</div>
    <div class="loading-tips">Please refresh the page or try again later</div>
  `;
}

function preloadAllVideos(posts) {
  const videoPosts = posts.filter(p => p.src.endsWith('.mp4'));
  let loadedCount = 0;

  if (videoPosts.length === 0) {
    hideLoadingState();
    renderPosts(posts);
    initNavigation();
    // 提示框现在在 renderPosts 完成后显示
    return;
  }

  videoPosts.forEach(post => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.src = post.src;

    video.addEventListener('canplaythrough', () => {
      loadedCount++;
      if (loadedCount === videoPosts.length) {
        hideLoadingState();
        renderPosts(posts);
        initNavigation();
        // 提示框现在在 renderPosts 完成后显示
      }
    });

    video.addEventListener('error', () => {
      console.warn(`Failed to preload ${post.src}`);
      loadedCount++;
      if (loadedCount === videoPosts.length) {
        hideLoadingState();
        renderPosts(posts);
        initNavigation();
        // 提示框现在在 renderPosts 完成后显示
      }
    });

    video.load();
  });
}

function renderPosts(posts) {
  feed.innerHTML = '';

  posts.forEach((post, index) => {
    const postEl = document.createElement('div');
    postEl.classList.add('post');

    if (index !== 0) {
      postEl.style.opacity = '0';
      postEl.style.visibility = 'hidden';
    } else {
      postEl.classList.add('active');
    }

    const isVideo = post.src.endsWith('.mp4');
    const mediaTag = isVideo
      ? `<video class="post-video" playsinline muted loop preload="auto">
           <source src="${post.src}" type="video/mp4">
         </video>`
      : `<img src="${post.src}" alt="${post.title}">`;

    postEl.innerHTML = `
      ${mediaTag}
      <div class="overlay">
        <h2>${post.title}</h2>
        <h3>${post.artist}</h3>
        <p>${post.description}</p>
      </div>
    `;

    feed.appendChild(postEl);

    if (isVideo) {
      const videoEl = postEl.querySelector('video');
      videoEl.muted = true;
      videoEl.playsInline = true;
      videoEl.loop = true;
      videoEl.preload = 'metadata';

      const source = videoEl.querySelector('source');
      if (source) {
        videoEl.src = source.src;
        videoEl.load();
      }

      if (index === 0) {
        videoEl.play().catch(() => { });
      }
    }
  });

  // 确保所有帖子渲染完成后再显示提示
  setTimeout(() => {
    showTipsPopup();
  }, 100);
}

function preloadAdjacentMedia(currentIndex) {
  const nextIndex = (currentIndex + 1) % posts.length;
  const prevIndex = (currentIndex - 1 + posts.length) % posts.length;

  [nextIndex, prevIndex].forEach(index => {
    const post = posts[index];
    if (post && !post.preloaded) {
      if (post.src.endsWith('.mp4')) {
        const video = document.createElement('video');
        video.preload = 'auto';
        video.src = post.src;
        video.load();
      } else {
        const img = new Image();
        img.src = post.src;
      }
      post.preloaded = true;
    }
  });
}

function showPost(newIndex) {
  if (!isNavigationReady) return;

  const allPosts = document.querySelectorAll('.post');
  const oldIndex = currentIndex;
  if (newIndex === oldIndex) return;

  preloadAdjacentMedia(newIndex);

  const oldPostEl = allPosts[oldIndex];
  const newPostEl = allPosts[newIndex];
  const oldVideo = oldPostEl.querySelector('video');
  const newVideo = newPostEl.querySelector('video');

  if (oldVideo) oldVideo.pause();

  newPostEl.style.opacity = '1';
  newPostEl.style.visibility = 'visible';

  let forward;
  if (oldIndex === posts.length - 1 && newIndex === 0) forward = true;
  else if (oldIndex === 0 && newIndex === posts.length - 1) forward = false;
  else forward = newIndex > oldIndex;

  oldPostEl.classList.remove('active');
  oldPostEl.classList.add(forward ? 'exit-up' : 'exit-down');

  newPostEl.classList.remove('exit-up', 'exit-down', 'active', 'forward-start', 'backward-start');
  newPostEl.classList.add(forward ? 'forward-start' : 'backward-start');
  void newPostEl.offsetHeight;
  newPostEl.classList.add('active');
  newPostEl.classList.remove(forward ? 'forward-start' : 'backward-start');

  if (newVideo) {
    newVideo.play().catch((err) => console.warn('Autoplay blocked:', err));
  }

  currentIndex = newIndex;

  oldPostEl.addEventListener('transitionend', () => {
    oldPostEl.classList.remove('exit-up', 'exit-down');
    if (oldIndex !== newIndex) {
      oldPostEl.style.opacity = '0';
      oldPostEl.style.visibility = 'hidden';
    }
  }, { once: true });
}

function nextPost() {
  if (!isNavigationReady) return;
  const newIndex = (currentIndex + 1) % posts.length;
  showPost(newIndex);
}

function prevPost() {
  if (!isNavigationReady) return;
  const newIndex = (currentIndex - 1 + posts.length) % posts.length;
  showPost(newIndex);
}

function initNavigation() {
  let startY = 0;

  document.addEventListener('touchstart', (e) => {
    if (!isNavigationReady) return;
    startY = e.touches[0].clientY;
  });

  document.addEventListener('touchend', (e) => {
    if (!isNavigationReady) return;
    const endY = e.changedTouches[0].clientY;
    if (startY - endY > 50) nextPost();
    if (endY - startY > 50) prevPost();
  });

  window.addEventListener('keydown', (e) => {
    if (!isNavigationReady) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') nextPost();
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') prevPost();
  });

  let lastWheelTime = 0;
  const WHEEL_THRESHOLD = 50;

  window.addEventListener('wheel', (e) => {
    if (!isNavigationReady) return;

    e.preventDefault();
    const now = Date.now();
    if (now - lastWheelTime < 600) return;
    if (Math.abs(e.deltaY) < WHEEL_THRESHOLD) return;

    lastWheelTime = now;
    if (e.deltaY > 0) nextPost();
    if (e.deltaY < 0) prevPost();
  }, { passive: false });
}

// 事件监听器
document.getElementById('enter').addEventListener('click', function () {
  initApp();
});

document.getElementById('opencall').addEventListener('click', function () {
  const splash = document.getElementById('splash');
  const opencallPage = document.getElementById('opencall-page');
  const snakeScales = document.querySelector('.snake-scales-container');

  splash.style.display = 'none';
  if (snakeScales) snakeScales.style.display = 'block';
  opencallPage.classList.remove('hidden');
});

document.getElementById('back-from-opencall').addEventListener('click', function () {
  const splash = document.getElementById('splash');
  const opencallPage = document.getElementById('opencall-page');
  const snakeScales = document.querySelector('.snake-scales-container');

  opencallPage.classList.add('hidden');
  splash.style.display = 'block';
  if (snakeScales) snakeScales.style.display = 'block';
});

// 蛇鳞效果
function initSnakeScales() {
  const old = document.querySelector('.snake-scales-container');
  if (old) old.remove();

  const container = document.createElement('div');
  container.className = 'snake-scales-container';
  document.body.appendChild(container);

  document.addEventListener('mousemove', (e) => {
    if (Math.random() > 0.5) return;
    createScale(e.clientX, e.clientY);
  });

  function createScale(x, y) {
    const scale = document.createElement('div');
    scale.className = 'snake-scale';
    const size = 30 + Math.random() * 20;
    scale.style.cssText = `
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      transform: translate(-50%, -50%) rotate(${Math.random() * 360}deg);
    `;
    container.appendChild(scale);

    const glow = document.createElement('div');
    glow.className = 'scale-glow';
    const glowSize = size * 2;
    glow.style.cssText = `
      left: ${x}px;
      top: ${y}px;
      width: ${glowSize}px;
      height: ${glowSize}px;
      transform: translate(-50%, -50%);
    `;
    container.appendChild(glow);

    setTimeout(() => {
      scale.remove();
      glow.remove();
    }, 3000);
  }
}

setTimeout(initSnakeScales, 500);