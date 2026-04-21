-- ============================================================
-- Anqa — Review Helper Functions
-- Migration 007: Atomic increment/decrement for helpful_count
-- Run this AFTER 006_university_reviews.sql
-- ============================================================

-- increment_helpful_count: safely increments helpful_count for a review
CREATE OR REPLACE FUNCTION increment_helpful_count(review_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE university_reviews
  SET helpful_count = GREATEST(helpful_count + 1, 0)
  WHERE id = review_id;
END;
$$;

-- decrement_helpful_count: safely decrements helpful_count (floor 0)
CREATE OR REPLACE FUNCTION decrement_helpful_count(review_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE university_reviews
  SET helpful_count = GREATEST(helpful_count - 1, 0)
  WHERE id = review_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION increment_helpful_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_helpful_count(UUID) TO authenticated;
