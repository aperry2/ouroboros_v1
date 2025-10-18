const feed = document.getElementById('feed');
let posts = [];
let currentIndex = 0;

function initApp() {
  fetch('data.json')
    .then(res => res.json())
    .then(data => {
      posts = data;
      renderPosts(posts);
      initNavigation();
    });
}

function renderPosts(posts) {
  posts.forEach((post) => {
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

  // First post visible
  const firstPost = document.querySelector('.post');
  if (firstPost) firstPost.classList.add('active');
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
  newPostEl.classList.remove('exit-up','exit-down','active','forward-start','backward-start');
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
    oldPostEl.classList.remove('exit-up','exit-down');
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

document.getElementById('enter').addEventListener('click', () => {
  document.getElementById('splash').classList.add('fade');
  initApp();
});
