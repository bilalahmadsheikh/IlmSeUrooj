import { universities } from '@/data/universities';

export async function generateStaticParams() {
  return universities.map((u) => ({ id: String(u.id) }));
}

export async function generateMetadata({ params }) {
  const resolved = await params;
  const id = resolved?.id ? parseInt(resolved.id, 10) : null;
  const uni = id ? universities.find((u) => u.id === id) : null;
  if (!uni) {
    return { title: 'University Not Found | Ilm Se Urooj' };
  }
  return {
    title: `${uni.shortName} - Admissions, Programs & Deadlines | Ilm Se Urooj`,
    description: uni.description || `Explore ${uni.shortName} - ${uni.city}. Programs, fees, admissions deadlines, and how to apply.`,
  };
}

export default function UniversityLayout({ children }) {
  return children;
}
