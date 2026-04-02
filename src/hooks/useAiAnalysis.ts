import { useState, useCallback } from 'react'
import { AiProvider, AiAnalysisResult, AiAnalysisRequest } from '../services/ai/types'
import { runAllAiAnalyses } from '../services/ai/runner'
import { useApiKeys } from './useApiKeys'

interface AiAnalysisState {
  results: Partial<Record<AiProvider, AiAnalysisResult>>
  isLoading: boolean
  loadingProviders: AiProvider[]
  error: string | null
}

const initialState: AiAnalysisState = {
  results: {},
  isLoading: false,
  loadingProviders: [],
  error: null,
}

export function useAiAnalysis() {
  const [state, setState] = useState<AiAnalysisState>(initialState)
  const { getAllKeys } = useApiKeys()

  const runAnalysis = useCallback(async (req: AiAnalysisRequest) => {
    const keys = getAllKeys()
    const activeProviders = Object.keys(keys) as AiProvider[]

    if (activeProviders.length === 0) return

    setState({
      results: {},
      isLoading: true,
      loadingProviders: [...activeProviders],
      error: null,
    })

    try {
      const results = await runAllAiAnalyses(req, keys)

      const resultMap: Partial<Record<AiProvider, AiAnalysisResult>> = {}
      for (const r of results) {
        resultMap[r.provider] = r
      }

      setState({
        results: resultMap,
        isLoading: false,
        loadingProviders: [],
        error: null,
      })
    } catch (err) {
      setState({
        results: {},
        isLoading: false,
        loadingProviders: [],
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }, [getAllKeys])

  const reset = useCallback(() => {
    setState(initialState)
  }, [])

  return {
    ...state,
    runAnalysis,
    reset,
  }
}