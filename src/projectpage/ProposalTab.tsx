import type { Proposal } from '../store/appProposalStore';

const PROPOSAL_STATUS_LABEL: Record<Proposal['status'], string> = {
  PENDING: '대기 중',
  ACCEPTED: '수락됨',
  REJECTED: '거절됨',
};

const PROPOSAL_STATUS_COLOR: Record<Proposal['status'], string> = {
  PENDING: 'status--request',
  ACCEPTED: 'status--accept',
  REJECTED: 'status--done',
};

interface Props {
  proposals: Proposal[];
  isFreelancer: boolean;
  onAction: (proposal: Proposal, status: 'ACCEPTED' | 'REJECTED') => void;
  onWithdraw: (proposalId: number) => void;
}

export default function ProposalTab({ proposals, isFreelancer, onAction, onWithdraw }: Props) {
  return (
    <>
      {proposals.length === 0 ? (
        <div className="project-empty">
          <p>{isFreelancer ? '받은 제안이 없습니다.' : '보낸 제안이 없습니다.'}</p>
        </div>
      ) : (
        <ul className="proposal-list">
          {proposals.map((proposal) => (
            <li key={proposal.id} className="proposal-card">
              <div className="proposal-card-top">
                <div className="proposal-card-meta">
                  <span className="project-type-badge">{proposal.projectType}</span>
                  <span className={`project-status ${PROPOSAL_STATUS_COLOR[proposal.status]}`}>
                    {PROPOSAL_STATUS_LABEL[proposal.status]}
                  </span>
                </div>
                <span className="proposal-card-date">{proposal.sentAt}</span>
              </div>

              <h3 className="proposal-card-title">{proposal.projectTitle}</h3>

              <div className="proposal-card-info">
                {isFreelancer ? (
                  <>
                    <span>보낸 사람: {proposal.userName}</span>
                    <span>일정: {proposal.date} {proposal.time}</span>
                    <span>위치: {proposal.location}</span>
                  </>
                ) : (
                  <>
                    <span>헬퍼: {proposal.freelancerName}</span>
                    <span>일정: {proposal.date} {proposal.time}</span>
                    <span>위치: {proposal.location}</span>
                  </>
                )}
              </div>

              {proposal.description && (
                <p className="proposal-card-desc">{proposal.description}</p>
              )}

              <div className="proposal-card-actions">
                {isFreelancer ? (
                  proposal.status === 'PENDING' ? (
                    <>
                      <button type="button" className="proposal-btn proposal-btn--accept"
                        onClick={() => onAction(proposal, 'ACCEPTED')}>
                        수락
                      </button>
                      <button type="button" className="proposal-btn proposal-btn--reject"
                        onClick={() => onAction(proposal, 'REJECTED')}>
                        거절
                      </button>
                    </>
                  ) : (
                    <span className="proposal-status-text">
                      {proposal.status === 'ACCEPTED' ? '수락됨' : '거절됨'}
                    </span>
                  )
                ) : (
                  proposal.status === 'PENDING' ? (
                    <button type="button" className="proposal-btn proposal-btn--reject"
                      onClick={() => onWithdraw(proposal.id)}>
                      제안 철회
                    </button>
                  ) : (
                    <span className="proposal-status-text">
                      {proposal.status === 'ACCEPTED' ? '수락됨' : '거절됨'}
                    </span>
                  )
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
