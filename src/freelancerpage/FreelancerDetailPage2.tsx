import { useEffect, useMemo, useState } from 'react';
import './freelancerDetail.css';
import AppHeader from '../components/AppHeader';
import { AUTH_USER_EVENT, bootstrapSession, getUser, type User } from '../store/appAuth';
import { canReportReview } from '../store/accessControl';
import { getProjectTypeCodes, getAvailableTimeSlotCodes, getRegionCodes } from '../api/codes';
import { getFreelancer, type PublicFreelancerDetailResponse } from '../api/freelancers';
import { createProposal } from '../api/proposals';
import { getMyProjects, type ProjectSummaryResponse } from '../api/projects';
import { createReviewReport, type ReportReasonType } from '../api/reports';
import { getFreelancerReviews, type ReviewSummaryResponse } from '../api/reviews';
import { getErrorMessage } from '../lib/errors';
import { formatDateTime, labelOf } from '../lib/referenceData';
import { openChatWithFreelancer } from '../store/chatStore';

const REPORT_REASON_OPTIONS: Array<{ code: ReportReasonType; label: string }> = [
  { code: 'SPAM', label: '스팸' },
  { code: 'ABUSE', label: '욕설 및 비방' },
  { code: 'FALSE_INFO', label: '허위 정보' },
  { code: 'ETC', label: '기타' },
];

function getFreelancerProfileId(): number | null {
  const id = Number(window.location.pathname.split('/').pop());
  return Number.isFinite(id) ? id : null;
}

export default function FreelancerDetailPage2() {
  const freelancerProfileId = getFreelancerProfileId();
  const [user, setUser] = useState<User | null>(() => getUser());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [freelancer, setFreelancer] = useState<PublicFreelancerDetailResponse | null>(null);
  const [reviews, setReviews] = useState<ReviewSummaryResponse[]>([]);
  const [availableProjects, setAvailableProjects] = useState<ProjectSummaryResponse[]>([]);
  const [proposing, setProposing] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [proposalMessage, setProposalMessage] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [reportingReviewId, setReportingReviewId] = useState<number | null>(null);
  const [reportReasonType, setReportReasonType] = useState<ReportReasonType>('ETC');
  const [reportReasonDetail, setReportReasonDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [chatStarting, setChatStarting] = useState(false);
  const [projectTypeMap, setProjectTypeMap] = useState<Map<string, string>>(new Map());
  const [regionMap, setRegionMap] = useState<Map<string, string>>(new Map());
  const [timeSlotMap, setTimeSlotMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    let mounted = true;
    const syncUser = () => {
      if (mounted) {
        setUser(getUser());
      }
    };

    syncUser();
    void bootstrapSession().then((nextUser) => {
      if (mounted) {
        setUser(nextUser);
      }
    });

    window.addEventListener(AUTH_USER_EVENT, syncUser);
    window.addEventListener('focus', syncUser);
    return () => {
      mounted = false;
      window.removeEventListener(AUTH_USER_EVENT, syncUser);
      window.removeEventListener('focus', syncUser);
    };
  }, []);

  useEffect(() => {
    if (!freelancerProfileId) {
      window.location.href = '/error?code=404';
      return;
    }

    const initialize = async () => {
      setLoading(true);
      setError('');

      try {
        const [projectTypes, regions, timeSlots, detail, reviewPage] = await Promise.all([
          getProjectTypeCodes(),
          getRegionCodes(),
          getAvailableTimeSlotCodes(),
          getFreelancer(freelancerProfileId),
          getFreelancerReviews(freelancerProfileId, { page: 0, size: 50 }),
        ]);

        setProjectTypeMap(new Map(projectTypes.map((item) => [item.code, item.name])));
        setRegionMap(new Map(regions.map((item) => [item.code, item.name])));
        setTimeSlotMap(new Map(timeSlots.map((item) => [item.code, item.name])));
        setFreelancer(detail);
        setReviews(reviewPage.content);

      } catch (caughtError) {
        setError(getErrorMessage(caughtError, '프리랜서 상세 정보를 불러오지 못했습니다.'));
      } finally {
        setLoading(false);
      }
    };

    void initialize();
  }, [freelancerProfileId]);

  useEffect(() => {
    if (!proposing || user?.role !== 'ROLE_USER') {
      return;
    }

    const loadAvailableProjects = async () => {
      setProjectsLoading(true);
      setError('');

      try {
        const projectPage = await getMyProjects({ status: 'REQUESTED', page: 0, size: 100 });
        setAvailableProjects(projectPage.content);
        setSelectedProjectId((currentProjectId) => (
          currentProjectId && projectPage.content.some((project) => project.projectId === currentProjectId)
            ? currentProjectId
            : null
        ));
      } catch (caughtError) {
        setAvailableProjects([]);
        setError(getErrorMessage(caughtError, '제안 가능한 프로젝트 목록을 불러오지 못했습니다.'));
      } finally {
        setProjectsLoading(false);
      }
    };

    void loadAvailableProjects();
  }, [proposing, user?.role]);

  const ratingAverage = useMemo(() => {
    if (!reviews.length) {
      return freelancer?.averageRating ?? 0;
    }

    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  }, [freelancer?.averageRating, reviews]);

  async function handleSendProposal() {
    if (!freelancer || !selectedProjectId) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await createProposal(selectedProjectId, {
        freelancerProfileId: freelancer.freelancerProfileId,
        message: proposalMessage.trim() || undefined,
      });
      setAvailableProjects((currentProjects) => currentProjects.filter((project) => project.projectId !== selectedProjectId));
      setSelectedProjectId(null);
      setProposalMessage('');
      setProposing(false);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '프로젝트 제안 전송에 실패했습니다.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStartChat() {
    if (!freelancer) {
      return;
    }

    setChatStarting(true);
    setError('');

    try {
      await openChatWithFreelancer(freelancer.freelancerProfileId);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '채팅을 시작하지 못했습니다.'));
    } finally {
      setChatStarting(false);
    }
  }

  async function handleReviewReport() {
    if (!reportingReviewId) {
      return;
    }

    const targetReview = reviews.find((review) => review.reviewId === reportingReviewId);
    if (!targetReview || !canReportReview(user, { reviewerUserId: targetReview.reviewerUserId })) {
      window.location.href = '/error?code=403';
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await createReviewReport(reportingReviewId, {
        reasonType: reportReasonType,
        reasonDetail: reportReasonDetail.trim() || undefined,
      });
      setReportingReviewId(null);
      setReportReasonDetail('');
      setReportReasonType('ETC');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, '리뷰 신고 접수에 실패했습니다.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (!freelancerProfileId || loading) {
    return (
      <div className="fd-page">
        <AppHeader activePage="freelancers" />
        <main className="fd-content">
          <p className="fd-empty">프리랜서 정보를 불러오는 중입니다.</p>
        </main>
      </div>
    );
  }

  if (!freelancer) {
    return (
      <div className="fd-page">
        <AppHeader activePage="freelancers" />
        <main className="fd-content">
          <p className="fd-empty">{error || '프리랜서 정보를 찾을 수 없습니다.'}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="fd-page">
      <AppHeader activePage="freelancers" />

      <main className="fd-content">
        <button type="button" className="fd-back" onClick={() => history.back()}>목록으로</button>
        {error && <p className="fd-empty">{error}</p>}

        <section className="fd-profile-section">
          <div className="fd-profile-left">
            <div className="fd-name-block">
              <h1 className="fd-name">{freelancer.name}</h1>
              {freelancer.verifiedYn && <span className="fd-verified-badge">인증됨</span>}
            </div>

            <div className="fd-tag-row">
              {freelancer.projectTypeCodes.map((code) => (
                <span key={code} className="fd-tag">{labelOf(projectTypeMap, code)}</span>
              ))}
            </div>

            <div className="fd-rating-row">
              <span className="fd-stars">
                {Array.from({ length: 5 }, (_, index) => (
                  <span key={index} className={index < Math.round(ratingAverage) ? 'star-filled' : 'star-empty'}>★</span>
                ))}
              </span>
              <span className="fd-rating-num">{ratingAverage.toFixed(1)}</span>
              <span className="fd-review-count">리뷰 {reviews.length}개</span>
            </div>

            <p className="fd-bio">{freelancer.intro || '등록된 소개가 없습니다.'}</p>

            <ul className="fd-meta-list">
              <li><span className="fd-meta-icon">🕒</span>{freelancer.availableTimeSlotCodes.map((code) => labelOf(timeSlotMap, code)).join(', ') || '-'}</li>
              <li><span className="fd-meta-icon">📍</span>{freelancer.activityRegionCodes.map((code) => labelOf(regionMap, code)).join(', ') || '-'}</li>
              <li><span className="fd-meta-icon">📌</span>활동 {freelancer.activityCount ?? 0}건</li>
              <li><span className="fd-meta-icon">🩺</span>{freelancer.caregiverYn ? '요양보호사 자격 보유' : '일반 활동자'}</li>
            </ul>

            {user?.role === 'ROLE_USER' && (
              <div className="fd-action-row">
                <button
                  type="button"
                  className="fd-propose-btn"
                  disabled={chatStarting}
                  onClick={() => void handleStartChat()}
                >
                  채팅하기
                </button>
                <button type="button" className="fd-propose-btn" onClick={() => setProposing(true)}>프로젝트 제안하기</button>
              </div>
            )}
          </div>

          <div className="fd-profile-right">
            <div className="fd-photo-frame">
              <div className="fd-photo-avatar">{freelancer.name[0]}</div>
            </div>
            <div className="fd-photo-stat">
              <span className="fd-photo-stat-num">{freelancer.activityCount ?? 0}</span>
              <span className="fd-photo-stat-label">활동 수</span>
            </div>
          </div>
        </section>

        <section className="fd-section">
          <h2 className="fd-section-title">제공 서비스</h2>
          <div className="fd-services-grid">
            {freelancer.projectTypeCodes.map((code) => (
              <div key={code} className="fd-service-card">
                <div className="fd-service-icon">✓</div>
                <span className="fd-service-label">{labelOf(projectTypeMap, code)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="fd-section">
          <h2 className="fd-section-title">리뷰</h2>
          {reviews.length === 0 ? (
            <p className="fd-empty">등록된 리뷰가 없습니다.</p>
          ) : (
            <ul className="fd-review-grid">
              {reviews.map((review) => (
                <li key={review.reviewId} className="fd-review-card">
                  <div className="fd-review-top">
                    <span className="fd-review-author">{review.reviewerName || `사용자 #${review.reviewerUserId}`}</span>
                    <span className="fd-review-stars">
                      {Array.from({ length: 5 }, (_, index) => (
                        <span key={index} className={index < review.rating ? 'star-filled' : 'star-empty'}>★</span>
                      ))}
                    </span>
                  </div>
                  <div className="review-tag-row">
                    {review.tagCodes.map((tagCode) => <span key={tagCode} className="skill-tag">{tagCode}</span>)}
                  </div>
                  <p className="fd-review-content">
                    {review.blindedYn ? '블라인드 처리된 리뷰입니다.' : review.content}
                  </p>
                  <span className="fd-review-date">{formatDateTime(review.createdAt)}</span>
                  <div className="fd-review-status-row">
                    {review.reported && <span className="skill-tag">신고 접수됨</span>}
                    {review.blindedYn && <span className="skill-tag">블라인드</span>}
                  </div>
                  {canReportReview(user, { reviewerUserId: review.reviewerUserId }) && (
                    <button
                      type="button"
                      className="fd-report-btn"
                      onClick={() => {
                        setReportingReviewId(review.reviewId);
                        setReportReasonDetail('');
                        setReportReasonType('ETC');
                      }}
                    >
                      신고
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {reportingReviewId !== null && (
        <div className="fd-modal-overlay" onClick={() => setReportingReviewId(null)}>
          <div className="fd-modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="fd-modal-close" onClick={() => setReportingReviewId(null)}>닫기</button>
            <h3 className="fd-modal-title">리뷰 신고</h3>
            <div className="fd-report-form">
              <label className="fd-report-label">신고 유형</label>
              <div className="fd-report-tag-row">
                {REPORT_REASON_OPTIONS.map((option) => (
                  <button
                    key={option.code}
                    type="button"
                    className={`fd-report-tag${reportReasonType === option.code ? ' selected' : ''}`}
                    onClick={() => setReportReasonType(option.code)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                className="fd-report-input"
                placeholder="상세 사유를 입력하세요"
                value={reportReasonDetail}
                onChange={(event) => setReportReasonDetail(event.target.value)}
              />
            </div>
            <button type="button" className="fd-report-submit" onClick={() => void handleReviewReport()} disabled={submitting}>
              신고 접수
            </button>
          </div>
        </div>
      )}

      {proposing && (
        <div className="fd-modal-overlay" onClick={() => setProposing(false)}>
          <div className="fd-modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="fd-modal-close" onClick={() => setProposing(false)}>닫기</button>
            <h3 className="fd-modal-title">{freelancer.name}님에게 제안할 프로젝트</h3>
            {projectsLoading ? (
              <p className="fd-empty">제안 가능한 프로젝트를 불러오는 중입니다.</p>
            ) : availableProjects.length === 0 ? (
              <p className="fd-empty">제안 가능한 요청 상태 프로젝트가 없습니다.</p>
            ) : (
              <>
                <ul className="fd-project-list">
                  {availableProjects.map((project) => (
                    <li
                      key={project.projectId}
                      className={`fd-project-item${selectedProjectId === project.projectId ? ' selected' : ''}`}
                      onClick={() => setSelectedProjectId(project.projectId)}
                    >
                      <div className="fd-project-top">
                        <span className="fd-project-type">{labelOf(projectTypeMap, project.projectTypeCode)}</span>
                        <span className="fd-project-date">{formatDateTime(project.requestedStartAt)}</span>
                      </div>
                      <p className="fd-project-title">{project.title}</p>
                      <p className="fd-project-loc">지역 {labelOf(regionMap, project.serviceRegionCode)}</p>
                    </li>
                  ))}
                </ul>
                <textarea
                  className="fd-report-input"
                  rows={4}
                  placeholder="제안 메시지를 입력하세요"
                  value={proposalMessage}
                  onChange={(event) => setProposalMessage(event.target.value)}
                />
                <button
                  type="button"
                  className="fd-propose-btn"
                  disabled={!selectedProjectId || submitting}
                  onClick={() => void handleSendProposal()}
                >
                  제안 보내기
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
