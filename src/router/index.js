import { createRouter, createWebHistory } from 'vue-router'
import {
  APPLICATION_SERVICE_OVERVIEW_ROUTE_NAME,
  DEFAULT_APPLICATION_SERVICE_KEY,
  isValidApplicationServiceKey
} from '@/constants/applicationCatalog'
import { useAuthStore } from '@/stores/auth'

const PublicLayout = () => import('@/layouts/PublicLayout.vue')
const PortalLayout = () => import('@/layouts/PortalLayout.vue')

function guardApplicationService(to) {
  const serviceKey = String(to.params.serviceKey || '')
  if (isValidApplicationServiceKey(serviceKey)) {
    return true
  }
  return { name: 'services' }
}

/**
 * Redirect trademark-recordation to the dedicated wizard route.
 * TrademarkRecordationWizard is a standalone page component that must be
 * loaded directly — not embedded inside ApplicationWizardPage.
 */
function guardApplicationCreateService(to) {
  const serviceKey = String(to.params.serviceKey || '')
  if (serviceKey === 'trademark-recordation') {
    return { name: 'trademark-create', query: to.query }
  }
  if (serviceKey === 'merger-clearance') {
    return { name: 'merger-fcc8-create', query: to.query }
  }
  if (serviceKey === 'sfcc-registration') {
    return { name: 'sfcc-create', query: to.query }
  }
  if (serviceKey === 'legal-opinion') {
    return { name: 'legal-opinion-create', query: to.query }
  }
  if (serviceKey === 'exemption') {
    return { name: 'exemption-create', query: to.query }
  }
  return guardApplicationService(to)
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: PublicLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/pages/HomePage.vue')
        },
        {
          path: 'auth/login',
          name: 'login',
          component: () => import('@/pages/LoginPage.vue')
        },
        {
          path: 'auth/register',
          name: 'register',
          component: () => import('@/pages/RegisterPage.vue')
        },
        {
          path: 'auth/unauthorized',
          name: 'unauthorized',
          component: () => import('@/pages/UnauthorizedPage.vue')
        },
        {
          path: 'auth/forgot-password',
          name: 'forgot-password',
          component: () => import('@/pages/ForgotPasswordPage.vue')
        },
        {
          path: 'auth/reset-password',
          name: 'reset-password',
          component: () => import('@/pages/ResetPasswordPage.vue')
        }
      ]
    },
    {
      path: '/design-system',
      name: 'design-system',
      component: () => import('@/pages/DesignSystemPage.vue')
    },
    {
      path: '/portal',
      component: PortalLayout,
      meta: { requiresAuth: true, requiresApplicantAccess: true },
      children: [
        {
          path: '',
          redirect: '/portal/dashboard'
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/pages/DashboardPage.vue'),
          meta: { breadcrumb: 'Dashboard' }
        },
        {
          path: 'services',
          name: 'services',
          component: () => import('@/pages/ApplicationsOverviewPage.vue'),
          meta: { breadcrumb: 'Services' }
        },
        {
          path: 'applications',
          name: 'applications',
          component: () => import('@/pages/ApplicationsPage.vue'),
          meta: { breadcrumb: 'Applications' }
        },
        {
          path: 'trademarks',
          name: 'trademarks-overview',
          redirect: {
            name: APPLICATION_SERVICE_OVERVIEW_ROUTE_NAME,
            params: { serviceKey: 'trademark-recordation' }
          }
        },
        {
          path: 'trademarks/new',
          name: 'trademark-create',
          component: () => import('@/pages/Trademarks/TrademarkRecordationWizard.vue'),
          meta: { title: 'New Trademark Recordation', requiresAuth: true }
        },
        {
          path: 'trademarks/:id',
          name: 'trademark-details',
          redirect: (route) => ({
            name: 'application-details',
            params: {
              serviceKey: 'trademark-recordation',
              id: String(route.params.id || '')
            }
          })
        },
        {
          path: 'trademarks/:id/edit',
          name: 'trademark-update',
          redirect: (route) => ({
            name: 'application-update',
            params: {
              serviceKey: 'trademark-recordation',
              id: String(route.params.id || '')
            }
          })
        },
        {
          path: 'mergers/fcc8/new',
          name: 'merger-fcc8-create',
          component: () => import('@/pages/Mergers/MergerNotificationWizardPage.vue'),
          props: { mode: 'create' }
        },
        {
          path: 'mergers/fcc8/:id/edit',
          name: 'merger-fcc8-update',
          component: () => import('@/pages/Mergers/MergerNotificationWizardPage.vue'),
          props: (route) => ({ mode: 'update', applicationId: String(route.params.id) })
        },
        {
          path: 'sfcc/new',
          name: 'sfcc-create',
          component: () => import('@/pages/ApplicationWizardPage.vue'),
          props: { serviceKey: 'sfcc-registration', mode: 'create' },
          meta: { title: 'SFCC Registration' }
        },
        {
          path: 'sfcc/:id/edit',
          name: 'sfcc-update',
          component: () => import('@/pages/ApplicationWizardPage.vue'),
          props: (route) => ({ serviceKey: 'sfcc-registration', mode: 'update', applicationId: String(route.params.id) })
        },
        {
          path: 'legal-opinion/new',
          name: 'legal-opinion-create',
          component: () => import('@/pages/ApplicationWizardPage.vue'),
          props: { serviceKey: 'legal-opinion', mode: 'create' },
          meta: { title: 'Legal Opinion Request' }
        },
        {
          path: 'legal-opinion/:id/edit',
          name: 'legal-opinion-update',
          component: () => import('@/pages/ApplicationWizardPage.vue'),
          props: (route) => ({ serviceKey: 'legal-opinion', mode: 'update', applicationId: String(route.params.id) })
        },
        {
          path: 'exemption/new',
          name: 'exemption-create',
          component: () => import('@/pages/ApplicationWizardPage.vue'),
          props: { serviceKey: 'exemption', mode: 'create' },
          meta: { title: 'Exemption Application' }
        },
        {
          path: 'exemption/:id/edit',
          name: 'exemption-update',
          component: () => import('@/pages/ApplicationWizardPage.vue'),
          props: (route) => ({ serviceKey: 'exemption', mode: 'update', applicationId: String(route.params.id) })
        },
        {
          path: 'services/:serviceKey/prepare',
          name: 'service-preparation',
          component: () => import('@/pages/ServicePreparationPage.vue'),
          beforeEnter: guardApplicationService,
          props: (route) => ({
            serviceKey: String(route.params.serviceKey || '')
          }),
          meta: {
            breadcrumb: 'Services',
            breadcrumbItems: (route) => [
              { label: String(route.params.serviceKey).replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), to: null },
              { label: 'Prepare', to: null }
            ]
          }
        },
        {
          path: 'services/:serviceKey',
          name: APPLICATION_SERVICE_OVERVIEW_ROUTE_NAME,
          component: () => import('@/pages/ServiceApplicationsOverviewPage.vue'),
          beforeEnter: guardApplicationService,
          props: (route) => ({
            serviceKey: String(route.params.serviceKey || '')
          }),
          meta: { breadcrumb: 'Services', breadcrumbItems: (route) => [{ label: String(route.params.serviceKey).replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), to: null }] }
        },
        {
          path: 'applications/:serviceKey/create',
          name: 'application-create',
          component: () => import('@/pages/ApplicationWizardPage.vue'),
          beforeEnter: guardApplicationCreateService,
          props: (route) => ({
            serviceKey: String(route.params.serviceKey),
            mode: 'create'
          }),
          meta: { breadcrumb: 'Applications', breadcrumbItems: (route) => [{ label: String(route.params.serviceKey).replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), to: null }, { label: 'New Application', to: null }] }
        },
        {
          path: 'applications/:serviceKey/:id/edit',
          name: 'application-update',
          component: () => import('@/pages/ApplicationWizardPage.vue'),
          beforeEnter: guardApplicationService,
          props: (route) => ({
            serviceKey: String(route.params.serviceKey),
            mode: 'update'
          }),
          meta: { breadcrumb: 'Applications', breadcrumbItems: (route) => [{ label: 'Edit ' + String(route.params.id).slice(0, 12), to: null }] }
        },
        {
          path: 'applications/:serviceKey/:id',
          name: 'application-details',
          component: () => import('@/pages/ApplicationDetailsPage.vue'),
          beforeEnter: guardApplicationService,
          meta: { breadcrumb: 'Applications', breadcrumbItems: (route) => [{ label: String(route.params.id).slice(0, 12), to: null }] }
        },
        {
          path: 'applications/:serviceKey/:id/preview',
          name: 'application-preview',
          component: () => import('@/pages/ApplicationPreviewPage.vue'),
          beforeEnter: guardApplicationService,
          meta: {
            breadcrumb: 'Applications',
            breadcrumbItems: (route) => [
              { label: String(route.params.id).slice(0, 12), to: { name: 'application-details', params: { serviceKey: route.params.serviceKey, id: route.params.id } } },
              { label: 'Preview', to: null }
            ]
          }
        },
        {
          path: 'applications/:serviceKey/preview',
          name: 'application-preview-draft',
          component: () => import('@/pages/ApplicationPreviewPage.vue'),
          beforeEnter: guardApplicationService,
          meta: {
            breadcrumb: 'Applications',
            breadcrumbItems: () => [{ label: 'Draft Preview', to: null }]
          }
        },
        {
          path: 'applications/new',
          redirect: `/portal/applications/${DEFAULT_APPLICATION_SERVICE_KEY}/create`
        },
        {
          path: 'applications/:id',
          redirect: '/portal/applications'
        },
        {
          path: 'payments',
          name: 'payments',
          component: () => import('@/pages/PaymentsPage.vue'),
          meta: { breadcrumb: 'Payments' }
        },
        {
          path: 'payments/:id',
          name: 'payment-details',
          component: () => import('@/pages/PaymentDetailsPage.vue'),
          meta: { breadcrumb: 'Payments', breadcrumbItems: (route) => [{ label: String(route.params.id).slice(0, 12), to: null }] }
        },
        {
          path: 'certificates',
          name: 'certificates',
          component: () => import('@/pages/CertificatesPage.vue'),
          meta: { breadcrumb: 'Certificates' }
        },
        {
          path: 'certificates/:id',
          name: 'certificate-details',
          component: () => import('@/pages/CertificateDetailsPage.vue'),
          meta: { breadcrumb: 'Certificates', breadcrumbItems: (route) => [{ label: String(route.params.id).slice(0, 12), to: null }] }
        },
        {
          path: 'messages',
          name: 'messages',
          component: () => import('@/pages/MessagesPage.vue'),
          meta: { breadcrumb: 'Messages' }
        },
        {
          path: 'support',
          name: 'support',
          component: () => import('@/pages/SupportPage.vue'),
          meta: { breadcrumb: 'Support' }
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('@/pages/SettingsPage.vue'),
          meta: { breadcrumb: 'Settings' }
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('@/pages/ProfilePage.vue'),
          meta: { breadcrumb: 'Profile' }
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/pages/NotFoundPage.vue')
    }
  ]
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  authStore.restoreSession()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return {
      name: 'login',
      query: { redirect: to.fullPath }
    }
  }

  if (to.meta.requiresApplicantAccess && !authStore.hasApplicantPortalAccess) {
    return { name: 'unauthorized' }
  }

  if ((to.name === 'login' || to.name === 'register') && authStore.isAuthenticated) {
    return authStore.hasApplicantPortalAccess
      ? { name: 'dashboard' }
      : { name: 'unauthorized' }
  }

  if (to.name === 'unauthorized' && authStore.hasApplicantPortalAccess) {
    return { name: 'dashboard' }
  }

  return true
})

router.afterEach((to) => {
  const breadcrumb = to.meta?.breadcrumb || ''
  const title = to.meta?.title || breadcrumb
  document.title = title ? `${title} — FCC Applicants Portal` : 'FCC Applicants Portal'
})

export default router
