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

  // Do nothing if same index
  if (newIndex === oldIndex) return;

  // Determine direction: forward or backward
  const forward = (newIndex > oldIndex) || (oldIndex === posts.length - 1 && newIndex === 0);

  // Apply exit class to old post
  allPosts[oldIndex].classList.remove('active'); // remove only active
  allPosts[oldIndex].classList.add(forward ? 'exit-up' : 'exit-down');

  // Activate new post
  allPosts[newIndex].classList.remove('exit-up', 'exit-down');
  allPosts[newIndex].classList.add('active');

  // Update currentIndex
  currentIndex = newIndex;
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
