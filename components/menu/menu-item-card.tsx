'use client'
import { MenuItem } from '@/lib/types'
import { useCart } from '@/components/cart/cart-context'
import { useState } from 'react'

interface Props {
  item: MenuItem
}

export default function MenuItemCard({ item }: Props) {
  const { dispatch } = useCart()
  const [selectedSize, setSelectedSize] = useState<'26cm' | '30cm'>('30cm')
  const isPizza = item.priceSmall !== undefined && item.priceLarge !== undefined
  const price = isPizza
    ? (selectedSize === '26cm' ? item.priceSmall! : item.priceLarge!)
    : item.price!

  function handleAdd() {
    dispatch({
      type: 'ADD_ITEM',
      item: {
        menuItemId: item.id,
        name: item.name,
        size: isPizza ? selectedSize : null,
        price,
        quantity: 1,
      },
    })
  }

  if (!item.available) {
    return (
      <div className="bg-white border border-gray-100 rounded-lg p-4 opacity-50">
        <p className="font-semibold text-gray-400 text-sm">{item.name}</p>
        <p className="text-xs text-gray-400 mt-1">Nicht verfügbar</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-100 rounded-lg p-4 hover:border-primary transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
            {item.tags?.includes('vegetarisch') && (
              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded font-medium">Veg</span>
            )}
            {item.tags?.includes('scharf') && (
              <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded font-medium">Scharf</span>
            )}
            {item.tags?.includes('18+') && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">18+</span>
            )}
          </div>
          {item.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
          )}
          {isPizza && (
            <div className="flex gap-2 mt-2">
              {(['26cm', '30cm'] as const).map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${
                    selectedSize === size
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-200 text-gray-600 hover:border-primary'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className="font-bold text-accent text-sm">{price.toFixed(2)} €</span>
          <button
            onClick={handleAdd}
            className="w-7 h-7 bg-primary text-white rounded flex items-center justify-center font-bold text-lg hover:bg-primary-dark transition-colors"
            aria-label={`${item.name} hinzufügen`}
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}
