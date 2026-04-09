<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { buildServiceOverviewRoute } from '@/constants/applicationCatalog'
import { getApplicationServiceExperience } from '@/constants/applicationServiceExperience'
import { useApplicantServiceCatalogStore } from '@/stores/serviceCatalog'
import { useScrollReveal } from '@/composables/useScrollReveal'

import heroImg from '@/assets/imgs/ushindani-house.png'
import darSkyline from '@/assets/imgs/image-1.jpg'

const catalogStore = useApplicantServiceCatalogStore()
const router = useRouter()
const { containerRef } = useScrollReveal()

onMounted(() => { catalogStore.loadPublicServices() })

const services = computed(() => catalogStore.availableServices)
const serviceCards = computed(() =>
  services.value.map((service) => ({
    ...service,
    experience: getApplicationServiceExperience(service.key),
  }))
)

const serviceIcons = {
  'trademark-recordation': 'fa-solid fa-shield-halved',
  'merger-clearance': 'fa-solid fa-building-columns',
  'sfcc-registration': 'fa-solid fa-file-contract',
  'legal-opinion': 'fa-solid fa-scale-balanced',
  'exemption': 'fa-solid fa-badge-check',
}
const serviceColors = {
  'trademark-recordation': { bg: 'bg-sky-500/10', text: 'text-sky-600', darkText: 'dark:text-sky-400' },
  'merger-clearance': { bg: 'bg-violet-500/10', text: 'text-violet-600', darkText: 'dark:text-violet-400' },
  'sfcc-registration': { bg: 'bg-emerald-500/10', text: 'text-emerald-600', darkText: 'dark:text-emerald-400' },
  'legal-opinion': { bg: 'bg-amber-500/10', text: 'text-amber-600', darkText: 'dark:text-amber-400' },
  'exemption': { bg: 'bg-rose-500/10', text: 'text-rose-600', darkText: 'dark:text-rose-400' },
}

const steps = [
  { icon: 'fa-solid fa-user-plus', title: 'Create Account', desc: 'Register as an individual or organization with your identification and contact details.' },
  { icon: 'fa-solid fa-file-pen', title: 'Submit Application', desc: 'Select a service, complete the guided wizard, and upload required documents.' },
  { icon: 'fa-solid fa-credit-card', title: 'Make Payment', desc: 'Pay the prescribed fees securely through integrated GePG payment channels.' },
  { icon: 'fa-solid fa-certificate', title: 'Receive Certificate', desc: 'Track progress in real-time and download your certificate once approved.' },
]

// ── Animated counters ──
const counters = ref([
  { target: 5, current: 0, label: 'Regulatory Services', suffix: '' },
  { target: 4, current: 0, label: 'Workflow Stages', suffix: '' },
  { target: 100, current: 0, label: 'Secure & Encrypted', suffix: '%' },
  { target: 24, current: 0, label: 'Online Access', suffix: '/7' },
])
let counterAnimated = false

function animateCounters() {
  if (counterAnimated) return
  counterAnimated = true
  counters.value.forEach((c) => {
    const duration = 1200
    const steps = 40
    const increment = c.target / steps
    let step = 0
    const timer = setInterval(() => {
      step++
      c.current = Math.min(Math.round(increment * step), c.target)
      if (step >= steps) clearInterval(timer)
    }, duration / steps)
  })
}

// Observe counter section
const statsRef = ref(null)
let statsObserver = null
onMounted(() => {
  if (!statsRef.value) return
  statsObserver = new IntersectionObserver(
    ([entry]) => { if (entry.isIntersecting) { animateCounters(); statsObserver.disconnect() } },
    { threshold: 0.3 }
  )
  statsObserver.observe(statsRef.value)
})
onBeforeUnmount(() => { if (statsObserver) statsObserver.disconnect() })
</script>

<template>
  <div ref="containerRef" class="home-page">
    <!-- ══════════════════════════════════════════════════════════════════════
         SECTION 1: HERO
         ══════════════════════════════════════════════════════════════════════ -->
    <section class="hero">
      <div class="hero__bg" :style="{ backgroundImage: `url(${heroImg})` }" />
      <div class="hero__overlay" />
      <div class="hero__content">
        <img src="@/assets/imgs/logo-2-removebg-preview.png" alt="FCC" class="hero__seal" data-reveal data-delay="100" />
        <h1 class="hero__title" data-reveal data-delay="250">
          Fair Competition Commission
        </h1>
        <p class="hero__country" data-reveal data-delay="350">United Republic of Tanzania</p>
        <p class="hero__tagline" data-reveal data-delay="450">
          Your gateway to regulatory services — apply for trademarks,<br class="hidden md:inline" />
          mergers, exemptions, and more through one secure portal.
        </p>
        <div class="hero__actions" data-reveal data-delay="550">
          <router-link to="/auth/register">
            <el-button type="primary" size="large" class="!h-12 !px-8 !text-[15px] !font-bold !rounded-xl">
              Create Applicant Account
            </el-button>
          </router-link>
          <router-link to="/auth/login">
            <el-button size="large" class="!h-12 !px-8 !text-[15px] !font-semibold !rounded-xl hero__login-btn">
              Sign In
            </el-button>
          </router-link>
        </div>
        <div class="hero__scroll" data-reveal data-delay="800">
          <i class="fa-solid fa-chevron-down" />
          <span>Explore our services</span>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════════════════
         SECTION 2: SERVICES
         ══════════════════════════════════════════════════════════════════════ -->
    <section class="section">
      <div class="section__inner">
        <div class="section__header" data-reveal>
          <p class="section__label">What We Offer</p>
          <h2 class="section__title">Regulatory Services</h2>
          <p class="section__desc">Apply for any of the following FCC services through this portal. Each service has a guided application wizard and real-time status tracking.</p>
        </div>

        <div class="services-grid">
          <router-link
            v-for="(service, i) in serviceCards"
            :key="service.key"
            :to="buildServiceOverviewRoute(service.key)"
            class="svc-card"
            :data-reveal="'slide-up'"
            :data-delay="i * 100"
          >
            <div class="svc-card__icon" :class="[serviceColors[service.key]?.bg]">
              <i :class="[serviceIcons[service.key] || 'fa-solid fa-file', serviceColors[service.key]?.text, serviceColors[service.key]?.darkText]" />
            </div>
            <h3 class="svc-card__title">{{ service.label }}</h3>
            <p class="svc-card__desc">{{ service.description }}</p>
            <div class="svc-card__meta">
              <span class="svc-card__chip">{{ service.experience.outcomeChipLabel }}</span>
              <span class="svc-card__chip">{{ service.experience.stageCount }} stages</span>
            </div>
            <span class="svc-card__link">
              Learn more <i class="fa-solid fa-arrow-right text-[10px]" />
            </span>
          </router-link>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════════════════
         SECTION 3: HOW IT WORKS
         ══════════════════════════════════════════════════════════════════════ -->
    <section class="section section--alt">
      <div class="section__inner">
        <div class="section__header" data-reveal>
          <p class="section__label">Getting Started</p>
          <h2 class="section__title">How It Works</h2>
          <p class="section__desc">Four simple steps from registration to receiving your certificate.</p>
        </div>

        <div class="steps-row">
          <div v-for="(s, i) in steps" :key="i" class="step-item" data-reveal="slide-up" :data-delay="i * 120">
            <div class="step-item__number">{{ i + 1 }}</div>
            <div class="step-item__icon"><i :class="s.icon" /></div>
            <h3 class="step-item__title">{{ s.title }}</h3>
            <p class="step-item__desc">{{ s.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════════════════
         SECTION 4: STATS + TRUST
         ══════════════════════════════════════════════════════════════════════ -->
    <section class="section stats-section" ref="statsRef">
      <div class="stats-section__bg" :style="{ backgroundImage: `url(${darSkyline})` }" />
      <div class="stats-section__overlay" />
      <div class="section__inner stats-section__content">
        <div class="stats-grid" data-reveal>
          <div v-for="(c, i) in counters" :key="i" class="stat-item">
            <span class="stat-item__number">{{ c.current }}{{ c.suffix }}</span>
            <span class="stat-item__label">{{ c.label }}</span>
          </div>
        </div>

        <div class="trust-row">
          <div class="trust-item" data-reveal="slide-up" data-delay="0">
            <div class="trust-item__icon trust-item__icon--green"><i class="fa-solid fa-shield-halved" /></div>
            <div>
              <h4 class="trust-item__title">Government Authority</h4>
              <p class="trust-item__desc">Official regulatory portal under the Fair Competition Act, Cap. 285.</p>
            </div>
          </div>
          <div class="trust-item" data-reveal="slide-up" data-delay="120">
            <div class="trust-item__icon trust-item__icon--blue"><i class="fa-solid fa-bolt" /></div>
            <div>
              <h4 class="trust-item__title">Fast Processing</h4>
              <p class="trust-item__desc">Applications processed within statutory timelines with live status tracking.</p>
            </div>
          </div>
          <div class="trust-item" data-reveal="slide-up" data-delay="240">
            <div class="trust-item__icon trust-item__icon--purple"><i class="fa-solid fa-lock" /></div>
            <div>
              <h4 class="trust-item__title">Secure Submission</h4>
              <p class="trust-item__desc">256-bit SSL encryption. All data stored in compliance with data protection law.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════════════════
         SECTION 5: CTA
         ══════════════════════════════════════════════════════════════════════ -->
    <section class="section cta-section">
      <div class="section__inner cta-inner" data-reveal>
        <img src="@/assets/imgs/logo-2-removebg-preview.png" alt="FCC" class="fcc-seal cta-seal" />
        <h2 class="cta-title">Ready to get started?</h2>
        <p class="cta-desc">Create your applicant account today and begin submitting applications to the Fair Competition Commission.</p>
        <div class="cta-actions">
          <router-link to="/auth/register">
            <el-button type="primary" size="large" class="!h-12 !px-10 !text-[15px] !font-bold !rounded-xl">
              Create Account
            </el-button>
          </router-link>
          <router-link to="/auth/login" class="cta-login">
            Already have an account? <strong>Sign in</strong>
          </router-link>
        </div>
      </div>
    </section>

    <!-- ── Page footer ── -->
    <footer class="home-footer">
      <div class="home-footer__inner">
        <div class="home-footer__brand">
          <img src="@/assets/imgs/logo-2-removebg-preview.png" alt="FCC" class="fcc-seal home-footer__logo" />
          <div>
            <p class="home-footer__name">Fair Competition Commission</p>
            <p class="home-footer__country">United Republic of Tanzania</p>
          </div>
        </div>
        <div class="home-footer__links">
          <router-link to="/auth/login">Sign In</router-link>
          <router-link to="/auth/register">Register</router-link>
        </div>
        <p class="home-footer__copy">&copy; {{ new Date().getFullYear() }} Fair Competition Commission. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* ══════════════════════════════════════════════════════════════════════════════
   SCROLL REVEAL ANIMATIONS
   ══════════════════════════════════════════════════════════════════════════════ */
[data-reveal] {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}
[data-reveal="slide-up"] { transform: translateY(32px); }
[data-reveal="slide-left"] { transform: translateX(-32px); }
[data-reveal][data-visible="true"] {
  opacity: 1;
  transform: translate(0, 0);
}

/* ══════════════════════════════════════════════════════════════════════════════
   PAGE SHELL
   ══════════════════════════════════════════════════════════════════════════════ */
.home-page {
  width: 100%;
  overflow-x: hidden;
}

/* ══════════════════════════════════════════════════════════════════════════════
   HERO
   ══════════════════════════════════════════════════════════════════════════════ */
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
}
.hero__bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center 30%;
  transform: scale(1.05);
  animation: hero-zoom 20s ease-in-out infinite alternate;
}
@keyframes hero-zoom {
  from { transform: scale(1.05); }
  to { transform: scale(1.12); }
}
.hero__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(7, 30, 52, 0.88) 0%,
    rgba(15, 76, 129, 0.7) 50%,
    rgba(2, 12, 28, 0.92) 100%
  );
}
.hero__content {
  position: relative;
  z-index: 1;
  padding: 2rem 1.5rem 3rem;
  max-width: 700px;
}
.hero__seal {
  width: 120px;
  height: auto;
  margin: 0 auto 1.5rem;
  filter: brightness(2) contrast(0.75) drop-shadow(0 4px 20px rgba(0,0,0,0.4));
}
.hero__title {
  font-size: clamp(1.6rem, 5vw, 3.25rem);
  font-weight: 800;
  color: #fff;
  line-height: 1.1;
  margin: 0;
  letter-spacing: -0.02em;
  white-space: nowrap;
}
.hero__country {
  margin: 0.4rem 0 0;
  font-size: 0.95rem;
  color: rgba(255,255,255,0.5);
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.hero__tagline {
  margin: 1.5rem auto 0;
  font-size: 1.05rem;
  color: rgba(255,255,255,0.8);
  line-height: 1.6;
  max-width: 520px;
}
.hero__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 2rem;
}
.hero__login-btn {
  color: #fff !important;
  border-color: rgba(255,255,255,0.3) !important;
  background: rgba(255,255,255,0.08) !important;
}
.hero__login-btn:hover {
  border-color: rgba(255,255,255,0.6) !important;
  background: rgba(255,255,255,0.15) !important;
}
.hero__scroll {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  margin-top: 3rem;
  color: rgba(255,255,255,0.35);
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  animation: bounce-down 2s ease-in-out infinite;
}
.hero__scroll i { font-size: 0.9rem; }
@keyframes bounce-down {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(6px); }
}

@media (min-width: 768px) {
  .hero__seal { width: 140px; }
}

/* ══════════════════════════════════════════════════════════════════════════════
   SECTION LAYOUT
   ══════════════════════════════════════════════════════════════════════════════ */
.section {
  padding: 5rem 1.5rem;
}
.section--alt {
  background: #f8fafc;
}
:root[data-theme="dark"] .section--alt { background: #0a0f1e; }
.section__inner {
  max-width: 1100px;
  margin: 0 auto;
}
.section__header {
  text-align: center;
  margin-bottom: 3rem;
}
.section__label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: #0f4c81;
  margin: 0 0 0.5rem;
}
:root[data-theme="dark"] .section__label { color: #38bdf8; }
.section__title {
  font-size: 2rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.02em;
}
:root[data-theme="dark"] .section__title { color: #f1f5f9; }
.section__desc {
  margin: 0.6rem auto 0;
  font-size: 0.95rem;
  color: #64748b;
  max-width: 560px;
  line-height: 1.6;
}

/* ══════════════════════════════════════════════════════════════════════════════
   SERVICE CARDS
   ══════════════════════════════════════════════════════════════════════════════ */
.services-grid {
  display: grid;
  gap: 1.25rem;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
}
.svc-card {
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  background: #fff;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
:root[data-theme="dark"] .svc-card { background: #0f172a; border-color: #1e293b; }
.svc-card:hover {
  border-color: #0f4c81;
  box-shadow: 0 8px 30px rgba(15, 76, 129, 0.1);
  transform: translateY(-4px);
}
:root[data-theme="dark"] .svc-card:hover { border-color: #38bdf8; box-shadow: 0 8px 30px rgba(56,189,248,0.08); }

.svc-card__icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  margin-bottom: 1rem;
}
.svc-card__title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.4rem;
}
:root[data-theme="dark"] .svc-card__title { color: #f1f5f9; }
.svc-card__desc {
  font-size: 0.82rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0;
  flex: 1;
}
.svc-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 1rem;
}
.svc-card__chip {
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  background: #f1f5f9;
  color: #475569;
}
:root[data-theme="dark"] .svc-card__chip { background: #1e293b; color: #94a3b8; }
.svc-card__link {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 1rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: #0f4c81;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
:root[data-theme="dark"] .svc-card__link { color: #38bdf8; }

/* ══════════════════════════════════════════════════════════════════════════════
   HOW IT WORKS
   ══════════════════════════════════════════════════════════════════════════════ */
.steps-row {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr;
}
@media (min-width: 768px) { .steps-row { grid-template-columns: repeat(4, 1fr); } }

.step-item {
  position: relative;
  text-align: center;
  padding: 1.75rem 1.25rem;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  background: #fff;
}
:root[data-theme="dark"] .step-item { background: #0f172a; border-color: #1e293b; }

.step-item__number {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #0f4c81;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}
.step-item__icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  background: rgba(15, 76, 129, 0.08);
  color: #0f4c81;
  font-size: 1.2rem;
}
:root[data-theme="dark"] .step-item__icon { background: rgba(56,189,248,0.1); color: #38bdf8; }
.step-item__title {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.4rem;
}
:root[data-theme="dark"] .step-item__title { color: #f1f5f9; }
.step-item__desc {
  font-size: 0.82rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0;
}

/* ══════════════════════════════════════════════════════════════════════════════
   STATS + TRUST
   ══════════════════════════════════════════════════════════════════════════════ */
.stats-section {
  position: relative;
  overflow: hidden;
}
.stats-section__bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
}
.stats-section__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(7, 30, 52, 0.92) 0%, rgba(15, 76, 129, 0.85) 100%);
}
.stats-section__content { position: relative; z-index: 1; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 3rem;
}
@media (min-width: 768px) { .stats-grid { grid-template-columns: repeat(4, 1fr); } }
.stat-item {
  text-align: center;
}
.stat-item__number {
  display: block;
  font-size: 2.5rem;
  font-weight: 800;
  color: #fff;
  line-height: 1;
  letter-spacing: -0.02em;
}
.stat-item__label {
  display: block;
  margin-top: 0.3rem;
  font-size: 0.78rem;
  font-weight: 500;
  color: rgba(255,255,255,0.6);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.trust-row {
  display: grid;
  gap: 1.25rem;
  grid-template-columns: 1fr;
}
@media (min-width: 768px) { .trust-row { grid-template-columns: repeat(3, 1fr); } }

.trust-item {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  padding: 1.25rem;
  border-radius: 14px;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(8px);
}
.trust-item__icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  flex-shrink: 0;
}
.trust-item__icon--green { background: rgba(34,197,94,0.15); color: #4ade80; }
.trust-item__icon--blue { background: rgba(56,189,248,0.15); color: #38bdf8; }
.trust-item__icon--purple { background: rgba(168,85,247,0.15); color: #c084fc; }
.trust-item__title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 0.2rem;
}
.trust-item__desc {
  font-size: 0.78rem;
  color: rgba(255,255,255,0.6);
  line-height: 1.45;
  margin: 0;
}

/* ══════════════════════════════════════════════════════════════════════════════
   CTA
   ══════════════════════════════════════════════════════════════════════════════ */
.cta-section {
  background: #fff;
}
:root[data-theme="dark"] .cta-section { background: #060c1a; }
.cta-inner {
  text-align: center;
  max-width: 520px;
}
.cta-seal { height: 64px; width: auto; margin: 0 auto 1.25rem; }
.cta-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}
:root[data-theme="dark"] .cta-title { color: #f1f5f9; }
.cta-desc {
  margin: 0.6rem 0 0;
  font-size: 0.92rem;
  color: #64748b;
  line-height: 1.6;
}
.cta-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}
.cta-login {
  font-size: 0.85rem;
  color: #64748b;
  text-decoration: none;
}
.cta-login strong { color: #0f4c81; }
:root[data-theme="dark"] .cta-login strong { color: #38bdf8; }

/* ══════════════════════════════════════════════════════════════════════════════
   FOOTER
   ══════════════════════════════════════════════════════════════════════════════ */
.home-footer {
  border-top: 1px solid #e2e8f0;
  padding: 2rem 1.5rem;
  background: #f8fafc;
}
:root[data-theme="dark"] .home-footer { background: #060c1a; border-color: #1e293b; }
.home-footer__inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
}
@media (min-width: 768px) {
  .home-footer__inner { flex-direction: row; text-align: left; justify-content: space-between; }
}
.home-footer__brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.home-footer__logo { height: 32px; width: auto; }
.home-footer__name { font-size: 0.82rem; font-weight: 700; color: #0f172a; margin: 0; }
:root[data-theme="dark"] .home-footer__name { color: #e2e8f0; }
.home-footer__country { font-size: 0.65rem; color: #94a3b8; margin: 0; }
.home-footer__links {
  display: flex;
  gap: 1.5rem;
}
.home-footer__links a {
  font-size: 0.8rem;
  font-weight: 600;
  color: #0f4c81;
  text-decoration: none;
}
.home-footer__links a:hover { text-decoration: underline; }
:root[data-theme="dark"] .home-footer__links a { color: #38bdf8; }
.home-footer__copy {
  font-size: 0.7rem;
  color: #94a3b8;
  margin: 0;
}
</style>
