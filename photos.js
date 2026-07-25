// Cloudinary Configuration
const CLOUDINARY = {
  // TODO: Add your Cloudinary cloud_name here (e.g., 'your-cloud-name')
  cloudName: 'demo',
  // The tag applied to your wedding photos in Cloudinary to fetch them automatically
  tag: 'wedding-album',
  batchSize: 16
};

// Initial static fallback array (not used if dynamic fetch succeeds, but good for reference/fallback)
const PHOTOS_FALLBACK = [
  'ring.jpg',
  'dress.jpg',
  'cake.jpg',
  'couple-walking.jpg',
  'table.jpg',
  'couple-nature.jpg',
  'kiss.jpg',
  'holding-hands.jpg'
];

// --- Lightbox Controller ---
(function initLightbox() {
  // Inject lightbox HTML and CSS dynamically
  const style = document.createElement('style');
  style.innerHTML = `
    .photo-lightbox-overlay {
      position: fixed;
      inset: 0;
      background: rgba(26,24,20,0.95);
      z-index: 10000;
      display: none;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .photo-lightbox-overlay.active {
      display: flex;
      opacity: 1;
    }
    .photo-lightbox-content {
      position: relative;
      max-width: 90vw;
      max-height: 90vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .photo-lightbox-img {
      max-width: 100%;
      max-height: 90vh;
      object-fit: contain;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
      border-radius: 4px;
    }
    .photo-lightbox-close, .photo-lightbox-prev, .photo-lightbox-next {
      position: absolute;
      background: none;
      border: none;
      color: rgba(255,255,255,0.7);
      font-size: 32px;
      cursor: pointer;
      transition: color 0.2s;
      padding: 16px;
      z-index: 10001;
    }
    .photo-lightbox-close:hover, .photo-lightbox-prev:hover, .photo-lightbox-next:hover {
      color: #fff;
    }
    .photo-lightbox-close { top: 16px; right: 24px; font-size: 40px; line-height: 1; }
    .photo-lightbox-prev { left: 24px; top: 50%; transform: translateY(-50%); }
    .photo-lightbox-next { right: 24px; top: 50%; transform: translateY(-50%); }

    @media (max-width: 600px) {
      .photo-lightbox-prev, .photo-lightbox-next { padding: 8px; font-size: 24px; }
      .photo-lightbox-prev { left: 8px; }
      .photo-lightbox-next { right: 8px; }
      .photo-lightbox-close { top: 8px; right: 8px; font-size: 32px; }
    }
  `;
  document.head.appendChild(style);

  const lightboxHtml = `
    <div id="photoLightbox" class="photo-lightbox-overlay">
      <button class="photo-lightbox-close" id="photoLightboxClose">&times;</button>
      <button class="photo-lightbox-prev" id="photoLightboxPrev">&#10094;</button>
      <button class="photo-lightbox-next" id="photoLightboxNext">&#10095;</button>
      <div class="photo-lightbox-content">
        <img id="photoLightboxImg" class="photo-lightbox-img" src="" alt="Full screen image">
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', lightboxHtml);

  const overlay = document.getElementById('photoLightbox');
  const imgEl = document.getElementById('photoLightboxImg');
  const closeBtn = document.getElementById('photoLightboxClose');
  const prevBtn = document.getElementById('photoLightboxPrev');
  const nextBtn = document.getElementById('photoLightboxNext');

  let currentImages = [];
  let currentIndex = 0;

  function openLightbox(src) {
    // Collect all current cloudinary images in the DOM for navigation
    const allImgs = Array.from(document.querySelectorAll('img')).filter(img => img.src && img.src.includes('cloudinary.com'));
    currentImages = allImgs.map(img => img.src);
    currentIndex = currentImages.indexOf(src);

    if (currentIndex === -1) {
      currentImages = [src];
      currentIndex = 0;
    }

    updateImage(currentImages[currentIndex]);
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // prevent background scrolling
  }

  function closeLightbox() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  let currentHighResLoad = null;

  function updateImage(src) {
    // Instant Swap: Show the grid resolution image immediately
    imgEl.src = src;

    // Upgrade resolution for full-screen view
    const highResSrc = src.replace('w_1000', 'w_1800');

    // Create a new image to preload the high-res version
    const highResImg = new Image();
    currentHighResLoad = highResImg; // track current load to prevent race conditions

    highResImg.onload = () => {
      // Only swap if the user hasn't navigated to another image while loading
      if (currentHighResLoad === highResImg) {
        imgEl.src = highResSrc;
      }
    };
    highResImg.src = highResSrc;

    // Adjacent Preloading
    if (currentImages.length > 1) {
      const nextIdx = (currentIndex + 1) % currentImages.length;
      const prevIdx = (currentIndex - 1 + currentImages.length) % currentImages.length;

      const nextHighResSrc = currentImages[nextIdx].replace('w_1000', 'w_1800');
      const prevHighResSrc = currentImages[prevIdx].replace('w_1000', 'w_1800');

      // Fire and forget background preloads
      new Image().src = nextHighResSrc;
      new Image().src = prevHighResSrc;
    }
  }

  function nextImage(e) {
    if (e) e.stopPropagation();
    if (currentImages.length <= 1) return;
    currentIndex = (currentIndex + 1) % currentImages.length;
    updateImage(currentImages[currentIndex]);
  }

  function prevImage(e) {
    if (e) e.stopPropagation();
    if (currentImages.length <= 1) return;
    currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
    updateImage(currentImages[currentIndex]);
  }

  // Event Delegation for clicking images
  document.addEventListener('click', function(e) {
    const target = e.target;
    // We only open the lightbox if the click was directly on an image from cloudinary
    if (target.tagName === 'IMG' && target.src && target.src.includes('cloudinary.com') && target.closest('.photo-item')) {
      e.preventDefault();
      // On mobile tap-to-expand, we only want to open lightbox if it's already expanded,
      // or we can let it open directly. Let's let it open directly as requested.
      openLightbox(target.src);
    }
  });

  // Preload on Hover Event Delegation
  document.addEventListener('mouseover', function(e) {
    const target = e.target;
    if (target.tagName === 'IMG' && target.src && target.src.includes('cloudinary.com') && target.closest('.photo-item')) {
      const highResSrc = target.src.replace('w_1000', 'w_1800');
      // Set the src of a new Image object to trigger the browser to fetch and cache it
      new Image().src = highResSrc;
    }
  });

  // Lightbox controls
  closeBtn.addEventListener('click', closeLightbox);
  prevBtn.addEventListener('click', prevImage);
  nextBtn.addEventListener('click', nextImage);

  // Close on background click
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay || e.target.classList.contains('photo-lightbox-content')) {
      closeLightbox();
    }
  });

  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (!overlay.classList.contains('active')) return;

    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowRight') nextImage();
    else if (e.key === 'ArrowLeft') prevImage();
  });
})();
