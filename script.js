/* UniVibe demo interactions: data stays in this browser using localStorage. */
const EVENT_KEY = "univibeEvents";
const REG_KEY = "univibeRegistrations";
const starterEvents = [
  { id: "workshop", title: "Make & Mend: Creative Workshop", category: "Workshop", date: "2026-11-12", time: "3:00 PM – 5:00 PM", venue: "Student Activity Studio", fee: 0, host: "Creative Club", description: "Bring a tired tee, tote bag, or small fabric item and give it a fresh new life. Student hosts will guide you through simple mending and customisation techniques. Materials provided; beginners welcome.", status: "Published" },
  { id: "music", title: "Courtyard Sessions", category: "Arts & music", date: "2026-11-18", time: "6:30 PM – 8:30 PM", venue: "Main Courtyard", fee: 100, host: "Music Society", description: "Settle in for an easy evening of live sets by campus bands. Bring a friend, grab a snack, and enjoy new music as the sun goes down. Entry supports the student music society.", status: "Published" },
  { id: "career", title: "Future Fest: Meet Your Mentors", category: "Career", date: "2026-12-03", time: "11:00 AM – 1:30 PM", venue: "Learning Commons, Hall B", fee: 0, host: "Careers Cell", description: "Meet alumni working across design, technology, business, and public service. Hear how their journeys began, ask honest questions, and find a next step that feels right for you.", status: "In review" }
];
function readStore(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (error) {
    return fallback;
  }
}
function saveStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    alert("Browser storage is unavailable. Open this project in a browser that allows local storage.");
  }
}
// Load saved events once; use the three starter events the first time.
let events = readStore(EVENT_KEY, null);
if (!Array.isArray(events)) {
  events = starterEvents;
  saveStore(EVENT_KEY, events);
}
let registrations = readStore(REG_KEY, []);
const money = (amount) => Number(amount) > 0 ? `₹${Number(amount)}` : "Free";
const dateLabel = (value) => {
  if (!value) return "Date to be announced";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
};
const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
function artClass(category) {
  const value = String(category).toLowerCase();
  return value.includes("music") || value.includes("arts") ? "art-two" : value.includes("career") ? "art-three" : "art-one";
}
function feeLabel(event) {
  return Number(event.fee) > 0 ? money(event.fee) : "FREE";
}
function eventCard(event) {
  return `<article class="event-card"><div class="card-art ${artClass(event.category)}"><span>${escapeHTML(event.category.toUpperCase())}</span><b>✦</b></div><div class="card-body"><p class="event-meta">${escapeHTML(dateLabel(event.date))} · ${escapeHTML(event.time || "Time to be announced")} <span>${escapeHTML(feeLabel(event))}</span></p><h3>${escapeHTML(event.title)}</h3><p>${escapeHTML(event.description)}</p><a href="event-details.html?id=${encodeURIComponent(event.id)}">View event details ↗</a></div></article>`;
}
function renderCards(target, list) {
  if (!target) return;
  target.innerHTML = list.length ? list.map(eventCard).join("") : '<p class="empty-state">No events match your search yet. Try another word or category.</p>';
}
// Show cards on the home and event pages. The event page filters as the user types.
function setupEventBrowse() {
  const eventGrid = document.querySelector("#eventGrid");
  if (eventGrid) {
    const search = document.querySelector("#searchEvents");
    const category = document.querySelector("#categoryFilter");
    const filter = () => {
      const term = (search?.value || "").trim().toLowerCase();
      const kind = category?.value || "all";
      const found = events.filter((event) => {
        const matchesText = `${event.title} ${event.category} ${event.description} ${event.host}`.toLowerCase().includes(term);
        return matchesText && (kind === "all" || event.category.toLowerCase() === kind);
      });
      renderCards(eventGrid, found);
      const count = document.querySelector("#resultCount");
      if (count) count.textContent = `${found.length} event${found.length === 1 ? "" : "s"}`;
    };
    search?.addEventListener("input", filter);
    category?.addEventListener("change", filter);
    filter();
  }
  renderCards(document.querySelector("#featuredEvents"), events.slice(0, 3));
}
// Rebuild the organizer table and update its counts from browser storage.
function renderManager() {
  const rows = document.querySelector("#manageEventRows");
  if (!rows) return;
  rows.innerHTML = events.length ? events.map((event) => `<tr>
    <td><b>${escapeHTML(event.title)}</b><small>${escapeHTML(event.host || "Student organizer")}</small></td>
    <td>${escapeHTML(dateLabel(event.date))}</td><td>${escapeHTML(money(event.fee))}</td>
    <td><span class="status ${event.status === "Published" ? "published" : "review"}">${escapeHTML(event.status || "Draft")}</span></td>
    <td class="action-cell"><button class="link-button" type="button" data-edit="${escapeHTML(event.id)}">Edit</button><button class="link-button delete-link" type="button" data-delete="${escapeHTML(event.id)}">Delete</button></td>
  </tr>`).join("") : '<tr><td colspan="5">No events yet. Add your first event.</td></tr>';
  const count = (id, value) => { const node = document.querySelector(id); if (node) node.textContent = value; };
  count("#eventTotal", String(events.length).padStart(2, "0"));
  count("#registrationTotal", String(registrations.length));
  count("#upcomingTotal", String(events.filter((e) => e.date && new Date(`${e.date}T23:59:59`) >= new Date()).length).padStart(2, "0"));
  rows.querySelectorAll("[data-edit]").forEach((button) => button.addEventListener("click", () => editEvent(button.dataset.edit)));
  rows.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", () => deleteEvent(button.dataset.delete)));
}
// Put the selected row's values back into the form so the organizer can edit them.
function editEvent(id) {
  const event = events.find((item) => item.id === id);
  if (!event) return;
  const form = document.querySelector("#eventForm");
  form.elements.eventId.value = event.id;
  form.elements.title.value = event.title;
  form.elements.category.value = event.category;
  form.elements.date.value = event.date;
  form.elements.fee.value = event.fee;
  form.elements.host.value = event.host || "";
  form.elements.description.value = event.description || "";
  document.querySelector("#eventFormTitle").textContent = "Update event";
  document.querySelector("#saveEventButton").textContent = "Update event →";
  form.scrollIntoView({ behavior: "smooth", block: "center" });
}
// Remove a row after the organizer confirms the action.
function deleteEvent(id) {
  const event = events.find((item) => item.id === id);
  if (!event || !confirm(`Delete “${event.title}” from this browser?`)) return;
  events = events.filter((item) => item.id !== id);
  saveStore(EVENT_KEY, events);
  renderManager();
}
// A blank hidden ID means add; an existing ID means update.
function setupEventForm() {
  const form = document.querySelector("#eventForm");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const id = data.get("eventId");
    const old = events.find((item) => item.id === id);
    const item = {
      id: id || `event-${Date.now()}`,
      title: data.get("title").trim(), category: data.get("category"), date: data.get("date"),
      time: old?.time || "Time to be announced", venue: old?.venue || "Location to be announced",
      fee: Math.max(0, Number(data.get("fee") || 0)), host: data.get("host").trim() || "Student organizer",
      description: data.get("description").trim() || "More event details will be shared by the organizer.",
      status: old?.status || "Published"
    };
    events = old ? events.map((row) => row.id === id ? item : row) : [item, ...events];
    saveStore(EVENT_KEY, events);
    form.reset();
    form.elements.eventId.value = "";
    document.querySelector("#eventFormTitle").textContent = "List a new event";
    document.querySelector("#saveEventButton").textContent = "Save event →";
    renderManager();
    alert(old ? "Event updated. It is now visible in Explore Events." : "Event added. It is now visible in Explore Events.");
  });
  renderManager();
}
// Load event choices and save each demo registration locally.
function setupRegistration() {
  const form = document.querySelector("#registrationForm");
  const select = document.querySelector("#eventSelect");
  if (!form || !select) return;
  select.innerHTML = '<option value="">Choose an event</option>' + events.map((event) => `<option value="${escapeHTML(event.id)}">${escapeHTML(event.title)} — ${escapeHTML(money(event.fee))}</option>`).join("");
  const requested = new URLSearchParams(location.search).get("event");
  if (requested && events.some((event) => event.id === requested)) select.value = requested;
  const showFee = () => {
    const selected = events.find((event) => event.id === select.value);
    const fee = document.querySelector("#selectedFee");
    if (fee) fee.textContent = selected ? `Entry fee: ${money(selected.fee)}` : "Choose an event to see its fee.";
  };
  select.addEventListener("change", showFee);
  showFee();
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const selected = events.find((item) => item.id === select.value);
    if (!selected) return;
    const person = form.elements.fullName.value.trim();
    registrations = readStore(REG_KEY, []);
    registrations.push({ name: person, email: form.elements.email.value.trim(), eventId: selected.id, registeredAt: new Date().toISOString() });
    saveStore(REG_KEY, registrations);
    location.href = `thanks.html?name=${encodeURIComponent(person)}&event=${encodeURIComponent(selected.title)}`;
  });
}
// Read the event ID from the link and fill the shared details page.
function setupDetails() {
  const host = document.querySelector("#eventDetail");
  if (!host) return;
  const id = new URLSearchParams(location.search).get("id") || document.body.dataset.eventId || "workshop";
  const event = events.find((item) => item.id === id) || events[0];
  if (!event) { host.innerHTML = '<p class="empty-state">This event is no longer listed.</p>'; return; }
  document.title = `${event.title} | UniVibe`;
  host.innerHTML = `<section class="detail-content"><div class="detail-art ${artClass(event.category)}">✦</div><p class="eyebrow">${escapeHTML(event.category.toUpperCase())}</p><h1>${escapeHTML(event.title)}</h1><p>${escapeHTML(event.description)}</p><div class="detail-facts"><div><span>Date</span><b>${escapeHTML(dateLabel(event.date))}</b></div><div><span>Time</span><b>${escapeHTML(event.time)}</b></div><div><span>Location</span><b>${escapeHTML(event.venue)}</b></div><div><span>Hosted by</span><b>${escapeHTML(event.host)}</b></div><div><span>Entry</span><b>${escapeHTML(money(event.fee))}</b></div></div></section><aside class="detail-box"><p class="eyebrow">YOUR CAMPUS, YOUR MOMENT</p><h3>Save your spot.</h3><p>Check the event details, then register with your campus email.</p><a class="button" href="register.html?event=${encodeURIComponent(event.id)}">Register for this event →</a><p class="form-note">This demo saves your registration in this browser only.</p></aside>`;
}
// Personalize the confirmation using values from the registration link.
function setupThanks() {
  const name = new URLSearchParams(location.search).get("name");
  const event = new URLSearchParams(location.search).get("event");
  const message = document.querySelector("#thanksMessage");
  if (message && name) message.textContent = `Thanks, ${name}! Your demo registration for ${event || "this event"} is saved in this browser.`;
}
document.addEventListener("DOMContentLoaded", () => {
  setupEventBrowse();
  setupEventForm();
  setupRegistration();
  setupDetails();
  setupThanks();
});
