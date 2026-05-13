import { getItemsByCategory } from '@/lib/menu'
import MenuItemCard from './menu-item-card'

interface Props {
  category: string
}

export default function MenuGrid({ category }: Props) {
  const items = getItemsByCategory(category)
  return (
    <div>
      <h2 className="font-bold text-lg text-gray-900 mb-4">{category}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map(item => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
