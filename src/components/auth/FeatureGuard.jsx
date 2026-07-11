import FeatureGate from './FeatureGate'

export default function FeatureGuard({ flag, fallback, children }) {
  return (
    <FeatureGate feature={flag} fallback={fallback}>
      {children}
    </FeatureGate>
  )
}
