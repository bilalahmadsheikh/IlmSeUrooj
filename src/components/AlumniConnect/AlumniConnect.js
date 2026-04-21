'use client';

import { useState, useEffect, useCallback } from 'react';
import { getBrowserClient } from '@/lib/supabase-browser';
import styles from './AlumniConnect.module.css';

function AlumniCard({ alumni, currentUserId, onConnect }) {
  const [connecting, setConnecting] = useState(false);
  const [status, setStatus] = useState(null); // null | 'pending' | 'accepted'
  const [expanded, setExpanded] = useState(false);

  const handleConnect = async () => {
    if (connecting || !currentUserId) return;
    setConnecting(true);
    try {
      const result = await onConnect(alumni.user_id);
      if (result?.status) setStatus(result.status);
    } finally {
      setConnecting(false);
    }
  };

  const isOwnCard = currentUserId === alumni.user_id;

  return (
    <div className={styles.alumniCard}>
      <div className={styles.alumniCardTop}>
        <div className={styles.alumniAvatar}>
          {alumni.display_name[0].toUpperCase()}
        </div>
        <div className={styles.alumniInfo}>
          <div className={styles.alumniName}>
            {alumni.display_name}
            <span className={styles.verifiedBadge} title="Verified university alumni">✓ Verified</span>
          </div>
          <div className={styles.alumniMeta}>
            {alumni.program && <span>{alumni.program}</span>}
            {alumni.graduation_year && <span>Class of {alumni.graduation_year}</span>}
            {alumni.city && <span>📍 {alumni.city}</span>}
            {alumni.edu_email_domain && <span>@{alumni.edu_email_domain}</span>}
          </div>
          <div className={styles.alumniRating}>
            {[1,2,3,4,5].map((n) => (
              <span key={n} className={n <= alumni.overall_rating ? styles.starFilled : styles.starEmpty}>★</span>
            ))}
            <span className={styles.alumniRatingNum}>{alumni.overall_rating}/5</span>
          </div>
        </div>

        {!isOwnCard && (
          <div className={styles.alumniActions}>
            {status === 'pending' ? (
              <span className={styles.requestSent}>Request sent ✓</span>
            ) : status === 'accepted' ? (
              <span className={styles.requestAccepted}>Connected ✓</span>
            ) : (
              <button
                className={styles.connectBtn}
                onClick={handleConnect}
                disabled={connecting || !currentUserId}
                title={currentUserId ? `Connect with ${alumni.display_name}` : 'Sign in to connect'}
              >
                {connecting ? '…' : '🤝 Connect'}
              </button>
            )}
          </div>
        )}
      </div>

      {alumni.excerpt && (
        <div className={styles.alumniExcerpt}>
          <p className={expanded ? styles.excerptExpanded : styles.excerptCollapsed}>
            "{alumni.excerpt}"
          </p>
          {alumni.excerpt.length > 120 && (
            <button className={styles.expandBtn} onClick={() => setExpanded((e) => !e)}>
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Connect modal ────────────────────────────────────────────
function ConnectModal({ alumni, universityId, onSent, onClose }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const MAX = 500;

  const handleSend = async () => {
    setLoading(true);
    setError('');
    try {
      const supabase = getBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError('Sign in to send a connection request'); return; }

      const res = await fetch('/api/alumni-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          alumni_user_id: alumni.user_id,
          university_id:  String(universityId),
          message:        message.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Request failed'); return; }
      onSent(json.connection);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Connect with {alumni.display_name}</h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.alumniCardMini}>
            <div className={styles.alumniAvatarSm}>{alumni.display_name[0].toUpperCase()}</div>
            <div>
              <strong>{alumni.display_name}</strong>
              <p>{alumni.program}{alumni.graduation_year ? ` · Class of ${alumni.graduation_year}` : ''}</p>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Introduce yourself <span className={styles.optional}>(optional)</span>
              <span className={styles.charCount}>{message.length}/{MAX}</span>
            </label>
            <textarea
              className={styles.textarea}
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, MAX))}
              placeholder={`Hi ${alumni.display_name}, I'm interested in your experience at this university. Would love to connect and hear more about your journey!`}
              rows={5}
            />
          </div>

          {error && <p className={styles.fieldError}>{error}</p>}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.secondaryBtn} onClick={onClose}>Cancel</button>
          <button className={styles.primaryBtn} onClick={handleSend} disabled={loading}>
            {loading ? 'Sending…' : 'Send Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────
export default function AlumniConnect({ universityId, universityName }) {
  const [alumni, setAlumni]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [connectTarget, setConnectTarget] = useState(null);
  const [toast, setToast]           = useState(null);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const supabase = getBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setCurrentUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchAlumni = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/alumni-connect?university_id=${encodeURIComponent(String(universityId))}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setAlumni(json.alumni || []);
    } catch {
      // silently fail — alumni section is supplementary
    } finally {
      setLoading(false);
    }
  }, [universityId]);

  useEffect(() => { fetchAlumni(); }, [fetchAlumni]);

  const handleConnect = (targetUserId) => {
    if (!currentUserId) {
      showToast('Sign in to connect with alumni', 'error');
      return;
    }
    const target = alumni.find((a) => a.user_id === targetUserId);
    if (target) setConnectTarget(target);
  };

  const handleRequestSent = (connection) => {
    setConnectTarget(null);
    showToast('Connection request sent! The alumni will be notified.', 'success');
    // Mark in state
    setAlumni((prev) =>
      prev.map((a) =>
        a.user_id === connection.alumni_user_id ? { ...a, _connectionStatus: 'pending' } : a
      )
    );
  };

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner} />
        <span>Loading alumni…</span>
      </div>
    );
  }

  if (alumni.length === 0) return null;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.heading}>Connect with Alumni</h3>
          <p className={styles.subheading}>
            {alumni.length} verified {universityName} alumni available to connect.
            Ask about campus life, career paths, and tips for incoming students.
          </p>
        </div>
        <div className={styles.headerBadge}>
          <span className={styles.headerBadgeIcon}>🎓</span>
          <span>{alumni.length} Alumni</span>
        </div>
      </div>

      <div className={styles.alumniGrid}>
        {alumni.map((a) => (
          <AlumniCard
            key={a.id}
            alumni={a}
            currentUserId={currentUserId}
            onConnect={handleConnect}
          />
        ))}
      </div>

      {!currentUserId && (
        <div className={styles.signInPrompt}>
          <span>🔐</span>
          <p>Sign in to send connection requests to alumni</p>
        </div>
      )}

      {connectTarget && (
        <ConnectModal
          alumni={connectTarget}
          universityId={universityId}
          onSent={handleRequestSent}
          onClose={() => setConnectTarget(null)}
        />
      )}

      {toast && (
        <div className={`${styles.toast} ${styles[`toast_${toast.type}`]}`} role="status">
          {toast.msg}
        </div>
      )}
    </div>
  );
}
