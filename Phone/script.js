// =========================================================
// SCROLL REVEAL
// Memakai IntersectionObserver: browser yang memberi tahu kita
// kapan sebuah elemen (kartu murid / kartu momen) mulai terlihat
// di layar. Begitu terlihat, kita tambahkan class "is-visible"
// yang men-trigger transisi fade + naik di style.css.
// Ini satu-satunya efek animasi di halaman ini, dipakai konsisten
// untuk semua kartu supaya tidak berlebihan.
// =========================================================
// observer dibuat sekali di scope global supaya bisa dipakai ulang,
// termasuk oleh foto galeri momen yang baru muncul belakangan (lazy load)
const supportsObserver = "IntersectionObserver" in window;

const revealObserver = supportsObserver
  ? new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            // setelah muncul sekali, tidak perlu diawasi lagi
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 } // muncul saat 15% bagian elemen sudah kelihatan
    )
  : null;

function initScrollReveal() {
  const revealTargets = document.querySelectorAll(".card, .moment");

  // fallback: kalau browser tidak mendukung IntersectionObserver,
  // langsung tampilkan semua kartu tanpa animasi
  if (!supportsObserver) {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  revealTargets.forEach((el) => revealObserver.observe(el));
}

// =========================================================
// GALERI MOMEN — data foto
// Total foto & jumlah per batch diatur di sini. Nanti kalau foto
// beneran sudah ada, cukup ganti fungsi buildPhotoData() ini supaya
// mengambil dari daftar foto asli (misalnya array nama file kalian
// sendiri), bagian rendering di bawahnya tidak perlu diubah.
// =========================================================
const PHOTO_COUNT = 164;      // total foto di galeri (patokan 50-70)
const BATCH_SIZE = 20;       // jumlah foto yang dimuat tiap klik "Muat foto lainnya"

// beberapa rasio ukuran foto: landscape, potrait, dan kotak,
// supaya galeri terlihat natural seperti foto hasil jepretan asli HP/kamera
const ORIENTATIONS = [
  { w: 800, h: 533 },  // landscape 3:2
  { w: 800, h: 450 },  // landscape 16:9
  { w: 533, h: 800 },  // potrait 2:3
  { w: 600, h: 800 },  // potrait 3:4
  { w: 700, h: 700 },  // kotak 1:1
];

function buildPhotoData() {
  const photos = [];
  for (let i = 1; i <= PHOTO_COUNT; i++) {
    // pilih orientasi secara berulang (bergantian), bukan acak,
    // supaya hasilnya konsisten tiap kali halaman dibuka
    const orientation = ORIENTATIONS[i % ORIENTATIONS.length];
    photos.push({
      id: i,
      w: orientation.w,
      h: orientation.h,
      src: `Foto/foto (${i}).jpg`,
      alt: `Foto momen kelas nomor ${i}`,
    });
  }
  return photos;
}

const allPhotos = buildPhotoData();
let loadedCount = 0;

// =========================================================
// GALERI MOMEN — render ke halaman
// Dipanggil sedikit demi sedikit (per BATCH_SIZE) supaya browser
// tidak perlu memuat puluhan foto sekaligus di awal.
// =========================================================
function renderNextBatch() {
  const container = document.getElementById("photoMasonry");
  const loadMoreBtn = document.getElementById("loadMoreBtn");
  if (!container) return;

  const nextBatch = allPhotos.slice(loadedCount, loadedCount + BATCH_SIZE);

  nextBatch.forEach((photo) => {
    const item = document.createElement("figure");
    item.className = "photo-masonry__item";
    item.dataset.index = photo.id - 1; // dipakai lightbox untuk tahu foto ke berapa

    const img = document.createElement("img");
    img.src = photo.src;
    img.alt = photo.alt;
    img.loading = "lazy";        // browser baru memuat foto saat mendekati layar
    img.width = photo.w;
    img.height = photo.h;        // width/height asli mencegah layout "lompat" saat foto dimuat

    item.appendChild(img);
    item.addEventListener("click", () => openLightbox(photo.id - 1));

    container.appendChild(item);

    // ikut animasi fade-in saat masuk layar (kalau browser mendukung)
    if (supportsObserver) {
      revealObserver.observe(item);
    } else {
      item.classList.add("is-visible");
    }
  });

  loadedCount += nextBatch.length;

  // sembunyikan tombol kalau semua foto sudah dimuat
  if (loadMoreBtn) {
    loadMoreBtn.hidden = loadedCount >= allPhotos.length;
  }
}

// =========================================================
// LIGHTBOX — buka foto ukuran penuh + navigasi sebelum/sesudah
// =========================================================
let currentPhotoIndex = 0;

function openLightbox(index) {
  currentPhotoIndex = index;
  updateLightboxImage();
  document.getElementById("lightbox").classList.add("is-open");
  document.body.style.overflow = "hidden"; // cegah scroll di belakang lightbox
}

function closeLightbox() {
  document.getElementById("lightbox").classList.remove("is-open");
  document.body.style.overflow = "";
}

function updateLightboxImage() {
  const photo = allPhotos[currentPhotoIndex];
  const img = document.getElementById("lightboxImg");
  img.src = photo.src;
  img.alt = photo.alt;
}

function showNextPhoto() {
  currentPhotoIndex = (currentPhotoIndex + 1) % allPhotos.length;
  updateLightboxImage();
}

function showPrevPhoto() {
  currentPhotoIndex = (currentPhotoIndex - 1 + allPhotos.length) % allPhotos.length;
  updateLightboxImage();
}

function initPhotoGallery() {
  renderNextBatch(); // muat batch pertama saat halaman dibuka

  const loadMoreBtn = document.getElementById("loadMoreBtn");
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", renderNextBatch);
  }

  document.getElementById("lightboxClose").addEventListener("click", closeLightbox);
  document.getElementById("lightboxNext").addEventListener("click", showNextPhoto);
  document.getElementById("lightboxPrev").addEventListener("click", showPrevPhoto);

  // klik area gelap di luar foto juga menutup lightbox
  document.getElementById("lightbox").addEventListener("click", (e) => {
    if (e.target.id === "lightbox") closeLightbox();
  });

  // navigasi pakai keyboard: Esc menutup, panah kiri/kanan pindah foto
  // (berguna kalau halaman dibuka di HP yang disambung keyboard fisik)
  document.addEventListener("keydown", (e) => {
    const lightbox = document.getElementById("lightbox");
    if (!lightbox.classList.contains("is-open")) return;

    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") showNextPhoto();
    if (e.key === "ArrowLeft") showPrevPhoto();
  });

  initLightboxSwipe();
}

// =========================================================
// LIGHTBOX SWIPE — interaksi utama di HP: geser jari ke kiri/kanan
// di atas foto untuk pindah ke foto berikutnya/sebelumnya.
// =========================================================
function initLightboxSwipe() {
  const lightboxImg = document.getElementById("lightboxImg");
  let touchStartX = 0;
  let touchEndX = 0;
  const SWIPE_THRESHOLD = 40; // jarak geser minimal (px) supaya dianggap swipe, bukan tap salah

  lightboxImg.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
  });

  lightboxImg.addEventListener("touchend", (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const distance = touchEndX - touchStartX;

    if (Math.abs(distance) < SWIPE_THRESHOLD) return; // dianggap tap biasa, bukan swipe

    if (distance < 0) {
      showNextPhoto(); // geser ke kiri -> foto berikutnya
    } else {
      showPrevPhoto(); // geser ke kanan -> foto sebelumnya
    }
  });
}

// =========================================================
// AUDIO PLAYER
// Mengganti teks label kecil di atas player sesuai status
// lagu (lagi diputar / berhenti), supaya terasa hidup.
// =========================================================
function initAudioPlayer() {
  const audio = document.getElementById("memoryAudio");
  const label = document.getElementById("audioLabel");

  if (!audio || !label) return;

  audio.addEventListener("play", () => {
    label.textContent = "🎵 Lagi muter lagu kenangan...";
  });

  audio.addEventListener("pause", () => {
    label.textContent = "🎵 Lagu Kenangan";
  });

  audio.addEventListener("ended", () => {
    label.textContent = "🎵 Lagu Kenangan";
  });
}

// =========================================================
// INIT — dijalankan setelah seluruh HTML siap dibaca
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
  initScrollReveal();
  initPhotoGallery();
  initAudioPlayer();
});
