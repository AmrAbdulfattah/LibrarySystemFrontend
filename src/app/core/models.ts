export interface Result<T> {
  success: boolean;
  message: string;
  data: T;
}
export interface Page<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
export interface Named {
  id: number;
  name: string;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}
export interface Book {
  id: number;
  title: string;
  publicationYear: number;
  imageUrl: string;
  authorId: number;
  authorName: string;
  categoryId: number;
  categoryName: string;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}
export interface BookForm {
  title: string;
  publicationYear: number;
  authorId: number;
  categoryId: number;
}
export interface Filters {
  authorId?: number;
  categoryId?: number;
  publicationYear?: number;
}
export interface Login {
  success: boolean;
  message: string;
  token: string;
  userData: { id: string; userName: string; email: string; role: string };
}
