document.addEventListener("DOMContentLoaded", () => {
  // Beri jeda animasi masuk secara berurutan tiap kartu
  const cards = document.querySelectorAll(".card");
  cards.forEach((card, i) => {
    card.style.animationDelay = `${i * 0.12}s`;
  });

  // Tampilkan tanggal terakhir halaman dibuka di footer
  const footer = document.getElementById("footer-text");
  if (footer) {
    const today = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    footer.textContent = `Halaman ini dibuat sebagai profil sederhana wali kelas. Terakhir dibuka: ${today}.`;
  }
});