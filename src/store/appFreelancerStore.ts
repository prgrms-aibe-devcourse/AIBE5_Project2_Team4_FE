/* eslint-disable @typescript-eslint/no-unused-vars */

export interface FreelancerReview {
  author: string;
  rating: number;
  content: string;
  date: string;
}

export interface Freelancer {
  id: number;
  name: string;
  accountEmail?: string;
  photo?: string;
  skills: string[];
  bio: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  projectCount: number;
  availableHours: string;
  availableRegions: string[];
  portfolio?: string;
  reviews: FreelancerReview[];
}

// Legacy compatibility shim. Live data now comes from src/api/freelancers.ts.
export const FREELANCERS: Freelancer[] = [];

export function getFreelancerById(_id: number): Freelancer | null {
  return null;
}
