/* eslint-disable @typescript-eslint/no-unused-vars */

export type ProjectType = 'HOSPITAL' | 'GOVERNMENT' | 'OUTING' | 'DAILY' | 'OTHER';
export type ProjectStatus = 'REQUESTED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Project {
  id: number;
  title: string;
  type: ProjectType;
  date: string;
  time: string;
  location: string;
  description: string;
  status: ProjectStatus;
  createdAt: string;
  requesterName: string;
  requesterEmail: string;
  freelancerId?: number;
  freelancerName?: string;
  freelancerEmail?: string;
}

export interface CreateProjectInput {
  title: string;
  type: ProjectType;
  date: string;
  time: string;
  location: string;
  description: string;
  requesterName: string;
  requesterEmail: string;
}

export type EditableProjectFields = Pick<Project, 'title' | 'type' | 'date' | 'time' | 'location' | 'description'>;

// Legacy compatibility shim. Live project data now comes from src/api/projects.ts.
export function getProjects(): Project[] {
  return [];
}

export function createProject(_input: CreateProjectInput): Project {
  throw new Error('appProjectStore mock is removed. Use src/api/projects.ts.');
}

export function updateProjectStatus(_projectId: number, _status: ProjectStatus): Project | null {
  return null;
}

export function assignProjectFreelancer(
  _projectId: number,
  _freelancer: { freelancerId: number; freelancerName: string; freelancerEmail?: string },
): Project | null {
  return null;
}

export function cancelProject(_projectId: number): void {}

export function getProjectById(_projectId: number): Project | null {
  return null;
}

export function updateProject(_projectId: number, _fields: EditableProjectFields): Project | null {
  return null;
}
