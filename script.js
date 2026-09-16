

// Data lifted from data.js (window.CHULO_DATA)
const { services, projects, testimonials } = window.CHULO_DATA;


// Smooth scroll
document.querySelectorAll("[data-scroll]").forEach(btn => {
  btn.addEventListener("click", () => {
    const id = btn.getAttribute("data-scroll");
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    document.getElementById("mobileMenu").classList.remove("open");
  });
});

// Mobile menu
document.getElementById("mobileToggle").addEventListener("click", () => {
  document.getElementById("mobileMenu").classList.toggle("open");
});

// Services
const serviceList = document.getElementById("serviceList");
let activeService = "01";

function renderServices() {
  serviceList.innerHTML = services.map(s => `
    <div class="service-item ${s.id === activeService ? "active" : ""}" data-id="${s.id}">
      <div>
        <span class="service-id">${s.id}</span>
        <div class="service-title" style="display:none">${s.title}</div>
      </div>
      <div>
        <div class="service-title">${s.title}</div>
        <p class="service-desc">${s.desc}</p>
        <div class="service-tags">
          ${s.subs.map(sub => `<span>✓ ${sub}</span>`).join("")}
        </div>
      </div>
      <div class="service-outcome">
        <div class="outcome-label">Outcome</div>
        <div class="outcome-text">${s.outcome}</div>
        <div class="outcome-bar"><span></span></div>
      </div>
    </div>
  `).join("");

  serviceList.querySelectorAll(".service-item").forEach(item => {
    item.addEventListener("mouseenter", () => {
      activeService = item.dataset.id;
      renderServices();
    });
  });
}
renderServices();

// Work filters
const workGrid = document.getElementById("workGrid");
let currentFilter = "All";

function renderProjects() {
  const filtered = currentFilter === "All"
    ? projects
    : projects.filter(p => p.category === currentFilter);

  workGrid.innerHTML = filtered.map(p => `
    <div class="project-card">
      <div class="project-image">
        <div class="project-tag"><span class="dot"></span> ${p.tag}</div>
        <img src="${p.img}" alt="${p.title}" loading="lazy">
      </div>
      <div class="project-body">
        <h3>${p.title}</h3>
        <p>${p.desc}</p>
        <div class="project-stack">
          ${p.stack.map(s => `<span>${s}</span>`).join("")}
        </div>
        <div class="project-metric">
          <span class="metric-badge"><span class="dot" style="width:6px;height:6px;background:#000"></span> ${p.metric}</span>
          <span class="metric-sub">${p.metricSub}</span>
        </div>
      </div>
    </div>
  `).join("") || `<p style="grid-column:1/-1;text-align:center;color:rgba(255,255,255,0.3)">No builds in this category yet.</p>`;
}

document.getElementById("filters").addEventListener("click", e => {
  if (e.target.classList.contains("filter")) {
    document.querySelectorAll(".filter").forEach(f => f.classList.remove("active"));
    e.target.classList.add("active");
    currentFilter = e.target.dataset.filter;
    renderProjects();
  }
});
renderProjects();

// Testimonials
let currentTestimonial = 0;
const track = document.getElementById("testimonialTrack");
const dots = document.getElementById("testimonialDots");

function renderTestimonials() {
  track.innerHTML = testimonials.map(t => `
    <div class="testimonial-slide">
      <div class="quote">“${t.quote}”</div>
      <div class="author-block">
        <div class="author">${t.author}</div>
        <div class="role">${t.role}</div>
        <div class="verified"><span class="dot" style="background:#000;width:6px;height:6px"></span> Verified delivery</div>
      </div>
    </div>
  `).join("");

  dots.innerHTML = testimonials.map((_, i) =>
    `<button class="${i === currentTestimonial ? "active" : ""}" data-i="${i}"></button>`
  ).join("");

  track.style.transform = `translateX(-${currentTestimonial * 100}%)`;

  dots.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      currentTestimonial = +btn.dataset.i;
      renderTestimonials();
    });
  });
}
renderTestimonials();

// Auto-rotate testimonials
setInterval(() => {
  currentTestimonial = (currentTestimonial + 1) % testimonials.length;
  renderTestimonials();
}, 4000);
