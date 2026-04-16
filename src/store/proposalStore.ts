export interface Proposal {
  id: number;
  freelancerId: number;
  freelancerName: string;
  projectId: number;
  projectTitle: string;
  projectType: string;
  date: string;
  time: string;
  location: string;
  description: string;
  userName: string;
  sentAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export function getProposals(): Proposal[] {
  const stored = localStorage.getItem('proposals');
  return stored ? JSON.parse(stored) : [];
}

export function addProposal(proposal: Omit<Proposal, 'id' | 'sentAt'>): void {
  const proposals = getProposals();
  proposals.push({ ...proposal, id: Date.now(), sentAt: new Date().toLocaleDateString('ko-KR') });
  localStorage.setItem('proposals', JSON.stringify(proposals));
}

export function updateProposalStatus(id: number, status: 'ACCEPTED' | 'REJECTED'): void {
  const proposals = getProposals();
  localStorage.setItem('proposals', JSON.stringify(
    proposals.map(p => p.id === id ? { ...p, status } : p)
  ));
}
