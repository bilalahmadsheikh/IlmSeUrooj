'use client';

import { useState, useEffect, useCallback } from 'react';
import { getBrowserClient } from '@/lib/supabase-browser';
import WriteReviewModal from '@/components/WriteReviewModal/WriteReviewModal';
import styles from './UniversityReviews.module.css';

// ─── Star rendering ──────────────────────────────────────────
function Stars({ value, size = 'md', interactive = false, onChange }) {
  const [hovered, setHovered] = useState(0);
  const display = interactive ? (hovered || value || 0) : (value || 0);

  return (
    <span className={`${styles.stars} ${styles[`stars_${size}`]}`} aria-label={`${display} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`${styles.star} ${n <= display ? styles.starFilled : styles.starEmpty}`}
          onClick={interactive && onChange ? () => onChange(n) : undefined}
          onMouseEnter={interactive ? () => setHovered(n) : undefined}
          onMouseLeave={interactive ? () => setHovered(0) : undefined}
          role={interactive ? 'button' : undefined}
          tabIndex={interactive ? 0 : undefined}
          onKeyDown={interactive && onChange ? (e) => e.key === 'Enter' && onChange(n) : undefined}
          aria-label={interactive ? `Rate ${n} star${n !== 1 ? 's' : ''}` : undefined}
        >★</span>
      ))}
    </span>
  );
}

// ─── Rating bar (distribution) ───────────────────────────────
function RatingBar({ label, value, total }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className={styles.ratingBarRow}>
      <span className={styles.ratingBarLabel}>{label}</span>
      <div className={styles.ratingBarTrack}>
        <div className={styles.ratingBarFill} style={{ width: `${pct}%` }} />
      </div>
      <span className={styles.ratingBarCount}>{value}</span>
    </div>
  );
}

// ─── Category rating pill ─────────────────────────────────────
function CategoryBadge({ label, value }) {
  if (!value) return null;
  const color = value >= 4 ? 'good' : value >= 3 ? 'avg' : 'poor';
  return (
    <span className={`${styles.catBadge} ${styles[`catBadge_${color}`]}`}>
      {label} <strong>{value.toFixed(1)}</strong>
    </span>
  );
}

// ─── Single review card ───────────────────────────────────────
function ReviewCard({ review, currentUserId, onHelpful, onDelete, onFlag }) {
  const [helpfulPending, setHelpfulPending] = useState(false);
  const [voted, setVoted] = useState(false);
  const isOwn = currentUserId && review.user_id === currentUserId;

  const handleHelpful = async () => {
    if (helpfulPending) return;
    setHelpfulPending(true);
    try {
      await onHelpful(review.id);
      setVoted((v) => !v);
    } finally {
      setHelpfulPending(false);
    }
  };

  const timeSince = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days}d ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  };

  return (
    <article className={styles.reviewCard}>
      <div className={styles.reviewCardHeader}>
        <div className={styles.reviewerInfo}>
          <div className={styles.reviewerAvatar}>{(review.reviewer_name || 'A')[0].toUpperCase()}</div>
          <div>
            <div className={styles.reviewerName}>
              {review.reviewer_name || 'Anonymous'}
              {review.is_verified && (
                <span className={styles.verifiedBadge} title="Verified university email">
                  ✓ Verified
                </span>
              )}
              <span className={`${styles.typeBadge} ${review.reviewer_type === 'alumni' ? styles.typeBadgeAlumni : styles.typeBadgeStudent}`}>
                {review.reviewer_type === 'alumni' ? 'Alumni' : 'Current Student'}
              </span>
            </div>
            <div className={styles.reviewMeta}>
              {review.program && <span>{review.program}</span>}
              {review.batch_year && <span>Batch {review.batch_year}</span>}
              {review.graduation_year && <span>Graduated {review.graduation_year}</span>}
              <span>{timeSince(review.created_at)}</span>
            </div>
          </div>
        </div>
        <div className={styles.reviewRatingBlock}>
          <Stars value={review.overall_rating} size="sm" />
          <span className={styles.reviewRatingNum}>{review.overall_rating}/5</span>
        </div>
      </div>

      <h4 className={styles.reviewTitle}>{review.title}</h4>
      <p className={styles.reviewBody}>{review.body}</p>

      {(review.pros || review.cons) && (
        <div className={styles.prosConsGrid}>
          {review.pros && (
            <div className={styles.prosBlock}>
              <span className={styles.prosLabel}>👍 Pros</span>
              <p>{review.pros}</p>
            </div>
          )}
          {review.cons && (
            <div className={styles.consBlock}>
              <span className={styles.consLabel}>👎 Cons</span>
              <p>{review.cons}</p>
            </div>
          )}
        </div>
      )}

      {/* Sub-ratings */}
      <div className={styles.subRatings}>
        <CategoryBadge label="Academics"   value={review.academics_rating} />
        <CategoryBadge label="Facilities"  value={review.facilities_rating} />
        <CategoryBadge label="Faculty"     value={review.faculty_rating} />
        <CategoryBadge label="Campus Life" value={review.campus_life_rating} />
        <CategoryBadge label="Value"       value={review.value_rating} />
      </div>

      <div className={styles.reviewCardFooter}>
        <button
          className={`${styles.helpfulBtn} ${voted ? styles.helpfulBtnVoted : ''}`}
          onClick={handleHelpful}
          disabled={helpfulPending || !currentUserId}
          title={currentUserId ? 'Mark as helpful' : 'Sign in to vote'}
        >
          👍 Helpful {review.helpful_count > 0 && `(${review.helpful_count})`}
        </button>

        {!isOwn && currentUserId && (
          <button className={styles.flagBtn} onClick={() => onFlag(review.id)} title="Report this review">
            ⚑ Report
          </button>
        )}

        {isOwn && (
          <button className={styles.deleteBtn} onClick={() => onDelete(review.id)}>
            Delete my review
          </button>
        )}
      </div>
    </article>
  );
}

// ─── Aggregate summary block ──────────────────────────────────
function AggregateSummary({ agg, total }) {
  if (!agg) return null;
  const { averages, distribution } = agg;

  return (
    <div className={styles.aggregateWrap}>
      <div className={styles.overallScore}>
        <span className={styles.overallNum}>{averages.overall_rating?.toFixed(1) ?? '—'}</span>
        <Stars value={Math.round(averages.overall_rating || 0)} size="lg" />
        <span className={styles.totalReviews}>{total} review{total !== 1 ? 's' : ''}</span>
      </div>

      <div className={styles.distributionWrap}>
        {[5, 4, 3, 2, 1].map((n) => (
          <RatingBar key={n} label={`${n}★`} value={distribution[n] || 0} total={total} />
        ))}
      </div>

      <div className={styles.categoriesWrap}>
        {[
          { key: 'academics_rating',   label: 'Academics' },
          { key: 'facilities_rating',  label: 'Facilities' },
          { key: 'faculty_rating',     label: 'Faculty' },
          { key: 'campus_life_rating', label: 'Campus Life' },
          { key: 'value_rating',       label: 'Value' },
        ].map(({ key, label }) =>
          averages[key] != null ? (
            <div key={key} className={styles.categoryRow}>
              <span className={styles.categoryLabel}>{label}</span>
              <div className={styles.categoryBarTrack}>
                <div
                  className={styles.categoryBarFill}
                  style={{ width: `${(averages[key] / 5) * 100}%` }}
                />
              </div>
              <span className={styles.categoryScore}>{averages[key].toFixed(1)}</span>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────
export default function UniversityReviews({ universityId, universityName }) {
  const [reviews, setReviews]       = useState([]);
  const [aggregate, setAggregate]   = useState(null);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [pages, setPages]           = useState(1);
  const [loading, setLoading]       = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy]         = useState('created_at');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showModal, setShowModal]   = useState(false);
  const [myReview, setMyReview]     = useState(null);
  const [toast, setToast]           = useState(null);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Get current user
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

  // Fetch reviews
  const fetchReviews = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        university_id: String(universityId),
        sort:  sortBy,
        page:  String(pg),
        ...(typeFilter ? { type: typeFilter } : {}),
      });
      const res  = await fetch(`/api/reviews?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setReviews(json.reviews || []);
      setAggregate(json.aggregate);
      setTotal(json.total || 0);
      setPage(pg);
      setPages(json.pages || 1);
    } catch (e) {
      showToast(e.message || 'Could not load reviews', 'error');
    } finally {
      setLoading(false);
    }
  }, [universityId, sortBy, typeFilter]);

  // Fetch current user's own review if logged in
  const fetchMyReview = useCallback(async () => {
    if (!currentUserId) { setMyReview(null); return; }
    const supabase = getBrowserClient();
    const { data } = await supabase
      .from('university_reviews')
      .select('*')
      .eq('user_id', currentUserId)
      .eq('university_id', String(universityId))
      .maybeSingle();
    setMyReview(data || null);
  }, [currentUserId, universityId]);

  useEffect(() => { fetchReviews(1); }, [fetchReviews]);
  useEffect(() => { fetchMyReview(); }, [fetchMyReview]);

  const handleHelpful = async (reviewId) => {
    const supabase = getBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { showToast('Sign in to vote', 'error'); return; }
    const token = session.access_token;
    await fetch(`/api/reviews/${reviewId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'helpful' }),
    });
    // Refresh counts
    fetchReviews(page);
  };

  const handleDelete = async (reviewId) => {
    if (!confirm('Delete your review? This cannot be undone.')) return;
    const supabase = getBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch(`/api/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) {
      showToast('Review deleted.', 'success');
      setMyReview(null);
      fetchReviews(page);
    } else {
      showToast('Could not delete review.', 'error');
    }
  };

  const handleFlag = async (reviewId) => {
    if (!confirm('Report this review as inappropriate?')) return;
    const supabase = getBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch(`/api/reviews/${reviewId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ action: 'flag' }),
    });
    showToast('Review reported. Thank you.', 'success');
  };

  const handleReviewSaved = () => {
    fetchMyReview();
    fetchReviews(1);
    setShowModal(false);
    showToast('Review saved! Verify your university email to get the Verified badge.', 'success');
  };

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.heading}>Student Reviews</h2>
          <p className={styles.subheading}>
            Real experiences from {universityName} students and alumni.
            Verified via official university emails.
          </p>
        </div>
        <button
          className={styles.writeBtn}
          onClick={() => {
            if (!currentUserId) { showToast('Sign in to write a review', 'error'); return; }
            setShowModal(true);
          }}
        >
          {myReview ? '✏️ Edit My Review' : '✍️ Write a Review'}
        </button>
      </div>

      {/* Aggregate */}
      {aggregate && <AggregateSummary agg={aggregate} total={total} />}

      {/* Filters */}
      <div className={styles.filtersBar}>
        <div className={styles.filterGroup}>
          <button
            className={`${styles.filterBtn} ${!typeFilter ? styles.filterBtnActive : ''}`}
            onClick={() => setTypeFilter('')}
          >All</button>
          <button
            className={`${styles.filterBtn} ${typeFilter === 'current_student' ? styles.filterBtnActive : ''}`}
            onClick={() => setTypeFilter('current_student')}
          >Current Students</button>
          <button
            className={`${styles.filterBtn} ${typeFilter === 'alumni' ? styles.filterBtnActive : ''}`}
            onClick={() => setTypeFilter('alumni')}
          >Alumni</button>
        </div>
        <select
          className={styles.sortSelect}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="created_at">Newest first</option>
          <option value="overall_rating">Highest rated</option>
          <option value="helpful_count">Most helpful</option>
        </select>
      </div>

      {/* My unverified review banner */}
      {myReview && !myReview.is_verified && (
        <div className={styles.unverifiedBanner}>
          <span>⚠️ Your review is unverified. Add your university email to get the Verified badge.</span>
          <button className={styles.verifyNowBtn} onClick={() => setShowModal(true)}>
            Verify now
          </button>
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.loadingSpinner} />
          <span>Loading reviews…</span>
        </div>
      ) : reviews.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📝</span>
          <p>No reviews yet for {universityName}.</p>
          <p className={styles.emptyHint}>Be the first to share your experience!</p>
          <button
            className={styles.writeBtn}
            onClick={() => {
              if (!currentUserId) { showToast('Sign in to write a review', 'error'); return; }
              setShowModal(true);
            }}
          >
            Write the first review
          </button>
        </div>
      ) : (
        <div className={styles.reviewsList}>
          {reviews.map((r) => (
            <ReviewCard
              key={r.id}
              review={r}
              currentUserId={currentUserId}
              onHelpful={handleHelpful}
              onDelete={handleDelete}
              onFlag={handleFlag}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={page <= 1}
            onClick={() => fetchReviews(page - 1)}
          >← Prev</button>
          <span className={styles.pageInfo}>Page {page} of {pages}</span>
          <button
            className={styles.pageBtn}
            disabled={page >= pages}
            onClick={() => fetchReviews(page + 1)}
          >Next →</button>
        </div>
      )}

      {/* Write/Edit modal */}
      {showModal && (
        <WriteReviewModal
          universityId={universityId}
          universityName={universityName}
          existingReview={myReview}
          onSaved={handleReviewSaved}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${styles[`toast_${toast.type}`]}`} role="status">
          {toast.msg}
        </div>
      )}
    </div>
  );
}
