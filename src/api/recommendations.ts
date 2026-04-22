import { requestJson } from './client';

export interface FreelancerRecommendationRequest {
  projectId?: number | null;
  projectTypeCode: string;
  serviceRegionCode: string;
  timeSlotCode?: string | null;
  requestedStartAt?: string | null;
  requestedEndAt?: string | null;
  size?: number | null;
}

export interface RecommendationWeightsResponse {
  projectTypeWeight: number;
  regionWeight: number;
  timeSlotWeight: number;
  verifiedWeight: number;
  ratingWeight: number;
  activityWeight: number;
}

export interface FreelancerRecommendationItemResponse {
  rank: number;
  freelancerProfileId: number;
  userId: number;
  name: string;
  intro?: string | null;
  careerDescription?: string | null;
  caregiverYn: boolean;
  verifiedYn: boolean;
  averageRating?: number | null;
  activityCount?: number | null;
  activityRegionCodes: string[];
  availableTimeSlotCodes: string[];
  projectTypeCodes: string[];
  matchScore: number;
  reHireRate: number;
  matchReasons: string[];
}

export interface FreelancerRecommendationResponse {
  projectId?: number | null;
  projectTypeCode?: string | null;
  serviceRegionCode?: string | null;
  timeSlotCode?: string | null;
  aiApplied: boolean;
  scoringMode: string;
  weights: RecommendationWeightsResponse;
  totalCandidates: number;
  recommendations: FreelancerRecommendationItemResponse[];
}

export function recommendFreelancers(
  request: FreelancerRecommendationRequest,
): Promise<FreelancerRecommendationResponse> {
  return requestJson<FreelancerRecommendationResponse>('/api/v1/recommendations/freelancers/public', {
    method: 'POST',
    body: request,
    auth: false,
  });
}
