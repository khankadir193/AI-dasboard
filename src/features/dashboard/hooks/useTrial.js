import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { supabase } from '../../../lib/supabaseClient'

export const useTrial = () => {
  const { user } = useSelector((state) => state.auth)
  
  const [trialInfo, setTrialInfo] = useState({
    isLoading: true,
    trialEnd: null,
    daysLeft: null,
    isExpired: false,
  })

  useEffect(() => {
    const fetchTrialInfo = async () => {
      if (!user?.id) {
        setTrialInfo({
          isLoading: false,
          trialEnd: null,
          daysLeft: null,
          isExpired: false,
        })
        return
      }

      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .maybeSingle()

        if (profileError || !profileData?.company_id) {
          setTrialInfo({
            isLoading: false,
            trialEnd: null,
            daysLeft: null,
            isExpired: false,
          })
          return
        }

        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('id, name, created_at')
          .eq('id', profileData.company_id)
          .maybeSingle()

        if (companyError || !company?.created_at) {
          setTrialInfo({
            isLoading: false,
            trialEnd: null,
            daysLeft: null,
            isExpired: false,
          })
          return
        }

        // Calculate trial period based on company creation date (30-day trial)
        const now = new Date()
        const createdDate = new Date(company.created_at)
        const trialEndDate = new Date(createdDate.getTime() + (30 * 24 * 60 * 60 * 1000)) // 30 days from creation
        const diffMs = trialEndDate.getTime() - now.getTime()
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

        setTrialInfo({
          isLoading: false,
          trialEnd: trialEndDate,
          daysLeft: Math.max(daysLeft, 0),
          isExpired: diffMs <= 0,
        })
      } catch (_error) {
        setTrialInfo({
          isLoading: false,
          trialEnd: null,
          daysLeft: null,
          isExpired: false,
        })
      }
    }

    fetchTrialInfo()
  }, [user])

  return { trialInfo }
}

