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
