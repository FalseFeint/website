(function () {
  'use strict';

  // --- Smooth scroll for nav links and go-to arrows ---
  document.querySelectorAll('.navbar-nav a[href^="#"], .go-to a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // --- Fixed header on scroll ---
  window.addEventListener('scroll', function () {
    document.querySelector('header').classList.toggle('fixed-header', window.scrollY >= 100);
  });

  // --- Mobile menu toggle ---
  var toggler = document.querySelector('.navbar-toggler');
  var menu = document.getElementById('navbar-collapse-toggle');
  if (toggler && menu) {
    toggler.addEventListener('click', function () {
      menu.classList.toggle('show');
    });
    document.querySelectorAll('.navbar-nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        menu.classList.remove('show');
      });
    });
  }

  // --- Typing effect ---
  (function typeEffect() {
    var el = document.getElementById('type-it');
    if (!el) return;
    var words = ['Software Developer', 'AI/ML Engineer', 'Maker', 'Adventurer'];
    var wordIdx = 0, charIdx = 0, deleting = false;
    function tick() {
      var word = words[wordIdx];
      el.textContent = word.substring(0, charIdx);
      if (!deleting) {
        charIdx++;
        if (charIdx > word.length) {
          deleting = true;
          setTimeout(tick, 1500);
          return;
        }
      } else {
        charIdx--;
        if (charIdx === 0) {
          deleting = false;
          wordIdx = (wordIdx + 1) % words.length;
        }
      }
      setTimeout(tick, deleting ? 50 : 150);
    }
    tick();
  })();

  // --- Modal system ---
  var activeModal = null;
  var backdrop = null;

  function openModal(id) {
    var modal = document.getElementById(id);
    if (!modal) return;

    // Create backdrop
    backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    document.body.appendChild(backdrop);
    document.body.classList.add('modal-open');

    modal.style.display = 'block';
    activeModal = modal;

    // Trigger reflow then add show class for transition
    void backdrop.offsetWidth;
    modal.classList.add('show');
    backdrop.classList.add('show');

    // Focus first focusable element
    var focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable.length) focusable[0].focus();

    // Close on backdrop click
    backdrop.addEventListener('click', function () {
      closeModal(modal);
    });
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('show');
    if (backdrop) {
      backdrop.classList.remove('show');
    }
    setTimeout(function () {
      modal.style.display = 'none';
      if (backdrop && backdrop.parentNode) {
        backdrop.parentNode.removeChild(backdrop);
      }
      backdrop = null;
      document.body.classList.remove('modal-open');
    }, 300);
    activeModal = null;
  }

  // Bind modal triggers (data-toggle="modal" data-target="#id")
  document.querySelectorAll('[data-toggle="modal"]').forEach(function (trigger) {
    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      var target = trigger.getAttribute('data-target');
      if (target) openModal(target.substring(1));
    });
  });

  // Bind modal close buttons (data-dismiss="modal")
  document.querySelectorAll('[data-dismiss="modal"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var modal = btn.closest('.modal');
      if (modal) closeModal(modal);
    });
  });

  // Close on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && activeModal) {
      closeModal(activeModal);
    }
  });

  // --- Testimonial avatars (auto-generate initials from h6 text) ---
  document.querySelectorAll('.testimonial-col-01 .tc-info').forEach(function (info) {
    var h6 = info.querySelector('h6');
    if (!h6) return;
    var initials = h6.textContent.trim().split(/\s+/)
      .map(function (p) { return p[0] || ''; })
      .join('').slice(0, 2).toUpperCase();
    var avatar = document.createElement('div');
    avatar.className = 'tc-avatar';
    avatar.textContent = initials;
    avatar.setAttribute('aria-hidden', 'true');
    info.insertBefore(avatar, info.firstChild);
  });

  // --- Testimonial carousel dots & autoplay ---
  (function carousel() {
    var el = document.querySelector('.testimonial-carousel');
    if (!el) return;
    var items = el.children;
    if (items.length < 2) return;

    function findClosest() {
      var left = el.scrollLeft, closest = 0, minDist = Infinity;
      for (var i = 0; i < items.length; i++) {
        var dist = Math.abs(items[i].offsetLeft - left);
        if (dist < minDist) { minDist = dist; closest = i; }
      }
      return closest;
    }

    var dotsContainer = document.createElement('div');
    dotsContainer.className = 'carousel-dots';
    var dots = [];
    var current = 0;

    for (let i = 0; i < items.length; i++) {
      var dot = document.createElement('button');
      dot.className = 'carousel-dot';
      dot.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
      dot.addEventListener('click', function () {
        el.scrollTo({ left: items[i].offsetLeft, behavior: 'smooth' });
      });
      dots.push(dot);
      dotsContainer.appendChild(dot);
    }
    el.parentNode.insertBefore(dotsContainer, el.nextSibling);

    function syncActive() {
      current = findClosest();
      dots.forEach(function (d, i) { d.classList.toggle('active', i === current); });
    }
    syncActive();
    el.addEventListener('scroll', syncActive);

    // Auto-rotate (respecting reduced motion). Pause while any testimonial is expanded.
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var timer = null;
      var start = function () {
        timer = setInterval(function () {
          if (el.querySelector('.testimonial-col-01.expanded')) return;
          var next = (current + 1) % items.length;
          el.scrollTo({ left: items[next].offsetLeft, behavior: 'smooth' });
        }, 5000);
      };
      var stop = function () { if (timer) { clearInterval(timer); timer = null; } };
      start();
      el.addEventListener('mouseenter', stop);
      el.addEventListener('mouseleave', start);
    }
  })();

  // --- Testimonial "Read more" toggle (mobile only, when text overflows the clamp) ---
  (function readMore() {
    var cards = document.querySelectorAll('.testimonial-carousel .testimonial-col-01');
    if (!cards.length) return;

    cards.forEach(function (card) {
      var p = card.querySelector(':scope > p');
      if (!p) return;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'testimonial-read-more';
      btn.textContent = 'Read more';
      btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', function () {
        var expanded = card.classList.toggle('expanded');
        btn.textContent = expanded ? 'Read less' : 'Read more';
        btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      });
      p.insertAdjacentElement('afterend', btn);
    });

    function refresh() {
      cards.forEach(function (card) {
        var p = card.querySelector(':scope > p');
        var btn = card.querySelector('.testimonial-read-more');
        if (!p || !btn) return;
        if (card.classList.contains('expanded')) {
          btn.classList.add('is-needed');
          return;
        }
        btn.classList.toggle('is-needed', p.scrollHeight > p.clientHeight + 2);
      });
    }

    refresh();
    // The full stylesheet loads async, so re-check after it's applied.
    window.addEventListener('load', refresh);
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(refresh, 150);
    });
  })();

  // --- World map: load visited countries from countries.txt ---
  fetch('countries.txt')
    .then(function (r) { return r.text(); })
    .then(function (text) {
      var countries = text.trim().split('\n');
      countries.forEach(function (code) {
        var path = document.getElementById(code.trim());
        if (path) path.classList.add('visited');
      });
    })
    .catch(function () {});

  // --- World map: hover handler with custom tooltip (no native delay) ---
  (function mapHover() {
    var map = document.querySelector('.world-map');
    if (!map) return;
    var mapContainer = map.closest('.map-container') || map.parentNode;
    mapContainer.style.position = mapContainer.style.position || 'relative';

    var tooltip = document.createElement('div');
    tooltip.className = 'map-tooltip';
    mapContainer.appendChild(tooltip);

    var current = null;

    function findCountry(target) {
      var el = target;
      while (el && el !== map) {
        if (el.dataset && el.dataset.name) return el;
        el = el.parentNode;
      }
      return null;
    }

    map.addEventListener('mousemove', function (e) {
      var el = findCountry(e.target);
      if (el !== current) {
        if (current) current.classList.remove('hovered');
        if (el) el.classList.add('hovered');
        current = el;
      }
      if (el) {
        tooltip.textContent = el.dataset.name;
        tooltip.classList.add('show');
        var rect = mapContainer.getBoundingClientRect();
        tooltip.style.left = (e.clientX - rect.left + 12) + 'px';
        tooltip.style.top = (e.clientY - rect.top + 12) + 'px';
      } else {
        tooltip.classList.remove('show');
      }
    });
    map.addEventListener('mouseleave', function () {
      if (current) { current.classList.remove('hovered'); current = null; }
      tooltip.classList.remove('show');
    });
  })();

})();
