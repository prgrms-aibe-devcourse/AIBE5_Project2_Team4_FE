export interface FreelancerReview {
  author: string;
  rating: number;
  content: string;
  date: string;
}

export interface Freelancer {
  id: number;
  name: string;
  photo?: string;
  skills: string[];
  bio: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  projectCount: number;
  availableHours: string;
  availableRegions: string[];
  portfolio?: string;
  reviews: FreelancerReview[];
}

// TODO: replace with GET /api/freelancers
export const FREELANCERS: Freelancer[] = [
  {
    id: 1, name: '김지선', photo: '/freelancers/1.jpg', skills: ['병원 동행', '외출 보조', '생활동행', '관공서 업무'], verified: true,
    bio: '안녕하세요, 안심동행 매니저 김지선입니다. \n 낯선 길, 복잡한 병원, 혼자 이동하기 불안한 상황에서 옆에 누가 한 사람만 있었으면 좋겠다는 마음을 잘 알고 있습니다. \n 저는 단순히 목적지까지 모시는 사람이 아니라, 이동 전부터 귀가까지 전 과정을 함께 고민하고 동행하는 파트너가 되고자 합니다.',
    rating: 4.9, reviewCount: 38, projectCount: 42,
    availableHours: '평일 09:00 - 18:00',
    availableRegions: ['서울 강남구', '서울 서초구', '서울 송파구'],
    portfolio: 'portfolio_jisun.pdf',
    reviews: [
      { author: '김○○', rating: 5, content: '정말 친절하고 꼼꼼하게 챙겨주셨어요. 다음에도 꼭 부탁드리고 싶습니다.', date: '2025.04.10' },
      { author: '이○○', rating: 5, content: '시간 약속도 잘 지키고 병원에서도 잘 도와주셨습니다.', date: '2025.03.28' },
      { author: '박○○', rating: 5, content: '어머니께서 굉장히 편안해하셨어요. 앞으로도 부탁드릴게요.', date: '2025.03.10' },
    ],
  },
  {
    id: 2, name: '이영희', skills: ['생활동행', '관공서 업무'], verified: true,
    bio: '친절하고 꼼꼼하게 일상 동행 서비스를 제공합니다. 고객 만족을 최우선으로 생각합니다.',
    rating: 4.7, reviewCount: 21, projectCount: 25,
    availableHours: '주중 10:00 - 17:00',
    availableRegions: ['서울 마포구', '서울 은평구', '서울 서대문구'],
    reviews: [
      { author: '박○○', rating: 5, content: '마트 동행이었는데 짐도 잘 들어주시고 매우 만족합니다.', date: '2025.04.05' },
      { author: '최○○', rating: 4, content: '꼼꼼하게 챙겨주셔서 좋았습니다.', date: '2025.03.15' },
    ],
  },
  {
    id: 3, name: '김철수', skills: ['외출 보조', '병원 동행'], verified: true,
    bio: '요양보호사 자격증 보유. 빠르고 정확한 서비스를 약속드립니다.',
    rating: 4.8, reviewCount: 54, projectCount: 60,
    availableHours: '주 7일 08:00 - 20:00',
    availableRegions: ['서울 전 지역', '경기 성남시'],
    portfolio: 'portfolio_chulsoo.pdf',
    reviews: [
      { author: '정○○', rating: 5, content: '경험이 많으셔서 매우 안심이 됩니다.', date: '2025.04.12' },
      { author: '한○○', rating: 5, content: '어머니가 굉장히 편안해하셨어요. 감사합니다.', date: '2025.04.01' },
    ],
  },
  {
    id: 6, name: '한지수', skills: ['병원 동행', '생활동행', '외출 보조'], verified: true,
    bio: '어르신 전담 케어 전문가입니다. 따뜻한 마음으로 함께하겠습니다.',
    rating: 5.0, reviewCount: 27, projectCount: 30,
    availableHours: '평일 09:00 - 19:00',
    availableRegions: ['서울 용산구', '서울 중구', '서울 종로구'],
    portfolio: 'portfolio_jisu.pdf',
    reviews: [
      { author: '윤○○', rating: 5, content: '정말 따뜻하고 전문적입니다. 강력 추천합니다.', date: '2025.04.14' },
      { author: '오○○', rating: 5, content: '세심하게 챙겨주셔서 너무 감사했습니다.', date: '2025.04.02' },
    ],
  },
];

export function getFreelancerById(id: number): Freelancer | null {
  return FREELANCERS.find(f => f.id === id) ?? null;
}
