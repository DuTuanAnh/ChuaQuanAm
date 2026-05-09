import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
    title: 'Chùa Quan Âm — Trang chủ',
  },
  {
    path: 'hoat-dong',
    loadComponent: () =>
      import('./features/hoat-dong/hoat-dong.component').then((m) => m.HoatDongComponent),
    title: 'Hoạt động — Chùa Quan Âm',
  },
  {
    path: 'hoat-dong/:slug',
    loadComponent: () =>
      import('./features/hoat-dong/hoat-dong-detail.component').then(
        (m) => m.HoatDongDetailComponent,
      ),
    title: 'Hoạt động — Chùa Quan Âm',
  },
  {
    path: 'phap-thoai',
    loadComponent: () =>
      import('./features/phap-thoai/phap-thoai.component').then((m) => m.PhapThoaiComponent),
    title: 'Pháp thoại — Chùa Quan Âm',
  },
  {
    path: 'phap-thoai/:slug',
    loadComponent: () =>
      import('./features/phap-thoai/phap-thoai-detail.component').then(
        (m) => m.PhapThoaiDetailComponent,
      ),
    title: 'Pháp thoại — Chùa Quan Âm',
  },
  {
    path: 'thu-vien-anh',
    loadComponent: () =>
      import('./features/thu-vien-anh/thu-vien-anh.component').then(
        (m) => m.ThuVienAnhComponent,
      ),
    title: 'Thư viện ảnh — Chùa Quan Âm',
  },
  {
    path: 'gioi-thieu',
    loadComponent: () =>
      import('./features/gioi-thieu/gioi-thieu.component').then((m) => m.GioiThieuComponent),
    title: 'Giới thiệu — Chùa Quan Âm',
  },
  {
    path: 'lien-he',
    loadComponent: () =>
      import('./features/lien-he/lien-he.component').then((m) => m.LienHeComponent),
    title: 'Liên hệ — Chùa Quan Âm',
  },
  { path: '**', redirectTo: '' },
];
