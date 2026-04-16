import { useState, type PointerEvent as ReactPointerEvent } from 'react';
import './freelancer.css';
import AppHeader from '../components/AppHeader';
import { FREELANCERS } from '../store/appFreelancerStore';
import { getFreelancerReviewSummary } from '../store/appReviewStore';

const ALL_SKILLS = ['전체', '병원 동행', '외출 보조', '생활동행', '관공서 업무'];

function handleCardPointerMove(event: ReactPointerEvent<HTMLLIElement>) {
  const card = event.currentTarget;
  const rect = card.getBoundingClientRect();
  const pointerX = (event.clientX - rect.left) / rect.width;
  const pointerY = (event.clientY - rect.top) / rect.height;
  const rotateY = (pointerX - 0.5) * 18;
  const rotateX = (0.5 - pointerY) * 16;

  card.style.setProperty('--card-rotate-x', `${rotateX.toFixed(2)}deg`);
  card.style.setProperty('--card-rotate-y', `${rotateY.toFixed(2)}deg`);
  card.style.setProperty('--card-pointer-x', `${(pointerX * 100).toFixed(2)}%`);
  card.style.setProperty('--card-pointer-y', `${(pointerY * 100).toFixed(2)}%`);
  card.style.setProperty('--card-glare-opacity', '1');
}

function handleCardPointerLeave(event: ReactPointerEvent<HTMLLIElement>) {
  const card = event.currentTarget;
  card.style.setProperty('--card-rotate-x', '0deg');
  card.style.setProperty('--card-rotate-y', '0deg');
  card.style.setProperty('--card-pointer-x', '50%');
  card.style.setProperty('--card-pointer-y', '50%');
  card.style.setProperty('--card-glare-opacity', '0');
}

export default function FreelancerPage() {
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('전체');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // FR-MATCH-01: 검색 + 스킬 필터 (verified만)
  const filtered = FREELANCERS.filter(f => {
    const skillMatch  = skillFilter === '전체' || f.skills.includes(skillFilter);
    const searchMatch = !search.trim() ||
      f.name.includes(search.trim()) ||
      f.skills.some(s => s.includes(search.trim())) ||
      f.availableRegions.some(r => r.includes(search.trim()));
    return skillMatch && searchMatch;
  });

  return (
    <div className="freelancer-page">
      <AppHeader activePage="freelancers" />

      <main className="freelancer-content">
        <div className="fl-page-header">
          <div>
            <h1 className="fl-page-title">도우미 목록</h1>
            <p className="fl-page-subtitle">검증된 도우미를 찾아보세요.</p>
          </div>
        </div>

        {/* FR-MATCH-01: 검색 */}
        <div className="fl-search-bar">
          <input
            type="text"
            className="fl-search-input"
            placeholder="이름, 서비스, 지역으로 검색..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="fl-filter-bar">
          <div className="fl-skill-filters">
            {ALL_SKILLS.map(s => (
              <button
                key={s}
                className={`fl-filter-chip${skillFilter === s ? ' active' : ''}`}
                onClick={() => setSkillFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="fl-view-toggle">
            <button
              className={`fl-view-btn${viewMode === 'list' ? ' active' : ''}`}
              onClick={() => setViewMode('list')}
              title="리스트 보기"
            >
              ☰
            </button>
            <button
              className={`fl-view-btn${viewMode === 'grid' ? ' active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="타일 보기"
            >
              ⊞
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="fl-empty">검색 결과가 없습니다.</div>
        ) : (
          <ul className={viewMode === 'grid' ? 'fl-grid' : 'fl-list'}>
            {filtered.map(f => (
              <li
                key={f.id}
                className={`fl-card${viewMode === 'grid' ? ' fl-card--grid' : ''}`}
                onClick={() => window.location.href = `/freelancers/${f.id}`}
                onPointerMove={handleCardPointerMove}
                onPointerLeave={handleCardPointerLeave}
              >
                <div className="fl-card-top">
                  <div className="fl-avatar">
                    {f.photo
                      ? <img src={f.photo} alt={f.name} className="fl-avatar-img" />
                      : f.name[0]
                    }
                  </div>
                  <div className="fl-card-info">
                    <div className="fl-name-row">
                      <span className="fl-name">{f.name}</span>
                      <span className="fl-verified-badge">✦ 인증됨</span>
                    </div>
                    <div className="fl-skills">
                      {f.skills.map(s => <span key={s} className="fl-skill-tag">{s}</span>)}
                    </div>
                  </div>
                  <div className="fl-rating">
                    <span className="fl-star">★</span>
                    <span className="fl-rating-num">{
                      (() => {
                        const { averageRating, reviewCount } = getFreelancerReviewSummary(f.id);
                        return (reviewCount === 0 ? f.rating : averageRating).toFixed(1);
                      })()
                    }</span>
                  </div>
                </div>
                <p className="fl-bio">{f.bio}</p>
                <div className="fl-stats">
                  <span>📍 {f.availableRegions[0]}{f.availableRegions.length > 1 ? ` 외 ${f.availableRegions.length - 1}곳` : ''}</span>
                  <span>프로젝트 {f.projectCount}건</span>
                  <span>리뷰 {f.reviewCount}개</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
