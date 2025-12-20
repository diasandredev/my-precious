import { createContext, useContext, useMemo, useEffect } from 'react';
import { DEFAULT_INSIGHTS_CONFIG } from '../lib/insights';
import { useData } from './DataContext';

const InsightsSettingsContext = createContext();

export function useInsightsSettings() {
    return useContext(InsightsSettingsContext);
}

export function InsightsSettingsProvider({ children }) {
    const { data, updateSettings, loading } = useData();

    // Derive config from data.settings.insights, merging with defaults
    const insightsConfig = useMemo(() => {
        const savedInsights = data?.settings?.insights || {};

        // Deep merge for thresholds to ensure new defaults appear even if saved config is old
        return {
            ...DEFAULT_INSIGHTS_CONFIG,
            ...savedInsights,
            thresholds: {
                ...DEFAULT_INSIGHTS_CONFIG.thresholds,
                ...(savedInsights.thresholds || {})
            }
        };
    }, [data?.settings?.insights]);

    // Auto-init defaults if missing in Firebase
    useEffect(() => {
        if (!loading && data?.settings && !data.settings.insights) {
            console.log("Auto-initializing insights config to Firebase...");
            updateSettings({ insights: DEFAULT_INSIGHTS_CONFIG });
        }
    }, [loading, data?.settings, updateSettings]);

    const updateConfig = (newThresholds) => {
        // We only update thresholds for now, as that's what the dialog edits
        const newConfig = {
            ...insightsConfig,
            thresholds: {
                ...insightsConfig.thresholds,
                ...newThresholds
            }
        };

        // Persist via DataContext -> Firebase
        updateSettings({ insights: newConfig });
    };

    const resetConfig = () => {
        // To reset, we can just save the default config, or remove the 'insights' key (if updateSettings supports partial unset, which it might not easily).
        // Safest is to explicitly set to default.
        updateSettings({ insights: DEFAULT_INSIGHTS_CONFIG });
    };

    return (
        <InsightsSettingsContext.Provider value={{ insightsConfig, updateConfig, resetConfig, isLoaded: !loading }}>
            {children}
        </InsightsSettingsContext.Provider>
    );
}
