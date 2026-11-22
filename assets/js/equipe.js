/* Qui sommes-nous : au toucher (ou au clic), le nom ouvre / ferme la carte.
   Au survol et au clavier, c'est le CSS qui affiche la carte. */
(function () {
  var membres = document.querySelectorAll('.team-member');
  if (!membres.length) return;

  function fermer(sauf) {
    membres.forEach(function (m) {
      if (m === sauf) return;
      m.classList.remove('is-open');
      m.querySelector('.team-toggle').setAttribute('aria-expanded', 'false');
    });
  }

  membres.forEach(function (m) {
    var bouton = m.querySelector('.team-toggle');
    // Survoler un autre nom referme la carte ouverte d'un clic, pour éviter deux cartes superposées.
    m.addEventListener('mouseenter', function () { fermer(m); });
    bouton.addEventListener('click', function () {
      var ouvert = !m.classList.contains('is-open');
      fermer(m);
      m.classList.toggle('is-open', ouvert);
      bouton.setAttribute('aria-expanded', String(ouvert));
    });
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.team-member')) fermer(null);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') fermer(null);
  });
})();
