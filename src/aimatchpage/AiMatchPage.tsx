import './aimatch.css';
import AppHeader from '../components/AppHeader';

const GUIDE_ITEMS = [
  {
    title: '실제 프리랜서 목록',
    description: 'Oracle DB에 등록된 프리랜서 프로필, 검증 상태, 활동 지역을 기준으로 목록을 조회합니다.',
    href: '/freelancers',
    actionLabel: '프리랜서 목록 보기',
  },
  {
    title: '프로젝트 기반 제안',
    description: '프리랜서 상세 화면에서 실제 내 프로젝트를 선택해 API로 제안을 전송합니다.',
    href: '/project',
    actionLabel: '내 프로젝트 보기',
  },
  {
    title: '후속 추천 기능',
    description: '추천 알고리즘은 별도 범위로 분리하고, 이번 통합에서는 mock 추천 데이터를 제거했습니다.',
  },
];

export default function AiMatchPage() {
  return (
    <div className="am-page">
      <AppHeader activePage="freelancers" />
      <main className="am-content">
        <div className="am-page-title">
          <h1>AI 매칭</h1>
          <p>mock 추천 데이터는 제거하고, 실제 API와 DB 기반 프리랜서 탐색 흐름으로 연결했습니다.</p>
        </div>

        <section className="am-section">
          <div className="am-section-label">현재 제공되는 실제 연동 흐름</div>
          <div className="am-result-list">
            {GUIDE_ITEMS.map((item, index) => (
              <article key={item.title} className="am-result-card">
                <div className="am-card-info">
                  <div className="am-card-name-row">
                    <span className="am-rank-badge">{index + 1}</span>
                    <span className="am-card-name">{item.title}</span>
                  </div>
                  <p className="am-result-subtitle">{item.description}</p>
                </div>
                {item.href && item.actionLabel && (
                  <div className="am-card-actions" style={{ marginTop: '1rem' }}>
                    <a className="am-btn-profile" href={item.href}>{item.actionLabel}</a>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        <div className="am-result-card">
          <div className="am-card-info">
            <div className="am-card-name-row">
              <span className="am-rank-badge">LIVE API</span>
              <span className="am-card-name">실제 프리랜서 데이터로 이동</span>
            </div>
            <p className="am-result-subtitle">
              추천용 mock store와 localStorage 상태는 사용하지 않습니다. 프리랜서 목록, 상세, 프로젝트 제안 화면에서
              백엔드 API 응답을 직접 렌더링합니다.
            </p>
          </div>
          <div className="am-card-actions" style={{ marginTop: '1rem' }}>
            <a className="am-btn-profile" href="/freelancers">프리랜서 목록 보기</a>
            <a className="am-btn-profile" href="/project">내 프로젝트 보기</a>
          </div>
        </div>
      </main>
    </div>
  );
}
