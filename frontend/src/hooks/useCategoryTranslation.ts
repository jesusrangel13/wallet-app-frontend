import { useTranslations } from 'next-intl';
import { categoryTemplateIdToTranslationKey } from '@/i18n/categoryMappings';

/**
 * Category-like interface for type safety
 */
interface CategoryLike {
  name: string;
  templateId?: string | null;
}

/**
 * Hook para traducir nombres de categorías
 *
 * Uso:
 * ```tsx
 * const translateCategory = useCategoryTranslation();
 * <span>{translateCategory(category)}</span>
 * ```
 *
 * Comportamiento:
 * - Si category.templateId existe → Busca traducción en i18n
 * - Si category.templateId es null → Es categoría personalizada, devuelve nombre original
 * - Si no se encuentra traducción → Fallback graceful al nombre original
 */
export function useCategoryTranslation() {
  const t = useTranslations('categories');

  return (category: CategoryLike): string => {
    // Si la categoría tiene templateId, es del sistema
    if (category.templateId) {
      // Buscar clave de traducción por templateId
      const translationKey = categoryTemplateIdToTranslationKey[category.templateId];

      if (translationKey) {
        // Intentar traducir, con fallback al nombre original
        try {
          // Remover el prefijo 'categories.' ya que el namespace ya está configurado
          const key = translationKey.replace(/^categories\./, '');
          return t(key);
        } catch (error) {
          // Si falta la traducción, mostrar advertencia y usar nombre original
          console.warn(`Translation missing for key: ${translationKey} (category: ${category.name})`);
          return category.name;
        }
      } else {
        // TemplateId no encontrado en mapeo (probablemente categoría nueva)
        console.warn(`TemplateId not found in mapping: ${category.templateId} (category: ${category.name})`);
      }
    }

    // Fallback: categorías personalizadas o templates no encontrados
    return category.name;
  };
}
