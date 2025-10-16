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

function showPost(index) {
  const allPosts = document.querySelectorAll('.post');
  allPosts.forEach((post, i) => {
    post.classList.remove('active', 'exit-up', 'exit-down');
    if (i < index) post.classList.add('exit-up');
    if (i > index) post.classList.add('exit-down');
  });
  allPosts[index].classList.add('active');
}

function nextPost() {
  currentIndex = (currentIndex + 1) % posts.length;
  showPost(currentIndex);
}

function prevPost() {
  currentIndex = (currentIndex - 1 + posts.length) % posts.length;
  showPost(currentIndex);
}

function initNavigation() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') nextPost();
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') prevPost();
  });

  let startY = 0;
  document.addEventListener('touchstart', (e) => startY = e.touches[0].clientY);
  document.addEventListener('touchend', (e) => {
    const endY = e.changedTouches[0].clientY;
    if (startY - endY > 50) nextPost();
    if (endY - startY > 50) prevPost();
  });

  let lastWheelTime = 0;

  document.addEventListener('wheel', (e) => {
    e.preventDefault();
    const now = Date.now();

    if (now - lastWheelTime < 1200) return; // only allow one slide every 600ms
    lastWheelTime = now;

    if (e.deltaY > 0) nextPost();
    if (e.deltaY < 0) prevPost();
  }, { passive: false });
}

document.getElementById('enter').addEventListener('click', () => {
  document.getElementById('splash').classList.add('fade');
  initApp();
});
