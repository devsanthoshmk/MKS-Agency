/**
 * Products Composable
 * Handles product data loading, caching, filtering, and search
 */

import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Cache keys
const CACHE_KEY = 'mks_products_cache'
const CACHE_VERSION_KEY = 'mks_products_version'

// In-memory cache
let memoryCache = null
let memoryCacheVersion = null

// Product data
const products = ref([])
const categories = ref([])
const isLoading = ref(false)
const error = ref(null)
const dataVersion = ref(null)

// Filter state
const filters = ref({
    category: '',
    minPrice: null,
    maxPrice: null,
    search: '',
    sort: 'default', // 'default', 'price-asc', 'price-desc', 'newest'
    tags: []
})

export function useProducts() {
    const route = useRoute()
    const router = useRouter()

    // Load products from JSON
    async function loadProducts(forceRefresh = false) {
        // Return from memory cache if available
        if (memoryCache && !forceRefresh) {
            products.value = memoryCache.products
            categories.value = memoryCache.categories
            dataVersion.value = memoryCacheVersion
            return
        }

        // Try localStorage cache
        if (!forceRefresh) {
            try {
                const cached = localStorage.getItem(CACHE_KEY)
                const cachedVersion = localStorage.getItem(CACHE_VERSION_KEY)

                if (cached && cachedVersion) {
                    const data = JSON.parse(cached)
                    products.value = data.products
                    categories.value = data.categories
                    dataVersion.value = cachedVersion

                    // Update memory cache
                    memoryCache = data
                    memoryCacheVersion = cachedVersion

                    // Fetch in background to check for updates
                    fetchProductsInBackground()
                    return
                }
            } catch (e) {
                console.warn('Cache read failed:', e)
            }
        }

        // Fetch fresh data
        await fetchProducts()
    }

    async function fetchProducts() {
        isLoading.value = true
        error.value = null

        try {
            // Dynamic import of products.json
            const data = await import('@/assets/products.json')

            products.value = data.products || []
            categories.value = data.categories || []
            dataVersion.value = data.version || Date.now().toString()

            // Update caches
            const cacheData = {
                products: data.products,
                categories: data.categories
            }

            memoryCache = cacheData
            memoryCacheVersion = data.version

            try {
                localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
                localStorage.setItem(CACHE_VERSION_KEY, data.version)
            } catch (e) {
                console.warn('Cache write failed:', e)
            }
        } catch (e) {
            error.value = 'Failed to load products'
            console.error('Product load error:', e)
        } finally {
            isLoading.value = false
        }
    }

    async function fetchProductsInBackground() {
        try {
            const data = await import('@/assets/products.json')

            // Check if version changed
            if (data.version !== dataVersion.value) {
                products.value = data.products || []
                categories.value = data.categories || []
                dataVersion.value = data.version

                const cacheData = {
                    products: data.products,
                    categories: data.categories
                }

                memoryCache = cacheData
                memoryCacheVersion = data.version

                localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
                localStorage.setItem(CACHE_VERSION_KEY, data.version)
            }
        } catch (e) {
            console.warn('Background fetch failed:', e)
        }
    }

    // Sync filters with URL
    function syncFiltersFromUrl() {
        const query = route.query
        filters.value = {
            category: query.category || '',
            minPrice: query.minPrice ? Number(query.minPrice) : null,
            maxPrice: query.maxPrice ? Number(query.maxPrice) : null,
            search: query.search || '',
            sort: query.sort || 'default',
            tags: query.tags ? query.tags.split(',') : []
        }
    }

    function updateUrlFromFilters() {
        const query = {}

        if (filters.value.category) query.category = filters.value.category
        if (filters.value.minPrice) query.minPrice = filters.value.minPrice
        if (filters.value.maxPrice) query.maxPrice = filters.value.maxPrice
        if (filters.value.search) query.search = filters.value.search
        if (filters.value.sort !== 'default') query.sort = filters.value.sort
        if (filters.value.tags.length) query.tags = filters.value.tags.join(',')

        // Only update if on products page
        if (route.name === 'products' || route.name === 'home') {
            router.replace({
                path: Object.keys(query).length ? '/products' : route.path,
                query
            })
        }
    }

    // Debounced search
    let searchTimeout = null
    function setSearch(value) {
        if (searchTimeout) clearTimeout(searchTimeout)
        searchTimeout = setTimeout(() => {
            filters.value.search = value
            updateUrlFromFilters()
        }, 300)
    }

    function setFilter(key, value) {
        filters.value[key] = value
        updateUrlFromFilters()
    }

    function clearFilters() {
        filters.value = {
            category: '',
            minPrice: null,
            maxPrice: null,
            search: '',
            sort: 'default',
            tags: []
        }
        updateUrlFromFilters()
    }

    // Filtered and sorted products
    const filteredProducts = computed(() => {
        let result = [...products.value]

        // Filter by active status
        result = result.filter(p => p.isActive !== false)

        // Filter by category
        if (filters.value.category) {
            result = result.filter(p =>
                p.category === filters.value.category ||
                p.subcategory === filters.value.category
            )
        }

        // Filter by price range
        if (filters.value.minPrice !== null) {
            result = result.filter(p => p.price >= filters.value.minPrice)
        }
        if (filters.value.maxPrice !== null) {
            result = result.filter(p => p.price <= filters.value.maxPrice)
        }

        // Filter by tags
        if (filters.value.tags.length > 0) {
            result = result.filter(p =>
                p.tags && filters.value.tags.some(tag => p.tags.includes(tag))
            )
        }

        // Search
        if (filters.value.search) {
            const searchLower = filters.value.search.toLowerCase()
            result = result.filter(p =>
                p.name.toLowerCase().includes(searchLower) ||
                p.description?.toLowerCase().includes(searchLower) ||
                p.category?.toLowerCase().includes(searchLower) ||
                p.tags?.some(tag => tag.toLowerCase().includes(searchLower))
            )
        }

        // Sort
        switch (filters.value.sort) {
            case 'price-asc':
                result.sort((a, b) => a.price - b.price)
                break
            case 'price-desc':
                result.sort((a, b) => b.price - a.price)
                break
            case 'newest':
                // Assuming products are in order of creation, newest first
                result.reverse()
                break
            default:
                // Default: bestsellers first
                result.sort((a, b) => {
                    const aIsBest = a.tags?.includes('bestseller') ? 1 : 0
                    const bIsBest = b.tags?.includes('bestseller') ? 1 : 0
                    return bIsBest - aIsBest
                })
        }

        return result
    })

    // Get product by slug
    function getProductBySlug(slug) {
        return products.value.find(p => p.slug === slug)
    }

    // Get products by category
    function getProductsByCategory(category, limit = null) {
        let result = products.value.filter(p =>
            p.category === category || p.subcategory === category
        )
        if (limit) result = result.slice(0, limit)
        return result
    }

    // Get related products
    function getRelatedProducts(product, limit = 4) {
        return products.value
            .filter(p =>
                p.id !== product.id &&
                (p.category === product.category ||
                    p.tags?.some(tag => product.tags?.includes(tag)))
            )
            .slice(0, limit)
    }

    // Price range for filters
    const priceRange = computed(() => {
        if (!products.value.length) return { min: 0, max: 1000 }
        const prices = products.value.map(p => p.price)
        return {
            min: Math.min(...prices),
            max: Math.max(...prices)
        }
    })

    // All unique tags
    const allTags = computed(() => {
        const tags = new Set()
        products.value.forEach(p => {
            p.tags?.forEach(tag => tags.add(tag))
        })
        return Array.from(tags).sort()
    })

    return {
        // Data
        products,
        categories,
        filteredProducts,
        isLoading,
        error,
        dataVersion,

        // Filters
        filters,
        priceRange,
        allTags,

        // Methods
        loadProducts,
        syncFiltersFromUrl,
        setFilter,
        setSearch,
        clearFilters,
        getProductBySlug,
        getProductsByCategory,
        getRelatedProducts
    }
}
