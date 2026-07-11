import { useQuery } from '@tanstack/react-query'
import { useDebounce } from './useDebounce'
import { searchAll } from '../services/searchService'

export function useSearch(companyId, rawQuery) {
  const debouncedQuery = useDebounce(rawQuery, 300)

  return useQuery({
    queryKey: ['globalSearch', companyId, debouncedQuery],
    queryFn: () => searchAll({ companyId, query: debouncedQuery }),
    enabled: !!companyId && debouncedQuery.trim().length >= 2,
    staleTime: 0,
    retry: 0,
    refetchOnWindowFocus: false,
  })
}
