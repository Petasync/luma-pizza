import { getItemsByCategory } from '@/lib/menu'
import MenuItemCard from './menu-item-card'

interface Props {
  category: string
}

export default function MenuGrid({ category }: Props) {
  const items = getItemsByCategory(category)
  return (
    <div>
      <div className="mb-8">
        <p className="eyebrow mb-2">Kategorie</p>
        <h2 className="heading-serif text-3xl">{category}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {items.map(item => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
