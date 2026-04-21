/* eslint-disable @typescript-eslint/no-unused-vars */

export interface Proposal {
  id: number;
  freelancerId: number;
  freelancerName: string;
  freelancerEmail?: string;
  projectId: number;
  projectTitle: string;
  projectType: string;
  date: string;
  time: string;
  location: string;
  description: string;
  userName: string;
  userEmail?: string;
  sentAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

// Legacy compatibility shim. Live proposal data now comes from src/api/proposals.ts.
export function getProposals(): Proposal[] {
  return [];
}

export function addProposal(_proposal: Omit<Proposal, 'id' | 'sentAt'>): Proposal {
  throw new Error('appProposalStore mock is removed. Use src/api/proposals.ts.');
}

export function updateProposalStatus(_id: number, _status: 'ACCEPTED' | 'REJECTED'): Proposal | null {
  return null;
}

export function withdrawProposal(_id: number): void {}

export function removeProposalsByProjectId(_projectId: number): void {}
