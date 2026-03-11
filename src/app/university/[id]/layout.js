import { universities } from '@/data/universities';

export async function generateStaticParams() {
  return universities.map((u) => ({ id: String(u.id) }));
}

export async function generateMetadata({ params }) {
  const resolved = await params;
  const id = resolved?.id ? parseInt(resolved.id, 10) : null;
  const uni = id ? universities.find((u) => u.id === id) : null;
  if (!uni) {
    return {
      title: 'University Not Found | Ilm Se Urooj',
      robots: { index: false },
    };
  }

  const title = `${uni.shortName} — ${uni.city} | Admissions, Programs & Deadlines | Ilm Se Urooj`;

  // Build a rich description from available data
  const topFields = Object.entries(uni.fieldRankings || {})
    .sort((a, b) => a[1] - b[1])
    .slice(0, 2)
    .map(([field, rank]) => `#${rank} in ${field}`)
    .join(', ');
  const fieldLine = topFields ? ` Ranked ${topFields}.` : '';
  const feeLine = uni.avgFee ? ` Avg fee: ${uni.avgFee}.` : '';
  const description = uni.description
    ? `${uni.description}${fieldLine}${feeLine}`
    : `Explore ${uni.name} (${uni.shortName}) in ${uni.city}, Pakistan.${fieldLine} Programs, fees, entry tests, admissions deadlines, and how to apply.${feeLine}`;

  const keywords = [
    uni.shortName,
    uni.name,
    uni.city,
    'admission',
    'deadline',
    'merit',
    ...(uni.fields || []),
  ].join(', ');

  return {
    title,
    description,
    keywords,
    openGraph: {
      type: 'website',
      locale: 'en_PK',
      siteName: 'Ilm Se Urooj',
      title,
      description,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: `/university/${uni.id}`,
    },
  };
}

export default function UniversityLayout({ children }) {
  return children;
}
