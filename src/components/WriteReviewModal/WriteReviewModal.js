'use client';

import { useState, useEffect, useCallback } from 'react';
import { getBrowserClient } from '@/lib/supabase-browser';
import styles from './WriteReviewModal.module.css';

const CATEGORIES = [
  { key: 'academics_rating',   label: 'Academics',   desc: 'Curriculum quality, learning outcomes, academic rigour' },
  { key: 'facilities_rating',  label: 'Facilities',  desc: 'Labs, library, sports, hostels, cafeterias' },
  { key: 'faculty_rating',     label: 'Faculty',     desc: 'Teaching quality, accessibility, expertise' },
  { key: 'campus_life_rating', label: 'Campus Life', desc: 'Societies, events, student community, environment' },
  { key: 'value_rating',       label: 'Value',       desc: 'Education quality relative to fees paid' },
];

const STEPS = ['type', 'ratings', 'review', 'verify'];

function StarInput({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value || 0;

  return (
    <span className={styles.starInput}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`${styles.starBtn} ${n <= display ? styles.starBtnFilled : ''}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          aria-label={`${n} star${n !== 1 ? 's' : ''}`}
        >★</button>
      ))}
      {value > 0 && <span className={styles.starValue}>{['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][value]}</span>}
    </span>
  );
}

function StepIndicator({ current }) {
  const labels = ['Type', 'Ratings', 'Review', 'Verify'];
  return (
    <div className={styles.stepIndicator} aria-label="Step progress">
      {labels.map((label, i) => (
        <div key={i} className={styles.stepItem}>
          <div className={`${styles.stepDot} ${i < current ? styles.stepDotDone : i === current ? styles.stepDotActive : ''}`}>
            {i < current ? '✓' : i + 1}
          </div>
          <span className={`${styles.stepLabel} ${i === current ? styles.stepLabelActive : ''}`}>{label}</span>
          {i < labels.length - 1 && <div className={`${styles.stepLine} ${i < current ? styles.stepLineDone : ''}`} />}
        </div>
      ))}
    </div>
  );
}

// ─── OTP verification sub-form ────────────────────────────────
function VerifyStep({ universityId, universityName, isAlreadyVerified, onVerified }) {
  const [email, setEmail]       = useState('');
  const [otp, setOtp]           = useState('');
  const [phase, setPhase]       = useState('email'); // 'email' | 'otp'
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const sendOtp = async () => {
    setError('');
    if (!email.trim()) { setError('Enter your university email'); return; }
    setLoading(true);
    try {
      const supabase = getBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError('You must be signed in'); return; }

      const res = await fetch('/api/reviews/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ university_id: String(universityId), edu_email: email.trim(), university_name: universityName }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Failed to send OTP'); return; }

      setPhase('otp');
      setCountdown(60);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setError('');
    if (!/^\d{6}$/.test(otp.trim())) { setError('Enter the 6-digit code from your email'); return; }
    setLoading(true);
    try {
      const supabase = getBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError('You must be signed in'); return; }

      const res = await fetch('/api/reviews/verify', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ university_id: String(universityId), otp: otp.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Verification failed'); return; }

      setSuccess(true);
      setTimeout(() => onVerified(), 1200);
    } finally {
      setLoading(false);
    }
  };

  if (isAlreadyVerified) {
    return (
      <div className={styles.verifyAlready}>
        <span className={styles.verifyCheckmark}>✓</span>
        <p>Your university email is already verified!</p>
        <p className={styles.verifyHint}>Your review will display the Verified badge.</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className={styles.verifySuccess}>
        <span className={styles.verifyCheckmark}>✓</span>
        <p>Email verified! Your review now shows the Verified badge.</p>
      </div>
    );
  }

  return (
    <div className={styles.verifyStep}>
      <div className={styles.verifyInfo}>
        <span className={styles.verifyIcon}>🎓</span>
        <div>
          <p className={styles.verifyTitle}>Verify with your university email</p>
          <p className={styles.verifyDesc}>
            Use your official <strong>{universityName}</strong> email (e.g. student@lums.edu.pk)
            to get the <span className={styles.verifiedBadgeInline}>✓ Verified</span> badge on your review.
            This is optional — you can skip and verify later.
          </p>
        </div>
      </div>

      {phase === 'email' ? (
        <div className={styles.verifyForm}>
          <input
            type="email"
            className={styles.input}
            placeholder="your.name@university.edu.pk"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
            disabled={loading}
          />
          {error && <p className={styles.fieldError}>{error}</p>}
          <button className={styles.primaryBtn} onClick={sendOtp} disabled={loading || !email.trim()}>
            {loading ? 'Sending…' : 'Send verification code'}
          </button>
        </div>
      ) : (
        <div className={styles.verifyForm}>
          <p className={styles.otpSentNote}>Code sent to <strong>{email}</strong>. Check your inbox (and spam folder).</p>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            className={`${styles.input} ${styles.inputOtp}`}
            placeholder="6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyDown={(e) => e.key === 'Enter' && verifyOtp()}
            disabled={loading}
            autoFocus
          />
          {error && <p className={styles.fieldError}>{error}</p>}
          <button className={styles.primaryBtn} onClick={verifyOtp} disabled={loading || otp.length !== 6}>
            {loading ? 'Verifying…' : 'Verify'}
          </button>
          <button
            className={styles.resendBtn}
            onClick={() => { setPhase('email'); setOtp(''); }}
            disabled={countdown > 0}
          >
            {countdown > 0 ? `Resend in ${countdown}s` : 'Use a different email'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main modal ────────────────────────────────────────────────
export default function WriteReviewModal({ universityId, universityName, existingReview, onSaved, onClose }) {
  const [step, setStep] = useState(0);

  // Form state
  const [reviewerType, setReviewerType] = useState(existingReview?.reviewer_type || '');
  const [ratings, setRatings] = useState({
    overall_rating:      existingReview?.overall_rating      || 0,
    academics_rating:    existingReview?.academics_rating    || 0,
    facilities_rating:   existingReview?.facilities_rating   || 0,
    faculty_rating:      existingReview?.faculty_rating      || 0,
    campus_life_rating:  existingReview?.campus_life_rating  || 0,
    value_rating:        existingReview?.value_rating        || 0,
  });
  const [title,         setTitle]          = useState(existingReview?.title          || '');
  const [body,          setBody]           = useState(existingReview?.body           || '');
  const [pros,          setPros]           = useState(existingReview?.pros           || '');
  const [cons,          setCons]           = useState(existingReview?.cons           || '');
  const [program,       setProgram]        = useState(existingReview?.program        || '');
  const [batchYear,     setBatchYear]      = useState(existingReview?.batch_year     || '');
  const [graduationYear,setGraduationYear] = useState(existingReview?.graduation_year || '');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [errors, setErrors]         = useState({});

  const isEditing = !!existingReview;
  const isVerified = existingReview?.is_verified || false;

  const validateStep = () => {
    const e = {};
    if (step === 0 && !reviewerType) e.reviewerType = 'Please select your status';
    if (step === 1 && !ratings.overall_rating) e.overall = 'Overall rating is required';
    if (step === 2) {
      if (title.trim().length < 5)  e.title = 'Title must be at least 5 characters';
      if (body.trim().length < 50)  e.body  = 'Review must be at least 50 characters';
      if (body.trim().length > 2000) e.body = 'Review must be under 2000 characters';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    setError('');
    try {
      const supabase = getBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError('You must be signed in'); return; }

      const payload = {
        university_id: String(universityId),
        reviewer_type: reviewerType,
        ...ratings,
        title:           title.trim(),
        body:            body.trim(),
        pros:            pros.trim() || null,
        cons:            cons.trim() || null,
        program:         program.trim() || null,
        batch_year:      batchYear      ? Number(batchYear)      : null,
        graduation_year: graduationYear ? Number(graduationYear) : null,
      };

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Failed to save review'); return; }

      // Move to verification step
      setStep(3);
    } finally {
      setSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 15 }, (_, i) => currentYear - i);

  // Trap focus inside modal
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick} role="dialog" aria-modal="true" aria-label={`${isEditing ? 'Edit' : 'Write'} review for ${universityName}`}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>{isEditing ? 'Edit Your Review' : 'Write a Review'}</h3>
            <p className={styles.modalSub}>{universityName}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <StepIndicator current={step} />

        <div className={styles.modalBody}>

          {/* ── Step 0: Type ── */}
          {step === 0 && (
            <div className={styles.stepContent}>
              <h4 className={styles.stepTitle}>What is your relationship with {universityName}?</h4>
              <div className={styles.typeCards}>
                <button
                  type="button"
                  className={`${styles.typeCard} ${reviewerType === 'current_student' ? styles.typeCardActive : ''}`}
                  onClick={() => setReviewerType('current_student')}
                >
                  <span className={styles.typeCardIcon}>🎓</span>
                  <strong>Current Student</strong>
                  <p>You are currently enrolled at {universityName}</p>
                </button>
                <button
                  type="button"
                  className={`${styles.typeCard} ${reviewerType === 'alumni' ? styles.typeCardActive : ''}`}
                  onClick={() => setReviewerType('alumni')}
                >
                  <span className={styles.typeCardIcon}>👔</span>
                  <strong>Alumni</strong>
                  <p>You have graduated from {universityName}</p>
                </button>
              </div>
              {errors.reviewerType && <p className={styles.fieldError}>{errors.reviewerType}</p>}

              <div className={styles.contextFields}>
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.label}>Program <span className={styles.optional}>(optional)</span></label>
                    <input
                      className={styles.input}
                      value={program}
                      onChange={(e) => setProgram(e.target.value)}
                      placeholder="e.g. BS Computer Science"
                      maxLength={150}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>{reviewerType === 'alumni' ? 'Graduation Year' : 'Batch Year'} <span className={styles.optional}>(optional)</span></label>
                    <select
                      className={styles.input}
                      value={reviewerType === 'alumni' ? graduationYear : batchYear}
                      onChange={(e) => reviewerType === 'alumni' ? setGraduationYear(e.target.value) : setBatchYear(e.target.value)}
                    >
                      <option value="">Select year</option>
                      {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 1: Ratings ── */}
          {step === 1 && (
            <div className={styles.stepContent}>
              <h4 className={styles.stepTitle}>Rate your experience</h4>

              <div className={styles.ratingSection}>
                <div className={`${styles.overallRating} ${errors.overall ? styles.overallRatingError : ''}`}>
                  <label className={styles.overallLabel}>Overall rating <span className={styles.required}>*</span></label>
                  <StarInput value={ratings.overall_rating} onChange={(v) => setRatings((r) => ({ ...r, overall_rating: v }))} />
                  {errors.overall && <p className={styles.fieldError}>{errors.overall}</p>}
                </div>

                <div className={styles.categoryRatings}>
                  {CATEGORIES.map(({ key, label, desc }) => (
                    <div key={key} className={styles.categoryRating}>
                      <div className={styles.categoryRatingInfo}>
                        <span className={styles.categoryRatingLabel}>{label}</span>
                        <span className={styles.categoryRatingDesc}>{desc}</span>
                      </div>
                      <StarInput value={ratings[key]} onChange={(v) => setRatings((r) => ({ ...r, [key]: v }))} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Review text ── */}
          {step === 2 && (
            <div className={styles.stepContent}>
              <h4 className={styles.stepTitle}>Write your review</h4>

              <div className={styles.field}>
                <label className={styles.label}>Review title <span className={styles.required}>*</span></label>
                <input
                  className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Summarise your experience in one line"
                  maxLength={150}
                />
                {errors.title && <p className={styles.fieldError}>{errors.title}</p>}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Your experience <span className={styles.required}>*</span>
                  <span className={styles.charCount}>{body.length}/2000</span>
                </label>
                <textarea
                  className={`${styles.textarea} ${errors.body ? styles.inputError : ''}`}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Share your genuine experience — academics, environment, opportunities, social life, what you wish you knew before applying..."
                  rows={6}
                  maxLength={2000}
                />
                {errors.body && <p className={styles.fieldError}>{errors.body}</p>}
              </div>

              <div className={styles.prosConsRow}>
                <div className={styles.field}>
                  <label className={styles.label}>
                    Pros <span className={styles.optional}>(optional)</span>
                  </label>
                  <textarea
                    className={styles.textarea}
                    value={pros}
                    onChange={(e) => setPros(e.target.value)}
                    placeholder="Best things about this university…"
                    rows={3}
                    maxLength={500}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>
                    Cons <span className={styles.optional}>(optional)</span>
                  </label>
                  <textarea
                    className={styles.textarea}
                    value={cons}
                    onChange={(e) => setCons(e.target.value)}
                    placeholder="Areas that need improvement…"
                    rows={3}
                    maxLength={500}
                  />
                </div>
              </div>

              {error && <p className={styles.globalError}>{error}</p>}
            </div>
          )}

          {/* ── Step 3: Verify ── */}
          {step === 3 && (
            <VerifyStep
              universityId={universityId}
              universityName={universityName}
              isAlreadyVerified={isVerified}
              onVerified={onSaved}
            />
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          {step > 0 && step < 3 && (
            <button className={styles.secondaryBtn} onClick={handleBack} disabled={submitting}>
              ← Back
            </button>
          )}

          <div className={styles.footerRight}>
            {step < 2 && (
              <button className={styles.primaryBtn} onClick={handleNext}>
                Continue →
              </button>
            )}

            {step === 2 && (
              <button className={styles.primaryBtn} onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Saving…' : isEditing ? 'Update Review' : 'Submit Review'}
              </button>
            )}

            {step === 3 && (
              <>
                <button className={styles.secondaryBtn} onClick={onSaved}>
                  Skip verification
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
