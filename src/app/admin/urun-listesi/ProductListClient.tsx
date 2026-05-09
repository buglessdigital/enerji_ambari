'use client'

import { useState, useEffect, useCallback, Fragment } from 'react'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'
import { FileDown, Search, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

type Category = {
  id: string
  name: string
  parent_id: string | null
  slug: string
}

type Product = {
  id: string
  name: string
  brand: string | null
  sku: string | null
  price: number
  sale_price: number | null
  dealer_price: number | null
  dealer_sale_price: number | null
  stock_quantity: number
  category_id: string | null
}

type Props = {
  categories: Category[]
  usdRate: number
}

function formatTRY(p: number | null) {
  if (p == null) return '—'
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
  }).format(p)
}

function formatUSD(p: number | null, rate: number) {
  if (p == null || !(rate > 0)) return '—'
  const usd = p / rate
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(usd)
}

export default function ProductListClient({ categories, usdRate: usdRateProp }: Props) {
  const [usdRate, setUsdRate] = useState(usdRateProp)

  useEffect(() => {
    if (usdRate > 0) return
    supabase
      .from('site_settings')
      .select('usd_exchange_rate')
      .limit(1)
      .single()
      .then(({ data }) => {
        const rate = Number(data?.usd_exchange_rate)
        if (rate > 0) setUsdRate(rate)
      })
  }, [usdRate])

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showDealerPrice, setShowDealerPrice] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set())
  const [categoryPanelOpen, setCategoryPanelOpen] = useState(true)

  const parentCategories = categories.filter((c) => c.parent_id === null)
  const childMap = useCallback(
    (parentId: string) => categories.filter((c) => c.parent_id === parentId),
    [categories]
  )

  const toggleCategory = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleParentExpand = (id: string) => {
    setExpandedParents((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllChildren = (parentId: string) => {
    const children = childMap(parentId)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const allSelected = children.every((c) => next.has(c.id))
      children.forEach((c) => (allSelected ? next.delete(c.id) : next.add(c.id)))
      return next
    })
  }

  useEffect(() => {
    if (selectedIds.size === 0) {
      setProducts([])
      return
    }

    async function fetchProducts() {
      setLoading(true)

      // For each selected ID, also include its children so products assigned
      // to subcategories are returned when a parent category is selected.
      const expandedIds = new Set<string>()
      selectedIds.forEach((id) => {
        expandedIds.add(id)
        categories.filter((c) => c.parent_id === id).forEach((c) => expandedIds.add(c.id))
      })

      const { data } = await supabase
        .from('products')
        .select(
          'id, name, brand, sku, price, sale_price, dealer_price, dealer_sale_price, stock_quantity, category_id'
        )
        .in('category_id', [...expandedIds])
        .eq('is_active', true)
        .order('category_id')
        .order('name')
      setProducts(data ?? [])
      setLoading(false)
    }

    fetchProducts()
  }, [selectedIds, categories])

  const filteredProducts = products.filter((p) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      p.name.toLowerCase().includes(term) ||
      (p.brand ?? '').toLowerCase().includes(term) ||
      (p.sku ?? '').toLowerCase().includes(term)
    )
  })

  // Group products by category_id, preserving category order
  const categoryIdMap = new Map<string, string>()
  categories.forEach((c) => categoryIdMap.set(c.id, c.name))

  const grouped: { categoryId: string; categoryName: string; products: Product[] }[] = []
  filteredProducts.forEach((p) => {
    const catId = p.category_id ?? '__none__'
    const existing = grouped.find((g) => g.categoryId === catId)
    if (existing) {
      existing.products.push(p)
    } else {
      grouped.push({
        categoryId: catId,
        categoryName: categoryIdMap.get(catId) ?? 'Kategorisiz',
        products: [p],
      })
    }
  })

  const selectedCategoryNames = categories
    .filter((c) => selectedIds.has(c.id))
    .map((c) => c.name)
    .join(', ')

  const printDate = new Date().toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <>
      {/* Print-only header */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold">Enerji Ambarı — Ürün Listesi</h1>
        {selectedCategoryNames && (
          <p className="text-base mt-1">Kategoriler: {selectedCategoryNames}</p>
        )}
        <p className="text-sm text-gray-500 mt-1">Oluşturulma Tarihi: {printDate}</p>
      </div>

      {/* Screen UI */}
      <div className="print:hidden space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-800">Ürün Listesi (PDF)</h1>
          <button
            onClick={() => window.print()}
            disabled={filteredProducts.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <FileDown className="w-4 h-4" />
            PDF İndir
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
          {/* Category panel */}
          <div>
            <button
              type="button"
              onClick={() => setCategoryPanelOpen((v) => !v)}
              className="flex items-center justify-between w-full text-sm font-medium text-neutral-700 mb-2"
            >
              <span>
                Kategori Seç
                {selectedIds.size > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs">
                    {selectedIds.size} seçili
                  </span>
                )}
              </span>
              {categoryPanelOpen ? (
                <ChevronUp className="w-4 h-4 text-neutral-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              )}
            </button>

            {categoryPanelOpen && (
              <div className="border border-neutral-200 rounded-lg max-h-72 overflow-y-auto divide-y divide-neutral-100">
                {parentCategories.map((parent) => {
                  const children = childMap(parent.id)
                  const isExpanded = expandedParents.has(parent.id)
                  const parentChecked = selectedIds.has(parent.id)
                  const childrenAllChecked =
                    children.length > 0 && children.every((c) => selectedIds.has(c.id))
                  const childrenSomeChecked =
                    children.some((c) => selectedIds.has(c.id)) && !childrenAllChecked

                  return (
                    <div key={parent.id}>
                      <div className="flex items-center gap-2 px-3 py-2.5 hover:bg-neutral-50">
                        <input
                          type="checkbox"
                          id={`cat-${parent.id}`}
                          className="w-4 h-4 accent-primary-600 shrink-0"
                          checked={parentChecked}
                          onChange={() => toggleCategory(parent.id)}
                        />
                        <label
                          htmlFor={`cat-${parent.id}`}
                          className="flex-1 text-sm font-medium text-neutral-700 cursor-pointer"
                        >
                          {parent.name}
                        </label>
                        {children.length > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleParentExpand(parent.id)}
                            className="text-xs text-neutral-400 hover:text-neutral-600 flex items-center gap-1"
                          >
                            <span className={`${childrenSomeChecked ? 'text-primary-500' : ''}`}>
                              {children.length} alt
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>

                      {isExpanded && children.length > 0 && (
                        <div className="bg-neutral-50 border-t border-neutral-100">
                          <button
                            type="button"
                            onClick={() => selectAllChildren(parent.id)}
                            className="w-full text-left px-8 py-1.5 text-xs text-primary-600 hover:underline"
                          >
                            {childrenAllChecked ? 'Tümünü kaldır' : 'Tümünü seç'}
                          </button>
                          {children.map((child) => (
                            <div
                              key={child.id}
                              className="flex items-center gap-2 px-8 py-2 hover:bg-neutral-100"
                            >
                              <input
                                type="checkbox"
                                id={`cat-${child.id}`}
                                className="w-4 h-4 accent-primary-600 shrink-0"
                                checked={selectedIds.has(child.id)}
                                onChange={() => toggleCategory(child.id)}
                              />
                              <label
                                htmlFor={`cat-${child.id}`}
                                className="text-sm text-neutral-600 cursor-pointer"
                              >
                                {child.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Search + options row */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                className="input w-full"
                style={{ paddingLeft: '2.25rem' }}
                placeholder="Ad, marka veya SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-6 shrink-0">
              <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-primary-600"
                  checked={showDealerPrice}
                  onChange={(e) => setShowDealerPrice(e.target.checked)}
                />
                Bayi fiyatını göster
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 print:hidden">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          <span className="ml-2 text-neutral-500">Ürünler yükleniyor...</span>
        </div>
      ) : selectedIds.size > 0 && filteredProducts.length === 0 && !loading ? (
        <div className="text-center py-16 text-neutral-400 print:hidden">
          Seçili kategorilerde ürün bulunamadı.
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="mt-6 bg-white rounded-xl border border-neutral-200 overflow-hidden print:rounded-none print:border-none print:mt-0">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 print:bg-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 border-b border-neutral-200 w-10">
                  #
                </th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 border-b border-neutral-200">
                  Ürün Adı
                </th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 border-b border-neutral-200">
                  SKU
                </th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 border-b border-neutral-200">
                  Marka
                </th>
                <th className="text-right px-4 py-3 font-semibold text-neutral-600 border-b border-neutral-200">
                  Satış Fiyatı ($)
                </th>
                {showDealerPrice && (
                  <th className="text-right px-4 py-3 font-semibold text-neutral-600 border-b border-neutral-200">
                    Bayi Fiyatı ($)
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {(() => {
                let globalIndex = 0
                return grouped.map((group) => (
                  <Fragment key={`group-${group.categoryId}`}>
                    <tr>
                      <td
                        colSpan={showDealerPrice ? 5 : 4}
                        className="px-4 py-2 bg-primary-50 border-y border-primary-100 text-primary-700 font-semibold text-xs uppercase tracking-wide print:bg-blue-50"
                      >
                        {group.categoryName}
                      </td>
                    </tr>
                    {group.products.map((product) => {
                      globalIndex++
                      const idx = globalIndex
                      return (
                        <tr
                          key={product.id}
                          className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 print:hover:bg-transparent"
                        >
                          <td className="px-4 py-3 text-neutral-400">{idx}</td>
                          <td className="px-4 py-3 font-medium text-neutral-800">{product.name}</td>
                          <td className="px-4 py-3 text-neutral-500 font-mono text-xs">{product.sku ?? '—'}</td>
                          <td className="px-4 py-3 text-neutral-600">{product.brand ?? '—'}</td>
                          <td className="px-4 py-3 text-right font-semibold text-neutral-800">
                            {formatUSD(product.price, usdRate)}
                          </td>
                          {showDealerPrice && (
                            <td className="px-4 py-3 text-right text-neutral-600">
                              {formatUSD(product.dealer_price, usdRate)}
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </Fragment>
                ))
              })()}
            </tbody>
          </table>
          <div className="px-4 py-3 bg-neutral-50 border-t border-neutral-200 text-sm text-neutral-500 print:bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <span>Toplam {filteredProducts.length} ürün · {grouped.length} kategori</span>
            <span className="italic text-xs sm:text-sm">* Tüm fiyatlara KDV dahildir</span>
          </div>
        </div>
      ) : null}
    </>
  )
}
