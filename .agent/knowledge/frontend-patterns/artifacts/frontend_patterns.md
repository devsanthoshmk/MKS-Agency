# MKS Agencies — Frontend Patterns

## Vue.js 3 — Composition API Only

### ✅ CORRECT Pattern
```javascript
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuth } from '../composables/useAuth'

const { user, isAuthenticated } = useAuth()
const isLoading = ref(false)
</script>
```

### ❌ NEVER Use Options API
```javascript
// FORBIDDEN in this project
export default {
  data() { return {} },
  computed: {},
  methods: {}
}
```

## Composable Rules (Singleton Pattern)

1. **All state management lives in composables** — never in components directly
2. Composables use `ref()` and `computed()` for reactive state
3. Each composable is a **singleton pattern** using module-level state
4. API calls use `fetch()` with `VITE_API_URL` environment variable
5. Error handling wraps every API call in try/catch

### API Call Pattern
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

async function fetchData() {
  try {
    const response = await fetch(`${API_URL}/api/endpoint`, {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    const data = await response.json()
    if (response.ok && data.success) {
      // handle success
    } else {
      // handle API error
    }
  } catch (e) {
    // handle network error
  }
}
```

### Available Composables
| File | Purpose |
|------|---------|
| `useAuth.js` | Authentication state & methods |
| `useCart.js` | Cart state & methods |
| `useOrders.js` | Order state & methods |
| `useProducts.js` | Products state, filtering, search |
| `useWishlist.js` | Wishlist state & methods |
| `useUI.js` | Toast notifications, modals |

## Component Rules

1. **Props**: Use `defineProps()` with type definitions
2. **Emits**: Use `defineEmits()` for all custom events
3. **Slots**: Prefer named slots for complex components
4. **CSS**: Use Tailwind utility classes — minimal custom CSS
5. **Images**: Lazy load with `loading="lazy"` attribute
6. **Icons**: Use inline SVGs (no icon library installed)
7. **Modals/Panels**: Follow existing slide-panel pattern (CartPanel, WishlistPanel)

## Tailwind CSS 4 Rules

- Using `@tailwindcss/vite` plugin (Tailwind 4 — NOT the old PostCSS plugin)
- Custom design tokens defined in `style.css` (surface colors, primary colors)
- Use existing utility patterns: `gradient-hero`, `gradient-primary`, `btn`, `btn-primary`
- Font stack: `font-display` for headings, system fonts for body

## Convex-Vue Integration

- Uses `convex-vue` package for reactive queries
- Convex client initialized in `main.js`
- Use `useQuery()` and `useMutation()` from convex-vue for real-time data
- Convex URL: `VITE_CONVEX_URL` environment variable

## Routing

- Routes defined in `frontend/src/main.js` using `vue-router`
- Use `useRoute()` and `useRouter()` from `vue-router`
- Dynamic routes use params (e.g., `/verify/:token`)

## Performance Rules

1. **Lazy load images**: Use `loading="lazy"` on all product images
2. **Debounce search**: 300ms debounce on search input filtering
3. **Virtual scrolling**: Consider for product listings > 100 items
4. **Cache products**: Products are static JSON — cache in composable state
5. **Minimize re-renders**: Use `computed()` for derived state, `shallowRef()` for large lists
6. **Code split**: Route-level lazy loading for AdminDashboard
7. Use `v-if` over `v-show` for expensive components
8. Keep component template expressions simple (move logic to setup)

## Error Handling Pattern
```javascript
import { useUI } from '../composables/useUI'
const { success, error: showError } = useUI()

try {
  const response = await fetch(`${API_URL}/api/orders`, { ... })
  const data = await response.json()

  if (!response.ok) {
    showError(data.error || 'Something went wrong')
    return
  }

  success('Order placed successfully!')
} catch (e) {
  showError('Network error. Please check your connection.')
}
```

## Vue Template Conventions
```html
<!-- ✅ Use v-if for conditional rendering -->
<div v-if="isLoading" class="spinner" />
<div v-else-if="error" class="error">{{ error }}</div>
<div v-else>{{ data }}</div>

<!-- ✅ Use :key on v-for -->
<ProductCard v-for="product in filteredProducts" :key="product.id" :product="product" />

<!-- ✅ Use @ shorthand for events -->
<button @click="handleSubmit">Submit</button>

<!-- ✅ Use : shorthand for bindings -->
<img :src="product.image" :alt="product.name" loading="lazy" />
```

## Code Style
- **Indentation**: 2 spaces
- **Quotes**: Single quotes
- **Semicolons**: None
- **const** by default, `let` only when reassignment is needed
- **Destructure** when accessing multiple properties
- **Template literals** for string interpolation
- **Arrow functions** for callbacks and handlers
- **Optional chaining** and **nullish coalescing** (`user?.name ?? 'Guest'`)
