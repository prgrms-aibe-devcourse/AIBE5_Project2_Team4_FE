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

const PROPOSALS_KEY = 'proposals';

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

export function getProposals(): Proposal[] {
  const storage = getStorage();
  if (!storage) {
    return [];
  }

  const stored = storage.getItem(PROPOSALS_KEY);
  return stored ? (JSON.parse(stored) as Proposal[]) : [];
}

export function addProposal(proposal: Omit<Proposal, 'id' | 'sentAt'>): Proposal {
  const storage = getStorage();
  const nextProposal: Proposal = {
    ...proposal,
    id: Date.now(),
    sentAt: new Date().toLocaleDateString('ko-KR'),
  };

  if (!storage) {
    return nextProposal;
  }

  storage.setItem(PROPOSALS_KEY, JSON.stringify([...getProposals(), nextProposal]));
  return nextProposal;
}

export function updateProposalStatus(id: number, status: 'ACCEPTED' | 'REJECTED'): Proposal | null {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  let updatedProposal: Proposal | null = null;
  const nextProposals = getProposals().map((proposal) => {
    if (proposal.id !== id) {
      return proposal;
    }

    updatedProposal = { ...proposal, status };
    return updatedProposal;
  });

  storage.setItem(PROPOSALS_KEY, JSON.stringify(nextProposals));
  return updatedProposal;
}
