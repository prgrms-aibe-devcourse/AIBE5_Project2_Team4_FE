import { useEffect, useState, type PointerEvent as ReactPointerEvent } from 'react';
import './freelancer.css';
import AppHeader from '../components/AppHeader';
import { getFreelancers, type PublicFreelancerSummaryResponse } from '../api/freelancers';
import { getProjectTypeCodes, getRegionCodes, type CodeLookupResponse } from '../api/codes';
import { getErrorMessage } from '../lib/errors';
import { labelOf } from '../lib/referenceData';

let rafPending = false;

function handleCardPointerMove(event: ReactPointerEvent<HTMLLIElement>) {
  if (rafPending) {
    return;
  }

  rafPending = true;
  const card = event.currentTarget;
  const clientX = event.clientX;
  const clientY = event.clientY;

  requestAnimationFrame(() => {
    rafPending = false;
    const rect = card.getBoundingClientRect();
    const pointerX = (clientX - rect.left) / rect.width;
    const pointerY = (clientY - rect.top) / rect.height;
    const rotateY = (pointerX - 0.5) * 10;
    const rotateX = (0.5 - pointerY) * 9;
    card.style.setProperty('--card-rotate-x', `${rotateX.toFixed(2)}deg`);
    card.style.setProperty('--card-rotate-y', `${rotateY.toFixed(2)}deg`);
    card.style.setProperty('--card-pointer-x', `${(pointerX * 100).toFixed(2)}%`);
    card.style.setProperty('--card-pointer-y', `${(pointerY * 100).toFixed(2)}%`);
    card.style.setProperty('--card-glare-opacity', '1');
  });
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [freelancers, setFreelancers] = useState<PublicFreelancerSummaryResponse[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [projectTypeOptions, setProjectTypeOptions] = useState<Array<{ code: string; name: string }>>([]);
  const [regionFilterOptions, setRegionFilterOptions] = useState<CodeLookupResponse[]>([]);
  const [projectTypeMap, setProjectTypeMap] = useState<Map<string, string>>(new Map());
  const [regionMap, setRegionMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const loadCodes = async () => {
      try {
        const [projectTypes, regions] = await Promise.all([
          getProjectTypeCodes(),
          getRegionCodes(),
        ]);

        setProjectTypeOptions(projectTypes.map(({ code, name }) => ({ code, name })));
        setProjectTypeMap(new Map(projectTypes.map((item) => [item.code, item.name])));
        setRegionMap(new Map(regions.map((item) => [item.code, item.name])));

        const sidoOptions = regions.filter((r) => r.regionLevel === 1);
        setRegionFilterOptions(sidoOptions);
      } catch (caughtError) {
        setError(getErrorMessage(caughtError, '프리랜서 기준 코드를 불러오지 못했습니다.'));
      }
    };

    void loadCodes();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const loadFreelancers = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await getFreelancers({
          keyword: debouncedSearch || undefined,
          projectType: skillFilter || undefined,
          region: regionFilter || undefined,
          page,
          size: 24,
        });
        setFreelancers(response.content);
        setTotalPages(response.totalPages);
        setHasNext(response.hasNext);
      } catch (caughtError) {
        setError(getErrorMessage(caughtError, '프리랜서 목록을 불러오지 못했습니다.'));
      } finally {
        setLoading(false);
      }
    };

    void loadFreelancers();
  }, [page, debouncedSearch, skillFilter, regionFilter]);

  return (
    <div className="freelancer-page">
      <AppHeader activePage="freelancers" />

      <main className="freelancer-content">
        <div className="fl-page-header">
          <div>
            <h1 className="fl-page-title">메이트 목록</h1>
            <p className="fl-page-subtitle">실제 등록된 프리랜서 프로필과 활동 지역을 확인하세요.</p>
          </div>
        </div>

        <div className="fl-search-bar">
          <input
            type="text"
            className="fl-search-input"
            placeholder="이름, 소개, 활동 지역으로 검색"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="fl-filter-bar">
          <div className="fl-skill-filters">
            <button
              type="button"
              className={`fl-filter-chip${skillFilter === '' ? ' active' : ''}`}
              onClick={() => { setSkillFilter(''); setPage(0); }}
            >
              전체
            </button>
            {projectTypeOptions.map((option) => (
              <button
                key={option.code}
                type="button"
                className={`fl-filter-chip${skillFilter === option.code ? ' active' : ''}`}
                onClick={() => { setSkillFilter(option.code); setPage(0); }}
              >
                {option.name}
              </button>
            ))}
          </div>

        </div>

        {regionFilterOptions.length > 0 && (
          <div className="fl-filter-bar fl-filter-bar--region">
            <div className="fl-skill-filters">
              <button
                type="button"
                className={`fl-filter-chip${regionFilter === '' ? ' active' : ''}`}
                onClick={() => { setRegionFilter(''); setPage(0); }}
              >
                전국
              </button>
              {regionFilterOptions.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  className={`fl-filter-chip${regionFilter === option.code ? ' active' : ''}`}
                  onClick={() => { setRegionFilter(option.code); setPage(0); }}
                >
                  {option.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="fl-filter-bar fl-filter-bar--view">
          <div className="fl-view-toggle">
            <button
              type="button"
              className={`fl-view-btn${viewMode === 'list' ? ' active' : ''}`}
              onClick={() => setViewMode('list')}
              title="리스트 보기"
              aria-label="리스트 보기"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="8" y1="6" x2="21" y2="6"/>
                <line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <circle cx="3" cy="6" r="1" fill="currentColor" stroke="none"/>
                <circle cx="3" cy="12" r="1" fill="currentColor" stroke="none"/>
                <circle cx="3" cy="18" r="1" fill="currentColor" stroke="none"/>
              </svg>
            </button>
            <button
              type="button"
              className={`fl-view-btn${viewMode === 'grid' ? ' active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="그리드 보기"
              aria-label="그리드 보기"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            </button>
          </div>
        </div>

        {error && <p className="fl-empty">{error}</p>}

        {loading ? (
          <div className="fl-empty">프리랜서 목록을 불러오는 중입니다.</div>
        ) : freelancers.length === 0 ? (
          <div className="fl-empty">조건에 맞는 프리랜서가 없습니다.</div>
        ) : (
          <ul className={viewMode === 'grid' ? 'fl-grid' : 'fl-list'}>
            {freelancers.map((freelancer) => (
              <li
                key={freelancer.freelancerProfileId}
                className={`fl-card${viewMode === 'grid' ? ' fl-card--grid' : ''}`}
                onClick={() => { window.location.href = `/freelancers/${freelancer.freelancerProfileId}`; }}
                onPointerMove={handleCardPointerMove}
                onPointerLeave={handleCardPointerLeave}
              >
                <div className="fl-card-top">
                  <div className="fl-avatar">{freelancer.name[0]}</div>
                  <div className="fl-card-info">
                    <div className="fl-name-row">
                      <span className="fl-name">{freelancer.name}</span>
                      {freelancer.verifiedYn && <span className="fl-verified-badge">인증됨</span>}
                    </div>
                    <div className="fl-skills">
                      {freelancer.projectTypeCodes.map((code) => (
                        <span key={code} className="fl-skill-tag">{labelOf(projectTypeMap, code)}</span>
                      ))}
                    </div>
                  </div>
                  <div className="fl-rating">
                    <span className="fl-star">★</span>
                    <span className="fl-rating-num">{(freelancer.averageRating ?? 0).toFixed(1)}</span>
                  </div>
                </div>
                <p className="fl-bio">{freelancer.intro || '등록된 소개가 없습니다.'}</p>
                <div className="fl-stats">
                  <span>지역 {freelancer.activityRegionCodes.map((code) => labelOf(regionMap, code)).join(', ') || '-'}</span>
                  <span>활동 {freelancer.activityCount ?? 0}건</span>
                  <span>{freelancer.caregiverYn ? '요양보호사 보유' : '일반 프로필'}</span>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="fl-pagination">
          <button type="button" className="fl-page-btn fl-page-btn--arrow" onClick={() => setPage((p) => p - 1)} disabled={page === 0}>
            ←
          </button>
          {(() => {
            const total = Math.max(totalPages, 1);
            const pages: (number | '...')[] = [];
            if (total <= 7) {
              for (let i = 0; i < total; i++) pages.push(i);
            } else {
              pages.push(0);
              if (page > 2) pages.push('...');
              for (let i = Math.max(1, page - 1); i <= Math.min(total - 2, page + 1); i++) pages.push(i);
              if (page < total - 3) pages.push('...');
              pages.push(total - 1);
            }
            return pages.map((p, idx) =>
              p === '...'
                ? <span key={`ellipsis-${idx}`} className="fl-page-ellipsis">…</span>
                : <button
                    key={p}
                    type="button"
                    className={`fl-page-btn${page === p ? ' active' : ''}`}
                    onClick={() => setPage(p)}
                  >{p + 1}</button>
            );
          })()}
          <button type="button" className="fl-page-btn fl-page-btn--arrow" onClick={() => setPage((p) => p + 1)} disabled={!hasNext}>
            →
          </button>
        </div>
      </main>
    </div>
  );
}
