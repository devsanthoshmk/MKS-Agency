import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'

// for models
import { useProducts } from './composables/useProducts'
import { useUI } from './composables/useUI'

const { activeModal, openModal, closeModal, setupEscapeListener, removeEscapeListener } = useUI()
const { loadProducts, getProductBySlug } = useProducts()


// Route Components (lazy loaded)
const HomePage = () => import('./views/HomePage.vue')
const AdminDashboard = () => import('./views/AdminDashboard.vue')
const GuestVerification = () => import('./views/GuestVerification.vue')
const LoginVerification = () => import('./views/LoginVerification.vue')

// Router Configuration
const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomePage,
            meta: { title: 'MKS AGENCY - Siddha & Ayurveda Solutions' }
        },
        {
            path: '/products',
            name: 'products',
            component: HomePage,
            meta: { title: 'Products - MKS AGENCY' }
        },
        {
            path: '/product/:slug',
            name: 'product-detail',
            component: HomePage,
            beforeEnter: (to, from, next) => {
                const slug = to.params.slug
                const product = getProductBySlug(slug)
                if (product) {
                    openModal('product', product)
                }
                next()
            },
            meta: { title: 'Product Details - MKS AGENCY' }
        },
        // Cart and wishlist are now handled via hash fragments (e.g., /products#wishlist)
        {
            path: '/checkout',
            name: 'checkout',
            component: HomePage,
            meta: { title: 'Checkout - MKS AGENCY' }
        },
        {
            path: '/orders',
            name: 'orders',
            component: HomePage,
            meta: { title: 'My Orders - MKS AGENCY' }
        },
        {
            path: '/verify/:token',
            name: 'guest-verify',
            component: GuestVerification,
            meta: { title: 'Verify Your Order - MKS AGENCY' }
        },
        {
            path: '/login/:token',
            name: 'email-login',
            component: LoginVerification,
            meta: { title: 'Sign In - MKS AGENCY' }
        },
        {
            path: '/admin',
            component: AdminDashboard,
            meta: { title: 'Admin Dashboard - MKS AGENCY' },
            redirect: '/admin/analytics',
            children: [
                { path: 'analytics', name: 'admin-analytics', component: { render: () => null }, meta: { title: 'Overview - MKS Admin' } },
                { path: 'orders', name: 'admin-orders', component: { render: () => null }, meta: { title: 'Orders - MKS Admin' } },
                { path: 'products', name: 'admin-products', component: { render: () => null }, meta: { title: 'Products - MKS Admin' } },
                { path: 'content', name: 'admin-content', component: { render: () => null }, meta: { title: 'Content - MKS Admin' } },
                { path: 'settings', name: 'admin-settings', component: { render: () => null }, meta: { title: 'Settings - MKS Admin' } },
            ]
        },
        {
            path: '/:pathMatch(.*)*',
            redirect: '/'
        }
    ],
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition
        }

        if (to.hash) {
            return { el: to.hash, behavior: 'smooth' }
        }
        // Don't scroll to top when switching between modal routes or admin tabs
        if (to.name === 'product-detail' || to.name === 'checkout' || to.name === 'orders' || to.path.startsWith('/admin')) {
            return false
        }
        return { top: 0 }
    }
})

// Update page title on route change
router.beforeEach((to, from, next) => {
    document.title = to.meta.title || 'MKS AGENCY'
    next()
})

// Expose router globally for composables
window.__vueRouter = router

// Create and mount app
const app = createApp(App)
app.use(router)
app.mount('#app')
