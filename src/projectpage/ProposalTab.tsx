import type { ProposalStatus, ProposalSummaryResponse } from '../api/proposals';
import type { ProjectStatus } from '../api/projects';
import { formatDateTime } from '../lib/referenceData';

const PROPOSAL_STATUS_LABEL: Record<ProposalStatus, string> = {
  PENDING: '대기 중',
  ACCEPTED: '수락됨',
  REJECTED: '거절됨',
  EXPIRED: '만료됨',
  CANCELLED: '취소됨',
};

const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  REQUESTED: '요청',
  ACCEPTED: '수락',
  IN_PROGRESS: '진행 중',
  COMPLETED: '완료',
  CANCELLED: '취소',
};

interface Props {
  proposals: ProposalSummaryResponse[];
  loading?: boolean;
  reviewedProjectIds?: Set<number>;
  onAccept: (proposalId: number) => void;
  onReject: (proposalId: number) => void;
  onStartProject: (proposalId: number) => void;
  onCompleteProject: (proposalId: number) => void;
  onWriteReview?: (projectId: number, projectTitle: string) => void;
  onViewProject?: (proposalId: number) => void;
}

export default function ProposalTab({
  proposals,
  loading = false,
  reviewedProjectIds,
  onAccept,
  onReject,
  onStartProject,
  onCompleteProject,
  onWriteReview,
  onViewProject,
}: Props) {
  return (
    <>
      {proposals.length === 0 ? (
        <div className="project-empty">
          <p>받은 제안이 없습니다.</p>
        </div>
      ) : (
        <ul className="proposal-list">
          {proposals.map((proposal) => (
            <li key={proposal.proposalId} className="proposal-card">
              <div className="proposal-card-top">
                <div className="proposal-card-meta">
                  <span className="project-type-badge">{PROJECT_STATUS_LABEL[proposal.projectStatus]}</span>
                  <span className="project-status status--request">{PROPOSAL_STATUS_LABEL[proposal.proposalStatus]}</span>
                </div>
                <span className="proposal-card-date">{formatDateTime(proposal.createdAt)}</span>
              </div>

              <h3 className="proposal-card-title">{proposal.projectTitle}</h3>

              <div className="proposal-card-info">
                <span>등록자: {proposal.ownerName || '-'}</span>
                <span>프로젝트 상태: {PROJECT_STATUS_LABEL[proposal.projectStatus]}</span>
                <span>응답 시각: {formatDateTime(proposal.respondedAt)}</span>
              </div>

              {proposal.message && (
                <p className="proposal-card-desc">{proposal.message}</p>
              )}

              <div className="proposal-card-actions">
                {onViewProject && (
                  <button
                    type="button"
                    className="proposal-btn proposal-btn--review"
                    disabled={loading}
                    onClick={() => onViewProject(proposal.proposalId)}
                  >
                    프로젝트 열람
                  </button>
                )}
                {proposal.proposalStatus === 'PENDING' && (
                  <>
                    <button
                      type="button"
                      className="proposal-btn proposal-btn--accept"
                      disabled={loading}
                      onClick={() => onAccept(proposal.proposalId)}
                    >
                      {loading ? '처리 중...' : '수락'}
                    </button>
                    <button
                      type="button"
                      className="proposal-btn proposal-btn--reject"
                      disabled={loading}
                      onClick={() => onReject(proposal.proposalId)}
                    >
                      거절
                    </button>
                  </>
                )}
                {proposal.proposalStatus === 'ACCEPTED' && proposal.projectStatus === 'ACCEPTED' && (
                  <button
                    type="button"
                    className="proposal-btn proposal-btn--accept"
                    disabled={loading}
                    onClick={() => onStartProject(proposal.proposalId)}
                  >
                    {loading ? '처리 중...' : '진행 시작'}
                  </button>
                )}
                {proposal.proposalStatus === 'ACCEPTED' && proposal.projectStatus === 'IN_PROGRESS' && (
                  <button
                    type="button"
                    className="proposal-btn proposal-btn--accept"
                    disabled={loading}
                    onClick={() => onCompleteProject(proposal.proposalId)}
                  >
                    {loading ? '처리 중...' : '완료 처리'}
                  </button>
                )}
                {proposal.proposalStatus === 'ACCEPTED' && proposal.projectStatus === 'COMPLETED' && onWriteReview && (
                  <button
                    type="button"
                    className="proposal-btn proposal-btn--review"
                    disabled={loading}
                    onClick={() => onWriteReview(proposal.projectId, proposal.projectTitle)}
                  >
                    {reviewedProjectIds?.has(proposal.projectId) ? '리뷰 수정' : '리뷰 작성'}
                  </button>
                )}
                {(proposal.proposalStatus !== 'PENDING'
                  && !(proposal.proposalStatus === 'ACCEPTED' && proposal.projectStatus === 'ACCEPTED')
                  && !(proposal.proposalStatus === 'ACCEPTED' && proposal.projectStatus === 'IN_PROGRESS')
                  && !(proposal.proposalStatus === 'ACCEPTED' && proposal.projectStatus === 'COMPLETED')) && (
                  <span className="proposal-status-text">
                    {PROPOSAL_STATUS_LABEL[proposal.proposalStatus]}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
