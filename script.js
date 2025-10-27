const feed = document.getElementById('feed');
let posts = [];
let currentIndex = 0;

function initApp() {
  fetch('feedData.json')
    .then(res => res.json())
    .then(data => {
      posts = data;
      renderPosts(posts);
      initNavigation();
    });
}

function renderPosts(posts) {
  feed.innerHTML = '';

  posts.forEach(post => {
    const postEl = document.createElement('div');
    postEl.classList.add('post', 'active');

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

      // ensure autoplay compliance
      videoEl.muted = true;
      videoEl.playsInline = true;

      videoEl.addEventListener('canplay', () => {
        const attemptPlay = videoEl.play();
        if (attemptPlay !== undefined) {
          attemptPlay.catch(() => {
            // fallback: wait for first user gesture to start video
            const startPlayback = () => {
              videoEl.play();
              document.removeEventListener('touchstart', startPlayback);
              document.removeEventListener('click', startPlayback);
            };
            document.addEventListener('touchstart', startPlayback, { once: true });
            document.addEventListener('click', startPlayback, { once: true });
          });
        }
      });
    }
  });
}


function showPost(newIndex) {
  const allPosts = document.querySelectorAll('.post');
  const oldIndex = currentIndex;

  if (newIndex === oldIndex) return;

  // Determine direction for smooth infinite scroll feel
  let forward;
  if (oldIndex === posts.length - 1 && newIndex === 0) {
    // loop end -> start: new post should come from bottom
    forward = true;
  } else if (oldIndex === 0 && newIndex === posts.length - 1) {
    // loop start -> end: new post should come from top
    forward = false;
  } else {
    forward = newIndex > oldIndex;
  }

  const oldPostEl = allPosts[oldIndex];
  const newPostEl = allPosts[newIndex];

  // Animate old post out
  oldPostEl.classList.remove('active');
  oldPostEl.classList.add(forward ? 'exit-up' : 'exit-down');

  // Prepare new post offscreen
  newPostEl.classList.remove('exit-up', 'exit-down', 'active', 'forward-start', 'backward-start');
  newPostEl.classList.add(forward ? 'forward-start' : 'backward-start');

  // Force reflow
  void newPostEl.offsetHeight;

  // Animate new post in
  newPostEl.classList.add('active');
  newPostEl.classList.remove(forward ? 'forward-start' : 'backward-start');

  // Update currentIndex
  currentIndex = newIndex;

  // Optional: remove exit-* class from old post after transition
  oldPostEl.addEventListener('transitionend', () => {
    oldPostEl.classList.remove('exit-up', 'exit-down');
  }, { once: true });
}

function nextPost() {
  const newIndex = (currentIndex + 1) % posts.length;
  showPost(newIndex);
}

function prevPost() {
  const newIndex = (currentIndex - 1 + posts.length) % posts.length;
  showPost(newIndex);
}

function initNavigation() {
  let startY = 0;
  document.addEventListener('touchstart', (e) => startY = e.touches[0].clientY);
  document.addEventListener('touchend', (e) => {
    const endY = e.changedTouches[0].clientY;
    if (startY - endY > 50) nextPost();
    if (endY - startY > 50) prevPost();
  });

  // Keyboard
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') nextPost();
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') prevPost();
  });

  // Wheel
  let lastWheelTime = 0;
  const WHEEL_THRESHOLD = 50;

  window.addEventListener('wheel', (e) => {
    e.preventDefault();
    const now = Date.now();
    if (now - lastWheelTime < 600) return;
    if (Math.abs(e.deltaY) < WHEEL_THRESHOLD) return;

    lastWheelTime = now;
    if (e.deltaY > 0) nextPost();
    if (e.deltaY < 0) prevPost();
  }, { passive: false });
}

// --- EVENT LISTENERS --- //

document.getElementById('enter').addEventListener('click', function () {
  const splash = document.getElementById('splash');
  const snakeScales = document.querySelector('.snake-scales-container');

  splash.style.display = 'none';
  feed.style.display = 'block';
  if (snakeScales) snakeScales.style.display = 'none'; // hide scales
  initApp();
});

document.getElementById('opencall').addEventListener('click', function () {
  const splash = document.getElementById('splash');
  const opencallPage = document.getElementById('opencall-page');
  const snakeScales = document.querySelector('.snake-scales-container');

  splash.style.display = 'none';
  if (snakeScales) snakeScales.style.display = 'block'; // restore scales
  opencallPage.classList.remove('hidden');
});

document.getElementById('back-from-opencall').addEventListener('click', function () {
  const splash = document.getElementById('splash');
  const opencallPage = document.getElementById('opencall-page');
  const snakeScales = document.querySelector('.snake-scales-container');

  opencallPage.classList.add('hidden');
  splash.style.display = 'block';
  if (snakeScales) snakeScales.style.display = 'block'; // restore scales
});



// Neon Cursor Animation

function initSnakeScales() {
  console.log('🐍 初始化蛇鳞效果');


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