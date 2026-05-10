# TODO - Users table rendering fix

- [x] Fix `fetchAllUsers` in `src/store/slices/usersSlice.js` to:
  - [x] get logged-in user's `company_id` from `profiles` using `auth.uid()`
  - [x] fetch `profiles` scoped to that `company_id`
  - [x] join `companies` to get `company.name`
  - [x] map join result robustly (object/array/null)
  - [x] improve `displayName` using `first_name/last_name` fallback to email
- [x] Fix unstable row keys in `src/features/users/DataTable.jsx` (remove `Math.random()`)
- [ ] Sanity test by running app / checking console for Supabase join/mapping errors


