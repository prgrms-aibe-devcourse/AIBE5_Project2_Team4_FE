import { useEffect, useState } from 'react';
import './freelancerDetail.css';
import AppHeader from '../components/AppHeader';
import { getFreelancerById } from '../store/appFreelancerStore';
import { getUser } from '../store/appAuth';
import { canReportReview } from '../store/accessControl';
import { addProposal, getProposals } from '../store/appProposalStore';
import { getReviewTags, getReviewsForFreelancer, reportReview } from '../store/appReviewStore';
import { createNotification } from '../store/notificationStore';

const MOCK_USER_PROJECTS = [
  { id: 2, title: '주민센터 서류 발급', type: '관공서', date: '2025.04.22', time: '14:00', location: '서울 마포구 합정동', description: '주민등록등본 발급이 필요합니다.' },
  { id: 6, title: '정형외과 진료 동행', type: '병원', date: '2025.04.25', time: '10:30', location: '서울 강남구 역삼동', description: '정형외과 진료 접수와 귀가를 도와주세요.' },
];

export default function FreelancerDetailPage2() {
  const id = Number(window.location.pathname.split('/').pop());
  const freelancer = getFreelancerById(id);
  const user = getUser();
  const reviewTags = getReviewTags();

  const alreadyProposed = getProposals().some(
    (proposal) =>
      proposal.freelancerId === id &&
      ((user?.email && proposal.userEmail === user.email) || proposal.userName === user?.name),
  );

  const [proposing, setProposing] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [proposalDone, setProposalDone] = useState(alreadyProposed);
  const [reportReasons, setReportReasons] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!freelancer) {
      window.location.href = '/error?code=404';
    }
  }, [freelancer]);

  const reviews = freelancer ? getReviewsForFreelancer(freelancer.id) : [];

  if (!freelancer) {
    return null;
  }

  const ratingAverage = reviews.length === 0
    ? freelancer.rating
    : reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  function handleSendProposal() {
    if (!freelancer || !selectedProjectId || !user) {
      return;
    }

    const project = MOCK_USER_PROJECTS.find((item) => item.id === selectedProjectId);
    if (!project) {
      return;
    }

    addProposal({
      freelancerId: freelancer.id,
      freelancerName: freelancer.name,
      freelancerEmail: freelancer.accountEmail,
      projectId: project.id,
      projectTitle: project.title,
      projectType: project.type,
      date: project.date,
      time: project.time,
      location: project.location,
      description: project.description,
      userName: user.name,
      userEmail: user.email,
      status: 'PENDING',
    });

    if (freelancer.accountEmail) {
      createNotification({
        userEmail: freelancer.accountEmail,
        type: 'PROPOSAL_RECEIVED',
        title: '새 프로젝트 제안을 받았습니다',
        message: `${user.name}님이 "${project.title}" 프로젝트를 제안했습니다.`,
        link: '/mypage',
      });
    }

    setProposalDone(true);
    setProposing(false);
  }

  function handleReviewReport(reviewId: number) {
    const targetReview = reviews.find((review) => review.id === reviewId);
    if (!targetReview || !canReportReview(user, targetReview)) {
      window.location.href = '/error?code=403';
      return;
    }

    const reason = reportReasons[reviewId]?.trim() || '부적절한 리뷰로 신고되었습니다.';
    reportReview(reviewId, reason);
    setReportReasons((currentReasons) => ({ ...currentReasons, [reviewId]: '' }));
  }

  return (
    <div className="fd-page">
      <AppHeader activePage="freelancers" />

      <main className="fd-content">
        <button className="fd-back" onClick={() => history.back()}>← 목록으로</button>

        <section className="fd-profile-section">
          <div className="fd-profile-left">
            <div className="fd-name-block">
              <h1 className="fd-name">{freelancer.name}</h1>
              {freelancer.verified && (
                <span className="fd-verified-badge">✦ 인증됨</span>
              )}
            </div>

            <div className="fd-tag-row">
              {freelancer.skills.map((skill) => (
                <span key={skill} className="fd-tag">{skill}</span>
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

            <p className="fd-bio">{freelancer.bio}</p>

            <ul className="fd-meta-list">
              <li><span className="fd-meta-icon">⏰</span>{freelancer.availableHours}</li>
              <li><span className="fd-meta-icon">📍</span>{freelancer.availableRegions.join(' · ')}</li>
              <li><span className="fd-meta-icon">📋</span>완료 프로젝트 {freelancer.projectCount}건</li>
              {freelancer.portfolio && (
                <li><span className="fd-meta-icon">📁</span><span className="fd-portfolio-link">{freelancer.portfolio}</span></li>
              )}
            </ul>

            {user?.role === 'ROLE_USER' && (
              proposalDone ? (
                <button className="fd-propose-btn fd-propose-btn--done" disabled>제안 완료</button>
              ) : (
                <button className="fd-propose-btn" onClick={() => setProposing(true)}>프로젝트 제안하기</button>
              )
            )}
          </div>

          <div className="fd-profile-right">
            <div className="fd-photo-frame">
              {freelancer.photo
                ? <img src={freelancer.photo} alt={freelancer.name} className="fd-photo-img" />
                : <div className="fd-photo-avatar">{freelancer.name[0]}</div>
              }
            </div>
            <div className="fd-photo-stat">
              <span className="fd-photo-stat-num">{freelancer.projectCount}</span>
              <span className="fd-photo-stat-label">완료</span>
            </div>
          </div>
        </section>

        <section className="fd-section">
          <h2 className="fd-section-title">제공 서비스</h2>
          <div className="fd-services-grid">
            {freelancer.skills.map((skill) => (
              <div key={skill} className="fd-service-card">
                <div className="fd-service-icon">✦</div>
                <span className="fd-service-label">{skill}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="fd-section">
          <h2 className="fd-section-title">리뷰</h2>
          {reviews.length === 0 ? (
            <p className="fd-empty">아직 리뷰가 없습니다.</p>
          ) : (
            <ul className="fd-review-grid">
              {reviews.map((review) => (
                <li key={review.id} className="fd-review-card">
                  <div className="fd-review-top">
                    <span className="fd-review-author">{review.authorName}</span>
                    <span className="fd-review-stars">
                      {Array.from({ length: 5 }, (_, index) => (
                        <span key={index} className={index < review.rating ? 'star-filled' : 'star-empty'}>★</span>
                      ))}
                    </span>
                  </div>
                  <div className="review-tag-row">
                    {review.tags.map((tag) => <span key={tag} className="skill-tag">{tag}</span>)}
                  </div>
                  <p className="fd-review-content">{review.content}</p>
                  <span className="fd-review-date">{review.date}</span>
                  {canReportReview(user, review) && (
                    <div className="review-report-box">
                      <input
                        type="text"
                        className="review-report-input"
                        placeholder={`신고 사유 예: ${reviewTags[0]}`}
                        value={reportReasons[review.id] ?? ''}
                        onChange={(event) => setReportReasons((currentReasons) => ({ ...currentReasons, [review.id]: event.target.value }))}
                      />
                      <button className="btn-cancel" onClick={() => handleReviewReport(review.id)}>신고</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {proposing && (
        <div className="fd-modal-overlay" onClick={() => setProposing(false)}>
          <div className="fd-modal" onClick={(event) => event.stopPropagation()}>
            <button className="fd-modal-close" onClick={() => setProposing(false)}>닫기</button>
            <h3 className="fd-modal-title">{freelancer.name}님에게 제안할 프로젝트</h3>
            <ul className="fd-project-list">
              {MOCK_USER_PROJECTS.map((project) => (
                <li
                  key={project.id}
                  className={`fd-project-item${selectedProjectId === project.id ? ' selected' : ''}`}
                  onClick={() => setSelectedProjectId(project.id)}
                >
                  <div className="fd-project-top">
                    <span className="fd-project-type">{project.type}</span>
                    <span className="fd-project-date">{project.date} {project.time}</span>
                  </div>
                  <p className="fd-project-title">{project.title}</p>
                  <p className="fd-project-loc">📍 {project.location}</p>
                </li>
              ))}
            </ul>
            <button
              className="fd-propose-btn"
              disabled={!selectedProjectId}
              onClick={handleSendProposal}
            >
              제안 보내기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
