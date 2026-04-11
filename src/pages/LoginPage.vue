<script setup>
import { ElMessage } from 'element-plus'
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import heroFcc from '@/assets/imgs/ushindani-house.png'
import heroDar from '@/assets/imgs/image-1.jpg'
import heroAerial from '@/assets/imgs/image-3.jpg'
import heroHarbor from '@/assets/imgs/image-5.jpg'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const formRef = ref(null)
const showPassword = ref(false)

const form = reactive({ email: '', password: '' })

const rules = {
  email: [
    { required: true, message: 'Email address is required', trigger: 'blur' },
    { type: 'email', message: 'Enter a valid email address', trigger: 'blur' },
  ],
  password: [{ required: true, message: 'Password is required', trigger: 'blur' }],
}

// ── Carousel ──
const slides = [
  { image: heroFcc, title: 'Ushindani House', sub: 'Home of the Fair Competition Commission — promoting and protecting effective competition in Tanzania.' },
  { image: heroDar, title: 'Trademark Registration', sub: 'Protect your brand and intellectual property through our streamlined online application process.' },
  { image: heroAerial, title: 'Merger & Acquisition Review', sub: 'Ensuring fair market competition through transparent and timely merger assessments.' },
  { image: heroHarbor, title: 'Consumer Protection', sub: 'Safeguarding the interests of Tanzanian consumers and businesses in the marketplace.' },
]
const activeSlide = ref(0)
let carouselTimer = null

function startCarousel() {
  carouselTimer = setInterval(() => {
    activeSlide.value = (activeSlide.value + 1) % slides.length
  }, 6000)
}

onMounted(startCarousel)
onBeforeUnmount(() => clearInterval(carouselTimer))

function goToSlide(i) {
  activeSlide.value = i
  clearInterval(carouselTimer)
  startCarousel()
}

async function submit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    await authStore.login(form)
    const redirect = route.query.redirect ? String(route.query.redirect) : '/portal/dashboard'
    router.push(redirect)
  } catch (error) {
    ElMessage.error(error?.message || 'Invalid credentials. Please check your email and password.')
  }
}
</script>

<template>
  <div class="login-shell">
    <!-- ══════ Carousel hero (desktop) ══════ -->
    <div class="login-hero">
      <TransitionGroup name="hero-fade">
        <div
          v-for="(slide, i) in slides"
          v-show="activeSlide === i"
          :key="i"
          class="login-hero__slide"
          :style="{ backgroundImage: `url(${slide.image})` }"
        />
      </TransitionGroup>

      <div class="login-hero__overlay" />

      <div class="login-hero__content">
        <img src="@/assets/imgs/logo-2-removebg-preview.png" alt="FCC" class="login-hero__seal" />
        <h2 class="login-hero__brand">Fair Competition Commission</h2>
        <p class="login-hero__country">United Republic of Tanzania</p>

        <div class="login-hero__slide-text">
          <TransitionGroup name="slide-text">
            <div v-for="(slide, i) in slides" v-show="activeSlide === i" :key="'t'+i" class="login-hero__caption">
              <h3>{{ slide.title }}</h3>
              <p>{{ slide.sub }}</p>
            </div>
          </TransitionGroup>
        </div>

        <div class="login-hero__dots">
          <button
            v-for="(_, i) in slides"
            :key="i"
            class="login-hero__dot"
            :class="{ 'login-hero__dot--active': activeSlide === i }"
            :aria-label="`Go to slide ${i + 1}`"
            @click="goToSlide(i)"
          />
        </div>
      </div>
    </div>

    <!-- ══════ Form panel ══════ -->
    <div class="login-form-panel">
      <div class="login-form-wrap">
        <!-- Mobile header -->
        <div class="login-mobile-header">
          <img src="@/assets/imgs/logo-2-removebg-preview.png" alt="FCC" class="fcc-seal h-20 w-auto" />
          <h2 class="text-base font-bold text-fcc-brand mt-1">Fair Competition Commission</h2>
          <p class="text-xs text-slate-400">United Republic of Tanzania</p>
        </div>

        <div class="login-welcome">
          <h1>Welcome back</h1>
          <p>Sign in to manage your applications, payments, and certificates.</p>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="submit" class="login-form">
          <el-form-item label="Email Address" prop="email">
            <el-input
              v-model="form.email"
              size="large"
              placeholder="you@company.com"
              autocomplete="email"
              data-test="login-email"
            >
              <template #prefix><i class="fa-regular fa-envelope text-slate-400" /></template>
            </el-input>
          </el-form-item>

          <el-form-item label="Password" prop="password">
            <el-input
              v-model="form.password"
              size="large"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Enter your password"
              autocomplete="current-password"
              data-test="login-password"
              @keydown.enter="submit"
            >
              <template #prefix><i class="fa-solid fa-lock text-slate-400" /></template>
              <template #suffix>
                <button type="button" class="toggle-pw" tabindex="-1" @click="showPassword = !showPassword">
                  <i :class="showPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'" />
                </button>
              </template>
            </el-input>
          </el-form-item>

          <div class="flex items-center justify-between mb-6">
            <el-checkbox label="Remember me" class="!text-slate-500" />
            <router-link class="text-sm font-medium text-fcc-brand hover:underline" to="/auth/forgot-password">
              Forgot password?
            </router-link>
          </div>

          <el-button class="w-full !h-12 !text-[15px] !font-bold !tracking-wide" type="primary" size="large" :loading="authStore.loading" data-test="login-submit" @click="submit">
            Sign In
          </el-button>
        </el-form>

        <div class="login-divider"><span>New to FCC?</span></div>

        <router-link to="/auth/register" class="login-register-btn">
          <i class="fa-solid fa-user-plus" />
          Create an Applicant Account
        </router-link>

        <p class="login-footer-trust">
          <i class="fa-solid fa-shield-halved" />
          Protected by 256-bit SSL encryption
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Shell ── */
.login-shell {
  display: flex;
  min-height: 100vh;
  width: 100%;
}

/* ── Hero carousel ── */
.login-hero {
  display: none;
  position: relative;
  width: 55%;
  overflow: hidden;
}
.login-hero__slide {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  will-change: opacity;
}
.login-hero__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(7, 30, 52, 0.85) 0%,
    rgba(15, 76, 129, 0.6) 40%,
    rgba(7, 30, 52, 0.9) 100%
  );
  z-index: 1;
}
.login-hero__content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  padding: 3.5rem;
}
.login-hero__seal {
  width: 110px;
  height: auto;
  filter: brightness(2) contrast(0.75) drop-shadow(0 4px 16px rgba(0,0,0,0.4));
  margin-bottom: 1.25rem;
}
.login-hero__brand {
  font-size: 2rem;
  font-weight: 800;
  color: #fff;
  line-height: 1.15;
  margin: 0;
  letter-spacing: -0.02em;
}
.login-hero__country {
  margin: 0.3rem 0 0;
  font-size: 0.9rem;
  color: rgba(255,255,255,0.55);
  font-weight: 500;
}

.login-hero__slide-text {
  margin-top: auto;
  position: relative;
  min-height: 90px;
}
.login-hero__caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
}
.login-hero__caption h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 0.3rem;
}
.login-hero__caption p {
  font-size: 0.82rem;
  color: rgba(255,255,255,0.7);
  line-height: 1.5;
  margin: 0;
  max-width: 420px;
}

.login-hero__dots {
  display: flex;
  gap: 0.5rem;
  margin-top: 1.5rem;
}
.login-hero__dot {
  width: 32px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255,255,255,0.25);
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
}
.login-hero__dot--active {
  background: #38bdf8;
  width: 48px;
}

/* ── Carousel transitions ── */
.hero-fade-enter-active,
.hero-fade-leave-active {
  transition: opacity 1s ease;
}
.hero-fade-enter-from,
.hero-fade-leave-to {
  opacity: 0;
}
.slide-text-enter-active,
.slide-text-leave-active {
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.slide-text-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.slide-text-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

/* ── Form panel ── */
.login-form-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
  background: #fff;
  min-height: 100vh;
  overflow-y: auto;
}
:root[data-theme="dark"] .login-form-panel {
  background: #0b1120;
}
.login-form-wrap {
  width: 100%;
  max-width: 400px;
}

/* ── Mobile header ── */
.login-mobile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 2.5rem;
}

/* ── Welcome ── */
.login-welcome h1 {
  font-size: 1.85rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.03em;
}
:root[data-theme="dark"] .login-welcome h1 { color: #f1f5f9; }
.login-welcome p {
  margin: 0.4rem 0 0;
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.5;
}
.login-welcome {
  margin-bottom: 2rem;
}

/* ── Form ── */
.login-form :deep(.el-form-item__label) {
  font-weight: 600;
  font-size: 0.82rem;
  color: #475569;
}
:root[data-theme="dark"] .login-form :deep(.el-form-item__label) { color: #94a3b8; }

.toggle-pw {
  background: none;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  font-size: 0.85rem;
  padding: 0 2px;
  transition: color 0.15s;
}
.toggle-pw:hover { color: #64748b; }

/* ── Divider ── */
.login-divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1.75rem 0;
  color: #94a3b8;
  font-size: 0.78rem;
  font-weight: 500;
}
.login-divider::before, .login-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e2e8f0;
}
:root[data-theme="dark"] .login-divider::before,
:root[data-theme="dark"] .login-divider::after { background: #1e293b; }

/* ── Register link button ── */
.login-register-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  height: 44px;
  border-radius: var(--fcc-radius-base);
  border: 1.5px solid #e2e8f0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
  text-decoration: none;
  transition: all 0.2s ease;
}
.login-register-btn:hover {
  border-color: #0f4c81;
  color: #0f4c81;
  background: rgba(15,76,129,0.04);
}
:root[data-theme="dark"] .login-register-btn {
  border-color: #334155;
  color: #cbd5e1;
}
:root[data-theme="dark"] .login-register-btn:hover {
  border-color: #38bdf8;
  color: #38bdf8;
  background: rgba(56,189,248,0.06);
}

.login-footer-trust {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin-top: 2rem;
  font-size: 0.7rem;
  color: #94a3b8;
}

/* ── Desktop ── */
@media (min-width: 1024px) {
  .login-hero { display: block; }
  .login-mobile-header { display: none; }
  .login-form-panel { padding: 3rem; }
}
</style>
