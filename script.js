const feed = document.getElementById('feed');
let posts = [];
let currentIndex = 0;
let isTransitioning = false;

console.log("script loaded");

function initApp() {
  console.log("initializing app...");
  
  fetch('data.json')
    .then(res => res.json())
    .then(data => {
      posts = data;
      preloadImages(posts);
      renderPosts(posts);
      showPost(currentIndex);
      initNavigation();
    });
}

// --- Preload images to prevent flickering ---
function preloadImages(posts) {
  posts.forEach(post => {
    const img = new Image();
    img.src = post.src;
  });
}

// --- Render posts into the DOM ---
function renderPosts(posts) {
  posts.forEach((post, i) => {
    const postEl = document.createElement('div');
    postEl.classList.add('post');
    postEl.innerHTML = `
      <img src="${post.src}" alt="${post.title}">
      <div class="overlay">
        <h2>${post.title}</h2>
        <h3>${post.artist}</h3>
        <p>${post.description}</p>
      </div>
    `;
    feed.appendChild(postEl);
  });
}

// --- Show a post at a given index ---
function showPost(index) {
  if (isTransitioning) return;
  isTransitioning = true;

  const postEls = document.querySelectorAll('.post');

  // Remove active from all posts first
  postEls.forEach((postEl, i) => {
    postEl.classList.remove('active', 'exit-up', 'exit-down');
    if (i < index) postEl.classList.add('exit-up');
    if (i > index) postEl.classList.add('exit-down');
  });

  // Activate the target post
  const currentPost = postEls[index];
  currentPost.classList.add('active');

  // Debug: ensure only one active
  console.log("Active posts:", document.querySelectorAll('.post.active'));

  // Wait for transition to finish
  currentPost.addEventListener('transitionend', () => {
    isTransitioning = false;
  }, { once: true });
}

// --- Navigation (keyboard and touch) ---
function initNavigation() {
  // Arrow keys
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') nextPost();
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') prevPost();
  });

  // Touch swipe
  let touchStartY = 0;
  let touchEndY = 0;

  document.addEventListener('touchstart', (e) => {
    touchStartY = e.changedTouches[0].screenY;
  });

  document.addEventListener('touchend', (e) => {
    touchEndY = e.changedTouches[0].screenY;
    if (touchStartY - touchEndY > 50) nextPost();
    if (touchEndY - touchStartY > 50) prevPost();
  });
}

function nextPost() {
  currentIndex = (currentIndex + 1) % posts.length;
  showPost(currentIndex);
}

function prevPost() {
  currentIndex = (currentIndex - 1 + posts.length) % posts.length;
  showPost(currentIndex);
}

// --- Initialize after splash button ---
document.getElementById('enter').addEventListener('click', () => {
  document.getElementById('splash').classList.add('fade');
  initApp();
});
