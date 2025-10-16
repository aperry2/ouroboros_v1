const feed = document.getElementById('feed');
let posts = [];
let index = 0;
let lastIndex = 0;


fetch('data.json')
  .then(res => res.json())
  .then(data => {
    posts = data.map(createPost);
    posts.forEach(p => feed.appendChild(p));
    showPost(0);
  });

  

function createPost(entry) {
  const post = document.createElement('div');
  post.className = 'post';

  // Media element
  let media;
  if (entry.src.endsWith('.mp4')) {
    media = document.createElement('video');
    media.src = entry.src;
    media.loop = true;
    media.muted = true;
    media.playsInline = true;
  } else {
    media = document.createElement('img');
    media.src = entry.src;
  }
  post.appendChild(media);

  // Overlay element
  const overlay = document.createElement('div');
  overlay.className = 'overlay';

  const title = document.createElement('h2');
  title.textContent = entry.title;

  const artist = document.createElement('h3');
  artist.textContent = entry.artist;

  const desc = document.createElement('p');
  desc.textContent = entry.description;

  overlay.appendChild(title);
  overlay.appendChild(artist);
  overlay.appendChild(desc);
  post.appendChild(overlay);

  return post;
}

function showPost(i, direction = 1) {
  const postsArr = document.querySelectorAll('.post');
  const prev = postsArr[lastIndex];
  const next = postsArr[i];

  // Reset transitions
  postsArr.forEach(p => p.classList.remove('active', 'exit-up', 'exit-down'));

  // Animate outgoing post
  if (prev) prev.classList.add(direction > 0 ? 'exit-up' : 'exit-down');

  // Animate incoming post
  if (next) {
    next.classList.add('active');
    const video = next.querySelector('video');
    if (video) video.play();
  }

  // Pause all other videos
  postsArr.forEach((p, j) => {
    const vid = p.querySelector('video');
    if (vid && j !== i) vid.pause();
  });

  lastIndex = i;
}

function nextPost() {
  const newIndex = (index + 1) % posts.length;
  showPost(newIndex, 1);
  index = newIndex;
}

function prevPost() {
  const newIndex = (index - 1 + posts.length) % posts.length;
  showPost(newIndex, -1);
  index = newIndex;
}


// Scroll and swipe navigation
let startY = 0;
let endY = 0;

window.addEventListener('wheel', e => {
  if (e.deltaY > 0) nextPost();
  else prevPost();
});

window.addEventListener('touchstart', e => startY = e.touches[0].clientY);
window.addEventListener('touchend', e => {
  endY = e.changedTouches[0].clientY;
  const delta = startY - endY;
  if (Math.abs(delta) > 50) {
    if (delta > 0) nextPost();
    else prevPost();
  }
});

