// Acme Studio front-end helpers.
const routes = {
  home: '/',
  book: '/book',
  checkout: '/checkout',
  dashboard: '/dashboard',
  account: '/account/settings',
  giftCards: '/gift-cards',
  api: '/api/bookings',
};

document.addEventListener('DOMContentLoaded', () => {
  const search = document.getElementById('search-btn');
  if (search) search.addEventListener('click', () => { window.location.href = routes.book; });

  const btn = document.getElementById('book-btn');
  if (btn) {
    btn.addEventListener('click', async () => {
      const status = document.getElementById('book-status');
      status.textContent = 'Booking…';
      const res = await fetch(routes.api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ class: btn.dataset.class, date: btn.dataset.date, qty: btn.dataset.qty }),
      });
      if (res.ok) {
        window.location.href = routes.dashboard + '?booked=1';
      } else {
        status.textContent = 'Could not book. Please log in and try again.';
      }
    });
  }
});
