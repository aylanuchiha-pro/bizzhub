# BizApp — Architecture complète

## Stack
- React 18 (Vite), pas de routeur — navigation par onglet avec `display:none`
- Supabase (PostgreSQL + Auth + Storage + RLS)
- CSS custom properties (thème clair/sombre), pas de Tailwind ni CSS-in-JS
- Recharts pour les graphiques (Dashboard)

---

## Structure des fichiers

```
src/
├── App.jsx                    ← état global, factories d'actions, objet shared
├── utils.js                   ← helpers, constantes, mappers M (DB ↔ JS)
├── theme.js                   ← CSS() function qui retourne les variables CSS
├── supabase.js                ← client Supabase initialisé
├── components/
│   ├── ui.jsx                 ← composants UI partagés
│   ├── Auth.jsx               ← écran de connexion
│   ├── Sidebar.jsx            ← nav desktop + mobile (MobileNav)
│   └── ProductFormModal.jsx   ← modal ajout/édition produit (réutilisé dans Orders)
└── views/
    ├── Dashboard.jsx
    ├── Products.jsx
    ├── Sales.jsx
    ├── Rentals.jsx
    ├── Partners.jsx
    ├── Subscriptions.jsx
    ├── BizExpenses.jsx
    ├── Businesses.jsx
    ├── Orders.jsx
    ├── Trash.jsx
    └── Changelog.jsx
```

---

## Objet `shared` — passé via `{...shared}` à toutes les vues

### État (tableaux JS, jamais filtrés ici)
| Champ JS | Supabase table | Note |
|---|---|---|
| `biz` | `businesses` | inclut soft-deleted (filtrage dans la vue) |
| `prods` | `products` | |
| `sales` | `sales` | |
| `rentalAssets` | `rental_assets` | |
| `rentalBookings` | `rental_bookings` | |
| `partners` | `partners` | |
| `salePartners` | `sale_partners` | pas de soft-delete, pas de deletedAt |
| `payments` | `partner_payments` | pas de soft-delete |
| `subs` | `subscriptions` | |
| `expenses` | `product_expenses` | pas de soft-delete |
| `bizExpenses` | `biz_expenses` | |
| `orders` | `orders` | |
| `orderItems` | `order_items` | pas de soft-delete |

### Actions (factories)
| Variable | Type | Méthodes disponibles |
|---|---|---|
| `bizA` | mkActions | add, update, softDel, restore, hardDel |
| `prodA` | mkActions | add, update, softDel, restore, hardDel |
| `saleA` | mkActions | add, update, softDel, restore, hardDel |
| `assetA` | mkActions | add, update, softDel, restore, hardDel |
| `bookingA` | mkActions | add, update, softDel, restore, hardDel |
| `partnerA` | mkActions | add, update, softDel, restore, hardDel |
| `spA` | mkActions | add, update, softDel, restore, hardDel |
| `subA` | mkActions | add, update, softDel, restore, hardDel |
| `bizExpenseA` | mkActions | add, update, softDel, restore, hardDel |
| `orderA` | mkActions | add, update, softDel, restore, hardDel |
| `orderItemA` | mkSimpleActions | add, update, hardDel (pas de soft-delete) |
| `expenseA` | custom | add, hardDel seulement |
| `paymentA` | mkPaymentActions | add, hardDel seulement |
| `deleteBiz` | custom async | soft-delete en cascade : biz + prods + sales + assets + bookings + subs |
| `deleteOrderHard` | custom async | hard-delete order + tous ses orderItems |

### Autres champs dans shared
- `focusProduct` / `setFocusProduct` — produit à scroller/mettre en avant dans Products
- `onNavigateToProduct(productId)` — navigate vers onglet Products + focusProduct

---

## Patterns clés

### Optimistic update
```js
const prev = state;
setState(optimistic_value);
const { error } = await supabase...
if (error) setState(prev); // rollback
```

### Soft-delete
- Champ `deletedAt` (timestamp ms en JS, `deleted_at` ISO en DB)
- `active(arr)` → filtre `deletedAt` falsy
- `trashed(arr)` → filtre `deletedAt` truthy ET dans les 30j
- `TRASH_MS = 30 * 864e5` ms
- Items expirés (> 30j) sont ignorés au chargement via le filtre `keep`

### DB ↔ JS mappers (`M` dans utils.js)
Chaque entité a `M.xxx.from(row)` (DB→JS) et `M.xxx.to(obj, userId)` (JS→DB).

---

## Schéma DB complet (champs JS ↔ colonnes DB)

### `businesses` → `M.biz`
| JS | DB |
|---|---|
| id | id |
| name | name |
| color | color (hex) |
| deletedAt | deleted_at |

### `products` → `M.prod`
| JS | DB |
|---|---|
| id | id |
| bizId | biz_id |
| name | name |
| category | category (`physical`\|`service`\|`digital`) |
| buyPrice | buy_price |
| sellPrice | sell_price |
| stock | stock |
| unit | unit |
| description | description |
| images | images (array URLs Supabase Storage) |
| available | available (bool, badge "Dispo") |
| size | size (taille unique texte, null si sizes actif) |
| sizes | sizes (objet `{S,M,L,XL,XXL: number}` ou null) |
| deletedAt | deleted_at |

### `sales` → `M.sale`
| JS | DB |
|---|---|
| id | id |
| bizId | biz_id |
| productId | product_id (nullable) |
| name | name |
| qty | qty |
| sellPrice | sell_price |
| costPrice | cost_price |
| date | sale_date |
| notes | notes |
| size | size (nullable) |
| paymentStatus | payment_status (`complet`\|`acompte`) |
| depositAmount | deposit_amount |
| deletedAt | deleted_at |

### `sale_partners` → `M.sp`
| JS | DB |
|---|---|
| id | id |
| saleId | sale_id |
| partnerId | partner_id |
| sharePct | share_pct |
| amountDue | amount_due |

*(pas de deletedAt — hardDel uniquement)*

### `partners` → `M.partner`
| JS | DB |
|---|---|
| id | id |
| name | name |
| notes | notes |
| deletedAt | deleted_at |

### `partner_payments` → `M.payment`
| JS | DB |
|---|---|
| id | id |
| partnerId | partner_id |
| amount | amount |
| date | payment_date |
| notes | notes |

*(pas de deletedAt)*

### `rental_assets` → `M.asset`
| JS | DB |
|---|---|
| id | id |
| bizId | biz_id |
| name | name |
| monthlyCost | monthly_cost |
| notes | notes |
| deletedAt | deleted_at |

### `rental_bookings` → `M.booking`
| JS | DB |
|---|---|
| id | id |
| assetId | asset_id |
| sellPrice | sell_price |
| startDate | start_date |
| endDate | end_date (nullable) |
| status | status (`confirmee`\|`en_cours`\|`terminee`\|`annulee`) |
| notes | notes |
| deletedAt | deleted_at |

### `subscriptions` → `M.sub`
| JS | DB |
|---|---|
| id | id |
| bizId | biz_id |
| name | name |
| amount | amount |
| cycle | cycle (`monthly`\|`annual`\|`weekly`) |
| nextDate | next_billing_date |
| active | active (bool) |
| notes | notes |
| deletedAt | deleted_at |

### `product_expenses` → `M.expense`
| JS | DB |
|---|---|
| id | id |
| productId | product_id |
| label | label |
| amount | amount |
| date | expense_date |

*(pas de deletedAt — hardDel uniquement)*

### `biz_expenses` → `M.bizExpense`
| JS | DB |
|---|---|
| id | id |
| bizId | biz_id (nullable) |
| productId | product_id (nullable) |
| label | label |
| amount | amount |
| date | expense_date |
| notes | notes |
| deletedAt | deleted_at |

### `orders` → `M.order`
| JS | DB |
|---|---|
| id | id |
| bizId | biz_id (nullable) |
| reference | reference |
| supplier | supplier (nullable) |
| date | order_date |
| expectedDate | expected_date (nullable) |
| status | status (`en_attente`\|`en_cours`\|`recu`\|`annule`) |
| notes | notes |
| deletedAt | deleted_at |

### `order_items` → `M.orderItem`
| JS | DB |
|---|---|
| id | id |
| orderId | order_id |
| productId | product_id (nullable) |
| name | name |
| qty | qty |
| unitPrice | unit_price |
| size | size (nullable) |
| notes | notes |

*(pas de deletedAt — mkSimpleActions)*

---

## Constantes (utils.js)

```js
LOW = 5           // seuil stock faible
TRASH_MS = 30 * 864e5   // 30 jours en ms
CATS = [physical, service, digital]
UNITS = ["unité(s)", "heure(s)", "licence(s)", "exemplaire(s)", "lot(s)", "kg", "litre(s)"]
SIZES = ["S", "M", "L", "XL", "XXL"]
CYCLES = [monthly, annual, weekly]
BOOKING_STATUS = [confirmee, en_cours, terminee, annulee]
PALETTE = 10 couleurs hex pour les activités
MO = noms des mois courts en français
```

---

## Utilitaires (utils.js)

```js
euro(n)           // format monétaire "1 234,56 €"
uid()             // id unique = Date.now().toString(36) + random
today()           // "YYYY-MM-DD"
fmtDate(d)        // "22 mai 25"
pct(a, b)         // "(a/b)*100" → "42.3%"
diffDays(a, b)    // nombre de jours entre deux dates
active(arr)       // filtre les non-supprimés
trashed(arr)      // filtre les supprimés encore dans la fenêtre 30j
daysLeft(dt)      // jours restants avant purge définitive
cycleMonthly(amount, cycle)  // ramène à mensuel (annual÷12, weekly×4.33)
compressImg(file, maxDim=200) // compresse image en JPEG base64
```

---

## Composants UI (ui.jsx)

| Composant | Props | Usage |
|---|---|---|
| `Lbl` | children | Label de champ (uppercase, 11px) |
| `F` | label, children, col | Wrapper champ avec label (col = gridColumn) |
| `Btn` | onClick, variant, sm, full, disabled, style | Bouton. variants: def\|pri\|ghost\|err\|warn\|success |
| `Bdg` | label, color, sm | Badge coloré (activité) |
| `CatBdg` | id | Badge catégorie produit |
| `StatusBdg` | id | Badge statut location |
| `KPI` | label, value, color, sub, top | Carte KPI dashboard |
| `Empty` | icon, text | État vide |
| `Card` | children, style | Carte blanche avec bordure/ombre |
| `THead` | cols[] | En-tête de tableau |
| `StockBar` | v, warn=5 | Barre de stock (rouge/orange/vert) |
| `ChartTip` | active, payload, label | Tooltip Recharts |
| `Confirm` | msg, sub, onOk, onCancel | Modal confirmation suppression |
| `ConfirmAcompte` | msg, sub, actions[], onCancel | Modal confirmation avec choix multiples |
| `Modal` | title, onClose, children, width=520 | Modal générique scrollable |
| `SectionTitle` | children | Titre de section (uppercase, 11px) |
| `Preview` | ca, profit, margin | Aperçu CA/bénéfice/marge en bas de formulaire |
| `Divider` | — | Ligne horizontale |

---

## ProductFormModal (composants/ProductFormModal.jsx)

Modal réutilisable pour créer ou modifier un produit.

**Props :**
```
product       // objet produit existant (null = création)
aBiz          // tableau des activités actives
prodA         // actions produit
defaultBizId  // présélectionne une activité
onClose()     // ferme le modal (appelé après update, ou après add si pas onCreated)
onCreated(prod) // optionnel — appelé après add avec le nouveau produit (et NE PAS appeler onClose)
```

**Exports nommés depuis ce fichier :**
```js
deleteStorageImage(url)   // supprime image Supabase Storage
parseVehicleDesc(str)     // parse description véhicule encodée
encodeVehicleDesc(form)   // encode les champs véhicule en description
emptyVehicleFields        // objet vide des champs véhicule
emptyProd                 // objet produit vide
hasSizes(product)         // true si product.sizes est un objet non-vide
totalSzStock(product)     // somme des stocks par taille
SizesBadges               // composant badges tailles mobiles
PhotosField               // composant upload/preview photos (max 5)
VehicleToggle             // checkbox "Mode véhicule"
VehicleFields             // champs spécifiques véhicule
SizesGrid                 // grille input stock par taille
SizesToggle               // checkbox activer/désactiver tailles
```

---

## Vues — signature des props et état local

### Dashboard.jsx
**Props reçues depuis shared :** `biz, prods, sales, rentalAssets, rentalBookings, subs, expenses, bizExpenses`
**État local :** `filterBiz` (all|id), `filterPeriod` (all|week|month|year|custom), `from`, `to` (dates custom)
**Fonctions clés :**
- `stats` (useMemo) : calcule CA ventes, CA locatif, coût stock, trésorerie, abonnements mensuels, etc.
- Formule trésorerie : `salesCa + rentalCa - allSalesCost - rentalPropCost - (from ? 0 : stockValue) - expensesTotal - bizExpTotal`
  - `stockValue` n'est soustrait QUE si pas de filtre de période (all-time)

### Products.jsx
**Props reçues :** `prods, prodA, biz, sales, saleA, expenses, expenseA, bizExpenses, bizExpenseA, partners, spA, focusProduct, setFocusProduct`
**Modaux locaux :**
- `SellModal({ product, totalCost, aPartners, onConfirm, onClose })` — vente rapide depuis le catalogue, inclut section partenaire
- `ExpensesModal({ product, expenses, onAdd, onDel, bizExpenses, bizExpenseA, onClose })` — frais sur mobile
- `ModifyModal({ product, aBiz, expenses, expenseA, bizExpenses, bizExpenseA, prodA, onClose })` — édition desktop complète (infos + frais)
- `ProductFormModal` — utilisé pour ajout + édition mobile
**État local :** `prodModal` (null|"add"|product), `modifyModal`, `sellModal`, `expModal`, `filterBiz`, `filterCat`, `searchQ`, `editStock`, `expandedId`, `confirm`
**handleSell :** met à jour stock produit, crée sale avec `saleId = uid()`, crée salePartner si `withPartner && partnerId`

### Sales.jsx
**Props reçues :** `sales, saleA, prods, prodA, biz, partners, salePartners, spA, expenses`
**Modaux locaux :**
- `EditSaleModal({ sale, aBiz, aPartners, salePartners, spA, onClose, onSave })` — modification vente + partenaire (crée/modifie/supprime le salePartner lié)
- `SoldeModal({ sale, onClose, onSolde })` — solde un acompte
**État local :** `showForm`, `form` (emptySale), `filterBiz`, `errors`, `ok`, `confirm`, `editModal`, `soldeModal`, `expandedId`, `searchQ`, `filterPeriod`
**emptySale :** `{ bizId, productId, name, qty:"1", sellPrice, costPrice, date, notes, size, withPartner:false, partnerId, sharePct:"50", paymentStatus:"complet", depositAmount }`
**Partenaire dans EditSaleModal :**
- Lit `existingSp = salePartners.find(sp => sp.saleId === sale.id)`
- Initialise form avec `withPartner`, `partnerId`, `sharePct` depuis existingSp
- Au save : si withPartner+partnerId → spA.update (existant) ou spA.add (nouveau) ; sinon si existingSp → spA.hardDel

### Rentals.jsx
**Props reçues :** `rentalAssets, assetA, rentalBookings, bookingA, biz`
**Deux sections :** actifs (véhicules/biens) + réservations/locations
**État local :** `assetForm`, `bookingForm`, modaux

### Partners.jsx
**Props reçues :** `partners, partnerA, sales, salePartners, spA, payments, paymentA`
**Fonctionnalités :** liste partenaires, stats (totalDue, totalPaid, balance), modal de paiement, vue détail par partenaire

### Subscriptions.jsx
**Props reçues :** `subs, subA, biz`
**Fonctionnalités :** liste abonnements, calcul mensuel normalisé avec `cycleMonthly()`

### BizExpenses.jsx
**Props reçues :** `bizExpenses, bizExpenseA, biz, prods`
**Fonctionnalités :** frais d'entreprise, peut être lié à une activité ou un produit, filtre par activité

### Businesses.jsx
**Props reçues :** `biz, bizA, prods, sales, subs, rentalAssets, deleteBiz`
**Fonctionnalités :** CRUD activités, suppression en cascade via `deleteBiz`

### Orders.jsx
**Props reçues :** `orders, orderA, orderItems, orderItemA, deleteOrderHard, biz, prods, prodA, aBiz`
**Fonctionnalités :** commandes fournisseur avec articles, navigation vers produit via `onNavigateToProduct`
**Modaux :**
- `ItemModal({ item, order, prods, onSave, onCreateProd, onClose, prefill })` — ajouter/modifier un article
- `ProductFormModal` — création produit inline depuis commande (flux : "+Créer" → ProductFormModal → ItemModal avec prefill)
**État local :** `newProdFor` (null|{order}) — déclenche la création produit inline

### Trash.jsx
**Props reçues :** `biz, bizA, prods, prodA, sales, saleA, rentalAssets, assetA, rentalBookings, bookingA, subs, subA, bizExpenses, bizExpenseA, orders, orderA, deleteOrderHard`
**Fonctionnalités :** affiche items soft-deleted, restauration, purge individuelle ou totale
**Important :** purge produits appelle `deleteStorageImage(url)` pour chaque image avant `prodA.hardDel()`

### Changelog.jsx
Composant statique, pas de props.

---

## CSS Variables (theme.js)

| Variable | Description |
|---|---|
| `--txt` | texte principal |
| `--sub` | texte secondaire |
| `--mut` | texte muet |
| `--bg` | fond général |
| `--w` | blanc / fond carte |
| `--surf` | surface légèrement colorée |
| `--brd` | bordure |
| `--sdbar` | fond sidebar/header |
| `--sh` | box-shadow carte |
| `--ac` | accent (indigo #4f46e5) |
| `--acb` | fond accent léger |
| `--ok` | vert succès |
| `--warn` | orange avertissement |
| `--err` | rouge erreur |

---

## Responsive / Layout

- `className="mhide"` → masqué sur mobile (≤760px)
- `className="m-only"` + `display:none` dans le CSS → visible seulement mobile
- `className="mshow"` → visible seulement mobile (header hamburger)
- Toutes les vues sont montées simultanément, navigation par `display: tab===id ? "block" : "none"`

### Classes utilitaires mobile (theme.js)

| Classe | Effet mobile (≤760px) | Usage |
|---|---|---|
| `.pills` | `overflow-x:auto; flex-wrap:nowrap; scrollbar masquée` | Rangée de boutons-filtres (activités, périodes) — défilement horizontal au lieu d'empiler sur plusieurs lignes |
| `.filter-bar` | `flex-direction:column; align-items:stretch` | Conteneur de plusieurs groupes de filtres — empile chaque groupe sur sa propre ligne |
| `.filter-bar .pills` | `border-left:none; padding-left:0` | Efface le séparateur visuel desktop quand les groupes sont empilés (ex. Dashboard) |

**Règle :** toute rangée de pills avec `flexWrap:"wrap"` doit avoir `className="pills"` et `flex:1; minWidth:0` si elle cohabite avec un bouton d'action sur la même ligne (ex. BizExpenses, Sales).

---

## Supabase Storage (images produits)

- Bucket : `product-images`
- URL format : `https://[project].supabase.co/storage/v1/object/public/product-images/[filename]`
- `deleteStorageImage(url)` extrait le chemin depuis l'URL et appelle `supabase.storage.from("product-images").remove([path])`
- Max 5 photos par produit
- Compression automatique avant upload via `compressImg(file, 800)`

---

## Flux partenaire (sale_partners)

1. **Lors d'une vente (Products.jsx SellModal ou Sales.jsx form)** :
   - Si `withPartner && partnerId` → `spA.add({ id:uid(), saleId, partnerId, sharePct, amountDue: profit * sharePct/100 })`
2. **Lors d'une modification de vente (Sales.jsx EditSaleModal)** :
   - `existingSp = salePartners.find(sp => sp.saleId === sale.id)`
   - Si partenaire activé + existingSp → `spA.update({...existingSp, ...nouveaux_champs})`
   - Si partenaire activé + pas existingSp → `spA.add(...)`
   - Si partenaire désactivé + existingSp → `spA.hardDel(existingSp.id)`
3. **Stats partenaires (Partners.jsx)** :
   - `getStats(partnerId)` → filtre salePartners par partnerId + saleIds actifs
   - `totalDue` = somme amountDue ; `totalPaid` = somme payments ; `balance` = due - paid

---

## Flux commande → produit (Orders.jsx)

1. Ouvrir ItemModal → cliquer "+ Créer"
2. `setItemModal(null)` + `setNewProdFor({ order })` → ouvre ProductFormModal
3. `onCreated(prod)` → `setNewProdFor(null)` + `setItemModal({ order, prefill: { productId: prod.id, name: prod.name, unitPrice: prod.buyPrice } })`
4. ItemModal s'ouvre pré-rempli avec le nouveau produit
5. `onClose` du ProductFormModal (si annulation) → `setNewProdFor(null)` + `setItemModal({ order })`

---

## Points d'attention / bugs connus résolus

1. **React 18 batching** : dans ProductFormModal, quand `onCreated` est fourni, NE PAS appeler `onClose()` — c'est `onCreated` qui gère la fermeture
2. **stockValue dans trésorerie** : ne soustraire `stockValue` que si `from === ""` (vue all-time, pas de filtre de période)
3. **Images produit sur purge** : dans Trash.jsx, appeler `deleteStorageImage(url)` pour chaque `x.images[i]` AVANT `prodA.hardDel(x.id)`
4. **trashCount** : inclure `trashed(rentalBookings).length` (était manquant)
5. **CSS var(--tx)** → doit être `var(--txt)` (typo dans Dashboard.jsx — corrigée)
