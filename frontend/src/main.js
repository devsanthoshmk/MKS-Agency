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

// Router Configuration
const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomePage,
            meta: { title: 'MKS Ayurvedic - Natural Health Solutions' }
        },
        {
            path: '/products',
            name: 'products',
            component: HomePage,
            meta: { title: 'Products - MKS Ayurvedic' }
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
            meta: { title: 'Product Details - MKS Ayurvedic' }
        },
        // Cart and wishlist are now handled via hash fragments (e.g., /products#wishlist)
        {
            path: '/checkout',
            name: 'checkout',
            component: HomePage,
            meta: { title: 'Checkout - MKS Ayurvedic' }
        },
        {
            path: '/orders',
            name: 'orders',
            component: HomePage,
            meta: { title: 'My Orders - MKS Ayurvedic' }
        },
        {
            path: '/verify/:token',
            name: 'guest-verify',
            component: GuestVerification,
            meta: { title: 'Verify Your Order - MKS Ayurvedic' }
        },
        {
            path: '/admin',
            name: 'admin',
            component: AdminDashboard,
            meta: { title: 'Admin Dashboard - MKS Ayurvedic' }
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
        // Don't scroll for cart/wishlist hash navigation
        if (to.hash === '#cart' || to.hash === '#wishlist') {
            return false
        }
        if (to.hash) {
            return { el: to.hash, behavior: 'smooth' }
        }
        // Don't scroll to top when switching between modal routes
        if (to.name === 'product-detail' || to.name === 'checkout' || to.name === 'orders') {
            return false
        }
        return { top: 0 }
    }
})

// Update page title on route change
router.beforeEach((to, from, next) => {
    document.title = to.meta.title || 'MKS Ayurvedic'
    next()
})

// Expose router globally for composables
window.__vueRouter = router

// Create and mount app
const app = createApp(App)
app.use(router)
app.mount('#app')
