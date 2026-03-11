import { useState, useEffect } from 'react';
import { getBrowserClient } from '@/lib/supabase-browser';

/**
 * Shared profile hook for components that need access to the student profile.
 * Used by AdmissionPredictor, SavedList, SwipeCard, etc.
 *
 * Uses the shared browser singleton so auth state is never out of sync
 * across Header, page.js, and this hook.
 */
export function useProfile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        const supabase = getBrowserClient();

        async function load() {
            try {
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                if (authError) throw authError;
                if (!user) { if (!cancelled) setLoading(false); return; }

                const { data, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profileError && profileError.code !== 'PGRST116') {
                    // PGRST116 = row not found (profile not yet created) — that's OK
                    throw profileError;
                }

                if (!cancelled) {
                    setProfile(data ?? null);
                    setLoading(false);
                }
            } catch (err) {
                if (!cancelled) {
                    console.error('[useProfile] Failed to load profile:', err);
                    setError(err);
                    setLoading(false);
                }
            }
        }

        load();
        return () => { cancelled = true; };
    }, []);

    const updateProfile = async (updates) => {
        const supabase = getBrowserClient();
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) return;
            const { error: upsertError } = await supabase
                .from('profiles')
                .upsert({ id: user.id, ...updates }, { onConflict: 'id' });
            if (upsertError) throw upsertError;
            setProfile(prev => ({ ...prev, ...updates }));
        } catch (err) {
            console.error('[useProfile] Failed to update profile:', err);
            throw err; // Re-throw so callers can show error feedback
        }
    };

    /**
     * Get effective intermediate data based on education system and status.
     * Used by AdmissionPredictor for merit calculations.
     */
    function getEffectiveInterData() {
        if (!profile) return { percentage: null, cannotCalculate: true };

        // Cambridge: use IBCC %
        if (profile.education_system === 'cambridge') {
            return {
                percentage: profile.ibcc_equivalent_inter,
                marks: null,
                total: 100,
                label: 'IBCC Equivalence',
                isProjected: false,
                warning: !profile.ibcc_equivalent_inter
                    ? 'Enter your IBCC equivalence % to calculate merit'
                    : null,
            };
        }

        // Not started: can't calculate
        if (profile.inter_status === 'not_started') {
            return {
                percentage: null,
                label: 'No intermediate marks',
                warning: 'You need at least FSc Part-I marks to estimate merit.',
                cannotCalculate: true,
            };
        }

        // Part-I / Appearing: use projected
        if (['part1_only', 'appearing'].includes(profile.inter_status)) {
            const part1Marks = Number(profile.fsc_part1_marks) || 0;
            const part1Total = Number(profile.fsc_part1_total) || 0; // guard: never divide by zero
            const projected = profile.fsc_projected_percentage ||
                (part1Marks > 0 && part1Total > 0
                    ? ((part1Marks / part1Total) * 100)
                    : null);
            return {
                percentage: projected ? parseFloat(projected).toFixed(2) : null,
                marks: profile.fsc_projected_marks,
                total: profile.fsc_total || 1100,
                label: 'FSc (Projected from Part-I)',
                isProjected: true,
                warning: 'Merit is estimated using projected marks. Actual merit may change after Part-II result.',
            };
        }

        // Complete / Result awaited: use actual
        return {
            percentage: profile.fsc_percentage,
            marks: profile.fsc_marks,
            total: profile.fsc_total || 1100,
            label: profile.inter_status === 'result_awaited' ? 'FSc (Result Awaited)' : 'FSc',
            isProjected: false,
            warning: profile.inter_status === 'result_awaited'
                ? 'Using marks entered before result. Update when official result arrives.'
                : null,
        };
    }

    return { profile, loading, error, updateProfile, getEffectiveInterData };
}
