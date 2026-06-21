'use client'
import Image from 'next/image'
import { MenuItem } from '@/lib/types'
import { useCart } from '@/components/cart/cart-context'
import { useState } from 'react'
import { getImageForItem } from '@/lib/images'

interface Props {
  item: MenuItem
}

export default function MenuItemCard({ item }: Props) {
  const { dispatch } = useCart()
  const [selectedSize, setSelectedSize] = useState<'33cm' | '45cm'>('33cm')
  const hasSides = item.sides !== undefined && item.sides.length > 0
  const [selectedSide, setSelectedSide] = useState<string>(item.sides?.[0] ?? '')
  const [justAdded, setJustAdded] = useState(false)
  const isPizza = item.priceSmall !== undefined && item.priceLarge !== undefined
  const price = isPizza
    ? (selectedSize === '33cm' ? item.priceSmall! : item.priceLarge!)
    : item.price

  function handleAdd() {
    if (!item.available || price === undefined) return
    dispatch({
      type: 'ADD_ITEM',
      item: {
        menuItemId: item.id,
        name: item.name,
        size: isPizza ? selectedSize : hasSides ? selectedSide : null,
        price,
        quantity: 1,
      },
    })
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1200)
  }

  return (
    <article
      className={`group bg-cream-50 border border-charcoal-900/8 overflow-hidden transition-shadow duration-300 ${
        item.available ? 'hover:shadow-lg' : 'opacity-60'
      }`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-cream-200">
        <Image
          src={getImageForItem(item)}
          alt={item.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={`object-cover transition-transform duration-700 ${
            item.available ? 'group-hover:scale-105' : 'grayscale'
          }`}
        />
        {!item.available && (
          <div className="absolute inset-0 flex items-center justify-center bg-charcoal-900/40">
            <span className="text-cream-50 text-xs uppercase tracking-widest border border-cream-50 px-3 py-1">
              Aktuell nicht verfügbar
            </span>
          </div>
        )}
        {item.tags && item.tags.length > 0 && item.available && (
          <div className="absolute top-3 left-3 flex gap-1.5">
            {item.tags.includes('vegetarisch') && (
              <span className="text-[10px] uppercase tracking-wider bg-cream-50 text-charcoal-800 px-2 py-1">
                Vegetarisch
              </span>
            )}
            {item.tags.includes('scharf') && (
              <span className="text-[10px] uppercase tracking-wider bg-wine-600 text-cream-50 px-2 py-1">
                Scharf
              </span>
            )}
            {item.tags.includes('18+') && (
              <span className="text-[10px] uppercase tracking-wider bg-charcoal-900 text-cream-50 px-2 py-1">
                18+
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-serif text-lg leading-tight text-charcoal-900">{item.name}</h3>
          {price !== undefined && (
            <p className="font-serif text-lg text-gold-600 whitespace-nowrap">
              {price.toFixed(2)} €
            </p>
          )}
        </div>

        {item.description && (
          <p className="text-sm text-charcoal-600 leading-relaxed mb-4 line-clamp-2 min-h-[2.5rem]">
            {item.description}
          </p>
        )}

        {hasSides && item.sides && item.available && (
          <div className="mb-4">
            <p className="text-xs uppercase tracking-widest text-charcoal-500 mb-1.5">Beilage</p>
            <div className="flex flex-wrap gap-1.5">
              {item.sides.map(side => (
                <button
                  key={side}
                  onClick={() => setSelectedSide(side)}
                  className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
                    selectedSide === side
                      ? 'bg-charcoal-900 text-cream-50 border-charcoal-900'
                      : 'border-charcoal-900/15 text-charcoal-700 hover:bg-cream-100 active:bg-cream-200'
                  }`}
                >
                  {side}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          {isPizza ? (
            <div className="flex gap-1 border border-charcoal-900/15 flex-shrink-0">
              {(['33cm', '45cm'] as const).map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-3 py-2 sm:py-1.5 text-xs font-medium transition-colors ${
                    selectedSize === size
                      ? 'bg-charcoal-900 text-cream-50'
                      : 'text-charcoal-700 hover:bg-cream-100 active:bg-cream-200'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          ) : hasSides ? null : (
            <span className="text-xs uppercase tracking-widest text-charcoal-500">
              {item.category}
            </span>
          )}

          <button
            onClick={handleAdd}
            disabled={!item.available}
            className={`flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2 text-xs uppercase tracking-widest font-medium whitespace-nowrap transition-all duration-300 ${
              !item.available
                ? 'bg-charcoal-200 text-charcoal-400 cursor-not-allowed'
                : justAdded
                ? 'bg-gold-500 text-charcoal-900'
                : 'bg-charcoal-900 text-cream-50 hover:bg-gold-600 active:bg-gold-600'
            }`}
            aria-label={`${item.name} hinzufügen`}
          >
            {justAdded ? '✓ Hinzugefügt' : '+ Hinzufügen'}
          </button>
        </div>
      </div>
    </article>
  )
}
