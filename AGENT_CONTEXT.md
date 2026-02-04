```markdown
# My Notebook - Knowledge Graph Application

Refactoring of the legacy "My Notebook" (React/Express/MongoDB) into a modern TypeScript Next.js application.

## 🚀 Current Architecture (February 2025)

### Migration Status: Phase 2 Complete ✅
Przejście z hierarchii parent-child na grafową architekturę tag-based.

**Przed:** Drzewo (articles.childs[])
**Teraz:** Graf skierowany acykliczny (DAG)
- Artykuły wskazują na rodziców przez `tags[]` (wiele rodziców)
- Struktura drzewiasta realizowana przez zapytania (nie storage)

---

## 🏗 Data Model Architecture

### Article Schema
```typescript
interface IArticle {
  _id: ObjectId;
  title: string;
  description: string;        // HTML content (TinyMCE)
  summary: string;           // System tags (#main, #unassigned) + notes
  
  // HIERARCHY (NEW)
  tags: string[];            // IDs of parent articles (inverted relationship)
  parts: string[];           // IDs of embedded sub-articles (PART type)
  
  // Legacy (DO NOT USE - for migration only)
  childs: {id: string, type: 'LINK'|'PART'}[];  // DEPRECATED
  
  // Access Control
  write_list: string[];      // ['all'] or ['user1', 'user2']
  read_list: string[];       // ['all'] by default
  
  // Meta
  art_no: number;
  shortname: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Topic Schema (Categories)
```typescript
interface ITopic {
  _id: ObjectId;
  name: string;              // Display name (e.g., "Functional Programming")
  slug: string;              // URL-friendly (e.g., "functional-programming")
  description: string;
  parent_tags: string[];     // IDs of parent topics (for category hierarchy)
}
```

### Key Relationships Diagram
```
┌─────────────────┐         ┌─────────────────┐
│   Article A     │◄────────│   Article B     │
│   (Parent)      │  tags   │   (Child)       │
│                 │         │   tags: [A_id]  │
└────────┬────────┘         └─────────────────┘
         │
         │ embeds (parts)
         ▼
┌─────────────────┐
│   Article C     │
│   (Sub-content) │
│   Standalone    │
└─────────────────┘
```

---

## 🎯 Core Logic & Algorithms

### 1. Hierarchical Navigation (Navigator)
**Plik:** `components/Navigator.tsx`

```typescript
// Pobieranie rodziców (breadcrumb)
const parentArticles = articles.filter(art => 
  currentArticle.tags?.includes(art._id.toString())
);
```

Mechanizm: Dziecko przechowuje ID rodziców w `tags`. Rodzice są wyszukiwani runtime w całej liście artykułów.

### 2. Finding Children (Sidebar - Related)
**Plik:** `components/Sidebar.tsx` (zakładka Related)

```typescript
// Znajdź artykuły które wskazują na current jako rodzica
const relatedArticles = articles.filter(art => 
  art.tags?.includes(currentArticle._id.toString()) && 
  art._id !== currentArticle._id
);
```

### 3. Orphan Handling (Auto-assignment)
**Plik:** `context/ArticleContext.tsx`

```typescript
// Wejście do #unassigned = adopcja osieroconych
if (article.summary === '#unassigned') {
  const orphans = articles.filter(a => 
    !a.tags?.length && 
    !a.summary?.includes('#main')
  );
  // Automatyczne przypisanie tagu #unassigned
}
```

### 4. Parts System (Embedded Content)
**Plik:** `components/ArticleView.tsx`, `ArticleEditor.tsx`

- `parts: string[]` przechowuje ID artykułów do osadzenia w treści
- Renderowane inline pod głównym contentem
- Różnica: `tags` = nawigacja, `parts` = kompozycja treści

---

## 🧩 Component Responsibilities

### Navigator (Breadcrumb)
- **Input:** `currentArticle.tags[]`
- **Render:** Lista przycisków rodziców (klikalnych)
- **Logic:** String comparison z konwersją ObjectId

### Sidebar
Trzy zakładki:
1. **Related** - Artykuły które mają `current._id` w swoich `tags`
2. **Parts** - Artykuły z `current.parts[]` (tylko w trybie edycji)
3. **Store** - Lokalny "schowek" użytkownika (React state only)

Zarządzanie relacjami (w trybie Edit):
- **Link** (zielona ikona): Dodaje ID rodzica do `child.tags`
- **Unlink** (czerwona ikona): Usuwa ID z `child.tags`
- **Attach as Part** (fioletowa): Dodaje do `current.parts`
- **Detach** (X): Usuwa z `current.parts`

### ArticleView / ArticleEditor
- TinyMCE dla edycji HTML
- `renderChildParts()` - wyświetla artykuły z `parts[]` pod treścią
- Syntax highlighting (highlight.js) dla bloków kodu
- DOMPurify z konfiguracją dla iframe (YouTube embeds)

---

## 📡 API Routes

### Articles API
```
GET    /api/articles       -> List all
POST   /api/articles       -> Create new
GET    /api/articles/[id]  -> Get single
PUT    /api/articles/[id]  -> Update (nadpisuje cały dokument)
DELETE /api/articles/[id]  -> Remove
```

### Topics API
```
GET    /api/topics         -> List all categories
POST   /api/topics         -> Create category
PUT    /api/topics/[id]    -> Update category
```

### Auth API
```
POST   /api/auth           -> Login
GET    /api/auth           -> Get user (wymaga tokena)
POST   /api/register       -> Register new user
```

---

## 🗃 Database Scripts (Migration Strategy)

### Wymagane zmiany w MongoDB

**1. Article Schema Indexes**
```javascript
// Efektywne wyszukiwanie po tagach
db.articles.createIndex({ tags: 1 });
db.articles.createIndex({ summary: 1 });  // Dla #main, #unassigned
db.articles.createIndex({ parts: 1 });
```

**2. Migration Scripts Sequence**
1. `migrate-to-tags.ts` - Przepisanie relacji z childs do tags
2. `migrate-parts.ts` - Wyodrębnienie PART z childs do osobnego pola parts
3. `clear-all-tags.ts` - Resetowanie (dla ponownej migracji)

### Current Data State
- Każdy artykuł MA pole `tags` (lista stringów, nigdy null/undefined)
- Każdy artykuł MA pole `parts` (lista stringów, domyślnie [])
- Pole `childs` zachowane dla backward compatibility (można usunąć w Phase 3)

---

## 🔍 Query Patterns (for AI Agents)

### Find all articles under specific parent
```typescript
const children = articles.filter(a => 
  a.tags.includes(parentId)
);
```

### Find root articles (for #unassigned view)
```typescript
const orphans = articles.filter(a => 
  a.tags.length === 0 && 
  !a.summary.includes('#main') &&
  !a.summary.includes('#unassigned')
);
```

### Multi-parent breadcrumb
Artykuł może mieć wielu rodziców (wiele ścieżek w nawigacji):
```
Parent A > Current Article
Parent B > Current Article
```
Navigator wyświetla WSZYSTKICH rodziców z `tags[]`.

---

## 🚨 Anti-patterns & Constraints

### ❌ NIE RÓB TEGO:
1. **Nie modyfikuj `childs`** - To pole jest legacy, do usunięcia w Phase 3
2. **Nie zakładaj że graf jest drzewem** - Artykuły mogą mieć wielu rodziców (DAG)
3. **Nie parsuj `summary`** - Używaj tylko do wykrywania `#main` i `#unassigned`
4. **Nie mutuj `tags` bezpośrednio** - Zawsze przez `updateArticle()` (zapis do API)

### ✅ ZAWSZE RÓB TAK:
1. **Konwertuj ObjectId do string** przy porównaniach:
   ```typescript
   article._id.toString() === tagId
   ```
2. **Używaj `.some()` dla sprawdzania** tagów:
   ```typescript
   article.tags.some(t => t === parentId)
   ```
3. **Obsługuj puste listy** - Zawsze zakładaj że `tags` i `parts` mogą być `[]`
4. **Zabezpieczaj przed duplikatami** - Używaj `new Set()` lub `$addToSet` w Mongo

---

## 🎨 UI/UX Styling Parity (Critical Constants)

### Brand Colors
- **Header Background:** `#58448a` (fioletowy)
- **Navigator Background:** `#282a36`
- **Sidebar Background:** `#21222c`
- **Main Content Background:** `#2E3436` lub przezroczysty (zależnie od theme)

### Typography
- **Logo:** `Special Elite` (Google Fonts)
- **Content:** `Crete Round` (Google Fonts), size `22px`, line-height `1.4`
- **UI Elements:** System monospace (Geist Mono)

### Component Colors
| Element | Border | Text | Hover |
|---------|--------|------|-------|
| Related (Link) | `#D57E31` | `#ABA864` | `#CABE4B` |
| Parts | `#C792EA` (purple) | `#C792EA` | `#FF80BF` |
| Navigator Items | `#3465A4` | `#1D8D85` | `#CABE4B` |
| Arrow (Navigator) | - | `#4AC74D` | - |
| Store | `#44475a` | `text-foreground` | `text-orange` |

### Layout Dimensions
- Navbar Height: `60px`
- Navigator Height: `37px`
- Sidebar Width: `320px` (`w-80`)

---

## 🔄 Next.js App Router Structure

```
app/
├── api/
│   ├── articles/        # CRUD operations
│   ├── topics/          # Category management
│   ├── auth/            # JWT login
│   └── register/        # User registration
├── layout.tsx           # Providers (Auth, Article)
├── page.tsx             # Main UI (Navbar, Sidebar, Editor/View)
├── login/               # Login page
└── register/            # Registration page

components/
├── Navbar.tsx           # Search, user actions, mode toggle
├── Navigator.tsx        # Breadcrumbs (parents from tags)
├── Sidebar.tsx          # Related, Parts (edit only), Store
├── ArticleView.tsx      # Content + renderChildParts
└── ArticleEditor.tsx    # TinyMCE + parts preview

context/
├── ArticleContext.tsx   # Global state, API calls
└── AuthContext.tsx      # JWT, user session

models/
├── Article.ts           # Mongoose schema + TypeScript types
├── Topic.ts             # Category model
└── User.ts              # Auth model

lib/
├── db.ts                # MongoDB connection (singleton)
└── graph-queries.ts     # (OPTIONAL) Pure functions for DAG traversal
```

---

## 🚦 Development Guidelines

### Adding Features
1. **Nowe relacje** - Używaj `tags[]` (nie `childs`)
2. **Pod-artykuły** - Dodawaj do `parts[]` (nie `childs` z typem PART)
3. **Kategorie** - Używaj kolekcji `topics` (osobna od hierarchii artykułów)
4. **Stan lokalny** - Używaj `ArticleContext` (nie props drilling)

### Testing Changes
1. Sprawdź czy Navigator pokazuje rodziców po odświeżeniu
2. Sprawdź czy Related aktualizuje się po dodaniu/usunięciu linku
3. Sprawdź czy Parts wyświetlają się w treści i w zakładce (tylko edit)
4. Sprawdź czy #unassigned zbiera osierocone artykuły

### Deployment Notes
- **GitHub Pages:** `output: 'export'`, `basePath: '/my-notebook'`
- **Vercel:** Dynamic rendering, API routes active
- **MongoDB:** Wymagane indexes na `tags` i `parts`

---

## 📋 TODO (Future Development)

### Phase 3 (Cleanup)
- [ ] Usunąć pole `childs` ze schemy Artykułu
- [ ] Usunąć logikę parsowania `childs` z `INIT_APPLICATION`
- [ ] Skrypt `remove-childs-field.ts` (destructive migration)
- [ ] Aktualizacja `Sidebar` - usunąć zakładkę Related (jeśli przeniesiona do Topics)

### Phase 4 (Enhancements)
- [ ] Drag & drop w Sidebar do zarządzania Parts
- [ ] Bulk operations na tagach (multi-select)
- [ ] History/Undo dla zmian w hierarchii
- [ ] Full-text search w treści artykułów (MongoDB Atlas Search)

---

## 🔗 Git Remotes
- `origin`: `git@github.com:damiik/my-notebook.git` (GitHub Pages)
- `vercel-repo`: `git@github.com:damiik/my-notebook2.git` (Vercel mirror)
```