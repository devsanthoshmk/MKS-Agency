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

// scrollToProducts function imported
let isFirstLoad = true
// intersection observer for updating products route
const scrollObserver = new IntersectionObserver(
    (entries) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting && route.name === 'home') {
        // Scrolled past hero - change to /products
        router.replace({ path: '/products', query: route.query })
        } else if (entry.isIntersecting && route.name === 'products' && !Object.keys(route.query).length) {
        // Scrolled back to hero - change to /
        router.replace({ path: '/' })
        }
    })
    },
    { threshold: 0.1 }
)
function scrollToProducts() {
    if (isFirstLoad) {

        isFirstLoad = false
    }
}

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
                const slug=to.params.slug
                const product = getProductBySlug(slug)
                if (product) {
                openModal('product', product)
                }
                next()
            },
            meta: { title: 'Product Details - MKS Ayurvedic' }
        },
        {
            path: '/cart',
            name: 'cart',
            component: HomePage,
            meta: { title: 'Cart - MKS Ayurvedic' }
        },
        {
            path: '/wishlist',
            name: 'wishlist',
            component: HomePage,
            meta: { title: 'Wishlist - MKS Ayurvedic' }
        },
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
        if (to.hash) {
            return { el: to.hash, behavior: 'smooth' }
        }
        // Don't scroll to top when switching between modal routes
        if (to.name === 'product-detail' || to.name === 'cart' ||
            to.name === 'wishlist' || to.name === 'checkout' || to.name === 'orders') {
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

// Create and mount app
const app = createApp(App)
app.use(router)
app.mount('#app')
