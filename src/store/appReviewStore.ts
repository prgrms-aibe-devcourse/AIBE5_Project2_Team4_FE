import { FREELANCERS } from './appFreelancerStore';

export interface ReviewRecord {
  id: number;
  projectId: number;
  freelancerId: number;
  freelancerName: string;
  authorName: string;
  authorEmail: string;
  rating: number;
  tags: string[];
  content: string;
  date: string;
  blinded: boolean;
  reported: boolean;
  reportReason?: string;
}

export interface ReviewInput {
  projectId: number;
  freelancerId: number;
  freelancerName: string;
  authorName: string;
  authorEmail: string;
  rating: number;
  tags: string[];
  content: string;
}

const REVIEW_KEY = 'stella_reviews';

const DEFAULT_REVIEW_TAGS = ['친절함', '정시 도착', '소통 원활', '전문성', '재이용 의사'];

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

function seedReviews(): ReviewRecord[] {
  const seededReviews: ReviewRecord[] = [];

  FREELANCERS.forEach((freelancer, freelancerIndex) => {
    freelancer.reviews.forEach((review, reviewIndex) => {
      seededReviews.push({
        id: Number(`${freelancer.id}${reviewIndex + 1}`),
        projectId: freelancerIndex * 100 + reviewIndex + 1,
        freelancerId: freelancer.id,
        freelancerName: freelancer.name,
        authorName: review.author,
        authorEmail: `seed-${freelancer.id}-${reviewIndex + 1}@stella.ai`,
        rating: review.rating,
        tags: DEFAULT_REVIEW_TAGS.slice(0, Math.min(3, review.rating)),
        content: review.content,
        date: review.date,
        blinded: false,
        reported: false,
      });
    });
  });

  return seededReviews;
}

function writeReviews(reviews: ReviewRecord[]): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(REVIEW_KEY, JSON.stringify(reviews));
}

export function getReviews(includeBlinded = false): ReviewRecord[] {
  const storage = getStorage();
  const defaultReviews = seedReviews();
  if (!storage) {
    return includeBlinded ? defaultReviews : defaultReviews.filter((review) => !review.blinded);
  }

  const stored = storage.getItem(REVIEW_KEY);
  if (!stored) {
    writeReviews(defaultReviews);
    return includeBlinded ? defaultReviews : defaultReviews.filter((review) => !review.blinded);
  }

  const reviews = JSON.parse(stored) as ReviewRecord[];
  return includeBlinded ? reviews : reviews.filter((review) => !review.blinded);
}

export function getReviewsForFreelancer(freelancerId: number, includeBlinded = false): ReviewRecord[] {
  return getReviews(includeBlinded).filter((review) => review.freelancerId === freelancerId);
}

export function getReviewsByAuthor(authorEmail: string): ReviewRecord[] {
  return getReviews(true).filter((review) => review.authorEmail === authorEmail);
}

export function getReviewByProject(projectId: number, authorEmail: string): ReviewRecord | null {
  return getReviews(true).find((review) => review.projectId === projectId && review.authorEmail === authorEmail) ?? null;
}

export function createReview(input: ReviewInput): ReviewRecord {
  const nextReview: ReviewRecord = {
    id: Date.now(),
    ...input,
    date: new Date().toLocaleDateString('ko-KR'),
    blinded: false,
    reported: false,
  };

  writeReviews([nextReview, ...getReviews(true)]);
  return nextReview;
}

export function updateReview(
  reviewId: number,
  input: Pick<ReviewInput, 'rating' | 'tags' | 'content'>,
): ReviewRecord | null {
  let updatedReview: ReviewRecord | null = null;
  const nextReviews = getReviews(true).map((review) => {
    if (review.id !== reviewId) {
      return review;
    }

    updatedReview = { ...review, ...input };
    return updatedReview;
  });

  writeReviews(nextReviews);
  return updatedReview;
}

export function deleteReview(reviewId: number): void {
  writeReviews(getReviews(true).filter((review) => review.id !== reviewId));
}

export function reportReview(reviewId: number, reportReason: string): ReviewRecord | null {
  let updatedReview: ReviewRecord | null = null;
  const nextReviews = getReviews(true).map((review) => {
    if (review.id !== reviewId) {
      return review;
    }

    updatedReview = { ...review, reported: true, reportReason };
    return updatedReview;
  });

  writeReviews(nextReviews);
  return updatedReview;
}

export function toggleReviewBlind(reviewId: number): ReviewRecord | null {
  let updatedReview: ReviewRecord | null = null;
  const nextReviews = getReviews(true).map((review) => {
    if (review.id !== reviewId) {
      return review;
    }

    updatedReview = { ...review, blinded: !review.blinded };
    return updatedReview;
  });

  writeReviews(nextReviews);
  return updatedReview;
}

export function clearReviewReport(reviewId: number): ReviewRecord | null {
  let updatedReview: ReviewRecord | null = null;
  const nextReviews = getReviews(true).map((review) => {
    if (review.id !== reviewId) {
      return review;
    }

    updatedReview = { ...review, reported: false, reportReason: undefined };
    return updatedReview;
  });

  writeReviews(nextReviews);
  return updatedReview;
}

export function getReportedReviews(): ReviewRecord[] {
  return getReviews(true).filter((review) => review.reported);
}

export function getFreelancerReviewSummary(freelancerId: number): {
  reviewCount: number;
  averageRating: number;
  reviews: ReviewRecord[];
} {
  const reviews = getReviewsForFreelancer(freelancerId);
  const reviewCount = reviews.length;
  const averageRating = reviewCount === 0
    ? 0
    : reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount;

  return {
    reviewCount,
    averageRating,
    reviews,
  };
}

export function getReviewTags(): string[] {
  return DEFAULT_REVIEW_TAGS;
}
