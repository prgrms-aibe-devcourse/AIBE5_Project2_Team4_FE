export interface FreelancerReview {
  author: string;
  rating: number;
  content: string;
  date: string;
}

export interface Freelancer {
  id: number;
  name: string;
  accountEmail?: string;
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

export const FREELANCERS: Freelancer[] = [
  {
    id: 1,
    name: '김지수',
    accountEmail: 'free@stella.ai',
    photo: '/freelancers/1.jpg',
    skills: ['병원 동행', '외출 보조', '생활 지원', '관공서 업무'],
    bio: '정기 병원 방문과 행정 업무 동행을 전문으로 돕고 있습니다. 처음 의뢰하시는 분도 편안하게 맡길 수 있도록 세심하게 소통합니다.',
    verified: true,
    rating: 4.9,
    reviewCount: 38,
    projectCount: 42,
    availableHours: '평일 09:00 - 18:00',
    availableRegions: ['서울 강남구', '서울 서초구', '서울 송파구'],
    portfolio: 'portfolio_jisu.pdf',
    reviews: [
      { author: '박OO', rating: 5, content: '예약부터 동행까지 정말 꼼꼼하게 챙겨주셨어요.', date: '2025.04.10' },
      { author: '최OO', rating: 5, content: '병원 이동이 불안했는데 덕분에 한결 수월했습니다.', date: '2025.03.28' },
      { author: '김OO', rating: 5, content: '응대가 빠르고 친절해서 다음에도 다시 요청하고 싶어요.', date: '2025.03.10' },
    ],
  },
  {
    id: 2,
    name: '이영희',
    accountEmail: 'free@stella.ai',
    skills: ['생활 지원', '관공서 업무'],
    bio: '일상 생활 지원과 서류 업무를 차분하게 도와드립니다. 작은 요청도 부담 없이 상의하실 수 있어요.',
    verified: true,
    rating: 4.7,
    reviewCount: 21,
    projectCount: 25,
    availableHours: '주중 10:00 - 17:00',
    availableRegions: ['서울 마포구', '서울 은평구', '서울 서대문구'],
    reviews: [
      { author: '정OO', rating: 5, content: '마트 동행과 서류 발급을 한 번에 도와주셔서 편했습니다.', date: '2025.04.05' },
      { author: '윤OO', rating: 4, content: '설명이 친절하고 일정 조율도 빨랐어요.', date: '2025.03.15' },
    ],
  },
  {
    id: 3,
    name: '김철수',
    accountEmail: 'free@stella.ai',
    skills: ['외출 보조', '병원 동행'],
    bio: '요양보호사 경력을 바탕으로 안전하고 안정적인 이동 지원을 제공합니다.',
    verified: true,
    rating: 4.8,
    reviewCount: 54,
    projectCount: 60,
    availableHours: '주 7일 08:00 - 20:00',
    availableRegions: ['서울 전지역', '경기 성남시'],
    portfolio: 'portfolio_chulsoo.pdf',
    reviews: [
      { author: '최OO', rating: 5, content: '경험이 많으셔서 믿고 맡길 수 있었습니다.', date: '2025.04.12' },
      { author: '이OO', rating: 5, content: '부모님이 무척 안심하셨다고 하셨어요.', date: '2025.04.01' },
    ],
  },
  {
    id: 4,
    name: '최지수',
    accountEmail: 'free@stella.ai',
    skills: ['병원 동행', '생활 지원', '외출 보조'],
    bio: '상황에 맞는 동행 계획을 빠르게 세우고, 의뢰인이 안심할 수 있도록 세밀하게 대응합니다.',
    verified: true,
    rating: 5.0,
    reviewCount: 27,
    projectCount: 30,
    availableHours: '평일 09:00 - 19:00',
    availableRegions: ['서울 용산구', '서울 중구', '서울 종로구'],
    portfolio: 'portfolio_jisu_2.pdf',
    reviews: [
      { author: '송OO', rating: 5, content: '전문적이면서도 따뜻하게 응대해주셔서 만족했어요.', date: '2025.04.14' },
      { author: '한OO', rating: 5, content: '필요한 부분을 먼저 챙겨주셔서 정말 감사했습니다.', date: '2025.04.02' },
    ],
  },
];

export function getFreelancerById(id: number): Freelancer | null {
  return FREELANCERS.find((freelancer) => freelancer.id === id) ?? null;
}
