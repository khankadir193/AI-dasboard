import { useMemo, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useUsers } from '../../../hooks/useFetch'
import { fetchAllUsers } from '../../../store/slices/usersSlice'
import { formatUsers } from '../tableUtils'

export function useTeamMembers() {
  const dispatch = useDispatch()
  const { data: rawUsers, isLoading, error } = useUsers()
  const users = useMemo(() => formatUsers(rawUsers), [rawUsers])
  const refreshUsers = useCallback(() => dispatch(fetchAllUsers()), [dispatch])

  return { users, isLoading, error, refreshUsers }
}
