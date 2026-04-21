/* eslint-disable @typescript-eslint/no-unused-vars */

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

// Legacy compatibility shim. Live review/report data now comes from src/api/reviews.ts and src/api/reports.ts.
export function getReviews(_includeBlinded = false): ReviewRecord[] {
  return [];
}

export function getReviewsForFreelancer(_freelancerId: number, _includeBlinded = false): ReviewRecord[] {
  return [];
}

export function getReviewsByAuthor(_authorEmail: string): ReviewRecord[] {
  return [];
}

export function getReviewByProject(_projectId: number, _authorEmail: string): ReviewRecord | null {
  return null;
}

export function createReview(_input: ReviewInput): ReviewRecord {
  throw new Error('appReviewStore mock is removed. Use src/api/reviews.ts.');
}

export function updateReview(
  _reviewId: number,
  _input: Pick<ReviewInput, 'rating' | 'tags' | 'content'>,
): ReviewRecord | null {
  return null;
}

export function deleteReview(_reviewId: number): void {}

export function reportReview(_reviewId: number, _reportReason: string): ReviewRecord | null {
  return null;
}

export function toggleReviewBlind(_reviewId: number): ReviewRecord | null {
  return null;
}

export function clearReviewReport(_reviewId: number): ReviewRecord | null {
  return null;
}

export function getReportedReviews(): ReviewRecord[] {
  return [];
}

export function getFreelancerReviewSummary(_freelancerId: number): {
  reviewCount: number;
  averageRating: number;
  reviews: ReviewRecord[];
} {
  return {
    reviewCount: 0,
    averageRating: 0,
    reviews: [],
  };
}

export function getReviewTags(): string[] {
  return [];
}
