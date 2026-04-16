import { useState, useEffect } from 'react';
import './freelancerDetail.css';
import AppHeader from '../components/AppHeader';
import { getFreelancerById } from '../store/appFreelancerStore';
import { getUser } from '../store/appAuth';
import { addProposal, getProposals } from '../store/appProposalStore';
import { createNotification } from '../store/notificationStore';

const MOCK_USER_PROJECTS = [
  { id: 2, title: '주민센터 서류 발급', type: '관공서', date: '2025.04.22', time: '14:00', location: '서울 마포구 합정동', description: '주민등록등본 발급 업무 보조 요청입니다.' },
  { id: 6, title: '정형외과 진료 동행', type: '병원',   date: '2025.04.25', time: '10:30', location: '서울 강남구 역삼동', description: '무릎 정기 진료 동행 요청입니다.' },
];

const ServiceIcon = ({ type }: { type: string }) => {
  switch (type) {
    case '병원 동행':
      return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="12" r="7" stroke="currentColor" strokeWidth="2.5" />
          <path d="M10 42c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M28 26l2 6h4l-7 5-7-5h4l2-6" fill="currentColor" opacity=".6" />
          <rect x="20" y="30" width="8" height="2" rx="1" fill="currentColor" />
        </svg>
      );
    case '외출 보조':
      return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="10" r="6" stroke="currentColor" strokeWidth="2.5" />
          <path d="M24 18v12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M16 24l8-4 8 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20 30l-4 10M28 30l4 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M30 36l4 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case '생활동행':
      return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 14h4l5 18h14l5-13H18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="22" cy="37" r="2.5" stroke="currentColor" strokeWidth="2" />
          <circle cx="34" cy="37" r="2.5" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case '관공서 업무':
      return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="20" width="32" height="22" rx="2" stroke="currentColor" strokeWidth="2.5" />
          <path d="M16 20V16a8 8 0 0116 0v4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M18 30h12M18 35h8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="2.5" />
          <path d="M24 16v8l6 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
  }
};

export default function FreelancerDetailPage() {
  const id = Number(window.location.pathname.split('/').pop());
  const freelancer = getFreelancerById(id);
  const user = getUser();

  const alreadyProposed = getProposals().some(
    (proposal) =>
      proposal.freelancerId === id &&
      ((user?.email && proposal.userEmail === user.email) || proposal.userName === user?.name),
  );

  const [proposing, setProposing] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [proposalDone, setProposalDone] = useState(alreadyProposed);

  useEffect(() => {
    if (!freelancer) {
      window.location.href = '/error?code=404';
    }
  }, [freelancer]);

  if (!freelancer) return null;

  const handleSendProposal = () => {
    if (!selectedProjectId || !user) return;
    const project = MOCK_USER_PROJECTS.find(p => p.id === selectedProjectId)!;
    addProposal({
      freelancerId: freelancer.id, freelancerName: freelancer.name,
      freelancerEmail: freelancer.accountEmail,
      projectId: project.id, projectTitle: project.title, projectType: project.type,
      date: project.date, time: project.time, location: project.location,
      description: project.description, userName: user.name, userEmail: user.email, status: 'PENDING',
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
  };

  return (
    <div className="fd-page">
      <AppHeader activePage="freelancers" />

      <main className="fd-content">
        <button className="fd-back" onClick={() => history.back()}>← 목록으로</button>

        {/* ── 프로필 섹션 ── */}
        <section className="fd-profile-section">
          <div className="fd-profile-left">
            <div className="fd-name-block">
              <h1 className="fd-name">{freelancer.name}</h1>
              {freelancer.verified && (
                <span className="fd-verified-badge">✦ 인증됨</span>
              )}
            </div>

            <div className="fd-tag-row">
              {freelancer.skills.map(s => (
                <span key={s} className="fd-tag">{s}</span>
              ))}
            </div>

            <div className="fd-rating-row">
              <span className="fd-stars">
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} className={i < Math.round(freelancer.rating) ? 'star-filled' : 'star-empty'}>★</span>
                ))}
              </span>
              <span className="fd-rating-num">{freelancer.rating.toFixed(1)}</span>
              <span className="fd-review-count">리뷰 {freelancer.reviewCount}개</span>
            </div>

            <p className="fd-bio">{freelancer.bio}</p>

            <ul className="fd-meta-list">
              <li>
                <span className="fd-meta-icon">
                  <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/></svg>
                </span>
                {freelancer.availableHours}
              </li>
              <li>
                <span className="fd-meta-icon">
                  <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
                </span>
                {freelancer.availableRegions.join(' · ')}
              </li>
              <li>
                <span className="fd-meta-icon">
                  <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/></svg>
                </span>
                완료 프로젝트 {freelancer.projectCount}건
              </li>
              {freelancer.portfolio && (
                <li>
                  <span className="fd-meta-icon">
                    <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/></svg>
                  </span>
                  <span className="fd-portfolio-link">{freelancer.portfolio}</span>
                </li>
              )}
            </ul>

            {user?.role === 'ROLE_USER' && (
              proposalDone ? (
                <button className="fd-propose-btn fd-propose-btn--done" disabled>✦ 제안 완료</button>
              ) : (
                <button className="fd-propose-btn" onClick={() => setProposing(true)}>프로젝트 제안하기</button>
              )
            )}
          </div>

          {/* 우측 아바타 */}
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

        {/* ── 제공 서비스 ── */}
        <section className="fd-section">
          <h2 className="fd-section-title">제공 서비스</h2>
          <div className="fd-services-grid">
            {freelancer.skills.map(skill => (
              <div key={skill} className="fd-service-card">
                <div className="fd-service-icon">
                  <ServiceIcon type={skill} />
                </div>
                <span className="fd-service-label">{skill}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── 리뷰 ── */}
        <section className="fd-section">
          <h2 className="fd-section-title">리뷰</h2>
          {freelancer.reviews.length === 0 ? (
            <p className="fd-empty">아직 리뷰가 없습니다.</p>
          ) : (
            <ul className="fd-review-grid">
              {freelancer.reviews.map((r, i) => (
                <li key={i} className="fd-review-card">
                  <div className="fd-review-top">
                    <span className="fd-review-author">{r.author}</span>
                    <span className="fd-review-stars">
                      {Array.from({ length: 5 }, (_, j) => (
                        <span key={j} className={j < r.rating ? 'star-filled' : 'star-empty'}>★</span>
                      ))}
                    </span>
                  </div>
                  <p className="fd-review-content">{r.content}</p>
                  <span className="fd-review-date">{r.date}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {/* 제안 모달 */}
      {proposing && (
        <div className="fd-modal-overlay" onClick={() => setProposing(false)}>
          <div className="fd-modal" onClick={e => e.stopPropagation()}>
            <button className="fd-modal-close" onClick={() => setProposing(false)}>✕</button>
            <h3 className="fd-modal-title">{freelancer.name}님께 제안할 프로젝트</h3>
            <ul className="fd-project-list">
              {MOCK_USER_PROJECTS.map(p => (
                <li
                  key={p.id}
                  className={`fd-project-item${selectedProjectId === p.id ? ' selected' : ''}`}
                  onClick={() => setSelectedProjectId(p.id)}
                >
                  <div className="fd-project-top">
                    <span className="fd-project-type">{p.type}</span>
                    <span className="fd-project-date">{p.date} {p.time}</span>
                  </div>
                  <p className="fd-project-title">{p.title}</p>
                  <p className="fd-project-loc">📍 {p.location}</p>
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
